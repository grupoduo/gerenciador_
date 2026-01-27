export default class Evento { 
    constructor(key, lead_id, status_id, pipeline_id, date) {
        this.type = key
        this.lead_id = Number(lead_id)
        this.status_id = Number(status_id)
        this.pipeline_id = Number(pipeline_id)
        this.date = date
    }
}