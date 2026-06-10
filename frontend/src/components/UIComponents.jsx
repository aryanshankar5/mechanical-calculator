import React from 'react';

/**
 * Header Component - Professional header with gradient background
 */
export function Header({ title, subtitle, onBackClick, logo }) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-6">
          {logo && (
            <img 
              src={logo} 
              alt="SAIL Logo" 
              className="h-16 w-auto"
            />
          )}
          {onBackClick && (
            <button
              onClick={onBackClick}
              className="bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Section Component - Container for grouped input fields
 */
export function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-8 border border-slate-100">
      <h2 className="text-xl font-bold text-slate-900 mb-6">{title}</h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/**
 * Input Component - Reusable number input with unit label
 */
export function Input({ label, value, onChange, unit, placeholder, min, max, step = 0.01 }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex gap-3">
        <input
          type="number"
          className="flex-1 border-2 border-slate-200 rounded-xl p-3 text-base font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 placeholder-slate-400"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder || 'Enter value'}
          min={min}
          max={max}
          step={step}
        />
        {unit && (
          <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center font-semibold text-slate-700 whitespace-nowrap min-w-fit">
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Select Component - Reusable dropdown selector
 */
export function Select({ label, value, options, onChange, placeholder = 'Select an option', unit }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex gap-3">
        <select
          className="flex-1 border-2 border-slate-200 rounded-xl p-3 text-base font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {unit && (
          <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center font-semibold text-slate-700 whitespace-nowrap min-w-fit">
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ResultCard Component - Display calculation results
 */
export function ResultCard({ title, value, unit, icon, highlight = false }) {
  return (
    <div className="rounded-2xl p-6 transition-all duration-200 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 hover:border-slate-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide mb-3 text-slate-600">
            {title}
          </p>
          <p className="text-4xl font-bold tracking-tight text-slate-900">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </p>
          {unit && (
            <p className="text-sm font-medium mt-2 text-slate-600">
              {unit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Button Component - Primary action button
 */
export function Button({ children, onClick, disabled = false, variant = 'primary', className = '' }) {
  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500',
    secondary:
      'bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 disabled:from-slate-400 disabled:to-slate-500',
    success:
      'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:from-slate-400 disabled:to-slate-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * ResultsContainer - Container for results section
 */
export function ResultsContainer({ title, children, isEmpty }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 sticky top-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">{title}</h2>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4 opacity-20">📈</div>
          <p className="text-slate-500 text-lg">Perform a calculation to view results</p>
        </div>
      ) : (
        <div className="grid gap-5">{children}</div>
      )}
    </div>
  );
}

/**
 * FormSection - Main container for form inputs
 */
export function FormSection({ children }) {
  return <div className="space-y-6">{children}</div>;
}

/**
 * ButtonGroup - Container for action buttons
 */
export function ButtonGroup({ children }) {
  return <div className="flex gap-4 mt-8">{children}</div>;
}

/**
 * LoadingSpinner - Loading indicator
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
    </div>
  );
}

/**
 * EmptyState - Display when no results
 */
export function EmptyState({ title, description, icon = '📋' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500">{description}</p>
    </div>
  );
}
