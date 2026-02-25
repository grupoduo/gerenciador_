import customsToObject from "../kommo/util/customsToObject.js";

/**
 * @typedef { import("../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "ok" })
    const { leads } = req.body
    const { status } = leads
    if(!status) return
    status.forEach(async lead => {
        const lead_contact = await app.kommo.LeadFind(lead.id)
        if (!lead_contact._embedded || !lead_contact._embedded.contacts)
            return;

        lead_contact._embedded.contacts.forEach(async contact_basic => {
            const contact = await app.kommo.ContactFind(contact_basic.id)
            const customs = customsToObject(contact)
            if(!customs[1876816] || !customs[1876816].values.length) return
            const email = customs[1876816].values[0].value
            const [lead_wmvl] = await app.repository.findOne("LeadsFromPSM", {email})
            if(!lead_wmvl) return console.log(lead.name, lead.id)
            delete lead_wmvl._id
            lead_wmvl.type = "comprou"
            lead_wmvl.lead_id = lead.id
            app.repository.create("LeadsFromPSM", lead_wmvl)
        })
    });
};