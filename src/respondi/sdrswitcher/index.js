import parse from "../parse/index.js"
import getName from "../util/getName.js"
import getPhone from "../util/getPhone.js"

/**
 * @typedef { import("../../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "ok" })
    parse(app, req, res, true)
    const { respondent, form } = req.body
    /* {
                "question": {
                    "question_title": "Quanto você fatura no seu negócio mensalmente?",
                    "question_id": "x7mi9kdexn02",
                    "question_type": "radio"
                },
                "answer": [
                    "13 mil a 24 mil"
                ]
            }, */
    const faturamento = respondent.raw_answers.find(r => r.question.question_id === "xwmol4zkwuc")
    if(!faturamento) return
    // TODO: aqui vai pegar os classficadores no banco e mondar um objeto com as classificacoes apontando para o classificador
    // depois vai pegar a answer e definir qual sera o classificador para o lead
    const [classificadores, err] = await app.repository.findMany("CLassificadoresLead", {})
    if(err) return console.log(classificadores)

    const classificacoes = {}
    for (const c of classificadores) {
        for (const classificacao of c.classificacoes) {
            classificacoes[classificacao] = c
        }
    }
    if(!faturamento.answer[0] || !classificacoes[faturamento.answer[0]])
        return console.log(faturamento.answer[0])
    
    const [sdrs, serr] = await app.repository.findMany("SDRs", {})
    if(!app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id]) return console.log(classificacoes[faturamento.answer[0]].id)
    const index = sdrs.findIndex(s => s.id === app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id].sdr.id)
    
    if(index < -1) return;

    const next = index + 1 === sdrs.length ? 0 : index + 1

    app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id].sdr = sdrs[next]
    
    app.repository.updateQuery("SDRClassificador", {classificador: classificacoes[faturamento.answer[0]].id}, {sdr: sdrs[next].id})

    //TODO: aqui vou ter que gravar o lead e o numero
    app.repository.create("LeadsSwitcher", {
        name: getName(respondent.raw_answers).answer,
        phone: getPhone(respondent.raw_answers).answer.phone,
        sdr: sdrs[next].id
    })
}