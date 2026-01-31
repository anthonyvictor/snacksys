import { getGroq } from "@/infra/groq";
import { InformReceivingMethodEntity } from "types";

export async function extractAddressIA(text: string) {
  // ex: Rua Lauro de Freitas, Avenida Aliomar Baleeiro, Ladeira do Jardim Zoológico, Beco do amor (Nunca invente)
  // ex: Ondina, Alto do Coqueirinho, Rio Vermelho, São Cristóvão, Itinga (Nunca invente)
  // ex: Edificio Jandira, Apartamento 202, Bloco B, 1 andar (Nunca invente)
  // ex: Ao lado do bar de Tonho, Em frente ao mercadinho, Em cima da casa de Manoel, Perto da pracinha (Nunca invente)
  // endereço completo bruto, por extenso do jeito que o cliente digitou (é obrigatório)

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

  const result = await getGroq(prompt, text);

  return result as InformReceivingMethodEntity;
}
