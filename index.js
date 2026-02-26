import 'dotenv/config';
import express, { application, json, response } from 'express';
import RepositoryMongoDB, { Mongodb } from "./src/repository/mongodb.js";
import cors from 'cors';
import KommoAPI from './src/kommo/index.js';
import CalendlyAPI from './src/calendly/index.js';
import Register from './src/domain/usecases/register.js';
import Broker from './src/broker/config.js';
const token = process.env.KOMMO_API_TOKEN;
const kommo = new KommoAPI("grupoduoadm", token)
const repository = new RepositoryMongoDB(new Mongodb(process.env.DB_URL));
const register = new Register(repository)
const calendly = new CalendlyAPI()
const broker = new Broker("GERENCIADOR"); // não em uso no momento
import { Server, Socket } from 'socket.io';
import closers from './src/google/closers.js';
import App from './src/app/index.js';
import refresh_watch from './src/google/refresh_watch/index.js';
import tracking from './src/landingpage/mvl/tracking/index.js';

//const memcached = new Memcached(process.env.MEMCACHED_URL)
const origins = [
	"https://planosalaomilionario.ogrupoduo.com.br",
	"https://wmvl.ogrupoduo.com.br",
	"https://recepcaoquevende.ogrupoduo.com.br",
	"http://localhost:3000",
	"http://localhost:5000",
	"http://localhost:7310",
	"https://planoperfeito.duoacademy.com.br",
	"https://planoperfeito.convertagencia.com",
	"https://planoperfeito.ogrupoduo.com.br",
	"https://dashboard.zeyo.org",
	"https://mvl.convertagencia.com",
	"https://mvl.duoacade.me",
	"https://meet.google.com",
	"https://grupoduoadm.kommo.com"
]
let io
const aplication = new App(kommo, repository, register, io, calendly, broker)

//a cada hora verifica se precisa atualizar watcher do google agenda
setInterval(() => {
	refresh_watch(aplication)
}, 1000 * 60 * 60);

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors({ origin: origins }));

// Parse JSON bodies for POST requests
app.use(json());

// Example GET endpoint
app.get('/', (req, res) => {
	res.json({ message: 'tracking...' });
});

app.post("/webhook/kommo/enviaomie", express.urlencoded({ extended: true }), enviaomie.bind(this, aplication))
app.post("/webhook/kommo/trazdemaiscadeiras", express.urlencoded({ extended: true }), trazdemaiscadeiras.bind(this, aplication))
app.post("/webhook/kommo/creategroupconvert", express.urlencoded({ extended: true }), creategroupconvert.bind(this, aplication))
app.post("/webhook/kommo/insight", express.urlencoded({ extended: true }), insight.bind(this, aplication))
app.post("/teste/webhook/kommo/insight", insight.bind(this, aplication))
app.post("/webhook/kommo/bc/iniciofup", express.urlencoded({ extended: true }), iniciofup.bind(this, aplication))
app.post("/webhook/meet/insight/compareceu", compareceu.bind(this, aplication))
app.post("/webhook/meet/gerarcheckout", gerarcheckout.bind(this, aplication))
app.post("/webhook/kommo/insight/naocompareceu", express.urlencoded({ extended: true }), naocompareceu.bind(this, aplication))
app.post("/webhook/respondi/webnario-agenda-cheia", agendacheia.bind(this, aplication));
app.post("/webhook/respondi/selene", selene.bind(this, aplication));
app.post("/webhook/respondi/avec", avec.bind(this, aplication));
app.post("/webhook/respondi/avec/captacao", captacao.bind(this, aplication));
app.post("/webhook/respondi/belezacontabil", belezacontabil.bind(this, aplication));
app.post("/webhook/respondi/mvl", mvl.bind(this, aplication));
app.post("/webhook/respondi/parse", parse.bind(this, aplication));
app.post("/webhook/respondi/sdrswitcher", sdrswitcher.bind(this, aplication));
app.post("/webhook/wwebjs", wwebjs.bind(this, aplication))
app.post("/webhook/transcript", transcript.bind(this, aplication))
app.post("/mvl/tracking", tracking.bind(this, aplication))
app.post("/webhook/rqv/:type", rqv.bind(this, aplication))
app.post("/webhook/wmvl/:type", wmvl.bind(this, aplication))
app.post("/wmvl/login", login.bind(this, aplication))
app.post("/wmvl/lista", express.urlencoded({ extended: true }), lista.bind(this, aplication))
app.post("/webhook/psm/:type", psm.bind(this, aplication))
app.post("/psm/login", loginpsm.bind(this, aplication))
app.post("/psm/lista", express.urlencoded({ extended: true }), listapsm.bind(this, aplication))
app.post("/kommo/euquero", express.urlencoded({ extended: true }), euquero.bind(this, aplication))
app.post("/kommo/novolead", express.urlencoded({ extended: true }), novolead.bind(this, aplication))
app.post("/kommo/setsdr", express.urlencoded({ extended: true }), setsdr.bind(this, aplication))
app.get("/respondi/whatsapp/sdr/:classificador", redirectSDR.bind(this, aplication))

app.post("/webhook/google/calendar/closers", closers.bind(this, aplication))

const validqueryparams = {
	"time_range": time_range => {
		const result = { date: {} }
		for (const key in time_range) {
			result.date[key === "since" ? "$gte" : "$lte"] = new Date(time_range[key])
		}
		return result
	},
	"time_range_reuniao": time_range => {
		const result = { data_reuniao: {} }
		for (const key in time_range) {
			result.data_reuniao[key === "since" ? "$gte" : "$lte"] = new Date(time_range[key])
		}
		return result
	},
};

(async () => {
	const [sdrc, err] = await repository.findMany("sdrDoClassificador", {})
	sdrc.forEach(s => aplication.sdrDoClassificador[s.classificador] = s)
	console.log(Object.keys(aplication.sdrDoClassificador))
})();

app.get("/:pipeline/insights", async (req, res) => {
	//&time_range[since]=2025-04-01&time_range[until]=2025-04-03
	const mongoQuery = {}
	for (const key in req.query) {
		if (!Object.prototype.hasOwnProperty.call(validqueryparams, key)) continue;
		const result = validqueryparams[key](req.query[key])
		Object.assign(mongoQuery, result)
	}
	const [eventos, err] = await repository.findMany("Eventos", mongoQuery)
	if (err) return res.json({ err, msg: eventos });

	res.json({ eventos, insight: {} })
})


// aqui vai ficar responsável em ouvir os eventos webhook da hotmart
app.post("/hotmart", hotmart.bind(this, aplication))

/* app.post("/hotmart", async (req, res) => {
	const request = req.body
	const event = request.event
	const eventsmap = {
		"PURCHASE_APPROVED": {
			productsmap: {
				5145524: {
					data: {
						to: 81373864
					},
					action: moveLeadToStatusfromHotmart
				},
				5251079: {
					data: {
						to: 81373864
					},
					action: moveLeadToStatusfromHotmart
				},
				5146680: {
					data: {
						to: 81373872
					},
					action: moveLeadToStatusfromHotmart
				},
				5147154: {
					data: {
						to: 81374632
					},
					action: (data, lead) => {
						kommo.moveLeadToStatus(lead.lead_id, data.to);
						//aqui tem que criar outro lead com o contato no Funil do Metodo no status Onboard
					}
				},
				6172456: {
					data: {
						to: 142
					},
					action: moveLeadToStatusfromHotmart
				},
				6431077: {
					data: {
						to: 94272256
					},
					action: moveLeadToStatusfromHotmart
				},
				6438031: {
					data: {
						to: 94349192
					},
					action: moveLeadToStatusfromHotmart
				},
				6494747: {
					data: {
						to: 94272256
					},
					action: moveLeadToStatusfromHotmart
				},
				6561709: {
					data: {
						to: 95261124
					},
					action: moveLeadToStatusfromHotmart
				},
				6726232: {
					data: {
						to: 97219632
					},
					action: moveLeadToStatusfromHotmart
				},
			}
		},
		"PURCHASE_OUT_OF_SHOPPING_CART": {
			productsmap: {
				5145524: {
					data: {
						to: 81564408
					},
					action: moveLeadToStatusfromHotmart
				},
				5251079: {
					data: {
						to: 81564408
					},
					action: moveLeadToStatusfromHotmart
				},
				5146680: {
					data: {
						to: 81588808
					},
					action: moveLeadToStatusfromHotmart
				},
				5147154: {
					data: {
						to: 81592464
					},
					action: moveLeadToStatusfromHotmart
				},
				6172456: {
					data: {
						to: 91445700
					},
					action: moveLeadToStatusfromHotmart
				},
				6431077: {
					data: {
						to: 94272584
					},
					action: moveLeadToStatusfromHotmart
				},
				6438031: {
					data: {
						to: 94349188
					},
					action: moveLeadToStatusfromHotmart
				},
				6494747: {
					data: {
						to: 94272584
					},
					action: moveLeadToStatusfromHotmart
				},
				6561709: {
					data: {
						to: 95261120
					},
					action: moveLeadToStatusfromHotmart
				},
				6726232: {
					data: {
						to: 97219624
					},
					action: moveLeadToStatusfromHotmart
				},
			}
		}
	};

	if (!Object.prototype.hasOwnProperty.call(eventsmap, event))
		return res.json({ msg: "Success not found" });

	const { product, buyer, purchase } = request.data
	let [lead] = await repository.findOne("Leads", { email: buyer.email })
	if (!lead) {
		//aqui tem que criar o lead e inserir o dados
		const registro = {
			userAgent: "hotmart",
			date: new Date(),
			hostname: product.id === 5251079 ? "https://planoperfeito.convertagencia.com" : "https://planoperfeito.ogrupoduo.com.br",
			payload: {
				id: crypto.randomUUID(),
				data: {
					name: buyer.name,
					email: buyer.email,
					phone: buyer.checkout_phone,
					utmParams: {}
				}
			}
		}

		if (product.id === 6172456 || product.id === 6431077 || product.id === 6438031 || product.id === 6494747 || product.id === 6561709 || product.id === 6726232) {
			//aplication.repository.create("ComprasAprovadas", request.data)
			//registro.payload.data.utmParams["utm_source"] = product.id === 6438031 ? "base" : "trafego"
			const newLead = await preFormulario(aplication, registro.payload.data)
			lead = {
				lead_id: newLead.id
			}
		} else {
			await funcoesmap["preformulario"](registro)
			let [newlead] = await repository.findOne("Leads", { uuid: registro.payload.id })
			lead = newlead;
		}
	}

	register.make(lead._id, `hotmart/${event}`)

	if (purchase && purchase.order_bump && purchase.order_bump.is_order_bump) {
		kommo.LeadUpdate(lead.lead_id, {
			tags_to_add: [{
				"id": 117821,
				"name": "Order Bump"
			}]
		})
	}

	const handler = eventsmap[event].productsmap[product.id];
	if (!handler) return res.json({ msg: "" })
	handler.action(handler.data, lead);

	res.json({ msg: "Sucesso" })
}) */



