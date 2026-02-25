import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        const answerFieldsMap = {
            "xopyalskloic": 1880733,
            "x9qne4si4vzp": 1876814,
            "xg6ayiq29rwf": 1878315,
            "xaee1fea5oif": 1880351,
            "xv4ry2krdaig": 1878287,
            "xro1j3vask7": 1878289,
            "xwtd8oxjlc3": 1878293,
            "xwd59myqh6z": 1878295,
            "x3jyow8tz67v": 1878297,
            "x7vn8ltz0t3g": 1880731,
            "x7mi9kdexn02": 1880729,
            "xplxkckua8n": 1881259
        }
        const { respondent } = req.body
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA MVL - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "mvl-erro")
            return
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, 11871392, 91446680, contact.id, name, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA MVL - lead não criado")
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "mvl-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name }, "mvl")
    } catch (error) {
        console.error("ERRO CRÍTICO MVL:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "mvl-erro")
    }
}
