import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `
당신은 냉정하고 경험 많은 동아리 선배입니다.
후배를 뽑는 최종 결정권자로서, 감정 없이 데이터에 근거해 평가합니다.
좋게 봐주려는 경향, 막연한 칭찬, 근거 없는 비판은 모두 금지합니다.

아래 JSON 스키마를 반드시 지켜서 한국어로 응답하세요.
마크다운 코드 블록 없이 JSON 객체만 출력하세요.

{
  "verdict": "강력추천" | "추천" | "보류" | "비추천",
  "aiScore": <0.0 ~ 5.0 소수점 한 자리, AI가 독립적으로 산정한 종합 점수>,
  "strengths": ["구체적 강점1", "구체적 강점2", "구체적 강점3"],
  "weaknesses": ["구체적 약점 또는 우려사항1", "구체적 약점 또는 우려사항2"],
  "criteriaEval": [
    { "criterion": "평가 항목명", "comment": "해당 항목에 대한 한 줄 날카로운 평가" }
  ],
  "summary": "전반적인 종합 소견 (3~4문장, 가장 날카롭고 핵심적인 내용만)",
  "oneliner": "최종 한 줄 추천/비추천 이유"
}

verdict 기준:
- 강력추천: 뽑지 않으면 손해, 명확한 이유가 있음
- 추천: 뽑을 만하다, 큰 우려 없음
- 보류: 뽑고 싶지만 불확실한 요소가 있음, 추가 확인 필요
- 비추천: 현 시점에서 함께하기 어려운 이유가 명확함

강점/약점은 "성실해 보인다" 같은 인상이 아니라
지원서·면접 내용·평가 점수에서 근거를 찾아 구체적으로 작성하세요.
`.trim()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { application, transcript, scores, criteria, questions, presetName } = req.body ?? {}
  if (!application?.trim()) return res.status(400).json({ error: '지원서 내용이 없습니다.' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' })

  const criteriaText = criteria?.length
    ? criteria.map(c => `- ${c.label}: ${scores?.[c.id] ?? '미입력'}점`).join('\n')
    : '평가 항목 없음'

  const questionsText = Array.isArray(questions) && questions.length
    ? questions.map((q, i) => `${i + 1}. [${q.type ?? ''}] ${q.question}`).join('\n')
    : '질문 없음'

  const userMessage = `
=== 지원서 ===
${application.trim()}

=== 면접 질문 (AI 생성) ===
${questionsText}

=== 면접 트랜스크립트 ===
${transcript?.trim() || '(기록 없음)'}

=== 면접관 평가 점수 ===
평가 방향: ${presetName ?? '종합 평가'}
${criteriaText}

위 내용을 바탕으로 설정된 평가 기준 범주에 맞게 정성적으로 평가하고,
종합 점수와 강점 및 약점을 최대한 날카롭고 객관적으로 작성하세요.
`.trim()

  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    const raw = completion.choices?.[0]?.message?.content
    if (!raw) return res.status(500).json({ error: 'AI 응답이 비어있습니다. 다시 시도해주세요.' })
    let parsed
    try { parsed = JSON.parse(raw) }
    catch { return res.status(500).json({ error: 'AI 응답 파싱 실패. 다시 시도해주세요.' }) }

    return res.status(200).json({ result: parsed })
  } catch (err) {
    console.error('[evaluate]', err.message)
    return res.status(500).json({ error: err.message ?? 'AI 평가 중 오류가 발생했습니다.' })
  }
}
