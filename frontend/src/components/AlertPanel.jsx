// AlertPanel.jsx — Send email/SMS alerts with language selection
import { useState } from "react"

const LANGUAGES = [
  { code: "en", label: "English",          flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी",            flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",             flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",            flag: "🇮🇳" },
]

export default function AlertPanel({ results }) {
  const r = results
  const [name,     setName]     = useState(r.farmer_name || "")
  const [email,    setEmail]    = useState(r.farmer_email || "")
  const [phone,    setPhone]    = useState(r.farmer_phone || "")
  const [language, setLanguage] = useState(r.language || "en")
  const [subscribe,setSubscribe]= useState(false)
  const [status,   setStatus]   = useState(null)   // null | "sending" | "success" | "error"
  const [message,  setMessage]  = useState("")

  async function handleSend() {
    if (!email && !phone) return
    setStatus("sending")

    const fd = new FormData()
    fd.append("farmer_name",   name || "Farmer")
    fd.append("email",         email)
    fd.append("phone",         phone)
    fd.append("crop",          r.recommended_crop)
    fd.append("emoji",         r.emoji)
    fd.append("confidence",    r.confidence_score)
    fd.append("yield_t_ha",    r.yield_estimate_t_ha || 0)
    fd.append("sowing_window", r.sowing_window || "")
    fd.append("risk_alerts",   JSON.stringify(r.risk_alerts || []))
    fd.append("language",      language)
    fd.append("subscribe",     subscribe)

    try {
      const resp = await fetch("/api/alerts/send", { method: "POST", body: fd })
      const data = await resp.json()
      if (resp.ok) {
        setStatus("success")
        setMessage(data.message || "Alert sent!")
      } else {
        setStatus("error")
        setMessage(data.detail || "Failed to send")
      }
    } catch (e) {
      setStatus("error")
      setMessage("Network error")
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview card */}
      <div className="card p-5 fade-up" style={{ borderColor: "rgba(74,222,128,0.2)", background: "rgba(22,101,52,0.08)" }}>
        <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">📨 Alert Preview</h2>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{r.emoji}</div>
          <div>
            <p className="text-lg font-bold text-white">{r.recommended_crop}</p>
            <p className="text-sm text-gray-400">Confidence: {Math.round(r.confidence_score * 100)}%</p>
            <p className="text-sm text-gray-400">Sow: {r.sowing_window}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card p-5 fade-up fade-up-1">
        <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">🔔 Send Alert</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
              className="input-field w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="input-field w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number (SMS)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
              className="input-field w-full px-3 py-2.5 text-sm" />
          </div>
        </div>

        {/* Language */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Alert Language</label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(l => (
              <button type="button" key={l.code} onClick={() => setLanguage(l.code)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition border ${language === l.code ? "tab-active" : "border-gray-800 text-gray-400 hover:border-gray-600"}`}>
                <span>{l.flag}</span>
                <span className="font-medium">{l.label}</span>
                {language === l.code && <span className="ml-auto text-green-500">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Subscribe toggle */}
        <label className="flex items-center gap-3 cursor-pointer mb-5 p-3 rounded-lg"
          style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
          <div onClick={() => setSubscribe(v => !v)}
            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${subscribe ? "bg-green-600" : "bg-gray-700"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${subscribe ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <div>
            <p className="text-sm text-white">Subscribe to future alerts</p>
            <p className="text-xs text-gray-500">Get weather & pest warnings for {r.recommended_crop}</p>
          </div>
        </label>

        {/* Status */}
        {status === "success" && (
          <div className="mb-4 p-3 rounded-lg text-sm text-green-300 fade-up"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            ✅ {message}
            <p className="text-xs text-gray-500 mt-1">
              {!window.SMTP_CONFIGURED && "(Dev mode: alert logged to server console — add SMTP_HOST to .env for real emails)"}
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="mb-4 p-3 rounded-lg text-sm text-red-300 fade-up"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            ⚠ {message}
          </div>
        )}

        <button onClick={handleSend} disabled={(!email && !phone) || status === "sending"}
          className="btn-primary w-full py-3 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {status === "sending" ? (
            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>Sending...</>
          ) : (
            <>📨 Send Recommendation Alert</>
          )}
        </button>
        {!email && !phone && (
          <p className="text-xs text-center text-gray-600 mt-2">Enter an email or phone number to send</p>
        )}
      </div>

      {/* Info box */}
      <div className="card p-4 fade-up fade-up-2">
        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">ℹ️ How Alerts Work</h3>
        <div className="space-y-1.5 text-xs text-gray-500">
          <p>• <span className="text-gray-400">Email:</span> Full HTML report with crop details, risks & sowing calendar</p>
          <p>• <span className="text-gray-400">SMS:</span> Concise 1-line summary with crop & sowing window</p>
          <p>• <span className="text-gray-400">Languages:</span> English, Hindi, Tamil, Telugu supported</p>
          <p>• <span className="text-gray-400">Config:</span> Add SMTP_HOST + TWILIO credentials to backend/.env for live delivery</p>
        </div>
      </div>
    </div>
  )
}