app.post('/register', (req, res) => {
	const register = {
		userAgent: req.headers['user-agent'],
		date: new Date(),
		hostname: req.headers['origin'],
		payload: req.body
	};

	if (!Object.prototype.hasOwnProperty.call(funcoesmap, register.payload.type))
		return res.status(400).json({ error: true, message: 'Invalid Type!' });

	funcoesmap[register.payload.type](register)

	res.json({
		error: null,
		message: 'Data received successfully!'
	});
});

function moveLeadToStatusfromHotmart(data, lead) {
	kommo.moveLeadToStatus(lead.lead_id, data.to);
}

// Start server
const server = app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

aplication.io = new Server(server, {
	cors: {
		origin: origins, // Update with your client origin
		methods: ["GET", "POST"]
	}
});
const countPreformulario = {}
//atraves da origem tenho que ver o funil que faz parte dai tera acoes especificas para cada
const funcoesmap = {
	acesso: async (registro) => {
		const contactresponse = await kommo.ContactCreate({ name: registro.payload.id.split("-")[0] })
		const contact = await contactresponse.json()
		if (contact['validation-errors'])
			return console.log("error: validation-errors", contact['validation-errors'][0])
		const contact_id = contact._embedded.contacts[0].id
		const tags_to_add = []
		const kommolead = {
			_embedded: {
				contacts: [{ 'id': contact_id }]
			}
		}
		if (registro.hostname === "https://planoperfeito.convertagencia.com") {
			kommolead.tags_to_add = tags_to_add;
			tags_to_add.push({
				"id": 117639,
				"name": "convert"
			})
		}
		const custom_fields_values = [];
		if (registro.payload.query && registro.payload.query.fbclid) {
			kommolead.custom_fields_values = custom_fields_values;
			custom_fields_values.push({
				"field_id": 1876840,
				"values": [
					{
						"value": registro.payload.query.fbclid
					}
				]
			})
		}
		const response = await kommo.LeadCreate(10611840, 81374596, "", kommolead)
		const leadres = await response.json()
		const lead = {
			uuid: registro.payload.id,
			lead_id: leadres._embedded.leads[0].id,
			contact_id,
			userAgent: registro.userAgent,
			hostname: registro.hostname,
			fbclid: registro.payload.query ? registro.payload.query.fbclid : "",
			query: registro.payload.query
		}
		const [result, err] = await repository.create("Leads", lead)
		register.make(result._id, `acesso`);
	},
	preformulario: async (registro) => {
		const [lead, err] = await repository.findOne("Leads", { uuid: registro.payload.id })
		if (err) {
			if (!countPreformulario[registro.payload.id])
				countPreformulario[registro.payload.id] = 0;
			countPreformulario[registro.payload.id]++
			if (countPreformulario[registro.payload.id] >= 5 || registro.userAgent === "hotmart") {
				delete countPreformulario[registro.payload.id]
				console.log("criando lead: ", registro.payload.id)
				await funcoesmap["acesso"](registro)
			}
			await new Promise(res => setTimeout(() => res(true), 500));
			return await funcoesmap["preformulario"](registro);
			//aqui tenho que contar quantas tentativas foram feitas, assim na 5 tentativa vou criar o lead e inserir o email
		}
		register.make(lead._id, `preformulario`);
		const data = registro.payload.data;
		repository.update("Leads", lead._id, data)
		kommo.ContactUpdate(lead.contact_id, {
			name: data.name,
			custom_fields_values: [
				{
					"field_id": 1876816,
					"values": [
						{
							"value": data.email
						}
					]
				},
				{
					"field_id": 1876814,
					"values": [
						{
							"value": data.phone
						}
					]
				},
			]
		})
		const response = kommo.LeadUpdate(lead.lead_id, {
			name: data.name,
			status_id: 81374544
		})
	},
	obrigadowebnario: moveLeadToStatusfromBroker,
	foithememberswebnario: moveLeadToStatusfromBroker
}

async function moveLeadToStatusfromBroker(registro) {
	const [lead, err] = await repository.findOne("Leads", { uuid: registro.payload.id })
	const type = registro.payload.type
	if (!lead) return console.log("error: no lead;", registro.payload)
	register.make(lead._id, type)
	const movetomap = {
		obrigadowebnario: 81374548,
		foithememberswebnario: 81373868,
	}
	kommo.moveLeadToStatus(lead.lead_id, movetomap[type])
}

broker.client.subscribe(`${broker.from}/#`);
broker.client.subscribe(`EVENTO/#`);
/* broker.client.on("message", (topic, msg) => {
	//NODE/REQ/MAIN/outra/savefile/c5225f24-5922-4890-a892-3d7939ad44f0
	const [to, type, from, service, origin] = topic.split("/");
	if (to !== "EVENTO") return;
	if (service !== "register" || (origin !== "localhost" && !origin.includes("duo"))) return;
	const payload = JSON.parse(msg)
	if(!Object.prototype.hasOwnProperty.call(funcoesmap, payload.payload.type))
		return;
	funcoesmap[payload.payload.type](payload)
}) */

/**
 * CRIAR CANAIS PARA WEBHOOK COM O GOOGLE AGENDAS ENVIANDO PARAR gerenciadorduo.zeyo.org
 */

(async () => {
	const [eventos] = await repository.findMany("Eventos", { status_id: 142 })
	for (const evento of eventos) {
		const lead = await kommo.LeadFind(evento.lead_id);
		const type = lead._embedded.tags.find(c => c.id === 115613 || c.id === 115611);
		await repository.update("Eventos", evento._id, { lead_type: type ? type.name : "sem tipo" })
	}
});

(async () => {
	const query = validqueryparams["time_range"]({ since: "2025-06-01T00:00:00-03:00", until: "2025-06-30T23:59:59-03:00" })
	for (const etapa of [/* 76679460, 76679464,  76076812,*/76679456 /* , 143 */]) {
		query.status_id = etapa
		//console.log(query)
		const [eventos, err] = await repository.findMany("Eventos", query);
		for (const evento of eventos) {
			if (evento.content) continue
			const lead = await kommo.LeadFind(evento.lead_id)
			console.log(lead.name)
			const content = getCustom(lead, 1876822, "value");
			if (content) {
				console.log(content)
				await repository.update("Eventos", evento._id, {
					content,
					term: getCustom(lead, 1876830, "value")
				})
			}
		}
	}
});

import leadadd from './src/kommo/leadadd.js';
import Evento from './src/domain/evento.js';
(async () => {
	const eventos = leadadd._embedded.events;
	const status = [76679456, 80718524, 77166852, 76679460, 76679464, /* "76076812" */, 142, 143]
	for (const evento of eventos) {
		if (evento.value_after[0].lead_status.pipeline_id !== 9907288 || !status.find(s => s === evento.value_after[0].lead_status.id)) continue;
		const data = new Date(evento.created_at * 1000);
		console.log(evento.id, data);
		const e = new Evento("status", evento.entity_id, evento.value_after[0].lead_status.id, evento.value_after[0].lead_status.pipeline_id, data);
		const [temEvento] = await repository.findOne("Eventos", { status_id: e.status_id, lead_id: e.status_id })
		if (temEvento) continue;

		console.log("Adicionando...");
		const lead = await kommo.LeadFind(e.lead_id)
		const source = getCustom(lead, 1876828, "value")
		if (source) e.source = source

		if (e.status_id === 142) {
			console.log(JSON.stringify(lead))
			e.price = Number(lead.price)
			const [event] = await repository.findOne("Eventos", {
				lead_id: e.lead_id,
				status_id: e.status_id
			});

			if (event) return;
			//await app.kommo.LeadFind(e.lead_id)
			Object.assign(e, {
				name: lead.name,
				product: getCustom(lead, 1879015, "enum_id"),
				closer: getCustom(lead, 1880511, "enum_id"),
			});
			const type = lead._embedded.tags.find(c => c.id === 115613 || c.id === 115611)
			if (type) e.lead_type = type.name
		}

		if (e.status_id === 143) {
			Object.assign(e, {
				name: lead.name,
				closer: getCustom(lead, 1880511, "enum_id"),
			});
		}

		if (e.status_id === 76679456 || e.status_id === 142 || e.status_id === 143 || e.status_id === 76679460 || e.status_id === 76679464) {
			const content = getCustom(lead, 1876822, "value")
			if (content) {
				e.content = content
				e.term = getCustom(lead, 1876830, "value")
			}
		}

		console.log(e)
		await repository.create("Eventos", e)
	}
});

