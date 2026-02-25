import customsToObject from "../kommo/util/customsToObject.js";
import Evento from "./evento.js";

export default class EventoAgendamento extends Evento {
    constructor(lead, date) {
        super("status", lead.id, 76076812, lead.pipeline_id, date)
        this.data_reuniao = date
        this.name = lead.name;
        const custom = customsToObject(lead)
        if (custom['1880511'])
            this.closer = custom['1880511'].values[0].enum_id.toString()
        const source = custom["1876828"]
        if (source) this.source = source.values[0].value
        const content = custom["1876822"]
        if (content) {
            this.content = content.values[0].value
            this.term = custom["1876830"] ? custom["1876830"].values[0].value : ""
        }
    }
}