import getCustom from "../../kommo/util/getCustom.js"

const mapEstadosUF = {
    "Acre": "AC",
    "Alagoas": "AL",
    "Amapá": "AP",
    "Amazonas": "AM",
    "Bahia": "BA",
    "Ceará": "CE",
    "Distrito Federal": "DF",
    "Espírito Santo": "ES",
    "Goiás": "GO",
    "Maranhão": "MA",
    "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG",
    "Pará": "PA",
    "Paraíba": "PB",
    "Paraná": "PR",
    "Pernambuco": "PE",
    "Piauí": "PI",
    "Rio de Janeiro": "RJ",
    "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS",
    "Rondônia": "RO",
    "Roraima": "RR",
    "Santa Catarina": "SC",
    "São Paulo": "SP",
    "Sergipe": "SE",
    "Tocantins": "TO"
}

const mapProdutos = {
    1299395: 3540400824,// "Mapa do Salão Lucrativo - anual",
    1299397: 3540400824,// "Mapa do Salão Lucrativo - semestral",
    1299399: 3598805071,// "Método do Salão Lucrativo - anual",
    1299709: 3584814157,// "Consultoria Individual Personalizada",
    1301567: 3824692810,// "Formula Salão Lucrativo",
}
/**
 * @typedef { import("../../app").default } App
 * @param {App} app 
 * @param {Request} req 
 * @param {Response} res 
 */
export default async (app, raw_lead) => {
    const lead = await app.kommo.LeadFind(raw_lead.id)
    if (!lead) return console.log("Não foi possível criar Pedido: Id do Lead Invalido")
    const contact = await app.kommo.ContactFind(lead._embedded.contacts[0].id)
    const Omnie_cliente = {
        "codigo_cliente_integracao": contact.id,
        "email": getCustom(contact, 1876816, "value"),
        "razao_social": contact.name,
        "nome_fantasia": contact.name,
        "cnpj_cpf": getCustom(contact, 1879711, "value"),
        "endereco": getCustom(contact, 1879193, "value"),
        "endereco_numero": getCustom(contact, 1883537, "value"),
        "bairro": getCustom(contact, 1883541, "value"),
        "complemento": "",
        "estado": mapEstadosUF[getCustom(contact, 1880351, "value")],
        "cidade": `${getCustom(contact, 1878287, "value")}`,
        "cep": getCustom(contact, 1879195, "value"),
    }

    const request = {
        "call": "IncluirCliente",
        "app_key": "4142755857240",
        "app_secret": process.env.OMIE_SECRET,
        "param": [Omnie_cliente]
    }

    const omie = await new Promise(res => fetch("https://app.omie.com.br/api/v1/geral/clientes/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request)
    })
        .then(response => response.json())
        .then(result => res(result))
        .catch(err => console.error(err)));

    console.log(omie)
    // TODO: primeiro testar criacao de cliente depois tenho que pegar o id do cliente e criar o pedido

    /* 
    {
  "codigo_cliente_integracao": "CodigoInterno0001",
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
} */

    /* 
    Dados para Onboarding! 🚀
   
  Nome completo:
  CPF / CNPJ:
  Ins Estatual:
  Email:
  Endereço:
  CEP:
  Cidade / Estado:
  Contato / WhatsApp:
   
  Segunda cadeira 🪑
  Nome completo:
  WhatsApp:
  E-mail: */
    const request_pedido = {
        "cabecalho": {
            "codigo_cliente": omie.codigo_cliente_omie,
            "codigo_pedido_integracao": lead.id,
            "data_previsao": formatarData(new Date()),
            "codigo_parcela": "999",
            "quantidade_itens": 1
        },
        "det": [
            {
                "ide": {
                    "codigo_item_integracao": "4422421"
                },
                "produto": {
                    "codigo_produto": mapProdutos[getCustom(lead, 1879015, "enum_id")],
                    "cfop": "6.102",
                    "quantidade": 1,
                    "valor_unitario": lead.price
                }
            }
        ],
        "informacoes_adicionais": {
            "codigo_categoria": "1.01.03",
            "codigo_conta_corrente": 3747672900,
            "consumidor_final": "S",
            "enviar_email": "N"
        },
        "observacoes": {
            "obs_venda": `Valor Pago no Cartão: ${getCustom(lead, 1881835, "value")}|Valor Pago no Pix: ${getCustom(lead, 1881879, "value")}|Parcelamento no boleto: ${getCustom(lead, 1881839, "value")}|Observações Sobre Pagamento: ${getCustom(lead, 1881845, "value")}`
        }
    }


    const omie_pedido = await new Promise(res => fetch("https://app.omie.com.br/api/v1/produtos/pedido/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "call":"IncluirPedido",
            "app_key":"4142755857240",
	        "app_secret":process.env.OMIE_SECRET,
            "param":[request_pedido]
        })
    })
        .then(response => response.json())
        .then(result => res(result))
        .catch(err => console.error(err)))

    console.log(omie_pedido)
    /* 
    {
              "cabecalho": {
                  "codigo_cliente": 3945160859,
                  "codigo_pedido_integracao": "176548554654",
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
              },
                      "observacoes": {
                  "obs_venda": "Alcides|CNPJ 23012319230|Cidade Teste"
              }
          } */
}


function formatarData(data = new Date()) { // Aceita um objeto Date ou usa a data atual
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // getMonth() retorna de 0 a 11
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}