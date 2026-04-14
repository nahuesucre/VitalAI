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
          <h2 className="text-xl font-bold text-gray-900">Estudios</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Nuevo estudio
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Crear nuevo estudio</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del estudio</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: RELIEHF"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
                    <input
                      value={form.sponsor}
                      onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                    <select
                      value={form.phase}
                      onChange={(e) => setForm({ ...form, phase: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="I">Fase I</option>
                      <option value="II">Fase II</option>
                      <option value="III">Fase III</option>
                      <option value="IV">Fase IV</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {creating ? "Creando..." : "Crear estudio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {studies.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-sm">No hay estudios. Creá uno para empezar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studies.map((study) => (
              <div
                key={study.id}
                onClick={() => router.push(`/studies/${study.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{study.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Estudio fase {study.phase} — {study.study_type} · Patrocinador: {study.sponsor}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  study.status === "active"
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
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
