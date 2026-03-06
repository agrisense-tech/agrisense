// HistoryDashboard.jsx — Farmer yield history
import { useState, useEffect } from "react"

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card p-4 fade-up">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-mono uppercase tracking-widest text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className="text-sm" style={{ color: s <= (rating||0) ? "#eab308" : "#374151" }}>★</span>
      ))}
    </div>
  )
}

function ReportForm({ onSubmit, loading, crops }) {
  const [crop,    setCrop]    = useState("")
  const [farmer,  setFarmer]  = useState("")
  const [lat,     setLat]     = useState("")
  const [lon,     setLon]     = useState("")
  const [season,  setSeason]  = useState("")
  const [yield_,  setYield]   = useState("")
  const [profit,  setProfit]  = useState("")
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [notes,   setNotes]   = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("crop_name",     crop)
    fd.append("farmer_name",   farmer)
    fd.append("latitude",      lat || "0")
    fd.append("longitude",     lon || "0")
    fd.append("season",        season)
    fd.append("actual_yield",  yield_)
    if (profit)  fd.append("profit_actual", profit)
    if (rating)  fd.append("rating",        rating)
    if (notes)   fd.append("notes",         notes)
    onSubmit(fd)
    setCrop(""); setFarmer(""); setSeason(""); setYield(""); setProfit(""); setRating(0); setNotes("")
  }

  const inp = "input-field w-full px-3 py-2.5 text-sm"
  const lbl = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1"

  return (
    <form onSubmit={handleSubmit} className="card p-5 fade-up">
      <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">➕ Report Yield</h2>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={lbl}>Crop</label>
          <select value={crop} onChange={e => setCrop(e.target.value)} required className={`${inp} bg-gray-900`}>
            <option value="">Select crop</option>
            {(crops||[]).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Farmer Name</label>
          <input value={farmer} onChange={e => setFarmer(e.target.value)} placeholder="Your name" required className={inp} />
        </div>
        <div>
          <label className={lbl}>Season</label>
          <input value={season} onChange={e => setSeason(e.target.value)} placeholder="Kharif 2024" required className={inp} />
        </div>
        <div>
          <label className={lbl}>Actual Yield (t/ha)</label>
          <input type="number" value={yield_} onChange={e => setYield(e.target.value)} placeholder="3.5" step="0.1" required className={inp} />
        </div>
        <div>
          <label className={lbl}>Profit (USD, optional)</label>
          <input type="number" value={profit} onChange={e => setProfit(e.target.value)} placeholder="420" className={inp} />
        </div>
        <div>
          <label className={lbl}>Rating</label>
          <div className="flex items-center gap-1 h-10">
            {[1,2,3,4,5].map(s => (
              <button type="button" key={s}
                onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
                className="text-2xl star transition-transform">
                <span style={{ color: s <= (hover||rating) ? "#eab308" : "#374151" }}>★</span>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did the season go?"
            rows={2} className={`${inp} resize-none`} />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-40">
        {loading ? "Saving..." : "✓ Submit Yield Report"}
      </button>
    </form>
  )
}

export default function HistoryDashboard() {
  const [history, setHistory] = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [search,  setSearch]  = useState("")
  const [crops,   setCrops]   = useState([])

  async function fetchData() {
    setLoading(true)
    try {
      const [hRes, sRes, cRes] = await Promise.all([
        fetch("/api/history"),
        fetch("/api/history/stats"),
        fetch("/api/crops"),
      ])
      setHistory(await hRes.json())
      setStats(await sRes.json())
      const cropsData = await cRes.json()
      setCrops(cropsData.map(c => c.name))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return
    await fetch(`/api/history/${id}`, { method: "DELETE" })
    fetchData()
  }

  async function handleSubmit(fd) {
    setSaving(true)
    try {
      await fetch("/api/history", { method: "POST", body: fd })
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const filtered = history.filter(h =>
    !search || h.farmer_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.crop?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 relative z-10">
      <div className="mb-8 fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono text-green-500 mb-3"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
          📋 Yield History
        </div>
        <h1 className="text-3xl font-bold">Farmer <span className="text-green-400">Dashboard</span></h1>
        <p className="text-gray-500 text-sm mt-1">Track yields, profits and crop performance over time</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon="📊" label="Total Reports" value={stats.total_reports} />
          <StatCard icon="🔬" label="Analyses Run"  value={stats.analyses_total} />
          <StatCard icon="🌾" label="Avg Yield"  value={stats.avg_yield_t_ha ? `${stats.avg_yield_t_ha} t/ha` : null} />
          <StatCard icon="⭐" label="Avg Rating"    value={stats.avg_rating ? `${stats.avg_rating}/5` : null} />
        </div>
      )}

      {/* Top crops */}
      {stats?.top_crops?.length > 0 && (
        <div className="card p-5 mb-6 fade-up">
          <h2 className="text-xs font-mono text-green-500 uppercase tracking-widest mb-4">🏆 Most Grown Crops</h2>
          <div className="flex flex-wrap gap-2">
            {stats.top_crops.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}>
                <span>{c.emoji}</span>
                <span className="text-white font-medium">{c.crop}</span>
                <span className="text-xs font-mono text-gray-500">{c.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Report form */}
        <ReportForm onSubmit={handleSubmit} loading={saving} crops={crops} />

        {/* History list */}
        <div className="space-y-4">
          <div className="fade-up">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search by name or crop..."
              className="input-field w-full px-4 py-2.5 text-sm" />
          </div>

          {loading ? (
            <div className="card p-8 text-center">
              <div className="text-2xl mb-2 animate-spin">⚙</div>
              <p className="text-sm text-gray-500">Loading history...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-center fade-up">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400 font-medium">No reports yet</p>
              <p className="text-xs text-gray-600 mt-1">Submit your first yield report</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((h, i) => (
                <div key={h.id} className={`card p-4 fade-up`} style={{ animationDelay: `${i*0.04}s` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{h.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{h.crop}</p>
                        <p className="text-xs text-gray-500">{h.farmer_name} · {h.season}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(h.id)} className="text-xs text-gray-700 hover:text-red-400 transition px-2 py-1 rounded">✕</button>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono mb-2">
                    <span className="text-green-400">{h.actual_yield} t/ha</span>
                    {h.profit_actual && <span className="text-yellow-400">${h.profit_actual}</span>}
                    {h.region_name && <span className="text-gray-500">{h.region_name}</span>}
                  </div>
                  {h.rating && <Stars rating={h.rating} />}
                  {h.notes && <p className="text-xs text-gray-500 mt-1 italic">"{h.notes}"</p>}
                  <p className="text-xs text-gray-700 mt-1">{new Date(h.reported_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
