import getDataFromEvent from "../../calendly/getDataFromEvent.js";
import EventoAgendamento from "../../domain/agendamento.js";
import leadToPedido from "../../omnie/util/leadToPedido.js";
import getCustom from "../util/getCustom.js";

const insightfunctionsmap = {
    "status": (lead) => {
        console.log("status:", lead)
    },
    "add": (lead) => {
        console.log("add:", lead)
    },
    /**
     * @typedef { import("../../app").default } App
     * @param {App} app 
     * @param {*} lead 
     * @returns 
     */
    "update": async (app, lead) => {
        const compareceu = getCustom(lead, "1879555", "enum")
        if (compareceu) {
            app.repository.updateMany("Eventos", { lead_id: lead.id, status_id: 76076812 }, { compareceu })
        }
        return
        //toda vez que chegar um update, vai olhar:
        //reuniao
        //responsavel agendamento
        //closer
        //compareceu
        // pegar todos antes depois verificar se tem reuniao
        if (!lead.custom_fields) return;
        // pegando último evento do lead
        const data_reuniao_str = getCustom(lead, "1878999", "value")
        if (!data_reuniao_str) return
        const data_reuniao = new Date(Number(data_reuniao_str) * 1000)
        const values = {
            responsavel: getCustom(lead, "1879503", "enum"),
            closer: getCustom(lead, "1880511", "enum"),
            compareceu: getCustom(lead, "1879555", "enum"),
        }

        const query = { lead_id: Number(lead.id), data_reuniao }
        const [evento] = await app.repository.findOne("Eventos", query)

        if (!evento) {
            const agendamento = new EventoAgendamento(lead, data_reuniao)
            Object.assign(agendamento, values)
            app.repository.create("Eventos", agendamento)
        } else {
            const update = Object.assign({}, values)
            app.repository.update("Eventos", evento._id, update)
        }
        app.io.sockets.emit("update", evento)
    }
}
//                  inicio    Filtragem     SS           LD       Formula       MQL         SQL         atend.
const eventos = ["76679456", "77198212", "80718524", "77166852", "88272836", "76679460", "76679464", "76076808", "88208932", /* "76076812" */, "76076908", "142", "143"]

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    const { leads, backup_date } = req.body
    res.status(200).json({ msg: "success" })
    for (const key in leads) {
        if (key === "update") {
            insightfunctionsmap[key](app, leads[key][0])
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(insightfunctionsmap, key)) continue;
        leads[key].forEach(async lead => {
            if (lead.pipeline_id !== "9907288" || (/test/i).test(lead.name)) return;

            if (!eventos.find((e) => e === lead.status_id)) return;

            if (lead.status_id === "77198212") {
                getDataFromEvent(app, lead.id)
                return
            }

            const evento = {
                type: key,
                lead_id: Number(lead.id),
                status_id: Number(lead.status_id),
                pipeline_id: Number(lead.pipeline_id),
                date: req.path.startsWith("/teste") ? new Date(backup_date) : new Date(),
            }

            if (lead.custom_fields) {
                const source = lead.custom_fields.find(c => c.id === "1876828" || c.id === "1876832")
                if (source) evento.source = source.id === "1876828" ? source.values[0].value : "socialseller"
            }

            if (lead.tags) {
                const source = lead.tags.find(c => c.id === "116803")
                if (source) evento.source = "socialseller"
            }

            if (lead.status_id === "142") {
                console.log(JSON.stringify(lead))
                //TODO: aqui vai criar cliente e pedido no Omnie
                //leadToPedido(app, lead) comentado pois esta sendo enviado via webhook no kommo
                evento.price = Number(lead.price)
                const [event] = await app.repository.findOne("Eventos", {
                    lead_id: evento.lead_id,
                    status_id: evento.status_id
                });

                if (event) return;
                //await app.kommo.LeadFind(evento.lead_id)
                Object.assign(evento, {
                    name: lead.name,
                    product: getCustom(lead, "1879015", "enum"),
                    closer: getCustom(lead, "1880511", "enum"),
                });
                if (lead.tags) {
                    const type = lead.tags.find(c => c.id === "115613" || c.id === "115611")
                    if (type) evento.lead_type = type.name
                }
            }

            if (lead.status_id === "143") {
                Object.assign(evento, {
                    name: lead.name,
                    closer: getCustom(lead, "1880511", "enum"),
                });
                await app.repository.deleteMany("Eventos", {
                    lead_id: evento.lead_id,
                    status_id: 142
                });

            }


            if (lead.status_id === "76679456" || lead.status_id === "142" || lead.status_id === "143" || lead.status_id === "76679460" || lead.status_id === "76679464" || lead.status_id === "88272836") {
                const content = getCustom(lead, "1876822", "value")
                if (content) {
                    evento.content = content
                    evento.term = getCustom(lead, "1876830", "value")
                }
            }

            if (lead.status_id === "88208932" || lead.status_id === "76076908" || lead.status_id === "142" || lead.status_id === "143") {
                const compareceu = getCustom(lead, "1879555", "enum")
                if (compareceu) {
                    evento.compareceu = compareceu
                    const [reunioes, err] = await app.repository.findMany("Eventos", { lead_id: Number(lead.id), status_id: 76076812 })
                    reunioes.forEach(r => {
                        app.repository.update("Eventos", r._id, { compareceu: compareceu.toString() })
                        r.compareceu = compareceu
                        app.io.sockets.emit("update", r)
                    })
                }
            }

            if(lead.status_id === "76076808") {
                const responsavelA = getCustom(lead, "1879503", "enum")
                if(responsavelA)
                    evento.responsavelA = responsavelA
                evento.name = lead.name
            }

            //console.log(lead)
            if (req.path.startsWith("/teste")) {
                console.log(evento)
                const [has_evento, err] = await app.repository.findOne("Eventos", {
                    type: evento.type,
                    lead_id: evento.lead_id,
                    status_id: evento.status_id,
                })
                if(has_evento)
                return console.log("ja tem evento:", evento.type)
            }
            app.repository.create("Eventos", evento)
            app.io.sockets.emit("evento", evento)
            //insightfunctionsmap[key](lead);
        })
    }
}