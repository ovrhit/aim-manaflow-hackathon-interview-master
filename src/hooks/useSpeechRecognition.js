import { useState, useRef, useCallback, useEffect } from 'react'

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export function useSpeechRecognition({ lang = 'ko-KR', continuous = true } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')
  const supported = !!SpeechRecognitionAPI

  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (final) setTranscript(prev => prev + final)
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': '마이크 접근 권한이 없습니다. 브라우저 설정에서 허용해주세요.',
        'no-speech':   '음성이 감지되지 않았습니다.',
        'network':     '네트워크 오류로 음성 인식에 실패했습니다.',
        'aborted':     '',
      }
      const msg = messages[event.error] ?? `음성 인식 오류: ${event.error}`
      if (msg) setError(msg)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    return () => recognition.abort()
  }, [lang, continuous])

  const start = useCallback(async () => {
    if (!supported) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.')
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: 'microphone' })
      if (permission.state === 'denied') {
        setError('마이크 접근 권한이 거부됐습니다. 브라우저 주소창 왼쪽 자물쇠 아이콘에서 허용해주세요.')
        return
      }
    } catch {
      // permissions API를 지원하지 않는 브라우저는 그냥 진행 (start()에서 자체 처리)
    }

    setTranscript('')
    setInterimTranscript('')
    setError('')
    recognitionRef.current?.start()
  }, [supported])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError('')
  }, [])

  return { isListening, transcript, interimTranscript, error, supported, start, stop, reset }
}
