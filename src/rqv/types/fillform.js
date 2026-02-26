import createContact from "../../kommo/util/createContact.js";
import createLead from "../../kommo/util/createLead.js";

const utmsMap = {
    "utm_content": 1876822,
    "utm_medium": 1876824,
    "utm_campaign": 1876826,
    "utm_source": 1876828,
    "utm_term": 1876830,
    "utm_referrer": 1876832,
}

/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {any} data 
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
    }, {
        "field_id": 1876814,
        "values": [
            {
                "value": `55${data.phone}`
            }
        ]
    }])

    const custom_fields_values = []

    if (data.utmParams)
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
            if (lead.pipeline_id !== 12151484) continue
            await app.kommo.LeadUpdate(lead_id.id, { custom_fields_values })
            return await app.kommo.moveLeadToStatus(93839584)
        }

    return await createLead(app, 12151484, 93839584, contato.id, data.name, { custom_fields_values })
}

/**
 * @param {App} app 
 * @param {String} participant 
 */
async function pegaContato(app, participant) {
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${participant.split("@")[0]}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    if (contacts.length) return contacts[0]

    return null
}