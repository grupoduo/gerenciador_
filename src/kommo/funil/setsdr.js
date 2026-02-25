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
    let { add } = leads
    if(!add) return console.log("Set SDR add err", Object.keys(leads))
    add.forEach(async lead => {
        console.log(lead.name)
        const lead_contact = await app.kommo.LeadFind(lead.id)
        if (!lead_contact._embedded || !lead_contact._embedded.contacts)
            return;
        lead_contact._embedded.contacts.forEach(async contact_basic => {
            const contact = await app.kommo.ContactFind(contact_basic.id)
            const customs = customsToObject(contact)
            if (!customs[1876814] || !customs[1876814].values.length) return
            const phone = customs[1876814].values[0].value
            const [lead_switcher, err] = await app.repository.findOne("LeadsSwitcher", { "phone": { "$regex": phone.substring(phone.length - 8) } })
            if(!lead_switcher || err) return console.log("Erro no lead_switcher:", lead_switcher, phone, lead.id, contact.name)
            //TODO: set responsavel agendamento
            await app.kommo.LeadUpdate(lead.id, {
                custom_fields_values: [
                    {
                        "field_id": 1879503,
                        "values": [{
                            "enum_id": lead_switcher.sdr
                        }]
                    }
                ]
            })
            await app.kommo.moveLeadToStatus(lead.id, 76076808)
            app.repository.delete("LeadsSwitcher", lead_switcher._id)
        })
    })
};