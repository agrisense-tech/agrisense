// InputForm.jsx — Phase 3 redesign
import { useState } from "react"
import MapPicker from "../components/MapPicker"

function Label({ children, hint }) {
  return (
    <div className="mb-1">
      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">{children}</label>
      {hint && <p className="text-xs text-gray-600 mt-0.5">{hint}</p>}
    </div>
  )
}

function NumInput({ value, onChange, placeholder, min, max, step = "any", unit }) {
  return (
    <div className="relative">
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        className="input-field w-full px-3 py-2.5 text-sm pr-12" />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-600">{unit}</span>
      )}
    </div>
  )
}

function Section({ icon, title, subtitle, children, delay = "" }) {
  return (
    <div className={`card card-glow p-5 fade-up ${delay}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
]

export default function InputForm({ onSubmit, loading, error }) {
  const [lat,      setLat]      = useState("")
  const [lon,      setLon]      = useState("")
  const [n,        setN]        = useState("")
  const [p,        setP]        = useState("")
  const [k,        setK]        = useState("")
  const [ph,       setPh]       = useState("")
  const [water,    setWater]    = useState("")
  const [moisture, setMoisture] = useState("")
  const [image,    setImage]    = useState(null)
  const [name,     setName]     = useState("")
  const [email,    setEmail]    = useState("")
  const [phone,    setPhone]    = useState("")
  const [language, setLanguage] = useState("en")
  const [sendAlert,setSendAlert]= useState(false)

  const demos = [
    { label: "Tamil Nadu", lat: "13.0827", lon: "80.2707", n: 90, p: 55, k: 60, ph: 6.5, water: 3.5, moisture: 65 },
    { label: "Punjab",     lat: "30.9010", lon: "75.8573", n: 110, p: 45, k: 70, ph: 7.0, water: 5.0, moisture: 45 },
    { label: "West Bengal",lat: "23.6102", lon: "87.6800", n: 95, p: 70, k: 55, ph: 6.0, water: 2.0, moisture: 80 },
  ]

  function fillDemo(d) {
    setLat(d.lat); setLon(d.lon)
    setN(String(d.n)); setP(String(d.p)); setK(String(d.k)); setPh(String(d.ph))
    setWater(String(d.water)); setMoisture(String(d.moisture))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("latitude", lat); fd.append("longitude", lon)
    fd.append("nitrogen", n);   fd.append("phosphorus", p)
    fd.append("potassium", k);  fd.append("ph", ph)
    if (water)    fd.append("water_table_m", water)
    if (moisture) fd.append("soil_moisture_pct", moisture)
    if (image)    fd.append("image", image)
    if (name)     fd.append("farmer_name", name)
    if (email)    fd.append("farmer_email", email)
    if (phone)    fd.append("farmer_phone", phone)
    fd.append("language", language)
    fd.append("send_alert", sendAlert ? "true" : "false")
    onSubmit(fd)
  }

  const canSubmit = lat && lon && n && p && k && ph && !loading

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 relative z-10">

      {/* Hero */}
      <div className="text-center mb-10 fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono text-green-500 mb-4"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          AI-Powered Crop Intelligence
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ lineHeight: 1.15 }}>
          Find Your <span style={{ color: "#4ade80" }}>Best Crop</span>
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
          Enter your field's soil data and GPS location. Our ML model analyzes 10+ factors to recommend the optimal crop.
        </p>

        {/* Demo buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-gray-600">Try demo:</span>
          {demos.map(d => (
            <button key={d.label} onClick={() => fillDemo(d)}
              className="text-xs px-3 py-1.5 rounded-lg transition font-medium"
              style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", color: "#4ade80" }}
              onMouseEnter={e => e.target.style.background = "rgba(74,222,128,0.12)"}
              onMouseLeave={e => e.target.style.background = "rgba(74,222,128,0.06)"}
            >
              📍 {d.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Location */}
        <Section icon="📍" title="Field Location" subtitle="Click the map or enter coordinates manually" delay="fade-up-1">
          <MapPicker lat={parseFloat(lat) || null} lon={parseFloat(lon) || null}
            onChange={(la, lo) => { setLat(String(la)); setLon(String(lo)) }} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><Label>Latitude</Label><NumInput value={lat} onChange={setLat} placeholder="13.0827" min={-90} max={90} step="0.0001" unit="°N" /></div>
            <div><Label>Longitude</Label><NumInput value={lon} onChange={setLon} placeholder="80.2707" min={-180} max={180} step="0.0001" unit="°E" /></div>
          </div>
        </Section>

        {/* Soil */}
        <Section icon="🧪" title="Soil Nutrients" subtitle="From your soil test report" delay="fade-up-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label hint="Typical: 40–200">Nitrogen (N)</Label><NumInput value={n} onChange={setN} placeholder="80" min={0} max={500} unit="mg/kg" /></div>
            <div><Label hint="Typical: 20–100">Phosphorus (P)</Label><NumInput value={p} onChange={setP} placeholder="45" min={0} max={500} unit="mg/kg" /></div>
            <div><Label hint="Typical: 20–200">Potassium (K)</Label><NumInput value={k} onChange={setK} placeholder="60" min={0} max={500} unit="mg/kg" /></div>
            <div><Label hint="Neutral = 7.0">Soil pH</Label><NumInput value={ph} onChange={setPh} placeholder="6.5" min={0} max={14} step="0.1" unit="pH" /></div>
          </div>

          {/* pH visual indicator */}
          {ph && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Acidic</span><span>Neutral</span><span>Alkaline</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #ef4444, #eab308, #22c55e, #eab308, #ef4444)" }}>
                <div className="w-2 h-2 bg-white rounded-full shadow -mt-0 transition-all duration-500"
                  style={{ marginLeft: `calc(${Math.min(100, Math.max(0, (parseFloat(ph)/14)*100))}% - 4px)` }} />
              </div>
              <p className="text-xs text-center mt-1 font-mono text-gray-400">
                pH {ph} —{" "}
                {parseFloat(ph) < 5.5 ? "⚠ Very Acidic" :
                 parseFloat(ph) < 6.5 ? "Slightly Acidic" :
                 parseFloat(ph) < 7.5 ? "✓ Neutral (ideal)" :
                 parseFloat(ph) < 8.5 ? "Slightly Alkaline" : "⚠ Very Alkaline"}
              </p>
            </div>
          )}
        </Section>

        {/* Water */}
        <Section icon="💧" title="Water Conditions" subtitle="Optional — improves recommendation accuracy" delay="fade-up-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Water Table Depth</Label><NumInput value={water} onChange={setWater} placeholder="3.5" min={0} max={100} step="0.1" unit="m" /></div>
            <div><Label>Soil Moisture</Label><NumInput value={moisture} onChange={setMoisture} placeholder="65" min={0} max={100} unit="%" /></div>
          </div>
          {moisture && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(74,222,128,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, parseFloat(moisture)||0)}%`, background: "linear-gradient(90deg, #ca8a04, #0ea5e9)" }} />
              </div>
              <p className="text-xs font-mono text-gray-500 mt-1">{moisture}% moisture</p>
            </div>
          )}
        </Section>

        {/* Image */}
        <Section icon="🛰" title="Field Image" subtitle="Optional — detects terrain type (fertile/dry/rocky/wet)" delay="fade-up-4">
          <div onClick={() => document.getElementById("field-image").click()}
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition"
            style={{ borderColor: image ? "rgba(74,222,128,0.4)" : "rgba(74,222,128,0.15)", background: image ? "rgba(74,222,128,0.04)" : "transparent" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(74,222,128,0.35)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = image ? "rgba(74,222,128,0.4)" : "rgba(74,222,128,0.15)"}>
            {image ? (
              <div className="text-green-400">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-sm font-semibold">{image.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(image.size/1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <div className="text-3xl mb-2">📸</div>
                <p className="text-sm">Click to upload a field photo</p>
                <p className="text-xs mt-1">JPEG or PNG</p>
              </div>
            )}
          </div>
          <input id="field-image" type="file" accept="image/jpeg,image/png"
            className="hidden" onChange={e => setImage(e.target.files[0] || null)} />
        </Section>

        {/* Farmer + Alerts */}
        <Section icon="👤" title="Farmer Details & Alerts" subtitle="Optional — get your results via email or SMS">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <Label>Your Name</Label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
                className="input-field w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <Label>Email</Label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="input-field w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <Label>Phone (SMS)</Label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                className="input-field w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          {/* Language */}
          <div className="mb-3">
            <Label>Alert Language</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {LANGUAGES.map(l => (
                <button type="button" key={l.code} onClick={() => setLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    language === l.code ? "tab-active" : "border-gray-800 text-gray-400 hover:border-gray-600"
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Send alert toggle */}
          {(email || phone) && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg"
              style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
              <div onClick={() => setSendAlert(v => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative ${sendAlert ? "bg-green-600" : "bg-gray-700"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${sendAlert ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-gray-300">Send results via {[email && "email", phone && "SMS"].filter(Boolean).join(" & ")}</span>
            </label>
          )}
        </Section>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300 fade-up"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={!canSubmit}
          className="btn-primary w-full py-4 rounded-xl font-semibold text-white text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 fade-up">
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
              </svg>
              Analyzing your field...
            </>
          ) : (
            <>⚡ Analyze &amp; Get Recommendation</>
          )}
        </button>
      </form>
    </main>
  )
}
