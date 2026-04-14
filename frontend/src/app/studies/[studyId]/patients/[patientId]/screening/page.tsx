"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Patient, ScreeningItem } from "@/types";

export default function ScreeningPage() {
  const { studyId, patientId } = useParams();
  const router = useRouter();
  const { t } = useApp();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<ScreeningItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    api<Patient>(`/studies/${studyId}/patients/${patientId}`).then(setPatient);
    loadScreening();
  }, [studyId, patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadScreening() {
    const data = await api<ScreeningItem[]>(`/patients/${patientId}/screening/`);
    setItems(data);
  }

  async function updateItem(itemId: string, status: string) {
    setSaving(itemId);
    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status } : i));
    try {
      await api(`/patients/${patientId}/screening/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const [screeningData, patientData] = await Promise.all([
        api<ScreeningItem[]>(`/patients/${patientId}/screening/`),
        api<Patient>(`/studies/${studyId}/patients/${patientId}`),
      ]);
      setItems(screeningData);
      setPatient(patientData);
    } catch {
      await loadScreening();
    }
    setSaving(null);
  }

  const inclusionItems = items.filter((i) => i.criterion_type === "inclusion");
  const exclusionItems = items.filter((i) => i.criterion_type === "exclusion");
  const pendingCount = items.filter((i) => i.status === "unknown").length;
  const failCount = items.filter((i) => (i.criterion_type === "inclusion" && i.status === "not_met") || (i.criterion_type === "exclusion" && i.status === "met")).length;

  if (!patient) return <AppLayout><div className="text-gray-400 text-sm">{t("common.loading")}</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-cyan-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Screening — {patient.subject_code}</h2>
              <p className="text-sm text-gray-400">{t("screening.visit1")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">{pendingCount} {t("screening.pendingCount")}</span>}
            {failCount > 0 && <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">{failCount} {t("screening.failCount")}</span>}
          </div>
        </div>

        <button
          onClick={() => router.push(`/studies/${studyId}`)}
          className="text-sm text-sky-500 hover:text-sky-600 font-medium mb-6 inline-block transition-colors cursor-pointer"
        >
          {t("screening.backToStudy")}
        </button>

        {items.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-sm text-gray-400">{t("screening.noCriteria")}</p>
          </div>
        ) : (
          <>
            {/* Inclusion */}
            {inclusionItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="font-semibold text-green-800">{t("screening.inclusionCriteria")}</h3>
                </div>
                <div className="bg-white border border-sky-100 rounded-2xl divide-y divide-sky-50 shadow-sm">
                  {inclusionItems.map((item) => (
                    <div key={item.id} className={`px-5 py-4 flex items-center justify-between ${item.status === "not_met" ? "bg-amber-50/50" : ""}`}>
                      <span className="text-sm text-gray-700 flex-1 pr-4">{item.criterion_name}</span>
                      <div className="flex gap-1.5">
                        {(["met", "not_met", "unknown"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateItem(item.id, s)}
                            disabled={saving === item.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              item.status === s
                                ? s === "met" ? "bg-green-500 text-white border-green-500" :
                                  s === "not_met" ? "bg-red-500 text-white border-red-500" :
                                  "bg-gray-200 text-gray-700 border-gray-300"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-sky-50 hover:border-sky-200"
                            }`}
                          >
                            {s === "met" ? t("screening.met") : s === "not_met" ? t("screening.notMet") : t("screening.pendingStatus")}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusion */}
            {exclusionItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  <h3 className="font-semibold text-red-800">{t("screening.exclusionCriteria")}</h3>
                  <span className="text-xs text-gray-400">{t("screening.exclusionNote")}</span>
                </div>
                <div className="bg-white border border-sky-100 rounded-2xl divide-y divide-sky-50 shadow-sm">
                  {exclusionItems.map((item) => (
                    <div key={item.id} className={`px-5 py-4 flex items-center justify-between ${item.status === "met" ? "bg-red-50/50" : ""}`}>
                      <span className="text-sm text-gray-700 flex-1 pr-4">{item.criterion_name}</span>
                      <div className="flex gap-1.5">
                        {(["not_met", "met", "unknown"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateItem(item.id, s)}
                            disabled={saving === item.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              item.status === s
                                ? s === "not_met" ? "bg-green-500 text-white border-green-500" :
                                  s === "met" ? "bg-red-500 text-white border-red-500" :
                                  "bg-gray-200 text-gray-700 border-gray-300"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-sky-50 hover:border-sky-200"
                            }`}
                          >
                            {s === "not_met" ? t("screening.exclusionNotMet") : s === "met" ? t("screening.exclusionMet") : t("screening.pendingStatus")}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/studies/${studyId}`)}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                {t("screening.backBtn")}
              </button>
              <button
                onClick={() => router.push(`/studies/${studyId}/patients/${patientId}/visits/new`)}
                className="px-6 py-2.5 border border-sky-400 text-sky-500 hover:bg-sky-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {t("screening.createVisit")}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
