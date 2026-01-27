/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {Number} pipeline_id
 * @param {Number} stage_id
 * @param {String} contact_id
 * @param {String} name
 */
export default async (app, pipeline_id, stage_id, contact_id, name, options) => {
    const kommolead = {
        name,
        _embedded: {
            contacts: [{ 'id': contact_id }]
        }
    }
    Object.assign(kommolead, options)
    const response = await app.kommo.LeadCreate(pipeline_id, stage_id, "", kommolead)
    const lead = (await response.json())._embedded.leads[0]
    console.log("Lead Criado: ", lead.id)
    return lead
}