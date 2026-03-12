import { useState } from "react"
export default function Header({ currentView, onNavigate, user, onLogout }) {
  return (
    <header style={{ background:"#0a1a0f", borderBottom:"1px solid #1a3a1f", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <span style={{ fontSize:"1.5rem" }}>🌱</span>
        <span style={{ color:"#4ade80", fontWeight:700, fontSize:"1.2rem" }}>AgriSense</span>
        <span style={{ background:"#166534", color:"#4ade80", fontSize:"0.65rem", padding:"0.15rem 0.4rem", borderRadius:"0.25rem", fontWeight:700 }}>v3</span>
      </div>
      <nav style={{ display:"flex", gap:"0.5rem" }}>
        {["form","history"].map(v => (
          <button key={v} onClick={() => onNavigate(v)} style={{ padding:"0.5rem 1rem", borderRadius:"0.5rem", border:"none", cursor:"pointer", background: currentView===v?"#4ade80":"transparent", color: currentView===v?"#050f08":"#9ca3af", fontWeight: currentView===v?700:400, fontSize:"0.9rem" }}>
            {v === "form" ? "🔍 Analyze" : "📋 History"}
          </button>
        ))}
      </nav>
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <span style={{ color:"#4ade80", fontSize:"0.85rem" }}>● ML ACTIVE</span>
        {user && <>
          <span style={{ color:"#9ca3af", fontSize:"0.85rem" }}>👤 {user.name}</span>
          <button onClick={onLogout} style={{ padding:"0.4rem 0.75rem", background:"#1a0a0a", border:"1px solid #7f1d1d", borderRadius:"0.4rem", color:"#f87171", fontSize:"0.8rem", cursor:"pointer" }}>Logout</button>
        </>}
      </div>
    </header>
  )
}
