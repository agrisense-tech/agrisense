import { useState } from "react"
const API = import.meta.env.VITE_API_URL || "https://agrisense-p0x7.onrender.com"
export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", region:"" })
  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  async function handleSubmit() {
    setLoading(true); setError(null)
    try {
      const url = mode === "login" ? API+"/api/auth/login" : API+"/api/auth/register"
      const body = mode === "login" ? { email: form.email, password: form.password } : { name: form.name, email: form.email, password: form.password, phone: form.phone, region: form.region }
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Authentication failed")
      localStorage.setItem("agrisense_token", data.token)
      localStorage.setItem("agrisense_user", JSON.stringify(data.user))
      onLogin(data.user, data.token)
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }
  const inp = { width:"100%", padding:"0.75rem", background:"#0f2a15", border:"1px solid #1a3a1f", borderRadius:"0.5rem", color:"#e2e8f0", fontSize:"0.9rem", outline:"none", boxSizing:"border-box" }
  return (
    <div style={{ minHeight:"100vh", background:"#050f08", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ background:"#0a1a0f", border:"1px solid #1a3a1f", borderRadius:"1rem", padding:"2.5rem", width:"100%", maxWidth:"420px" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:"2.5rem" }}>🌱</div>
          <h1 style={{ color:"#4ade80", fontSize:"1.8rem", fontWeight:700, margin:0 }}>AgriSense</h1>
          <p style={{ color:"#6b7280", fontSize:"0.85rem", marginTop:"0.25rem" }}>Smart Crop Intelligence</p>
        </div>
        <div style={{ display:"flex", background:"#0f2a15", borderRadius:"0.5rem", padding:"0.25rem", marginBottom:"1.5rem" }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null) }} style={{ flex:1, padding:"0.6rem", borderRadius:"0.35rem", border:"none", cursor:"pointer", background: mode===m?"#4ade80":"transparent", color: mode===m?"#050f08":"#9ca3af", fontWeight: mode===m?700:400, fontSize:"0.9rem" }}>
              {m === "login" ? "🔑 Login" : "✨ Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {mode === "register" && <input name="name" placeholder="Your full name" value={form.name} onChange={update} style={inp} />}
          <input name="email" type="email" placeholder="Email address" value={form.email} onChange={update} style={inp} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} style={inp} />
          {mode === "register" && <>
            <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={update} style={inp} />
            <select name="region" value={form.region} onChange={update} style={inp}>
              <option value="">Select region (optional)</option>
              <option>Tamil Nadu</option><option>Punjab</option><option>West Bengal</option>
              <option>Maharashtra</option><option>Mekong Delta</option><option>Central Luzon</option>
            </select>
          </>}
        </div>
        {error && <div style={{ background:"#2d0a0a", border:"1px solid #7f1d1d", borderRadius:"0.5rem", padding:"0.75rem", marginTop:"1rem", color:"#f87171", fontSize:"0.85rem" }}>⚠ {error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginTop:"1.5rem", padding:"0.85rem", background: loading?"#166534":"#4ade80", color:"#050f08", border:"none", borderRadius:"0.5rem", fontWeight:700, fontSize:"1rem", cursor: loading?"not-allowed":"pointer" }}>
          {loading ? "⏳ Please wait..." : mode === "login" ? "🔑 Login" : "🌱 Create Account"}
        </button>
        <p style={{ textAlign:"center", color:"#6b7280", fontSize:"0.8rem", marginTop:"1.5rem" }}>
          {mode === "login" ? "No account? " : "Have account? "}
          <span onClick={() => { setMode(mode==="login"?"register":"login"); setError(null) }} style={{ color:"#4ade80", cursor:"pointer", textDecoration:"underline" }}>
            {mode === "login" ? "Sign up free" : "Login"}
          </span>
        </p>
      </div>
    </div>
  )
}
