
const grupos = [
    {
        id: "120363417158309426@g.us",
        pipeline_id: 11380836,
        move_to: 87833052
    },
    {
        id: "120363400488851144@g.us",
        pipeline_id: 11380836,
        move_to: 87833052
    },
    {
        id: "120363402323836547@g.us",//120363402323836547@g.us
        pipeline_id: 11459696,
        move_to: 87990960
    }
]

/**
 * @typedef { import("../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.send("ok")
    const { args } = req.body;
    const { participant, remote } = args[0].id;
    //120363417158309426@g.us
    console.log(remote)
    const grupo = grupos.find(grupo => grupo.id === remote)
    if (!grupo) return
    const lead = await pegaLeadEntrouNoGrupo(app, participant, grupo.pipeline_id)
    if (!lead) return;
    app.kommo.moveLeadToStatus(lead.id, grupo.move_to)
};



/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} participant 
 */
async function pegaLeadEntrouNoGrupo(app, participant, pipeline_id) {
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${participant.split("@")[0]}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    for (const contact of contacts) {
        if (!contact._embedded.leads.length) continue;

        for (const elead of contact._embedded.leads) {
            const lead = await app.kommo.LeadFind(elead.id)
            if (lead.pipeline_id === pipeline_id)
                return lead
        }
    }

    return null
}


/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} participant 
 */
export async function setLead(app, participant) {
    console.log(participant)
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${participant.split("@")[0]}&order[id]=desc`)
    const { contacts } = !result ? { contacts: [await createContact(app, participant.split("@")[0])] } : result._embedded
    let hasWAC = false
    for (const contact of contacts) {
        console.log(contact.id, contact.name)
        if (!contact) continue;

        if (!result) {
            await createLead(app, contact.id, contact.name);
            continue;
        }

        if (!contact._embedded.leads.length) continue;

        for (const elead of contact._embedded.leads) {
            const lead = await app.kommo.LeadFind(elead.id)
            if (lead.pipeline_id === 11380836 || lead.name.includes("Lead")) hasWAC = true
            if (lead.pipeline_id === 11380836) console.log(lead.id, participant)
        }

        if (hasWAC) continue
        await createLead(app, contact.id, lead.name)
        return
    }
}

/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} phone 
 */
async function createContact(app, phone) {
    console.log("Criando contato: ", phone)
    const contactresponse = await app.kommo.ContactCreate({
        name: phone,
        custom_fields_values: [{
            "field_id": 1876814,
            "values": [
                {
                    "value": phone
                }
            ]
        }]
    })
    const contact = await contactresponse.json()
    if (contact['validation-errors'])
        return console.log("error: validation-errors", contact['validation-errors'][0])
    return contact._embedded.contacts[0]
}

/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} contact_id
 */
async function createLead(app, contact_id, name) {
    const kommolead = {
        name,
        _embedded: {
            contacts: [{ 'id': contact_id }]
        }
    }
    const response = await app.kommo.LeadCreate(11380836, 87761812, "", kommolead)
    console.log("Lead Criado: ", (await response.json())._embedded.leads[0].id)
}
