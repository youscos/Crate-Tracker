import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Eye, EyeOff, Lock, Mail, Package } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')

  if (user) return <Navigate to="/dashboard" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Renseignez vos identifiants')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message === 'Invalid login credentials' ? 'Identifiants incorrects' : error.message)
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Renseignez votre email')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`
    })
    if (error) toast.error(error.message)
    else { toast.success('Email de réinitialisation envoyé'); setMode('login') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-amber-500 mx-auto flex items-center justify-center mb-4 shadow-xl shadow-amber-500/30">
            <Package className="w-10 h-10 text-slate-900" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CrateTracker</h1>
          <p className="text-slate-400 mt-1 text-sm">Suivi de caisses chantier</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-bold text-white mb-5">
            {mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}
          </h2>

          <form onSubmit={mode === 'login' ? handleLogin : handleReset} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="vous@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            {mode === 'login' && (
              <Input
                label="Mot de passe"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                suffix={
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-slate-400 hover:text-white transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="current-password"
                required
              />
            )}

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {mode === 'login' ? 'Se connecter' : 'Envoyer le lien'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <button onClick={() => setMode('reset')} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Mot de passe oublié ?
              </button>
            ) : (
              <button onClick={() => setMode('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                ← Retour à la connexion
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2025 CrateTracker · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
