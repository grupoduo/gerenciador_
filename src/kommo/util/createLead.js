/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {Number} pipeline_id
 * @param {Number} stage_id
 * @param {String} contact_id
 * @param {String} name
 */
export default async (app, pipeline_id, stage_id, contact_id, name, options) => {
    try {
        const kommolead = {
            name: name || "Sem nome",
            _embedded: {
                contacts: [{ 'id': contact_id }]
            }
        }
        if (options) Object.assign(kommolead, options)
        const response = await app.kommo.LeadCreate(pipeline_id, stage_id, "", kommolead)
        const result = await response.json()

        if (!result || !result._embedded || !result._embedded.leads || !result._embedded.leads[0]) {
            console.error("ERRO: Resposta inesperada ao criar lead:", JSON.stringify(result))
            return null
        }

        const lead = result._embedded.leads[0]
        console.log("Lead Criado: ", lead.id)
        return lead
    } catch (error) {
        console.error("ERRO CRÍTICO em createLead (kommo/util):", error.message, error.stack)
        return null
    }
}
