// src/components/MarketPanel.jsx
// Shows crop market price, demand trend, and profit calculator
import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const gradeColor = { A: "text-green-400", B: "text-yellow-400", C: "text-orange-400", D: "text-red-400" }
const trendColor = (t) => t?.startsWith("↑") ? "text-green-400" : t?.startsWith("↓") ? "text-red-400" : "text-gray-400"

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
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-yellow-400 mb-4">📊 Market & Profit</h2>
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  )

  const { market, profit } = data

  // Build chart data from price history
  const chartData = (market.price_history || []).map((price, i) => ({
    month: ["5mo ago","4mo ago","3mo ago","2mo ago","Last mo"][i] || `M${i}`,
    price,
  }))

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-yellow-400 mb-4">
        📊 Market & Profit — {cropName}
      </h2>

      {/* Price + trend */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Price / Tonne</p>
          <p className="text-lg font-bold text-white">${market.price_usd_per_tonne}</p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Trend</p>
          <p className={`text-sm font-bold ${trendColor(market.trend_label)}`}>
            {market.trend_label}
          </p>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Demand</p>
          <p className="text-xs font-bold text-white">{market.demand_label}</p>
        </div>
      </div>

      {/* Price history chart */}
      {chartData.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-mono">PRICE TREND (USD/tonne)</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill:"#6b7280", fontSize:9 }} axisLine={false} tickLine={false}/>
              <YAxis hide domain={["auto","auto"]}/>
              <Tooltip
                contentStyle={{ background:"#111827", border:"1px solid #374151", borderRadius:6, fontSize:11 }}
                formatter={(v) => [`$${v}`, "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke="#eab308" fill="url(#priceGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Profit calculator */}
      <div className="bg-gray-800/40 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 font-mono">PROFIT CALCULATOR</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Area (ha):</label>
            <input
              type="number" value={area} min={0.1} max={1000} step={0.1}
              onChange={e => setArea(parseFloat(e.target.value) || 1)}
              className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-0.5
                         text-white text-xs focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Gross Revenue</span>
            <span className="text-white font-mono">${profit.gross_revenue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Cost</span>
            <span className="text-red-400 font-mono">-${profit.total_cost}</span>
          </div>
          <div className="flex justify-between col-span-2 border-t border-gray-700 pt-2 mt-1">
            <span className="text-gray-300 font-medium">Net Profit</span>
            <span className={`font-bold font-mono ${profit.net_profit > 0 ? "text-green-400" : "text-red-400"}`}>
              ${profit.net_profit}
            </span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-gray-500">ROI</span>
            <span className="text-yellow-400 font-mono">{profit.roi_pct}%</span>
          </div>
        </div>

        {/* Grade badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Profit Grade:</span>
          <span className={`text-xl font-black ${gradeColor[profit.profit_grade] || "text-gray-400"}`}>
            {profit.profit_grade}
          </span>
          <span className="text-xs text-gray-600">
            {profit.profit_grade === "A" ? "Excellent ROI" :
             profit.profit_grade === "B" ? "Good ROI" :
             profit.profit_grade === "C" ? "Moderate ROI" : "Low ROI"}
          </span>
        </div>
      </div>

      {/* Market notes */}
      <p className="text-xs text-gray-500 leading-relaxed">
        💡 {market.notes}
      </p>
      <p className="text-xs text-gray-600 mt-1">Updated: {market.last_updated}</p>
    </div>
  )
}
