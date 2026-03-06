// MarketPanel.jsx — Phase 3 redesign
import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const gradeColor = { A: "#4ade80", B: "#eab308", C: "#f97316", D: "#ef4444" }
const trendColor = t => t?.startsWith("↑") ? "#4ade80" : t?.startsWith("↓") ? "#ef4444" : "#9ca3af"

export default function MarketPanel({ cropName, yieldTHa }) {
  const [data,    setData]    = useState(null)
  const [area,    setArea]    = useState(1.0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cropName) return
    setLoading(true)
    fetch(`/api/market/${cropName}?area_hectares=${area}&yield_t_ha=${yieldTHa || ""}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cropName, area, yieldTHa])

  if (!cropName || loading || !data) return (
    <div className="card p-5">
      <h2 className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-4">📊 Market & Profit</h2>
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-800 rounded" style={{ width: `${50+i*15}%` }} />)}
      </div>
    </div>
  )

  const { market, profit } = data
  const chartData = (market.price_history || []).map((price, i) => ({
    month: ["5mo","4mo","3mo","2mo","Last"][i] || `M${i}`, price
  }))

  return (
    <div className="space-y-4">
      <div className="card p-5 fade-up">
        <h2 className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-4">
          📊 Market — {cropName}
        </h2>

        {/* Price stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Price/Tonne", val: `$${market.price_usd_per_tonne}`, sub: "USD" },
            { label: "Trend",       val: market.trend_label,               color: trendColor(market.trend_label) },
            { label: "Demand",      val: market.demand_label },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-sm font-bold" style={{ color: s.color || "#fff" }}>{s.val}</p>
              {s.sub && <p className="text-xs text-gray-600">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-mono text-gray-600 mb-2">PRICE HISTORY (USD/tonne)</p>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#eab308" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill:"#6b7280", fontSize:9, fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false}/>
                <YAxis hide domain={["auto","auto"]}/>
                <Tooltip contentStyle={{ background:"#0a1a0f", border:"1px solid rgba(74,222,128,0.15)", borderRadius:8, fontSize:11 }}
                  formatter={v => [`$${v}`, "Price"]} />
                <Area type="monotone" dataKey="price" stroke="#eab308" fill="url(#priceGrad)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Profit calculator */}
        <div className="p-4 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Profit Calculator</p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Area:</label>
              <input type="number" value={area} min={0.1} max={1000} step={0.1}
                onChange={e => setArea(parseFloat(e.target.value)||1)}
                className="w-16 input-field px-2 py-1 text-xs text-center" />
              <span className="text-xs text-gray-500">ha</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Gross Revenue</span>
              <span className="font-mono text-white">${profit.gross_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Cost</span>
              <span className="font-mono text-red-400">-${profit.total_cost.toLocaleString()}</span>
            </div>
            <div className="h-px bg-white/5 my-1" />
            <div className="flex justify-between font-semibold">
              <span className="text-gray-300">Net Profit</span>
              <span className="font-mono" style={{ color: profit.net_profit > 0 ? "#4ade80" : "#ef4444" }}>
                ${profit.net_profit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">ROI</span>
              <span className="font-mono text-yellow-400">{profit.roi_pct}%</span>
            </div>
          </div>

          {/* Grade */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
            <span className="text-xs text-gray-500">Grade:</span>
            <span className="text-3xl font-black" style={{ color: gradeColor[profit.profit_grade] || "#9ca3af" }}>
              {profit.profit_grade}
            </span>
            <span className="text-xs text-gray-500">
              {profit.profit_grade === "A" ? "Excellent ROI" : profit.profit_grade === "B" ? "Good ROI" : profit.profit_grade === "C" ? "Moderate ROI" : "Low ROI"}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600">💡 {market.notes}</p>
      </div>
    </div>
  )
}
