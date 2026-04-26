import { useState, useEffect } from 'react'

const TOKEN_KEY = 'google_access_token'
const EXPIRES_KEY = 'google_token_expires'

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const expires = parseInt(localStorage.getItem(EXPIRES_KEY) ?? '0')
    return token && expires > Date.now() ? token : null
  })
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('google_token')
    const expires = params.get('google_expires')
    const error = params.get('google_error')

    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      if (expires) localStorage.setItem(EXPIRES_KEY, expires)
      setAccessToken(token)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      setAuthError(decodeURIComponent(error))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  function connect() {
    window.location.href = '/api/auth/google'
  }

  function disconnect() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    setAccessToken(null)
  }

  return {
    isConnected: !!accessToken,
    accessToken,
    authError,
    connect,
    disconnect,
  }
}
