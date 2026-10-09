import React from 'react'
import { RiMicLine, RiSearchLine, RiPaletteLine } from 'react-icons/ri'
import bg from '../assets/authBg.png'
import Brand from './Brand'
import ThemeToggle from './ThemeToggle'

const highlights = [
  { icon: RiMicLine, text: 'Wake it by name and talk hands-free' },
  { icon: RiSearchLine, text: 'Search Google and YouTube by voice' },
  { icon: RiPaletteLine, text: 'Give it your own name and look' },
]

// Split-screen layout shared by the sign-in and sign-up pages
function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden overflow-hidden bg-cover bg-center lg:flex"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30" />
        <div className="relative flex w-full flex-col justify-between p-10 text-white">
          <Brand />
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">Your voice. Your assistant.</h2>
            <p className="mt-3 text-base text-slate-300">
              A personal AI assistant that listens for its name, answers questions and gets things done.
            </p>
            <ul className="mt-8 space-y-3">
              {highlights.map((highlight) => {
                const HighlightIcon = highlight.icon
                return (
                  <li key={highlight.text} className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 backdrop-blur">
                      <HighlightIcon className="h-4 w-4" />
                    </span>
                    {highlight.text}
                  </li>
                )
              })}
            </ul>
          </div>
          <p className="text-xs text-slate-400">Secured with JWT sessions, bcrypt hashing and rate limiting.</p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 lg:justify-end">
          <Brand className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="fade-up w-full max-w-[400px]">{children}</div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
