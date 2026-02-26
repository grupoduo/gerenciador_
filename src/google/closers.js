"use strict"
import Evento from '../domain/evento.js';
import getCustom from '../kommo/util/getCustom.js';
import pegacontato from '../respondi/util/pegacontato.js';
import extractCalendarIdFromUri from './util/extractCalendarIdFromUri.js';
import extractLeadId from './util/extractLeadId.js';
import fullSync from './util/fullSync.js';
import getAuthenticatedCalendarClient from './util/getAuthenticatedCalendarClient.js';

/**
 * @typedef { import("../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    const resourceState = req.headers['x-goog-resource-state'];
    const resourceUri = req.headers['x-goog-resource-uri']; // Pegamos a URI aqui

    // Extrai o calendarId da URI
    const calendarIdParaSync = extractCalendarIdFromUri(resourceUri);

    if (!calendarIdParaSync)
        return res.status(400).send('Não foi possível determinar o calendarId da notificação.');

    const [calendar, err] = await app.repository.findOne("Agendas", { calendarId: calendarIdParaSync })
    if (err)
        return res.status(404).send('Não foi possivel encontrar agenda de closer com o calendarId')

    // Responda rapidamente ao Google
    res.status(200).send('Notificação recebida. Processando sync...');

    // Quando for uma notificacao de sync so salva o proximo token
    if (resourceState === 'sync') {
        const nextSyncToken = await fullSync(calendarIdParaSync); // Full sync
        app.repository.update("Agendas", calendar._id, { nextSyncToken })
        return;
    }

    if (resourceState !== 'exists' && resourceState !== 'not_exists') return;

    const calendarClient = await getAuthenticatedCalendarClient();
    const response = await calendarClient.events.list({
        calendarId: calendar.calendarId,
        syncToken: calendar.nextSyncToken
    })

    const events = response.data.items
    app.repository.update("Agendas", calendar._id, { nextSyncToken: response.data.nextSyncToken })
    for (const event of events) {
        //TODO: aqui tem que pegar o email do convidado e entao pegar o contato no Kommo e entao pegar o lead que esta no pipepline
        let lead = await pegaLeadDoConvidado(app, event)
        if (!lead) {
            const data = event.description ? getDataFromEvent(event) : null;
            if (data && data.lead_id) {
                lead = await app.kommo.LeadFind(data.lead_id)
            }
        }

        if (!lead) {
            continue
        }

        const startTime = new Date(event.start.dateTime).getTime()
        await app.kommo.LeadUpdate(lead.id, {
            custom_fields_values: [
                {
                    "field_id": 1880511,
                    "values": [
                        event.status === "confirmed" ?
                            { "enum_id": calendar.closer } :
                            {}
                    ]
                },
                {
                    "field_id": 1878999,
                    "values": [
                        { "value": startTime / 1000 }
                    ]
                }
            ]
        })
        await app.kommo.ContactUpdate(lead._embedded.contacts[0].id, {
            custom_fields_values: [
                {
                    "field_id": 1878319,
                    "values": [{ value: event.hangoutLink }]
                },
            ]
        })

        if (event.status !== "confirmed") continue;

        if ((await app.repository.findOne("Eventos", { googleid: event.id }))[0]) continue;

        if (lead.status_id !== 76076908 &&
            lead.status_id !== 142 &&
            lead.status_id !== 143)
            app.kommo.moveLeadToStatus(lead.id, 76076812)
        const evento = new Evento("status", lead.id, 76076812, lead.pipeline_id, new Date(startTime))
        evento.data_reuniao = new Date(startTime)
        evento.closer = calendar.closer.toString()
        const responsavelA = getCustom(lead, 1879503, "enum_id")
        if (responsavelA)
            evento.responsavelA = responsavelA
        const source = getCustom(lead, 1876828, "value")
        if (source) evento.source = source
        const content = getCustom(lead, 1876822, "value")
        if (content) {
            evento.content = content
            evento.term = getCustom(lead, 1876830, "value")
        }
        evento.meet_url = event.hangoutLink
        evento.name = lead.name;
        evento.googleid = event.id
        app.repository.create("Eventos", evento)
        app.io.sockets.emit("evento", evento)
    }
}

/**
 * 
 * @param {App} app 
 * @param {*} event 
 */
async function pegaLeadDoConvidado(app, event) {
    if (!event.attendees || !event.attendees.length) return;

    for (const attendee of event.attendees) {
        if (!attendee.email || attendee.organizer) continue;
        const result = await app.kommo.FindByQuery("leads", `with=contacts&query=${attendee.email}`)
        if (!result._embedded) continue;
        const { leads } = result._embedded
        for (const lead of leads) {
            if (lead.pipeline_id != 9907288) continue
            // Verifica se lead esta entre atendimento sdr ate em negociacao
            if ([76076808, 95185308, 88208932, 81189808, 76076812, 76076908].indexOf(lead.status_id) < 0) continue

            return lead
        }
    }


}

function getDataFromEvent(event) {
    const result = {
        lead_id: "",
        link: ""
    }
    if (event.hangoutLink) {
        result.lead_id = extractLeadId(event.description.replaceAll("<br>", "\n"), true)
        result.link = event.hangoutLink
        return result
    }
    result.lead_id = extractLeadId(event.description)
    result.link = event.location
    return result
}