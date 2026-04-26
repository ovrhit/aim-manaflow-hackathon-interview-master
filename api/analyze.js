import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `
당신은 경험 많은 시니어 인사 담당자입니다.
아래 동아리 지원서를 분석하고 다음 형식으로 한국어로 답변하세요:

## 3줄 요약
(지원자의 핵심을 3줄로 요약)

## 핵심 키워드
(쉼표로 구분된 5개 이내의 키워드)

## 추천 면접 질문
**[모순/검증] 1.** (지원서의 모순점을 찌르는 날카로운 질문)
**[모순/검증] 2.** (지원서의 모순점을 찌르는 날카로운 질문)
**[역량] 3.** (핵심 역량을 검증하는 질문)
**[역량] 4.** (핵심 역량을 검증하는 질문)
**[역량] 5.** (핵심 역량을 검증하는 질문)
`.trim()

export default async function handler(req, res) {
  console.log('[analyze] method:', req.method)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { application } = req.body ?? {}
  console.log('[analyze] application length:', application?.length)

  if (!application?.trim()) {
    return res.status(400).json({ error: '지원서 내용이 없습니다.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  console.log('[analyze] apiKey present:', !!apiKey)

  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    console.log('[analyze] calling Gemini...')
    const result = await model.generateContent(application)
    const text = result.response.text()
    console.log('[analyze] success, length:', text.length)

    return res.status(200).json({ result: text })
  } catch (err) {
    console.error('[analyze] error:', err.message)
    return res.status(500).json({ error: err.message ?? 'AI 분석 중 오류가 발생했습니다.' })
  }
}
