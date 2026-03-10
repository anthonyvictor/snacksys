import { getGroq } from "@/infra/groq";
import { IChat, IntentResult } from "types";
import { Mistral } from "@mistralai/mistralai";
//     model: "llama3-8b-instant",
// const hasProducts = !!chat.order?.products?.length;

export async function detectIntentIA2(text: string, chat: IChat) {
  const infos: string[] = [];

  if (chat.context) infos.push(`Última intent foi "${chat.context}"`);
  if (chat.menuSent) infos.push(`O cardápio já foi enviado anteriormente`);

  // ex: Rua Lauro de Freitas, Avenida Aliomar Baleeiro, Ladeira do Jardim Zoológico, Beco do amor (Nunca invente)
  // ex: Ondina, Alto do Coqueirinho, Rio Vermelho, São Cristóvão, Itinga (Nunca invente)
  // ex: Edificio Jandira, Apartamento 202, Bloco B, 1 andar (Nunca invente)
  // ex: Ao lado do bar de Tonho, Em frente ao mercadinho, Em cima da casa de Manoel, Perto da pracinha (Nunca invente)
  // endereço completo bruto, por extenso do jeito que o cliente digitou (é obrigatório)

  // const deliveryTools = [
  //   {
  //     type: "function" as const,
  //     function: {
  //       name: "classify_delivery_intent",
  //       description:
  //         "Classifica intenções e extrai entidades para um app de delivery.",
  //       parameters: {
  //         type: "object",
  //         properties: {
  //           intent: {
  //             type: "string",
  //             enum: ["askDelivery", "addPayments", "informName", "unknown"],
  //             description: "A intenção predominante do usuário.",
  //           },
  //           entities: {
  //             type: "object",
  //             properties: {
  //               // Entidades para informName
  //               fullName: { type: "string" },
  //               phoneNumber: { type: "string" },

  //               // Entidades para askDelivery
  //               type: { type: "string", enum: ["delivery", "pickup"] },
  //               address: {
  //                 type: "object",
  //                 properties: {
  //                   street: { type: "string" },
  //                   neighborhood: { type: "string" },
  //                   complement: { type: "string" },
  //                   number: { type: "string" },
  //                   reference: { type: "string" },
  //                   zipCode: { type: "string" },
  //                 },
  //               },
  //               // Entidades para addPayments
  //               payments: {
  //                 type: "array",
  //                 items: {
  //                   type: "object",
  //                   properties: {
  //                     method: { type: "string", enum: ["card", "cash", "pix"] },
  //                     amount: { type: "string" }, // 'part'|'half'|'total' ou número
  //                     changeFor: { type: "number" },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //         required: ["intent", "entities"],
  //       },
  //     },
  //   },
  // ];

  const deliveryTools = [
    {
      type: "function" as const,
      function: {
        name: "classify_delivery_intent",
        description:
          "Classifica a intenção e extrai entidades. Se uma entidade não for mencionada, ela NÃO deve ser incluída no JSON.",
        parameters: {
          type: "object",
          properties: {
            intent: {
              type: "string",
              enum: [
                "addProducts",
                "addPayments",
                "askDelivery",
                "informName",
                "unknown",
              ],
              description: "Intenção predominante do usuário.",
            },
            entities: {
              type: "object",
              description:
                "Extração estrita. JAMAIS preencha campos com valores genéricos como 'rua', 'bairro' ou '123' se não estiverem no texto.",
              properties: {
                // Produtos
                products: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "number" },
                      observations: { type: "string" },
                    },
                    required: ["name", "quantity"],
                  },
                },
                // Pagamentos
                payments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      method: { type: "string", enum: ["card", "cash", "pix"] },
                      amount: {
                        oneOf: [{ type: "string" }, { type: "number" }],
                      },
                      changeFor: { type: "string" },
                    },
                    required: ["method"],
                  },
                },
                // Delivery (Onde estava o erro)
                type: {
                  type: "string",
                  enum: ["pickup", "delivery"],
                  description: "Tipo de recebimento mencionado.",
                },
                address: {
                  type: "object",
                  description:
                    "ATENÇÃO: Este objeto só deve existir se houver detalhes geográficos reais (nome de rua, número, etc). Se o usuário disse apenas 'entrega', preencha apenas o campo 'type' acima e deixe este objeto 'address' de fora.",
                  properties: {
                    street: {
                      type: "string",
                      description: "Nome da rua.",
                    },
                    neighborhood: {
                      type: "string",
                      description: "Nome do bairro.",
                    },
                    number: {
                      type: "string",
                      description: "Número da residência.",
                    },
                    complement: {
                      type: "string",
                      description: "Complemento, bloco, apartamento, etc",
                    },
                    reference: {
                      type: "string",
                      description: "Ponto de referência, locais próximos",
                    },
                    zipCode: { type: "string", description: "CEP" },
                  },
                  // Não colocamos NADA como required aqui para permitir que venha vazio
                },
                // Nome
                fullName: { type: "string" },
                phoneNumber: { type: "string" },
              },
              additionalProperties: false,
            },
          },
          required: ["intent", "entities"],
          additionalProperties: false,
        },
      },
    },
  ];
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "system",
        content: `Você é um extrator de dados de delivery ultra-preciso.
REGRAS DE OURO:
1. Se o usuário disser apenas "entrega" ou "quero que entregue", retorne intent="askDelivery" e entities={ type: "delivery" }.
2. JAMAIS invente nomes de rua como "rua", "bairro" ou números como "123". Se não foi explícito no texto do cliente, o campo não existe.
3. Se não houver dados para um objeto (como address), retorne entities sem a chave address ou address: {}.
${infos.length ? `Contexto atual: ${infos.join("; ")}` : ""}`,
      },
      { role: "user", content: text },
    ],
    tools: deliveryTools,
    toolChoice: "required",
  });

  const toolCall = response.choices?.[0]?.message.toolCalls?.[0];

  if (toolCall) {
    const data = JSON.parse(toolCall.function.arguments as string);
    console.log("Resposta Mistral:", data);
    return data;
  }

  const result = { intent: "unknown" };

  return result as IntentResult;
}

// Exemplo de uso:
/**
 * 
askWorkingHours – horário de funcionamento.  
askRestaurantAddress – onde fica o restaurante.  
askWaitTime – tempo de preparo/espera.  
thank – agradecimentos.  
greeting – saudações. Ex: "oi", "boa noite", "boa".
confirm – cliente faz uma confirmação breve. Ex: "sim", "ok", "exatamente", "ss".  
deny – cliente faz uma negação breve. Ex: "não", "negativo", "nop", "nn".
askMenu – pedir cardápio, promoções ou disponibilidade.  
Ex: "tem pizza?", "manda o menu", "qual a promo?".
continueOrder – cliente quer avançar. Ex: "continuar", "próximo".


 */
// - Se não houver produto explícito: "products": []
// - Nunca inventar produto que o usuário não pediu.
// - "observations" é observações do produto se houver.

// Regras:
// - pediu troco: method="cash"
// - pediu chave: method="pix"
// - 1 método: amount="total"
// - 2 métodos: allow "half"
// Formato de entities:
// {
// payments: [{ method: 'card'|'cash'|'pix'|'rest', amount: 'part'|'half'|'total'|number, changeFor?: number }],
// }

// askPix – pedido da chave pix.
// Ex: Manda a chave, Qual é o pix?, Cadê o qr code, kd o numero do pix
// Formato da resposta: {products?: [{ name: string, quantity: number, observations?: string }]}
