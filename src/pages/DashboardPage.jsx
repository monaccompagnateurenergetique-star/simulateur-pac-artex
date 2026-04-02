import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus, Users, TrendingUp, Briefcase, Bell, AlertTriangle,
  Calendar, ChevronRight, ArrowRightCircle
} from 'lucide-react'
import { useLeads, LEAD_STATUSES } from '../hooks/useLeads'
import { useProjects, PROJECT_STATUSES } from '../hooks/useProjects'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'
import KpiCard from '../components/dashboard/KpiCard'
import PipelineChart from '../components/dashboard/PipelineChart'

export default function DashboardPage() {
  const { leads, getLeadStatusCounts } = useLeads()
  const { projects, getStatusCounts } = useProjects()
  const { notifications, scanReminders } = useNotifications()
  const { userProfile } = useAuth()

  // Scan les rappels au montage
  useMemo(() => {
    scanReminders(leads, projects)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const leadCounts = getLeadStatusCounts()
  const projectCounts = getStatusCounts()

  // KPIs
  const totalLeadsActifs = leads.filter((l) => l.status !== 'perdu' && l.status !== 'converti').length
  const leadsAContacter = leadCounts['a_contacter'] || 0
  const totalConverted = leadCounts['converti'] || 0
  const tauxConversion = leads.length > 0
    ? Math.round((totalConverted / leads.length) * 100)
    : 0
  const projetsActifs = projects.filter(
    (p) => p.status !== 'perdu' && p.status !== 'prime_versee'
  ).length

  // Rappels du jour et en retard
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const allReminders = useMemo(() => {
    const items = []
    leads.forEach((l) => {
      (l.reminders || []).forEach((r) => {
        if (!r.done) items.push({ ...r, entityType: 'lead', entityId: l.id, entityName: l.firstName || l.phone || 'Lead' })
      })
    })
    projects.forEach((p) => {
      (p.reminders || []).forEach((r) => {
        if (!r.done) items.push({ ...r, entityType: 'project', entityId: p.id, entityName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Projet' })
      })
    })
    return items.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
  }, [leads, projects])

  const overdueReminders = allReminders.filter((r) => r.dueAt && new Date(r.dueAt) < now)
  const todayReminders = allReminders.filter((r) => r.dueAt && r.dueAt.startsWith(todayStr) && new Date(r.dueAt) >= now)
  const upcomingReminders = [...overdueReminders, ...todayReminders].slice(0, 8)

  // Activité récente
  const recentActivity = useMemo(() => {
    const items = []
    leads.slice(0, 5).forEach((l) => {
      items.push({
        type: 'lead',
        label: `Lead créé : ${l.firstName || l.phone || l.email || 'Sans nom'}`,
        date: l.createdAt,
        to: `/leads/${l.id}`,
      })
    })
    projects.slice(0, 5).forEach((p) => {
      items.push({
        type: 'project',
        label: `Projet : ${p.firstName || ''} ${p.lastName || ''}`.trim(),
        date: p.updatedAt || p.createdAt,
        to: `/projets/${p.id}`,
      })
    })
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
  }, [leads, projects])

  const leadActiveStatuses = LEAD_STATUSES.filter((s) => s.value !== 'perdu' && s.value !== 'converti')
  const projectActiveStatuses = PROJECT_STATUSES.filter((s) => s.value !== 'perdu')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {userProfile?.firstName
            ? `Bonjour ${userProfile.firstName} !`
            : 'Tableau de bord'}
        </h1>
        <p className="text-sm text-gray-500">
          {userProfile?.company
            ? `${userProfile.company} — Pilotage & Simulation CEE`
            : 'Artex360 — Pilotage & Simulation CEE'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={UserPlus}
          value={totalLeadsActifs}
          label="Leads actifs"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <KpiCard
          icon={AlertTriangle}
          value={leadsAContacter}
          label="Leads à contacter"
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <KpiCard
          icon={TrendingUp}
          value={`${tauxConversion}%`}
          label="Taux de conversion"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <KpiCard
          icon={Briefcase}
          value={projetsActifs}
          label="Projets actifs"
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <PipelineChart
            title="Pipeline Leads"
            statuses={leadActiveStatuses}
            counts={leadCounts}
            total={leads.length}
          />
          <Link
            to="/leads"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Voir tous les leads <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <PipelineChart
            title="Pipeline Projets"
            statuses={projectActiveStatuses}
            counts={projectCounts}
            total={projects.length}
          />
          <Link
            to="/projets"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Voir tous les projets <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Rappels + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rappels */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            Rappels
            {overdueReminders.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {overdueReminders.length} en retard
              </span>
            )}
          </h2>
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun rappel en cours</p>
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map((r) => {
                const isOverdue = r.dueAt && new Date(r.dueAt) < now
                return (
                  <Link
                    key={r.id}
                    to={r.entityType === 'lead' ? `/leads/${r.entityId}` : `/projets/${r.entityId}`}
                    className={`block p-3 rounded-lg text-sm transition hover:shadow-sm ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${isOverdue ? 'text-red-800' : 'text-gray-800'}`}>{r.text}</p>
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                    </div>
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(r.dueAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      <span className="text-gray-400"> — {r.entityName}</span>
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <ArrowRightCircle className="w-4 h-4 text-indigo-500" />
            Activité récente
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune activité</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <Link
                  key={i}
                  to={item.to}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'lead' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
