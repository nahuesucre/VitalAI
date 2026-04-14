"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import type { Study, Alert } from "@/types";

export default function DashboardPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const router = useRouter();

  useEffect(() => {
    api<Study[]>("/studies/").then(setStudies).catch(() => {});
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Dashboard del Coordinador</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Hoy: {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pacientes en Screening</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              <p className="text-xs text-gray-400 mt-1">Creá un estudio para empezar</p>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visitas Activas Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              <p className="text-xs text-gray-400 mt-1">Sin visitas programadas</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alertas Críticas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              <p className="text-xs text-gray-400 mt-1">Sin alertas pendientes</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Studies / Main area */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Estudios</h3>
                <button
                  onClick={() => router.push("/studies")}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Ver todos
                </button>
              </div>
              {studies.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">No hay estudios creados aún</p>
                  <button
                    onClick={() => router.push("/studies")}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Crear primer estudio
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {studies.map((study) => (
                    <div
                      key={study.id}
                      onClick={() => router.push(`/studies/${study.id}`)}
                      className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{study.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {study.sponsor} · Fase {study.phase}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        study.status === "active"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}>
                        {study.status === "active" ? "Activo" : study.status === "draft" ? "Borrador" : study.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alerts panel */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Alertas y Faltantes Recientes</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-400 text-center py-6">Sin alertas recientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
