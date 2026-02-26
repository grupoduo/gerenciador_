import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        const answerFieldsMap = {
            "x0fnghh8lgr0i": 1880351,
            "xmnn2h93crsp": 1878287,
            "x919asy54zas": 1876816,
            "x3o71ld36ziq": 1876814,
            "xxl4tn2zko2": 1878315,
            "x4cjjaoqljbe": 1878289,
            "xe1z1b1h5j06": 1878291,
            "xklblw7ubrfh": 1881259,
            "xnc3ikl9dgkd": 1878297,
            "xoy60zucvfl": 1881895,
            "x99pegcslqhv": 1881897
        }
        const { respondent } = req.body
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA BELEZACONTABIL - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "belezacontabil-erro")
            return
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, 9762760, 91813972, contact.id, name, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA BELEZACONTABIL - lead não criado")
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "belezacontabil-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name }, "belezacontabil")
    } catch (error) {
        console.error("ERRO CRÍTICO BELEZACONTABIL:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "belezacontabil-erro")
    }
}
