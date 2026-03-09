import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

// Campos do LEAD que são tipo select — mapa texto → enum_id
const LEAD_REGIME_TRIBUTARIO_ENUM = {
    "MEI": 1304600,
    "Simples Nacional": 1304602,
    "Outro": 1304604,
}

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        // Mapeamento: question_id do Respondi → field_id do CONTATO no Kommo
        // OBS: regime tributário (1881895) e soluções (1881897) foram deletados do contato
        //       e recriados como campos do LEAD (ver leadFieldsMap abaixo)
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
        }

        // Mapeamento: question_id do Respondi → field_id do LEAD no Kommo
        const leadFieldsMap = {
            "xoy60zucvfl": { field_id: 1884340, type: "select", enums: LEAD_REGIME_TRIBUTARIO_ENUM },
            "x99pegcslqhv": { field_id: 1884344, type: "text" },
        }

        const { respondent } = req.body
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA BELEZACONTABIL - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "belezacontabil-erro")
            return
        }

        // Extrair campos extras para o LEAD a partir das respostas
        const leadFields = []
        for (const answer of respondent.raw_answers) {
            const mapping = leadFieldsMap[answer.question.question_id]
            if (!mapping) continue

            const value = Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer

            if (mapping.type === "select" && mapping.enums) {
                const enum_id = mapping.enums[value]
                if (enum_id) {
                    leadFields.push({ field_id: mapping.field_id, values: [{ enum_id }] })
                } else {
                    console.warn(`[belezacontabil] Enum não encontrado para "${value}" no campo ${mapping.field_id}`)
                    leadFields.push({ field_id: mapping.field_id, values: [{ value }] })
                }
            } else {
                leadFields.push({ field_id: mapping.field_id, values: [{ value }] })
            }
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, 9762760, 91813972, contact.id, name, respondent.respondent_utms, leadFields)

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
