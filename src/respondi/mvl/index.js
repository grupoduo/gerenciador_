import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"
import getPhone from "../util/getPhone.js"

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    //console.log(JSON.stringify(req.body))
    res.json({ msg: "ok" })
    //use o mapeadorSemantico que esta no initAgent para gerar essa lista mais facilmente
    const answerFieldsMap = { 
        "xopyalskloic": 1880733, 
        "x9qne4si4vzp": 1876814,
        "xg6ayiq29rwf": 1878315,
        "xaee1fea5oif": 1880351,
        "xv4ry2krdaig": 1878287,
        "xro1j3vask7": 1878289,
        "xwtd8oxjlc3": 1878293,
        "xwd59myqh6z": 1878295,
        "x3jyow8tz67v": 1878297,
        "x7vn8ltz0t3g": 1880731,
        "x7mi9kdexn02": 1880729,
        "xplxkckua8n": 1881259
    }
    const { respondent } = req.body
    const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
    if (!contact) return console.log(JSON.stringify(req.body))
    const name = getName(respondent.raw_answers).answer
    await createLead(app, 11871392, 91446680, contact.id, name, respondent.respondent_utms);
}