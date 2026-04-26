import { Home, LayoutGrid, ChevronLeft, Settings } from 'lucide-react'

export default function NavBar({ onHome, onBack, onOverview, onSettings, title }) {
  return (
    <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-10">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-0.5 text-gray-400 hover:text-indigo-600 transition-colors mr-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <button onClick={onHome} className="text-gray-400 hover:text-indigo-600 transition-colors">
          <Home className="w-4 h-4" />
        </button>
        <span className="text-gray-300 text-sm">|</span>
        <span className="text-sm font-semibold text-indigo-600">동아리 면접 도우미</span>
        {title && <><span className="text-gray-300 text-sm">›</span><span className="text-sm text-gray-600">{title}</span></>}
      </div>
      <div className="flex items-center gap-3">
        {onOverview && (
          <button onClick={onOverview} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <LayoutGrid className="w-4 h-4" />
            전체 현황
          </button>
        )}
        {onSettings && (
          <button onClick={onSettings} className="text-gray-400 hover:text-indigo-600 transition-colors" title="설정">
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  )
}
