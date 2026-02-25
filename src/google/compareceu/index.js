/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "ok" })
    const { meet_code } = req.body
    console.log(req.body)
    const [reuniao, err] = await app.repository.findOne("Eventos", { meet_url: `https://meet.google.com/${meet_code}` })
    if (err || !reuniao)
        return console.log("meet_code", meet_code)
    await app.repository.update("Eventos", reuniao._id, { compareceu: "1300129" })
    reuniao.compareceu = "1300129"
    await app.kommo.LeadUpdate(reuniao.lead_id, {
        custom_fields_values: [
            {
                "field_id": 1879555,
                "values": [
                    { "enum_id": 1300129 }
                ]
            }
        ]
    })
    app.io.sockets.emit("update", reuniao)
}