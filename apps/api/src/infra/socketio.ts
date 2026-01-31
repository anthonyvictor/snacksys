import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "*", // ajuste conforme sua origem
      // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE '],
    },
  });

  io.on("connection", (socket) => {
    console.log("Usuário conectado:", socket.id);
  });

  return io;
}

export function emit(ev: string, data?: any) {
  try {
    io.emit(ev, data);

    console.log(`Evento "${ev}" emitido!`);
  } catch (erro) {
    console.error(`Erro ao emitir evento "${ev}":`, erro);
  }
}
