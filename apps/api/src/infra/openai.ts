import OpenAI from "openai";

export const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embed(text: string) {
  const res = await openAIClient.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export const getGPT = async (
  systemPrompt: string,
  userPrompt: string,
  key: 1 | 2 | 3 = 1
) => {
  const response = await openAIClient.responses.create({
    model: "gpt-5.2",
    input: "Write a short bedtime story about a unicorn.",
  });
};

// askPix
//    - Quando o usuário pede a chave PIX
//    Ex:
//    "Manda a chave", "Qual é o pix de vocês?"
