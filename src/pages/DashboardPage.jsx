import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus, Users, TrendingUp, Briefcase, Bell, AlertTriangle,
  Calendar, ChevronRight, ArrowRightCircle, Plus, Calculator,
  Wallet, Euro, FileText, Clock, ShieldAlert, Award
} from 'lucide-react'
import { useLeads, LEAD_STATUSES } from '../hooks/useLeads'
import { useProjects, PROJECT_STATUSES } from '../hooks/useProjects'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'
import { useCeeDeals } from '../hooks/useCeeDeals'
import { formatCurrency } from '../utils/formatters'
import KpiCard from '../components/dashboard/KpiCard'
import PipelineChart from '../components/dashboard/PipelineChart'
import CompletionGauge from '../components/ui/CompletionGauge'

export default function DashboardPage() {
  const { leads, getLeadStatusCounts } = useLeads()
  const { projects, getStatusCounts } = useProjects()
  const { notifications, scanReminders } = useNotifications()
  const { userProfile } = useAuth()
  const { deals } = useCeeDeals()

  // Scan les rappels au montage
  useMemo(() => {
    scanReminders(leads, projects)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const leadCounts = getLeadStatusCounts()
  const projectCounts = getStatusCounts()

  // ─── KPIs de base ───
  const totalLeadsActifs = leads.filter((l) => l.status !== 'perdu' && l.status !== 'converti').length
  const leadsAContacter = leadCounts['a_contacter'] || 0
  const totalConverted = leadCounts['converti'] || 0
  const tauxConversion = leads.length > 0
    ? Math.round((totalConverted / leads.length) * 100)
    : 0
  const projetsActifs = projects.filter(
    (p) => p.status !== 'perdu' && p.status !== 'prime_versee'
  ).length

  // ─── Tendances 7 jours ───
  const trends = useMemo(() => {
    const now = Date.now()
    const d7 = 7 * 86400000
    const thisWeekLeads = leads.filter((l) => l.createdAt && (now - new Date(l.createdAt).getTime()) < d7).length
    const lastWeekLeads = leads.filter((l) => {
      if (!l.createdAt) return false
      const age = now - new Date(l.createdAt).getTime()
      return age >= d7 && age < d7 * 2
    }).length
    const leadTrend = lastWeekLeads > 0
      ? Math.round(((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100)
      : thisWeekLeads > 0 ? 100 : 0

    const thisWeekProjects = projects.filter((p) => p.createdAt && (now - new Date(p.createdAt).getTime()) < d7).length
    const lastWeekProjects = projects.filter((p) => {
      if (!p.createdAt) return false
      const age = now - new Date(p.createdAt).getTime()
      return age >= d7 && age < d7 * 2
    }).length
    const projectTrend = lastWeekProjects > 0
      ? Math.round(((thisWeekProjects - lastWeekProjects) / lastWeekProjects) * 100)
      : thisWeekProjects > 0 ? 100 : 0

    return { leadTrend, projectTrend }
  }, [leads, projects])

  // ─── Synthese financiere ───
  const financials = useMemo(() => {
    let totalCost = 0
    let totalAides = 0
    let totalCee = 0
    let totalMpr = 0
    let projectCount = 0

    projects.forEach((p) => {
      if (p.status === 'perdu') return
      const scenarios = p.scenarios || []
      scenarios.forEach((sc) => {
        (sc.simulations || []).forEach((sim) => {
          const r = sim.results || {}
          const inp = sim.inputs || {}
          const cost = r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
          const cee = r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0
          const mpr = r.mprFinal || r.mprAmount || r.primeAmount || 0
          if (cost > 0) {
            totalCost += cost
            totalCee += cee
            totalMpr += mpr
            totalAides += cee + mpr
            projectCount++
          }
        })
      })
    })

    const rac = Math.max(0, totalCost - totalAides)
    return { totalCost, totalAides, totalCee, totalMpr, rac, projectCount }
  }, [projects])

  // ─── Top projets par valeur ───
  const topProjects = useMemo(() => {
    const items = []
    projects.forEach((p) => {
      if (p.status === 'perdu' || p.status === 'prime_versee') return
      let maxCost = 0
      let totalAides = 0
      const scenarios = p.scenarios || []
      scenarios.forEach((sc) => {
        let scCost = 0
        let scAides = 0
        ;(sc.simulations || []).forEach((sim) => {
          const r = sim.results || {}
          const inp = sim.inputs || {}
          scCost += r.projectCost || r.totalCost || inp.projectCost || inp.projectCostTTC || 0
          scAides += (r.ceeCommerciale || r.ceeFinal || r.ceeEuros || 0) + (r.mprFinal || r.mprAmount || 0)
        })
        if (scCost > maxCost) {
          maxCost = scCost
          totalAides = scAides
        }
      })
      if (maxCost > 0) {
        const statusObj = PROJECT_STATUSES.find((s) => s.value === p.status)
        items.push({
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Sans nom',
          cost: maxCost,
          aides: totalAides,
          status: statusObj?.label || p.status,
          statusColor: statusObj?.color || 'bg-gray-100 text-gray-600',
          category: p.category || null,
        })
      }
    })
    return items.sort((a, b) => b.cost - a.cost).slice(0, 5)
  }, [projects])

  // ─── Alertes contrats CEE ───
  const dealAlerts = useMemo(() => {
    const now = new Date()
    const in30d = new Date(now.getTime() + 30 * 86400000)
    const alerts = []

    deals.forEach((d) => {
      if (!d.validTo) return
      const expDate = new Date(d.validTo)
      if (expDate < now) {
        alerts.push({ deal: d, type: 'expired', label: 'Expire', daysLeft: 0 })
      } else if (expDate <= in30d) {
        const daysLeft = Math.ceil((expDate - now) / 86400000)
        alerts.push({ deal: d, type: 'expiring', label: `${daysLeft}j restants`, daysLeft })
      }
    })
    return alerts.sort((a, b) => a.daysLeft - b.daysLeft)
  }, [deals])

  // ─── Taux de completion pipeline ───
  const completionRate = useMemo(() => {
    const completed = projects.filter((p) => p.status === 'travaux_termines' || p.status === 'prime_versee').length
    return projects.length > 0 ? Math.round((completed / projects.length) * 100) : 0
  }, [projects])

  // ─── Repartition par categorie MPR ───
  const categoryBreakdown = useMemo(() => {
    const cats = { Bleu: 0, Jaune: 0, Violet: 0, Rose: 0 }
    projects.forEach((p) => {
      if (p.category && cats[p.category] !== undefined) {
        cats[p.category]++
      }
    })
    return cats
  }, [projects])

  // ─── Rappels ───
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
  const upcomingReminders = [...overdueReminders, ...todayReminders].slice(0, 6)

  // ─── Activite recente ───
  const recentActivity = useMemo(() => {
    const items = []
    leads.slice(0, 5).forEach((l) => {
      items.push({
        type: 'lead',
        label: `Lead cree : ${l.firstName || l.phone || l.email || 'Sans nom'}`,
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
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
  }, [leads, projects])

  const leadActiveStatuses = LEAD_STATUSES.filter((s) => s.value !== 'perdu' && s.value !== 'converti')
  const projectActiveStatuses = PROJECT_STATUSES.filter((s) => s.value !== 'perdu')

  const MPR_COLORS = { Bleu: 'bg-blue-500', Jaune: 'bg-yellow-400', Violet: 'bg-purple-500', Rose: 'bg-pink-400' }
  const MPR_LABELS = { Bleu: 'Tres modestes', Jaune: 'Modestes', Violet: 'Intermediaires', Rose: 'Superieurs' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* ─── HEADER + QUICK ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
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
        <div className="flex items-center gap-2">
          <Link
            to="/leads/nouveau"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nouveau lead
          </Link>
          <Link
            to="/projets/nouveau"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau projet
          </Link>
          <Link
            to="/boite-a-outils"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-gray-700 text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition"
          >
            <Calculator className="w-3.5 h-3.5" />
            Simuler
          </Link>
        </div>
      </div>

      {/* ─── ALERTES CONTRATS CEE ─── */}
      {dealAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {dealAlerts.map((alert) => (
            <Link
              key={alert.deal.id}
              to="/parametres"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                alert.type === 'expired'
                  ? 'bg-red-50 border border-red-200 text-red-800 hover:bg-red-100'
                  : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 shrink-0 ${alert.type === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
              <span>
                Contrat CEE <strong>{alert.deal.obligeName || alert.deal.contractRef || 'Sans nom'}</strong>
                {alert.type === 'expired'
                  ? ' — Expire !'
                  : ` — Expire dans ${alert.daysLeft} jour${alert.daysLeft > 1 ? 's' : ''}`}
              </span>
              <span className="ml-auto text-xs opacity-70">
                {alert.deal.validTo && new Date(alert.deal.validTo).toLocaleDateString('fr-FR')}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={UserPlus}
          value={totalLeadsActifs}
          label="Leads actifs"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          trend={trends.leadTrend}
        />
        <KpiCard
          icon={AlertTriangle}
          value={leadsAContacter}
          label="Leads a contacter"
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
          trend={trends.projectTrend}
        />
      </div>

      {/* ─── SYNTHESE FINANCIERE ─── */}
      {financials.projectCount > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-indigo-300" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-300">Synthese financiere</h2>
            <span className="text-xs text-indigo-400 ml-auto">{financials.projectCount} simulation{financials.projectCount > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs text-indigo-300 mb-1">CA potentiel</p>
              <p className="text-lg font-black">{formatCurrency(financials.totalCost)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs text-emerald-300 mb-1">Total aides</p>
              <p className="text-lg font-black text-emerald-300">{formatCurrency(financials.totalAides)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs text-yellow-300 mb-1">Prime CEE</p>
              <p className="text-lg font-black text-yellow-300">{formatCurrency(financials.totalCee)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs text-blue-300 mb-1">MaPrimeRenov'</p>
              <p className="text-lg font-black text-blue-300">{formatCurrency(financials.totalMpr)}</p>
            </div>
          </div>

          {/* Barre de repartition */}
          {financials.totalCost > 0 && (
            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
                {financials.totalCee > 0 && (
                  <div
                    className="bg-yellow-400 transition-all duration-500"
                    style={{ width: `${(financials.totalCee / financials.totalCost) * 100}%` }}
                    title={`CEE : ${formatCurrency(financials.totalCee)}`}
                  />
                )}
                {financials.totalMpr > 0 && (
                  <div
                    className="bg-blue-400 transition-all duration-500"
                    style={{ width: `${(financials.totalMpr / financials.totalCost) * 100}%` }}
                    title={`MPR : ${formatCurrency(financials.totalMpr)}`}
                  />
                )}
                <div
                  className="bg-indigo-400 transition-all duration-500"
                  style={{ width: `${(financials.rac / financials.totalCost) * 100}%` }}
                  title={`RAC : ${formatCurrency(financials.rac)}`}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px]">
                {financials.totalCee > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    CEE {Math.round((financials.totalCee / financials.totalCost) * 100)}%
                  </span>
                )}
                {financials.totalMpr > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    MPR {Math.round((financials.totalMpr / financials.totalCost) * 100)}%
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  RAC {Math.round((financials.rac / financials.totalCost) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PIPELINE + COMPLETION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Completion + Categories */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-6">
          <div className="text-center">
            <CompletionGauge percent={completionRate} size="lg" variant="circle" label="Projets aboutis" />
          </div>

          {/* Categories MPR */}
          {Object.values(categoryBreakdown).some((v) => v > 0) && (
            <div className="w-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Profils revenus</p>
              <div className="space-y-1.5">
                {Object.entries(categoryBreakdown).map(([cat, count]) => {
                  if (count === 0) return null
                  const total = Object.values(categoryBreakdown).reduce((s, v) => s + v, 0)
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${MPR_COLORS[cat]} shrink-0`} />
                      <span className="text-xs text-gray-600 w-20 truncate">{cat}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${MPR_COLORS[cat]} transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── TOP PROJETS + RAPPELS + ACTIVITE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top projets */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Top projets
          </h2>
          {topProjects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun projet avec simulation</p>
          ) : (
            <div className="space-y-2">
              {topProjects.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/projets/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(p.cost)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.statusColor}`}>
                      {p.status}
                    </span>
                    {p.aides > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        {formatCurrency(p.aides)} aides
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

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
                      <p className={`font-medium truncate ${isOverdue ? 'text-red-800' : 'text-gray-800'}`}>{r.text}</p>
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

        {/* Activite recente */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <ArrowRightCircle className="w-4 h-4 text-indigo-500" />
            Activite recente
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune activite</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <Link
                  key={i}
                  to={item.to}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'lead' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                    <span className="text-gray-700 truncate">{item.label}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
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
