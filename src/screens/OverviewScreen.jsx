import { Star } from 'lucide-react'
import NavBar from '../components/NavBar'

function ScoreBadge({ value }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>
  const color = value >= 4 ? 'text-indigo-600' : value >= 3 ? 'text-yellow-600' : 'text-gray-400'
  return <span className={`text-sm font-semibold ${color}`}>{value.toFixed(1)}</span>
}

function DecisionBadge({ decision }) {
  if (!decision) return <span className="text-gray-300 text-xs">—</span>
  const style = {
    '합격':   'bg-emerald-100 text-emerald-700 border-emerald-200',
    '보류':   'bg-amber-100 text-amber-700 border-amber-200',
    '불합격': 'bg-red-100 text-red-700 border-red-200',
  }[decision]
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style}`}>
      {decision}
    </span>
  )
}

export default function OverviewScreen({ applicants, settingsApi, onHome, onBack, onSettings, onSelect }) {
  const { settings } = settingsApi
  const criteria = settings.criteria
  const evaluated = applicants.filter(a => a.evaluated)

  const passed   = applicants.filter(a => a.decision === '합격').length
  const rejected = applicants.filter(a => a.decision === '불합격').length

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

  let rank = 0

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onHome={onHome} onBack={onBack} onSettings={onSettings ?? undefined} title="전체 현황" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: '전체 지원자', value: applicants.length, unit: '명', color: 'text-indigo-600' },
            { label: '면접 완료',  value: evaluated.length + applicants.filter(a => a.interviewed && !a.evaluated).length, unit: '명', color: 'text-indigo-500' },
            { label: '평가 완료',  value: evaluated.length, unit: '명', color: 'text-violet-600' },
            { label: '합격',       value: passed,   unit: '명', color: 'text-emerald-600' },
            { label: '평균 점수',  value: overallAvg, unit: '', color: 'text-indigo-600' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}<span className="text-sm font-normal text-gray-400 ml-0.5">{unit}</span></p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">이름</th>
                {criteria.map(c => (
                  <th key={c.id} className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">평균</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">결정</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">메모</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const avg = avgScore(a)
                if (a.evaluated) rank++

                return (
                  <tr
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    {/* 순위 */}
                    <td className="text-center px-3 py-3">
                      {a.evaluated ? (
                        <span className={`text-xs font-bold ${
                          rank === 1 ? 'text-yellow-500' :
                          rank === 2 ? 'text-gray-400' :
                          rank === 3 ? 'text-amber-600' : 'text-gray-300'
                        }`}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                        </span>
                      ) : (
                        <span className="text-gray-200 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          a.evaluated ? 'bg-violet-400' : a.interviewed ? 'bg-indigo-400' : 'bg-amber-400'
                        }`} />
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
                          <span className="font-bold text-indigo-600">{avg.toFixed(1)}</span>
                        </div>
                      ) : a.evaluated ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          a.interviewed
                            ? 'bg-indigo-50 text-indigo-500 border-indigo-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {a.interviewed ? '면접완료' : '미면접'}
                        </span>
                      )}
                    </td>

                    <td className="text-center px-4 py-3">
                      <DecisionBadge decision={a.decision} />
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[140px] truncate">{a.memo || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            {evaluated.length > 1 && (
              <tfoot>
                <tr className="bg-gray-50/80 border-t border-gray-200">
                  <td className="px-3 py-2" />
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
