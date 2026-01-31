// WhatsappConnector.ts
import { EventEmitter } from "events";
import { Client, LocalAuth, Message, MessageTypes } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
/**
 * Options para o conector.
 */
export interface ConnectorOptions {
  restartOnAuthFailure?: boolean; // reintentar quando houver auth_failure
  maxRetries?: number; // número máximo de tentativas de reconexão
  baseBackoffMs?: number; // backoff exponencial base (ms)
  maxBackoffMs?: number; // backoff máximo (ms)
  puppeteerArgs?: string[]; // args para puppeteer (ex: ['--no-sandbox'])
  authStorePath?: string; // pasta do LocalAuth (opcional)
  disableAutoInit?: boolean; // se true, não inicia automaticamente (útil para testes)
  logger?: (
    level: "info" | "warn" | "error" | "debug",
    msg: string,
    meta?: any
  ) => void;
}

/**
 * WhatsappConnector
 * Classe que gerencia a conexão ao whatsapp-web.js com reconexão controlada.
 */
export class WhatsappConnector extends EventEmitter {
  private client?: Client;
  private opts: Required<ConnectorOptions>;
  private retries = 0;
  private isShuttingDown = false;
  private reconnecting = false;

  constructor(options?: ConnectorOptions) {
    super();
    this.opts = {
      restartOnAuthFailure: true,
      maxRetries: 8,
      baseBackoffMs: 2000,
      maxBackoffMs: 60_000,
      puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
      authStorePath: "wa-session",
      disableAutoInit: false,
      logger: (level, msg, meta) => {
        const prefix = `[WhatsappConnector:${level}]`;
        if (meta)
          console[level === "error" ? "error" : "log"](prefix, msg, meta);
        else console[level === "error" ? "error" : "log"](prefix, msg);
      },
      ...options,
    };

    if (!this.opts.disableAutoInit) {
      // Inicia imediatamente (não bloqueante)
      setImmediate(() => this.start());
    }
  }

  private log(
    level: "info" | "warn" | "error" | "debug",
    msg: string,
    meta?: any
  ) {
    try {
      this.opts.logger(level, msg, meta);
    } catch {
      console.log(msg, meta);
    }
  }

  /**
   * Inicializa o client e registra listeners.
   */
  public start() {
    if (this.client) {
      this.log("warn", "start() chamado mas client já existe.");
      return;
    }
    this.log("info", "Inicializando client...");
    this.createClient();
  }

