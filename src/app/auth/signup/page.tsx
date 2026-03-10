'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== password2) { setError('Passwords do not match'); return }
    if (password.length < 8)    { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.875rem', fontSize: '0.9rem',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text)' }}>
            Fresh<span style={{ color: 'var(--green)' }}>ESG</span>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginTop: '0.4rem' }}>SECR Emissions Platform</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', boxShadow: 'var(--shadow)' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Check your email</h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <a href="/auth/login" style={{ display: 'inline-block', marginTop: '1.25rem', color: 'var(--green)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                Back to sign in →
              </a>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create account</h1>

              {error && (
                <div style={{ padding: '0.75rem', background: 'var(--red-light)', border: '1px solid #f5c6c6', borderRadius: 'var(--radius-xs)', color: 'var(--red)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.35rem' }}>Email address</label>
                  <input style={inp} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.35rem' }}>Password</label>
                  <input style={inp} type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.35rem' }}>Confirm password</label>
                  <input style={inp} type="password" required value={password2} onChange={e => setPassword2(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: '0.7rem', background: loading ? 'var(--border)' : 'var(--green)', color: loading ? 'var(--text-3)' : '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.25rem',
                }}>
                  {loading ? 'Creating account…' : 'Create account →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '1.25rem' }}>
                Already have an account?{' '}
                <a href="/auth/login" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
