import React, { useContext, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { RiArrowLeftLine } from 'react-icons/ri'
import { userDataContext } from '../context/userDataContext'
import AppHeader from '../components/AppHeader'
import StepHeader from '../components/StepHeader'

const nameSuggestions = ["Jarvis", "Nova", "Shifra", "Echo", "Friday"]

function Customize2() {
    const { userData, backendImage, frontendImage, selectedImage, serverUrl, setUserData } = useContext(userDataContext)
    const [assistantName, setAssistantName] = useState(userData?.assistantName || "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const previewImage = selectedImage === "input" ? frontendImage : selectedImage || userData?.assistantImage
    const trimmedName = assistantName.trim()

    // Save assistant name + image to the backend
    const handleUpdateAssistant = async (event) => {
        event.preventDefault()
        if (!trimmedName) return
        setError("")
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("assistantName", trimmedName)
            if (backendImage) {
                formData.append("assistantImage", backendImage)  // Newly uploaded file
            } else {
                const imageUrl = selectedImage && selectedImage !== "input"
                    ? selectedImage
                    : userData?.assistantImage
                if (!imageUrl) throw new Error("Select an assistant image before continuing.")
                formData.append("imageUrl", imageUrl)       // Preset or current image
            }

            const result = await axios.post(`${serverUrl}/api/user/update`, formData, { withCredentials: true })
            setUserData(result.data)
            navigate("/")
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Could not save assistant settings. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
                <button type="button" className="btn btn-ghost mb-6 px-3" onClick={() => navigate("/customize")}>
                    <RiArrowLeftLine className="h-[18px] w-[18px]" />
                    Back
                </button>

                <StepHeader
                    step={2}
                    total={2}
                    title="Give your assistant a name"
                    description="You'll say this name to wake it up, so pick something short and easy to pronounce."
                />

                <div className="card grid gap-6 p-5 sm:grid-cols-[200px_1fr] sm:p-7">
                    <div className="mx-auto aspect-[3/4] w-40 overflow-hidden rounded-2xl bg-surface-2 sm:w-full">
                        {previewImage && <img src={previewImage} alt="Selected assistant" className="h-full w-full object-cover" />}
                    </div>

                    <form className="flex flex-col" onSubmit={handleUpdateAssistant}>
                        <label htmlFor="assistant-name" className="text-sm font-medium">Assistant name</label>
                        <input
                            id="assistant-name"
                            type="text"
                            placeholder="e.g. Shifra"
                            className="field mt-1.5 h-12 text-base"
                            maxLength={40}
                            autoFocus
                            required
                            value={assistantName}
                            onChange={(e) => setAssistantName(e.target.value)}
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                            {nameSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition
                                        ${trimmedName === suggestion ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:border-accent hover:text-fg"}`}
                                    onClick={() => setAssistantName(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 rounded-xl bg-surface-2 p-4 text-sm">
                            <p className="text-muted">Try saying</p>
                            <p className="mt-1 font-medium">“{trimmedName || "…"}, what's the time?”</p>
                        </div>

                        {error && <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

                        <button type="submit" className="btn btn-primary mt-6 h-12 w-full sm:mt-auto" disabled={loading || !trimmedName}>
                            {loading ? "Saving…" : userData?.assistantName ? "Save changes" : "Create my assistant"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}

export default Customize2
