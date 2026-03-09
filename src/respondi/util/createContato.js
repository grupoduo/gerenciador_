import getName from "./getName.js";
import getPhone from "./getPhone.js";
import pegacontato from "./pegacontato.js";
import estadoEnumMap from "../../kommo/estadoEnumMap.js";

// Campos multitext que precisam de enum_code
const MULTITEXT_ENUM = {
    1876814: "MOB",   // Phone → Celular
    1876816: "WORK",  // Email → E-mail comercial
}

// Campos select que precisam de enum_id ao invés de value
const SELECT_ENUM_MAPS = {
    1880351: estadoEnumMap, // Estado do Salão
}

/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {any[]} raw_answers
 * @param {object} answerFieldsMap
 */
export default async (app, raw_answers, answerFieldsMap) => {
    try {
        const answers = {}
        raw_answers.forEach(answer => {
            answers[answer.question.question_id] =
                Array.isArray(answer.answer) ? answer.answer.join(', ') :
                    answer.question.question_type === "phone" ?
                        `${answer.answer.country}${answer.answer.phone}` :
                        answer.answer;
        });
        const name = getName(raw_answers)
        const phone = getPhone(raw_answers)
        const ignore = name ? [name.question.question_id] : []
        const custom_fields_values = []

        for (const key in answers) {
            if (ignore.find(i => i === key)) continue;
            if (!answerFieldsMap[key]) continue;

            const field_id = answerFieldsMap[key]
            const value = answers[key]

            // Campo SELECT: enviar enum_id ao invés de value
            if (SELECT_ENUM_MAPS[field_id]) {
                const enumMap = SELECT_ENUM_MAPS[field_id]
                const enum_id = enumMap[value]
                if (enum_id) {
                    custom_fields_values.push({
                        field_id,
                        values: [{ enum_id }]
                    })
                } else {
                    // Fallback: envia como texto se estado não encontrado no mapa
                    console.warn(`[createContato] Estado não encontrado no enumMap: "${value}"`)
                    custom_fields_values.push({
                        field_id,
                        values: [{ value }]
                    })
                }
            }
            // Campo MULTITEXT: adicionar enum_code
            else if (MULTITEXT_ENUM[field_id]) {
                custom_fields_values.push({
                    field_id,
                    values: [{ value, enum_code: MULTITEXT_ENUM[field_id] }]
                })
            }
            // Campos normais (text, textarea, etc)
            else {
                custom_fields_values.push({
                    field_id,
                    values: [{ value }]
                })
            }
        }

        console.log(`[createContato] ${custom_fields_values.length} campos mapeados para Kommo`)

        // DEDUPLICAÇÃO: busca contato existente por telefone
        const contato = phone ? await pegacontato(app, phone.answer.phone) : null
        if (contato) {
            const updateResponse = await app.kommo.ContactUpdate(contato.id, { custom_fields_values })
            if (updateResponse && updateResponse.ok) {
                console.log(`[createContato] Contato atualizado: ${contato.id}`)
            } else {
                const statusCode = updateResponse ? updateResponse.status : 'N/A'
                let errorBody = ''
                try { errorBody = await updateResponse.text() } catch (e) { /* ignore */ }
                console.error(`[createContato] ERRO ao atualizar contato ${contato.id} - status: ${statusCode}`, errorBody)
            }
            return contato
        }

        // Cria novo contato
        const contactresponse = await app.kommo.ContactCreate({
            name: name ? name.answer : "Sem nome",
            custom_fields_values
        })
        const contact = await contactresponse.json()

        // validation-errors é objeto (truthy), precisa checar explicitamente
        if (contact && contact['validation-errors']) {
            console.error("[createContato] ERRO VALIDAÇÃO CONTATO:", JSON.stringify(contact['validation-errors']))
            return null
        }

        if (!contact || !contact._embedded || !contact._embedded.contacts || !contact._embedded.contacts[0]) {
            console.error("[createContato] Resposta inesperada ao criar contato:", JSON.stringify(contact))
            return null
        }

        console.log(`[createContato] Contato criado: ${contact._embedded.contacts[0].id}`)
        return contact._embedded.contacts[0]
    } catch (error) {
        console.error("[createContato] ERRO CRÍTICO:", error.message, error.stack)
        return null
    }
}
