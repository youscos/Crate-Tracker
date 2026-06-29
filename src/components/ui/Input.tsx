import { forwardRef, InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, icon, suffix, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input
        ref={ref}
        className={`
          w-full bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
          transition-colors duration-200
          ${icon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} py-3
          ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</div>}
    </div>
    {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
