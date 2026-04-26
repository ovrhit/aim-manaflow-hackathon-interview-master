import { Home, LayoutGrid, ChevronLeft, Settings } from 'lucide-react'

export default function NavBar({ onHome, onBack, onOverview, onSettings, title }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/70 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-indigo-600 transition-colors mr-0.5">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <button onClick={onHome} className="text-gray-400 hover:text-indigo-600 transition-colors">
          <Home className="w-4 h-4" />
        </button>
        <span className="w-px h-3.5 bg-gray-200 mx-0.5" />
        <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          동아리 면접 도우미
        </span>
        {title && (
          <>
            <span className="text-gray-300 text-xs">›</span>
            <span className="text-sm text-gray-500 font-medium">{title}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onOverview && (
          <button onClick={onOverview} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
            <LayoutGrid className="w-3.5 h-3.5" />
            전체 현황
          </button>
        )}
        {onSettings && (
          <button onClick={onSettings} className="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="설정">
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  )
}
