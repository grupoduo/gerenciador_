/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} name 
 * @param {Array} custom_fields_values 
 */
export default async function createContact(app, name, custom_fields_values) {
    console.log("Criando contato: ", name)
    
    const contactresponse = await app.kommo.ContactCreate({
        name,
        custom_fields_values
    })
    const contact = await contactresponse.json()
    if (contact['validation-errors'])
        return console.log("error: validation-errors", contact['validation-errors'][0])
    return contact._embedded.contacts[0]
}