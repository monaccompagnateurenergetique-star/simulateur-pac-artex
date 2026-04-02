import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
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

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          {/* Simulateurs */}
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
          {/* Outils */}
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/actualites" element={<NewsPage />} />
          <Route path="/parametrage" element={<SettingsPage />} />
          <Route path="/boite-a-outils" element={<ToolboxPage />} />
          <Route path="/prospection-dpe" element={<DpeProspectionPage />} />
          {/* Projets (ex-clients) */}
          <Route path="/projets" element={<ClientsPage />} />
          <Route path="/projets/nouveau" element={<ClientFormPage />} />
          <Route path="/projets/:id" element={<ClientDetailPage />} />
          <Route path="/projets/:id/modifier" element={<ClientFormPage />} />
          <Route path="/projets/:id/scenario/:sid" element={<ScenarioDetailPage />} />
          {/* Redirections /clients → /projets */}
          <Route path="/clients" element={<Navigate to="/projets" replace />} />
          <Route path="/clients/nouveau" element={<Navigate to="/projets/nouveau" replace />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/clients/:id/modifier" element={<ClientFormPage />} />
          {/* Leads */}
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/nouveau" element={<LeadFormPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/modifier" element={<LeadFormPage />} />
          {/* Auth & Profil */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
