export default class CalendlyAPI {
    constructor() {
        this.url = `https://api.calendly.com`;
        //this.token = token
        /* this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        } */
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

    getEvent(uuid, token) {
        return fetch(`${this.url}/scheduled_events/${uuid}`, {
            method: "GET",
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${token}`
            },
        }).then(res => {
            if (res.status !== 200) return false
            return new Promise(resolve => {
                res.json()
                    .then(value => resolve(value))
                    .catch(() => resolve(false))
            })
        })
    }

    async refreshToken(repostiory, agenda) {
        //console.log(agenda)
        const credentials = `Q09UBAKqtkbXAe0-BdU8wIVt-WYPjpQ6gfRvYaBS6O8:bUtYEUxe3-lzsKZVoVUkbGAfAJO1LQyitC5E2K8lVDM`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        const requestBody = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: agenda.calendly.refresh_token,
            client_id: "Q09UBAKqtkbXAe0-BdU8wIVt-WYPjpQ6gfRvYaBS6O8",
        }).toString();

        const result = await fetch(`https://auth.calendly.com/oauth/token`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${encodedCredentials}`
            },
            body: requestBody
        }).then(res => {
            if (res.status !== 200) return false
            return new Promise(resolve => {
                res.json()
                    .then(value => resolve(value))
                    .catch(() => resolve(false))
            })
        }).catch(err => console.log(err));

        if (!result) return agenda.calendly.access_token
        repostiory.update("Agendas", agenda._id, { calendly: result })
        return result.access_token
    }

    FindByQuery(entity, query) {
        return fetch(`${this.url}/${entity}?${query}`, {
            method: "GET",
            headers: this.headers,
        }).then(res => {
            if (res.status !== 200) return false
            return res.json()
        })
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
        }))
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
            })
        })
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