  private createClient() {
    // Configura o client com LocalAuth para persistência (não precisará QR a cada start)
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: "default",
        dataPath: this.opts.authStorePath,
      }),
      puppeteer: { args: this.opts.puppeteerArgs },
      // outras configs podem ser passadas aqui
    });

    this.client = client;

    // Eventos principais
    client.on("qr", (qr: string) => {
      this.retries = 0; // resetar retries ao gerar novo QR (manual login)
      this.log("info", "QR gerado - emitir evento qr");
      this.emit("qr", qr);
    });

    client.on("ready", () => {
      this.log("info", "Cliente pronto (ready).");
      this.retries = 0;
      this.emit("ready");
    });

    client.on("authenticated", (session) => {
      this.log("info", "Autenticado com sucesso.");
      this.emit("authenticated", session);
    });

    client.on("auth_failure", (msg) => {
      this.log("error", "Falha de autenticação: " + msg);
      this.emit("auth_failure", msg);
      if (this.opts.restartOnAuthFailure) {
        // Em auth_failure, vamos tentar reconectar (pode precisar re-scan do QR)
        this.scheduleReconnect("auth_failure");
      }
    });

    client.on("disconnected", (reason) => {
      this.log("warn", `Desconectado: ${reason}`);
      this.emit("disconnected", reason);
      if (!this.isShuttingDown) this.scheduleReconnect("disconnected");
    });

    client.on("message", (message: Message) => {
      // Reemitir mensagem para o app integrar
      this.emit<Message>("message", message);
    });

    client.on("change_state", (state) => {
      this.log("debug", `change_state: ${state}`);
    });

    client.on("streamingStarted", () => this.log("debug", "streamingStarted"));
    client.on("streamingStopped", () => this.log("debug", "streamingStopped"));

    client.on("error", (err) => {
      this.log("error", "Erro no client: " + String(err), err);
      this.emit("error", err);
      // Alguns erros exigem reconexão
      if (!this.isShuttingDown) this.scheduleReconnect("error");
    });

    // Tenta inicializar o client
    try {
      client.initialize().catch((err) => {
        // initialize pode rejeitar
        this.log("error", "Falha ao inicializar client: " + String(err), err);
        this.emit("error", err);
        if (!this.isShuttingDown) this.scheduleReconnect("initialize_failed");
      });
    } catch (err) {
      this.log("error", "Exceção ao chamar initialize(): " + String(err), err);
      this.emit("error", err);
      if (!this.isShuttingDown) this.scheduleReconnect("initialize_exception");
    }
  }

  /**
   * Agendar reconexão com backoff
   */
  private async scheduleReconnect(trigger: string) {
    if (this.reconnecting) {
      this.log(
        "debug",
        "Já em processo de reconexão — ignorando scheduleReconnect."
      );
      return;
    }

    if (this.retries >= this.opts.maxRetries) {
      this.log(
        "error",
        `Ultrapassou maxRetries (${this.opts.maxRetries}). Emitindo 'failed'.`
      );
      this.emit("failed", { reason: trigger, retries: this.retries });
      return;
    }

    this.reconnecting = true;
    this.retries += 1;
    const backoff = Math.min(
      this.opts.baseBackoffMs * Math.pow(2, this.retries - 1),
      this.opts.maxBackoffMs
    );

    this.log(
      "info",
      `Reconectando (tentativa ${this.retries}/${this.opts.maxRetries}) em ${backoff}ms. Trigger: ${trigger}`
    );
    this.emit("reconnecting", {
      attempt: this.retries,
      max: this.opts.maxRetries,
      backoff,
      trigger,
    });

    // desmontar client atual (se existir) antes de tentar novo start
    try {
      if (this.client) {
        try {
          // tenta destruir para liberar recursos
          // @ts-ignore: alguns clients disponibilizam destroy()
          if (typeof (this.client as any).destroy === "function") {
            await (this.client as any).destroy();
            this.log("debug", "Client destroy() chamado com sucesso.");
          } else if (typeof (this.client as any).logout === "function") {
            // não usar logout se queremos reconectar sem perder sessão; mas em auth_failure pode limpar
            this.log(
              "debug",
              "client.logout() disponível mas será evitado para preservar sessão."
            );
          }
        } catch (err) {
          this.log(
            "warn",
            "Erro ao destruir client antes de reconectar: " + String(err),
            err
          );
        } finally {
          // limpar referência
          this.client = undefined;
        }
      }
    } catch (err) {
      this.log("warn", "Erro na limpeza do client: " + String(err), err);
    }

    // aguarda o backoff (não bloquear o event loop)
    await new Promise((res) => setTimeout(res, backoff));

    if (this.isShuttingDown) {
      this.log(
        "info",
        "Shutdown detectado durante reconnect wait — abortando reconexão."
      );
      this.reconnecting = false;
      return;
    }

    // tentar criar um novo client
    this.reconnecting = false;
    this.createClient();
  }

  /**
   * Envia mensagem com verificação se client está pronto.
   */
  public async sendMessage(to: string, content: string) {
    // check status - o whatsapp-web.js não expõe um 'isReady' público reliably,
    // mas podemos confiar que o evento 'ready' resetou retries e que client existe.
    try {
      if (!this.client)
        return console.error("[🟢 WhatsApp 📵 ] Client não inicializado.");
      return await this.client.sendMessage(to, content);
    } catch (err) {
      this.log(
        "error",
        `Falha ao enviar mensagem para ${to}: ${String(err)}`,
        err
      );
      throw err;
    }
  }

  /**
   * Método para encerrar o connector limpamente.
   */
  public async shutdown() {
    this.log("info", "Shutdown iniciado...");
    this.isShuttingDown = true;
    // impedir novas reconexões
    try {
      if (this.client) {
        // tentar destruir (libera puppeteer)
        // @ts-ignore
        if (typeof (this.client as any).destroy === "function") {
          await (this.client as any).destroy();
          this.log("info", "Client destroyed com sucesso.");
        } else if (typeof (this.client as any).logout === "function") {
          await (this.client as any).logout();
          this.log("info", "Client logged out.");
        }
        this.client = undefined;
      }
    } catch (err) {
      this.log("error", "Erro ao encerrar client: " + String(err), err);
    }
    this.emit("shutdown");
  }

  /**
   * Fornece o estado interno (útil para health checks).
   */
  public status() {
    return {
      hasClient: !!this.client,
      retries: this.retries,
      isShuttingDown: this.isShuttingDown,
      reconnecting: this.reconnecting,
    };
  }
}

// Variável global para a instância do conector
let wa: WhatsappConnector | undefined = undefined;

/**
 * 🛠️ Inicializa o conector do WhatsApp com as configurações.
 * Se houver sessão anterior (LocalAuth), o conector tentará reconectar.
 * Se NÃO houver, ele permanecerá inativo, aguardando 'waConnectUserAction()'.
 * Chamada no startup do servidor.
 */
