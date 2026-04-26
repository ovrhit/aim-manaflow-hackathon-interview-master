import { useState } from 'react'
import { Plus, X, Pencil, Check } from 'lucide-react'
import NavBar from '../components/NavBar'
import Toast from '../components/Toast'
import RecordingPanel from '../components/RecordingPanel'
import AIComment from '../components/AIComment'

// questions는 { type, question }[] 또는 구버전 마크다운 문자열 모두 처리
function parseQuestions(raw) {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && Array.isArray(raw.questions)) return raw.questions
  if (typeof raw === 'string') {
    const match = raw.match(/## 추천 면접 질문\n([\s\S]*)/)
    const src = match ? match[1] : raw
    return src.trim().split('\n')
      .map(l => ({ type: null, question: l.replace(/\*\*/g, '').replace(/^\[.*?\]\s*\d+\.\s*/, '').replace(/^\d+\.\s*/, '').trim() }))
      .filter(q => q.question)
  }
  return []
}

function DecimalRating({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <input
        type="number"
        min="0" max="5" step="0.1"
        value={value || ''}
        onChange={e => {
          const v = parseFloat(e.target.value)
          onChange(isNaN(v) ? 0 : Math.min(5, Math.max(0, v)))
        }}
        placeholder="0.0"
        className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <span className="text-xs text-gray-400">/ 5</span>
      {value > 0 && <span className="text-xs font-semibold text-indigo-500">{value}</span>}
    </div>
  )
}

function CompareBar({ label, value, avgValue }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span><span className="font-medium text-indigo-600">{value > 0 ? value : '—'}</span>
          {avgValue > 0 && <span className="text-gray-400"> vs 평균 {avgValue.toFixed(1)}</span>}
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        {avgValue > 0 && <div className="absolute h-full bg-gray-300 rounded-full" style={{ width: `${(avgValue / 5) * 100}%` }} />}
        {value > 0 && <div className="absolute h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(value / 5) * 100}%` }} />}
      </div>
    </div>
  )
}

