const fieldsMap = {
    conhecimento_perfil: 1884204,
    faturamento: 1878291,
    papel_negocio: 1878289
}

/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {any} data 
 */
export default async (app, data) => {
    console.log("entrou no formulario")
    let contato = await pegaContato(app, data.phone || data.email)
    if (!contato) return

    const custom_fields_values = []

        for (const key in fieldsMap) {
            if (!data[key]) continue;
            custom_fields_values.push({
                "field_id": fieldsMap[key],
                "values": [
                    {
                        "value": data[key]
                    }
                ]
            })
        }

    app.kommo.ContactUpdate(contato.id, {custom_fields_values})
}

/**
 * @param {App} app 
 * @param {String} participant 
 */
async function pegaContato(app, participant) {
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${participant.split("@")[0]}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    if (contacts.length) return contacts[0]

    return null
}