import getName from "./getName.js";
import getPhone from "./getPhone.js";
import pegacontato from "./pegacontato.js";

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
            custom_fields_values.push({
                "field_id": answerFieldsMap[key],
                "values": [
                    {
                        "value": answers[key]
                    }
                ]
            })
        }

        // DEDUPLICAÇÃO: busca contato existente por telefone
        const contato = phone ? await pegacontato(app, phone.answer.phone) : null
        if (contato) {
            await app.kommo.ContactUpdate(contato.id, { custom_fields_values })
            console.log("Contato atualizado: ", contato.id)
            return contato
        }

        // Cria novo contato
        const contactresponse = await app.kommo.ContactCreate({
            name: name ? name.answer : "Sem nome",
            custom_fields_values
        })
        const contact = await contactresponse.json()

        // FIX: validation-errors é objeto (truthy), precisa checar explicitamente
        if (contact && contact['validation-errors']) {
            console.error("ERRO VALIDAÇÃO CONTATO:", JSON.stringify(contact['validation-errors']))
            return null
        }

        if (!contact || !contact._embedded || !contact._embedded.contacts || !contact._embedded.contacts[0]) {
            console.error("ERRO: Resposta inesperada ao criar contato:", JSON.stringify(contact))
            return null
        }

        console.log("Contato criado: ", contact._embedded.contacts[0].id)
        return contact._embedded.contacts[0]
    } catch (error) {
        console.error("ERRO CRÍTICO em createContato:", error.message, error.stack)
        return null
    }
}
