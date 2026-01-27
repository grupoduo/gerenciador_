/**
 * @typedef { import("../../app").default } App
 * @typedef { import("express").Request } Request
 * @typedef { import("express").Response } Response
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, req, res) => {
    res.json({ msg: "ok" })

    const { 
        valor_total,
        pagamentos,
        timestamp,
        pathname,
        origin
    } = req.body

    /* {
    "valor_total": 1000,
    "pagamentos": {
        "pix": {
            "valor": 820
        },
        "cartao": {
            "valor": 180,
            "parcelas": 1
        },
        "boleto": null
    },
    "timestamp": "2025-12-12T19:12:41.229Z"
} */
    const lead = await PegaLead(app, origin, pathname)
    if(!lead) return
    console.log(lead.name)

    await app.kommo.LeadUpdate(lead.id, {
        custom_fields_values: [
            {
                "field_id": 1881845,
                "values": [
                    { "value": geraStringObs(valor_total, pagamentos)}
                ]
            }
            ,{
                "field_id": 1881839,
                "values": [
                    { "value": "0x"}
                ]
            }
            ,{
                "field_id": 1881835,
                "values": [
                    { "value": `${pagamentos.cartao? pagamentos.cartao.valor : 0}`}
                ]
            }
        ]
    })

    // tenho que criar ou pegar o cliente
    /*
    "codigo_cliente_integracao": lead,
    "email": "primeiro@ccliente.com.br",
  "razao_social": "Primeiro Cliente Ltda Me",
  "nome_fantasia": "Primeiro Cliente",
  "cnpj_cpf": "80.716.929/0001-50",
  "endereco": "endereco",
  "endereco_numero": "123",
  "bairro": "teste",
  "complemento": "tsetse",
  "estado": "RS",
  "cidade": "Passo Fundo",
  "cep": "99010520"
    */

  //tenho que criar pedido
  /**
   * {
            "cabecalho": {
                "codigo_cliente": 3945160859,
                "codigo_pedido_integracao": "1765485425",
                "data_previsao": "11/12/2025",
                "codigo_parcela": "999",
                "quantidade_itens": 1
            },
            "det": [
                {
                    "ide": {
                        "codigo_item_integracao": "4422421"
                    },
                    "produto": {
                        "codigo_produto": 3584814157,
                        "cfop": "6.102",
                        "quantidade": 1,
                        "valor_unitario": 7080
                    }
                }
            ],
            "informacoes_adicionais": {
                "codigo_categoria": "1.01.03",
                "codigo_conta_corrente": 3747672900,
                "consumidor_final": "S",
                "enviar_email": "N"
            },
            "lista_parcelas": {
                "parcela": [
                    {
                        "data_vencimento": "12/12/2025",
                        "numero_parcela": 1,
                        "percentual": 35.31,
                        "valor": 2500
                    },
                    {
                        "data_vencimento": "11/05/2026",
                        "numero_parcela": 2,
                        "percentual": 64.69,
                        "valor": 4580
                    }
                ]
            }
        }
   */
}

function geraStringObs(valor_total, pagamentos) {
    return `No total de ${valor_total} foram pagos
 no Pix: ${pagamentos.pix? pagamentos.pix.valor : 0}
 no Cartão: ${pagamentos.cartao? pagamentos.cartao.valor : 0} em ${pagamentos.cartao? pagamentos.cartao.parcelas : 0}x
 no Boleto: ${pagamentos.boleto? pagamentos.boleto.valor : 0} em ${pagamentos.boleto? pagamentos.boleto.parcelas : 0}x`
}

/**
 * 
 * @param {App} app 
 * @param {string} origin 
 * @param {string} pathname 
 * @returns 
 */
async function PegaLead(app, origin, pathname) {
    if(origin === "https://meet.google.com") {
        const [reuniao, err] = await app.repository.findOne("Eventos", { meet_url: `https://meet.google.com/${pathname.replace("/", "")}` })
        if (err || !reuniao) return
        return await app.kommo.LeadFind(reuniao.lead_id)
    }

    const [type, cmd, id] = pathname.split("/")
    if(type !== "leads" || cmd !== "detail" ) return

    return await app.kommo.LeadFind(id)
}