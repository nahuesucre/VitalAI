"use client";
import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { Study, ChatMessage } from "@/types";

export default function ChatPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudy, setSelectedStudy] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Study[]>("/studies/").then((s) => {
      setStudies(s);
      if (s.length > 0) setSelectedStudy(s[0].id);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedStudy || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api<{ response: string }>("/chat/", {
        method: "POST",
        body: JSON.stringify({
          message: input,
          study_id: selectedStudy,
          conversation_history: messages,
        }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al procesar la consulta. Intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Copiloto IA</h2>
            <p className="text-sm text-gray-400">Consultá sobre el protocolo, pacientes y visitas</p>
          </div>
          {studies.length > 0 && (
            <select
              value={selectedStudy}
              onChange={(e) => { setSelectedStudy(e.target.value); setMessages([]); }}
              className="px-3 py-2 border border-sky-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-700"
            >
              {studies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white border border-sky-100 rounded-2xl overflow-y-auto p-6 space-y-4 shadow-sm">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-cyan-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              </div>
              <p className="text-gray-600 font-semibold">Hola, soy el Copiloto de VitalAI.</p>
              <p className="text-gray-400 text-sm mt-1">Puedo ayudarte con consultas sobre el protocolo, ventanas de visita y procedimientos.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["¿Qué ventana de tiempo tengo para esta visita?", "¿Qué procedimientos incluye la Visita 1?", "¿Cuáles son los criterios de inclusión?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 rounded-full text-xs transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-sky-400 to-cyan-500 text-white rounded-br-md shadow-sm"
                  : "bg-sky-50 text-gray-700 rounded-bl-md border border-sky-100"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-sky-50 border border-sky-100 text-sky-400 px-4 py-3 rounded-2xl rounded-bl-md text-sm flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-sky-300 border-t-sky-500 rounded-full animate-spin" />
                Pensando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre el protocolo..."
            className="flex-1 px-4 py-3 bg-white border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent text-gray-800 placeholder-gray-300"
            disabled={loading || !selectedStudy}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !selectedStudy}
            className="px-5 py-3 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Enviar
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
