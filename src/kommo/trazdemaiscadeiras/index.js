/**
 * @typedef { import("../app").default } App
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
		lead_info.custom_fields_values.forEach(field => {
			if (field.field_id === 1879843) {
				field.values[0].value.split(",").map(Number).forEach(async (lead_id) => {
					if (!lead_id) return;
					app.kommo.moveLeadToStatus(lead_id, lead_info.status_id)
				})
			}
		})
	});
	res.json({ msg: "success" })
}