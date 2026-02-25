import createContact from "../../../kommo/util/createContact.js";
import createLead from "../../../kommo/util/createLead.js";
import answersToCustomFields from "../../util/answersToCustomFields.js";

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xzn55i94d4f": 1880351,
    "xd115sg65bpr": 1878287,
    "xjnirz2pqgy": 1878289,
    "xuvuahv3jyor": 1878293,
    "xt2h6820w2x": 1878295,
    "xotep0x273uc": 1878297,
    "x3c9u8ihorn4": 1878299,
    "xwmol4zkwuc": 1878291,
};

export default async (app, req, res) => {
    console.log("chegou Avec captacao")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body
        const formAnswers = answersToCustomFields(respondent, answerFieldsMap)

        const contact = await createContact(app, formAnswers.name, formAnswers.custom_fields_values)
        if (!contact) {
            console.error("FALHA CAPTACAO - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "captacao-erro")
            return
        }

        const lead = await createLead(app, 11459696, 87990944, contact.id, formAnswers.name)
        if (!lead) {
            console.error("FALHA CAPTACAO - lead não criado")
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "captacao-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: formAnswers.name }, "captacao")
    } catch (error) {
        console.error("ERRO CRÍTICO CAPTACAO:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "captacao-erro")
    }
}
