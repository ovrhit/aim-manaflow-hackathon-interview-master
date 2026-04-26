import Groq from 'groq-sdk'

async function generateAppQuestions(clubName, clubCategory, clubDescription, criteria, presetName, apiKey) {
  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `당신은 동아리 지원서 질문을 설계하는 전문가입니다.
지원자가 구글폼에서 직접 작성할 지원서 질문을 생성하세요.
이름/학번/연락처 같은 기본 정보 항목은 제외합니다.
반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
{ "questions": [{ "title": "질문 제목" }, ...] }
규칙:
- 질문은 정확히 2~3개
- 모든 텍스트는 오직 한글(가-힣), 숫자, 문장부호만 사용
- 한자(漢字)·영어·중국어·일본어 등 한글이 아닌 문자는 단 한 글자도 절대 사용 금지
- 고유명사·전문용어도 반드시 한글로 풀어 쓸 것
- 예시: { "questions": [{ "title": "이 동아리에 지원하게 된 구체적인 계기가 무엇인가요?" }] }`,
      },
      {
        role: 'user',
        content: `동아리명: ${clubName}
활동 분야: ${clubCategory || '미지정'}
동아리 소개: ${clubDescription || '없음'}
평가 기준: ${criteria.map(c => c.label).join(', ')}
평가 방향: ${presetName}

위 정보를 바탕으로, 지원자의 진심과 역량을 파악할 수 있는 지원서 질문을 만들어주세요.
단순한 자기소개보다는 구체적인 경험, 동기, 태도를 드러낼 수 있는 질문으로 구성하세요.`,
      },
    ],
    response_format: { type: 'json_object' },
      temperature: 0.4,
  })

  const raw = completion.choices?.[0]?.message?.content
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.questions) ? parsed.questions : []
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { accessToken, clubName, clubCategory, clubDescription, deadline, criteria, presetName } = req.body ?? {}
  if (!accessToken) return res.status(401).json({ error: 'Google 인증이 필요합니다.' })
  if (!clubName?.trim()) return res.status(400).json({ error: '동아리 이름을 입력해주세요.' })

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' })

  try {
    // 1. AI로 본문 질문 생성
    const aiQuestions = await generateAppQuestions(
      clubName.trim(),
      clubCategory?.trim() ?? '',
      clubDescription?.trim() ?? '',
      criteria ?? [],
      presetName ?? '종합 평가',
      groqKey,
    )

    // 2. 기본 항목 + AI 항목 합치기
    const allItems = [
      { title: '이름', paragraph: false, required: true },
      { title: '학번', paragraph: false, required: true },
      { title: '연락처 (전화번호 또는 카카오톡 ID)', paragraph: false, required: true },
      ...aiQuestions.slice(0, 3).map(q => ({ title: q.title, paragraph: true, required: false })),
    ]

    // 3. Google Form 생성 (생성 시엔 title만 허용)
    const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: { title: `${clubName.trim()} 지원서` },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      if (createRes.status === 401) {
        return res.status(401).json({ error: 'Google 인증이 만료됐습니다. 다시 연결해주세요.' })
      }
      throw new Error(err.error?.message ?? 'Google Form 생성 실패')
    }

    const form = await createRes.json()
    const formId = form.formId

    // 4. description 설정 + 질문 항목 추가 (batchUpdate로만 가능)
    const description = [
      clubDescription?.trim(),
      deadline ? `지원 마감: ${deadline}` : null,
    ].filter(Boolean).join('\n')

    const itemRequests = allItems.map((q, i) => ({
      createItem: {
        item: {
          title: q.title,
          questionItem: {
            question: {
              required: q.required ?? false,
              textQuestion: { paragraph: q.paragraph !== false },
            },
          },
        },
        location: { index: i },
      },
    }))

    const requests = [
      ...(description ? [{
        updateFormInfo: {
          info: { description },
          updateMask: 'description',
        },
      }] : []),
      ...itemRequests,
    ]

    const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    })

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}))
      throw new Error(err.error?.message ?? '질문 추가 실패')
    }

    return res.status(200).json({
      formId,
      editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      responseUrl: `https://docs.google.com/forms/d/${formId}/viewform`,
      questions: allItems,
    })
  } catch (err) {
    console.error('[forms/create]', err.message)
    return res.status(500).json({ error: err.message ?? '폼 생성 중 오류가 발생했습니다.' })
  }
}
