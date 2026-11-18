import React, { useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { RiLogoutBoxRLine } from 'react-icons/ri'
import { userDataContext } from '../context/userDataContext'

// Log-out button with a confirmation dialog
function LogoutButton() {
  const { serverUrl, setUserData } = useContext(userDataContext)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    cancelRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const handleLogOut = async () => {
    setLoading(true)
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setLoading(false)
      setUserData(null)
      navigate('/signin')
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost px-3 sm:px-4" onClick={() => setOpen(true)} aria-label="Log out">
        <RiLogoutBoxRLine className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Log out</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            className="card fade-up w-full max-w-[400px] p-6"
          >
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-danger-soft text-danger">
              <RiLogoutBoxRLine className="h-5 w-5" />
            </div>
            <h2 id="logout-title" className="text-lg font-semibold">Log out of your assistant?</h2>
            <p id="logout-description" className="mt-1.5 text-sm text-muted">You can sign back in whenever you’re ready.</p>
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleLogOut} disabled={loading}>
                {loading ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default LogoutButton
