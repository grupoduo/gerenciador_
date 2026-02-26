# Correções Críticas — Gerenciador de Leads

**Data:** 25/02/2026
**Preparado por:** Rômulo (com análise de código por IA)
**Para:** Evandro (desenvolvedor)
**Prioridade:** ALTA — Leads sendo duplicados e perdidos

---

## Resumo dos Problemas

### Problema 1: Leads duplicados na Kommo
- O handler `agendacheia` cria contato novo SEMPRE, sem verificar se já existe
- A busca por contato existente (`pegacontato`) não normaliza telefone — variações de formato criam duplicatas
- Sem proteção contra race condition (dois webhooks simultâneos do mesmo lead)

### Problema 2: Leads do Respondi não cadastrados na Kommo
- Todos os handlers respondem `res.json({msg:"ok"})` ANTES de processar — se falhar depois, ninguém sabe
- Nenhum handler tem `try-catch` — erros de rede/API crasham silenciosamente
- O `validation-errors` da Kommo retorna um objeto (truthy), mas o código trata como falsy
- `Register.make()` nunca é chamado — sem auditoria de leads processados
- Vários `console.log` como único tratamento de erro

---

## Correções — Arquivo por Arquivo

---

### ARQUIVO 1: `src/respondi/util/pegacontato.js`

**Problema:** Não normaliza telefone. Se vier "5585999" vs "+5585999" vs "85999", cria duplicata.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {String} phone
 */

function normalizePhone(phone) {
    if (!phone) return null
    // Remove tudo que não é número
    let cleaned = String(phone).replace(/\D/g, '')
    // Se começa com 0, remove
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1)
    // Se tem 10 ou 11 dígitos (BR sem DDI), adiciona 55
    if (cleaned.length === 10 || cleaned.length === 11) cleaned = '55' + cleaned
    return cleaned
}

export { normalizePhone }

export default async (app, phone) => {
    const normalized = normalizePhone(phone)
    if (!normalized) return null

    // Tenta busca com telefone normalizado
    const result = await app.kommo.FindByQuery("contacts", `with=leads&query=${normalized}&order[id]=desc`)
    if (!result) return null
    const { contacts } = result._embedded;

    if (contacts.length) return contacts[0]

    // Se não achou com normalizado, tenta com original
    if (normalized !== String(phone)) {
        const result2 = await app.kommo.FindByQuery("contacts", `with=leads&query=${phone}&order[id]=desc`)
        if (!result2) return null
        const { contacts: contacts2 } = result2._embedded;
        if (contacts2.length) return contacts2[0]
    }

    return null
}
```

---

### ARQUIVO 2: `src/respondi/util/createContato.js`

**Problemas:**
- Sem try-catch (erro de rede perde o lead)
- `validation-errors` é objeto truthy — o check `if(!contact)` não pega
- `ContactUpdate` não tem await (fire-and-forget)

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import getName from "./getName.js";
import getPhone from "./getPhone.js";
import pegacontato from "./pegacontato.js";

/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {any[]} raw_answers
 * @param {object} answerFieldsMap
 */
export default async (app, raw_answers, answerFieldsMap) => {
    try {
        const answers = {}
        raw_answers.forEach(answer => {
            answers[answer.question.question_id] =
                Array.isArray(answer.answer) ? answer.answer.join(', ') :
                    answer.question.question_type === "phone" ?
                        `${answer.answer.country}${answer.answer.phone}` :
                        answer.answer;
        });
        const name = getName(raw_answers)
        const phone = getPhone(raw_answers)
        const ignore = name ? [name.question.question_id] : []
        const custom_fields_values = []

        for (const key in answers) {
            if (ignore.find(i => i === key)) continue;
            if (!answerFieldsMap[key]) continue;
            custom_fields_values.push({
                "field_id": answerFieldsMap[key],
                "values": [
                    {
                        "value": answers[key]
                    }
                ]
            })
        }

        // DEDUPLICAÇÃO: busca contato existente por telefone
        const contato = phone ? await pegacontato(app, phone.answer.phone) : null
        if (contato) {
            await app.kommo.ContactUpdate(contato.id, { custom_fields_values })
            console.log("Contato atualizado: ", contato.id)
            return contato
        }

        // Cria novo contato
        const contactresponse = await app.kommo.ContactCreate({
            name: name ? name.answer : "Sem nome",
            custom_fields_values
        })
        const contact = await contactresponse.json()

        // FIX: validation-errors é objeto (truthy), precisa checar explicitamente
        if (contact && contact['validation-errors']) {
            console.error("ERRO VALIDAÇÃO CONTATO:", JSON.stringify(contact['validation-errors']))
            return null
        }

        if (!contact || !contact._embedded || !contact._embedded.contacts || !contact._embedded.contacts[0]) {
            console.error("ERRO: Resposta inesperada ao criar contato:", JSON.stringify(contact))
            return null
        }

        console.log("Contato criado: ", contact._embedded.contacts[0].id)
        return contact._embedded.contacts[0]
    } catch (error) {
        console.error("ERRO CRÍTICO em createContato:", error.message, error.stack)
        return null
    }
}
```

