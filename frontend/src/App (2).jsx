// src/App.jsx
// ---------------------------------------------------------
// Root component. Manages which page is shown and holds
// the global state (form data + API results).
// ---------------------------------------------------------

import { useState } from "react"
import InputForm from "./pages/InputForm"
import ResultsDashboard from "./pages/ResultsDashboard"
import Header from "./components/Header"

export default function App() {
  // "form" = showing the input page
  // "results" = showing the recommendation results
  const [view, setView] = useState("form")

  // The API response from /api/analyze
  const [results, setResults] = useState(null)

  // Loading state while waiting for API
  const [loading, setLoading] = useState(false)

  // Error message if something goes wrong
  const [error, setError] = useState(null)

  async function handleSubmit(formData) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,  // FormData (supports file upload)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || "Analysis failed")
      }

      const data = await response.json()
      setResults(data)
      setView("results")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />

      {view === "form" && (
        <InputForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      )}

      {view === "results" && results && (
        <ResultsDashboard
          results={results}
          onBack={() => setView("form")}
        />
      )}
    </div>
  )
}
