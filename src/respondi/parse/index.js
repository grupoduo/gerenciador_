import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"
import mapeadorSemantico from "./mapeadorSemantico/index.js"

export default async (app, req, res, areadyResponse) => {
    console.log(JSON.stringify(req.body))
    if (!areadyResponse)
        res.json({ msg: "ok" })

    try {
        const { respondent, form } = req.body
        const [formulario, fErr] = await app.repository.findOne("Formularios", { form_id: form.form_id })

        if (fErr) {
            console.error("ERRO PARSE - formulário não encontrado:", form.form_id)
            app.register.make({ body: req.body, error: "formulário não encontrado: " + form.form_id }, "parse-erro")
            return
        }

        if (!formulario.answerFieldsMap) {
            const answerFieldsMap = await mapeadorSemantico(app, req.body)
            if (!answerFieldsMap) {
                console.error("ERRO PARSE - mapeamento semântico falhou:", form.form_id)
                app.register.make({ body: req.body, error: "mapeamento semântico falhou" }, "parse-erro")
                return
            }
            formulario.answerFieldsMap = answerFieldsMap
            app.repository.update("Formularios", formulario._id, { answerFieldsMap })
        }

        const contact = await createContato(app, respondent.raw_answers, formulario.answerFieldsMap)
        if (!contact) {
            console.error("FALHA PARSE - contato não criado:", form.form_id)
            app.register.make({ body: req.body, error: "contato não criado" }, "parse-erro")
            return
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, formulario.funil, formulario.etapa, contact.id, name, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA PARSE - lead não criado:", form.form_id)
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "parse-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name, form_id: form.form_id }, "parse")
        return lead
    } catch (error) {
        console.error("ERRO CRÍTICO PARSE:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "parse-erro")
        return null
    }
}
