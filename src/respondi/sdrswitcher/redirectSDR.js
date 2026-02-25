
/**
 * @typedef { import("../../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    const classificador = req.params.classificador
    if(!app.sdrDoClassificador[classificador]) 
        return res.redirect("https://api.whatsapp.com/send/?phone=555496799951&text=Quero+uma+vaga+para+a+Consultoria+Gratuita&type=phone_number&app_absent=0")
    console.log(app.sdrDoClassificador[Number(classificador)])
    res.redirect(`https://redireciona.ogrupoduo.com.br/?url=${app.sdrDoClassificador[Number(classificador)].sdr.url}`)
}