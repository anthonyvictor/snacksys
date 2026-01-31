import { getGroq } from "@/infra/groq";
import { IChat, IntentResult } from "types";
import { Mistral } from "@mistralai/mistralai";

export async function detectIntentIA2(text: string, chat: IChat) {
  //     model: "llama3-8b-instant",

  const infos: string[] = [];

  if (chat.context) infos.push(`Última intent foi "${chat.context}"`);
  if (chat.menuSent) infos.push(`O cardápio já foi enviado anteriormente`);
  const hasProducts = !!chat.order?.products?.length;

  // ex: Rua Lauro de Freitas, Avenida Aliomar Baleeiro, Ladeira do Jardim Zoológico, Beco do amor (Nunca invente)
  // ex: Ondina, Alto do Coqueirinho, Rio Vermelho, São Cristóvão, Itinga (Nunca invente)
  // ex: Edificio Jandira, Apartamento 202, Bloco B, 1 andar (Nunca invente)
  // ex: Ao lado do bar de Tonho, Em frente ao mercadinho, Em cima da casa de Manoel, Perto da pracinha (Nunca invente)
  // endereço completo bruto, por extenso do jeito que o cliente digitou (é obrigatório)

  const deliveryTools = [
    {
      type: "function" as const,
      function: {
        name: "classify_delivery_intent",
        description:
          "Classifica intenções e extrai entidades para um app de delivery.",
        parameters: {
          type: "object",
          properties: {
            intent: {
              type: "string",
              enum: ["askDelivery", "setPayment", "unknown"],
              description: "A intenção predominante do usuário.",
            },
            entities: {
              type: "object",
              properties: {
                // Entidades para askDelivery
                type: { type: "string", enum: ["delivery", "pickup"] },
                address: {
                  type: "object",
                  properties: {
                    street: { type: "string" },
                    neighborhood: { type: "string" },
                    complement: { type: "string" },
                    number: { type: "string" },
                    reference: { type: "string" },
                    zipCode: { type: "string" },
                  },
                },
                // Entidades para setPayment
                payments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      method: { type: "string", enum: ["card", "cash", "pix"] },
                      amount: { type: "string" }, // 'part'|'half'|'total' ou número
                      changeFor: { type: "number" },
                    },
                  },
                },
              },
            },
          },
          required: ["intent", "entities"],
        },
      },
    },
  ];

  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

  const response = await client.chat.complete({
    model: "mistral-small-latest", // Ou mistral-large-latest para maior precisão
    messages: [
      {
        role: "system",
        content: `Você é uma API de delivery. 
        REGRAS: 
        1. Extraia texto EXATAMENTE como escrito. 
        2. Se não houver entidade, retorne entities: {}.
        ${infos.length ? `3. Contexto serve apenas como pista: ${infos.join("; ")}` : ""}`,
      },
      { role: "user", content: text },
    ],
    tools: deliveryTools,
    toolChoice: "required", // Força o modelo a usar a ferramenta de extração
  });

  const toolCall = response.choices?.[0]?.message.toolCalls?.[0];

  if (toolCall) {
    const data = JSON.parse(toolCall.function.arguments as string);
    console.log("Resposta Mistral:", data);
    return data;
  }

  // Exemplo de uso:

  console.log(prompt, text);
  const result = { intent: "unknown" };

  return result as IntentResult;
}

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