export const initWhatsapp = async () => {
  // Configurações do conector
  const connectorOptions = {
    maxRetries: 10,
    baseBackoffMs: 2000,
    maxBackoffMs: 30_000,
    authStorePath: "./wa-session",
    puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
    // Opcional, mas crucial: desabilita a inicialização automática
    disableAutoInit: true,
    logger: (level: string, msg: string, meta?: any) => {
      console.log(`[WA ${level}]`, msg, meta ?? "");
    },
  };

  try {
    // 1. Cria a instância
    wa = new WhatsappConnector(connectorOptions);

    // 2. Registra Listeners (Eventos que são comuns para reconexão/novo QR)
    wa.on("qr", (qr: string) => {
      console.log("Recebi QR, mostre para o usuário:", qr);
      // Emitir para o frontend via Socket.io para que o usuário escaneie
      qrcode.generate(qr, { small: true });
      emit("wa:qr", qr);
    });

    wa.on("ready", () => {
      console.log("📲 WhatsApp pronto!");
      emit("wa:ready"); // Notificar frontend
    });

    wa.on("reconnecting", (info) => {
      console.log("Tentando reconectar:", info);
      emit("wa:reconnecting", info);
    });

    wa.on("failed", (info) => {
      console.error("📵 Falhou em reconectar/conectar whatsapp:", info);
      emit("wa:failed", info); // Notificar frontend sobre falha terminal
    });

    wa.on("disconnected", (reason) => {
      console.log("📵 Whatsapp desconectado:", reason);
      emit("wa:disconnected", reason);
    });

    wa.on("message", async (msg: Message) => {
      const clientChat = await msg.getChat();
      const contact = await clientChat.getContact();
      const contactImage = await contact?.getProfilePicUrl();

      if (clientChat.id.server !== "c.us" || msg.from === msg.to) return;

      if (
        [MessageTypes.AUDIO, MessageTypes.VOICE].some((x) => msg.type === x)
      ) {
        await sleep(1000);
        msg.reply("Por gentileza digite, não consigo ouvir áudios.");
      } else if (
        [MessageTypes.IMAGE, MessageTypes.VIDEO, MessageTypes.DOCUMENT].some(
          (x) => msg.type === x
        )
      ) {
      } else if (msg.type == MessageTypes.LOCATION) {
        console.log("LOCALIZAÇÃO RECEBIDA", msg.location);
      } else if (msg.type !== MessageTypes.TEXT) {
        // await sleep(1000);
        // msg.reply('Oops, não consigo entender esse tipo de mensagem, por gentileza envie texto.')
      } else {
        receivedMessage({
          from: msg.from,
          title: contact.name || contact.pushname || msg.from,
          body: msg.body,
          platform: "whatsapp",
        });
      }
    });

    // 3. Verifica se existe sessão e tenta iniciar a reconexão
    const hasSession = await checkSessionExists(connectorOptions.authStorePath);

    if (hasSession) {
      console.log("Sessão WA encontrada. Tentando reconexão automática...");
      // Chama start, que tentará reconectar com base na sessão salva
      wa.start();
    } else {
      console.log(
        "Nenhuma sessão WA encontrada. Aguardando comando do usuário para iniciar (gerar QR)."
      );
      // O conector está criado, mas o 'client.initialize()' só será chamado
      // no endpoint de conexão.
    }

    // Opcional: Hook de shutdown limpo
    process.on("SIGINT", async () => {
      console.log("SIGINT recebido — encerrando...");
      await wa?.shutdown?.();
      process.exit(0);
    });

    // // Exemplo de envio após 10s (apenas para teste)
    // setTimeout(async () => {
    //   try {
    //     if (!wa) throw new Error("WhatsApp não inicializado");
    //     await wa.sendMessage("5511999999999@c.us", "Olá do bot!");
    //   } catch (err) {
    //     console.error("Erro ao enviar no timeout:", err);
    //   }
    // }, 10_000);
  } catch (error) {
    // Erros na inicialização global
    logError(error);
    console.error("Erro fatal na inicialização do WhatsappConnector:", error);
  }
};

/**
 * Função utilitária para verificar se a pasta de sessão existe.
 * @param path O caminho para o authStorePath.
 * @returns true se a sessão existe, false caso contrário.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { emit } from "./socketio";
import { logError } from "./error";
import { receivedMessage } from "@/controllers/msg/receivedMessage";
import { sleep } from "@/services/misc";

const checkSessionExists = async (sessionPath: string): Promise<boolean> => {
  // O LocalAuth do whatsapp-web.js salva em <dataPath>/<clientId>/
  // O nome 'default' é usado no seu 'WhatsappConnector.ts'
  const fullPath = path.join(sessionPath, "default");

  try {
    await fs.access(fullPath);
    // Verifica se é um diretório (confiável para o LocalAuth)
    const stats = await fs.stat(fullPath);
    return stats.isDirectory();
  } catch (err) {
    // Se o caminho não existe, `fs.access` ou `fs.stat` lança erro
    return false;
  }
};

export { wa };
