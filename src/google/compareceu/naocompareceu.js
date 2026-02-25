/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({msg: "ok"})
    const { leads } = req.body
    const { add } = leads
    if(!add) return

    add.forEach(async lead => {
        const [reunioes, err] = await app.repository.findMany("Eventos", {status_id: 76076812, lead_id: Number(lead.id)})
        if(err) return
        reunioes.forEach(async r => {
            if(r.compareceu) return
            const date = new Date(r.date)
            if(new Date().getTime() < date.getTime()) return
            
            await app.repository.update("Eventos", r._id, { compareceu: "1300127" })
            r.compareceu = "1300127"
            app.io.sockets.emit("update", r)
        })
    })
}