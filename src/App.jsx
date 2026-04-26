import { useState } from 'react'
import { useApplicants } from './hooks/useApplicants'
import { useSettings } from './hooks/useSettings'
import HomeScreen from './screens/HomeScreen'
import AnalyzeScreen from './screens/AnalyzeScreen'
import EvaluateScreen from './screens/EvaluateScreen'
import OverviewScreen from './screens/OverviewScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const { applicants, addApplicant, updateApplicant, deleteApplicant } = useApplicants()
  const settingsApi = useSettings()

  const [stack, setStack] = useState([{ screen: 'home', applicantId: null }])
  const current = stack[stack.length - 1]
  const canGoBack = stack.length > 1

  const go = (screen, applicantId = null) => setStack(s => [...s, { screen, applicantId }])
  const back = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s)
  const goHome = () => setStack([{ screen: 'home', applicantId: null }])
  const goSettings = () => go('settings')

  const currentApplicant = applicants.find(a => a.id === current.applicantId)

  const nav = {
    onHome: goHome,
    onBack: canGoBack ? back : null,
    onSettings: goSettings,
  }

  return (
    <div className="min-h-screen">
      {current.screen === 'home' && (
        <HomeScreen
          applicants={applicants}
          onNew={() => go('analyze')}
          onSelect={(id) => go('evaluate', id)}
          onOverview={() => go('overview')}
          onSettings={goSettings}
          onDelete={deleteApplicant}
        />
      )}
      {current.screen === 'analyze' && (
        <AnalyzeScreen
          {...nav}
          settingsApi={settingsApi}
          onComplete={(data) => {
            const created = addApplicant(data)
            go('evaluate', created.id)
          }}
        />
      )}
      {current.screen === 'evaluate' && currentApplicant && (
        <EvaluateScreen
          {...nav}
          applicant={currentApplicant}
          allApplicants={applicants}
          settingsApi={settingsApi}
          onOverview={() => go('overview')}
          onUpdate={(updates) => updateApplicant(currentApplicant.id, updates)}
        />
      )}
      {current.screen === 'overview' && (
        <OverviewScreen
          {...nav}
          applicants={applicants}
          settingsApi={settingsApi}
          onSelect={(id) => go('evaluate', id)}
        />
      )}
      {current.screen === 'settings' && (
        <SettingsScreen
          {...nav}
          settingsApi={settingsApi}
        />
      )}
    </div>
  )
}
