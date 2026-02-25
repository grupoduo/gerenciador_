export default class KommoAPI {
    constructor(subdomain, token) {
        this.url = `https://${subdomain}.kommo.com/api/v4`;
        this.token = token
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        }
    }

    moveLeadToStatus(lead_id, status_id) {
        return this.LeadUpdate(lead_id, { status_id })
    }

    ContactCreate(object) {
        const body = {};
        if (object) Object.assign(body, object);
        return fetch(`${this.url}/contacts`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify([body])
        })
    }

    ContactUpdate(lead_id, object) {
        return fetch(`${this.url}/contacts/${lead_id}`, {
            method: "PATCH",
            headers: this.headers,
            body: JSON.stringify(object)
        })
    }

    ContactFind(lead_id) {
        return fetch(`${this.url}/contacts/${lead_id}`, {
            method: "GET",
            headers: this.headers,
        }).then(res => res.json())
    }

    FindByQuery(entity, query) {
        return fetch(`${this.url}/${entity}?${query}`, {
            method: "GET",
            headers: this.headers,
        }).then(res => {
            if (res.status !== 200) return false
            return res.json()
        }).catch(() => console.error("Error: FindByQuery ", entity, query))
    }

    LeadCreate(pipeline_id, status_id, name, object) {
        const body = {
            name,
            status_id,
            pipeline_id
        };

        if (object) Object.assign(body, object);

        return fetch(`${this.url}/leads`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify([body])
        })
    }
    LeadUpdate(lead_id, object) {
        return fetch(`${this.url}/leads/${lead_id}`, {
            method: "PATCH",
            headers: this.headers,
            body: JSON.stringify(object)
        })
    }

    LeadFind(lead_id) {
        return fetch(`${this.url}/leads/${lead_id}?with=contacts`, {
            method: "GET",
            headers: this.headers
        }).then(res => new Promise(resolve => {
            res.json()
                .then(value => resolve(value))
                .catch(() => resolve(null))
        })).catch((reason) => {
            console.log(reason)
            return null
        })
    }

    EventsFromLead(lead_id, create_at) {
        return fetch(`${this.url}/events?filter[created_at][from]=${create_at}&filter[entity]=lead&filter[entity_id]=${lead_id}`, {
            method: "GET",
            headers: this.headers
        }).then(res => {
            if (!res.body) return {}
            return new Promise(resolve => {
                res.json()
                    .then(value => resolve(value))
                    .catch(() => resolve({}))
            })
        })
    }

    AllEventsFromLead(lead_id) {
        return fetch(`${this.url}/events?filter[entity]=lead&filter[entity_id]=${lead_id}`, {
            method: "GET",
            headers: this.headers
        }).then(res => {
            if (!res.body) return {}
            return new Promise(resolve => {
                res.json()
                    .then(value => resolve(value))
                    .catch(() => resolve({}))
            }).catch(() => false)
        }).catch(() => false)
    }

    getContactFromLead(lead_id) {
        return fetch(`${this.url}/contacts?_embedded[leads][0][id]=${lead_id}`, {
            method: "GET",
            headers: this.headers
        }).then(res => res.json())
    }

    FindByID(entity, id) {
        return fetch(`${this.url}/leads/${entity}/${id}`, {
            method: "GET",
            headers: this.headers
        }).then(res => res.json())
    }

    StageCreate(pipeline_id, name, sort, color) {
        return fetch(`${this.url}/leads/pipelines/${pipeline_id}/statuses`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify([{
                name,
                sort,
                color
            }])
        })
    }
}