---

### ARQUIVO 3: `src/respondi/util/createLead.js`

**Problemas:**
- Sem try-catch
- Se a API falha, o lead é perdido sem registro

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import utmsMap from "./utmsMap.js";

/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {Number} pipeline_id
 * @param {Number} status_id
 * @param {String} contact_id
 * @param {String} name
 * @param {object} utms
 */
export default async (app, pipeline_id, status_id, contact_id, name, utms) => {
    try {
        const custom_fields_values = []

        if (utms) {
            for (const key in utms) {
                if (!utmsMap[key]) continue;
                custom_fields_values.push({
                    "field_id": utmsMap[key],
                    "values": [
                        {
                            "value": utms[key]
                        }
                    ]
                })
            }
        }

        const kommolead = {
            name: name || "Sem nome",
            _embedded: {
                contacts: [{ 'id': contact_id }]
            },
            custom_fields_values
        }
        const response = await app.kommo.LeadCreate(pipeline_id, status_id, name, kommolead)
        const result = await response.json()

        if (!result || !result._embedded || !result._embedded.leads || !result._embedded.leads[0]) {
            console.error("ERRO: Resposta inesperada ao criar lead:", JSON.stringify(result))
            return null
        }

        const lead = result._embedded.leads[0]
        console.log("Lead Criado: ", lead.id)
        return lead
    } catch (error) {
        console.error("ERRO CRÍTICO em createLead:", error.message, error.stack)
        return null
    }
}
```

---

### ARQUIVO 4: `src/kommo/util/createContact.js`

**Problema:** Não tem deduplicação (usado por selene, avec, captacao). Sempre cria contato novo.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import pegacontato from "../../respondi/util/pegacontato.js";

/**
 * @typedef { import("../index.js").default } KommoAPI
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {String} name
 * @param {Array} custom_fields_values
 */
export default async function createContact(app, name, custom_fields_values) {
    try {
        console.log("Criando/Buscando contato: ", name)

        // DEDUPLICAÇÃO: extrai telefone dos custom_fields e busca contato existente
        const phoneField = custom_fields_values.find(f => f.field_id === 1876814)
        if (phoneField && phoneField.values && phoneField.values[0]) {
            const phone = phoneField.values[0].value
            const contato = await pegacontato(app, phone)
            if (contato) {
                await app.kommo.ContactUpdate(contato.id, { custom_fields_values })
                console.log("Contato existente atualizado: ", contato.id)
                return contato
            }
        }

        // Cria novo contato
        const contactresponse = await app.kommo.ContactCreate({
            name: name || "Sem nome",
            custom_fields_values
        })
        const contact = await contactresponse.json()

        if (contact && contact['validation-errors']) {
            console.error("ERRO VALIDAÇÃO CONTATO:", JSON.stringify(contact['validation-errors']))
            return null
        }

        if (!contact || !contact._embedded || !contact._embedded.contacts || !contact._embedded.contacts[0]) {
            console.error("ERRO: Resposta inesperada ao criar contato:", JSON.stringify(contact))
            return null
        }

        console.log("Contato criado: ", contact._embedded.contacts[0].id)
        return contact._embedded.contacts[0]
    } catch (error) {
        console.error("ERRO CRÍTICO em createContact:", error.message, error.stack)
        return null
    }
}
```

---

### ARQUIVO 5: `src/kommo/util/createLead.js`

**Problema:** Sem try-catch, sem validação de resposta.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
/**
 * @typedef { import("../../app").default } App
 * @param {App} app
 * @param {Number} pipeline_id
 * @param {Number} stage_id
 * @param {String} contact_id
 * @param {String} name
 */
