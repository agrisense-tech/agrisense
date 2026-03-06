// src/components/WeatherPanel.jsx
// Shows current weather + 7-day forecast from the API
import { useEffect, useState } from "react"

const ICON_URL = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`

// Map icon codes to emojis as fallback
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
  const [weather, setWeather]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!lat || !lon) return
    setLoading(true)
    setError(null)

    const url = `/api/weather?lat=${lat}&lon=${lon}${cropName ? `&crop=${cropName}` : ""}`

    fetch(url)
      .then(r => r.json())
      .then(data => { setWeather(data); setLoading(false) })
      .catch(e  => { setError("Could not load weather"); setLoading(false) })
  }, [lat, lon, cropName])

  if (!lat || !lon) return null

  if (loading) return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-blue-400 mb-4">🌤 Weather</h2>
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  )

  if (error || !weather) return null

  const { current, forecast, crop_suitability } = weather

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-blue-400 mb-4">
        🌤 Weather — {current.city}{current.country ? `, ${current.country}` : ""}
        {current.source === "mock" && (
          <span className="ml-2 text-xs text-yellow-600 font-normal">(demo data)</span>
        )}
      </h2>

      {/* Current weather */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-blue-900/15 border border-blue-800/30 rounded-lg">
        <div className="text-4xl">{iconEmoji(current.icon)}</div>
        <div className="flex-1">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{current.temp_c}°C</span>
            <span className="text-sm text-gray-400 mb-1">Feels {current.feels_like_c}°C</span>
          </div>
          <p className="text-sm text-gray-300">{current.description}</p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div>💧 {current.humidity_pct}% humidity</div>
          <div>🌬 {current.wind_kmh} km/h wind</div>
          {current.rainfall_mm > 0 && <div>🌧 {current.rainfall_mm}mm rain</div>}
        </div>
      </div>

      {/* Crop weather suitability */}
      {crop_suitability && (
        <div className={`mb-4 p-3 rounded-lg border text-sm ${
          crop_suitability.score >= 0.7
            ? "bg-green-900/20 border-green-700/40 text-green-300"
            : crop_suitability.score >= 0.5
            ? "bg-yellow-900/20 border-yellow-700/40 text-yellow-300"
            : "bg-red-900/20 border-red-700/40 text-red-300"
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">Weather fit for {cropName}</span>
            <span className="font-mono font-bold">
              {Math.round(crop_suitability.score * 100)}%
            </span>
          </div>
          <p className="text-xs opacity-80">{crop_suitability.comment}</p>
        </div>
      )}

      {/* 7-day forecast */}
      {forecast && forecast.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-mono mb-2 tracking-wider">7-DAY FORECAST</p>
          <div className="grid grid-cols-7 gap-1">
            {forecast.slice(0, 7).map((day, i) => (
              <div key={i}
                className={`text-center p-1.5 rounded-lg border text-xs transition
                  ${i === 0
                    ? "bg-blue-900/25 border-blue-700/40"
                    : "bg-gray-800/50 border-gray-700/30 hover:border-gray-600"}`}>
                <p className="text-gray-400 font-mono mb-1">{i === 0 ? "NOW" : day.day}</p>
                <div className="text-lg mb-1">{iconEmoji(day.icon)}</div>
                <p className="font-semibold text-white">{day.temp_c}°</p>
                {day.rainfall_mm > 0 && (
                  <p className="text-blue-400 mt-0.5">{day.rainfall_mm}mm</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