(async () => {
	const eventos = leadadd._embedded.events;
	const leadsMap = {}
	for (const evento of eventos) {
		console.log(evento.id, new Date(evento.created_at * 1000))
		if (leadsMap[evento.entity_id]) continue

		console.log(evento.entity_id, "compareceu: ", evento.value_after[0].custom_field_value.text)
		leadsMap[evento.entity_id] = evento.value_after[0].custom_field_value.enum_id
	}
	console.log(Object.keys(leadsMap).length)

	for (const key in leadsMap) {
		const [result] = await repository.updateQuery("Eventos", { lead_id: Number(key), status_id: 76076812 }, { compareceu: leadsMap[key].toString() })
		if (!result.modifiedCount && !result.matchedCount)
			console.log(key, leadsMap[key], result)
	}
});


(async () => {
	const participants = [
		/* '554788858180@c.us',
		'555492471460@c.us',
		'5519999216156@c.us',
		'555492321471@c.us',//
		'554796561627@c.us',
		'553498281782@c.us',
		'555496753992@c.us',//
		'555496838974@c.us',//
		'555496737301@c.us',//
		'554799411876@c.us',
		'555599746348@c.us',
		'554299096897@c.us',
		'558897135668@c.us',
		'555499413673@c.us',//
		'555496208776@c.us',//
		'555499024765@c.us',//
		'555497084904@c.us',//
		'5519997753306@c.us',
		'555180392133@c.us',
		'559299845806@c.us',
		'555484270237@c.us',//
		'555499701968@c.us',//
		'555496176622@c.us',//
		'558396717432@c.us',
		'556796759608@c.us',
		'555481117573@c.us',
		'555499051870@c.us',//
		'555499165876@c.us',//
		'556599078214@c.us',//
		'555499047030@c.us',
		'5511967207813@c.us',
		'554799793411@c.us',
		'5511964447609@c.us',
		'553898651622@c.us',
		'555484113007@c.us',
		'555492627352@c.us',
		'554598295162@c.us',
		'555499437851@c.us',//
		'554896630480@c.us',
		'555592118725@c.us',
		'554989242429@c.us',
		'5511932196086@c.us',
		'558499878115@c.us',
		'558185621983@c.us',
		'555592605000@c.us',
		'5511939587836@c.us',
		'556286449814@c.us',
		'5511952516532@c.us',
		'554788177420@c.us',
		'61406100020@c.us' */
	]


	for (const participant of participants) {
		await setLead(aplication, participant)
	}
});

(async () => {
	const participants = [
		'555499437851@c.us', '555484113007@c.us', '554588218013@c.us', '5511994628526@c.us', '5511975587429@c.us', '554598092101@c.us', '555499047030@c.us', '5511947583933@c.us', '556599078214@c.us', '5511953719591@c.us', '555499165876@c.us', '553191809542@c.us', '555499051870@c.us', '556185103496@c.us', '557391917450@c.us', '555199392570@c.us', '555496176622@c.us', '555499701968@c.us', '555197345646@c.us', '555484270237@c.us', '555491788718@c.us', '555182291716@c.us', '556799876905@c.us', '557799382786@c.us', '553185526355@c.us', '555499024765@c.us', '555496208776@c.us', '555499413673@c.us', '554796959595@c.us', '554888117279@c.us', '557999596195@c.us', '554891431854@c.us', '5511995666633@c.us', '557991463891@c.us', '555493292264@c.us', '558899997485@c.us', '5516991574493@c.us', '555599746348@c.us', '555197707290@c.us', '559391181293@c.us', '555496737301@c.us', '553196338079@c.us', '5511914177160@c.us', '553599375155@c.us', '553491774963@c.us', '555496838974@c.us', '5512978989393@c.us', '5517999755900@c.us', '559294446259@c.us', '5512982267801@c.us', '558481307465@c.us', '555496753992@c.us', '5516993383141@c.us', '556196979533@c.us', '556599866610@c.us', '555492471460@c.us', '555492471460@c.us', '555492627352@c.us', '556185016165@c.us'
	]
	for (const participant of participants) {
		await new Promise(res => setTimeout(() => {
			res(true)
		}, 1000))
		await fetch("http://localhost:5001/webhook/wwebjs/", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				event: "group_join",
				args: [
					{
						"id": {
							"fromMe": false,
							"remote": "120363400488851144@g.us",
							"id": "2866360867175071311",
							participant,
							"_serialized": "false_120363401316459643@g.us_28663608671750713118_555492627352@c.us"
						},
						"body": "",
						"type": "invite",
						"timestamp": 1750713118,
						"chatId": "120363417158309426@g.us"
					}
				],
				id: "grupoduo"
			})
		}).catch(err => console.log(err))
		//console.log(contact.pushname, contact)
	}
});


//refaz registros do compareceu
(async function refazRegistrosCompareceu(timeout) {
	/* setTimeout(() => {
		refazRegistrosCompareceu(true)
	}, 1000 * 60 * 5);
	if (!timeout) return; */
	const [reunioes] = await repository.findMany("Eventos", { status_id: 76076812, date: { $gt: new Date("2025-11-01T00:00:00.000Z") } })
	console.log(reunioes.length)
	for (const reuniao of reunioes) {
		if (reuniao.compareceu) {
			await repository.update("Eventos", reuniao._id, { compareceu: reuniao.compareceu.toString() })
			continue
		};
		const lead = await kommo.LeadFind(reuniao.lead_id)
		if (!lead) continue;
		//console.log(lead.custom_fields_values)
		const date = new Date(reuniao.date)
		const compareceu = getCustom(lead, 1879555, "enum_id")
		console.log(lead.id, reuniao.date, lead.name, compareceu)
		if (compareceu) {
			repository.updateMany("Eventos", { lead_id: lead.id, status_id: 76076812 }, { compareceu: compareceu.toString() })
			continue;
		}

		if (date.getTime() > new Date().getTime()) continue

		const [eventos, err] = await repository.findMany("Eventos", { lead_id: lead.id })
		for (const e of eventos) {
			const status = [76076908, 142, 143].find(s => e.status_id === s)
			if (status) {
				await repository.update("Eventos", reuniao._id, { compareceu: "1300129" })
				break
			}
			await repository.update("Eventos", reuniao._id, { compareceu: "1300127" })
		}
		/* 
		const custom = customsToObject(lead)
		if (new Date(reuniao.date) < new Date())
			console.log(lead.id, lead.name, custom["1879555"], reuniao.date, new Date(reuniao.date) > new Date() ? "ainda nao aconteceu" : "Deveria ter sim ou nao") */
		/* const result = await kommo.AllEventsFromLead(reuniao.lead_id)
		if (!result._embedded) return
		const events = result._embedded.events
		for (const event of events) {
			if (event.type === "custom_field_1879555_value_changed") {
				const custom_fields = customsToObject(lead)
				const compareceu = custom_fields["1879555"] ? custom_fields["1879555"].values[0].enum_id.toString() : ""
				console.log(reuniao.name, compareceu)
				repository.update("Eventos", reuniao._id, { compareceu })
			}
		} */
	}
});

// refaz closers
(async () => {
	const [reunioes] = await repository.findMany("Eventos", { status_id: 76076812, date: { $gt: new Date("2025-07-01T00:00:00.000Z") } })
	console.log(reunioes.length)
	for (const reuniao of reunioes) {
		if (typeof reuniao.closer !== 'number') continue
		console.log(typeof reuniao.closer)
		repository.update("Eventos", reuniao._id, { closer: reuniao.closer.toString() })
	}
	console.log("finalizou")
});

//duplica etapas de um funil para outro
(async () => {
	//11444036
	const source = 12325788;
	const target = 12588032;
	const result = await kommo.FindByID("pipelines", source)
	const statuses = result._embedded.statuses
	for (const stage of statuses) {
		if (stage.sort < 11 || stage.sort > 999) continue;
		console.log(stage.name, stage.sort, findClosestColor(stage.color))
		console.log((await kommo.StageCreate(target, stage.name, stage.sort, findClosestColor(stage.color))).statusText)
	}
	console.log("finalizou")
});



/**
 * TODO: 
 * [] pegar todos os eventos desde o dia 20 ate hj e verificar se tem id do lead caso tenha, verificar se já tem evento no banco, se nao tiver, tem que criar um evento 
 */

