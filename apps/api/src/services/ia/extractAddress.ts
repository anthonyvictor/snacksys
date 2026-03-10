import { getGroq } from "@/infra/groq";
import { AskDeliveryEntity } from "types";
import { Mistral } from "@mistralai/mistralai";

export async function extractAddressIA(text: string) {
  // ex: Rua Lauro de Freitas, Avenida Aliomar Baleeiro, Ladeira do Jardim Zoológico, Beco do amor (Nunca invente)
  // ex: Ondina, Alto do Coqueirinho, Rio Vermelho, São Cristóvão, Itinga (Nunca invente)
  // ex: Edificio Jandira, Apartamento 202, Bloco B, 1 andar (Nunca invente)
  // ex: Ao lado do bar de Tonho, Em frente ao mercadinho, Em cima da casa de Manoel, Perto da pracinha (Nunca invente)
  // endereço completo bruto, por extenso do jeito que o cliente digitou (é obrigatório)

  if (text.split(" ").length < 3)
    return {
      type: "delivery",
    };

  console.log("VAI EXTRAIR NO MISTRAL =>>>>>", text);

  const deliveryTools = [
    {
      type: "function" as const,
      function: {
        name: "classify_delivery",
        description:
          "extrai endereço apenas se o usuário fornecer informações de localização.",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "object",
              description:
                "Só incluir se o usuário mencionar dados reais de endereço.",
              properties: {
                street: {
                  type: "string",
                  description: "Nome da rua.",
                },
                number: {
                  type: "string",
                  description: "Número da residência.",
                },
                neighborhood: {
                  type: "string",
                  description: "Nome do bairro.",
                },
                complement: {
                  type: "string",
                  description: "Complemento, apartamento, bloco, etc.",
                },
                reference: {
                  type: "string",
                  description: "Ponto de referência próximo.",
                },
                zipCode: {
                  type: "string",
                  description: "CEP mencionado.",
                },
              },
              additionalProperties: false,
            },
          },
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
1. JAMAIS invente nomes de ruas bairros, etc. Se não foi explícito no texto do cliente, o campo não existe.
2. Se não houver dados de endereço, retorne o objeto sem a chave address.
3. TODOS os valores extraídos devem ser COPIADOS literalmente do texto do usuário.
4. NÃO resuma, NÃO normalize e NÃO reescreva entidades.
5. Se houver ponto de referência, o campo "reference" deve conter o trecho completo exatamente como aparece no texto.
Exemplos:
"perto do armarinho" → reference="perto do armarinho"
"ao lado da igreja" → reference="ao lado da igreja"
"NUNCA reduza para apenas o nome do local."`,
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
    return { ...(data ?? {}), type: "delivery" };
  }

  return {} as AskDeliveryEntity;

  const prompt = `
Você é uma API que extrai entidades para um app de delivery.

Formato da resposta: {
  type: "delivery" (entrega) | "pickup" (retirada),
  address?: {
    street?: string (rua, avenida, ladeira, beco, travessa)
    neighborhood?: string (bairro ou comunidade)
    complement?: string (nome do edificio, condominio, bloco etc)
    number?: string 
    reference?: string (ponto de referência)
    zipCode?: string (CEP)
    }
    }
    
    REGRAS GERAIS (curtas e absolutas):
    - Responda apenas JSON puro e válido.
    - Se for fornecido um endereço, type = "delivery"
    - Extraia partes do endereço SOMENTE se explícito, EXATAMENTE como o cliente digitou. NUNCA INVENTE OU ALTERE.

`;

  console.log("vai pelo Groq");

  const result = await getGroq(prompt, text);

  return result as AskDeliveryEntity;
}
