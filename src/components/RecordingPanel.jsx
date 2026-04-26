import { useState, useEffect } from 'react'
import { Mic, MicOff, Save, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import Toast from './Toast'

function Timer({ running }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) { setSeconds(0); return }
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return <span className="text-xs font-mono text-red-500">{m}:{s}</span>
}

export default function RecordingPanel({ savedTranscript, onSave }) {
  const { isListening, transcript, interimTranscript, error, supported, start, stop, reset } = useSpeechRecognition()
  const [showSaved, setShowSaved] = useState(!!savedTranscript)
  const [toastVisible, setToastVisible] = useState(false)

  function handleSave() {
    if (!transcript.trim()) return
    onSave(transcript)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  function handleReset() {
    stop()
    reset()
  }

  const displayTranscript = savedTranscript && !transcript ? savedTranscript : transcript

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <Toast message="트랜스크립트가 저장됐습니다" visible={toastVisible} />

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {isListening ? '녹음 중' : '면접 녹음'}
          </h2>
          {isListening && <Timer running={isListening} />}
        </div>
        <div className="flex items-center gap-2">
          {(transcript || savedTranscript) && !isListening && (
            <button
              onClick={() => setShowSaved(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showSaved ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showSaved ? '접기' : '트랜스크립트 보기'}
            </button>
          )}
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="px-5 py-4 flex items-center gap-3">
        {!supported ? (
          <p className="text-sm text-red-500">이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.</p>
        ) : (
          <>
            <button
              onClick={isListening ? stop : start}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isListening ? <><MicOff className="w-4 h-4" />녹음 중지</> : <><Mic className="w-4 h-4" />녹음 시작</>}
            </button>

            {transcript && !isListening && (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 border border-indigo-300 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  저장
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  초기화
                </button>
              </>
            )}
          </>
        )}

        {error && <p className="text-xs text-red-500 flex-1">{error}</p>}
      </div>

      {/* 실시간 인식 텍스트 */}
      {isListening && (
        <div className="px-5 pb-4 space-y-1">
          <div className="min-h-[60px] bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">
            <span className="text-gray-800">{transcript}</span>
            {interimTranscript && <span className="text-gray-400">{interimTranscript}</span>}
            {!transcript && !interimTranscript && (
              <span className="text-gray-300">말씀해주세요...</span>
            )}
          </div>
        </div>
      )}

      {/* 저장된 / 완성된 트랜스크립트 */}
      {(showSaved || transcript) && !isListening && displayTranscript && (
        <div className="px-5 pb-4">
          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayTranscript}</p>
          </div>
          {savedTranscript && !transcript && (
            <p className="text-xs text-gray-400 mt-1.5">마지막 저장: {new Date().toLocaleDateString('ko-KR')}</p>
          )}
        </div>
      )}
    </div>
  )
}
