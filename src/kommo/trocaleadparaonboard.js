(async () => {
    const result = await fetch(`${kommo.url}/leads?filter%5Bpipeline_id%5D%5B0%5D=9681336&page=1&limit=250`, {
        method: "GET",
        headers: kommo.headers
    }).then(res => res.json())
    const stages = [71942512, 71966200, 71966204, 71966208, 71966212, 71966216, 71966220, 71966224, 71966228, 71966232, 71966236, 71966240, 71966244]

    for (const lead of result._embedded.leads) {
        console.log(lead.id)
        if (lead.status_id !== 74556236 || !lead.custom_fields_values || !lead.custom_fields_values.find(f => f.field_id === 1879015)) continue;
        const data_entrada = lead.custom_fields_values.find(f => f.field_id === 1878425);
        const produto = lead.custom_fields_values.find(f => f.field_id === 1879015)
        if (!data_entrada || !produto) continue;
        const lead_date = new Date(data_entrada.values[0].value * 1000);
        console.log(lead_date);
        
        const time = new Date().getTime() - lead_date.getTime()
        const mes = Math.floor(time / 2592000000)
        console.log(time, lead.name, "meses", mes)
        await kommo.moveLeadToStatus(lead.id, stages[mes])
        await fetch(`${kommo.url}/salesbot/run`, {
            method: "POST",
            headers: kommo.headers,
            body: JSON.stringify([{
                "bot_id": 51673,
                "entity_id": lead.id,
                "entity_type": "2"
            }])
        }).then(res => res.json())
    }
})//();