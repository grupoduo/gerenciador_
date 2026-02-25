import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

/**
 * @typedef { import("../../app/index.js").default } App
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
        "x0fnghh8lgr0i": 1880351,
        "xmnn2h93crsp": 1878287,
        "x919asy54zas": 1876816,
        "x3o71ld36ziq": 1876814,
        "xxl4tn2zko2": 1878315,
        "x4cjjaoqljbe": 1878289,
        "xe1z1b1h5j06": 1878291,
        "xklblw7ubrfh": 1881259,
        "xnc3ikl9dgkd": 1878297,
        "xoy60zucvfl": 1881895,
        "x99pegcslqhv": 1881897
    }
    const { respondent } = req.body
    const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
    if (!contact) return console.log(JSON.stringify(req.body))
    const name = getName(respondent.raw_answers).answer
    await createLead(app, 9762760, 91813972, contact.id, name, respondent.respondent_utms);
}