'use client'

import React, { useState } from 'react'
import { AudioWaveform, Loader2, Sparkles, UserCheck } from 'lucide-react'
import { signInWithGoogle, signInAsGuest } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle('/dashboard')
    } catch (err) {
      console.error('[SignInPage] Google sign in error:', err)
      setError((err as Error).message || 'Could not initiate Google sign in. Please check your credentials.')
      setLoading(false)
    }
  }

  const handleGuestSignIn = async () => {
    setGuestLoading(true)
    await signInAsGuest('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 select-none">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background font-mono font-bold">
            <AudioWaveform className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-xs text-muted-foreground">
              Voice-Native App · Rime Hackathon
            </p>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-border bg-muted p-3 text-xs text-foreground font-mono"
          >
            {error}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={loading || guestLoading}
            onClick={handleGoogleSignIn}
            className="w-full font-mono text-xs gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-2 text-[10px] uppercase font-mono text-muted-foreground">
              Or Instant Demo
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading || guestLoading}
            onClick={handleGuestSignIn}
            className="w-full font-mono text-xs gap-2 cursor-pointer border-border hover:bg-muted"
          >
            <UserCheck className="h-4 w-4" />
            {guestLoading ? 'Entering Demo...' : 'Enter as Demo Judge'}
          </Button>

          <p className="text-[11px] text-muted-foreground leading-normal">
            Monochrome Grayscale UI with full session-gated App Router protection.
          </p>
        </div>
      </div>
    </main>
  )
}
