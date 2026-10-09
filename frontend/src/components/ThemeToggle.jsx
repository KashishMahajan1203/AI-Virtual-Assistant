import React, { useState } from 'react'
import { RiMoonClearLine, RiSunLine } from 'react-icons/ri'

// Switches between light and dark themes and remembers the choice
function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const isDark = theme === 'dark'

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    try {
      localStorage.setItem('theme', nextTheme)
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit
    }
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? <RiSunLine className="h-5 w-5" /> : <RiMoonClearLine className="h-5 w-5" />}
    </button>
  )
}

export default ThemeToggle
