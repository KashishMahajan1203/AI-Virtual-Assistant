import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/userDataContext'
import defaultAssistantImage from "../assets/image1.png"
import { RiMicLine, RiMicOffLine, RiSendPlane2Fill, RiLightbulbFlashLine, RiChat3Line } from "react-icons/ri";
import AppHeader from '../components/AppHeader'
import RecentCommands from '../components/RecentCommands'

// Friendly labels for the action the assistant took
const actionLabels = {
  "google-search": "Opened Google search",
  "youtube-search": "Opened YouTube search",
  "youtube-play": "Opened YouTube",
  "calculator-open": "Opened calculator",
  "instagram-open": "Opened Instagram",
  "facebook-open": "Opened Facebook",
  "weather-show": "Opened weather",
}

const suggestions = [
  "What's the time?",
  "What day is it today?",
  "Search React hooks on Google",
  "Play lofi music on YouTube",
  "Show me the weather",
  "Who created you?",
]

function Home() {
  const { userData, setUserData, getGeminiResponse } = useContext(userDataContext)
  const assistantName = userData?.assistantName || "Assistant"
  const assistantImage = userData?.assistantImage || defaultAssistantImage

  // Local state for speech recognition and conversation
  const [listening, setListening] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceError, setVoiceError] = useState("")
  const [assistantError, setAssistantError] = useState("")
  const [messages, setMessages] = useState([])    // Conversation for this session
  const [typedCommand, setTypedCommand] = useState("")
  const isSpeakingRef = useRef(false)       // Tracks if AI is currently speaking
  const recognitionRef = useRef(null)       // Speech recognition instance
  const isRecognizingRef = useRef(false)    // Tracks if recognition is active
  const micEnabledRef = useRef(true)
  const isBusyRef = useRef(false)           // Processing or speaking: recognition stays off
  const processingRef = useRef(false)
  const utteranceRef = useRef(null)         // Latest utterance, so stale callbacks are ignored
  const runCommandRef = useRef(null)
  const assistantNameRef = useRef(assistantName)
  const greetingNameRef = useRef(userData?.name)
  const conversationEndRef = useRef(null)
  const typedInputRef = useRef(null)

  // Start speech recognition if not already speaking or recognizing
  const startRecognition = useCallback(() => {
    if (micEnabledRef.current && !isBusyRef.current && !isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start()
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          setVoiceError("Microphone could not start. Check your browser permissions.")
        }
      }
    }
  }, [])

  const toggleMicrophone = () => {
    const nextEnabled = !micEnabledRef.current
    micEnabledRef.current = nextEnabled
    setMicEnabled(nextEnabled)
    setVoiceError("")

    if (nextEnabled) {
      startRecognition()
    } else {
      recognitionRef.current?.stop()
      isRecognizingRef.current = false
      setListening(false)
    }
  }

  const finishSpeaking = () => {
    isSpeakingRef.current = false
    isBusyRef.current = false
    setSpeaking(false)
  }

  // Convert AI text to speech
  const speak = (text) => {
    const synth = window.speechSynthesis
    if (!synth) {
      isBusyRef.current = false
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'hi-IN'
    const hindiVoice = synth.getVoices().find(v => v.lang === 'hi-IN')
    if (hindiVoice) utterance.voice = hindiVoice

    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return
      finishSpeaking()
      setTimeout(startRecognition, 800) // Restart recognition after AI finishes speaking
    }
    utterance.onerror = (event) => {
      if (utteranceRef.current !== utterance) return
      finishSpeaking()
      if (event.error !== "interrupted" && event.error !== "canceled") {
        setVoiceError("Voice playback failed. Check your device audio settings.")
      }
      startRecognition()
    }

    utteranceRef.current = utterance
    isSpeakingRef.current = true
    isBusyRef.current = true
    setSpeaking(true)
    synth.cancel()   // Cancel any ongoing speech
    synth.speak(utterance)
  }

  // Trigger browser actions like search and navigation for the AI result
  const handleCommand = (data) => {
    const { type, userInput, response } = data
    speak(response)

    switch (type) {
      case "google-search":
        window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, "_blank", "noopener")
        break
      case "calculator-open":
        window.open(`https://www.google.com/search?q=calculator`, "_blank", "noopener")
        break
      case "instagram-open":
        window.open(`https://www.instagram.com/`, "_blank", "noopener")
        break
      case "facebook-open":
        window.open(`https://www.facebook.com/`, "_blank", "noopener")
        break
      case "weather-show":
        window.open(`https://www.google.com/search?q=weather`, "_blank", "noopener")
        break
      case "youtube-search":
      case "youtube-play":
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`, "_blank", "noopener")
        break
      default:
        break
    }
  }

  // Send a spoken or typed command to the assistant
  const runCommand = async (text) => {
    const command = text.trim()
    if (!command || processingRef.current) return

    setAssistantError("")
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: command }].slice(-20))
    processingRef.current = true
    isBusyRef.current = true
    setProcessing(true)
    recognitionRef.current?.stop()

    // The server records every authenticated command in history, even when the AI call fails
    const addToHistory = () => setUserData((current) => current && { ...current, history: [...(current.history || []), command].slice(-500) })

    try {
      const data = await getGeminiResponse(command)
      addToHistory()
      if (!data?.response) throw new Error("The assistant could not respond. Please try again.")
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: data.response, type: data.type }].slice(-20))
      handleCommand(data)
    } catch (error) {
      if (error.response && error.response.status !== 401) addToHistory()
      setAssistantError(error.response?.data?.response || error.response?.data?.message || error.message || "The assistant could not respond. Please try again.")
      isBusyRef.current = false
      if (micEnabledRef.current) setTimeout(startRecognition, 800)
    } finally {
      processingRef.current = false
      setProcessing(false)
    }
  }

  // Keep refs in sync so long-lived speech callbacks always use the latest values
  useEffect(() => {
    runCommandRef.current = runCommand
    assistantNameRef.current = assistantName
  })

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, processing])

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceSupported(false)
      setMicEnabled(false)
      micEnabledRef.current = false
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognitionRef.current = recognition

    let isMounted = true

    // Start recognition after the initial greeting has had time to play.
    const startTimeout = setTimeout(() => {
      if (isMounted) startRecognition()
    }, 2500)

    recognition.onstart = () => { isRecognizingRef.current = true; setListening(true) }
    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      if (isMounted && micEnabledRef.current && !isBusyRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) startRecognition()
        }, 1000)
      }
    }
    recognition.onerror = (event) => {
      isRecognizingRef.current = false
      setListening(false)
      if (event.error === "not-allowed" || event.error === "service-not-allowed" || event.error === "audio-capture") {
        micEnabledRef.current = false
        setMicEnabled(false)
        setVoiceError("Microphone access is blocked. Allow microphone permission and turn it back on.")
      } else if (event.error !== "aborted" && isMounted && micEnabledRef.current && !isBusyRef.current) {
        setTimeout(() => { if (isMounted) startRecognition() }, 1000)
      }
    }
    recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      // Only respond when the assistant is called by name
      if (transcript.toLowerCase().includes(assistantNameRef.current.toLowerCase())) {
        isRecognizingRef.current = false
        setListening(false)
        runCommandRef.current(transcript)
      }
    }

    // Initial greeting when page loads
    if (window.speechSynthesis) {
      const greeting = new SpeechSynthesisUtterance(`Hello ${greetingNameRef.current || "there"}, what can I help you with?`)
      greeting.lang = 'hi-IN'
      greeting.onstart = () => { isSpeakingRef.current = true; setSpeaking(true) }
      greeting.onend = greeting.onerror = () => {
        isSpeakingRef.current = false
        setSpeaking(false)
        startRecognition()
      }
      window.speechSynthesis.speak(greeting)
    }

    return () => {
      isMounted = false
      clearTimeout(startTimeout)
      recognition.stop()
      window.speechSynthesis?.cancel()
      isRecognizingRef.current = false
      isSpeakingRef.current = false
      isBusyRef.current = false
    }
  }, [startRecognition])

  const handleTypedSubmit = (event) => {
    event.preventDefault()
    runCommand(typedCommand)
    setTypedCommand("")
  }

  // Put an edited history command into the chat box, ready to send
  const fillChatBox = (command) => {
    setTypedCommand(command)
    const input = typedInputRef.current
    if (!input) return
    input.focus()
    input.scrollIntoView({ behavior: "smooth", block: "center" })
    requestAnimationFrame(() => input.setSelectionRange(command.length, command.length))  // Cursor at the end
  }

  const status = !voiceSupported
    ? { label: "Voice input not supported in this browser", tone: "bg-muted" }
    : speaking ? { label: "Speaking", tone: "bg-accent" }
    : processing ? { label: "Thinking…", tone: "bg-warn" }
    : listening ? { label: `Listening for “${assistantName}”`, tone: "bg-success" }
    : micEnabled ? { label: "Starting microphone…", tone: "bg-muted" }
    : { label: "Microphone paused", tone: "bg-muted" }

  return (
    <div className="min-h-screen">
      <AppHeader showCustomize />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ASSISTANT PANEL */}
        <section className="card fade-up flex flex-col items-center p-6 text-center lg:sticky lg:top-24 lg:self-start">
          <div className="pulse-ring rounded-[1.75rem]" data-active={listening || speaking}>
            <div className="aspect-[3/4] w-44 overflow-hidden rounded-[1.75rem] bg-surface-2 sm:w-52">
              <img src={assistantImage} alt={assistantName} className="h-full w-full object-cover" />
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{assistantName}</h1>
          <p className="mt-1 text-sm text-muted">
            {voiceSupported ? <>Say “{assistantName}” followed by your request.</> : "Type a command to talk to your assistant."}
          </p>

          <div className="voice-bars my-5 text-accent" data-active={speaking || processing} aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-xs font-medium" role="status">
            <span className={`h-2 w-2 rounded-full ${status.tone}`} />
            {status.label}
          </div>

          <button
            type="button"
            aria-pressed={micEnabled}
            disabled={!voiceSupported}
            onClick={toggleMicrophone}
            className={`btn mt-4 w-full ${micEnabled ? "btn-ghost" : "btn-primary"}`}
          >
            {micEnabled ? <RiMicOffLine className="h-[18px] w-[18px]" /> : <RiMicLine className="h-[18px] w-[18px]" />}
            {micEnabled ? "Pause microphone" : "Resume microphone"}
          </button>

          {voiceError && <p role="status" className="mt-3 text-sm text-warn">{voiceError}</p>}
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          {/* CONVERSATION */}
          <section className="card fade-up flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <RiChat3Line className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold">Conversation</h2>
            </div>

            <div className="mt-4 flex max-h-[420px] min-h-[220px] flex-col gap-3 overflow-y-auto pr-1" aria-live="polite">
              {messages.length === 0 && !processing && (
                <div className="m-auto max-w-xs py-8 text-center">
                  <p className="text-sm font-medium">Hi {userData?.name?.split(" ")[0] || "there"}, how can I help?</p>
                  <p className="mt-1 text-sm text-muted">Speak to {assistantName} or type a command below. Your conversation will show up here.</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`fade-up max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words
                    ${message.role === "user"
                      ? "self-end rounded-br-md bg-accent text-accent-fg"
                      : "self-start rounded-bl-md bg-surface-2"}`}
                >
                  {message.text}
                  {actionLabels[message.type] && (
                    <span className="mt-1 block text-xs text-muted">↗ {actionLabels[message.type]}</span>
                  )}
                </div>
              ))}

              {processing && (
                <div className="self-start rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3" aria-label="Assistant is thinking">
                  <div className="voice-bars h-4 gap-1 text-muted" data-active="true">
                    {Array.from({ length: 3 }, (_, index) => <span key={index} className="w-1.5" />)}
                  </div>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>

            {assistantError && <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{assistantError}</p>}

            <form className="mt-4 flex gap-2" onSubmit={handleTypedSubmit}>
              <label htmlFor="typed-command" className="sr-only">Type a command</label>
              <input
                ref={typedInputRef}
                id="typed-command"
                type="text"
                className="field"
                placeholder={`Ask ${assistantName} anything…`}
                maxLength={2000}
                autoComplete="off"
                value={typedCommand}
                onChange={(e) => setTypedCommand(e.target.value)}
              />
              <button type="submit" className="btn btn-primary h-12 w-12 shrink-0 px-0" disabled={processing || !typedCommand.trim()} aria-label="Send command">
                <RiSendPlane2Fill className="h-5 w-5" />
              </button>
            </form>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            {/* SUGGESTIONS */}
            <section className="card fade-up p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <RiLightbulbFlashLine className="h-5 w-5 text-accent" />
                <h2 className="text-base font-semibold">Try asking</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={processing}
                    onClick={() => runCommand(suggestion)}
                    className="rounded-full border border-line px-3 py-1.5 text-left text-xs font-medium text-muted transition hover:border-accent hover:text-fg disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>

            {/* RECENT COMMANDS */}
            <RecentCommands onRun={runCommand} onEdited={fillChatBox} disabled={processing} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
