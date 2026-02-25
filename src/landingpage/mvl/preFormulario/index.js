import createContact from "../../../kommo/util/createContact.js"
import createLead from "../../../kommo/util/createLead.js"
const utmsMap = {
    "utm_content": 1876822,
    "utm_medium": 1876824,
    "utm_campaign": 1876826,
    "utm_source": 1876828,
    "utm_term": 1876830,
    "utm_referrer": 1876832,
}
/**
 * @typedef { import("../../../app").default } App
 * @param {App} app 
 * @param {Object} data
 */
export default async (app, data) => {
    let contato = await pegaContato(app, data.phone || data.email)
    if (!contato) contato = await createContact(app, data.name, [{
        "field_id": 1876816,
        "values": [
            {
                "value": data.email
            }
        ]
    }])

    const custom_fields_values = []

    // aqui vai verificar se tem lead no funil do webnario
    if (contato._embedded && contato._embedded.leads)
        for (const lead_id of contato._embedded.leads) {
            const lead = await app.kommo.LeadFind(lead_id.id)
            if (lead.pipeline_id === 12325788)
                return lead
        }

    for (const key in data.utmParams) {
        if (!utmsMap[key]) continue;
        custom_fields_values.push({
            "field_id": utmsMap[key],
            "values": [
                {
                    "value": data.utmParams[key]
                }
            ]
        })
    }

    if (contato._embedded && contato._embedded.leads)
        for (const lead_id of contato._embedded.leads) {
            const lead = await app.kommo.LeadFind(lead_id.id)
            if (lead.pipeline_id !== 12325788) continue
            return lead
        }

    return await createLead(app, 12325788, 95261116, contato.id, data.name, { custom_fields_values })
}

/**
 * @typedef { import("../../../app").default } App
 * @param {App} app 
 * @param {String} participant 
 */
async function pegaContato(app, participant) {
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${participant}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    if (contacts.length) return contacts[0]

    return null
}