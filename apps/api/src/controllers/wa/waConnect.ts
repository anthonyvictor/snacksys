// import { logError, resError } from "@/infra/error";
// import { Request, Response } from "express";
// import { WhatsappConnector } from "@/infra/whatsapp";
// import { emit } from "@/infra/socketio";

// export const handler_waConnect = async (req: Request, res: Response) => {
//   try {
//     const result = await waConnect();
//     res.json(result);
//   } catch (error) {
//     logError(error);
//     resError(error, res);
//   }
// };

// let wa: WhatsappConnector | undefined = undefined;

// export const waConnect = async () => {
//   try {
//     wa = new WhatsappConnector({
//       maxRetries: 10,
//       baseBackoffMs: 2000,
//       maxBackoffMs: 30_000,
//       authStorePath: "./wa-session",
//       puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
//       logger: (level, msg, meta) => {
//         // aqui você pode integrar com seu logger (pino/winston)
//         console.log(`[WA ${level}]`, msg, meta ?? "");
//       },
//     });

//     wa.on("qr", (qr: string) => {
//       console.log("Recebi QR, mostre para o usuário:", qr);
//       emit("wa:qr", qr);
//       // você pode gerar um QR code em um endpoint web usando 'qrcode' lib
//     });

//     wa.on("ready", () => {
//       console.log("WhatsApp pronto!");
//     });

//     wa.on("reconnecting", (info) => {
//       console.log("Tentando reconectar:", info);
//     });

//     wa.on("failed", (info) => {
//       console.error("Falhou em reconectar:", info);
//       // aqui você pode notificar admin, reiniciar processo, etc.
//     });

//     wa.on("message", (msg) => {
//       console.log("Mensagem recebida:", msg.body);
//       // trate mensagens recebidas
//     });

//     // Enviar mensagem
//     setTimeout(async () => {
//       try {
//         if (!wa) throw new Error("WhatsApp não inicializado");
//         await wa.sendMessage("5511999999999@c.us", "Olá do bot!");
//       } catch (err) {
//         console.error("Erro ao enviar:", err);
//       }
//     }, 10_000);

//     // Encerrar limpamente ao SIGINT
//     process.on("SIGINT", async () => {
//       console.log("SIGINT recebido — encerrando...");
//       await wa?.shutdown?.();
//       process.exit(0);
//     });
//   } catch (err) {
//     throw err;
//   }
// };

// export { wa };

import { logError, resError } from "@/infra/error";
import { Request, Response } from "express";
import { wa } from "@/infra/whatsapp";

/**
 * 🔑 Endpoint/Função chamada quando o usuário clica em "Conectar WhatsApp" no frontend.
 * Se a sessão não iniciou antes, esta chamada é que faz o 'client.initialize()'
 * e força a geração de um QR code.
 */
export const handler_waConnect = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    logError(error);
    resError(error, res);
  }
};

export const waConnect = async () => {
  if (!wa) {
    // Isso não deve acontecer se 'initWhatsapp' for chamado no startup,
    // mas é um bom guardrail.
    throw new Error("Conector WhatsApp não foi inicializado no startup.");
  }

  // Se a sessão já tentou conectar automaticamente (e falhou/desconectou),
  // o 'wa.start()' vai tentar novamente. Se nunca iniciou (primeiro acesso),
  // ele irá inicializar e gerar o QR.
  if (!wa.status().hasClient) {
    // Se ainda não tem client, inicia. Isso vai gerar o QR.
    wa.start();
    // res.json({
    //   message: "Iniciando conexão... Aguarde QR Code via Socket.io.",
    // });
  } else {
    // Se já está em processo, ou já conectou/desconectou, informa o status atual.
    // res.json({
    //   message: "Conexão já em andamento ou cliente já existe.",
    //   status: wa.status(),
    // });
  }
};
