/**
 * Busca as credenciais do Google Service Account do banco de dados (coleção "google").
 * @typedef {import("../../repository/mongodb.js").default} Repository
 * @param {Repository} repository
 * @returns {Promise<{client_email: string, private_key: string, [key: string]: any}>}
 */
export default async function getGoogleCredentials(repository) {
    const [credentials, err] = await repository.findOne("google", { type: "service_account" })
    if (err) throw new Error("Não foi possível encontrar as credenciais do Google no banco de dados (coleção 'google', type: 'service_account')")
    return credentials
}
