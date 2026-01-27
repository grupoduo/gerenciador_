/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {Number} pipeline_id
 * @param {Number} stage_id
 * @param {String} contact_id
 * @param {String} name
 */
export default async (app, contact, pipeline_id) => {
    if (!contact._embedded || !contact._embedded.leads) 
        return

    for (const lead_id of contact._embedded.leads) {
        const lead = await app.kommo.LeadFind(lead_id.id)
        if (lead.pipeline_id === pipeline_id)
            return lead
    }
}