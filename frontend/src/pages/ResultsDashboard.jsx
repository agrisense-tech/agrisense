// ResultsDashboard.jsx — Phase 3
import { useState, useRef } from "react"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"
import WeatherPanel from "../components/WeatherPanel"
import MarketPanel  from "../components/MarketPanel"
import AlertPanel   from "../components/AlertPanel"

function Stat({ label, value, sub, accent }) {
  return (
    <div className="card p-4 fade-up" style={accent ? { background: "rgba(22,163,74,0.08)", borderColor: "rgba(74,222,128,0.25)" } : {}}>
      <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-green-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function ConfBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct > 75 ? "#4ade80" : pct > 50 ? "#eab308" : "#ef4444"
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
      <span className="text-sm font-mono font-bold" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function ResultsDashboard({ results, onBack }) {
  const r = results
  const [activeTab, setActiveTab] = useState("overview")
  const printRef = useRef()

  const tabs = [
    { id: "overview", label: "Overview",   icon: "📊" },
    { id: "weather",  label: "Weather",    icon: "🌤" },
    { id: "market",   label: "Market",     icon: "📈" },
    { id: "alerts",   label: "Alerts",     icon: "🔔" },
  ]

  const radarData = [
    { subject: "Nitrogen",   A: Math.min(100, ((r.inputs?.nitrogen   || 0) / 200) * 100) },
    { subject: "Phosphorus", A: Math.min(100, ((r.inputs?.phosphorus || 0) / 200) * 100) },
    { subject: "Potassium",  A: Math.min(100, ((r.inputs?.potassium  || 0) / 200) * 100) },
    { subject: "pH Balance", A: Math.min(100, (((r.inputs?.ph || 7) - 4) / 6) * 100) },
  ]

  function handlePrint() {
    window.print()
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 relative z-10" ref={printRef}>

      {/* Back + Export */}
      <div className="flex items-center justify-between mb-6 no-print fade-up">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/5">
          ← Analyze another field
        </button>
        <button onClick={handlePrint}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(74,222,128,0.15)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(74,222,128,0.08)"}>
          🖨 Export PDF
        </button>
      </div>

      {/* Hero Card */}
      <div className="card card-glow p-8 mb-5 text-center fade-up"
        style={{ background: "linear-gradient(135deg, rgba(22,101,52,0.25), rgba(5,15,8,0.9))", borderColor: "rgba(74,222,128,0.2)" }}>
        <p className="text-xs font-mono tracking-widest text-green-600 mb-3">
          TOP RECOMMENDATION · {r.region_name?.toUpperCase()}
        </p>
        <div className="text-7xl mb-4" style={{ filter: "drop-shadow(0 0 20px rgba(74,222,128,0.3))" }}>
          {r.emoji}
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-1">{r.recommended_crop}</h1>
        <p className="text-sm italic text-gray-500 mb-5">{r.scientific_name}</p>
        <div className="max-w-sm mx-auto">
          <p className="text-xs font-mono text-gray-500 mb-1">AI Confidence Score</p>
          <ConfBar score={r.confidence_score} />
        </div>
        {r.climate && (
          <p className="text-xs text-gray-600 mt-3 font-mono">
            {r.climate} Climate · {r.region_name}
          </p>
        )}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat accent label="Yield Estimate" value={`${r.yield_estimate_t_ha ?? "—"} t/ha`} sub="per hectare" />
        <Stat label="Profit Grade"   value={r.profit_score ?? "—"}      sub="economic viability" />
        <Stat label="Sowing Window"  value={r.sowing_window ?? "—"} />
        <Stat label="Water Needed"   value={r.water_requirement_mm ? `${r.water_requirement_mm} mm` : "—"} sub="per season" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 no-print p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition border ${activeTab === tab.id ? "tab-active" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Radar + Alternatives */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5 fade-up">
              <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">🧪 Soil Profile</h2>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(74,222,128,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                  <Radar dataKey="A" stroke="#4ade80" fill="#4ade80" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "#0a1a0f", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, fontSize: 11 }}
                    formatter={v => [`${Math.round(v)}%`, "Level"]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 fade-up fade-up-1">
              <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">🌱 Alternatives</h2>
              <div className="space-y-4">
                {(r.alternative_crops || []).map((alt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8">{alt.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-medium">{alt.crop}</span>
                        <span className="font-mono text-xs text-gray-500">{Math.round(alt.score * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${alt.score*100}%`, background: "linear-gradient(90deg, rgba(74,222,128,0.4), rgba(74,222,128,0.7))" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rotation */}
          {r.rotation_plan && (
            <div className="card p-5 fade-up">
              <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">🔄 3-Season Rotation Plan</h2>
              <div className="flex items-stretch gap-2">
                {r.rotation_plan.map((crop, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 rounded-xl p-4 text-center" style={{ background: i === 0 ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                      <p className="text-xs font-mono text-gray-500 mb-1">Season {i+1}</p>
                      <p className="text-sm font-semibold text-white">{crop}</p>
                    </div>
                    {i < r.rotation_plan.length - 1 && <span className="text-green-800 text-lg">→</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Alerts */}
          {r.risk_alerts?.length > 0 && (
            <div className="card p-5 fade-up" style={{ borderColor: "rgba(234,179,8,0.2)", background: "rgba(120,53,15,0.08)" }}>
              <h2 className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-3">⚠ Risk Alerts</h2>
              <div className="space-y-2">
                {r.risk_alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-yellow-200">
                    <span className="text-yellow-500 mt-0.5 flex-shrink-0">•</span>
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Analysis */}
          {r.image_analysis && (
            <div className="card p-5 fade-up">
              <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-3">🛰 Field Image Analysis</h2>
              <div className="flex items-start gap-5">
                <div className="text-center p-4 rounded-xl flex-shrink-0" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <p className="text-xs text-gray-500 mb-1">Land Type</p>
                  <p className="text-lg font-bold text-white capitalize">{r.image_analysis.land_type}</p>
                  <p className="text-xs text-green-500 font-mono mt-1">{Math.round(r.image_analysis.confidence*100)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300 mb-3">{r.image_analysis.description}</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(r.image_analysis.color_breakdown || {}).map(([k,v]) => (
                      <div key={k} className="text-xs font-mono" style={{ color: "#6b7280" }}>
                        <span className="text-gray-400">{v}%</span> {k.replace("_pct","")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Weather */}
      {activeTab === "weather" && (
        <WeatherPanel lat={r.inputs?.latitude} lon={r.inputs?.longitude} cropName={r.recommended_crop} />
      )}

      {/* Tab: Market */}
      {activeTab === "market" && (
        <MarketPanel cropName={r.recommended_crop} yieldTHa={r.yield_estimate_t_ha} />
      )}

      {/* Tab: Alerts */}
      {activeTab === "alerts" && (
        <AlertPanel results={r} />
      )}

      {/* Raw JSON */}
      <details className="mt-5 card overflow-hidden no-print">
        <summary className="px-5 py-3 cursor-pointer text-xs font-mono text-gray-600 hover:text-gray-400">
          {"</>"} Raw API Response
        </summary>
        <pre className="px-5 py-4 text-xs text-green-400 overflow-x-auto font-mono">
          {JSON.stringify(results, null, 2)}
        </pre>
      </details>
    </main>
  )
}
