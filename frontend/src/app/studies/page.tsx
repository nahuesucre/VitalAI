"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { Study } from "@/types";

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", sponsor: "", phase: "III", study_type: "interventional_drug", description: "" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api<Study[]>("/studies/").then(setStudies).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const study = await api<Study>("/studies/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      router.push(`/studies/${study.id}`);
    } catch {
      alert("Error al crear estudio");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Estudios</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            + Nuevo estudio
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-sky-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Crear nuevo estudio</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Nombre del estudio</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: RELIEHF"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Sponsor</label>
                    <input
                      value={form.sponsor}
                      onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Fase</label>
                    <select
                      value={form.phase}
                      onChange={(e) => setForm({ ...form, phase: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                    >
                      <option value="I">Fase I</option>
                      <option value="II">Fase II</option>
                      <option value="III">Fase III</option>
                      <option value="IV">Fase IV</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    {creating ? "Creando..." : "Crear estudio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {studies.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <p className="text-gray-400 text-sm">No hay estudios. Creá uno para empezar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studies.map((study) => (
              <div
                key={study.id}
                onClick={() => router.push(`/studies/${study.id}`)}
                className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-sky-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-100 to-cyan-200 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">{study.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Estudio fase {study.phase} — {study.study_type} · Patrocinador: {study.sponsor}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  study.status === "active"
                    ? "bg-sky-50 text-sky-600 border-sky-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                  {study.status === "active" ? "Activo — Reclutando" : study.status === "draft" ? "Borrador" : study.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
