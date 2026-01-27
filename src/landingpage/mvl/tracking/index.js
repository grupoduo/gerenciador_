import preFormulario from "../preFormulario/index.js";

const handlersMap = {
    "preformulario": preFormulario
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
    const {type, data} = req.body
    if(Object.prototype.hasOwnProperty.call(handlersMap, type))
        handlersMap[type](app, data)
};


