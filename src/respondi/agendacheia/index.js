import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xwmol4zkwuc": 1878291,
    "xnv2toco841k": 1880729,
    "xifdp8ft1csb": 1880731,
    "xdk74j40rhxu": 1880733,
    "x4zs1uodqhmm": 1880735,
}

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app
 * @param {Request} req
 * @param {Response} res
 */
export default async (app, req, res) => {
    console.log("chegou na agenda cheia")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body

        // Usa createContato compartilhado (COM deduplicação por telefone)
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA AGENDACHEIA - contato não criado:", JSON.stringify(req.body))
            // Registra falha para auditoria
            app.register.make({ body: req.body, error: "contato não criado" }, "agendacheia-erro")
            return
        }

        const name = getName(respondent.raw_answers)
        const leadName = name ? name.answer : "Sem nome"
        const lead = await createLead(app, 11380836, 87977544, contact.id, leadName, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA AGENDACHEIA - lead não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "agendacheia-erro")
            return
        }

        // Registra sucesso
        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: leadName }, "agendacheia")
        console.log("AGENDACHEIA OK - Lead:", lead.id, "Contato:", contact.id)
    } catch (error) {
        console.error("ERRO CRÍTICO AGENDACHEIA:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "agendacheia-erro")
    }
}
