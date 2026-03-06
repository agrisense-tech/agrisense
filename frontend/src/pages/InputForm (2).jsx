// src/pages/InputForm.jsx
// ---------------------------------------------------------
// The main data entry form. Collects:
//   - GPS coordinates
//   - Soil NPK + pH
//   - Water data
//   - Optional field image
// ---------------------------------------------------------

import { useState } from "react"

// A reusable input field component
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

// Styled number input
function NumInput({ value, onChange, placeholder, min, max, step = "any" }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5
                 text-white placeholder-gray-600 focus:outline-none focus:border-green-500
                 focus:ring-1 focus:ring-green-500 transition text-sm"
    />
  )
}

// Section wrapper with title
function Section({ icon, title, children }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  )
}

export default function InputForm({ onSubmit, loading, error }) {
  // Form state — all values start empty
  const [lat, setLat]       = useState("")
  const [lon, setLon]       = useState("")
  const [n, setN]           = useState("")
  const [p, setP]           = useState("")
  const [k, setK]           = useState("")
  const [ph, setPh]         = useState("")
  const [water, setWater]   = useState("")
  const [moisture, setMoisture] = useState("")
  const [image, setImage]   = useState(null)

  // Quick-fill with sample data (useful for testing)
  function fillDemo() {
    setLat("13.08"); setLon("80.27")  // Chennai, Tamil Nadu
    setN("90"); setP("55"); setK("60"); setPh("6.5")
    setWater("3.5"); setMoisture("65")
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Build a FormData object (needed to send file + text together)
    const fd = new FormData()
    fd.append("latitude",          lat)
    fd.append("longitude",         lon)
    fd.append("nitrogen",          n)
    fd.append("phosphorus",        p)
    fd.append("potassium",         k)
    fd.append("ph",                ph)
    if (water)    fd.append("water_table_m",     water)
    if (moisture) fd.append("soil_moisture_pct", moisture)
    if (image)    fd.append("image",             image)

    onSubmit(fd)
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">
          Smart Crop <span className="text-green-400">Recommendation</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Enter your field data and our AI will recommend the best crop to grow
        </p>
        <button
          onClick={fillDemo}
          className="mt-3 text-xs text-green-500 border border-green-800 rounded-full
                     px-4 py-1 hover:bg-green-900/30 transition"
        >
          ✨ Fill with demo data
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* GPS Section */}
        <Section icon="📍" title="GPS Location">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" hint="e.g. 13.08 (Chennai)">
              <NumInput value={lat} onChange={setLat} placeholder="13.0827" min={-90} max={90} step="0.0001" />
            </Field>
            <Field label="Longitude" hint="e.g. 80.27 (Chennai)">
              <NumInput value={lon} onChange={setLon} placeholder="80.2707" min={-180} max={180} step="0.0001" />
            </Field>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Find your GPS on Google Maps: right-click on your location
          </p>
        </Section>

        {/* Soil Section */}
        <Section icon="🧪" title="Soil Nutrients">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nitrogen (N) — mg/kg" hint="Typical range: 0–200">
              <NumInput value={n} onChange={setN} placeholder="80" min={0} max={500} />
            </Field>
            <Field label="Phosphorus (P) — mg/kg" hint="Typical range: 0–200">
              <NumInput value={p} onChange={setP} placeholder="45" min={0} max={500} />
            </Field>
            <Field label="Potassium (K) — mg/kg" hint="Typical range: 0–200">
              <NumInput value={k} onChange={setK} placeholder="60" min={0} max={500} />
            </Field>
            <Field label="Soil pH" hint="Scale 0–14. Neutral = 7.0">
              <NumInput value={ph} onChange={setPh} placeholder="6.5" min={0} max={14} step="0.1" />
            </Field>
          </div>
          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
            <strong className="text-gray-300">How to get soil data:</strong> Use a soil test kit
            (available at agri stores ~$5) or send a sample to your local agricultural university lab.
          </div>
        </Section>

        {/* Water Section */}
        <Section icon="💧" title="Water Data (Optional)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Water Table Depth (meters)" hint="How deep is groundwater?">
              <NumInput value={water} onChange={setWater} placeholder="3.5" min={0} max={100} step="0.1" />
            </Field>
            <Field label="Soil Moisture (%)" hint="0 = bone dry, 100 = saturated">
              <NumInput value={moisture} onChange={setMoisture} placeholder="65" min={0} max={100} />
            </Field>
          </div>
        </Section>

        {/* Image Section */}
        <Section icon="🛰" title="Field Image (Optional)">
          <div
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center
                       hover:border-green-600 transition cursor-pointer"
            onClick={() => document.getElementById('field-image').click()}
          >
            {image ? (
              <div className="text-green-400">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm font-medium">{image.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(image.size / 1024).toFixed(0)} KB
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="text-3xl mb-2">📸</div>
                <p className="text-sm">Click to upload a photo of your field</p>
                <p className="text-xs mt-1">JPEG or PNG — used for land type detection</p>
              </div>
            )}
          </div>
          <input
            id="field-image"
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={e => setImage(e.target.files[0] || null)}
          />
        </Section>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !lat || !lon || !n || !p || !k || !ph}
          className="w-full py-3.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700
                     disabled:cursor-not-allowed rounded-xl font-semibold text-white
                     transition text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⚙</span> Analyzing your field...
            </>
          ) : (
            "⚡ Analyze & Get Crop Recommendation"
          )}
        </button>
      </form>
    </main>
  )
}
