import { useState } from 'react'

const KEY = 'interview-settings-v1'

const DEFAULTS = {
  clubName: '',
  clubTagline: '',
  criteria: [
    { id: 'fit', label: '직무 적합도' },
    { id: 'communication', label: '소통 능력' },
    { id: 'passion', label: '열정' },
  ],
  commonQuestions: [],
  promptPreset: 'comprehensive',
  customPresets: [],
}

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return DEFAULTS }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  function persist(updater) {
    setSettings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  function updateCriteria(criteria) {
    persist(prev => ({ ...prev, criteria }))
  }

  function updateCommonQuestions(commonQuestions) {
    persist(prev => ({ ...prev, commonQuestions }))
  }

  function updatePromptPreset(promptPreset) {
    persist(prev => ({ ...prev, promptPreset }))
  }

  function updateCustomPresets(customPresets) {
    persist(prev => ({ ...prev, customPresets }))
  }

  function updateClubInfo(clubName, clubTagline) {
    persist(prev => ({ ...prev, clubName, clubTagline }))
  }

  return { settings, updateCriteria, updateCommonQuestions, updatePromptPreset, updateCustomPresets, updateClubInfo }
}
