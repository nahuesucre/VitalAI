"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Patient, PatientVisit, StudyVisit } from "@/types";

export default function PatientDetailPage() {
  const { studyId, patientId } = useParams();
  const router = useRouter();
  const { t, locale } = useApp();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [studyVisits, setStudyVisits] = useState<StudyVisit[]>([]);

  useEffect(() => {
    if (!patientId) return;
    api<Patient>(`/studies/${studyId}/patients/${patientId}`).then(setPatient);
    api<PatientVisit[]>(`/patients/${patientId}/visits/`).then(setVisits);
    api<StudyVisit[]>(`/studies/${studyId}/structure/visits`).then(setStudyVisits);
  }, [studyId, patientId]);

  if (!patient) return <AppLayout><div className="text-gray-400 text-sm">{t("common.loading")}</div></AppLayout>;

  const createdVisitIds = new Set(visits.map(v => v.study_visit_id));
  const completedVisitIds = new Set(visits.filter(v => v.visit_status === "completed").map(v => v.study_visit_id));
  const nextStudyVisit = studyVisits.find(sv => {
    if (createdVisitIds.has(sv.id)) return false;
    const priors = studyVisits.filter(p => p.order_index < sv.order_index);
    return priors.every(p => completedVisitIds.has(p.id));
  });

  return (
    <AppLayout>
      <div className="max-w-4xl">
        {/* Back */}
        <button
          onClick={() => router.push(`/studies/${studyId}`)}
          className="text-sm text-sky-500 hover:text-sky-600 font-medium mb-6 inline-block transition-colors cursor-pointer"
        >
          {t("patient.backToStudy")}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-cyan-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{patient.subject_code}</h2>
              <p className="text-sm text-gray-400">
                {t("patient.sex")}: {patient.sex || "—"} · {t("patient.birthYear")}: {patient.birth_year || "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              patient.screening_status === "eligible" ? "bg-green-50 text-green-700 border-green-200" :
              patient.screening_status === "not_eligible" ? "bg-red-50 text-red-700 border-red-200" :
              patient.screening_status === "in_progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-gray-50 text-gray-500 border-gray-200"
            }`}>
              {patient.screening_status === "eligible" ? t("detail.eligible") :
               patient.screening_status === "not_eligible" ? t("detail.notEligible") :
               patient.screening_status === "in_progress" ? t("detail.inProgress") : t("detail.pending")}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-sky-50 text-sky-600 border-sky-200 capitalize">
              {patient.enrollment_status}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => router.push(`/studies/${studyId}/patients/${patientId}/screening`)}
            className="px-4 py-2 border border-sky-200 text-sky-600 rounded-xl text-sm font-medium hover:bg-sky-50 transition-colors cursor-pointer"
          >
            {t("patient.viewScreening")}
          </button>
          {nextStudyVisit && (
            <button
              onClick={() => router.push(`/studies/${studyId}/patients/${patientId}/visits/new`)}
              className="px-4 py-2 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              {t("patient.createNextVisit")}: {nextStudyVisit.visit_code || nextStudyVisit.visit_name}
            </button>
          )}
        </div>

        {/* Visit History */}
        <h3 className="font-semibold text-gray-800 mb-4">{t("patient.visitHistory")}</h3>
        {visits.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-400">{t("patient.noVisits")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => {
              const done = v.tasks.filter(t => t.status === "completed").length;
              const total = v.tasks.length;
              return (
                <div
                  key={v.id}
                  onClick={() => router.push(`/studies/${studyId}/patients/${patientId}/visits/${v.id}`)}
                  className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-sky-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      v.visit_status === "completed" ? "bg-green-50" : "bg-sky-50"
                    }`}>
                      {v.visit_status === "completed" ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">
                        {v.visit_code && <span className="text-sky-500 mr-1">{v.visit_code}</span>}
                        {v.visit_name || "Visita"}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {v.visit_date ? new Date(v.visit_date).toLocaleDateString(locale === "es" ? "es-AR" : "en-US") : "—"} · {done}/{total} {t("patient.procedures")}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    v.visit_status === "completed" ? "bg-green-50 text-green-700" :
                    v.visit_status === "in_progress" ? "bg-amber-50 text-amber-700" :
                    "bg-gray-50 text-gray-500"
                  }`}>
                    {v.visit_status === "completed" ? t("visit.statusCompleted") :
                     v.visit_status === "in_progress" ? t("visit.statusInProgress") : t("visit.statusPlanned")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Next visit info */}
        {nextStudyVisit ? (
          <div className="mt-6 bg-sky-50 border border-sky-100 rounded-2xl p-5">
            <p className="text-sm font-medium text-sky-700">
              {t("patient.nextVisit")}: <span className="font-bold">{nextStudyVisit.visit_code} — {nextStudyVisit.visit_name}</span>
              {nextStudyVisit.day_nominal !== null && <span className="text-sky-500 ml-2">({t("detail.day")} {nextStudyVisit.day_nominal})</span>}
            </p>
          </div>
        ) : visits.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-5">
            <p className="text-sm font-medium text-green-700">{t("patient.allVisitsComplete")}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
