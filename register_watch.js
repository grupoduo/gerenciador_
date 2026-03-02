import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// --- Configurações ---
const SERVICE_ACCOUNT_KEY_PATH = './storage/credentials.json'; // Mude para o caminho do seu arquivo JSON
const CALENDAR_ID_TO_WATCH = 'consultoriaduoacademy@gmail.com'; // Ou o ID específico do calendário (ex: seuemail@gmail.com, ou um ID de calendário longo)
const WEBHOOK_RECEIVER_URL = 'https://gerenciadorduo.zeyo.org/webhook/google/calendar/closers'; // URL do seu servidor webhook (deve ser HTTPS)
const CHANNEL_ID = crypto.randomUUID(); // Gera um ID único para o canal de notificação
const TOKEN_PARA_VERIFICACAO = 'closers_duo_academy_googleagenda'; // Opcional, mas recomendado

// Escopos necessários para a API do Google Agenda
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly']; // Ou .calendar para acesso mais amplo
                                                                          // ou .calendar.events para ler/escrever eventos

async function createWatchChannel() {
    try {
        // 1. Autenticar com a Conta de Serviço
        const auth = new JWT({
            keyFile: SERVICE_ACCOUNT_KEY_PATH,
            scopes: SCOPES,
            // Se a conta de serviço precisar personificar um usuário (Domain-Wide Delegation):
            // subject: 'usuario@seudominio.com'
        });

        await auth.authorize(); // Garante que a autenticação está pronta

        const calendar = google.calendar({ version: 'v3', auth });

        // 2. Registrar o Webhook (Canal de Notificação)
        console.log(`Registrando webhook para o calendário: ${CALENDAR_ID_TO_WATCH}`);
        console.log(`ID do Canal: ${CHANNEL_ID}`);
        console.log(`URL do Webhook: ${WEBHOOK_RECEIVER_URL}`);

        const response = await calendar.events.watch({
            calendarId: CALENDAR_ID_TO_WATCH,
            requestBody: {
                id: CHANNEL_ID, // Um ID único para este canal de notificação
                type: 'web_hook',
                address: WEBHOOK_RECEIVER_URL, // Seu endpoint HTTPS
                token: TOKEN_PARA_VERIFICACAO, // Opcional: enviado de volta no cabeçalho X-Goog-Channel-Token
                // params: {
                //   ttl: '86400' // Tempo de vida em segundos (opcional, padrão é longo, mas pode ser até 1 mês)
                // }
            },
        });

        console.log('Resposta do Google Calendar API (watch):');
        console.log(`  ID do Canal: ${response.data.id}`);
        console.log(`  ID do Recurso: ${response.data.resourceId}`);
        console.log(`  URI do Recurso: ${response.data.resourceUri}`);
        console.log(`  Expiração: ${new Date(parseInt(response.data.expiration, 10))}`);
        console.log('\nWebhook registrado com sucesso! Seu endpoint começará a receber notificações.');
        console.log('Lembre-se de lidar com a renovação do canal antes que ele expire.');

        // Guarde o response.data.id (CHANNEL_ID) e response.data.resourceId para poder parar o canal depois, se necessário.
        // Ex: await calendar.channels.stop({ requestBody: { id: CHANNEL_ID, resourceId: response.data.resourceId } });

    } catch (error) {
        console.error('Erro ao registrar o webhook:', error.response ? error.response.data : error.message);
        if (error.response && error.response.data && error.response.data.error) {
            console.error('Detalhes do erro do Google:', error.response.data.error);
        }
    }
}

createWatchChannel();