import createContact from "../kommo/util/createContact.js"
import createLead from "../kommo/util/createLead.js"
import pegaLeadNoFunil from "../kommo/util/pegaLeadNoFunil.js"

/**
 * @typedef { import("../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "Sucesso" })
    const products = {
        6726232: {
            pipeline_id: 12588032,
            init_state: 97219620,
            product_id: 6726232,
            final_state: {
                PURCHASE_APPROVED: 97219632,
                PURCHASE_OUT_OF_SHOPPING_CART: 97219624
            }
        }
    }

    app.repository.create("ComprasAprovadas", req.body)

    const request = req.body
    const event = request.event
    const { product, buyer, purchase } = request.data

    if(!buyer) return 

    const webinario = products[product.id]
    if (!webinario) return

    let contatos = await pegaContatos(app, buyer.phone || buyer.email)
    const lead = !contatos || !contatos.length ? await criaContatoELeadWebnarion(app, webinario, buyer) : await loopAchaLeadPeloContato(app, webinario, buyer, contatos)

    await app.kommo.moveLeadToStatus(lead.id, webinario.final_state[event])
}

/**
 * @param {App} app 
 * @param {Array} contatos 
 */
async function loopAchaLeadPeloContato(app, webinario, buyer, contatos) {
    for (const contato of contatos) {
        const lead = await pegaLeadNoFunil(app, contato, webinario.pipeline_id)
        if (lead) return lead
    }

    return await createLead(app, webinario.pipeline_id, webinario.init_state, contatos[0].id, buyer.name, {})
}

/**
 * @param {App} app 
 * @param {Array} contatos 
 */
async function criaContatoELeadWebnarion(app, webinario, buyer) {
    const contato = await createContact(app, buyer.name, [{
        "field_id": 1876816,
        "values": [
            {
                "value": buyer.email
            }
        ]
    }])

    return await createLead(app, webinario.pipeline_id, webinario.init_state, contato.id, buyer.name, {})
}


/**
 * @param {App} app 
 * @param {String} participant 
 */
async function pegaContatos(app, participant) {
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${participant}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;
    return contacts
}