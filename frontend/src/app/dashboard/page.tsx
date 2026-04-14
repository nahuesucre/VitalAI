"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import type { Study, Alert, MetricsOverview } from "@/types";

export default function DashboardPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const router = useRouter();
  const { t, locale } = useApp();

  useEffect(() => {
    api<Study[]>("/studies/").then(async (s) => {
      setStudies(s);
      if (s.length > 0) {
        // Aggregate metrics and alerts from ALL studies
        let totalMetrics: MetricsOverview = {
          patients_by_status: {}, visits_by_status: {},
          alerts_by_type: {}, alerts_by_severity: {},
          common_missing_procedures: [], deviations_by_category: [],
          total_patients: 0, total_visits: 0, total_alerts_open: 0,
        };
        const allAlerts: Alert[] = [];
        await Promise.all(s.map(async (study) => {
          try {
            const m = await api<MetricsOverview>(`/studies/${study.id}/metrics/overview`);
            totalMetrics.total_patients += m.total_patients || 0;
            totalMetrics.total_visits += m.total_visits || 0;
            totalMetrics.total_alerts_open += m.total_alerts_open || 0;
            for (const [k, v] of Object.entries(m.patients_by_status || {}))
              totalMetrics.patients_by_status[k] = (totalMetrics.patients_by_status[k] || 0) + v;
            for (const [k, v] of Object.entries(m.visits_by_status || {}))
              totalMetrics.visits_by_status[k] = (totalMetrics.visits_by_status[k] || 0) + v;
          } catch {}
          try {
            const a = await api<Alert[]>(`/studies/${study.id}/alerts/`);
            allAlerts.push(...a.filter(al => al.status === "open"));
          } catch {}
        }));
        setMetrics(totalMetrics);
        setAlerts(allAlerts);
      }
    }).catch(() => {});
  }, []);

  const screeningCount = (metrics?.patients_by_status?.["in_progress"] || 0) + (metrics?.patients_by_status?.["not_started"] || 0);
  const screeningDone = (metrics?.patients_by_status?.["eligible"] || 0) + (metrics?.patients_by_status?.["not_eligible"] || 0);
  const alertCount = metrics?.total_alerts_open || 0;
  const activeVisits = (metrics?.visits_by_status?.["planned"] || 0) + (metrics?.visits_by_status?.["in_progress"] || 0);
  const completedVisits = metrics?.visits_by_status?.["completed"] || 0;

  return (
    <AppLayout>
      <div className="max-w-7xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t("dashboard.title")}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {studies.length > 0 && `${t("dashboard.study")} ${studies[0].name} · `}
            {t("dashboard.today")} {new Date().toLocaleDateString(locale === "es" ? "es-AR" : "en-US", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-start justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("dashboard.patientsScreening")}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{screeningCount}</p>
              <p className="text-xs text-gray-300 mt-1">{screeningDone > 0 ? `${screeningDone} ${t("dashboard.completed")}` : t("dashboard.createStudyStart")}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            </div>
          </div>
          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-start justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("dashboard.activeVisits")}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{activeVisits}</p>
              <p className="text-xs text-gray-300 mt-1">{completedVisits} {t("dashboard.completed")}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            </div>
          </div>
          <div className="bg-white border border-sky-100 rounded-2xl p-5 flex items-start justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("dashboard.criticalAlerts")}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{alertCount}</p>
              <p className="text-xs text-gray-300 mt-1">{alertCount > 0 ? `${alerts.filter(a => a.severity === "high").length} ${t("dashboard.unresolved")}` : t("dashboard.noPending")}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Studies */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-sky-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-sky-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{t("dashboard.studies")}</h3>
                <button
                  onClick={() => router.push("/studies")}
                  className="text-sm text-sky-500 hover:text-sky-600 font-medium transition-colors cursor-pointer"
                >
                  {t("dashboard.viewAll")}
                </button>
              </div>
              {studies.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{t("dashboard.noStudies")}</p>
                  <button
                    onClick={() => router.push("/studies")}
                    className="px-5 py-2 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    {t("dashboard.createFirst")}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-sky-50">
                  {studies.map((study) => (
                    <div
                      key={study.id}
                      onClick={() => router.push(`/studies/${study.id}`)}
                      className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-sky-50/50 transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-gray-800">{study.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {study.sponsor} · {t("dashboard.phase")} {study.phase}
                        </p>
                      </div>
                      {study.status === "active" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200">
                          {t("dashboard.active")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <div className="bg-white border border-sky-100 rounded-2xl shadow-sm">
              <div className="px-5 py-4 border-b border-sky-50">
                <h3 className="font-semibold text-gray-800">{t("dashboard.recentAlerts")}</h3>
              </div>
              <div className="p-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    </div>
                    <p className="text-sm text-gray-300">{t("dashboard.noAlerts")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className={`px-4 py-3 rounded-xl border-l-4 ${
                        alert.severity === "high" ? "bg-red-50 border-red-400" :
                        alert.severity === "medium" ? "bg-amber-50 border-amber-400" :
                        "bg-sky-50 border-sky-400"
                      }`}>
                        <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(alert.created_at).toLocaleString(locale === "es" ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