//tenho que pegar todas as reunioes no mes de maio e atribuir para cada closer
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import insight from './src/kommo/insight/index.js';
import trazdemaiscadeiras from './src/kommo/trazdemaiscadeiras/index.js';
import getCustom from './src/kommo/util/getCustom.js';
import wwebjs, { setLead } from './src/wwebjs/index.js';
import customsToObject from './src/kommo/util/customsToObject.js';
import findClosestColor from './src/kommo/util/findClosestColor.js';
import extractLeadId from './src/google/util/extractLeadId.js';
import agendacheia from './src/respondi/agendacheia/index.js';
import selene from './src/respondi/selene/index.js';
import avec from './src/respondi/avec/index.js';
import captacao from './src/respondi/avec/captacao/index.js';
import createContact from './src/kommo/util/createContact.js';
import createLead from './src/kommo/util/createLead.js';
import transcript from './src/transcript/index.js';

// --- Configurações ---
const SERVICE_ACCOUNT_KEY_PATH = './credentials.json'; // Substitua pelo caminho do seu arquivo JSON
const CALENDAR_ID = 'da6c97cfbb3e2da2c1205f53a59d6a9533334165d948038e96e8c2d832f984de@group.calendar.google.com'; // Substitua por 'primary' ou o ID do calendário específico (ex: seuemail@gmail.com ou um ID longo)

// Escopos necessários para ler eventos
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];

async function listEventsForMay2025() {
	try {
		// 1. Autenticar com a Conta de Serviço
		const auth = new JWT({
			keyFile: SERVICE_ACCOUNT_KEY_PATH,
			scopes: SCOPES,
		});
		await auth.authorize(); // Garante que a autenticação está pronta

		const calendar = google.calendar({ version: 'v3', auth });

		// 2. Definir o período para Maio de 2025
		// Usamos UTC para garantir que pegamos o mês inteiro globalmente
		// timeMin é inclusivo, timeMax é exclusivo.
		const timeMin = new Date('2025-06-21T03:00:00.000Z').toISOString();
		const timeMax = new Date('2025-06-30T22:00:00.000Z').toISOString(); // Início de Junho para incluir todo o dia 31 de Maio

		console.log(`Buscando eventos para o calendário: ${CALENDAR_ID}`);
		console.log(`Período: de ${timeMin} até ${timeMax}`);

		let allEvents = [];
		let nextPageToken = null;

		// 3. Buscar eventos (com tratamento de paginação)
		do {
			const params = {
				calendarId: CALENDAR_ID,
				timeMin: timeMin,
				timeMax: timeMax,
				singleEvents: true, // Expande eventos recorrentes em instâncias individuais
				orderBy: 'startTime', // Ordena os eventos pela hora de início
				maxResults: 250, // Máximo de resultados por página (padrão é 250, máximo é 2500)
				pageToken: nextPageToken,
			};

			const response = await calendar.events.list(params);
			const events = response.data.items;
			if (events && events.length > 0) {
				allEvents = allEvents.concat(events);
			}

			nextPageToken = response.data.nextPageToken;

		} while (nextPageToken);

		const [agenda] = await repository.findOne("Agendas", { calendarId: CALENDAR_ID })
		// 4. Exibir os eventos encontrados
		if (allEvents.length) {
			console.log(`\nTotal de ${allEvents.length} eventos encontrados em Maio de 2025:`);
			for (const event of allEvents) {
				if (!event.description || !event.description.includes("Id do Lead")) continue;
				const leadId = extractLeadId(event.description);
				if (!leadId) continue;
				console.log(leadId, event.summary)
				const lead = await kommo.LeadFind(leadId)
				if (!lead) continue;
				const startTime = new Date(event.start.dateTime).getTime()
				const evento = new Evento("status", leadId, 76076812, 9907288, new Date(startTime))
				evento.data_reuniao = new Date(startTime)
				evento.closer = agenda.closer.toString()
				const source = getCustom(lead, 1876828, "value")
				if (source) evento.source = source
				const content = getCustom(lead, 1876822, "value")
				if (content) {
					evento.content = content
					evento.term = getCustom(lead, 1876830, "value")
				}
				evento.name = lead.name;
				evento.googleid = event.id
				const [hasevento] = await repository.findOne("Eventos", {
					lead_id: evento.lead_id,
					status_id: evento.status_id,
					pipeline_id: evento.pipeline_id,
					date: evento.date
				})

				if (hasevento) continue;
				console.log(evento)
				await repository.create("Eventos", evento)
			}
			/* allEvents.forEach(event => {
				if (!event.location) return
				event
				const start = event.start.dateTime || event.start.date; // Para eventos de dia inteiro ou com hora marcada
				const end = event.end.dateTime || event.end.date;
				console.log(`--------------------------------------------------`);
				console.log(`Título: ${event.summary}`);
				console.log(`Início: ${start}`);
				console.log(`Fim:    ${end}`);
				console.log(`ID:     ${event.id}`);
				if (event.description) {
					console.log(`Descrição: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`);
				}
				if (event.location) {
					console.log(`Local: ${event.location}`);
				}
			}); */
			console.log(`--------------------------------------------------`);
		} else {
			console.log('Nenhum evento encontrado para Maio de 2025.');
		}

	} catch (error) {
		console.error('Erro ao buscar eventos do Google Calendar:', error.response ? error.response.data.error : error.message);
	}
}

// Executa a função
//listEventsForMay2025();


(() => {
	const event = { "kind": "calendar#event", "etag": "\"3503328055223166\"", "id": "msf1q07b05qbh30ucbqq2as0kc", "status": "confirmed", "htmlLink": "https://www.google.com/calendar/event?eid=bXNmMXEwN2IwNXFiaDMwdWNicXEyYXMwa2MgZHVvYWNhZGVteS5jb25zdWx0b3IwQG0", "created": "2025-07-03T17:48:04.000Z", "updated": "2025-07-04T21:20:27.611Z", "summary": "Consultoria Gratuita (Jaqueline de Sousa  de Sousa)", "description": "<b>Reservado por</b><br>Jaqueline de Sousa  de Sousa<br><a href=\"mailto:socorrojack12345@gmail.com\" target=\"_blank\">socorrojack12345@gmail.com</a><br><br><b>Id do Lead</b><br>22092913", "creator": { "email": "duoacademy.consultor0@gmail.com", "self": true }, "organizer": { "email": "duoacademy.consultor0@gmail.com", "self": true }, "start": { "dateTime": "2025-07-04T10:30:00-03:00", "timeZone": "America/Sao_Paulo" }, "end": { "dateTime": "2025-07-04T11:30:00-03:00", "timeZone": "America/Sao_Paulo" }, "iCalUID": "msf1q07b05qbh30ucbqq2as0kc@google.com", "sequence": 0, "attendees": [{ "email": "duoacademy.consultor0@gmail.com", "organizer": true, "self": true, "responseStatus": "accepted" }, { "email": "socorrojack12345@gmail.com", "responseStatus": "accepted" }], "extendedProperties": { "shared": { "goo.createdByAvailId": "5ugtrjcojl3aop9jdaesvlcj2e", "goo.createdBySet": "default_cita" } }, "hangoutLink": "https://meet.google.com/nix-thaw-twy", "conferenceData": { "createRequest": { "requestId": "q365p771e9ujco27vv1v9ln9jg", "conferenceSolutionKey": { "type": "hangoutsMeet" }, "status": { "statusCode": "success" } }, "entryPoints": [{ "entryPointType": "video", "uri": "https://meet.google.com/nix-thaw-twy", "label": "meet.google.com/nix-thaw-twy" }], "conferenceSolution": { "key": { "type": "hangoutsMeet" }, "name": "Google Meet", "iconUri": "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png" }, "conferenceId": "nix-thaw-twy" }, "reminders": { "useDefault": true }, "eventType": "default" }
	console.log(extractLeadId(event.description.replaceAll("<br>", "\n"), true))
});



