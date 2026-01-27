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
    //console.log(JSON.stringify(req.body))
    res.json({ msg: "ok" })
    const { respondent } = req.body
    const answers = {}
    respondent.raw_answers.forEach(answer => {
        // Store answers keyed by question_id, handling array values
        answers[answer.question.question_id] =
            Array.isArray(answer.answer) ? answer.answer.join(', ') :
                answer.question.question_type === "phone" ?
                    `${answer.answer.country}${answer.answer.phone}` :
                    answer.answer;
    });
    const contact = await createContact(app, answers)
    if(!contact) return console.log(JSON.stringify(req.body))
    await createLead(app, contact.id, answers["xopyalskloic"]);
}

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
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} phone 
 */
async function createContact(app, answers) {
    console.log("Criando contato: ", answers["xopyalskloic"])
    const custom_fields_values = []

    for (const key in answers) {
        if (key === "xopyalskloic") continue;
        if(!answerFieldsMap[key]) continue;
        custom_fields_values.push({
            "field_id": answerFieldsMap[key],
            "values": [
                {
                    "value": answers[key]
                }
            ]
        })
    }
    const contactresponse = await app.kommo.ContactCreate({
        name: answers["xopyalskloic"],
        custom_fields_values
    })
    const contact = await contactresponse.json()
    if (contact['validation-errors'])
        return console.log("error: validation-errors", contact['validation-errors'][0])
    return contact._embedded.contacts[0]
}

/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} contact_id
 */
async function createLead(app, contact_id, name) {
    const kommolead = {
        name,
        _embedded: {
            contacts: [{ 'id': contact_id }]
        }
    }
    const response = await app.kommo.LeadCreate(11380836, 87977544, "", kommolead)
    console.log("Lead Criado: ", (await response.json())._embedded.leads[0].id)
}