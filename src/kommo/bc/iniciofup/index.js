/**
 * @typedef { import("../../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "ok" })
    const { leads } = req.body
    const { status } = leads
    if (!status) return

    status.forEach(async lead => {
        await app.kommo.LeadUpdate(lead.id, {
            custom_fields_values: [
                {
                    "field_id": 1883479,
                    "values": [
                        { "value": Math.floor(new Date().getTime() / 1000) }
                    ]
                }
            ]
        })
    })
}