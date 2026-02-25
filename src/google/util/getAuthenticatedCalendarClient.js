import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

// --- Configurações da Conta de Serviço e Calendário ---
const SERVICE_ACCOUNT_KEY_PATH = './credentials.json'; // Mude para o caminho do seu arquivo JSON
// Este CALENDAR_ID_BEING_WATCHED deve ser o mesmo que você usou ao registrar o watch.
// O servidor precisa saber qual calendário o evento notificado pertence.
// Se você gerencia múltiplos webhooks para múltiplos calendários,
// você pode precisar de uma forma de mapear X-Goog-Channel-ID para o calendarId.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];

export default async () => {
    const auth = new JWT({
        keyFile: SERVICE_ACCOUNT_KEY_PATH,
        scopes: SCOPES,
    });
    await auth.authorize();
    return google.calendar({ version: 'v3', auth });
}