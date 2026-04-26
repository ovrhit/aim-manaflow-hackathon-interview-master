import { Plus, Trash2, Star, LayoutGrid, Settings } from 'lucide-react'

function ScoreDot({ value }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${value >= 4 ? 'bg-indigo-500' : value >= 2 ? 'bg-yellow-400' : 'bg-gray-300'}`} />
  )
}

export default function HomeScreen({ applicants, onNew, onSelect, onOverview, onSettings, onDelete }) {
  const evaluated = applicants.filter(a => a.evaluated)
  const pending = applicants.filter(a => !a.evaluated)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-indigo-600">동아리 면접 도우미</h1>
          <p className="text-sm text-gray-400 mt-0.5">지원자 {applicants.length}명 · 평가 완료 {evaluated.length}명</p>
        </div>
        <div className="flex items-center gap-2">
          {applicants.length > 0 && (
            <button
              onClick={onOverview}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              전체 현황
            </button>
          )}
          <button onClick={onSettings} className="text-gray-400 hover:text-indigo-600 transition-colors p-1.5" title="설정">
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 지원자
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {applicants.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm mb-4">아직 등록된 지원자가 없습니다</p>
            <button
              onClick={onNew}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              첫 지원자 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">평가 대기 ({pending.length})</h2>
                <div className="space-y-2">
                  {pending.map(a => (
                    <ApplicantRow key={a.id} applicant={a} onSelect={onSelect} onDelete={onDelete} />
                  ))}
                </div>
              </section>
            )}
            {evaluated.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">평가 완료 ({evaluated.length})</h2>
                <div className="space-y-2">
                  {evaluated.map(a => (
                    <ApplicantRow key={a.id} applicant={a} onSelect={onSelect} onDelete={onDelete} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ApplicantRow({ applicant, onSelect, onDelete }) {
  const scoreVals = Object.values(applicant.scores ?? {}).filter(v => typeof v === 'number' && v > 0)
  const avg = applicant.evaluated && scoreVals.length
    ? (scoreVals.reduce((s, v) => s + v, 0) / scoreVals.length).toFixed(1)
    : null

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onSelect(applicant.id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${applicant.evaluated ? 'bg-indigo-400' : 'bg-yellow-400'}`} />
        <span className="font-medium text-gray-800 truncate">{applicant.name}</span>
        <span className="text-xs text-gray-400 shrink-0">{applicant.createdAt}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {applicant.evaluated && (
          <div className="flex items-center gap-1 text-sm text-indigo-600 font-medium">
            <Star className="w-3.5 h-3.5 fill-indigo-400 stroke-indigo-400" />
            {avg}
          </div>
        )}
        {!applicant.evaluated && (
          <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5">미평가</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(applicant.id) }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
