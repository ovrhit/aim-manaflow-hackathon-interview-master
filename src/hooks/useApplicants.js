import { useState } from 'react'

const KEY = 'applicants-v1'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function useApplicants() {
  const [applicants, setApplicants] = useState(load)

  function persist(updater) {
    setApplicants(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  function addApplicant({ name, application, questions }) {
    const next = {
      id: Date.now(),
      name,
      application,
      questions,
      scores: {},
      memo: '',
      transcript: '',
      customQuestions: [],
      createdAt: new Date().toLocaleString('ko-KR'),
      evaluated: false,
    }
    persist(prev => [next, ...prev])
    return next
  }

  function updateApplicant(id, updates) {
    persist(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  function deleteApplicant(id) {
    persist(prev => prev.filter(a => a.id !== id))
  }

  return { applicants, addApplicant, updateApplicant, deleteApplicant }
}
