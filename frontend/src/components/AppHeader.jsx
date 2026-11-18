import React from 'react'
import { useNavigate } from 'react-router-dom'
import { RiSettings3Line } from 'react-icons/ri'
import Brand from './Brand'
import ThemeToggle from './ThemeToggle'
import LogoutButton from './LogoutButton'

// Top bar for signed-in pages
function AppHeader({ showCustomize = false }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => navigate('/')} aria-label="Go to dashboard">
          <Brand />
        </button>
        <div className="flex items-center gap-2">
          {showCustomize && (
            <button type="button" className="btn btn-ghost px-3 sm:px-4" onClick={() => navigate('/customize')} aria-label="Customize assistant">
              <RiSettings3Line className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Customize</span>
            </button>
          )}
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
