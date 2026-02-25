import createLead from "../../kommo/util/createLead.js";
import createContact from "../../kommo/util/createContact.js";
import answersToCustomFields from "../util/answersToCustomFields.js";

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xnzy9grkm1d": 1878291,
    "xnv2toco841k": 1880729,
    "xifdp8ft1csb": 1880731,
    "xdk74j40rhxu": 1880733,
    "x4zs1uodqhmm": 1880735,
};

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app
 * @param {Request} req
 * @param {Response} res
 */
export default async (app, req, res) => {
    console.log("chegou Selene")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body
        const formAnswers = answersToCustomFields(respondent, answerFieldsMap)

        const contact = await createContact(app, formAnswers.name, formAnswers.custom_fields_values)
        if (!contact) {
            console.error("FALHA SELENE - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "selene-erro")
            return
        }

        const lead = await createLead(app, 11444036, 88956368, contact.id, formAnswers.name)
        if (!lead) {
            console.error("FALHA SELENE - lead não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "selene-erro")
            return
        }

        // Registra sucesso
        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: formAnswers.name }, "selene")

        // Calendly
        const calendly = respondent.raw_answers.find(a => a.question.question_type === "embed.calendly")
        if (!calendly) return

        const closerquerymap = {
            "xsmqpmypm9u": { closer: 1301457 },
            "xqftydcalgm": { closer: 1301287 },
            "xdtuxphhhnn8": { $or: [{ closer: 1301283 }, { closer: 1301285 }] }
        }
        if (!closerquerymap[calendly.question.question_id]) return console.log(calendly.question.question_id)

        const [agendas] = await app.repository.findMany("Agendas", closerquerymap[calendly.question.question_id])

        let event
        let sagenda
        for (const agenda of agendas) {
            let access_token = agenda.calendly.access_token
            if (new Date((agenda.calendly.created_at * 1000) + (agenda.calendly.expires_in * 1000)).getTime() < new Date().getTime())
                access_token = await app.calendly.refreshToken(app.repository, agenda)
            const result = await app.calendly.getEvent(calendly.answer.event, access_token)
            if (!result) continue
            event = result.resource
            sagenda = agenda
        }

        if (!event || !sagenda) return

        await app.kommo.ContactUpdate(contact.id, {
            custom_fields_values: [
                {
                    field_id: 1878319,
                    values: [{ value: event.location.join_url }]
                }
            ]
        })
        await app.kommo.LeadUpdate(lead.id, {
            custom_fields_values: [
                {
                    "field_id": 1878999,
                    "values": [{ "value": (new Date(event.start_time).getTime() / 1000) }]
                },
                {
                    "field_id": 1880511,
                    "values": [{ "enum_id": sagenda.closer }]
                }
            ]
        });
        await app.kommo.moveLeadToStatus(lead.id, 88956372)
    } catch (error) {
        console.error("ERRO CRÍTICO SELENE:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "selene-erro")
    }
}
