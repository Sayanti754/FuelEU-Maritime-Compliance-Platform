import React from 'react';

interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
}
export function Badge({ variant, children }: BadgeProps) {
  const styles = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    danger:  'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info:    'bg-sky-100 text-sky-800 border border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}
export function KpiCard({ label, value, unit, highlight }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-5 border ${highlight ? 'bg-ocean-900 border-ocean-700 text-white' : 'bg-white border-slate-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${highlight ? 'text-ocean-300' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold font-mono ${highlight ? 'text-white' : 'text-slate-900'}`}>
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        {unit && <span className={`text-sm font-normal ml-1 ${highlight ? 'text-ocean-300' : 'text-slate-500'}`}>{unit}</span>}
      </p>
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-2 border-ocean-200 border-t-ocean-600 ${sizes[size]}`} />
    </div>
  );
}

export function ErrorAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-fade-in">
      <span className="text-lg leading-none">⚠️</span>
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold">✕</button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-slate-700 font-semibold text-lg">{title}</h3>
      {description && <p className="text-slate-500 text-sm mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}
export function Select({ label, options, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
        {...props}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-ocean-600 text-white hover:bg-ocean-700 active:bg-ocean-800 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost:     'text-ocean-600 hover:bg-ocean-50',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export function Input({ label, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <input
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100"
        {...props}
      />
    </label>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
