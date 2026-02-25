import parse from "../parse/index.js"
import getName from "../util/getName.js"
import getPhone from "../util/getPhone.js"

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        await parse(app, req, res, true)

        const { respondent } = req.body
        const faturamento = respondent.raw_answers.find(r => r.question.question_id === "xwmol4zkwuc")
        if (!faturamento) return

        const [classificadores, err] = await app.repository.findMany("CLassificadoresLead", {})
        if (err) return console.error("ERRO SDRSWITCHER - classificadores:", classificadores)

        const classificacoes = {}
        for (const c of classificadores) {
            for (const classificacao of c.classificacoes) {
                classificacoes[classificacao] = c
            }
        }

        if (!faturamento.answer[0] || !classificacoes[faturamento.answer[0]])
            return console.log("SDRSWITCHER - classificação não encontrada:", faturamento.answer[0])

        const [sdrs, serr] = await app.repository.findMany("SDRs", {})
        if (!app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id])
            return console.log("SDRSWITCHER - sdrDoClassificador não encontrado:", classificacoes[faturamento.answer[0]].id)

        const index = sdrs.findIndex(s => s.id === app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id].sdr.id)

        if (index < -1) return;

        const next = index + 1 === sdrs.length ? 0 : index + 1
        app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id].sdr = sdrs[next]

        app.repository.updateQuery("SDRClassificador",
            { classificador: classificacoes[faturamento.answer[0]].id },
            { sdr: sdrs[next].id })

        const nameObj = getName(respondent.raw_answers)
        const phoneObj = getPhone(respondent.raw_answers)
        app.repository.create("LeadsSwitcher", {
            name: nameObj ? nameObj.answer : "Sem nome",
            phone: phoneObj ? phoneObj.answer.phone : "Sem telefone",
            sdr: sdrs[next].id
        })
    } catch (error) {
        console.error("ERRO CRÍTICO SDRSWITCHER:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "sdrswitcher-erro")
    }
}