// refaz leads que nao foram adicionados por queda do servidor
(async () => {
	const status = [
		{
			"id": 76076800,
			"name": "Etapa de leads de entrada",
			"sort": 10,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#c1c1c1",
			"type": 1,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076800"
				}
			}
		},
		{
			"id": 76679456,
			"name": "Leads",
			"sort": 20,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679456"
				}
			}
		},
		{
			"id": 77198212,
			"name": "Filtragem",
			"sort": 30,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77198212"
				}
			}
		},
		{
			"id": 80718524,
			"name": "Social selling",
			"sort": 40,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/80718524"
				}
			}
		},
		{
			"id": 77539976,
			"name": "Formulário incompleto",
			"sort": 50,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77539976"
				}
			}
		},
		{
			"id": 87503096,
			"name": "Contatados Incompleto",
			"sort": 60,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/87503096"
				}
			}
		},
		{
			"id": 77166852,
			"name": "Lead Desqualificado",
			"sort": 70,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77166852"
				}
			}
		},
		{
			"id": 88272836,
			"name": "Fórmula",
			"sort": 80,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ff8f92",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88272836"
				}
			}
		},
		{
			"id": 76679460,
			"name": "MQL",
			"sort": 90,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffce5a",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679460"
				}
			}
		},
		{
			"id": 76679464,
			"name": "SQL",
			"sort": 100,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679464"
				}
			}
		},
		{
			"id": 76076804,
			"name": "Atendimento BOT",
			"sort": 110,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#e6e8ea",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076804"
				}
			}
		},
		{
			"id": 76076808,
			"name": "ATENDIMENTO SDR",
			"sort": 120,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffff99",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076808"
				}
			}
		},
		{
			"id": 88208932,
			"name": "Atendimento SS",
			"sort": 130,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#fffd7f",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88208932"
				}
			}
		},
		{
			"id": 81189808,
			"name": "Contatados",
			"sort": 140,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/81189808"
				}
			}
		},
		{
			"id": 76076812,
			"name": "Reunião Agendada",
			"sort": 150,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffcc66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076812"
				}
			}
		},
		{
			"id": 76076908,
			"name": "Em Negociação",
			"sort": 160,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076908"
				}
			}
		},
		{
			"id": 142,
			"name": "Venda ganha",
			"sort": 10000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#CCFF66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/142"
				}
			}
		},
		{
			"id": 143,
			"name": "Venda perdida",
			"sort": 11000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#D5D8DB",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/143"
				}
			}
		}
	]
	const events = []
	let page = 0
	while (true) {
		page++
		console.log(events.length)
		const result = await kommo.FindByQuery("events", `page=${page}&filter[created_at][from]=${(new Date("2025-10-22").getTime() / 1000)}&filter[entity]=lead&filter[type]=lead_added`)
		events.push(...result._embedded.events)
		if (result._embedded.events.length < 250) break
	}
	console.log(events.length)
	const statusmap = {}
	status.forEach(s => statusmap[s.id] = s.name)
	let leads_faltantes = 0
	for (const event of events) {
		const [evento] = await repository.findOne("Eventos", { lead_id: event.entity_id, type: "add" })
		if (evento) continue

		const result = (await kommo.AllEventsFromLead(event.entity_id))
		if (!result._embedded) continue
		const lead_events = result._embedded.events
		//console.log(lead_events)
		let isVenda = false
		for (const lead_event of lead_events) {
			if (lead_event.type !== "lead_status_changed") continue
			if (lead_event.value_after[0].lead_status.pipeline_id !== 9907288) continue
			isVenda = true
			const status_id = lead_event.value_after[0].lead_status.id
			console.log("status: ", status_id, statusmap[status_id])
			const [evento] = await repository.findOne("Eventos", { lead_id: event.entity_id, type: "status", status_id })
			if (evento) continue
			console.log("===> falta incluir")
			await createEvento("status", status_id, lead_event)
		}
		if (isVenda) {
			await createEvento("add", 76679456, event)
			console.log(event.entity_id)
			leads_faltantes++
			console.log("++++++")
		}
	}

	async function createEvento(type, status_id, event) {
		if (![76679456, 80718524, 77166852, 76679460, 76679464, /* "76076812" */, 142, 143].find((e) => e === status_id)) return;
		const lead = await kommo.LeadFind(event.entity_id)
		const evento = new Evento(type, event.entity_id, status_id, 9907288, new Date(event.created_at * 1000))
		const custom = customsToObject(lead)
		if (custom["1876828"])
			evento.source = custom["1876828"].values[0].value

		if (status_id === 142) {
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

		if (status_id === 143) {
			Object.assign(evento, {
				name: lead.name,
				closer: getCustom(lead, "1880511", "enum"),
			});
			await app.repository.deleteMany("Eventos", {
				lead_id: evento.lead_id,
				status_id: 142
			});

		}


		if (status_id === 76679456 || status_id === 142 || status_id === 143 || status_id === 76679460 || status_id === 76679464) {
			const content = getCustom(lead, 1876822, "value")
			if (content) {
				evento.content = content
				evento.term = getCustom(lead, 1876830, "value")
			}
		}
		//console.log(lead)
		console.log(evento)
		repository.create("Eventos", evento)
		//insightfunctionsmap[key](lead);
	}
	console.log(events.length, leads_faltantes)

});

// refaz toda jornada do lead
(async () => {
	const status = [
		{
			"id": 76076800,
			"name": "Etapa de leads de entrada",
			"sort": 10,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#c1c1c1",
			"type": 1,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076800"
				}
			}
		},
		{
			"id": 76679456,
			"name": "Leads",
			"sort": 20,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679456"
				}
			}
		},
		{
			"id": 77198212,
			"name": "Filtragem",
			"sort": 30,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77198212"
				}
			}
		},
		{
			"id": 80718524,
			"name": "Social selling",
			"sort": 40,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/80718524"
				}
			}
		},
		{
			"id": 77539976,
			"name": "Formulário incompleto",
			"sort": 50,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77539976"
				}
			}
		},
		{
			"id": 87503096,
			"name": "Contatados Incompleto",
			"sort": 60,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/87503096"
				}
			}
		},
		{
			"id": 77166852,
			"name": "Lead Desqualificado",
			"sort": 70,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77166852"
				}
			}
		},
		{
			"id": 88272836,
			"name": "Fórmula",
			"sort": 80,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ff8f92",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88272836"
				}
			}
		},
		{
			"id": 76679460,
			"name": "MQL",
			"sort": 90,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffce5a",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679460"
				}
			}
		},
		{
			"id": 76679464,
			"name": "SQL",
			"sort": 100,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679464"
				}
			}
		},
		{
			"id": 76076804,
			"name": "Atendimento BOT",
			"sort": 110,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#e6e8ea",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076804"
				}
			}
		},
		{
			"id": 76076808,
			"name": "ATENDIMENTO SDR",
			"sort": 120,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffff99",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076808"
				}
			}
		},
		{
			"id": 88208932,
			"name": "Atendimento noshow",
			"sort": 130,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#fffd7f",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88208932"
				}
			}
		},
		{
			"id": 81189808,
			"name": "Contatados",
			"sort": 140,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/81189808"
				}
			}
		},
		{
			"id": 76076812,
			"name": "Reunião Agendada",
			"sort": 150,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffcc66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076812"
				}
			}
		},
		{
			"id": 76076908,
			"name": "Em Negociação",
			"sort": 160,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076908"
				}
			}
		},
		{
			"id": 142,
			"name": "Venda ganha",
			"sort": 10000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#CCFF66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/142"
				}
			}
		},
		{
			"id": 143,
			"name": "Venda perdida",
			"sort": 11000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#D5D8DB",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/143"
				}
			}
		}
	]
	const statusmap = {}
	status.forEach(s => statusmap[s.id] = s.name)
	let leads_faltantes = 0
	//const [eventos] = await repository.findMany("Eventos", { type: "add", date: { $gt: new Date("2025-10-22") } })
	const [eventos] = [[{ lead_id: 23105387 }]]
	for (const event of eventos) {
		console.log("\n\n======\n", event.lead_id, event.date)
		const result = (await kommo.AllEventsFromLead(event.lead_id))
		if (!result._embedded) continue
		const lead_events = result._embedded.events
		//console.log(lead_events)
		let isVenda = false
		for (const lead_event of lead_events) {
			if (lead_event.type !== "lead_status_changed") continue
			if (lead_event.value_after[0].lead_status.pipeline_id !== 9907288) continue
			isVenda = true
			const status_id = lead_event.value_after[0].lead_status.id
			console.log("status: ", status_id, statusmap[status_id])
			const [evento] = await repository.findOne("Eventos", { lead_id: event.lead_id, type: "status", status_id })
			if (evento) continue
			console.log("===> falta incluir")
			await createEvento("status", status_id, lead_event)
			if (status_id === 143) break;
		}
		/* if (isVenda) {
			await createEvento("add", 76679456, event)
			console.log(event.lead_id)
			leads_faltantes++
			console.log("++++++")
		} */
	}

	async function createEvento(type, status_id, event) {
		if (![76679456, 80718524, 77166852, 76679460, 76679464, 88208932, /* "76076812" */, 76076908, /* 142, 143 */].find((e) => e === status_id)) return;
		const lead = await kommo.LeadFind(event.entity_id)
		const evento = new Evento(type, event.entity_id, status_id, 9907288, new Date(event.created_at * 1000))
		const custom = customsToObject(lead)
		if (custom[1876828])
			evento.source = custom[1876828].values[0].value

		if (status_id === 142) {
			console.log(lead)
			evento.price = Number(lead.price)
			const [event] = await repository.findOne("Eventos", {
				lead_id: evento.lead_id,
				status_id: evento.status_id
			});

			if (event) return;
			//await app.kommo.LeadFind(evento.lead_id)
			Object.assign(evento, {
				name: lead.name,
				product: getCustom(lead, 1879015, "enum_id").toString(),
				closer: getCustom(lead, 1880511, "enum_id").toString(),
			});
			if (lead.tags) {
				const type = lead.tags.find(c => c.id === "115613" || c.id === "115611")
				if (type) evento.lead_type = type.name
			}
		}

		if (status_id === 143) {
			Object.assign(evento, {
				name: lead.name,
				closer: getCustom(lead, 1880511, "enum_id"),
			});
			await repository.deleteMany("Eventos", {
				lead_id: evento.lead_id,
				status_id: 142
			});

		}


		if (status_id === 76679456 || status_id === 142 || status_id === 143 || status_id === 76679460 || status_id === 76679464) {
			const content = getCustom(lead, 1876822, "value")
			if (content) {
				evento.content = content
				evento.term = getCustom(lead, 1876830, "value")
			}
		}

		if (lead.status_id === 88208932 || lead.status_id === 76076908 || lead.status_id === 142 || lead.status_id === 143) {
			const compareceu = getCustom(lead, 1879555, "enum_id")
			if (compareceu) {
				evento.compareceu = compareceu
				repository.updateMany("Eventos", { lead_id: lead.id, status_id: 76076812 }, { compareceu })
			}
		}
		//console.log(lead)
		console.log(evento)
		repository.create("Eventos", evento)
		//insightfunctionsmap[key](lead);
	}
	console.log(leads_faltantes)

});

