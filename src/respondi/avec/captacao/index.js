import createContact from "../../../kommo/util/createContact.js";
import createLead from "../../../kommo/util/createLead.js";
import answersToCustomFields from "../../util/answersToCustomFields.js";

const answerFieldsMap = {
    "x9qne4si4vzp": 1876814, // Qual é o seu número de Whatsapp? -> Phone
    "xk4qpp2lhoh": 1876816, // Qual é o seu melhor e-mail? -> Email
    "xg6ayiq29rwf": 1878315, // Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal? -> Instagram
    "xzn55i94d4f": 1880351, // Em qual estado seu salão está situado? -> Estado do Salão
    "xd115sg65bpr": 1878287, // Em qual cidade seu salão está situado? -> Cidade do Salão
    "xjnirz2pqgy": 1878289, // Quem é você dentro do negócio? -> Quem é você?
    "xuvuahv3jyor": 1878293, // Você tem clareza do lucro do seu negócio? -> Clareza dos lucros
    "xt2h6820w2x": 1878295, // Qual o tempo de atuação no seu negócio? -> Tempo de Atuação
    "xotep0x273uc": 1878297, // Qual o número de colaboradores no seu time? -> Quantidade de Funcionários
    "x3c9u8ihorn4": 1878299, // Em qual àrea você sente mais dificuldade hoje? -> Dificuldade
    "xwmol4zkwuc": 1878291, // Quanto você fatura no seu negócio mensalmente? -> Faturamento
};

/**
 * @typedef { import("../../app/index.js").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    console.log("chegou Avec captacao")
    //console.log(JSON.stringify(req.body))
    res.json({ msg: "ok" })
    const { respondent } = req.body
    const formAnswers = answersToCustomFields(respondent, answerFieldsMap)

    const contact = await createContact(app, formAnswers.name, formAnswers.custom_fields_values)
    if (!contact) return console.log(JSON.stringify(req.body))
    const lead = await createLead(app, 11459696, 87990944, contact.id, formAnswers.name)
}