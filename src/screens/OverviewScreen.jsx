import { Star } from 'lucide-react'
import NavBar from '../components/NavBar'

function ScoreBadge({ value }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>
  const color = value >= 4 ? 'text-indigo-600' : value >= 3 ? 'text-yellow-600' : 'text-gray-400'
  return <span className={`text-sm font-semibold ${color}`}>{value.toFixed(1)}</span>
}

export default function OverviewScreen({ applicants, settingsApi, onHome, onBack, onSettings, onSelect }) {
  const { settings } = settingsApi
  const criteria = settings.criteria
  const evaluated = applicants.filter(a => a.evaluated)

  function avgScore(applicant) {
    const vals = criteria
      .map(c => applicant.scores?.[c.id])
      .filter(v => typeof v === 'number' && v > 0)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }

  function colAvg(key) {
    const vals = evaluated
      .map(a => a.scores?.[key])
      .filter(v => typeof v === 'number' && v > 0)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }

  const sorted = [...applicants].sort((a, b) => {
    if (!a.evaluated && !b.evaluated) return 0
    if (!a.evaluated) return 1
    if (!b.evaluated) return -1
    const aAvg = avgScore(a) ?? -1
    const bAvg = avgScore(b) ?? -1
    return bAvg - aAvg
  })

  const overallAvg = (() => {
    const vals = evaluated.map(avgScore).filter(v => v !== null)
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '—'
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onHome={onHome} onBack={onBack} onSettings={onSettings ?? undefined} title="전체 현황" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '전체 지원자', value: applicants.length, unit: '명' },
            { label: '평가 완료', value: evaluated.length, unit: '명' },
            { label: '평균 총점', value: overallAvg, unit: '' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{value}<span className="text-sm font-normal text-gray-400 ml-0.5">{unit}</span></p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">이름</th>
                {criteria.map(c => (
                  <th key={c.id} className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">평균</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">메모</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const avg = avgScore(a)
                return (
                  <tr
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.evaluated ? 'bg-indigo-400' : 'bg-yellow-400'}`} />
                        <span className="font-medium text-gray-800">{a.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 pl-3.5">{a.createdAt}</p>
                    </td>
                    {criteria.map(c => (
                      <td key={c.id} className="text-center px-4 py-3">
                        <ScoreBadge value={a.evaluated ? (a.scores?.[c.id] || null) : null} />
                      </td>
                    ))}
                    <td className="text-center px-4 py-3">
                      {a.evaluated && avg !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-indigo-400 stroke-indigo-400" />
                          <span className="font-semibold text-indigo-600">{avg.toFixed(1)}</span>
                        </div>
                      ) : a.evaluated ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-100 rounded px-1.5 py-0.5">미평가</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">{a.memo || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            {evaluated.length > 1 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-2 text-xs font-semibold text-gray-400">전체 평균</td>
                  {criteria.map(c => {
                    const val = colAvg(c.id)
                    return (
                      <td key={c.id} className="text-center px-4 py-2 text-xs font-semibold text-gray-500">
                        {val !== null ? val.toFixed(1) : '—'}
                      </td>
                    )
                  })}
                  <td className="text-center px-4 py-2" />
                  <td className="px-4 py-2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </main>
    </div>
  )
}
