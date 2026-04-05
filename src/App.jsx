import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import NewsPage from './pages/NewsPage'
import BarTh171Page from './pages/simulators/BarTh171Page'
import BarEn101Page from './pages/simulators/BarEn101Page'
import BarEn102Page from './pages/simulators/BarEn102Page'
import BarEn103Page from './pages/simulators/BarEn103Page'
import BarTh112Page from './pages/simulators/BarTh112Page'
import BarTh113Page from './pages/simulators/BarTh113Page'
import BarTh174Page from './pages/simulators/BarTh174Page'
import BarTh175Page from './pages/simulators/BarTh175Page'
import SettingsPage from './pages/SettingsPage'
import ToolboxPage from './pages/ToolboxPage'
import ClientsPage from './pages/ClientsPage'
import ClientFormPage from './pages/ClientFormPage'
import ClientDetailPage from './pages/ClientDetailPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import DpeProspectionPage from './pages/DpeProspectionPage'
import MaPrimeAdaptPage from './pages/MaPrimeAdaptPage'
import LeadsPage from './pages/LeadsPage'
import LeadFormPage from './pages/LeadFormPage'
import LeadDetailPage from './pages/LeadDetailPage'
import SimulationsPage from './pages/SimulationsPage'
import PtzPage from './pages/simulators/PtzPage'
import LocAvantagePage from './pages/simulators/LocAvantagePage'
import LoginPage from './pages/LoginPage'
import ProfilPage from './pages/ProfilPage'
import AdminPage from './pages/AdminPage'
import TeamPage from './pages/installer/TeamPage'
import CeeDealsPage from './pages/installer/CeeDealsPage'
import TicketsPage from './pages/tickets/TicketsPage'
import TicketDetailPage from './pages/tickets/TicketDetailPage'
import NewTicketPage from './pages/tickets/NewTicketPage'
import AdminTicketsPage from './pages/admin/AdminTicketsPage'
import RgeProspectionPage from './pages/RgeProspectionPage'
import MinisitePage from './pages/public/MinisitePage'
import PublicSimulatorPage from './pages/public/PublicSimulatorPage'
import BeneficiaryDashboard from './pages/beneficiary/BeneficiaryDashboard'
import SharedScenarioPage from './pages/beneficiary/SharedScenarioPage'
import DocumentRequestsPage from './pages/beneficiary/DocumentRequestsPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ProCtaPopup from './components/ui/ProCtaPopup'
import ProCtaBanner from './components/ui/ProCtaBanner'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'
import AccountDisabledPage from './pages/auth/AccountDisabledPage'
import AccessDeniedPage from './pages/auth/AccessDeniedPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          {/* Auth status pages (pas de ProtectedRoute) */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/changer-mot-de-passe" element={<ChangePasswordPage />} />
          <Route path="/en-attente" element={<PendingApprovalPage />} />
          <Route path="/compte-desactive" element={<AccountDisabledPage />} />
          <Route path="/acces-refuse" element={<AccessDeniedPage />} />

          {/* Dashboard */}
          <Route path="/" element={<ProtectedRoute requiredPermission="access_simulations"><DashboardPage /></ProtectedRoute>} />

          {/* Simulateurs (accès public — vitrine) */}
          <Route path="/simulateur/bar-th-171" element={<BarTh171Page />} />
          <Route path="/simulateur/bar-en-101" element={<BarEn101Page />} />
          <Route path="/simulateur/bar-en-102" element={<BarEn102Page />} />
          <Route path="/simulateur/bar-en-103" element={<BarEn103Page />} />
          <Route path="/simulateur/bar-th-112" element={<BarTh112Page />} />
          <Route path="/simulateur/bar-th-113" element={<BarTh113Page />} />
          <Route path="/simulateur/bar-th-174" element={<BarTh174Page />} />
          <Route path="/simulateur/bar-th-175" element={<BarTh175Page />} />
          <Route path="/maprimeadapt" element={<MaPrimeAdaptPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/simulations/ptz" element={<PtzPage />} />
          <Route path="/simulateur/loc-avantage" element={<LocAvantagePage />} />

          {/* Outils (boîte à outils + actualités = public, le reste = protégé) */}
          <Route path="/historique" element={<ProtectedRoute requiredPermission="access_simulations"><HistoryPage /></ProtectedRoute>} />
          <Route path="/actualites" element={<NewsPage />} />
          <Route path="/parametrage" element={<ProtectedRoute requiredPermission="access_simulations"><SettingsPage /></ProtectedRoute>} />
          <Route path="/boite-a-outils" element={<ToolboxPage />} />
          <Route path="/prospection-dpe" element={<ProtectedRoute requiredPermission="access_simulations"><DpeProspectionPage /></ProtectedRoute>} />

          {/* Projets */}
          <Route path="/projets" element={<ProtectedRoute requiredPermission="access_projects"><ClientsPage /></ProtectedRoute>} />
          <Route path="/projets/nouveau" element={<ProtectedRoute requiredPermission="access_projects"><ClientFormPage /></ProtectedRoute>} />
          <Route path="/projets/:id" element={<ProtectedRoute requiredPermission="access_projects"><ClientDetailPage /></ProtectedRoute>} />
          <Route path="/projets/:id/modifier" element={<ProtectedRoute requiredPermission="access_projects"><ClientFormPage /></ProtectedRoute>} />
          <Route path="/projets/:id/scenario/:sid" element={<ProtectedRoute requiredPermission="access_projects"><ScenarioDetailPage /></ProtectedRoute>} />

          {/* Redirections /clients → /projets */}
          <Route path="/clients" element={<Navigate to="/projets" replace />} />
          <Route path="/clients/nouveau" element={<Navigate to="/projets/nouveau" replace />} />
          <Route path="/clients/:id" element={<ProtectedRoute requiredPermission="access_projects"><ClientDetailPage /></ProtectedRoute>} />
          <Route path="/clients/:id/modifier" element={<ProtectedRoute requiredPermission="access_projects"><ClientFormPage /></ProtectedRoute>} />

          {/* Leads */}
          <Route path="/leads" element={<ProtectedRoute requiredPermission="access_leads"><LeadsPage /></ProtectedRoute>} />
          <Route path="/leads/nouveau" element={<ProtectedRoute requiredPermission="access_leads"><LeadFormPage /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute requiredPermission="access_leads"><LeadDetailPage /></ProtectedRoute>} />
          <Route path="/leads/:id/modifier" element={<ProtectedRoute requiredPermission="access_leads"><LeadFormPage /></ProtectedRoute>} />

          {/* Equipe (installer admin) */}
          <Route path="/equipe" element={<ProtectedRoute requiredPermission="manage_org_members"><TeamPage /></ProtectedRoute>} />

          {/* Deals CEE (installer admin) */}
          <Route path="/deals-cee" element={<ProtectedRoute requiredPermission="manage_cee_deals"><CeeDealsPage /></ProtectedRoute>} />

          {/* Tickets */}
          <Route path="/tickets" element={<ProtectedRoute requiredPermission="create_tickets"><TicketsPage /></ProtectedRoute>} />
          <Route path="/tickets/nouveau" element={<ProtectedRoute requiredPermission="create_tickets"><NewTicketPage /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<ProtectedRoute requiredPermission="create_tickets"><TicketDetailPage /></ProtectedRoute>} />

          {/* Admin tickets (super admin) */}
          <Route path="/admin/tickets" element={<ProtectedRoute requiredPermission="manage_tickets"><AdminTicketsPage /></ProtectedRoute>} />

          {/* Espace beneficiaire */}
          <Route path="/beneficiaire" element={<ProtectedRoute requiredPermission="access_beneficiary_view"><BeneficiaryDashboard /></ProtectedRoute>} />
          <Route path="/beneficiaire/documents" element={<ProtectedRoute requiredPermission="access_beneficiary_view"><DocumentRequestsPage /></ProtectedRoute>} />

          {/* Pages publiques (pas de ProtectedRoute) */}
          <Route path="/s/:token" element={<SharedScenarioPage />} />
          <Route path="/p/:slug" element={<MinisitePage />} />
          <Route path="/estimation" element={<PublicSimulatorPage />} />

          {/* Demandes de documents (installateurs) */}
          <Route path="/documents" element={<ProtectedRoute requiredPermission="access_projects"><DocumentRequestsPage /></ProtectedRoute>} />

          {/* Profil (tout utilisateur connecte) */}
          <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />

          {/* Prospection RGE (super admin) */}
          <Route path="/admin/prospection-rge" element={<ProtectedRoute requiredPermission="access_admin_panel"><RgeProspectionPage /></ProtectedRoute>} />

          {/* Admin (super admin only) */}
          <Route path="/admin" element={<ProtectedRoute requiredPermission="access_admin_panel"><AdminPage /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
      <ProCtaBanner />
      <ProCtaPopup />
    </div>
  )
}
