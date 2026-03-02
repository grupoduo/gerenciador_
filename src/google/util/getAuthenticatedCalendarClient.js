import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import getGoogleCredentials from './getGoogleCredentials.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];

/**
 * @typedef {import("../../repository/mongodb.js").default} Repository
 * @param {Repository} repository
 */
export default async (repository) => {
    const credentials = await getGoogleCredentials(repository)
    const auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: SCOPES,
    });
    await auth.authorize();
    return google.calendar({ version: 'v3', auth });
}
