export default async function handler(req, res) {
  const { code, error } = req.query

  if (error || !code) {
    return res.redirect('/?google_error=' + encodeURIComponent(error ?? 'cancelled'))
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/callback'

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    const tokens = await tokenRes.json()
    if (tokens.error) throw new Error(tokens.error_description ?? tokens.error)

    const params = new URLSearchParams({
      google_token: tokens.access_token,
      google_expires: String(Date.now() + tokens.expires_in * 1000),
    })
    res.redirect(`/?${params}`)
  } catch (err) {
    console.error('[auth/callback]', err.message)
    res.redirect('/?google_error=' + encodeURIComponent(err.message))
  }
}
