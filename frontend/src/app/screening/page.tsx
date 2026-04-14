"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Study, Patient } from "@/types";

export default function GlobalScreeningPage() {
  const router = useRouter();
  const { t, locale } = useApp();
  const [studies, setStudies] = useState<Study[]>([]);
  const [patientsByStudy, setPatientsByStudy] = useState<Record<string, Patient[]>>({});

  useEffect(() => {
    api<Study[]>("/studies/").then(async (sts) => {
      setStudies(sts);
      const map: Record<string, Patient[]> = {};
      await Promise.all(sts.map(async (s) => {
        try { map[s.id] = await api<Patient[]>(`/studies/${s.id}/patients/`); } catch {}
      }));
      setPatientsByStudy(map);
    });
  }, []);

  const allPatients = studies.flatMap(s =>
    (patientsByStudy[s.id] || []).map(p => ({ ...p, studyName: s.name, studyId: s.id }))
  );

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t("globalScreening.title")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("globalScreening.subtitle")}</p>
        </div>

        {allPatients.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-400">{t("globalScreening.noPatients")}</p>
          </div>
        ) : (
          <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sky-50 bg-sky-50/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalScreening.study")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("globalScreening.patient")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.screening")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.status")}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {allPatients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-sky-50/40 cursor-pointer transition-colors"
                    onClick={() => router.push(`/studies/${p.studyId}/patients/${p.id}`)}
                  >
                    <td className="px-5 py-4 text-sm text-gray-600">{p.studyName}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-800">{p.subject_code}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.screening_status === "eligible" ? "bg-green-50 text-green-700" :
                        p.screening_status === "not_eligible" ? "bg-red-50 text-red-700" :
                        p.screening_status === "in_progress" ? "bg-amber-50 text-amber-700" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        {p.screening_status === "eligible" ? t("detail.eligible") :
                         p.screening_status === "not_eligible" ? t("detail.notEligible") :
                         p.screening_status === "in_progress" ? t("detail.inProgress") : t("detail.pending")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 capitalize">{p.enrollment_status}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sky-500 text-sm font-medium">{t("detail.view")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
