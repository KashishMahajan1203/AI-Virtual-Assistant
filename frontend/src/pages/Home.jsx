import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'  // Access user data and AI functions
import { useNavigate } from 'react-router-dom'            // Navigation hook
import axios from 'axios'                                 // HTTP requests
import aiImg from "../assets/ai.gif"                      // AI speaking animation
import userImg from "../assets/user.gif"                  // User speaking animation
import defaultAssistantImage from "../assets/image1.png"
import { CgMenuRight } from "react-icons/cg";            // Hamburger menu icon
import { RxCross1 } from "react-icons/rx";               // Close menu icon
import { RiLogoutBoxRLine, RiSettings3Line } from "react-icons/ri";
import { RiMicLine, RiMicOffLine } from "react-icons/ri";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()
  const assistantName = userData?.assistantName || "Assistant"
  const assistantImage = userData?.assistantImage || defaultAssistantImage

  // Local state for speech recognition and conversation
  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [micEnabled, setMicEnabled] = useState(true)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceError, setVoiceError] = useState("")
  const [assistantError, setAssistantError] = useState("")
  const isSpeakingRef = useRef(false)       // Tracks if AI is currently speaking
  const recognitionRef = useRef(null)       // Speech recognition instance
  const [ham, setHam] = useState(false)     // Hamburger menu state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const isRecognizingRef = useRef(false)    // Tracks if recognition is active
  const micEnabledRef = useRef(true)
  const isBusyRef = useRef(false)
  const synth = window.speechSynthesis      // Speech synthesis instance

  // Logout function: clears user data and navigates to signin
  const handleLogOut = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  // Start speech recognition if not already speaking or recognizing
  const startRecognition = () => {
    if (micEnabledRef.current && !isBusyRef.current && !isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start()
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          setVoiceError("Microphone could not start. Check your browser permissions.")
        }
      }
    }
  }

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

  // Convert AI text to speech
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'hi-IN'

    // Select Hindi voice if available
    const voices = window.speechSynthesis.getVoices()
    const hindiVoice = voices.find(v => v.lang === 'hi-IN')
    if (hindiVoice) utterance.voice = hindiVoice

    isSpeakingRef.current = true
    isBusyRef.current = true
    setSpeaking(true)

    utterance.onend = () => {
      setAiText("")
      isSpeakingRef.current = false
      isBusyRef.current = false
      setSpeaking(false)
      setTimeout(() => {
        startRecognition() // Restart recognition after AI finishes speaking
      }, 800)
    }

    utterance.onerror = () => {
      isSpeakingRef.current = false
      isBusyRef.current = false
      setSpeaking(false)
      setVoiceError("Voice playback failed. Check your device audio settings.")
      startRecognition()
    }

    synth.cancel()   // Cancel any ongoing speech
    synth.speak(utterance)
  }

  // Handle AI command results, trigger actions like search, navigation, etc.
  const handleCommand = (data) => {
    const { type, userInput, response } = data
    speak(response)

    switch (type) {
      case "google-search":
        window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, "_blank")
        break
      case "calculator-open":
        window.open(`https://www.google.com/search?q=calculator`, "_blank")
        break
      case "instagram-open":
        window.open(`https://www.instagram.com/`, "_blank")
        break
      case "facebook-open":
        window.open(`https://www.facebook.com/`, "_blank")
        break
      case "weather-show":
        window.open(`https://www.google.com/search?q=weather`, "_blank")
        break
      case "youtube-search":
      case "youtube-play":
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`, "_blank")
        break
      default:
        break
    }
  }

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceSupported(false)
      setVoiceError("Voice input is not supported in this browser.")
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

    // Recognition event handlers
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
    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      // Trigger AI assistant if its name is mentioned
      if (transcript.toLowerCase().includes(assistantName.toLowerCase())) {
        setUserText(transcript)
        setAssistantError("")
        setProcessing(true)
        isBusyRef.current = true
        recognition.stop()
        isRecognizingRef.current = false
        setListening(false)
        try {
          const data = await getGeminiResponse(transcript)
          if (!data?.response) throw new Error("The assistant could not respond. Please try again.")
          setAiText(data.response)
          setUserText("")
          handleCommand(data)
        } catch (error) {
          setAssistantError(error.response?.data?.message || error.message || "The assistant could not respond. Please try again.")
          isBusyRef.current = false
          if (micEnabledRef.current) setTimeout(startRecognition, 800)
        } finally {
          setProcessing(false)
        }
      }
    }

    // Initial greeting when page loads
    const greeting = new SpeechSynthesisUtterance(`Hello ${userData?.name || "there"}, what can I help you with?`);
    greeting.lang = 'hi-IN';
    greeting.onstart = () => { isSpeakingRef.current = true; setSpeaking(true) }
    greeting.onend = () => {
      isSpeakingRef.current = false
      setSpeaking(false)
      startRecognition()
    }
    greeting.onerror = () => {
      isSpeakingRef.current = false
      setSpeaking(false)
      startRecognition()
    }
    window.speechSynthesis.speak(greeting)

    // Cleanup on unmount
    return () => {
      isMounted = false
      clearTimeout(startTimeout)
      recognition.stop()
      window.speechSynthesis.cancel()
      setListening(false)
      isRecognizingRef.current = false
      isSpeakingRef.current = false
      isBusyRef.current = false
    }
  }, [])

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-[#02023d] to-slate-900 flex justify-center items-center px-4 py-8 overflow-hidden">

      {/* HAMBURGER MENU FOR MOBILE */}
      <button
        type="button"
        aria-label="Open account menu"
        className='lg:hidden absolute top-5 right-5 z-20 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-slate-900/60 text-white shadow-lg backdrop-blur transition hover:bg-slate-800'
        onClick={() => setHam(true)}
      >
        <CgMenuRight className='h-6 w-6' />
      </button>

      {/* SIDE MENU */}
      <div className={`fixed lg:hidden inset-0 bg-slate-950/90 backdrop-blur-xl px-5 pt-6 flex flex-col gap-4 z-30
        ${ham ? "translate-x-0" : "translate-x-full"} transition-transform duration-300`}>
        <div className='flex items-center justify-between border-b border-white/10 pb-5'>
          <span className='text-sm font-semibold uppercase tracking-wider text-slate-300'>Account</span>
          <button
            type="button"
            aria-label="Close account menu"
            className='grid h-10 w-10 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white'
            onClick={() => setHam(false)}
          >
            <RxCross1 className='h-5 w-5' />
          </button>
        </div>

        <button className='flex h-14 w-full items-center gap-3 rounded-2xl border border-blue-300/25 bg-blue-400 px-5 text-left text-base font-semibold text-slate-950 shadow-lg shadow-blue-950/30 transition hover:bg-blue-300'
          onClick={() => { setHam(false); navigate("/customize") }}>
          <RiSettings3Line className='h-5 w-5 shrink-0' />
          Customize your Assistant
        </button>

        <button className='flex h-14 w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 text-left text-base font-medium text-white transition hover:bg-white/10'
          onClick={() => { setHam(false); setShowLogoutConfirm(true) }}>
          <RiLogoutBoxRLine className='h-5 w-5 shrink-0' />
          Log Out
        </button>
      </div>

      {/* DESKTOP BUTTONS */}
      <div className='glass-panel hidden lg:flex items-center gap-2 absolute top-6 right-6 z-10 rounded-full p-1.5'>
        <button className='flex h-11 items-center gap-2 rounded-full bg-blue-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-300'
          onClick={() => navigate("/customize")}>
          <RiSettings3Line className='h-[18px] w-[18px]' />
          Customize Assistant
        </button>

        <button className='flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white'
          onClick={() => setShowLogoutConfirm(true)}>
          <RiLogoutBoxRLine className='h-[18px] w-[18px]' />
          Log Out
        </button>
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-6">
        {/* ASSISTANT IMAGE AND NAME */}
        <div className="glass-panel w-[260px] h-[320px] sm:w-[300px] sm:h-[360px] md:w-[340px] md:h-[420px] flex justify-center items-center overflow-hidden rounded-[28px] p-2">
          <img src={assistantImage} alt={assistantName} className='w-full h-full object-cover rounded-[22px]' />
        </div>
        <h1 className='text-white text-lg sm:text-xl md:text-2xl font-semibold'>I'm {assistantName}</h1>

        {/* SPEAKING ANIMATION */}
        <div className='flex justify-center items-center min-h-[110px]'>
          {!aiText && <img src={userImg} className='w-[150px] sm:w-[180px] md:w-[200px]' alt="User speaking" />}
          {aiText && <img src={aiImg} className='w-[150px] sm:w-[180px] md:w-[200px]' alt="AI speaking" />}
        </div>

        <div className='flex flex-col items-center gap-3'>
          <div className='flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/55 px-4 py-2 text-sm text-slate-200'>
            <span className={`h-2 w-2 rounded-full ${listening ? 'bg-emerald-400' : speaking ? 'bg-sky-300' : 'bg-slate-500'}`} />
            {!voiceSupported ? 'Voice input unavailable' : speaking ? 'Assistant speaking' : processing ? 'Thinking...' : listening ? `Listening for ${assistantName}` : micEnabled ? 'Starting microphone...' : 'Microphone paused'}
          </div>
          <button
            type='button'
            aria-pressed={micEnabled}
            disabled={!voiceSupported}
            onClick={toggleMicrophone}
            className='flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {micEnabled ? <RiMicOffLine className='h-5 w-5' /> : <RiMicLine className='h-5 w-5' />}
            {micEnabled ? 'Pause microphone' : 'Resume microphone'}
          </button>
          {voiceError && <p role='status' className='max-w-[90vw] text-center text-sm text-amber-200'>{voiceError}</p>}
          {assistantError && <p role='alert' className='max-w-[90vw] text-center text-sm text-rose-300'>{assistantError}</p>}
        </div>

        {/* DISPLAY USER OR AI TEXT */}
        <h1 className='text-white text-base sm:text-lg md:text-xl font-medium text-center max-w-[80%] break-words'>
          {userText ? userText : aiText ? aiText : null}
        </h1>
      </div>

      {showLogoutConfirm && (
        <div
          className='fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLogoutConfirm(false)
          }}
        >
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='logout-title'
            aria-describedby='logout-description'
            className='auth-card glass-panel w-full max-w-[420px] rounded-[24px] p-6 sm:p-8'
          >
            <div className='mb-6 grid h-12 w-12 place-items-center rounded-full bg-rose-400/10 text-rose-300'>
              <RiLogoutBoxRLine className='h-6 w-6' />
            </div>
            <h2 id='logout-title' className='text-xl font-semibold text-white'>Log out of your assistant?</h2>
            <p id='logout-description' className='mt-2 text-sm leading-6 text-slate-300'>You can sign back in whenever you’re ready.</p>
            <div className='mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                type='button'
                className='h-11 rounded-full border border-white/15 px-5 text-sm font-medium text-slate-200 transition hover:bg-white/10'
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type='button'
                className='h-11 rounded-full bg-rose-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-rose-300'
                onClick={handleLogOut}
              >
                Log Out
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  )
}

export default Home
