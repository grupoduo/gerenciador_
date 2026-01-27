/**
 * Função para extrair o Calendar ID
 * @param {String} resourceUri
 */
export default (resourceUri) => {
    if (!resourceUri) {
        return null;
    }
    const regex = /\/calendars\/([^/?]+)/;
    const match = resourceUri.match(regex);
    if (match && match[1]) {
        try {
            return decodeURIComponent(match[1]);
        } catch (e) {
            console.error("Erro ao decodificar o calendarId da URI:", match[1], e);
            return match[1]; // Retorna não decodificado em caso de erro na decodificação
        }
    }
    return null;
}