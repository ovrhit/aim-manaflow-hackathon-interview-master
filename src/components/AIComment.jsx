import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const VERDICT_STYLE = {
  '강력추천': { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  '추천':     { bg: 'bg-blue-500',    light: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  '보류':     { bg: 'bg-amber-400',   light: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  '비추천':   { bg: 'bg-red-500',     light: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700' },
}

export default function AIComment({ applicant, scores, criteria, settingsApi, onSave }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(applicant.aiComment ?? null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(true)

  const presetName = settingsApi?.settings?.promptPreset
    ? (settingsApi.settings.customPresets?.find(p => p.id === settingsApi.settings.promptPreset)?.name
      ?? { comprehensive:'종합 평가', passion:'열정 위주', diligence:'성실성 위주', sociability:'친화력 위주', skills:'역량 및 팀플레이' }[settingsApi.settings.promptPreset]
      ?? settingsApi.settings.promptPreset)
    : '종합 평가'

  async function handleEvaluate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application: applicant.application,
          transcript: applicant.transcript ?? '',
          scores,
          criteria,
          questions: Array.isArray(applicant.questions?.questions)
            ? applicant.questions.questions
            : [],
          presetName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '오류가 발생했습니다.')
      setResult(data.result)
      setExpanded(true)
      onSave?.(data.result)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const style = result ? (VERDICT_STYLE[result.verdict] ?? VERDICT_STYLE['보류']) : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">AI 종합 평가</h2>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button onClick={handleEvaluate} disabled={loading}
              className="text-gray-300 hover:text-indigo-500 transition-colors p-1 rounded-lg hover:bg-indigo-50" title="재평가">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {result && (
            <button onClick={() => setExpanded(v => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* 평가 요청 버튼 */}
        {!result && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              지원서, 면접 트랜스크립트, 평가 점수를 종합해 AI가 날카롭게 분석합니다.
            </p>
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-indigo-400 disabled:to-violet-400 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-md shadow-indigo-100"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</>
                : <><Sparkles className="w-4 h-4" />AI 종합 평가 받기</>
              }
            </button>
          </div>
        )}

        {loading && result && (
          <div className="flex items-center gap-2 text-sm text-indigo-500 py-1">
            <Loader2 className="w-4 h-4 animate-spin" />재분석 중...
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{error}</p>
        )}

        {/* 결과 */}
        {result && !loading && expanded && (
          <div className="space-y-4">
            {/* 판정 + 점수 */}
            <div className={`rounded-xl border p-4 ${style.light} ${style.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shadow-sm`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className={`text-base font-bold ${style.text}`}>{result.verdict}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{presetName} 기준</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${style.text}`}>{result.aiScore}</p>
                  <p className="text-xs text-gray-400">/ 5.0</p>
                </div>
              </div>
            </div>

            {/* 한 줄 소견 */}
            <div className="flex gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="w-0.5 shrink-0 rounded-full bg-indigo-400 self-stretch" />
              <p className="text-sm text-gray-700 font-medium leading-relaxed">{result.oneliner}</p>
            </div>

            {/* 강점 / 약점 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">강점</p>
                <ul className="space-y-1.5">
                  {result.strengths?.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-emerald-500 shrink-0 font-bold mt-0.5">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">우려사항</p>
                <ul className="space-y-1.5">
                  {result.weaknesses?.map((w, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-red-400 shrink-0 font-bold mt-0.5">−</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 기준별 평가 */}
            {result.criteriaEval?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">항목별 소견</p>
                <div className="space-y-2">
                  {result.criteriaEval.map((c, i) => (
                    <div key={i} className="flex gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-indigo-500 shrink-0 w-20 truncate">{c.criterion}</span>
                      <span className="text-gray-600">{c.comment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 종합 소견 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">종합 소견</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
