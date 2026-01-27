import EventoAgendamento from "../domain/agendamento.js";

/**
 * @typedef { import("../app").default } App
 * @param {App} app 
 * @param {String} lead_id
 */
export default async (app, lead_id) => {
    //https://calendly.com/scheduled_events/a6317029-3049-4720-8ac7-dc2478925b07/invitees/1c80707a-15ae-4774-8524-b75c9f7e0a2d
    const lead = await app.kommo.LeadFind(lead_id)
    if (!lead || !lead._embedded.contacts[0]) return;
    const contact = await app.kommo.ContactFind(lead._embedded.contacts[0].id)
    if (!contact || !contact.custom_fields_values) return
    const link = contact.custom_fields_values.find(f => f.field_id === 1878319)
    if (!link || !link.values[0].value.startsWith("https://calendly.com/scheduled_events")) return;

    const uuid = link.values[0].value.split("/")[4]
    const [agendas] = await app.repository.findMany("Agendas", {})

    const { event, agenda, err } = await getEventFromCloser(app, uuid, agendas)
    if (err) return console.log("nao é de nenhuma agenda")

    await app.kommo.ContactUpdate(contact.id, {
        custom_fields_values: [
            {
                field_id: 1878319,
                values: [{ value: event.location.join_url }]
            }
        ]
    })

    const date = new Date(event.start_time)
    await app.kommo.LeadUpdate(lead.id, {
        custom_fields_values: [
            {
                "field_id": 1878999,
                "values": [{
                    "value": (date.getTime() / 1000)
                }]
            },
            {
                "field_id": 1880511,
                "values": [{ "enum_id": agenda.closer }]
            }
        ]
    });

    const agendamento = new EventoAgendamento(lead, date)
    await app.repository.create("Eventos", agendamento)
    app.io.sockets.emit("evento", agendamento)
}

async function getEventFromCloser(app, uuid, agendas) {
    for (const agenda of agendas) {
        let access_token = agenda.calendly.access_token
        if (new Date((agenda.calendly.created_at * 1000) + (agenda.calendly.expires_in * 1000)).getTime() < new Date().getTime())
            access_token = await app.calendly.refreshToken(app.repository, agenda)
        const result = await app.calendly.getEvent(uuid, access_token)
        if (!result) continue
        return { event: result.resource, agenda }
    }
    return { err: true }
}