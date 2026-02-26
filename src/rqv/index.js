import fillform from "./types/fillform.js";
import formulario from "./types/formulario.js";

// Mapeamento dos tipos de eventos
const typesMaps = {
    fillform,
    formulario
}

/**
 * @typedef { import("../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.send("ok")
    const data = req.body
    data.type = req.params.type
    data.date = new Date()
    app.repository.create("LeadsFromRQV", data)

    if (typesMaps[data.type])
        typesMaps[data.type](app, data)
};
