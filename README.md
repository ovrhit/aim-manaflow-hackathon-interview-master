# 동아리 면접 도우미

AI 기반 동아리 면접 전 과정 자동화 도구

## 주요 기능

- **AI 면접 질문 생성** — 지원서를 붙여넣으면 맞춤 질문 5개 즉시 생성
- **실시간 음성 트랜스크립트** — 면접 중 대화 자동 기록
- **표준화 평가** — 항목별 점수 입력 + AI 종합 평가 (강점/우려사항/합격 판정)
- **합격 결정 관리** — 합격/보류/불합격 마킹, 순위표 자동 정렬
- **구글폼 자동 생성** — Google Forms API로 지원서 폼 즉시 제작

## 기술 스택

- Frontend: React + Vite + Tailwind CSS
- AI: Groq (LLaMA 3.3-70B)
- Deployment: Vercel
- Auth: Google OAuth 2.0

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local에 키 입력 후
npm run dev
```

## 환경 변수

```
GROQ_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```
