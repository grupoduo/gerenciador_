/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {String} phone 
 */
export default async (app, phone) => {
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${phone}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    if (contacts.length) return contacts[0]

    return null
}