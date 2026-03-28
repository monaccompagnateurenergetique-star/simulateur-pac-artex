import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import NewsPage from './pages/NewsPage'
import BarTh171Page from './pages/simulators/BarTh171Page'
import BarEn101Page from './pages/simulators/BarEn101Page'
import BarEn102Page from './pages/simulators/BarEn102Page'
import BarEn103Page from './pages/simulators/BarEn103Page'
import BarTh113Page from './pages/simulators/BarTh113Page'
import BarTh174Page from './pages/simulators/BarTh174Page'
import BarTh175Page from './pages/simulators/BarTh175Page'
import SettingsPage from './pages/SettingsPage'
import ToolboxPage from './pages/ToolboxPage'
import ClientsPage from './pages/ClientsPage'
import ClientFormPage from './pages/ClientFormPage'
import ClientDetailPage from './pages/ClientDetailPage'
import DpeProspectionPage from './pages/DpeProspectionPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/simulateur/bar-th-171" element={<BarTh171Page />} />
          <Route path="/simulateur/bar-en-101" element={<BarEn101Page />} />
          <Route path="/simulateur/bar-en-102" element={<BarEn102Page />} />
          <Route path="/simulateur/bar-en-103" element={<BarEn103Page />} />
          <Route path="/simulateur/bar-th-113" element={<BarTh113Page />} />
          <Route path="/simulateur/bar-th-174" element={<BarTh174Page />} />
          <Route path="/simulateur/bar-th-175" element={<BarTh175Page />} />
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/actualites" element={<NewsPage />} />
          <Route path="/parametrage" element={<SettingsPage />} />
          <Route path="/boite-a-outils" element={<ToolboxPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/nouveau" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/clients/:id/modifier" element={<ClientFormPage />} />
          <Route path="/prospection-dpe" element={<DpeProspectionPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
