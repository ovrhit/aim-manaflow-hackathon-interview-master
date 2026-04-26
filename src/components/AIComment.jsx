import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const VERDICT_STYLE = {
  '강력추천': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  '추천':     { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  '보류':     { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  '비추천':   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500' },
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">AI 종합 평가</h2>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button onClick={handleEvaluate} disabled={loading} className="text-gray-300 hover:text-indigo-500 transition-colors" title="재평가">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {result && (
            <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* 평가 요청 버튼 */}
        {!result && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              지원서, 면접 트랜스크립트, 평가 점수를 종합해 AI가 날카롭게 분석합니다.
            </p>
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</>
                : <><Sparkles className="w-4 h-4" />AI 종합 평가 받기</>
              }
            </button>
          </div>
        )}

        {/* 로딩 (결과 있을 때 재평가) */}
        {loading && result && (
          <div className="flex items-center gap-2 text-sm text-indigo-500">
            <Loader2 className="w-4 h-4 animate-spin" />재분석 중...
          </div>
        )}

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        {/* 결과 */}
        {result && !loading && expanded && (
          <div className="space-y-4">
            {/* 판정 + 점수 */}
            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${style.bg} ${style.border}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className={`font-bold text-base ${style.text}`}>{result.verdict}</span>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${style.text}`}>{result.aiScore}<span className="text-sm font-normal opacity-60"> / 5</span></p>
                <p className="text-xs text-gray-400">AI 종합 점수</p>
              </div>
            </div>

            {/* 한 줄 소견 */}
            <p className="text-sm text-gray-700 font-medium leading-relaxed border-l-2 border-indigo-300 pl-3">
              {result.oneliner}
            </p>

            {/* 강점 / 약점 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">강점</p>
                <ul className="space-y-1">
                  {result.strengths?.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-emerald-500 shrink-0 mt-0.5">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">우려사항</p>
                <ul className="space-y-1">
                  {result.weaknesses?.map((w, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                      <span className="text-red-400 shrink-0 mt-0.5">−</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 기준별 평가 */}
            {result.criteriaEval?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">항목별 소견</p>
                <div className="space-y-1.5">
                  {result.criteriaEval.map((c, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="font-medium text-gray-500 shrink-0 w-20 truncate">{c.criterion}</span>
                      <span className="text-gray-600">{c.comment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 종합 소견 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">종합 소견</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
