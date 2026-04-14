"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Study, Patient, PatientVisit } from "@/types";

interface VisitRow {
  studyName: string;
  studyId: string;
  subjectCode: string;
  patientId: string;
  visit: PatientVisit;
}

export default function GlobalVisitsPage() {
  const router = useRouter();
  const { t, locale } = useApp();
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const studies = await api<Study[]>("/studies/");
      const allRows: VisitRow[] = [];
      await Promise.all(studies.map(async (s) => {
        try {
          const patients = await api<Patient[]>(`/studies/${s.id}/patients/`);
          await Promise.all(patients.map(async (p) => {
            try {
              const visits = await api<PatientVisit[]>(`/patients/${p.id}/visits/`);
              visits.forEach(v => allRows.push({
                studyName: s.name, studyId: s.id,
                subjectCode: p.subject_code, patientId: p.id,
                visit: v,
              }));
            } catch {}
          }));
        } catch {}
      }));
      setRows(allRows);
    } catch {}
    setLoading(false);
  }

  async function handleDelete(row: VisitRow, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t("globalVisits.confirmDelete"))) return;
    await api(`/patients/${row.patientId}/visits/${row.visit.id}`, { method: "DELETE" });
    setRows(prev => prev.filter(r => r.visit.id !== row.visit.id));
  }

  return (
    <AppLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t("globalVisits.title")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("globalVisits.subtitle")}</p>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-400">{t("globalVisits.noVisits")}</p>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sky-50 bg-sky-50/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalScreening.study")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalScreening.patient")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalVisits.visitName")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalVisits.procedures")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.date")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.status")}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {rows.map((r) => {
                  const done = r.visit.tasks.filter(t => t.status === "completed").length;
                  const total = r.visit.tasks.length;
                  return (
                    <tr
                      key={r.visit.id}
                      className="hover:bg-sky-50/40 cursor-pointer transition-colors"
                      onClick={() => router.push(`/studies/${r.studyId}/patients/${r.patientId}/visits/${r.visit.id}`)}
                    >
                      <td className="px-5 py-4 text-sm text-gray-600">{r.studyName}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">{r.subjectCode}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {r.visit.visit_code && <span className="text-sky-500 font-medium mr-1">{r.visit.visit_code}</span>}
                        {r.visit.visit_name || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {total > 0 ? (
                          <span className={done === total ? "text-green-600 font-medium" : ""}>{done}/{total}</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {r.visit.visit_date ? new Date(r.visit.visit_date).toLocaleDateString(locale === "es" ? "es-AR" : "en-US") : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.visit.visit_status === "completed" ? "bg-green-50 text-green-700" :
                          r.visit.visit_status === "in_progress" ? "bg-amber-50 text-amber-700" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {r.visit.visit_status === "completed" ? t("visit.statusCompleted") :
                           r.visit.visit_status === "in_progress" ? t("visit.statusInProgress") : t("visit.statusPlanned")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => handleDelete(r, e)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={t("common.delete")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
