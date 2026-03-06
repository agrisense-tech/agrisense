// src/components/Header.jsx
export default function Header() {
  return (
    <header className="border-b border-green-900/40 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-700 rounded-lg flex items-center justify-center text-lg">
            🌿
          </div>
          <div>
            <span className="font-bold text-lg text-white">Agri</span>
            <span className="font-bold text-lg text-green-400">Sense</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-500 font-mono">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
          ML System Active
        </div>
      </div>
    </header>
  )
}
