// App.jsx — Phase 3
import { useState } from "react"
import InputForm from "./pages/InputForm"
import ResultsDashboard from "./pages/ResultsDashboard"
import HistoryDashboard from "./pages/HistoryDashboard"
import Header from "./components/Header"

export default function App() {
  const [view,    setView]    = useState("form")
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(formData) {
    setLoading(true)
    setError(null)
    try {
      const API = import.meta.env.VITE_API_URL || "https://agrisense-p0x7.onrender.com"
      const response = await fetch(`${API}/api/analyze`, { method: "POST", body: formData })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || "Analysis failed")
      }
      const data = await response.json()
      // Carry farmer info from form into results for AlertPanel
      data.farmer_name  = formData.get("farmer_name")  || ""
      data.farmer_email = formData.get("farmer_email") || ""
      data.farmer_phone = formData.get("farmer_phone") || ""
      data.language     = formData.get("language")     || "en"
      setResults(data)
      setView("results")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ position: "relative" }}>
      {loading && <div className="scan-line" />}

      <Header currentView={view === "results" ? "form" : view} onNavigate={v => {
        setView(v)
        if (v === "form") { setError(null) }
      }} />

      {view === "form" && (
        <InputForm onSubmit={handleSubmit} loading={loading} error={error} />
      )}
      {view === "results" && results && (
        <ResultsDashboard results={results} onBack={() => setView("form")} />
      )}
      {view === "history" && (
        <HistoryDashboard />
      )}
    </div>
  )
}
