/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {String} phone
 */
function normalizePhone(phone) {
    if (!phone) return null
    // Remove tudo que não é número
    let cleaned = String(phone).replace(/\D/g, '')
    // Se começa com 0, remove
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1)
    // Se tem 10 ou 11 dígitos (BR sem DDI), adiciona 55
    if (cleaned.length === 10 || cleaned.length === 11) cleaned = '55' + cleaned
    return cleaned
}

export { normalizePhone }

export default async (app, phone) => {
    const normalized = normalizePhone(phone)
    if (!normalized) return null

    // Tenta busca com telefone normalizado
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${normalized}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    if (contacts.length) return contacts[0]

    // Se não achou com normalizado, tenta com original
    if (normalized !== String(phone)) {
        const result2 = await app.kommo.FindByQuery("contacts", `with=leads&query=${phone}&order[id]=desc`)
        if (!result2) return null
        const { contacts: contacts2 } = result2._embedded;
        if (contacts2.length) return contacts2[0]
    }

    return null
}
