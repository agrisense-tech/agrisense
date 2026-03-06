// src/pages/ResultsDashboard.jsx
// ---------------------------------------------------------
// Displays the full crop recommendation result from the API.
// Shows: top crop, confidence, alternatives, rotation plan,
//        risk alerts, economic analysis, and soil summary.
// ---------------------------------------------------------

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"

// Small info card component
function InfoCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-xl p-4 border ${accent
      ? "bg-green-900/20 border-green-700/40"
      : "bg-gray-900/60 border-gray-800"}`}>
      <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-green-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// Confidence bar
function ConfBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct > 75 ? "bg-green-500" : pct > 50 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`}
             style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono font-bold text-white">{pct}%</span>
    </div>
  )
}

export default function ResultsDashboard({ results, onBack }) {
  const r = results

  // Build radar chart data from soil inputs
  const radarData = [
    { subject: "Nitrogen",    A: Math.min(100, (r.inputs?.nitrogen   / 200) * 100) },
    { subject: "Phosphorus",  A: Math.min(100, (r.inputs?.phosphorus / 200) * 100) },
    { subject: "Potassium",   A: Math.min(100, (r.inputs?.potassium  / 200) * 100) },
    { subject: "pH Balance",  A: Math.min(100, ((r.inputs?.ph - 4) / 6) * 100) },
  ]

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      {/* Back button */}
      <button onClick={onBack}
        className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition">
        ← Analyze another field
      </button>

      {/* TOP RECOMMENDATION ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-900/30 to-gray-900/60 border border-green-700/40
                      rounded-2xl p-6 mb-6 text-center">
        <p className="text-xs font-mono text-green-500 tracking-widest mb-2">
          TOP RECOMMENDATION · {r.region_name}
        </p>
        <div className="text-6xl mb-3">{r.emoji}</div>
        <h1 className="text-4xl font-bold text-white mb-1">{r.recommended_crop}</h1>
        <p className="text-gray-400 text-sm italic mb-4">{r.scientific_name}</p>

        <div className="max-w-xs mx-auto">
          <p className="text-xs text-gray-500 mb-2">AI Confidence Score</p>
          <ConfBar score={r.confidence_score} />
        </div>
      </div>

      {/* KEY METRICS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <InfoCard accent label="Yield Estimate"
          value={`${r.yield_estimate_t_ha ?? "—"} t/ha`}
          sub="per hectare" />
        <InfoCard label="Profit Score"
          value={r.profit_score ?? "—"} sub="economic viability" />
        <InfoCard label="Sowing Window"
          value={r.sowing_window ?? "—"} />
        <InfoCard label="Water Needed"
          value={r.water_requirement_mm ? `${r.water_requirement_mm} mm` : "—"}
          sub="per season" />
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">

        {/* SOIL RADAR CHART ────────────────────────────── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-green-400 mb-4">🧪 Soil Profile Radar</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <Radar name="Soil" dataKey="A" stroke="#4ade80" fill="#4ade80" fillOpacity={0.25} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                formatter={(v) => [`${Math.round(v)}%`, "Relative level"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ALTERNATIVE CROPS ───────────────────────────── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-green-400 mb-4">🌱 Alternative Crops</h2>
          <div className="space-y-3">
            {(r.alternative_crops || []).map((alt, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{alt.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{alt.crop}</span>
                    <span className="font-mono text-gray-400">
                      {Math.round(alt.score * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600/70 rounded-full"
                         style={{ width: `${alt.score * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ROTATION PLAN ──────────────────────────────────── */}
      {r.rotation_plan && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-green-400 mb-4">🔄 3-Season Rotation Plan</h2>
          <div className="flex items-center gap-2">
            {r.rotation_plan.map((crop, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">Season {i + 1}</p>
                  <p className="text-sm font-semibold text-white">{crop}</p>
                </div>
                {i < r.rotation_plan.length - 1 && (
                  <span className="text-green-700 text-lg">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Rotating crops prevents soil depletion and reduces pest buildup
          </p>
        </div>
      )}

      {/* RISK ALERTS ────────────────────────────────────── */}
      {r.risk_alerts && r.risk_alerts.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-orange-400 mb-3">⚠ Risk Alerts</h2>
          <ul className="space-y-2">
            {r.risk_alerts.map((alert, i) => (
              <li key={i} className="text-sm text-orange-200 flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span> {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* IMAGE ANALYSIS ─────────────────────────────────── */}
      {r.image_analysis && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-green-400 mb-3">🛰 Field Image Analysis</h2>
          <div className="flex items-start gap-4">
            <div className="bg-gray-800 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-xs text-gray-500 mb-1">Land Type</p>
              <p className="text-lg font-bold text-white capitalize">{r.image_analysis.land_type}</p>
              <p className="text-xs text-green-400">{Math.round(r.image_analysis.confidence * 100)}% conf.</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-2">{r.image_analysis.description}</p>
              <div className="flex gap-4 text-xs text-gray-500">
                {Object.entries(r.image_analysis.color_breakdown || {}).map(([k, v]) => (
                  <span key={k}>{k}: <strong className="text-gray-400">{v}%</strong></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAW JSON (for developers) ───────────────────────── */}
      <details className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <summary className="px-5 py-3 cursor-pointer text-xs font-mono text-gray-500 hover:text-gray-300">
          {"</>"} View raw API response (JSON)
        </summary>
        <pre className="px-5 py-4 text-xs text-green-300 overflow-x-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </details>

    </main>
  )
}
