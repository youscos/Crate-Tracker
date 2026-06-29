import { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option { value: string; label: string }

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
}

const Select = forwardRef<HTMLSelectElement, Props>(({ label, error, options, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`
          w-full bg-slate-800 border border-slate-600 rounded-xl text-white
          focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
          transition-colors duration-200 pl-4 pr-10 py-3 appearance-none cursor-pointer
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
    {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
  </div>
))

Select.displayName = 'Select'
export default Select