(async () => {

	const status = [
		{
			"id": 76076800,
			"name": "Etapa de leads de entrada",
			"sort": 10,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#c1c1c1",
			"type": 1,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076800"
				}
			}
		},
		{
			"id": 76679456,
			"name": "Leads",
			"sort": 20,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679456"
				}
			}
		},
		{
			"id": 77198212,
			"name": "Filtragem",
			"sort": 30,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77198212"
				}
			}
		},
		{
			"id": 80718524,
			"name": "Social selling",
			"sort": 40,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/80718524"
				}
			}
		},
		{
			"id": 77539976,
			"name": "Formulário incompleto",
			"sort": 50,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77539976"
				}
			}
		},
		{
			"id": 87503096,
			"name": "Contatados Incompleto",
			"sort": 60,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/87503096"
				}
			}
		},
		{
			"id": 77166852,
			"name": "Lead Desqualificado",
			"sort": 70,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77166852"
				}
			}
		},
		{
			"id": 88272836,
			"name": "Fórmula",
			"sort": 80,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ff8f92",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88272836"
				}
			}
		},
		{
			"id": 76679460,
			"name": "MQL",
			"sort": 90,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffce5a",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679460"
				}
			}
		},
		{
			"id": 76679464,
			"name": "SQL",
			"sort": 100,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679464"
				}
			}
		},
		{
			"id": 76076804,
			"name": "Atendimento BOT",
			"sort": 110,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#e6e8ea",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076804"
				}
			}
		},
		{
			"id": 76076808,
			"name": "ATENDIMENTO SDR",
			"sort": 120,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffff99",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076808"
				}
			}
		},
		{
			"id": 88208932,
			"name": "Atendimento SS",
			"sort": 130,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#fffd7f",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88208932"
				}
			}
		},
		{
			"id": 81189808,
			"name": "Contatados",
			"sort": 140,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/81189808"
				}
			}
		},
		{
			"id": 76076812,
			"name": "Reunião Agendada",
			"sort": 150,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffcc66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076812"
				}
			}
		},
		{
			"id": 76076908,
			"name": "Em Negociação",
			"sort": 160,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076908"
				}
			}
		},
		{
			"id": 142,
			"name": "Venda ganha",
			"sort": 10000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#CCFF66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/142"
				}
			}
		},
		{
			"id": 143,
			"name": "Venda perdida",
			"sort": 11000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#D5D8DB",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/143"
				}
			}
		}
	]

	const statusmap = {}
	status.forEach(s => statusmap[s.id] = s.name)
	const [agendados] = await repository.findMany("Eventos", {
		status_id: 76076812,
		date: {
			$gt: new Date("2025-07-01T00:00:00.000Z")
		}
	})

	for (const reuniao of agendados) {
		console.log("++++++++++")
		const eventos = (await kommo.AllEventsFromLead(reuniao.lead_id))._embedded.events
		for (const evento of eventos) {
			if (evento.type !== "lead_status_changed") continue
			const status_id = evento.value_after[0].lead_status.id
			console.log(evento.entity_id, status_id, statusmap[status_id], new Date(evento.created_at * 1000))
		}
	}
	//tenho que fazer um campo jornada: atual passado repescagem outro
});

(async () => {
	const [agendas] = await repository.findMany("Agendas", {})
	for (const agenda of agendas) {
		await calendly.refreshToken(repository, agenda)
	}
});

//refaz eventos depois que servidor caiu
(async () => {
	const status = [
		{
			"id": 76076800,
			"name": "Etapa de leads de entrada",
			"sort": 10,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#c1c1c1",
			"type": 1,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076800"
				}
			}
		},
		{
			"id": 76679456,
			"name": "Leads",
			"sort": 20,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679456"
				}
			}
		},
		{
			"id": 77198212,
			"name": "Filtragem",
			"sort": 30,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77198212"
				}
			}
		},
		{
			"id": 80718524,
			"name": "Social selling",
			"sort": 40,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/80718524"
				}
			}
		},
		{
			"id": 77539976,
			"name": "Formulário incompleto",
			"sort": 50,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77539976"
				}
			}
		},
		{
			"id": 87503096,
			"name": "Contatados Incompleto",
			"sort": 60,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/87503096"
				}
			}
		},
		{
			"id": 77166852,
			"name": "Lead Desqualificado",
			"sort": 70,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/77166852"
				}
			}
		},
		{
			"id": 88272836,
			"name": "Fórmula",
			"sort": 80,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ff8f92",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88272836"
				}
			}
		},
		{
			"id": 76679460,
			"name": "MQL",
			"sort": 90,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffce5a",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679460"
				}
			}
		},
		{
			"id": 76679464,
			"name": "SQL",
			"sort": 100,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76679464"
				}
			}
		},
		{
			"id": 76076804,
			"name": "Atendimento BOT",
			"sort": 110,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#e6e8ea",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076804"
				}
			}
		},
		{
			"id": 76076808,
			"name": "ATENDIMENTO SDR",
			"sort": 120,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffff99",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076808"
				}
			}
		},
		{
			"id": 88208932,
			"name": "Atendimento SS",
			"sort": 130,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#fffd7f",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/88208932"
				}
			}
		},
		{
			"id": 81189808,
			"name": "Contatados",
			"sort": 140,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#87f2c0",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/81189808"
				}
			}
		},
		{
			"id": 76076812,
			"name": "Reunião Agendada",
			"sort": 150,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#ffcc66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076812"
				}
			}
		},
		{
			"id": 76076908,
			"name": "Em Negociação",
			"sort": 160,
			"is_editable": true,
			"pipeline_id": 9907288,
			"color": "#99ccff",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/76076908"
				}
			}
		},
		{
			"id": 142,
			"name": "Venda ganha",
			"sort": 10000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#CCFF66",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/142"
				}
			}
		},
		{
			"id": 143,
			"name": "Venda perdida",
			"sort": 11000,
			"is_editable": false,
			"pipeline_id": 9907288,
			"color": "#D5D8DB",
			"type": 0,
			"account_id": 30842051,
			"_links": {
				"self": {
					"href": "https://grupoduoadm.kommo.com/api/v4/leads/pipelines/9907288/statuses/143"
				}
			}
		}
	]
	const statusmap = {}
	status.forEach(s => statusmap[s.id] = s.name)
	let leads_faltantes = 0
	const events = []
	let page = 0
	while (true) {
		page++
		console.log(events.length)
		const result = await kommo.FindByQuery("events", `page=${page}&filter[created_at][from]=${(new Date("2025-11-14").getTime() / 1000)}&filter[entity]=lead&filter[type]=lead_added`)
		events.push(...result._embedded.events)
		if (result._embedded.events.length < 250) break
	}
	console.log(events.length)

	for (const event of events) {
		console.log("+++++++\nlead:", event.entity_id)
		/* const [evento] = await repository.findOne("Eventos", { lead_id: event.entity_id, type: "status" })
		if (evento) continue */
		const result = await kommo.AllEventsFromLead(event.entity_id) //22137705
		if (!result) {
			console.log(result)
			continue
		}
		const lead_events = result._embedded.events
		//console.log(lead_events)
		let isVenda = false
		for (const lead_event of lead_events) {
			if (lead_event.type !== "lead_status_changed") continue
			if (lead_event.value_after[0].lead_status.pipeline_id !== 9907288) continue
			//if (lead_event.value_after[0].lead_status.id !== 88272836) continue
			isVenda = true
			const status_id = lead_event.value_after[0].lead_status.id
			console.log("status: ", status_id, statusmap[status_id])
			const [evento] = await repository.findOne("Eventos", { lead_id: event.entity_id, type: "status", status_id })
			if (evento) continue
			console.log("===> falta incluir")
			await createEvento("status", status_id, lead_event)
		}
		/* if (isVenda) {
			await createEvento("add", 76679456, event)
			console.log(event.entity_id)
			leads_faltantes++
			console.log("++++++")
		} */
	}
	console.log("fim")
});

