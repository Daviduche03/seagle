import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { Toaster } from "@/components/ui/sonner"
import { OverviewPage } from "@/pages/OverviewPage"
import { InProgressPage } from "@/pages/InProgressPage"
import { FarmsFieldsPage } from "@/pages/FarmsFieldsPage"
import { FieldDetailPage } from "@/pages/FieldDetailPage"
import { MonitoringPage } from "@/pages/MonitoringPage"
import { DroneIntelligencePage } from "@/pages/DroneIntelligencePage"

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/farms" element={<FarmsFieldsPage />} />
          <Route path="/drone" element={<DroneIntelligencePage />} />
          <Route path="/fields/:fieldId" element={<FieldDetailPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="*" element={<InProgressPage />} />
        </Routes>
      </AppShell>
      <Toaster />
    </BrowserRouter>
  )
}
