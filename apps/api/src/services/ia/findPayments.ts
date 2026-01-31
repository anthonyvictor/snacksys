import { getGroq } from "@/infra/groq";
import { IOrder } from "types";
import { getTotal } from "../order/total";

export async function findPaymentsIA(order: IOrder, msg: string) {
  const { deliveryFee, productsPrice, total } = getTotal(order);
  const valuesJsonString = JSON.stringify(
    { deliveryFee, productsPrice, total },
    null,
    2
  );

  // 2. Template do Prompt (adaptado do modelo anterior)
  const prompt = `Você é uma API que extrai formas de pagamento a partir da mensagem do usuário.

Você receberá um JSON com os valores do pedido neste formato:

{
  "deliveryFee": number,
  "productsPrice": number,
  "total": number
}

Sua tarefa:
Analisar a mensagem e identificar como o usuário deseja pagar.

Você DEVE retornar obrigatoriamente os pagamentos no seguinte formato JSON válido:

{
  payments: [
    { 
      amount: number, 
      method: "pix" | "cash" | "card", 
      changeFor?: number 
    }
  ]
}

Regras obrigatórias:
- Nunca adicione textos fora do JSON.
- Nunca explique nada, apenas retorne o JSON.
- Nunca use strings para valores numéricos.
- Nunca invente valores, se baseie EXCLUSIVAMENTE na mensagem do usuário e nos valores fornecidos pelo sistema como dados.

Lógica de interpretação:
- Se o usuário informar apenas um método, o amount deve ser igual a "total".
- Se o usuário disser algo como "metade em X e metade em Y", divida o total igualmente.
- Se o usuário disser algo como "a entrega em X e o resto em Y":
  - X recebe o valor de "deliveryFee"
  - Y recebe o valor de "productsPrice"
- Se o usuário disser algo como "vou dar 20 em X e o resto em Y":
  - X recebe 20
  - Y recebe "total - 20"
- Se o usuário mencionar valores específicos em dinheiro, pix ou cartão, use esses valores.

Detecção de métodos:
- "pix" → pix
- "dinheiro", "espécie" → cash
- "cartão", "crédito", "débito" → card

Regra de TROCO (obrigatória):
- Se o método for "cash" e o usuário mencionar frases como:
  - "troco para X"
  - "leva troco de X"
  - "preciso de troco para X"
  então:
  - inclua a propriedade "changeFor"
  - o valor de "changeFor" deve ser o valor informado pelo usuário
  - se o método não for "cash", "changeFor" = null 
  - se "changeFor" existir (somente em pagamentos "cash"), deve obrigatoriamente ser maior ou igual ao "amount"

Se o usuário não indicar nenhuma forma de pagamento claramente, retorne: []

Importante:
Retorne APENAS o JSON no formato especificado. Nada além disso.

Dados: ${valuesJsonString}
`;

  console.log(prompt, valuesJsonString);

  const result = await getGroq(prompt.trim(), msg, 3);

  return (
    Array.isArray(result)
      ? result
      : result?.method
      ? [result]
      : Array.isArray(result?.payments)
      ? result.payments
      : []
  ) as any[];
}