export default function EvaluateScreen({ applicant, allApplicants, settingsApi, onHome, onBack, onUpdate, onOverview }) {
  const { settings, updateCriteria, updateCommonQuestions } = settingsApi

  // 평가 점수 (기준 id → 점수)
  const [scores, setScores] = useState(() => {
    const s = {}
    settings.criteria.forEach(c => { s[c.id] = applicant.scores?.[c.id] ?? 0 })
    return s
  })
  const [overallScore, setOverallScore] = useState(applicant.overallScore ?? 0)
  const [memo, setMemo] = useState(applicant.memo ?? '')
  const [saved, setSaved] = useState(false)

  // 질문 관리
  const [newQuestion, setNewQuestion] = useState('')
  const [newCommonQ, setNewCommonQ] = useState('')

  // 평가 기준 편집 모드
  const [editingCriteria, setEditingCriteria] = useState(false)
  const [draftCriteria, setDraftCriteria] = useState(settings.criteria)

  const aiQuestions = parseQuestions(applicant.questions)
  const others = allApplicants.filter(a => a.id !== applicant.id && a.evaluated)
  const avg = (key) => others.length ? others.reduce((s, a) => s + (a.scores?.[key] ?? 0), 0) / others.length : 0

  const filledScores = settings.criteria.filter(c => scores[c.id] > 0)
  const autoAvg = filledScores.length
    ? (filledScores.reduce((s, c) => s + scores[c.id], 0) / filledScores.length).toFixed(1)
    : null

  function handleSave() {
    onUpdate({ scores, overallScore, memo, evaluated: true })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function saveCriteria() {
    const valid = draftCriteria.filter(c => c.label.trim())
    updateCriteria(valid)
    // 기존 점수에서 없어진 항목 제거, 새 항목 0으로 초기화
    const next = {}
    valid.forEach(c => { next[c.id] = scores[c.id] ?? 0 })
    setScores(next)
    setEditingCriteria(false)
  }

  function addCriterion() {
    setDraftCriteria(d => [...d, { id: `custom_${Date.now()}`, label: '' }])
  }

  function addApplicantQuestion() {
    if (!newQuestion.trim()) return
    onUpdate({ customQuestions: [...(applicant.customQuestions ?? []), newQuestion.trim()] })
    setNewQuestion('')
  }

  function removeApplicantQuestion(idx) {
    const next = (applicant.customQuestions ?? []).filter((_, i) => i !== idx)
    onUpdate({ customQuestions: next })
  }

  function addCommonQuestion() {
    if (!newCommonQ.trim()) return
    updateCommonQuestions([...settings.commonQuestions, newCommonQ.trim()])
    setNewCommonQ('')
  }

  function removeCommonQuestion(idx) {
    updateCommonQuestions(settings.commonQuestions.filter((_, i) => i !== idx))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onHome={onHome} onBack={onBack} onOverview={onOverview} title={applicant.name} />
      <Toast message={`${applicant.name} 평가가 저장됐습니다`} visible={saved} />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* 왼쪽: 질문 목록 */}
          <div className="space-y-4">

            {/* AI 생성 질문 */}
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">AI 면접 질문</h2>
              <ol className="space-y-3">
                {aiQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      {q.type && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded mr-1.5 ${q.type === '모순검증' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>{q.type}</span>
                      )}
                      <span className="text-sm text-gray-700 leading-relaxed">{q.question}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* 공통 질문 */}
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">공통 질문</h2>
              {settings.commonQuestions.length > 0 ? (
                <ul className="space-y-2">
                  {settings.commonQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 group">
                      <span className="text-xs text-indigo-400 font-semibold mt-0.5 shrink-0">공{i + 1}.</span>
                      <span className="text-sm text-gray-700 flex-1">{q}</span>
                      <button onClick={() => removeCommonQuestion(i)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-300">모든 면접자에게 공통으로 쓸 질문을 추가하세요</p>
              )}
              <div className="flex gap-2 pt-1">
                <input
                  value={newCommonQ}
                  onChange={e => setNewCommonQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCommonQuestion()}
                  placeholder="공통 질문 추가..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addCommonQuestion} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* 면접자별 질문 */}
            <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{applicant.name} 전용 질문</h2>
              {(applicant.customQuestions ?? []).length > 0 ? (
                <ul className="space-y-2">
                  {(applicant.customQuestions ?? []).map((q, i) => (
                    <li key={i} className="flex items-start gap-2 group">
                      <span className="text-xs text-purple-400 font-semibold mt-0.5 shrink-0">추{i + 1}.</span>
                      <span className="text-sm text-gray-700 flex-1">{q}</span>
                      <button onClick={() => removeApplicantQuestion(i)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-300">이 지원자에게만 할 질문을 추가하세요</p>
              )}
              <div className="flex gap-2 pt-1">
                <input
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addApplicantQuestion()}
                  placeholder="질문 추가..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addApplicantQuestion} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>

          {/* 오른쪽: 평가 */}
          <div className="space-y-4">

            {/* 평가 기준 + 점수 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">평가</h2>
                  {autoAvg && <span className="text-sm font-bold text-indigo-600">평균 {autoAvg}점</span>}
                </div>
                <button
                  onClick={() => { setEditingCriteria(v => !v); setDraftCriteria(settings.criteria) }}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                  title="평가 기준 편집"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {editingCriteria ? (
                <div className="space-y-2">
                  {draftCriteria.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <input
                        value={c.label}
                        onChange={e => setDraftCriteria(d => d.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={() => setDraftCriteria(d => d.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addCriterion} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                    <Plus className="w-3.5 h-3.5" />항목 추가
                  </button>
                  <button onClick={saveCriteria} className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors mt-2">
                    <Check className="w-3.5 h-3.5" />저장
                  </button>
                </div>
              ) : (
                <>
                  {settings.criteria.map(({ id, label }) => (
                    <DecimalRating key={id} label={label} value={scores[id] ?? 0} onChange={v => setScores(s => ({ ...s, [id]: v }))} />
                  ))}

                  {/* 종합 평가 점수 */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700 w-28 shrink-0">종합 평가</span>
                      <input
                        type="number"
                        min="0" max="5" step="0.1"
                        value={overallScore || ''}
                        onChange={e => {
                          const v = parseFloat(e.target.value)
                          setOverallScore(isNaN(v) ? 0 : Math.min(5, Math.max(0, v)))
                        }}
                        placeholder="0.0"
                        className="w-20 text-center border border-indigo-200 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-400">/ 5</span>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">메모</label>
                <textarea
                  className="w-full h-20 resize-none rounded-lg border border-gray-200 p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="면접 중 느낀 점..."
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                />
              </div>
              <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                평가 저장
              </button>
            </div>

            {/* 비교 */}
            {others.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">다른 지원자 비교 ({others.length}명 평균)</h2>
                {settings.criteria.map(({ id, label }) => (
                  <CompareBar key={id} label={label} value={scores[id] ?? 0} avgValue={avg(id)} />
                ))}
                <p className="text-xs text-gray-300">보라 = 현재 · 회색 = 평균</p>
              </div>
            )}
          </div>
        </div>

        {/* 녹음 패널 */}
        <RecordingPanel
          savedTranscript={applicant.transcript}
          onSave={(text) => onUpdate({ transcript: text })}
        />

        {/* AI 종합 평가 */}
        <AIComment
          applicant={applicant}
          scores={scores}
          criteria={settings.criteria}
          settingsApi={settingsApi}
          onSave={(result) => onUpdate({ aiComment: result })}
        />
      </main>
    </div>
  )
}
