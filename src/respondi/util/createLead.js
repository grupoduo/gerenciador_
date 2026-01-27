import utmsMap from "./utmsMap.js";

/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {String} contact_id
 */
export default async (app, pipeline_id, status_id, contact_id, name, utms) => {
    const custom_fields_values = []

    for (const key in utms) {
        if (!utmsMap[key]) continue;
        custom_fields_values.push({
            "field_id": utmsMap[key],
            "values": [
                {
                    "value": utms[key]
                }
            ]
        })
    }
    const kommolead = {
        name,
        _embedded: {
            contacts: [{ 'id': contact_id }]
        },
        custom_fields_values
    }
    const response = await app.kommo.LeadCreate(pipeline_id, status_id, name, kommolead)
    //console.log("Lead Criado: ", (await response.json())._embedded.leads[0].id)
}