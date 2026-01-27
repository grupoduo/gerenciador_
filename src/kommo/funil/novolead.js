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
    let { add, status } = leads
    //console.log("Novo Lead: add =", typeof add, "; status =", typeof status)
    if(!add) add = status;
    if(!add) return
    add.forEach(async lead => {
        const lead_contact = await app.kommo.LeadFind(lead.id)
        if (!lead_contact || !lead_contact._embedded || !lead_contact._embedded.contacts)
            return;
        lead_contact._embedded.contacts.forEach(async contact_basic => {
            const contact = await app.kommo.ContactFind(contact_basic.id)
            const customs = customsToObject(contact)
            if (!customs[1876814] || !customs[1876814].values.length) return
            const phone = customs[1876814].values[0].value
            const [lead_euquero, err] = await app.repository.findOne("LeadsEuQuero", { "phone": { "$regex": phone.substring(phone.length - 8) } })
            if (!lead_euquero || err)
                return 
            const contact_euquero = await app.kommo.ContactFind(lead_euquero.contact_id)
            await app.kommo.ContactUpdate(contact_euquero.id, {
                name: contact.name,
                custom_fields_values: contact.custom_fields_values
            })
            await app.kommo.LeadUpdate(lead_euquero.id, {name: contact.name})
            await app.kommo.moveLeadToStatus(lead_euquero.id, 77198212)

            await app.kommo.moveLeadToStatus(lead.id, 96324472)
        })
    })
};