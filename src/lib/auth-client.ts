import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
})

export const { useSession } = authClient

export async function signInWithGoogle(callbackURL = '/dashboard') {
  const result = await authClient.signIn.social({
    provider: 'google',
    callbackURL,
  })

  if (result?.error) {
    throw new Error(result.error.message || 'Google sign-in failed')
  }

  if (result?.data?.url) {
    window.location.href = result.data.url
    return result.data
  }

  return result
}

export async function signOut(callbackURL = '/sign-in') {
  try {
    await authClient.signOut()
  } catch (err) {
    console.warn('[auth-client] Sign out error:', err)
  }

  // Clear any fallback demo tokens
  document.cookie = 'better-auth.session_token=; path=/; max-age=0; SameSite=Lax'
  document.cookie = '__Secure-better-auth.session_token=; path=/; max-age=0; SameSite=Lax'
  document.cookie = 'demo_session_token=; path=/; max-age=0; SameSite=Lax'

  window.location.href = callbackURL
}