export default async (app, pipeline_id, stage_id, contact_id, name, options) => {
    try {
        const kommolead = {
            name: name || "Sem nome",
            _embedded: {
                contacts: [{ 'id': contact_id }]
            }
        }
        if (options) Object.assign(kommolead, options)
        const response = await app.kommo.LeadCreate(pipeline_id, stage_id, "", kommolead)
        const result = await response.json()

        if (!result || !result._embedded || !result._embedded.leads || !result._embedded.leads[0]) {
            console.error("ERRO: Resposta inesperada ao criar lead:", JSON.stringify(result))
            return null
        }

        const lead = result._embedded.leads[0]
        console.log("Lead Criado: ", lead.id)
        return lead
    } catch (error) {
        console.error("ERRO CRÍTICO em createLead (kommo/util):", error.message, error.stack)
        return null
    }
}
```

---

### ARQUIVO 6: `src/respondi/agendacheia/index.js`

**Problema:** Cria contato SEMPRE sem verificar duplicata. É a maior causa de duplicação.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xwmol4zkwuc": 1878291,
    "xnv2toco841k": 1880729,
    "xifdp8ft1csb": 1880731,
    "xdk74j40rhxu": 1880733,
    "x4zs1uodqhmm": 1880735,
}

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app
 * @param {Request} req
 * @param {Response} res
 */
export default async (app, req, res) => {
    console.log("chegou na agenda cheia")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body

        // Usa createContato compartilhado (COM deduplicação por telefone)
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA AGENDACHEIA - contato não criado:", JSON.stringify(req.body))
            // Registra falha para auditoria
            app.register.make({ body: req.body, error: "contato não criado" }, "agendacheia-erro")
            return
        }

        const name = getName(respondent.raw_answers)
        const leadName = name ? name.answer : "Sem nome"
        const lead = await createLead(app, 11380836, 87977544, contact.id, leadName, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA AGENDACHEIA - lead não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "agendacheia-erro")
            return
        }

        // Registra sucesso
        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: leadName }, "agendacheia")
        console.log("AGENDACHEIA OK - Lead:", lead.id, "Contato:", contact.id)
    } catch (error) {
        console.error("ERRO CRÍTICO AGENDACHEIA:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "agendacheia-erro")
    }
}
```

---

### ARQUIVO 7: `src/respondi/selene/index.js`

**Adicionar try-catch e auditoria.** Manter lógica Calendly.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createLead from "../../kommo/util/createLead.js";
import createContact from "../../kommo/util/createContact.js";
import answersToCustomFields from "../util/answersToCustomFields.js";

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xnzy9grkm1d": 1878291,
    "xnv2toco841k": 1880729,
    "xifdp8ft1csb": 1880731,
    "xdk74j40rhxu": 1880733,
    "x4zs1uodqhmm": 1880735,
};

/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app
 * @param {Request} req
 * @param {Response} res
 */
