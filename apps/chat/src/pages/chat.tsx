import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { LucideProps, Send, Trash, UserX } from "lucide-react"; // Ícone de envio (necessita 'lucide-react')
import { IChat, ReceivedMessageDTO, IMessage } from "types";
import { io } from "socket.io-client";
import { v4 } from "uuid";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const Chat = () => {
  const [remetente, setRemetente] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [chat, setChat] = useState<IChat>();
  const [mensagens, setMensagens] = useState<
    { direcao: "entrada" | "saida"; body: string; id: string; date: Date }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSenderInput, setShowSenderInput] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chat, mensagens]);

  useEffect(() => {
    const local = localStorage.getItem("remetente");

    setRemetente(local ?? "");
    if (!local) setShowSenderInput(true);
  }, []);

  useEffect(() => {
    console.log("executou useeffect");
    const socket = io(process.env.NEXT_PUBLIC_API_URL);
    socket.on("connect", () => {
      console.info("conectado ao servidor socket.io");
    });

    socket.on("msg:sent", async (body: string) => {
      console.log("chegou", body);
      setMensagens((prevChat) => [
        ...prevChat,
        {
          direcao: "entrada",
          body,
          id: v4(),
          date: new Date(),
        },
      ]);
    });

    (document.querySelector("#message") as HTMLInputElement)?.focus();
  }, []); //eslint-disable-line

  const handleSend = async (txt?: string) => {
    const msg = txt || inputText;
    const messageToSend = msg.trim();
    if (!messageToSend) return;

    setIsLoading(true);

    setMensagens((prevChat) => [
      ...prevChat,
      {
        direcao: "saida",
        body: msg,
        id: v4(),
        date: new Date(),
      },
    ]);

    setInputText("");

    try {
      const payload: ReceivedMessageDTO = {
        body: msg,
        from: {
          id: remetente,
          phoneNumber: remetente,
          publicName: "Novo cliente",
        },
        platform: "whatsapp",
      };

      await api.post("/msg", payload);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const Bt = ({
    title,
    Icone,
    onClick = () => {},
  }: {
    title: string;
    Icone: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
    onClick?: () => void | Promise<void>;
  }) => (
    <button
      title={title}
      className="rounded-md bg-slate-900 p-2"
      onClick={() => onClick()}
    >
      {<Icone />}
    </button>
  );

  const Spin = () => (
    <div className="size-5 animate-spin rounded-full border-2 border-white/70" />
  );

  const parseWhatsAppFormat = (input: string) => {
    const urlRegex =
      /((https?:\/\/|www\.)[^\s<>{}[\]|\\^`"']+[^\s<>{}[\]|\\^`"'.!,?;])/gi;

    return input
      .replace(/~~\*\*|__/g, "")
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // *negrito*
      .replace(/_(.*?)_/g, "<em>$1</em>") // _itálico_
      .replace(/~(.*?)~/g, "<del>$1</del>") // ~tachado~
      .replace(/`(.*?)`/g, "<code>$1</code>") // `monoespaçado`
      .replace(/\n/g, "<br>") // quebra de linha
      .replace(urlRegex, (url) => {
        const href = url.startsWith("http") ? url : `https://${url}`;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
  };

  const deleteChat = async (focusInput = true) => {
    await api.delete("/chat", {
      params: {
        de: [remetente],
      },
    });

    setMensagens([]);

    if (focusInput)
      (document.querySelector("#message") as HTMLInputElement)?.focus();
  };

  const deleteCustomer = async () => {
    await deleteChat(false);
    setRemetente("");
    localStorage.setItem("remetente", "");
    setShowSenderInput(true);
    (document.querySelector("#remetente") as HTMLInputElement)?.focus();
  };
  return (
    <div className="h-full bg-slate-900">
      <main className="flex h-svh w-full justify-center bg-slate-800">
        <div className="flex flex-col bg-slate-950 p-2 gap-2 text-white">
          <Bt Icone={Trash} title="Deletar chat" onClick={deleteChat} />
          <Bt Icone={UserX} title="Apagar cliente" onClick={deleteCustomer} />
        </div>
        <div className="flex size-full flex-col bg-zinc-900 p-2 lg:max-w-xl">
          <ul className="no-scroll flex w-full flex-1 flex-col gap-2 overflow-y-auto">
            {mensagens.map((msg) => {
              const parsedText = msg.body ? parseWhatsAppFormat(msg.body) : "";

              return parsedText?.trim?.() ? (
                <li
                  key={v4()}
                  className={`max-w-[70%] whitespace-pre-line bg-slate-300 p-4 ${
                    msg.direcao === "entrada"
                      ? "self-start rounded-r-lg rounded-tl-lg"
                      : "self-end rounded-l-lg rounded-tr-lg"
                  }`}
                >
                  <main
                    dangerouslySetInnerHTML={{
                      __html: parsedText,
                    }}
                  />
                  <footer className="text-xs mt-3 opacity-50 select-none">
                    {msg.date.toLocaleString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </footer>
                </li>
              ) : (
                <></>
              );
            })}
            <div ref={chatEndRef} />
          </ul>

          <ul className="no-scroll flex w-full p-2 overflow-x-auto gap-2">
            {[
              { lbl: "Olá", txt: "Olá" },
              { lbl: "Cardápio", txt: "Manda o cardápio" },
              { lbl: "2Pastéis", txt: "Vou querer 2 pastéis de carne" },
              { lbl: "Entrega", txt: "Vai ser pra entrega" },
            ].map((x) => (
              <li
                className="bg-slate-300 rounded-xl px-2 py-1 cursor-pointer hover:bg-slate-50"
                key={x.lbl}
                onClick={() => {
                  handleSend(x.txt);
                }}
              >
                {x.lbl}
              </li>
            ))}
          </ul>
          <footer className="flex flex-col gap-4 p-2">
            {showSenderInput && (
              <div className="flex gap-2">
                <input
                  id="remetente"
                  autoFocus={true}
                  tabIndex={0}
                  value={remetente}
                  onChange={(e) => setRemetente(e.target.value)}
                  placeholder="Seu telefone... (+55 71 98888-8888)"
                  className="rounded-md p-2 flex-1"
                />

                <button
                  className="bg-blue-400 h-full rounded-md p-2"
                  onClick={() => {
                    localStorage.setItem("remetente", remetente);
                    setShowSenderInput(false);
                    (
                      document.querySelector("#message") as HTMLInputElement
                    )?.focus();
                  }}
                >
                  Salvar
                </button>
              </div>
            )}
            <div
              className={`flex gap-2 ${
                !remetente || showSenderInput
                  ? "pointer-events-none opacity-20"
                  : ""
              }`}
            >
              <input
                id="message"
                className="flex-1 rounded-md p-2"
                autoFocus={true}
                tabIndex={!remetente || showSenderInput ? -1 : 0}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mensagem..."
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
              />
              <button
                className="rounded-md bg-green-500 p-4 px-8"
                onClick={() => handleSend()}
                tabIndex={!remetente || showSenderInput ? -1 : 1}
              >
                {/* {isLoading ? <Spin /> : <Send className="size-5" />} */}
                <Send className="size-5" />
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Chat;
