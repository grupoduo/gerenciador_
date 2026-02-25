transforme esses json em um objetos hash map para cada pergunta
exemplo da saida
``` js
const answerFieldsMap = {
    "x9qne4si4vzp": 1876814, // phone
    "xk4qpp2lhoh": 1876816, // email
    "xg6ayiq29rwf": 1878315, // instagram
    "xuvuahv3jyor": 1878293, // a pergunta Você tem clareza do lucro do seu negócio? liga aponta para id Clareza dos lucros
};
```
``` json
{
    "form": {
        "form_name": "Novo formulário Avec Franquia Barueri",
        "form_id": "ceksxHyj"
    },
    "respondent": {
        "status": "completed",
        "date": "2025-07-18 18:10:10",
        "score": null,
        "respondent_id": "5c8e5743-d53e-4b6c-8e0c-a3c29b81a826",
        "answers": {
            "Qual é o seu nome completo?": "Evandro Desconsidere",
            "Qual é o seu número de Whatsapp?": "55 54992627352",
            "Qual é o seu melhor e-mail?": "evandrouzeda@gmail.com",
            "Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?": "@evandrohairstyle",
            "Em qual estado seu salão está situado?": "Rio Grande do Sul",
            "Em qual cidade seu salão está situado?": "Passo Fundo",
            "Quem é você dentro do negócio?": "Apenas dono(a)",
            "Você tem clareza do lucro do seu negócio?": "Tenho lucro mas não sei o valor exato",
            "Qual o tempo de atuação no seu negócio?": "10 anos",
            "Qual o número de colaboradores no seu time?": "1 a 3",
            "Em qual àrea você sente mais dificuldade hoje?": "MARKETING - atração de clientes / presença nas redes sociais",
            "Quanto você fatura no seu negócio mensalmente?": "41 mil a 60 mil"
        },
        "raw_answers": [
            {
                "question": {
                    "question_title": "Qual é o seu nome completo?",
                    "question_id": "xopyalskloic",
                    "question_type": "name"
                },
                "answer": "Evandro Desconsidere"
            },
            {
                "question": {
                    "question_title": "Qual é o seu número de Whatsapp?",
                    "question_id": "x9qne4si4vzp",
                    "question_type": "phone"
                },
                "answer": {
                    "country": "55",
                    "phone": "54992627352"
                }
            },
            {
                "question": {
                    "question_title": "Qual é o seu melhor e-mail?",
                    "question_id": "xk4qpp2lhoh",
                    "question_type": "email"
                },
                "answer": "evandrouzeda@gmail.com"
            },
            {
                "question": {
                    "question_title": "Qual é o @ do instagram do seu salão e o @ do seu instagram pessoal?",
                    "question_id": "xg6ayiq29rwf",
                    "question_type": "text"
                },
                "answer": "@evandrohairstyle"
            },
            {
                "question": {
                    "question_title": "Em qual estado seu salão está situado?",
                    "question_id": "xzn55i94d4f",
                    "question_type": "text"
                },
                "answer": "Rio Grande do Sul"
            },
            {
                "question": {
                    "question_title": "Em qual cidade seu salão está situado?",
                    "question_id": "xd115sg65bpr",
                    "question_type": "text"
                },
                "answer": "Passo Fundo"
            },
            {
                "question": {
                    "question_title": "Quem é você dentro do negócio?",
                    "question_id": "xjnirz2pqgy",
                    "question_type": "radio"
                },
                "answer": [
                    "Apenas dono(a)"
                ]
            },
            {
                "question": {
                    "question_title": "Você tem clareza do lucro do seu negócio?",
                    "question_id": "xuvuahv3jyor",
                    "question_type": "radio"
                },
                "answer": [
                    "Tenho lucro mas não sei o valor exato"
                ]
            },
            {
                "question": {
                    "question_title": "Qual o tempo de atuação no seu negócio?",
                    "question_id": "xt2h6820w2x",
                    "question_type": "text"
                },
                "answer": "10 anos"
            },
            {
                "question": {
                    "question_title": "Qual o número de colaboradores no seu time?",
                    "question_id": "xotep0x273uc",
                    "question_type": "radio"
                },
                "answer": [
                    "1 a 3"
                ]
            },
            {
                "question": {
                    "question_title": "Em qual àrea você sente mais dificuldade hoje?",
                    "question_id": "x3c9u8ihorn4",
                    "question_type": "radio"
                },
                "answer": [
                    "MARKETING - atração de clientes / presença nas redes sociais"
                ]
            },
            {
                "question": {
                    "question_title": "Quanto você fatura no seu negócio mensalmente?",
                    "question_id": "xwmol4zkwuc",
                    "question_type": "radio"
                },
                "answer": [
                    "41 mil a 60 mil"
                ]
            }
        ],
        "respondent_utms": {
            "utm_source": "",
            "utm_medium": "",
            "utm_campaign": "",
            "utm_term": "",
            "utm_content": "",
            "gclid": "",
            "fbclid": ""
        }
    }
}
```

