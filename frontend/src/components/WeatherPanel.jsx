// WeatherPanel.jsx — Phase 3 redesign
import { useEffect, useState } from "react"

const iconEmoji = (icon) => {
  if (!icon) return "🌤"
  if (icon.startsWith("01")) return "☀️"
  if (icon.startsWith("02")) return "⛅"
  if (icon.startsWith("03") || icon.startsWith("04")) return "☁️"
  if (icon.startsWith("09")) return "🌧"
  if (icon.startsWith("10")) return "🌦"
  if (icon.startsWith("11")) return "⛈"
  if (icon.startsWith("13")) return "❄️"
  return "🌤"
}

export default function WeatherPanel({ lat, lon, cropName }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lat || !lon) return
    setLoading(true)
    fetch(`/api/weather?lat=${lat}&lon=${lon}${cropName ? `&crop=${cropName}` : ""}`)
      .then(r => r.json())
      .then(d => { setWeather(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [lat, lon, cropName])

  if (!lat || !lon) return (
    <div className="card p-8 text-center">
      <p className="text-gray-500 text-sm">Location data not available</p>
    </div>
  )

  if (loading) return (
    <div className="card p-5">
      <h2 className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-4">🌤 Weather</h2>
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-800 rounded" style={{ width: `${60+i*10}%` }} />)}
      </div>
    </div>
  )

  if (!weather) return null

  const { current, forecast, crop_suitability } = weather

  return (
    <div className="space-y-4">
      {/* Current */}
      <div className="card p-5 fade-up">
        <h2 className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-4">
          🌤 Weather — {current.city}{current.country ? `, ${current.country}` : ""}
          {current.source?.includes("mock") && (
            <span className="ml-2 text-yellow-600">(demo data)</span>
          )}
        </h2>

        <div className="flex items-center gap-5 p-4 rounded-xl mb-4" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)" }}>
          <div className="text-5xl">{iconEmoji(current.icon)}</div>
          <div className="flex-1">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-bold text-white">{current.temp_c}°</span>
              <span className="text-sm text-gray-400 mb-1">Feels {current.feels_like_c}°C</span>
            </div>
            <p className="text-sm text-gray-300">{current.description}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-mono text-gray-500">💧 {current.humidity_pct}%</p>
            <p className="text-xs font-mono text-gray-500">🌬 {current.wind_kmh} km/h</p>
            {current.rainfall_mm > 0 && <p className="text-xs font-mono text-blue-400">🌧 {current.rainfall_mm}mm</p>}
          </div>
        </div>

        {/* Crop suitability */}
        {crop_suitability && (
          <div className={`p-3 rounded-lg border text-sm mb-4 ${
            crop_suitability.score >= 0.7 ? "border-green-800/40 bg-green-900/10 text-green-300" :
            crop_suitability.score >= 0.5 ? "border-yellow-800/40 bg-yellow-900/10 text-yellow-300" :
            "border-red-800/40 bg-red-900/10 text-red-300"
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Weather fit for {cropName}</span>
              <span className="font-mono font-bold">{Math.round(crop_suitability.score*100)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-black/20 mb-1.5">
              <div className="h-full rounded-full" style={{ width: `${crop_suitability.score*100}%`, background: crop_suitability.score >= 0.7 ? "#4ade80" : crop_suitability.score >= 0.5 ? "#eab308" : "#ef4444" }} />
            </div>
            <p className="text-xs opacity-75">{crop_suitability.comment}</p>
          </div>
        )}

        {/* 7-day forecast */}
        {forecast?.length > 0 && (
          <div>
            <p className="text-xs font-mono text-gray-600 mb-2 tracking-widest">7-DAY FORECAST</p>
            <div className="grid grid-cols-7 gap-1">
              {forecast.slice(0,7).map((day, i) => (
                <div key={i} className={`text-center p-2 rounded-lg border text-xs transition ${
                  i === 0 ? "border-blue-800/40 bg-blue-900/15" : "border-gray-800/40 bg-gray-900/20 hover:border-gray-700"
                }`}>
                  <p className="font-mono text-gray-500 mb-1">{i === 0 ? "NOW" : day.day}</p>
                  <div className="text-lg mb-1">{iconEmoji(day.icon)}</div>
                  <p className="font-bold text-white">{day.temp_c}°</p>
                  {day.rainfall_mm > 0 && <p className="text-blue-400 mt-0.5">{day.rainfall_mm}mm</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
