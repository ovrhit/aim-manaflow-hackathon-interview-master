import { useState } from 'react'
import { Clipboard, ClipboardCheck, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function App() {
  const [application, setApplication] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleAnalyze() {
    if (!application.trim()) {
      setError('지원서 내용을 입력해주세요.')
      return
    }
    setError('')
    setResult('')
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application }),
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

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-indigo-600">동아리 면접 도우미</h1>
        <p className="text-sm text-gray-500 mt-0.5">지원서를 붙여넣으면 AI가 핵심 면접 질문을 생성합니다</p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 입력 영역 */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지원서 본문
          </label>
          <textarea
            className="w-full h-52 resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="지원서 내용을 여기에 붙여넣으세요..."
            value={application}
            onChange={(e) => setApplication(e.target.value)}
          />
        </section>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* 분석 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              분석 중...
            </>
          ) : (
            '면접 질문 생성하기'
          )}
        </button>

        {/* 결과 영역 */}
        {result && (
          <section className="relative border border-gray-200 rounded-lg p-5 bg-gray-50">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
              title="복사"
            >
              {copied ? <ClipboardCheck className="w-4 h-4 text-indigo-500" /> : <Clipboard className="w-4 h-4" />}
            </button>
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
