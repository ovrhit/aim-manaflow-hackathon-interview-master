import { useState } from 'react'
import { Plus, X, GripVertical, ChevronDown, ChevronUp, FileText, ExternalLink, Loader2, Link } from 'lucide-react'
import NavBar from '../components/NavBar'
import Toast from '../components/Toast'

const BUILT_IN_PRESETS = [
  { id: 'comprehensive', name: '종합 평가',       description: '진심, 성실성, 팀 적합도를 균형 있게' },
  { id: 'passion',       name: '열정 위주',        description: '이 동아리/활동에 얼마나 진심인가' },
  { id: 'diligence',     name: '성실성 위주',      description: '꾸준함, 책임감, 마감 준수' },
  { id: 'sociability',   name: '친화력 위주',      description: '팀원과의 융화, 소통 방식' },
  { id: 'skills',        name: '역량 및 팀플레이', description: '실제 역할 수행 능력과 협업 경험' },
]

export default function SettingsScreen({ settingsApi, googleAuth, onHome, onBack, onSettings }) {
  const { settings, updateCriteria, updateCommonQuestions, updatePromptPreset, updateCustomPresets, updateClubInfo } = settingsApi

  const [clubName, setClubName]         = useState(settings.clubName ?? '')
  const [clubTagline, setClubTagline]   = useState(settings.clubTagline ?? '')

  const [criteria, setCriteria]               = useState(settings.criteria)
  const [commonQuestions, setCommonQuestions] = useState(settings.commonQuestions)
  const [selectedPreset, setSelectedPreset]   = useState(settings.promptPreset)
  const [customPresets, setCustomPresets]     = useState(settings.customPresets ?? [])

  const [newCriterion, setNewCriterion]     = useState('')
  const [newQuestion, setNewQuestion]       = useState('')
  const [newPresetName, setNewPresetName]   = useState('')
  const [newPresetFocus, setNewPresetFocus] = useState('')
  const [showAddPreset, setShowAddPreset]   = useState(false)
  const [toast, setToast]                   = useState(false)

  // 지원서 폼 생성 상태
  const [formClubName, setFormClubName]           = useState(settings.clubName ?? '')
  const [clubCategory, setClubCategory]           = useState('')
  const [formClubDescription, setFormClubDescription] = useState(settings.clubTagline ?? '')
  const [deadline, setDeadline]                   = useState('')
  const [formLoading, setFormLoading]             = useState(false)
  const [formResult, setFormResult]               = useState(null)
  const [formError, setFormError]                 = useState('')

  function saveAll() {
    const trimmedName = clubName.trim()
    const trimmedTagline = clubTagline.trim()
    updateClubInfo(trimmedName, trimmedTagline)
    // 폼 섹션 필드가 비어있으면 동아리 정보로 자동 채우기
    if (!formClubName.trim() && trimmedName) setFormClubName(trimmedName)
    if (!formClubDescription.trim() && trimmedTagline) setFormClubDescription(trimmedTagline)
    updateCriteria(criteria.filter(c => c.label.trim()))
    updateCommonQuestions(commonQuestions.filter(q => q.trim()))
    updatePromptPreset(selectedPreset)
    updateCustomPresets(customPresets.filter(p => p.name.trim()))
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  function addCriterion() {
    if (!newCriterion.trim()) return
    setCriteria(c => [...c, { id: `custom_${Date.now()}`, label: newCriterion.trim() }])
    setNewCriterion('')
  }

  function addQuestion() {
    if (!newQuestion.trim()) return
    setCommonQuestions(q => [...q, newQuestion.trim()])
    setNewQuestion('')
  }

  function addCustomPreset() {
    if (!newPresetName.trim() || !newPresetFocus.trim()) return
    setCustomPresets(p => [...p, { id: `preset_${Date.now()}`, name: newPresetName.trim(), focus: newPresetFocus.trim() }])
    setNewPresetName('')
    setNewPresetFocus('')
    setShowAddPreset(false)
  }

  async function handleCreateForm() {
    if (!formClubName.trim()) { setFormError('동아리 이름을 입력해주세요.'); return }
    setFormLoading(true)
    setFormError('')
    setFormResult(null)
    try {
      const presetLabel = BUILT_IN_PRESETS.find(p => p.id === selectedPreset)?.name
        ?? customPresets.find(p => p.id === selectedPreset)?.name
        ?? '종합 평가'
      const res = await fetch('/api/forms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleAuth.accessToken,
          clubName: formClubName.trim(),
          clubCategory: clubCategory.trim(),
          clubDescription: formClubDescription.trim(),
          deadline: deadline || null,
          criteria,
          presetName: presetLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) googleAuth.disconnect()
        throw new Error(data.error ?? '폼 생성 실패')
      }
      setFormResult(data)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onHome={onHome} onBack={onBack} title="설정" />
      <Toast message="설정이 저장됐습니다" visible={toast} />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* 동아리 정보 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">동아리 정보</h2>
            <p className="text-xs text-gray-400 mt-0.5">홈 화면에 표시됩니다.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">동아리 이름</label>
              <input
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                placeholder="예) NEXUS, 크리에이티브랩"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">한 줄 소개</label>
              <input
                value={clubTagline}
                onChange={e => setClubTagline(e.target.value)}
                placeholder="예) 앱 기획부터 런칭까지 경험하는 IT 창업 동아리"
                maxLength={60}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* 프롬프트 프리셋 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">면접 질문 스타일</h2>
            <p className="text-xs text-gray-400 mt-0.5">AI가 어떤 방향으로 질문을 생성할지 결정합니다.</p>
          </div>

          <div className="space-y-2">
            {allPresets.map(p => (
              <label
                key={p.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPreset === p.id
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="preset"
                  value={p.id}
                  checked={selectedPreset === p.id}
                  onChange={() => setSelectedPreset(p.id)}
                  className="mt-0.5 accent-indigo-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    {!BUILT_IN_PRESETS.find(b => b.id === p.id) && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">커스텀</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.description ?? (p.focus ? p.focus.slice(0, 60) + (p.focus.length > 60 ? '...' : '') : '')}
                  </p>
                </div>
                {!BUILT_IN_PRESETS.find(b => b.id === p.id) && (
                  <button
                    onClick={e => { e.preventDefault(); setCustomPresets(d => d.filter(x => x.id !== p.id)) }}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </label>
            ))}
          </div>

          {/* 커스텀 프리셋 추가 */}
          <div>
            <button
              onClick={() => setShowAddPreset(v => !v)}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              {showAddPreset ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              커스텀 스타일 추가
            </button>

            {showAddPreset && (
              <div className="mt-3 space-y-2 p-3 border border-dashed border-indigo-200 rounded-lg">
                <input
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="스타일 이름 (예: 기획 역량 집중)"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  value={newPresetFocus}
                  onChange={e => setNewPresetFocus(e.target.value)}
                  placeholder={`AI에게 전달할 평가 방향을 자유롭게 작성하세요.\n예: 기획력과 논리적 사고를 집중적으로 검증하세요. 지원서에서 근거 없는 주장이 있다면 반드시 짚어주세요.`}
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addCustomPreset}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  추가
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 평가 기준 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">평가 기준</h2>
            <p className="text-xs text-gray-400 mt-0.5">0 ~ 5점 소수점 입력 가능. 항목은 자유롭게 수정하세요.</p>
          </div>
          <ul className="space-y-2">
            {criteria.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <input
                  value={c.label}
                  onChange={e => setCriteria(d => d.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => setCriteria(d => d.filter((_, j) => j !== i))} disabled={criteria.length <= 1} className="text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input value={newCriterion} onChange={e => setNewCriterion(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCriterion()} placeholder="새 평가 항목..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={addCriterion} className="px-3 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </section>

        {/* 공통 질문 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">공통 질문</h2>
            <p className="text-xs text-gray-400 mt-0.5">모든 면접자에게 공통으로 표시됩니다.</p>
          </div>
          {commonQuestions.length > 0 ? (
            <ul className="space-y-2">
              {commonQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input value={q} onChange={e => setCommonQuestions(d => d.map((x, j) => j === i ? e.target.value : x))} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => setCommonQuestions(d => d.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors mt-1"><X className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-300 py-2">등록된 공통 질문이 없습니다</p>
          )}
          <div className="flex gap-2">
            <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuestion()} placeholder="공통 질문 추가..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={addQuestion} className="px-3 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </section>

        {/* Google Forms 지원서 생성 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">지원서 폼 자동 생성</h2>
              <p className="text-xs text-gray-400 mt-0.5">Google Forms로 지원서를 AI가 자동으로 만들어드립니다.</p>
            </div>
            <FileText className="w-4 h-4 text-gray-300" />
          </div>

          {googleAuth?.authError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{googleAuth.authError}</p>
          )}

          {!googleAuth?.isConnected ? (
            <button
              onClick={() => googleAuth?.connect()}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google 계정으로 연결
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Google 계정 연결됨
                </span>
                <button onClick={() => googleAuth.disconnect()} className="text-gray-400 hover:text-red-400 transition-colors">
                  연결 해제
                </button>
              </div>

              <div className="space-y-3">
                {/* 동아리 이름 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">동아리 이름 <span className="text-red-400">*</span></label>
                  <input
                    value={formClubName}
                    onChange={e => setFormClubName(e.target.value)}
                    placeholder="예) NEXUS, 크리에이티브랩"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 활동 분야 칩 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">활동 분야</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['개발/IT', '디자인', '기획/마케팅', '사진/영상', '음악/공연', '체육/스포츠', '봉사', '학술/스터디', '기타'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setClubCategory(c => c === cat ? '' : cat)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          clubCategory === cat
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 한 줄 소개 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">한 줄 소개</label>
                  <input
                    value={formClubDescription}
                    onChange={e => setFormClubDescription(e.target.value)}
                    placeholder="예) 앱 기획부터 런칭까지 경험하는 IT 창업 동아리"
                    maxLength={60}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 마감 기한 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">지원 마감일</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  />
                </div>

                <button
                  onClick={handleCreateForm}
                  disabled={formLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {formLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />AI가 질문 생성 중...</>
                    : <><FileText className="w-4 h-4" />지원서 폼 생성하기</>
                  }
                </button>
              </div>

              {formError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
              )}

              {formResult && (
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-emerald-700">폼이 생성됐습니다!</p>
                  <div className="space-y-2">
                    <a
                      href={formResult.responseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-2 hover:border-emerald-400 transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-700">지원자 링크</p>
                        <p className="text-xs text-gray-400 truncate max-w-[260px]">{formResult.responseUrl}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                    <a
                      href={formResult.editUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-700">편집 링크</p>
                        <p className="text-xs text-gray-400">Google Forms에서 직접 수정</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </a>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(formResult.responseUrl) }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <Link className="w-3 h-3" />
                    지원자 링크 복사
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <button onClick={saveAll} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors">
          설정 저장
        </button>
      </main>
    </div>
  )
}
