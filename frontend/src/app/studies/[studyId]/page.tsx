"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Study, StudyDocument, StudyVisit, StudyRule, Patient, PatientVisit } from "@/types";

const STUDY_TYPE_KEYS: Record<string, string> = {
  interventional_drug: "studies.typeInterventionalDrug",
  interventional_device: "studies.typeInterventionalDevice",
  observational: "studies.typeObservational",
};

const PROCESSING_STATUS_KEYS: Record<string, string> = {
  completed: "studies.statusProcessed",
  processing: "studies.statusProcessing",
  failed: "studies.statusFailed",
  pending: "studies.statusPending",
};

type Tab = "documents" | "structure" | "patients";

export default function StudyDetailPage() {
  const { studyId } = useParams();
  const router = useRouter();
  const { t, locale } = useApp();
  const [study, setStudy] = useState<Study | null>(null);
  const [tab, setTab] = useState<Tab>("documents");
  const [docs, setDocs] = useState<StudyDocument[]>([]);
  const [visits, setVisits] = useState<StudyVisit[]>([]);
  const [rules, setRules] = useState<StudyRule[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ subject_code: "", sex: "M", birth_year: 1980 });
  const [patientVisitsMap, setPatientVisitsMap] = useState<Record<string, PatientVisit[]>>({});

  useEffect(() => {
    if (!studyId) return;
    api<Study>(`/studies/${studyId}`).then(setStudy).catch(() => {});
    loadDocs();
    loadStructure();
    loadPatients();
  }, [studyId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDocs() {
    try { setDocs(await api<StudyDocument[]>(`/studies/${studyId}/documents`)); } catch {}
  }
  async function loadStructure() {
    try {
      setVisits(await api<StudyVisit[]>(`/studies/${studyId}/structure/visits`));
      setRules(await api<StudyRule[]>(`/studies/${studyId}/structure/rules`));
    } catch {}
  }
  async function loadPatients() {
    try {
      const pts = await api<Patient[]>(`/studies/${studyId}/patients/`);
      setPatients(pts);
      // Load visits for each patient
      const map: Record<string, PatientVisit[]> = {};
      await Promise.all(pts.map(async (p) => {
        try { map[p.id] = await api<PatientVisit[]>(`/patients/${p.id}/visits/`); } catch {}
      }));
      setPatientVisitsMap(map);
    } catch {}
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);
    formData.append("title", file.name);
    await api(`/studies/${studyId}/documents`, { method: "POST", body: formData });
    await loadDocs();
    setUploading(false);
  }

  async function handleParse(docId: string) {
    setParsing(docId);
    try {
      await api(`/studies/${studyId}/documents/${docId}/parse`, { method: "POST" });
      await loadStructure();
      await loadDocs();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al procesar documento";
      alert(`Error: ${msg}`);
      await loadDocs();
    } finally {
      setParsing(null);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    await api(`/studies/${studyId}/structure/confirm`, { method: "POST" });
    await loadStructure();
    setConfirming(false);
  }

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    await api(`/studies/${studyId}/patients/`, {
      method: "POST",
      body: JSON.stringify({ ...patientForm, birth_year: Number(patientForm.birth_year) }),
    });
    setShowCreatePatient(false);
    setPatientForm({ subject_code: "", sex: "M", birth_year: 1980 });
    await loadPatients();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "documents", label: t("detail.documents") },
    { key: "structure", label: t("detail.structure") },
    { key: "patients", label: t("detail.patients") },
  ];

  const statusBadge = study?.status === "active"
    ? "bg-sky-50 text-sky-600 border-sky-200"
    : "bg-gray-50 text-gray-500 border-gray-200";

  if (!study) return <AppLayout><div className="text-gray-400 text-sm">{t("common.loading")}</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-cyan-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{study.name}</h2>
              <p className="text-sm text-gray-400">{t("studies.studyPhaseType")} {study.phase} — {t(STUDY_TYPE_KEYS[study.study_type || ""] || study.study_type || "")} · {t("studies.sponsoredBy")} {study.sponsor}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge}`}>
            {study.status === "active" ? t("studies.activeRecruiting") : study.status === "draft" ? t("studies.draft") : study.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="border-b border-sky-100 mb-6">
          <div className="flex gap-6">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  tab === tabItem.key
                    ? "border-sky-500 text-sky-500"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Tab */}
        {tab === "documents" && (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="bg-white border border-sky-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{doc.title}</h4>
                    <p className="text-xs text-gray-400">{doc.document_type.toUpperCase()} · {new Date(doc.created_at).toLocaleDateString(locale === "es" ? "es-AR" : "en-US")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    doc.processing_status === "completed" ? "bg-green-50 text-green-700" :
                    doc.processing_status === "processing" ? "bg-sky-50 text-sky-600" :
                    doc.processing_status === "failed" ? "bg-red-50 text-red-700" :
                    "bg-gray-50 text-gray-500"
                  }`}>{t(PROCESSING_STATUS_KEYS[doc.processing_status] || doc.processing_status)}</span>
                  {(doc.processing_status === "pending" || doc.processing_status === "failed") && (
                    <button
                      onClick={() => handleParse(doc.id)}
                      disabled={!!parsing}
                      className={`px-3 py-1.5 ${doc.processing_status === "failed" ? "bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600" : "bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600"} disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer`}
                    >
                      {parsing === doc.id ? t("common.processing") : doc.processing_status === "failed" ? t("detail.retryAI") : t("detail.processAI")}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-white border-2 border-dashed border-sky-100 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400 mb-4">{t("detail.uploadDoc")}</p>
              <div className="flex justify-center gap-3">
                {["protocol", "icf", "ib"].map((type) => (
                  <label key={type} className="px-4 py-2 border border-sky-200 text-sky-600 rounded-xl text-sm hover:bg-sky-50 cursor-pointer font-medium transition-colors">
                    {type === "protocol" ? t("detail.protocol") : type === "icf" ? t("detail.icf") : t("detail.ib")}
                    <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => handleUpload(e, type)} disabled={uploading} />
                  </label>
                ))}
              </div>
              {uploading && <p className="text-xs text-sky-500 mt-3">{t("common.uploading")}</p>}
            </div>
          </div>
        )}

        {/* Structure Tab */}
        {tab === "structure" && (
          <div>
            {visits.length === 0 ? (
              <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-sm text-gray-400">{t("detail.noStructure")}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-5">{t("detail.structureDesc")}</p>
                <div className="space-y-4">
                  {visits.map((visit) => (
                    <div key={visit.id} className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${visit.is_confirmed ? "bg-sky-500" : "border-2 border-gray-300"}`} />
                          <h4 className="font-semibold text-gray-800">{visit.visit_code} — {visit.visit_name}</h4>
                        </div>
                        {visit.day_nominal !== null && (
                          <span className="text-xs text-sky-500 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                            {t("detail.day")} {visit.day_nominal}
                            {visit.window_min_days !== null && ` ± ${visit.window_max_days} ${t("detail.days")}`}
                          </span>
                        )}
                      </div>
                      {visit.procedures.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {visit.procedures.map((proc) => (
                            <div key={proc.id} className="flex items-start gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-sky-300 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                              <span>{proc.procedure_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {rules.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-gray-800 mb-4">{t("detail.screeningCriteria")}</h3>
                    <div className="bg-white border border-sky-100 rounded-2xl divide-y divide-sky-50 shadow-sm">
                      {rules.filter(r => r.rule_type === "inclusion").map((rule) => (
                        <div key={rule.id} className="px-5 py-3 flex items-center gap-3">
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">{t("detail.inclusion")}</span>
                          <span className="text-sm text-gray-700">{rule.title}</span>
                        </div>
                      ))}
                      {rules.filter(r => r.rule_type === "exclusion").map((rule) => (
                        <div key={rule.id} className="px-5 py-3 flex items-center gap-3">
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">{t("detail.exclusion")}</span>
                          <span className="text-sm text-gray-700">{rule.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!visits.every(v => v.is_confirmed) && (
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="mt-6 px-6 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    {confirming ? t("common.confirming") : t("detail.confirmStructure")}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Patients Tab */}
        {tab === "patients" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowCreatePatient(true)}
                className="px-4 py-2 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                {t("detail.newPatient")}
              </button>
            </div>

            {showCreatePatient && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-sky-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">{t("detail.newPatientTitle")}</h3>
                  <form onSubmit={handleCreatePatient} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("detail.subjectCode")}</label>
                      <input value={patientForm.subject_code} onChange={(e) => setPatientForm({ ...patientForm, subject_code: e.target.value })} placeholder={t("detail.subjectPlaceholder")} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("detail.sex")}</label>
                        <select value={patientForm.sex} onChange={(e) => setPatientForm({ ...patientForm, sex: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent">
                          <option value="M">{t("detail.male")}</option>
                          <option value="F">{t("detail.female")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("detail.birthYear")}</label>
                        <input type="number" value={patientForm.birth_year} onChange={(e) => setPatientForm({ ...patientForm, birth_year: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowCreatePatient(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm cursor-pointer">{t("common.cancel")}</button>
                      <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm cursor-pointer">{t("detail.createPatient")}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {patients.length === 0 ? (
              <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-sm text-gray-400">{t("detail.noPatients")}</p>
              </div>
            ) : (
              <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sky-50 bg-sky-50/40">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.patientId")}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.screening")}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.status")}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.visits")}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("detail.date")}</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-50">
                    {patients.map((p) => (
                      <tr key={p.id} className="hover:bg-sky-50/40 cursor-pointer transition-colors" onClick={() => router.push(`/studies/${studyId}/patients/${p.id}`)}>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">{p.subject_code}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.screening_status === "eligible" ? "bg-green-50 text-green-700" :
                            p.screening_status === "not_eligible" ? "bg-red-50 text-red-700" :
                            p.screening_status === "in_progress" ? "bg-amber-50 text-amber-700" :
                            "bg-gray-50 text-gray-500"
                          }`}>{p.screening_status === "eligible" ? t("detail.eligible") : p.screening_status === "not_eligible" ? t("detail.notEligible") : p.screening_status === "in_progress" ? t("detail.inProgress") : t("detail.pending")}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 capitalize">{p.enrollment_status}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {(() => {
                            const pv = patientVisitsMap[p.id] || [];
                            if (pv.length === 0) return <span className="text-gray-300">{t("detail.noVisits")}</span>;
                            const done = pv.filter(v => v.visit_status === "completed").length;
                            return <span>{done}/{pv.length} {t("detail.visitsCompleted")}</span>;
                          })()}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString(locale === "es" ? "es-AR" : "en-US")}</td>
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
        )}
      </div>
    </AppLayout>
  );
}
