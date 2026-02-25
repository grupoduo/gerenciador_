import customsToObject from "../util/customsToObject.js";

/**
 * @typedef { import("../../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "ok" })
    const { leads } = req.body
    const { add } = leads
    add.forEach(async lead => {
        const lead_contact = await app.kommo.LeadFind(lead.id)
        if (!lead_contact._embedded || !lead_contact._embedded.contacts)
            return;

        lead_contact._embedded.contacts.forEach(async contact_basic => {
            const lead_euquero = {
                id: lead.id,
                contact_id: contact_basic.id
            }
            const contact = await app.kommo.ContactFind(contact_basic.id)
            const customs = customsToObject(contact)
            if (!customs[1876814] || !customs[1876814].values.length) return
            const phone = customs[1876814].values[0].value
            lead_euquero.phone = phone
            app.repository.create("LeadsEuQuero", lead_euquero)
        })
    })
};