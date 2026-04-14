"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import type { PatientVisit, StudyVisit, VisitTask } from "@/types";

export default function VisitPage() {
  const { studyId, patientId, visitId } = useParams();
  const router = useRouter();
  const { t } = useApp();
  const [visit, setVisit] = useState<PatientVisit | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (!visitId || visitId === "new") return;
    loadVisit();
  }, [visitId]);

  async function loadVisit() {
    const v = await api<PatientVisit>(`/patients/${patientId}/visits/${visitId}`);
    setVisit(v);
  }

  async function tryCompleteVisit() {
    // Reload fresh from server before checking
    const fresh = await api<PatientVisit>(`/patients/${patientId}/visits/${visitId}`);
    setVisit(fresh);
    const issues = fresh.tasks.filter(t =>
      (t.is_critical && t.status !== "completed" && t.status !== "not_applicable")
    );
    if (issues.length > 0) {
      setShowCompleteModal(true);
    } else {
      doCompleteVisit();
    }
  }

  async function doCompleteVisit() {
    setShowCompleteModal(false);
    await api(`/patients/${patientId}/visits/${visitId}`, {
      method: "PUT",
      body: JSON.stringify({ visit_status: "completed" }),
    });
    await loadVisit();
  }

  async function updateTask(taskId: string, status: string) {
    setUpdatingTask(taskId);
    // Optimistic update
    setVisit(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status } : t),
    } : prev);
    try {
      await api(`/patients/${patientId}/visits/${visitId}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadVisit();
    } catch {
      await loadVisit();
    }
    setUpdatingTask(null);
  }

  if (!visit && visitId !== "new") return <AppLayout><div className="text-gray-400 text-sm">{t("common.loading")}</div></AppLayout>;

  // New visit creation page
  if (visitId === "new") {
    return <NewVisitPage studyId={studyId as string} patientId={patientId as string} />;
  }

  const completedCount = visit!.tasks.filter((t) => t.status === "completed").length;
  const totalCount = visit!.tasks.length;

  return (
    <AppLayout>
      <div className="max-w-4xl">
        {/* Alert modal when trying to complete with issues */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">{t("visit.alertTitle")}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{t("visit.alertDesc")}</p>
              <div className="space-y-2 mb-6">
                {visit!.tasks.filter(t => t.is_critical && t.status !== "completed" && t.status !== "not_applicable").map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded">{t.is_critical ? "CRITICO" : ""}</span>
                    <span className="text-sm text-red-800">{t.procedure_name}</span>
                    <span className="text-xs text-red-500 ml-auto">{t.status === "pending" ? "Pendiente" : t.status === "missing" ? "Faltante" : t.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={doCompleteVisit}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm cursor-pointer"
                >
                  {t("visit.completeAnyway")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("visit.title")}</h2>
            <p className="text-sm text-gray-500">{t("visit.date")} {visit!.visit_date || t("visit.notAssigned")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{completedCount}/{totalCount} {t("visit.completedOf")}</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <button onClick={() => router.push(`/studies/${studyId}/patients/${patientId}`)} className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block cursor-pointer">{t("visit.backToPatient")}</button>

        {/* Visit status + complete button */}
        <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{t("visit.status")}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              visit!.visit_status === "completed" ? "bg-green-50 text-green-700 border border-green-200" :
              visit!.visit_status === "in_progress" ? "bg-amber-50 text-amber-700 border border-amber-200" :
              "bg-gray-50 text-gray-500 border border-gray-200"
            }`}>
              {visit!.visit_status === "completed" ? t("visit.statusCompleted") :
               visit!.visit_status === "in_progress" ? t("visit.statusInProgress") : t("visit.statusPlanned")}
            </span>
          </div>
          <div className="flex gap-2">
            {visit!.visit_status === "completed" && (
              <button
                onClick={() => router.push(`/studies/${studyId}/patients/${patientId}/visits/new`)}
                className="px-4 py-2 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                {t("visit.nextVisit")} →
              </button>
            )}
            {visit!.visit_status !== "completed" && (
              <button
                onClick={tryCompleteVisit}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                {t("visit.complete")}
              </button>
            )}
          </div>
        </div>

        {/* Procedures */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{t("visit.procedures")}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {visit!.tasks.map((task) => (
              <div key={task.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => updateTask(task.id, task.status === "completed" ? "pending" : "completed")}
                    disabled={updatingTask === task.id || visit!.visit_status === "completed"}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                      task.status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-teal-400"
                    }`}
                  >
                    {task.status === "completed" && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" /></svg>
                    )}
                  </button>
                  <div>
                    <span className={`text-sm ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {task.procedure_name}
                    </span>
                    {task.is_critical && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded">{t("visit.critical")}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateTask(task.id, "not_applicable")}
                    disabled={visit!.visit_status === "completed"}
                    className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                      task.status === "not_applicable" ? "bg-gray-200 text-gray-700 border-gray-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    } ${visit!.visit_status === "completed" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >{t("visit.na")}</button>
                  <button
                    onClick={() => updateTask(task.id, "missing")}
                    disabled={visit!.visit_status === "completed"}
                    className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                      task.status === "missing" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    } ${visit!.visit_status === "completed" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >{t("visit.missing")}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function NewVisitPage({ studyId, patientId }: { studyId: string; patientId: string }) {
  const router = useRouter();
  const { t } = useApp();
  const [studyVisits, setStudyVisits] = useState<StudyVisit[]>([]);
  const [patientVisits, setPatientVisits] = useState<PatientVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<StudyVisit[]>(`/studies/${studyId}/structure/visits`),
      api<PatientVisit[]>(`/patients/${patientId}/visits/`),
    ]).then(([sv, pv]) => {
      setStudyVisits(sv);
      setPatientVisits(pv);
      // Auto-select first available visit
      const createdIds = new Set(pv.map(v => v.study_visit_id));
      const completedIds = new Set(pv.filter(v => v.visit_status === "completed").map(v => v.study_visit_id));
      const first = sv.find(v => {
        if (createdIds.has(v.id)) return false;
        const priors = sv.filter(p => p.order_index < v.order_index);
        return priors.every(p => completedIds.has(p.id));
      });
      if (first) setSelectedVisit(first.id);
    });
  }, [studyId, patientId]);

  function isAvailable(v: StudyVisit): boolean {
    const createdIds = new Set(patientVisits.map(pv => pv.study_visit_id));
    if (createdIds.has(v.id)) return false;
    const completedIds = new Set(patientVisits.filter(pv => pv.visit_status === "completed").map(pv => pv.study_visit_id));
    const priors = studyVisits.filter(sv => sv.order_index < v.order_index);
    return priors.every(p => completedIds.has(p.id));
  }

  function getStatus(v: StudyVisit): string {
    const pv = patientVisits.find(p => p.study_visit_id === v.id);
    if (pv) return t("visit.alreadyCreated");
    if (!isAvailable(v)) return t("visit.requiresPrior");
    return "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const pv = await api<{ id: string }>(`/patients/${patientId}/visits/`, {
        method: "POST",
        body: JSON.stringify({ study_visit_id: selectedVisit, visit_date: new Date().toISOString().split("T")[0] }),
      });
      router.push(`/studies/${studyId}/patients/${patientId}/visits/${pv.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setCreating(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t("visit.createNew")}</h2>
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("visit.visitType")}</label>
            <select value={selectedVisit} onChange={(e) => setSelectedVisit(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
              {studyVisits.map((v) => {
                const status = getStatus(v);
                const available = isAvailable(v);
                return (
                  <option key={v.id} value={v.id} disabled={!available}>
                    {v.visit_code} — {v.visit_name}{status ? ` (${status})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          {error && (
            <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          <button type="submit" disabled={creating || !selectedVisit} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-lg font-medium text-sm cursor-pointer">
            {creating ? t("common.creating") : t("visit.createVisit")}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
