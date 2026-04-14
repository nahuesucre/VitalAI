"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Study, Patient, PatientVisit, StudyVisit } from "@/types";

interface PatientRow {
  patient: Patient;
  studyName: string;
  studyId: string;
  visits: PatientVisit[];
  nextVisit: StudyVisit | null;
}

export default function GlobalPatientsPage() {
  const router = useRouter();
  const { t, locale } = useApp();
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const studies = await api<Study[]>("/studies/");
        const allRows: PatientRow[] = [];
        await Promise.all(studies.map(async (s) => {
          try {
            const [patients, studyVisits] = await Promise.all([
              api<Patient[]>(`/studies/${s.id}/patients/`),
              api<StudyVisit[]>(`/studies/${s.id}/structure/visits`),
            ]);
            await Promise.all(patients.map(async (p) => {
              try {
                const pvs = await api<PatientVisit[]>(`/patients/${p.id}/visits/`);
                const createdIds = new Set(pvs.map(v => v.study_visit_id));
                const completedIds = new Set(pvs.filter(v => v.visit_status === "completed").map(v => v.study_visit_id));
                const next = studyVisits.find(sv => {
                  if (createdIds.has(sv.id)) return false;
                  return studyVisits.filter(pr => pr.order_index < sv.order_index).every(pr => completedIds.has(pr.id));
                }) || null;
                allRows.push({ patient: p, studyName: s.name, studyId: s.id, visits: pvs, nextVisit: next });
              } catch {}
            }));
          } catch {}
        }));
        setRows(allRows);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t("globalPatients.title")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("globalPatients.subtitle")}</p>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-400">{t("globalPatients.noPatients")}</p>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sky-50 bg-sky-50/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalScreening.study")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalScreening.patient")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.screening")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.visits")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalPatients.nextVisit")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.status")}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {rows.map((r) => {
                  const done = r.visits.filter(v => v.visit_status === "completed").length;
                  return (
                    <tr
                      key={r.patient.id}
                      className="hover:bg-sky-50/40 cursor-pointer transition-colors"
                      onClick={() => router.push(`/studies/${r.studyId}/patients/${r.patient.id}`)}
                    >
                      <td className="px-5 py-4 text-sm text-gray-600">{r.studyName}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">{r.patient.subject_code}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.patient.screening_status === "eligible" ? "bg-green-50 text-green-700" :
                          r.patient.screening_status === "not_eligible" ? "bg-red-50 text-red-700" :
                          r.patient.screening_status === "in_progress" ? "bg-amber-50 text-amber-700" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {r.patient.screening_status === "eligible" ? t("detail.eligible") :
                           r.patient.screening_status === "not_eligible" ? t("detail.notEligible") :
                           r.patient.screening_status === "in_progress" ? t("detail.inProgress") : t("detail.pending")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {r.visits.length > 0 ? `${done}/${r.visits.length} ${t("detail.visitsCompleted")}` : <span className="text-gray-300">{t("detail.noVisits")}</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {r.nextVisit ? (
                          <span className="text-sky-600 font-medium">{r.nextVisit.visit_code || r.nextVisit.visit_name}</span>
                        ) : r.visits.length > 0 ? (
                          <span className="text-green-600 text-xs">{t("patient.allVisitsComplete")}</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 capitalize">{r.patient.enrollment_status}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sky-500 text-sm font-medium">{t("detail.view")}</span>
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
