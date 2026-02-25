import pegacontato from "../../respondi/util/pegacontato.js";

/**
 * @typedef { import("../index.js").default } KommoAPI
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {String} name
 * @param {Array} custom_fields_values
 */
export default async function createContact(app, name, custom_fields_values) {
    try {
        console.log("Criando/Buscando contato: ", name)

        // DEDUPLICAÇÃO: extrai telefone dos custom_fields e busca contato existente
        const phoneField = custom_fields_values.find(f => f.field_id === 1876814)
        if (phoneField && phoneField.values && phoneField.values[0]) {
            const phone = phoneField.values[0].value
            const contato = await pegacontato(app, phone)
            if (contato) {
                await app.kommo.ContactUpdate(contato.id, { custom_fields_values })
                console.log("Contato existente atualizado: ", contato.id)
                return contato
            }
        }

        // Cria novo contato
        const contactresponse = await app.kommo.ContactCreate({
            name: name || "Sem nome",
            custom_fields_values
        })
        const contact = await contactresponse.json()

        if (contact && contact['validation-errors']) {
            console.error("ERRO VALIDAÇÃO CONTATO:", JSON.stringify(contact['validation-errors']))
            return null
        }

        if (!contact || !contact._embedded || !contact._embedded.contacts || !contact._embedded.contacts[0]) {
            console.error("ERRO: Resposta inesperada ao criar contato:", JSON.stringify(contact))
            return null
        }

        console.log("Contato criado: ", contact._embedded.contacts[0].id)
        return contact._embedded.contacts[0]
    } catch (error) {
        console.error("ERRO CRÍTICO em createContact:", error.message, error.stack)
        return null
    }
}
