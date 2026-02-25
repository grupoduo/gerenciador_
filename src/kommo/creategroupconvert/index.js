import getCustom from "../util/getCustom.js";

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
	const { leads } = req.body
	const { status } = leads
	status.forEach(async lead => {
		const lead_info = await app.kommo.LeadFind(lead.id)
		const contact = await app.kommo.ContactFind(lead_info._embedded.contacts[0].id)
		const phone = getCustom(contact, 1876814, "value")
		app.broker.request({
			"title":"Convert & Você", 
			"baseParticipantsToAdd": [`${phone.replace("+", "")}@c.us`, "555499437851@c.us"], 
			"picture": "https://convertagencia.com/_img/laskdj0123ij4klwdjf0s.jpeg"
		}, "WHATSAPPConvert", "whatsapp", "creategroup", "grupoduo")
	});
	res.json({ msg: "success" })
}