import leadToPedido from "../../omnie/util/leadToPedido.js";

/**
 * @typedef { import("../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
	res.json({ msg: "ok" })
    const { leads } = req.body
    let { add, status } = leads
    if(!add) add = status;
    if(!add) return
    add.forEach(async lead => {
		leadToPedido(app, lead)
	});
}