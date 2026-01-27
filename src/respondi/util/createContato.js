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
    const answers = {}
    raw_answers.forEach(answer => {
        // Store answers keyed by question_id, handling array values
        answers[answer.question.question_id] =
            Array.isArray(answer.answer) ? answer.answer.join(', ') :
                answer.question.question_type === "phone" ?
                    `${answer.answer.country}${answer.answer.phone}` :
                    answer.answer;
    });
    const name = getName(raw_answers)
    const phone = getPhone(raw_answers)
    const ignore = [name.question.question_id]
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

    const contato = phone ? await pegacontato(app, phone.answer.phone): null
    if (contato) {
        app.kommo.ContactUpdate(contato.id, {custom_fields_values})
        return contato
    }

    const contactresponse = await app.kommo.ContactCreate({
        name: name.answer,
        custom_fields_values
    })
    const contact = await contactresponse.json()
    if (contact['validation-errors'])
        return console.log("error: validation-errors", contact['validation-errors'][0])
    return contact._embedded.contacts[0]
}