import utmsMap from "./utmsMap.js";

/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {Number} pipeline_id
 * @param {Number} status_id
 * @param {String} contact_id
 * @param {String} name
 * @param {object} utms
 * @param {Array} leadFields - campos custom extras para o lead (opcional)
 */
export default async (app, pipeline_id, status_id, contact_id, name, utms, leadFields = []) => {
    try {
        const custom_fields_values = []

        if (utms) {
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
        }

        // Merge campos extras do lead (ex: regime tributário, soluções)
        if (leadFields.length) {
            custom_fields_values.push(...leadFields)
        }

        const kommolead = {
            name: name || "Sem nome",
            _embedded: {
                contacts: [{ 'id': contact_id }]
            },
            custom_fields_values
        }
        const response = await app.kommo.LeadCreate(pipeline_id, status_id, name, kommolead)
        const result = await response.json()

        if (!result || !result._embedded || !result._embedded.leads || !result._embedded.leads[0]) {
            console.error("ERRO: Resposta inesperada ao criar lead:", JSON.stringify(result))
            return null
        }

        const lead = result._embedded.leads[0]
        console.log("Lead Criado: ", lead.id)
        return lead
    } catch (error) {
        console.error("ERRO CRÍTICO em createLead:", error.message, error.stack)
        return null
    }
}
