import { useState } from 'react'
import { Plus, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import NavBar from '../components/NavBar'
import Toast from '../components/Toast'

const BUILT_IN_PRESETS = [
  { id: 'comprehensive', name: '종합 평가',       description: '진심, 성실성, 팀 적합도를 균형 있게' },
  { id: 'passion',       name: '열정 위주',        description: '이 동아리/활동에 얼마나 진심인가' },
  { id: 'diligence',     name: '성실성 위주',      description: '꾸준함, 책임감, 마감 준수' },
  { id: 'sociability',   name: '친화력 위주',      description: '팀원과의 융화, 소통 방식' },
  { id: 'skills',        name: '역량 및 팀플레이', description: '실제 역할 수행 능력과 협업 경험' },
]

export default function SettingsScreen({ settingsApi, onHome, onBack, onSettings }) {
  const { settings, updateCriteria, updateCommonQuestions, updatePromptPreset, updateCustomPresets } = settingsApi

  const [criteria, setCriteria]               = useState(settings.criteria)
  const [commonQuestions, setCommonQuestions] = useState(settings.commonQuestions)
  const [selectedPreset, setSelectedPreset]   = useState(settings.promptPreset)
  const [customPresets, setCustomPresets]     = useState(settings.customPresets ?? [])

  const [newCriterion, setNewCriterion]   = useState('')
  const [newQuestion, setNewQuestion]     = useState('')
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetFocus, setNewPresetFocus] = useState('')
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [toast, setToast] = useState(false)

  function saveAll() {
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

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onHome={onHome} onBack={onBack} title="설정" />
      <Toast message="설정이 저장됐습니다" visible={toast} />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">

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

        <button onClick={saveAll} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors">
          설정 저장
        </button>
      </main>
    </div>
  )
}
