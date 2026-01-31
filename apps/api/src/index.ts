import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import router from "./routes";
import { initSocket } from "@/infra/socketio";
import { initWhatsapp } from "@/infra/whatsapp";
import { createIndex } from "./infra/db";
import { ChatModel } from "types";
// import { initCloudinary } from './services/cloudinary'

const app = express();

async function startServer() {
  await mongoose.connect(process.env.MONGODB_DATABASE_URL!);
  await createIndex();
  await ChatModel.updateMany({}, { $set: { isReplying: false } });
  console.info("[⚪ MongoDB 🍃 ] Conectado com sucesso");

  app.use(express.json());
  app.use(cors());
  app.use(router);
  const httpServer = http.createServer(app);
  await initSocket(httpServer);
  console.info("[⚫ Socket.io ⚡] Servidor iniciado!");

  // 1️⃣ Inicia WhatsApp (e reconecta clientes)
  console.info("[🟢 WhatsApp 📲 ] Inicializando sessões...");
  await initWhatsapp();

  // // 1️⃣ Inicia Cloudinary
  // console.info('[🔵 Cloudinary 🌧️ ] Inicializando cloudinary...')
  // await initCloudinary()

  // // 2️⃣ Só depois, inicia o agendador
  // console.info('[🟠 Scheduler ⌛] Iniciando monitoramento de posts agendados...')
  // startPostScheduler()

  // 3️⃣ Inicia o servidor HTTP e Socket.IO
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () =>
    console.info(`[🟡 Servidor 🏠 ] Rodando na porta ${PORT}`)
  );
}

startServer().catch((err) => {
  console.error("Erro ao iniciar o servidor:", err);
  process.exit(1);
});