``` json
{
  "_total_items": 25,
  "_page": 1,
  "_page_count": 1,
  "_links": {
    "self": {
      "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields?page=1&limit=250"
    }
  },
  "_embedded": {
    "custom_fields": [
      {
        "id": 1876812,
        "name": "Position",
        "type": "text",
        "account_id": 30842051,
        "code": "POSITION",
        "sort": 511,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": false,
        "is_predefined": true,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1876812?page=1&limit=250"
          }
        }
      },
      {
        "id": 1876814,
        "name": "Phone",
        "type": "multitext",
        "account_id": 30842051,
        "code": "PHONE",
        "sort": 4,
        "is_api_only": false,
        "enums": [
          {
            "id": 1297240,
            "value": "WORK",
            "sort": 2
          },
          {
            "id": 1297242,
            "value": "WORKDD",
            "sort": 4
          },
          {
            "id": 1297244,
            "value": "MOB",
            "sort": 6
          },
          {
            "id": 1297246,
            "value": "FAX",
            "sort": 8
          },
          {
            "id": 1297248,
            "value": "HOME",
            "sort": 10
          },
          {
            "id": 1297250,
            "value": "OTHER",
            "sort": 12
          }
        ],
        "group_id": null,
        "required_statuses": [],
        "is_deletable": false,
        "is_predefined": true,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1876814?page=1&limit=250"
          }
        }
      },
      {
        "id": 1876816,
        "name": "Email",
        "type": "multitext",
        "account_id": 30842051,
        "code": "EMAIL",
        "sort": 6,
        "is_api_only": false,
        "enums": [
          {
            "id": 1297252,
            "value": "WORK",
            "sort": 2
          },
          {
            "id": 1297254,
            "value": "PRIV",
            "sort": 4
          },
          {
            "id": 1297256,
            "value": "OTHER",
            "sort": 6
          }
        ],
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 9907288,
            "status_id": 142
          },
          {
            "pipeline_id": 11086428,
            "status_id": 142
          }
        ],
        "is_deletable": false,
        "is_predefined": true,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1876816?page=1&limit=250"
          }
        }
      },
      {
        "id": 1876850,
        "name": "Termos do usuário",
        "type": "checkbox",
        "account_id": 30842051,
        "code": "USER_AGREEMENT",
        "sort": 520,
        "is_api_only": true,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1876850?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878287,
        "name": "Cidade do Salão",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 514,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 9907288,
            "status_id": 142
          }
        ],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878287?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878289,
        "name": "Quem é você?",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 513,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878289?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878291,
        "name": "Faturamento",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 512,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878291?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878293,
        "name": "Clareza dos lucros",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 515,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878293?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878295,
        "name": "Tempo de Atuação",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 516,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878295?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878297,
        "name": "Quantidade de Funcionários",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 517,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878297?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878299,
        "name": "Dificuldade",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 518,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878299?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878315,
        "name": "Instagram",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 519,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878315?page=1&limit=250"
          }
        }
      },
      {
        "id": 1878319,
        "name": "Link da Reunião",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 521,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 11086428,
            "status_id": 142
          },
          {
            "pipeline_id": 9907288,
            "status_id": 76076812
          }
        ],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1878319?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879157,
        "name": "Link para agendar",
        "type": "url",
        "account_id": 30842051,
        "code": null,
        "sort": 503,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879157?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879189,
        "name": "CPF / CNPJ:",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 504,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879189?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879191,
        "name": "Ins Estatual:",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 505,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 9907288,
            "status_id": 142
          }
        ],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879191?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879193,
        "name": "Endereço:",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 506,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 9907288,
            "status_id": 142
          }
        ],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879193?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879195,
        "name": "CEP:",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 507,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 9907288,
            "status_id": 142
          }
        ],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879195?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879711,
        "name": "CPF/CNPJ",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 508,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879711?page=1&limit=250"
          }
        }
      },
      {
        "id": 1879713,
        "name": "Endereço",
        "type": "streetaddress",
        "account_id": 30842051,
        "code": null,
        "sort": 509,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1879713?page=1&limit=250"
          }
        }
      },
      {
        "id": 1880351,
        "name": "Estado do Salão",
        "type": "select",
        "account_id": 30842051,
        "code": null,
        "sort": 510,
        "is_api_only": false,
        "enums": [
          {
            "id": 1300999,
            "value": "Acre",
            "sort": 500
          },
          {
            "id": 1301001,
            "value": "Alagoas",
            "sort": 1
          },
          {
            "id": 1301003,
            "value": "Amapá",
            "sort": 2
          },
          {
            "id": 1301005,
            "value": "Amazonas",
            "sort": 3
          },
          {
            "id": 1301007,
            "value": "Bahia",
            "sort": 4
          },
          {
            "id": 1301009,
            "value": "Ceará",
            "sort": 5
          },
          {
            "id": 1301011,
            "value": "Espírito Santo",
            "sort": 6
          },
          {
            "id": 1301013,
            "value": "Goiás",
            "sort": 7
          },
          {
            "id": 1301015,
            "value": "Maranhão",
            "sort": 8
          },
          {
            "id": 1301017,
            "value": "Mato Grosso",
            "sort": 9
          },
          {
            "id": 1301019,
            "value": "Mato Grosso do Sul",
            "sort": 10
          },
          {
            "id": 1301021,
            "value": "Minas Gerais",
            "sort": 11
          },
          {
            "id": 1301023,
            "value": "Pará",
            "sort": 12
          },
          {
            "id": 1301025,
            "value": "Paraíba",
            "sort": 13
          },
          {
            "id": 1301027,
            "value": "Paraná",
            "sort": 14
          },
          {
            "id": 1301029,
            "value": "Pernambuco",
            "sort": 15
          },
          {
            "id": 1301031,
            "value": "Piauí",
            "sort": 16
          },
          {
            "id": 1301033,
            "value": "Rio de Janeiro",
            "sort": 17
          },
          {
            "id": 1301035,
            "value": "Rio Grande do Norte",
            "sort": 18
          },
          {
            "id": 1301037,
            "value": "Rio Grande do Sul",
            "sort": 19
          },
          {
            "id": 1301039,
            "value": "Rondônia",
            "sort": 20
          },
          {
            "id": 1301041,
            "value": "Roraima",
            "sort": 21
          },
          {
            "id": 1301043,
            "value": "Santa Catarina",
            "sort": 22
          },
          {
            "id": 1301045,
            "value": "São Paulo",
            "sort": 23
          },
          {
            "id": 1301047,
            "value": "Sergipe",
            "sort": 24
          },
          {
            "id": 1301049,
            "value": "Tocantins",
            "sort": 25
          },
          {
            "id": 1301051,
            "value": "Distrito Federal",
            "sort": 26
          }
        ],
        "group_id": null,
        "required_statuses": [
          {
            "pipeline_id": 9907288,
            "status_id": 142
          }
        ],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1880351?page=1&limit=250"
          }
        }
      },
      {
        "id": 1880729,
        "name": "é a oportunidade ideal para você?",
        "type": "textarea",
        "account_id": 30842051,
        "code": null,
        "sort": 522,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1880729?page=1&limit=250"
          }
        }
      },
      {
        "id": 1880731,
        "name": "Por que você acha que sua aplicação deve ser aceita?",
        "type": "textarea",
        "account_id": 30842051,
        "code": null,
        "sort": 523,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1880731?page=1&limit=250"
          }
        }
      },
      {
        "id": 1880733,
        "name": "Forma de Pagamento",
        "type": "text",
        "account_id": 30842051,
        "code": null,
        "sort": 524,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1880733?page=1&limit=250"
          }
        }
      },
      {
        "id": 1880735,
        "name": "decisão",
        "type": "textarea",
        "account_id": 30842051,
        "code": null,
        "sort": 526,
        "is_api_only": false,
        "enums": null,
        "group_id": null,
        "required_statuses": [],
        "is_deletable": true,
        "is_predefined": false,
        "entity_type": "contacts",
        "remind": null,
        "triggers": [],
        "currency": null,
        "hidden_statuses": [],
        "_links": {
          "self": {
            "href": "https://grupoduoadm.kommo.com/api/v4/contacts/custom_fields/1880735?page=1&limit=250"
          }
        }
      }
    ]
  }
}
```