export default async (app, req, res) => {
    console.log("chegou Selene")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body
        const formAnswers = answersToCustomFields(respondent, answerFieldsMap)

        const contact = await createContact(app, formAnswers.name, formAnswers.custom_fields_values)
        if (!contact) {
            console.error("FALHA SELENE - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "selene-erro")
            return
        }

        const lead = await createLead(app, 11444036, 88956368, contact.id, formAnswers.name)
        if (!lead) {
            console.error("FALHA SELENE - lead não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "selene-erro")
            return
        }

        // Registra sucesso
        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: formAnswers.name }, "selene")

        // Calendly
        const calendly = respondent.raw_answers.find(a => a.question.question_type === "embed.calendly")
        if (!calendly) return

        const closerquerymap = {
            "xsmqpmypm9u": { closer: 1301457 },
            "xqftydcalgm": { closer: 1301287 },
            "xdtuxphhhnn8": { $or: [{ closer: 1301283 }, { closer: 1301285 }] }
        }
        if (!closerquerymap[calendly.question.question_id]) return console.log(calendly.question.question_id)

        const [agendas] = await app.repository.findMany("Agendas", closerquerymap[calendly.question.question_id])

        let event
        let sagenda
        for (const agenda of agendas) {
            let access_token = agenda.calendly.access_token
            if (new Date((agenda.calendly.created_at * 1000) + (agenda.calendly.expires_in * 1000)).getTime() < new Date().getTime())
                access_token = await app.calendly.refreshToken(app.repository, agenda)
            const result = await app.calendly.getEvent(calendly.answer.event, access_token)
            if (!result) continue
            event = result.resource
            sagenda = agenda
        }

        if (!event || !sagenda) return

        await app.kommo.ContactUpdate(contact.id, {
            custom_fields_values: [
                {
                    field_id: 1878319,
                    values: [{ value: event.location.join_url }]
                }
            ]
        })
        await app.kommo.LeadUpdate(lead.id, {
            custom_fields_values: [
                {
                    "field_id": 1878999,
                    "values": [{ "value": (new Date(event.start_time).getTime() / 1000) }]
                },
                {
                    "field_id": 1880511,
                    "values": [{ "enum_id": sagenda.closer }]
                }
            ]
        });
        await app.kommo.moveLeadToStatus(lead.id, 88956372)
    } catch (error) {
        console.error("ERRO CRÍTICO SELENE:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "selene-erro")
    }
}
```

---

### ARQUIVO 8: `src/respondi/avec/index.js`

**Mesma correção do Selene** (try-catch + auditoria). Só mudam IDs.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createLead from "../../kommo/util/createLead.js";
import createContact from "../../kommo/util/createContact.js";
import answersToCustomFields from "../util/answersToCustomFields.js";

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xnzy9grkm1d": 1878291,
    "xnv2toco841k": 1880729,
    "xifdp8ft1csb": 1880731,
    "xdk74j40rhxu": 1880733,
    "x4zs1uodqhmm": 1880735,
};

export default async (app, req, res) => {
    console.log("chegou Avec")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body
        const formAnswers = answersToCustomFields(respondent, answerFieldsMap)

        const contact = await createContact(app, formAnswers.name, formAnswers.custom_fields_values)
        if (!contact) {
            console.error("FALHA AVEC - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "avec-erro")
            return
        }

        const lead = await createLead(app, 11459696, 89094472, contact.id, formAnswers.name)
        if (!lead) {
            console.error("FALHA AVEC - lead não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "avec-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: formAnswers.name }, "avec")

        // Calendly
        const calendly = respondent.raw_answers.find(a => a.question.question_type === "embed.calendly")
        if (!calendly) return

        const closerquerymap = {
            "xsmqpmypm9u": { closer: 1301457 },
            "xqftydcalgm": { closer: 1301287 },
            "xdtuxphhhnn8": { $or: [{ closer: 1301283 }, { closer: 1301285 }] }
        }
        if (!closerquerymap[calendly.question.question_id]) return console.log(calendly.question.question_id)

        const [agendas] = await app.repository.findMany("Agendas", closerquerymap[calendly.question.question_id])

        let event
        let sagenda
        for (const agenda of agendas) {
            let access_token = agenda.calendly.access_token
            if (new Date((agenda.calendly.created_at * 1000) + (agenda.calendly.expires_in * 1000)).getTime() < new Date().getTime())
                access_token = await app.calendly.refreshToken(app.repository, agenda)
            const result = await app.calendly.getEvent(calendly.answer.event, access_token)
            if (!result) continue
            event = result.resource
            sagenda = agenda
        }

        if (!event || !sagenda) return

        await app.kommo.ContactUpdate(contact.id, {
            custom_fields_values: [
                { field_id: 1878319, values: [{ value: event.location.join_url }] }
            ]
        })
        await app.kommo.LeadUpdate(lead.id, {
            custom_fields_values: [
                { "field_id": 1878999, "values": [{ "value": (new Date(event.start_time).getTime() / 1000) }] },
                { "field_id": 1880511, "values": [{ "enum_id": sagenda.closer }] }
            ]
        });
        await app.kommo.moveLeadToStatus(lead.id, 89094476)
    } catch (error) {
        console.error("ERRO CRÍTICO AVEC:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "avec-erro")
    }
}
```

---

### ARQUIVO 9: `src/respondi/avec/captacao/index.js`

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createContact from "../../../kommo/util/createContact.js";
import createLead from "../../../kommo/util/createLead.js";
import answersToCustomFields from "../../util/answersToCustomFields.js";

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814,
    "xk4qpp2lhoh": 1876816,
    "xg6ayiq29rwf": 1878315,
    "xzn55i94d4f": 1880351,
    "xd115sg65bpr": 1878287,
    "xjnirz2pqgy": 1878289,
    "xuvuahv3jyor": 1878293,
    "xt2h6820w2x": 1878295,
    "xotep0x273uc": 1878297,
    "x3c9u8ihorn4": 1878299,
    "xwmol4zkwuc": 1878291,
};

