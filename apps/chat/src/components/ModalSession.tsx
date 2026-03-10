import { useUserSession } from "@/hooks/session";
import React, { useState } from "react";

export default function ModalSession() {
  const { saveSession, showModal, userData } = useUserSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="mb-2 text-xl font-bold text-gray-800">
          Seja bem-vindo!
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Por favor, identifique-se para continuar o atendimento.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && phone.trim()) {
              saveSession(name, phone);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefone (WhatsApp)
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="71999999999"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Iniciar Chat
          </button>
        </form>
      </div>
    </div>
  );
}
