/**
 * @typedef { import("../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    const { email } = req.body
    const [lead, err] = await app.repository.findOne("LeadsFromWMVL", { email, type: "comprou" })
    if (err || !lead || !Object.keys(lead).length)
        return res.status(401).json({ error: "E-mail inválido, verifique seu email ou tente novamente mais tarde." })

    app.kommo.moveLeadToStatus(lead.lead_id, 95622856)
    res.json({ redirect_url: "https://meet.google.com/qsf-hzpk-kax" })
};