async function createEvento(type, status_id, event) {
	//                  inicio    Filtragem     SS           LD       Formula       MQL         SQL
	const eventos = [76679456, 77198212, "80718524", "77166852", 88272836, "76679460", "76679464", /* "76076812" */, "142", "143"]
	if (!eventos.find((e) => e === status_id)) return;
	const lead = await kommo.LeadFind(event.entity_id)
	if (!lead) return
	const evento = new Evento(type, event.entity_id, status_id, 9907288, new Date(event.created_at * 1000))
	const custom = customsToObject(lead)
	if (custom["1876828"])
		evento.source = custom["1876828"].values[0].value

	if (status_id === 142) {
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

	if (status_id === 143) {
		Object.assign(evento, {
			name: lead.name,
			closer: getCustom(lead, "1880511", "enum"),
		});
		await app.repository.deleteMany("Eventos", {
			lead_id: evento.lead_id,
			status_id: 142
		});

	}


	if (status_id === 76679456 || status_id === 142 || status_id === 143 || status_id === 76679460 || status_id === 76679464) {
		const content = getCustom(lead, 1876822, "value")
		if (content) {
			evento.content = content
			evento.term = getCustom(lead, 1876830, "value")
		}
	}
	//console.log(lead)
	console.log(evento)
	repository.create("Eventos", evento)
	//insightfunctionsmap[key](lead);
}

// Pega eventos do perfil e verifica se tem reuniao agendada e cria eventos das reunioes
(async function verificaReuniaoPorPerfil(timeout) {
	setTimeout(() => {
		verificaReuniaoPorPerfil(true)
	}, 1000 * 60 * 60);
	if (!timeout) return
	for (const id of [88272836, 76679460, 76679464]) {
		const [eventos] = await repository.findMany("Eventos", { status_id: id, date: { $gt: new Date('2025-09-01T00:00:00.000Z') } })
		console.log(eventos.length)
		const leadsReuniao = []
		for (const evento of eventos) {
			const lead = await kommo.LeadFind(evento.lead_id)
			if (!lead) {
				console.log(lead, evento.lead_id)
				continue
			}
			const custom = customsToObject(lead)
			if (!custom["1878999"]) continue;
			leadsReuniao.push(evento.lead_id)
			const [reuniao] = await repository.findOne("Eventos", { status_id: 76076812, lead_id: evento.lead_id })
			if (reuniao) continue;
			//values: [ { value: 1751481000 } ]
			const agendamento = new Evento("status", evento.lead_id, 76076812, evento.pipeline_id, new Date(custom['1878999'].values[0].value * 1000))
			agendamento.data_reuniao = new Date(custom['1878999'].values[0].value * 1000)
			if (custom['1880511'])
				agendamento.closer = custom['1880511'].values[0].enum_id.toString()
			const source = custom["1876828"]
			if (source) agendamento.source = source.values[0].value
			const content = custom["1876822"]
			if (content) {
				agendamento.content = content.values[0].value
				agendamento.term = custom["1876830"] ? custom["1876830"].values[0].value : ""
			}
			agendamento.name = lead.name;
			console.log(agendamento)
			repository.create("Eventos", agendamento)
			//console.log(evento.lead_id, custom["1878999"].field_name, new Date(lead.created_at * 1000), new Date(custom['1878999'].values[0].value * 1000))

		}
		console.log(leadsReuniao.length)
	}
});

(async () => {
	const [eventos] = await repository.findMany("Eventos", { status_id: 76679460, date: { $gt: new Date('2025-07-01T03:00:00.000Z') } })
	const base = {}
	const repetidos = []
	for (const evento of eventos) {
		if (base[evento.lead_id]) repetidos.push(evento)
		else base[evento.lead_id] = evento
	}
	console.log(repetidos.length)
	for (const repetido of repetidos) {
		console.log(repetido.lead_id)
		await repository.delete("Eventos", repetido._id)
	}
});

//insere lead do respondi que nao foi para o kommo
(async () => {

	const respostas = {
		"Qual é o seu nome completo?": "Alan Lima",
		"Qual é o seu número de Whatsapp?": "55 19989849037",
		"Qual é o seu melhor e-mail?": "alanslimah10@gmail.com",
		"Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": "Al7_barbearia e alanlimah10",
		"Em qual estado seu salão está situado?": "São Paulo",
		"Em qual cidade seu salão está situado?": "Valinhos",
		"Quem é você dentro do negócio?": "Dono(a) e profissional do seu negócio",
		"Você tem clareza do lucro do seu negócio?": "Tenho lucro mas não sei o valor exato",
		"Qual o tempo de atuação no seu negócio?": "6 anos",
		"Qual o número de colaboradores no seu time?": "4 a 9",
		"Em qual àrea você sente mais dificuldade hoje?": "VENDAS - produtos / serviços de ações comerciais",
		"Quanto você fatura no seu negócio mensalmente?": "51 mil a 100 mil",
		"Quando se trata de investir no crescimento do salão, a decisão é 100% sua ou precisa alinhar com mais alguém? uma pergunta...": "Decido sozinho(a)",
		"Pontuação": 100,
		"Data": "2025-10-27 13:20:53",
		"ID": "237fc2dc-b1c4-4220-a065-837f91b9341f"
	}


	const fieldsmap = {
		"Qual é o seu nome completo?": "name",
		"Qual é o seu número de Whatsapp?": 1876814,
		"Qual é o seu melhor e-mail?": 1876816,
		"Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": 1878315,
		"Em qual estado seu salão está situado?": 1880351,
		"Em qual cidade seu salão está situado?": 1878287,
		"Quem é você dentro do negócio?": 1878289,
		"Você tem clareza do lucro do seu negócio?": 1878293,
		"Qual o tempo de atuação no seu negócio?": 1878295,
		"Qual o número de colaboradores no seu time?": 1878297,
		"Em qual àrea você sente mais dificuldade hoje?": 1878299,
		"Quanto você fatura no seu negócio mensalmente?": 1878291,
		"Quando se trata de investir no crescimento do salão, a decisão é 100% sua ou precisa alinhar com mais alguém? uma pergunta...": 1881259,
	}

	const utmMapping = {
		utm_source: 1876828,
		utm_medium: 1876824,
		utm_campaign: 1876826,
		utm_term: 1876830,
		utm_content: 1876822,
		gclid: 1876838,
		fbclid: 1876840
	};

	const contact = { custom_fields_values: [] }
	for (const key in fieldsmap) {
		if (fieldsmap[key] === "name") contact.name = respostas[key]
		else contact.custom_fields_values.push({
			"field_id": fieldsmap[key],
			"values": [
				{
					"value": respostas[key]
				}
			]
		})
	}


	console.log(JSON.stringify(contact))
	const kcontact = await createContact(aplication, contact.name, contact.custom_fields_values)

	const custom_fields_values = []
	for (const key in utmMapping) {
		if (!respostas[key]) continue
		custom_fields_values.push({
			field_id: utmMapping[key],
			values: [
				{
					"value": respostas[key]
				}
			]
		})
	}
	const lead = await createLead(aplication, 11509584, 94453056, kcontact.id, contact.name, { custom_fields_values })
	console.log("Lead id:", lead.id)
});


import { writeFile, readFile } from "fs";
import EventoAgendamento from './src/domain/agendamento.js';
import belezacontabil from './src/respondi/belezacontabil/index.js';
import preFormulario from './src/landingpage/mvl/preFormulario/index.js';
import creategroupconvert from './src/kommo/creategroupconvert/index.js';
import mvl from './src/respondi/mvl/index.js';
import parse from './src/respondi/parse/index.js';
import rqv from './src/rqv/index.js';
import wmvl from './src/wmvl/index.js';
import login from './src/wmvl/login.js';
import lista from './src/wmvl/lista.js';
import euquero from './src/kommo/funil/euquero.js';
import novolead from './src/kommo/funil/novolead.js';
import sdrswitcher from './src/respondi/sdrswitcher/index.js';
import setsdr from './src/kommo/funil/setsdr.js';
import redirectSDR from './src/respondi/sdrswitcher/redirectSDR.js';
import compareceu from './src/google/compareceu/index.js';
import naocompareceu from './src/google/compareceu/naocompareceu.js';
import iniciofup from './src/kommo/bc/iniciofup/index.js';
import gerarcheckout from './src/google/gerarcheckout/index.js';
import psm from './src/psm/index.js';
import loginpsm from './src/psm/login.js';
import listapsm from './src/psm/lista.js';
import hotmart from './src/hotmart/index.js';
import leadToPedido from './src/omnie/util/leadToPedido.js';
import enviaomie from './src/kommo/enviaomie/index.js';
import dinamico from './src/kommo/insight/dinamico.js';

//pega todos o leads do kommo
(async () => {
	console.log(new Date())
	let page = 1
	const lead_list = []
	while (true) {
		page++
		const result = await kommo.FindByQuery("leads", `page=${page}`)

		const leads = result._embedded.leads

		console.log("total", leads.length)
		for (const lead of leads) {
			const custom = customsToObject(lead)
			if (!custom[1878999] || custom[1878999].values[0].value < 1754006400) continue;
			const addEvent = await repository.findMany("Eventos", { lead_id: lead.id, type: "add" })
			lead_list.push(lead)
		}
		console.log("validos", lead_list.length)
		if (result._embedded.leads.length < 250) break
	}

	console.log("final", lead_list.length)
	console.log(new Date())
	const jsonString = JSON.stringify(lead_list, null, 2);
	writeFile('output.json', jsonString, (err) => {
		if (err) {
			console.error('Error writing file:', err);
			return;
		}
		console.log('Array successfully written to output.json');
	});
});

(async () => {
	const leads = await new Promise(res => {
		readFile('./output.json', 'utf8', (err, data) => {
			if (err) {
				console.error('Error reading file:', err);
				return;
			}
			try {
				const myArray = JSON.parse(data);
				res(myArray);
			} catch (parseError) {
				console.error('Error parsing JSON:', parseError);
			}
		});
	})

	console.log(leads.length)

	let count = 0
	for (const lead of leads) {
		const custom = customsToObject(lead)
		const [evento] = await repository.findOne("Eventos", { lead_id: lead.id, status_id: 76076812, date: new Date(custom[1878999].values[0].value * 1000) })
		if (evento && !evento.compareceu) {
			const compareceu = custom[1879555]
			console.log(lead.name, compareceu)
			if (compareceu)
				await repository.update("Eventos", evento._id, { compareceu: compareceu.values[0].enum_id.toString() })
		}
		if (evento || lead.pipeline_id !== 9907288 && lead.pipeline_id !== 11086428) continue
		count++;
		console.log(count, lead.name)
		const agendamento = new EventoAgendamento(lead, new Date(custom[1878999].values[0].value * 1000))
		const compareceu = custom[1879555]
		if (compareceu)
			agendamento.compareceu = compareceu.values[0].enum_id.toString()
		console.log(agendamento)
		await repository.create("Eventos", agendamento)
	}
});


(async () => {
	const leadIds = [22321315,
		22321297,
		22303023,
		22302839,
		22312859,
		22345677,
		22308651,
		22337409,
		22304265,
		22349393,
		22341729,]

	for (const lead_id of leadIds) {
		const [evento] = await repository.findOne("Eventos", { lead_id, status_id: 76076812, date: { $gt: new Date("2025-08-01") } })
		console.log(evento.date, evento.compareceu, evento.closer)
		repository.update("Eventos", evento._id, { closer: "1301285" })
	}
});


//refaz precos
(async () => {
	const [vendas] = await repository.findMany("Eventos", { status_id: 142, date: { $gt: new Date("2025-08-01") } })
	for (const venda of vendas) {
		const lead = await kommo.LeadFind(venda.lead_id)
		console.log(lead.price)
		await repository.update("Eventos", venda._id, { price: lead.price })
	}
});


// refaz responsavel agendamento
(async function refazRegistrosCompareceu(timeout) {
	/* setTimeout(() => {
		refazRegistrosCompareceu(true)
	}, 1000 * 60 * 5); */
	//if (!timeout) return;
	const [reunioes] = await repository.findMany("Eventos", { status_id: 76076812, date: { $gt: new Date("2025-09-01T00:00:00.000Z") } })
	console.log(reunioes.length)
	for (const reuniao of reunioes) {
		const lead = await kommo.LeadFind(reuniao.lead_id)
		if (!lead) continue;
		/* 
		const custom = customsToObject(lead)
		if (new Date(reuniao.date) < new Date())
			console.log(lead.id, lead.name, custom["1879555"], reuniao.date, new Date(reuniao.date) > new Date() ? "ainda nao aconteceu" : "Deveria ter sim ou nao") */
		const responsavelA = getCustom(lead, 1879503, "enum_id")
		console.log("Responsável agendamento", responsavelA)
		if (responsavelA) {
			console.log(responsavelA)
			await repository.update("Eventos", reuniao._id, { responsavelA })
		}
	}
});


(async () => {
	const result = await kommo.FindByQuery("leads", `filter[pipe][12325788][]=95261104`)
	const status_ids = [95794692, 95794696, 95794700]

	let i = -1
	for (const lead of result._embedded.leads) {
		i++
		await kommo.moveLeadToStatus(lead.id, status_ids[i])
		i = i >= 2 ? -1 : i;
	}
});

(async () => {
	//const result = await kommo.FindByQuery("leads", `filter[pipe][12325788][]=95261108`)
	let page = 0
	const leads_phones = []
	while (true) {
		page++
		const result = await kommo.FindByQuery("leads", `filter[pipe][12325788][]=95261108&page=${page}&with=contacts`)
		console.log("total", result._embedded.leads.length)

		for (const lead of result._embedded.leads) {
			for (const contact_info of lead._embedded.contacts) {
				console.log(lead.name)
				const contact = await kommo.ContactFind(contact_info.id)
				const phone = getCustom(contact, 1876814, "value")
				if (!phone) continue
				leads_phones.push(`${phone.replace(" ", "")}@c.us`)
				fetch("http://localhost:5749/addparticipant", {
					method: "POST",
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ phone: phone.replace(" ", "").replace("+", "") })
				})
				await kommo.moveLeadToStatus(lead.id, 96165140)
				await promessaComAtrasoAleatorio()
			}
		}

		if (result._embedded.leads.length < 250) break
	}
	console.log(JSON.stringify(leads_phones))
});