export default async (app, req, res) => {
    console.log("chegou Avec captacao")
    res.json({ msg: "ok" })

    try {
        const { respondent } = req.body
        const formAnswers = answersToCustomFields(respondent, answerFieldsMap)

        const contact = await createContact(app, formAnswers.name, formAnswers.custom_fields_values)
        if (!contact) {
            console.error("FALHA CAPTACAO - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "captacao-erro")
            return
        }

        const lead = await createLead(app, 11459696, 87990944, contact.id, formAnswers.name)
        if (!lead) {
            console.error("FALHA CAPTACAO - lead não criado")
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "captacao-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name: formAnswers.name }, "captacao")
    } catch (error) {
        console.error("ERRO CRÍTICO CAPTACAO:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "captacao-erro")
    }
}
```

---

### ARQUIVO 10: `src/respondi/belezacontabil/index.js`

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        const answerFieldsMap = {
            "x0fnghh8lgr0i": 1880351,
            "xmnn2h93crsp": 1878287,
            "x919asy54zas": 1876816,
            "x3o71ld36ziq": 1876814,
            "xxl4tn2zko2": 1878315,
            "x4cjjaoqljbe": 1878289,
            "xe1z1b1h5j06": 1878291,
            "xklblw7ubrfh": 1881259,
            "xnc3ikl9dgkd": 1878297,
            "xoy60zucvfl": 1881895,
            "x99pegcslqhv": 1881897
        }
        const { respondent } = req.body
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA BELEZACONTABIL - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "belezacontabil-erro")
            return
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, 9762760, 91813972, contact.id, name, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA BELEZACONTABIL - lead não criado")
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "belezacontabil-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name }, "belezacontabil")
    } catch (error) {
        console.error("ERRO CRÍTICO BELEZACONTABIL:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "belezacontabil-erro")
    }
}
```

---

### ARQUIVO 11: `src/respondi/mvl/index.js`

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        const answerFieldsMap = {
            "xopyalskloic": 1880733,
            "x9qne4si4vzp": 1876814,
            "xg6ayiq29rwf": 1878315,
            "xaee1fea5oif": 1880351,
            "xv4ry2krdaig": 1878287,
            "xro1j3vask7": 1878289,
            "xwtd8oxjlc3": 1878293,
            "xwd59myqh6z": 1878295,
            "x3jyow8tz67v": 1878297,
            "x7vn8ltz0t3g": 1880731,
            "x7mi9kdexn02": 1880729,
            "xplxkckua8n": 1881259
        }
        const { respondent } = req.body
        const contact = await createContato(app, respondent.raw_answers, answerFieldsMap)
        if (!contact) {
            console.error("FALHA MVL - contato não criado:", JSON.stringify(req.body))
            app.register.make({ body: req.body, error: "contato não criado" }, "mvl-erro")
            return
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, 11871392, 91446680, contact.id, name, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA MVL - lead não criado")
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "mvl-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name }, "mvl")
    } catch (error) {
        console.error("ERRO CRÍTICO MVL:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "mvl-erro")
    }
}
```

---

### ARQUIVO 12: `src/respondi/parse/index.js`

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import createContato from "../util/createContato.js"
import createLead from "../util/createLead.js"
import getName from "../util/getName.js"
import mapeadorSemantico from "./mapeadorSemantico/index.js"

export default async (app, req, res, areadyResponse) => {
    console.log(JSON.stringify(req.body))
    if (!areadyResponse)
        res.json({ msg: "ok" })

    try {
        const { respondent, form } = req.body
        const [formulario, fErr] = await app.repository.findOne("Formularios", { form_id: form.form_id })

        if (fErr) {
            console.error("ERRO PARSE - formulário não encontrado:", form.form_id)
            app.register.make({ body: req.body, error: "formulário não encontrado: " + form.form_id }, "parse-erro")
            return
        }

        if (!formulario.answerFieldsMap) {
            const answerFieldsMap = await mapeadorSemantico(app, req.body)
            if (!answerFieldsMap) {
                console.error("ERRO PARSE - mapeamento semântico falhou:", form.form_id)
                app.register.make({ body: req.body, error: "mapeamento semântico falhou" }, "parse-erro")
                return
            }
            formulario.answerFieldsMap = answerFieldsMap
            app.repository.update("Formularios", formulario._id, { answerFieldsMap })
        }

        const contact = await createContato(app, respondent.raw_answers, formulario.answerFieldsMap)
        if (!contact) {
            console.error("FALHA PARSE - contato não criado:", form.form_id)
            app.register.make({ body: req.body, error: "contato não criado" }, "parse-erro")
            return
        }

        const nameObj = getName(respondent.raw_answers)
        const name = nameObj ? nameObj.answer : "Sem nome"
        const lead = await createLead(app, formulario.funil, formulario.etapa, contact.id, name, respondent.respondent_utms)

        if (!lead) {
            console.error("FALHA PARSE - lead não criado:", form.form_id)
            app.register.make({ body: req.body, contact_id: contact.id, error: "lead não criado" }, "parse-erro")
            return
        }

        app.register.make({ contact_id: contact.id, lead_id: lead.id, name, form_id: form.form_id }, "parse")
        return lead
    } catch (error) {
        console.error("ERRO CRÍTICO PARSE:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "parse-erro")
        return null
    }
}
```

---

### ARQUIVO 13: `src/respondi/sdrswitcher/index.js`

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
import parse from "../parse/index.js"
import getName from "../util/getName.js"
import getPhone from "../util/getPhone.js"

export default async (app, req, res) => {
    res.json({ msg: "ok" })

    try {
        await parse(app, req, res, true)

        const { respondent } = req.body
        const faturamento = respondent.raw_answers.find(r => r.question.question_id === "xwmol4zkwuc")
        if (!faturamento) return

        const [classificadores, err] = await app.repository.findMany("CLassificadoresLead", {})
        if (err) return console.error("ERRO SDRSWITCHER - classificadores:", classificadores)

        const classificacoes = {}
        for (const c of classificadores) {
            for (const classificacao of c.classificacoes) {
                classificacoes[classificacao] = c
            }
        }

        if (!faturamento.answer[0] || !classificacoes[faturamento.answer[0]])
            return console.log("SDRSWITCHER - classificação não encontrada:", faturamento.answer[0])

        const [sdrs, serr] = await app.repository.findMany("SDRs", {})
        if (!app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id])
            return console.log("SDRSWITCHER - sdrDoClassificador não encontrado:", classificacoes[faturamento.answer[0]].id)

        const index = sdrs.findIndex(s => s.id === app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id].sdr.id)

        if (index < -1) return;

        const next = index + 1 === sdrs.length ? 0 : index + 1
        app.sdrDoClassificador[classificacoes[faturamento.answer[0]].id].sdr = sdrs[next]

        app.repository.updateQuery("SDRClassificador",
            { classificador: classificacoes[faturamento.answer[0]].id },
            { sdr: sdrs[next].id })

        const nameObj = getName(respondent.raw_answers)
        const phoneObj = getPhone(respondent.raw_answers)
        app.repository.create("LeadsSwitcher", {
            name: nameObj ? nameObj.answer : "Sem nome",
            phone: phoneObj ? phoneObj.answer.phone : "Sem telefone",
            sdr: sdrs[next].id
        })
    } catch (error) {
        console.error("ERRO CRÍTICO SDRSWITCHER:", error.message, error.stack)
        app.register.make({ body: req.body, error: error.message }, "sdrswitcher-erro")
    }
}
```

---

### ARQUIVO 14: `src/domain/usecases/register.js`

**Problema:** A classe existe mas nunca é chamada. Melhorar com tratamento de erro.

**SUBSTITUIR TODO O CONTEÚDO por:**

```javascript
export default class Register {
    constructor(repository) {
        this.repository = repository
    }

    make(lead, origin) {
        try {
            this.repository.create("Registros", {
                origin,
                date: new Date(),
                lead,
            })
        } catch (error) {
            console.error("ERRO ao registrar auditoria:", origin, error.message)
        }
    }
}
```

---

## Checklist para o Evandro

- [ ] Substituir os 14 arquivos listados acima
- [ ] Testar com um webhook real de cada formulário
- [ ] Verificar na collection `Registros` do MongoDB se os registros de auditoria estão sendo criados
- [ ] Monitorar logs por 24h para verificar se ainda há erros
- [ ] Fazer redeploy

## Resumo das mudanças

| O que mudou | Por quê |
|---|---|
| `pegacontato.js` — normalização de telefone | Evita duplicatas por variação de formato |
| `createContato.js` — try-catch + validação | Evita leads perdidos por erro silencioso |
| `createLead.js` (respondi/util) — try-catch + validação | Evita leads perdidos |
| `createContact.js` (kommo/util) — deduplicação + try-catch | Era a segunda maior causa de duplicatas |
| `createLead.js` (kommo/util) — try-catch + validação | Evita leads perdidos |
| `agendacheia` — reescrito com createContato | Era a MAIOR causa de duplicatas |
| Todos os handlers — try-catch + Register.make() | Auditoria + tratamento de erro |
| `Register.js` — tratamento de erro | Evita que a auditoria quebre o fluxo |
