const mapA = {
    "Qual é o seu nome completo?": "xopyalskloic",
    "Qual é o seu número de Whatsapp?": "x9qne4si4vzp",
    "Qual é o seu melhor e-mail?": "xk4qpp2lhoh",
    "Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": "xg6ayiq29rwf",
    "Em qual estado seu salão está situado?": "xzn55i94d4f",
    "Em qual cidade seu salão está situado?": "xd115sg65bpr",
    "Quem é você dentro do negócio?": "xjnirz2pqgy",
    "Você tem clareza do lucro do seu negócio?": "xuvuahv3jyor",
    "Qual o tempo de atuação no seu negócio?": "xt2h6820w2x",
    "Qual o número de colaboradores no seu time?": "xotep0x273uc",
    "Em qual àrea você sente mais dificuldade hoje?": "x3c9u8ihorn4",
    "Quanto você fatura no seu negócio mensalmente?": "xwmol4zkwuc"
}

const rawA = [
    {
   "Qual é o seu nome completo?": "Tagna Oliveira",
   "Qual é o seu número de Whatsapp?": "55 15997690480",
   "Qual é o seu melhor e-mail?": "tagna.pais@gmail.com",
   "Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": "Barbearia da hora concepto",
   "Em qual estado seu salão está situado?": "Cerquilho sp",
   "Em qual cidade seu salão está situado?": "Cerquilho",
   "Quem é você dentro do negócio?": "Dono(a) e profissional do seu negócio",
   "Você tem clareza do lucro do seu negócio?": "Tenho lucro mas não sei o valor exato",
   "Qual o tempo de atuação no seu negócio?": "4 meses",
   "Qual o número de colaboradores no seu time?": "1 a 3",
   "Em qual àrea você sente mais dificuldade hoje?": "MARKETING - atração de clientes / presença nas redes sociais",
   "Quanto você fatura no seu negócio mensalmente?": "0 a 9 mil",
   "⚙️ - Parabéns! Seu salão foi selecionado!": "https://calendly.com/scheduled_events/19b4ed29-2637-41d3-970d-95813db63990/invitees/8fe13a68-70a5-4c6c-bd46-78f28fc53afc",
   "🚀 - Parabéns! Seu salão foi selecionado!": "",
   "💎 - Parabéns! Seu salão foi selecionado!": "",
   "Pontuação": 50,
   "Data": "2025-07-24 12:18:47",
   "ID": "2995ab94-ca74-4bb2-9af7-a1878ba55155",
   "utm_source": "Bio",
   "utm_medium": "",
   "utm_campaign": "",
   "utm_term": "",
   "utm_content": "",
   "gclid": "",
   "fbclid": "PAZXh0bgNhZW0CMTEAAafSLzsyH10F8CeI_G7ccwy_tL_seLdW37wIOue_yLyAXj7agVeYTT2_7OrXCA_aem_6QnX6U5M5SlQ9c7dY0orww"
 }
]


console.log(JSON.stringify(rawA.map(a => {
    const data = {
        "form": {
            "form_name": "Avec Franquia Barueri",
            "form_id": "eOYHo1KF"
        },
        "respondent": {
            "status": "completed",
            "date": "2025-06-30 13:58:26",
            "score": null,
            "respondent_id": "bad6746c-ee56-4efe-9099-58e177b051d4",
            "answers": {
                "Qual é o seu nome completo?": "Ednara Maria Santos Regis",
                "Qual é o seu número de Whatsapp?": "55 88999039770",
                "Qual é o seu melhor e-mail?": "regisnara12@gmail.com",
                "Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": "@Renovasalonbeauty @ednararegis",
                "Em qual estado seu salão está situado?": "Ceará",
                "Em qual cidade seu salão está situado?": "Limoeiro Do Norte",
                "Quem é você dentro do negócio?": "Dono(a) e profissional do seu negócio",
                "Você tem clareza do lucro do seu negócio?": "Tenho lucro mas não sei o valor exato",
                "Qual o tempo de atuação no seu negócio?": "20 anos",
                "Qual o número de colaboradores no seu time?": "1 a 3",
                "Em qual àrea você sente mais dificuldade hoje?": "MARKETING - atração de clientes / presença nas redes sociais",
                "Quanto você fatura no seu negócio mensalmente?": "21 mil a 40 mil"
            },
            "raw_answers": []
        }
    }
    for (const key in a) {
        if (Object.prototype.hasOwnProperty.call(mapA, key)) {
            data.respondent.raw_answers.push({
                "question": {
                    "question_title": key,
                    "question_id": mapA[key],
                    "question_type": "text"
                },
                "answer": a[key]
            })
        }
    }
    return data
})))