/**
 * Retorna um número inteiro aleatório dentro de um intervalo especificado (inclusivo em ambos os extremos).
 * @param {number} min - O valor mínimo do intervalo (em milissegundos).
 * @param {number} max - O valor máximo do intervalo (em milissegundos).
 * @returns {number} Um número inteiro aleatório entre min e max.
 */
function obterTempoAleatorio(min, max) {
	// Math.random() gera um número decimal entre 0 (inclusivo) e 1 (exclusivo).
	// A fórmula Math.random() * (max - min + 1) + min gera um número
	// aleatório dentro do intervalo desejado.
	// Math.floor() arredonda para baixo para obter um número inteiro.
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retorna uma Promise que resolve após um tempo aleatório entre 5 e 30 segundos.
 * @returns {Promise<string>} Uma Promise que resolve com uma mensagem e o tempo de espera.
 */
function promessaComAtrasoAleatorio() {
	const MIN_SEGUNDOS = 2;
	const MAX_SEGUNDOS = 5;

	// Converte os segundos para milissegundos (o setTimeout espera ms)
	const tempoMinMs = MIN_SEGUNDOS * 1000;
	const tempoMaxMs = MAX_SEGUNDOS * 1000;

	// Obtém um tempo aleatório dentro do intervalo em milissegundos
	const tempoDeEspera = obterTempoAleatorio(tempoMinMs, tempoMaxMs);

	return new Promise((resolve, reject) => {
		console.log("esperando por:", tempoDeEspera, "segundos")
		setTimeout(() => {
			// A promise é resolvida após o tempo aleatório
			resolve(`A Promise foi resolvida após ${tempoDeEspera / 1000} segundos.`);
		}, tempoDeEspera); //
	});
}


// Refaz insights baseados nos eventos do webhook
(async () => {
	const metaorg = new RepositoryMongoDB(new Mongodb(process.env.DB_URL));
	metaorg.mongo.db = metaorg.mongo.mongoclient.db("metaorg");
	const [events, err] = await metaorg.findMany("Events", { date: { $gt: new Date("2026-01-17T00:00:00") } })
	if (err) return
	console.log(events.length);
	for (const event of events) {
		Object.assign(event.body, { backup_date: event.date })
		await fetch("http://localhost:5001/teste/webhook/kommo/insight", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(event.body)
		});
		await new Promise(res => setTimeout(() => {
			res(true)
		}, 50))
	}
});

// adiciona link das reunioes no evento de reuniao
(async () => {
	const [reunioes, err] = await repository.findMany("Eventos", { status_id: 76076812, date: { $gt: new Date("2025-11-15") } })
	console.log(reunioes.length)
	for (const reuniao of reunioes) {
		console.log(reuniao.name)
		const lead_contact = await kommo.LeadFind(reuniao.lead_id)
		if (!lead_contact || !lead_contact._embedded.contacts) continue
		console.log(lead_contact.name)
		for (const contact_basic of lead_contact._embedded.contacts) {
			const contact = await kommo.ContactFind(contact_basic.id)
			const link_reuniao = getCustom(contact, 1878319, "value")
			if (!link_reuniao) continue
			await repository.update("Eventos", reuniao._id, { meet_url: link_reuniao })
		}
	}
});

(async () => {
	const utmsMap = {
		"utm_content": 1876822,
		"utm_medium": 1876824,
		"utm_campaign": 1876826,
		"utm_source": 1876828,
		"utm_term": 1876830,
		"utm_referrer": 1876832,
	}

	const [fillforms, err] = await repository.findMany("LeadsFromPSM", { type: "fillform", "utmParams.utm_source": "prevenda", lead_id: { $ne: null } })
	if (err) return
	for (const lead of fillforms) {
		const custom_fields_values = []
		if (lead.utmParams)
			for (const key in lead.utmParams) {
				if (!utmsMap[key]) continue;
				custom_fields_values.push({
					"field_id": utmsMap[key],
					"values": [
						{
							"value": lead.utmParams[key]
						}
					]
				})
			}
		console.log(custom_fields_values)
		if (lead.lead_id)
			await kommo.LeadUpdate(lead.lead_id, { custom_fields_values })
	}
});


// Refaz insights baseados nos eventos do webhook
(async () => {
	const [events, err] = await repository.findMany("ComprasAprovadas", { "product.id": 6726232 })
	if (err) return
	console.log(events.length);
	for (const event of events) {
		console.log(event.product.name, event.buyer.name)
		await fetch("http://localhost:5001/hotmart", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				"event": "PURCHASE_APPROVED",
				"data": event
			})
		});
		await new Promise(res => setTimeout(() => {
			res(true)
		}, 500))
	}
});

(async () => {
	leadToPedido(aplication, { id: 23017025 })
});

(async () => {
	const lead = await kommo.LeadFind(23185687)
	dinamico(aplication, lead)
	leadToPedido(aplication, { id: lead.id })
});