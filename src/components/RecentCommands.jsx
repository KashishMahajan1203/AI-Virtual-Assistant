import React, { useContext, useState } from 'react'
import axios from 'axios'
import { RiHistoryLine, RiPencilLine, RiDeleteBin6Line, RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { userDataContext } from '../context/userDataContext'

const PREVIEW_COUNT = 6

// Command history card: run again, edit, delete or clear
function RecentCommands({ onRun, onEdited, disabled }) {
  const { userData, setUserData, serverUrl, handleCurrentUser } = useContext(userDataContext)
  const history = userData?.history || []
  const [showAll, setShowAll] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  // Newest first; keep each item's real index in user.history for the API
  const items = history.map((command, index) => ({ command, index })).reverse()
  const visibleItems = showAll ? items : items.slice(0, PREVIEW_COUNT)

  const updateHistory = async (method, path, data) => {
    setBusy(true)
    setError('')
    try {
      const result = await axios({ method, url: `${serverUrl}/api/user/history${path}`, data, withCredentials: true })
      setUserData((current) => current && { ...current, history: result.data.history })
      return true
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update your history. Please try again.')
      if (requestError.response?.status === 409) handleCurrentUser()   // Our copy is stale; reload it
      return false
    } finally {
      setBusy(false)
    }
  }

  const startEditing = ({ command, index }) => {
    setEditingIndex(index)
    setDraft(command)
    setError('')
  }

  const saveEdit = async (event, { command, index }) => {
    event.preventDefault()
    const newCommand = draft.trim()
    if (!newCommand) return
    if (newCommand === command || await updateHistory('patch', `/${index}`, { command, newCommand })) {
      setEditingIndex(null)
      onEdited?.(newCommand)   // Drop the edited text into the chat box so it can be sent
    }
  }

  const deleteItem = ({ command, index }) => updateHistory('delete', `/${index}`, { command })

  const clearAll = async () => {
    if (await updateHistory('delete', '')) {
      setConfirmClear(false)
      setShowAll(false)
    }
  }

  return (
    <section className="card fade-up p-5 sm:p-6">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RiHistoryLine className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold">Recent commands</h2>
        </div>
        {history.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted">Clear all?</span>
              <button type="button" className="rounded-md px-2 py-1 font-semibold text-danger hover:bg-danger-soft" onClick={clearAll} disabled={busy}>Yes</button>
              <button type="button" className="rounded-md px-2 py-1 font-medium text-muted hover:bg-surface-2" onClick={() => setConfirmClear(false)}>No</button>
            </div>
          ) : (
            <button type="button" className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-danger" onClick={() => setConfirmClear(true)}>
              Clear all
            </button>
          )
        )}
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing yet. Your last few commands will be listed here.</p>
      ) : (
        <ul className={`mt-3 divide-y divide-line ${showAll ? 'max-h-80 overflow-y-auto pr-1' : ''}`}>
          {visibleItems.map((item) => (
            <li key={item.index} className="py-1.5">
              {editingIndex === item.index ? (
                <form className="flex items-center gap-1.5" onSubmit={(event) => saveEdit(event, item)}>
                  <input
                    className="field h-9 rounded-lg px-3 text-sm"
                    aria-label="Edit command"
                    maxLength={2000}
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Escape') setEditingIndex(null) }}
                  />
                  <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg disabled:opacity-60" aria-label="Save command" disabled={busy || !draft.trim()}>
                    <RiCheckLine className="h-4 w-4" />
                  </button>
                  <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Cancel editing" onClick={() => setEditingIndex(null)}>
                    <RiCloseLine className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRun(item.command)}
                    className="min-w-0 flex-1 truncate py-1 text-left text-sm transition hover:text-accent disabled:opacity-50"
                    title="Run again"
                  >
                    {item.command}
                  </button>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
                    aria-label={`Edit “${item.command}”`}
                    title="Edit"
                    onClick={() => startEditing(item)}
                    disabled={busy}
                  >
                    <RiPencilLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
                    aria-label={`Delete “${item.command}”`}
                    title="Delete"
                    onClick={() => deleteItem(item)}
                    disabled={busy}
                  >
                    <RiDeleteBin6Line className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > PREVIEW_COUNT && (
        <button type="button" className="mt-2 text-xs font-semibold text-accent hover:underline" onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Show less' : `Show all (${items.length})`}
        </button>
      )}
    </section>
  )
}

export default RecentCommands
