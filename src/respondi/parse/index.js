import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"
import getPhone from "../util/getPhone.js"
import mapeadorSemantico from "./mapeadorSemantico/index.js"

/**
 * @typedef { import("../../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res, areadyResponse) => {
    console.log(JSON.stringify(req.body))
    if (!areadyResponse)
        res.json({ msg: "ok" })
    const { respondent, form } = req.body
    const [formulario, fErr] = await app.repository.findOne("Formularios", { form_id: form.form_id })
    if (fErr) return // TODO: aqui vai ter que armazenar a resposta no banco de dados
    if (!formulario.answerFieldsMap) {
        const answerFieldsMap = await mapeadorSemantico(app, req.body)
        if (!answerFieldsMap) return console.log("erro no answerFieldsMap", req.body)
        formulario.answerFieldsMap = answerFieldsMap
        app.repository.update("Formularios", formulario._id, { answerFieldsMap })
    }
    const contact = await createContato(app, respondent.raw_answers, formulario.answerFieldsMap)
    if (!contact) return console.log(JSON.stringify(req.body))
    const name = getName(respondent.raw_answers).answer
console.log(respondent.respondent_utms)
    await createLead(app, formulario.funil, formulario.etapa, contact.id, name, respondent.respondent_utms);
}