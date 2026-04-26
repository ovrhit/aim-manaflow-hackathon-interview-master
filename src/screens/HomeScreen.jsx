import { Plus, Trash2, Star, LayoutGrid, Settings, Users, CheckCircle2, ClipboardList, Mic } from 'lucide-react'

const DECISION_STYLE = {
  '합격':   'bg-emerald-100 text-emerald-700 border-emerald-200',
  '보류':   'bg-amber-100 text-amber-700 border-amber-200',
  '불합격': 'bg-red-100 text-red-700 border-red-200',
}

export default function HomeScreen({ applicants, settingsApi, onNew, onSelect, onOverview, onSettings, onDelete }) {
  const { settings } = settingsApi
  const notInterviewed = applicants.filter(a => !a.interviewed && !a.evaluated)
  const interviewed    = applicants.filter(a => a.interviewed && !a.evaluated)
  const evaluated      = applicants.filter(a => a.evaluated)
  const passed         = applicants.filter(a => a.decision === '합격').length

  const sections = [
    { key: 'notInterviewed', label: '면접 전',    color: 'text-gray-400',   list: notInterviewed },
    { key: 'interviewed',    label: '면접 완료',   color: 'text-indigo-400', list: interviewed },
    { key: 'evaluated',      label: '평가 완료',   color: 'text-violet-400', list: evaluated },
  ].filter(s => s.list.length > 0)

  const clubName    = settings.clubName?.trim()    || null
  const clubTagline = settings.clubTagline?.trim() || null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 그라디언트 헤더 */}
      <header className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 pt-7 pb-6 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-16 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-32 w-16 h-16 bg-violet-400/20 rounded-full" />

        <div className="max-w-3xl mx-auto relative">
          {/* 상단: 앱 브랜드 + 설정 */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-semibold text-indigo-300 bg-white/10 px-2.5 py-1 rounded-full tracking-wide">
              동아리 면접 도우미
            </span>
            <button onClick={onSettings} className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10" title="설정">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* 중앙: 동아리 이름 + 소개 */}
          <div className="mb-5">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
              {clubName ?? '내 동아리'}
            </h1>
            <p className="text-indigo-200 text-sm mt-1.5 leading-relaxed">
              {clubTagline ?? 'AI 기반 지원자 평가 시스템'}
            </p>
            {applicants.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                  <Users className="w-3 h-3 text-white/70" />
                  <span className="text-xs text-white font-medium">전체 {applicants.length}명</span>
                </div>
                {(interviewed.length + evaluated.length) > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                    <Mic className="w-3 h-3 text-indigo-200" />
                    <span className="text-xs text-white font-medium">면접 {interviewed.length + evaluated.length}명</span>
                  </div>
                )}
                {evaluated.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span className="text-xs text-white font-medium">평가 {evaluated.length}명</span>
                  </div>
                )}
                {passed > 0 && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-400/30 rounded-full px-3 py-1">
                    <span className="text-xs text-emerald-200 font-semibold">합격 {passed}명</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단: 액션 버튼 */}
          <div className="flex items-center justify-end gap-2">
            {applicants.length > 0 && (
              <button onClick={onOverview}
                className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 transition-all">
                <LayoutGrid className="w-3.5 h-3.5" />
                전체 현황
              </button>
            )}
            <button onClick={onNew}
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg px-4 py-1.5 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              새 지원자
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-7">
        {applicants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7 text-indigo-500" />
            </div>
            <p className="text-gray-700 font-medium mb-1">아직 등록된 지원자가 없어요</p>
            <p className="text-gray-400 text-sm mb-6">지원서를 붙여넣으면 AI가 면접 질문을 만들어드려요</p>
            <button onClick={onNew}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200">
              <Plus className="w-4 h-4" />
              첫 지원자 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-7">
            {sections.map(({ key, label, color, list }) => (
              <section key={key}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  {label} <span className={`${color}`}>({list.length})</span>
                </h2>
                <div className="space-y-2">
                  {list.map(a => (
                    <ApplicantRow key={a.id} applicant={a} onSelect={onSelect} onDelete={onDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ApplicantRow({ applicant, onSelect, onDelete }) {
  const scoreVals = Object.values(applicant.scores ?? {}).filter(v => typeof v === 'number' && v > 0)
  const avg = applicant.evaluated && scoreVals.length
    ? (scoreVals.reduce((s, v) => s + v, 0) / scoreVals.length).toFixed(1)
    : null

  return (
    <div
      className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-px transition-all border border-gray-100 hover:border-indigo-100"
      onClick={() => onSelect(applicant.id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          applicant.evaluated ? 'bg-violet-400' : applicant.interviewed ? 'bg-indigo-400' : 'bg-amber-400'
        }`} />
        <span className="font-semibold text-gray-800 truncate">{applicant.name}</span>
        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{applicant.createdAt}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {avg && (
          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-sm font-bold px-2.5 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-indigo-400 stroke-indigo-400" />
            {avg}
          </div>
        )}
        {applicant.decision && (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${DECISION_STYLE[applicant.decision]}`}>
            {applicant.decision}
          </span>
        )}
        {!applicant.interviewed && !applicant.evaluated && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 font-medium">미면접</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(applicant.id) }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
