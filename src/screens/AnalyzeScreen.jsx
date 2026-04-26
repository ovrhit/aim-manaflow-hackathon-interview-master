import { useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import NavBar from '../components/NavBar'

export default function AnalyzeScreen({ onHome, onBack, onSettings, onComplete, settingsApi }) {
  const [name, setName] = useState('')
  const [application, setApplication] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleAnalyze() {
    if (!name.trim()) { setError('지원자 이름을 입력해주세요.'); return }
    if (!application.trim()) { setError('지원서 내용을 입력해주세요.'); return }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application,
          preset: settingsApi?.settings?.promptPreset ?? 'comprehensive',
          customFocus: settingsApi?.settings?.customPresets?.find(
            p => p.id === settingsApi?.settings?.promptPreset
          )?.focus,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류가 발생했습니다.')
      setResult(data.result)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar onHome={onHome} onBack={onBack} onSettings={onSettings} title="새 지원자" />
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">지원자 이름</label>
          <input type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            placeholder="홍길동" value={name}
            onChange={e => setName(e.target.value)} disabled={!!result} />
        </section>

        <section>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">지원서 본문</label>
          <textarea
            className="w-full h-56 resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
            placeholder="지원서 내용을 여기에 붙여넣으세요..."
            value={application} onChange={e => setApplication(e.target.value)} disabled={!!result} />
        </section>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

        {!result && (
          <button onClick={handleAnalyze} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</> : '면접 질문 생성하기'}
          </button>
        )}

        {result && (
          <>
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">AI 분석 결과</h2>

              {/* 요약 */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">3줄 요약</p>
                <ul className="space-y-1">
                  {result.summary?.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 키워드 */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">핵심 키워드</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords?.map((k, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100">{k}</span>
                  ))}
                </div>
              </div>

              {/* 질문 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">추천 면접 질문</p>
                <ol className="space-y-2.5">
                  {result.questions?.map((q, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <div>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded mr-1.5 ${q.type === '모순검증' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>{q.type}</span>
                        <span className="text-sm text-gray-700">{q.question}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setResult(null); setError('') }}
                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-600 text-sm font-medium py-2.5 rounded-lg transition-colors">
                다시 생성
              </button>
              <button onClick={() => onComplete({ name: name.trim(), application: application.trim(), questions: result })}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                평가 시작하기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
