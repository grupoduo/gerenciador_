import getAuthenticatedCalendarClient from "./getAuthenticatedCalendarClient.js";

export default async (repository, calendarId) =>  {
    const calendarClient = await getAuthenticatedCalendarClient(repository);

    const params = {
        calendarId: calendarId,
        // Parâmetros para full sync, se necessário (ex: showDeleted, timeMin)
        showDeleted: true, // Para obter eventos cancelados no full sync inicial
        timeMin: (new Date()).toISOString(), // Para full sync a partir de agora
        // maxResults: 250, // Ajuste conforme necessário
    };
    
    const response = await calendarClient.events.list(params);

    return response.data.nextSyncToken;
}