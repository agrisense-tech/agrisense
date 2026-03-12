import { useState, useEffect } from "react"
import InputForm from "./pages/InputForm"
import ResultsDashboard from "./pages/ResultsDashboard"
import HistoryDashboard from "./pages/HistoryDashboard"
import LoginPage from "./pages/LoginPage"
import Header from "./components/Header"

const API = import.meta.env.VITE_API_URL || "https://agrisense-p0x7.onrender.com"

export default function App() {
  const [view, setView]       = useState("form")
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)

  useEffect(() => {
    const t = localStorage.getItem("agrisense_token")
    const u = localStorage.getItem("agrisense_user")
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
  }, [])

  function handleLogin(u, t) { setUser(u); setToken(t) }

  function handleLogout() {
    localStorage.removeItem("agrisense_token")
    localStorage.removeItem("agrisense_user")
    setUser(null); setToken(null); setView("form"); setResults(null)
  }

  async function handleSubmit(formData) {
    setLoading(true); setError(null)
    try {
      const headers = token ? { "Authorization": "Bearer "+token } : {}
      const response = await fetch(API+"/api/analyze", { method: "POST", headers, body: formData })
      if (!response.ok) { const err = await response.json(); throw new Error(err.detail || "Analysis failed") }
      const data = await response.json()
      data.farmer_name  = formData.get("farmer_name")  || user?.name  || ""
      data.farmer_email = formData.get("farmer_email") || user?.email || ""
      data.farmer_phone = formData.get("farmer_phone") || user?.phone || ""
      data.language     = formData.get("language")     || "en"
      setResults(data); setView("results")
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (!user) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="min-h-screen" style={{ position:"relative" }}>
      {loading && <div className="scan-line" />}
      <Header currentView={view === "results" ? "form" : view} onNavigate={v => { setView(v); if (v==="form") setError(null) }}
        user={user} onLogout={handleLogout} />
      {view === "form" && <InputForm onSubmit={handleSubmit} loading={loading} error={error} user={user} />}
      {view === "results" && results && <ResultsDashboard results={results} onBack={() => setView("form")} />}
      {view === "history" && <HistoryDashboard token={token} />}
    </div>
  )
}
