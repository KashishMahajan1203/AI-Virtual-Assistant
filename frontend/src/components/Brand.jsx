import React from 'react'

// App logo mark + name
function Brand({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#4f6bff" />
        <g fill="#fff">
          <rect x="7" y="13" width="3" height="6" rx="1.5" />
          <rect x="12" y="9" width="3" height="14" rx="1.5" />
          <rect x="17" y="6" width="3" height="20" rx="1.5" />
          <rect x="22" y="11" width="3" height="10" rx="1.5" />
        </g>
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">Virtual Assistant</span>
    </div>
  )
}

export default Brand
