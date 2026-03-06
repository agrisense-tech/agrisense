// Header.jsx — Phase 3
import { useState } from "react"

export default function Header({ currentView, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { id: "form",    label: "Analyze",  icon: "🔬" },
    { id: "history", label: "History",  icon: "📋" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-green-900/30"
      style={{ background: "rgba(5,15,8,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">

        {/* Logo */}
        <button onClick={() => onNavigate?.("form")} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg pulse-ring"
            style={{ background: "linear-gradient(135deg, #166534, #14532d)", border: "1px solid rgba(74,222,128,0.3)" }}>
            🌿
          </div>
          <div>
            <span className="font-bold text-lg text-white" style={{ fontFamily: "Sora" }}>Agri</span>
            <span className="font-bold text-lg text-green-400">Sense</span>
            <span className="ml-2 text-xs font-mono text-green-700 align-top">v3</span>
          </div>
        </button>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => onNavigate?.(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                currentView === item.id ? "tab-active" : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}>
              <span className="mr-1.5">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs font-mono text-green-600">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">ML ACTIVE</span>
        </div>
      </div>
    </header>
  )
}
