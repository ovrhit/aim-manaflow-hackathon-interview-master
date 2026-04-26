import Groq from 'groq-sdk'

const BASE_PERSONA = `
당신은 경험 많은 동아리 선배입니다.
후배를 뽑는 입장에서 지원서를 읽고, 같이 활동할 사람으로서 솔직하게 판단하세요.
화려한 스펙보다 진심과 태도를 중요하게 봅니다.
`.trim()

const BASE_FORMAT = `
아래 JSON 스키마를 **반드시** 지켜서 한국어로 응답하세요.
마크다운 코드 블록 없이 JSON 객체만 출력하세요.

{
  "summary": ["지원자 핵심 인상 문장1", "문장2", "문장3"],
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "questions": [
    { "type": "<아래 유형 중 하나>", "question": "질문 내용" },
    { "type": "...", "question": "..." },
    { "type": "...", "question": "..." },
    { "type": "...", "question": "..." },
    { "type": "...", "question": "..." }
  ]
}

사용 가능한 질문 유형 (상황에 맞게 자유롭게 선택):
- 진심도: 이 활동/동아리에 얼마나 진심인지 확인
- 성실성: 꾸준함, 책임감, 마감 준수 태도 확인
- 팀적합도: 팀원들과 잘 어울릴 수 있는지, 소통 방식 확인
- 열정: 지원 동기와 지속 의지 탐구
- 경험탐구: 지원서에 언급된 경험의 실체 파악
- 모순짚기: 지원서에서 앞뒤가 안 맞거나 과장된 부분 확인
- 역량확인: 실제 역할 수행 가능성 검증

규칙:
- questions는 반드시 5개
- 질문은 지원서 내용을 직접 언급하며 구체적으로
- 추상적인 질문("열정이 있나요?") 금지 — 반드시 지원서 내용을 근거로
- 말투는 딱딱하지 않게, 선배가 후배에게 묻는 느낌으로
`.trim()

export const PRESETS = {
  comprehensive: {
    name: '종합 평가',
    description: '진심, 성실성, 팀 적합도를 균형 있게',
    focus: `
열정, 성실성, 팀 적합도, 역량을 골고루 파악하세요.
한 가지에 치우치지 말고, 이 사람이 "같이 활동할 만한 사람인가?"를 전체적으로 판단하세요.
모순이 보이면 반드시 짚어주세요.
    `.trim(),
  },
  passion: {
    name: '열정 위주',
    description: '이 동아리/활동에 얼마나 진심인가',
    focus: `
이 지원자가 얼마나 진심으로 이 동아리를 원하는지 집중적으로 파악하세요.
지원 동기가 구체적인지, 다른 곳에도 쓸 수 있는 뻔한 내용인지 날카롭게 보세요.
오래 함께할 수 있을지, 중간에 흥미를 잃지 않을지 확인하세요.
    `.trim(),
  },
  diligence: {
    name: '성실성 위주',
    description: '꾸준함, 책임감, 마감 준수',
    focus: `
실력보다 태도를 봅니다. 이 사람이 맡은 일을 끝까지 해내는 사람인지 파악하세요.
힘든 상황에서 어떻게 행동했는지, 포기한 경험은 없는지, 마감을 어긴 적은 없는지 확인하세요.
지원서에서 과장하거나 책임을 회피하는 표현이 있다면 반드시 짚어주세요.
    `.trim(),
  },
  sociability: {
    name: '친화력 위주',
    description: '팀원과의 융화, 소통 방식',
    focus: `
이 사람이 기존 팀원들과 잘 어울릴 수 있는지 파악하세요.
갈등 상황에서 어떻게 행동하는지, 의견 충돌이 생기면 어떻게 해결하는지 확인하세요.
혼자 잘하는 사람보다 같이 잘하는 사람인지가 핵심입니다.
    `.trim(),
  },
  skills: {
    name: '역량 및 팀플레이',
    description: '실제 역할 수행 능력과 협업 경험',
    focus: `
이 동아리에서 맡게 될 역할을 실제로 해낼 수 있는지 검증하세요.
지원서에 적힌 경험과 역량이 과장되지 않았는지, 팀 프로젝트에서 어떤 역할을 했는지 구체적으로 파악하세요.
"같이 일하고 싶은 사람인가?"를 기준으로 질문하세요.
    `.trim(),
  },
}

function buildSystemPrompt(preset, customFocus) {
  const focus = customFocus || PRESETS[preset]?.focus || PRESETS.comprehensive.focus
  return `${BASE_PERSONA}\n\n평가 방향:\n${focus}\n\n${BASE_FORMAT}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { application, preset = 'comprehensive', customFocus } = req.body ?? {}
  if (!application?.trim()) {
    return res.status(400).json({ error: '지원서 내용이 없습니다.' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' })
  }

  try {
    const groq = new Groq({ apiKey })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt(preset, customFocus) },
        { role: 'user', content: application },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const raw = completion.choices?.[0]?.message?.content
    if (!raw) return res.status(500).json({ error: 'AI 응답이 비어있습니다. 다시 시도해주세요.' })
    let parsed
    try { parsed = JSON.parse(raw) } catch {
      return res.status(500).json({ error: 'AI 응답 파싱 실패. 다시 시도해주세요.' })
    }

    const result = {
      summary: Array.isArray(parsed.summary) ? parsed.summary.slice(0, 3) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      questions: Array.isArray(parsed.questions)
        ? parsed.questions.slice(0, 5).map(q => ({ type: q.type ?? '', question: q.question ?? '' }))
        : [],
      preset: PRESETS[preset]?.name ?? preset,
    }

    return res.status(200).json({ result })
  } catch (err) {
    console.error('[analyze]', err.message)
    return res.status(500).json({ error: err.message ?? 'AI 분석 중 오류가 발생했습니다.' })
  }
}
