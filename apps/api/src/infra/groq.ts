// import { extractJson, sanitizeJson } from "@/services/text/json";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const groq2 = new Groq({ apiKey: process.env.GROQ_API_KEY2 });
const groq3 = new Groq({ apiKey: process.env.GROQ_API_KEY3 });

export const getGroq = async (
  systemPrompt: string,
  userPrompt: string,
  key: 1 | 2 | 3 = 1
) => {
  const result = await (key === 1
    ? groq
    : key === 2
    ? groq2
    : groq3
  ).chat.completions.create({
    response_format: { type: "json_object" },
    model: "llama-3.1-8b-instant",
    // model: "qwen-2.5-7b-instruct",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  console.log("PROMPT GROQ", userPrompt);

  const content = result.choices[0].message.content || "";
  console.log("content", content);

  // tenta extrair só o JSON
  const match = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Resposta da IA não contém JSON válido");
  }

  const dataJson = JSON.parse(match[0]);

  // const dataStr = result.choices[0].message.content || "{}";
  // const dataJson = JSON.parse(dataStr);

  //   const strToParse = sanitizeJson(dataStr || "{}");
  //   const objToParse = extractJson(strToParse) ?? "{}";
  //   const dataJson = JSON.parse(objToParse);

  console.log("RESPOSTA GROQ:", JSON.stringify(dataJson));

  return dataJson;
};

// askPix
//    - Quando o usuário pede a chave PIX
//    Ex:
//    "Manda a chave", "Qual é o pix de vocês?"
