import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import Database from 'better-sqlite3'

export type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export type AppSession = {
  user: SessionUser
  session: {
    id: string
    userId: string
    token: string
    expiresAt: Date
  }
}

// Local SQLite database for persistent session and user management
const db = new Database('auth.sqlite')

// Ensure Better Auth tables exist
db.exec(`
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt DATETIME NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id),
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt DATETIME,
  refreshTokenExpiresAt DATETIME,
  scope TEXT,
  password TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME
);
`)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || 'hackathon-voice-auth-secret-32-chars-minimum',
  database: db,

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  plugins: [nextCookies()],
})

/**
 * Server-side session resolver for App Router and layouts.
 * Checks for authentic Better Auth sessions.
 */
export async function getSession(reqHeaders?: Headers): Promise<AppSession | null> {
  try {
    if (reqHeaders) {
      const realSession = await auth.api.getSession({ headers: reqHeaders })
      if (realSession?.user) {
        return realSession as unknown as AppSession
      }
    }
  } catch (err) {
    console.error('[auth.ts] getSession error:', err)
  }

  // Fallback demo session ONLY if a demo token cookie was explicitly set
  const cookieHeader = reqHeaders?.get('cookie') || ''
  if (cookieHeader.includes('demo_session_token')) {
    return {
      user: {
        id: 'user_judge_demo',
        name: 'Demo Voice Judge',
        email: 'judge@rime-hackathon.dev',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session_demo_auth',
        userId: 'user_judge_demo',
        token: 'dev_mock_token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    }
  }

  return null
}
