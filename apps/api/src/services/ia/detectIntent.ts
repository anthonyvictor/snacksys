import { getGroq } from "@/infra/groq";
import { IChat, IntentResult } from "types";

export async function detectIntentIA(text: string, chat: IChat) {
  //     model: "llama3-8b-instant",

  const infos = [];

  if (chat.context) infos.push(`Última intent foi "${chat.context}"`);
  if (chat.menuSent) infos.push(`O cardápio já foi enviado anteriormente`);
  const hasProducts = !!chat.order?.products?.length;

  // ex: Rua Lauro de Freitas, Avenida Aliomar Baleeiro, Ladeira do Jardim Zoológico, Beco do amor (Nunca invente)
  // ex: Ondina, Alto do Coqueirinho, Rio Vermelho, São Cristóvão, Itinga (Nunca invente)
  // ex: Edificio Jandira, Apartamento 202, Bloco B, 1 andar (Nunca invente)
  // ex: Ao lado do bar de Tonho, Em frente ao mercadinho, Em cima da casa de Manoel, Perto da pracinha (Nunca invente)
  // endereço completo bruto, por extenso do jeito que o cliente digitou (é obrigatório)

  const prompt = `
Você é uma API que classifica intents e extrai entidades para um app de delivery.

REGRAS GERAIS (curtas e absolutas):
- Responda apenas JSON puro e válido.
- Não invente JAMAIS intents ou entidades
- Extraia texto EXATAMENTE como o cliente escreveu.
- Escolha apenas a intent predominante.
- Entidades SEMPRE dentro de "entities".
- Se não houver entidade relevante, entities: {}.
- O contexto serve apenas como pista para a intent, mas nunca para determinar a intent.

INTENTS E REGRAS:

askDelivery – dúvidas ou informações SOBRE ENTREGA ou RETIRADA.
Ex: Entregam na rua...?, Quanto é a entrega aqui?, vou buscar, é aq no..., é pra entregar no beco..., avenida..., Tá quanto a taxa no...?
Endereço implica delivery
Extraia partes do endereço somente se explícito, EXATAMENTE como o cliente digitou (nunca altere uma letra sequer).
Formato da resposta: {
  intent: "askDelivery",
  entities: {
    type: "delivery" | "pickup",
    address?: {
      street?: string (rua, avenida, ladeira, beco, travessa)
      neighborhood?: string (bairro ou comunidade)
      complement?: string (nome do edificio, condominio, bloco etc)
      number?: string 
      reference?: string (ponto de referência)
      zipCode?: string (CEP)
    }
  }
}
    
setPayment – informações sobre pagamento.
Ex: vou dar na mão, pix, vai ser pix, pagar no cartão, Débito, Em espécie, Metade dinheiro, metade crédito, Troco pra 50, 10 na mão e o resto no pix, aceita pix?, aceita voucher, posso passar no alimentação
Formato da resposta: {
  intent: "setPayment",
  entities: {
    payments: [{ method: 'card'|'cash'|'pix', amount: 'part'|'half'|'total'|number, changeFor?: number }],
  }
}

unknown – sem correspondência.

Contexto: ${infos.join("; ")}

FORMATO FINAL OBRIGATÓRIO:
{
  "intent": "nome_da_intent",
  "entities": { ... }
}

  `;
  const prompt2 = `Você é uma API que classifica intents e extrai entidades para um app de delivery.

REGRAS:
- Responda APENAS com JSON válido (parseável).
- Nunca invente intents ou entidades.
- Não valide nada, apenas extraia texto cru.
- Se houver múltiplos assuntos, escolha a intent predominante.
- Nunca reutilize exemplos como conteúdo real.


INTENTS:

greeting – saudações.

addProducts – adicionar produtos ao pedido.
Ex: Vou querer uma pizza grande, 2 pastéis de frango, manda uma pepsi pfv, Quero um produto
Regras:
- Cada produto deve ter sua quantidade
- Se a mensagem do usuário não contiver nomes concretos de produtos, retorne products = [].
- cada produto deve ser uma string simples, ex: "1 pastel de carne", "2 Coxinha de frango", "1 pepsi"
Formato de entities: {
    products: string[]
}

askMenu – cliente solicita cardápio, pergunta se tem determinados produtos ou promoções.
Ex: Mande o menu, Me envia as opções, Quanto tá a pizza?, Tá tendo promoção?, Tem baurú?, Tá saindo pizza?, Tá rolando coxinha?, Qual a promo de hj?

${
  !!chat.order?.products?.length
    ? `
informReceivingMethod – usuário informa se o pedido será para retirada ou entrega.
Regras:
- Endereço implica delivery
- Extraia partes do endereço (considerar bairros de Salvador/BA)
- Method é obrigatório
Ex: vou buscar, moro descendo o bar da bel, É aqui na rua 13, Próximo ao restaurante, Rua Oswaldo Cruz, 245 Rio Vermelho
Formato de entities: {
    method: "pickup" | "delivery", 
    address?: {
        street, number, complement, neighborhood, reference, fullAddress
    }
}

addPayments – o usuário informa a forma de pagamento do pedido.
Ex: vou dar na mão, pix, vai ser pix, pagar no cartão, Débito, Em espécie, Metade dinheiro, metade crédito, Troco pra 50, 10 na mão e o resto no pix
`
    : ""
}

continueOrder - quando o usuário deseja avançar à próxima etapa do pedido
Ex: continuar, próximo, avançar

confirm – quando o usuário confirma de forma breve, com sim/ok.
- não serve para declarações sobre pagamento, produtos ou endereço.
Ex: sim, positivo, ss, claro, ok, beleza.

cancel – quando o usuário nega de forma breve, com não/negativo.
Ex: não, nn, negativo, nop.

askWorkingHours – perguntas sobre horário de funcionamento.
Ex: funciona até q horas?, amanhã vai abrir?, que horas começa a funcionar?

askRestaurantAddress – endereço do restaurante.
Ex: onde vcs ficam?, qual o endereço de vocês?, manda a localização

askDelivery – dúvidas SOBRE ENTREGA.
Ex: Entregam na rua da fonte?, Quanto é a entrega aqui?, Tá quanto a taxa no Beça?

Formato da resposta: {address: {
  street, number, complement, neighborhood, reference, fullAddress
}}

askWaitTime – tempo/fila/espera.
Ex: Tem quantas na frente?, Qual o tempo estimado?, Demora muito?, Que horas sai?

thank – agradecimentos.
Ex: obrigado, valeu, obg, agradeço, fico agradecido

unknown – quando não se encaixar em nenhuma outra intent.

${
  infos.filter((x) => !!x)
    ? `Algumas informações para usar como pista apenas. Nunca force interpretação:
${infos.join("\n")}
`
    : ""
}
FORMATO DE RESPOSTA OBRIGATÓRIO:

{
  intent: "nome",
  entities?: { ... }
}

SEMPRE COLOQUE AS ENTIDADES DENTRO DE "entities", e nunca soltas dentro da raiz do JSON
`;

  console.log(prompt, text);
  const result = await getGroq(prompt, text);

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
