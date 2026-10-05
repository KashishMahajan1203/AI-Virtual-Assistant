import React, { useContext, useEffect, useRef, useState } from 'react'
import bg from "../assets/authBg.png"                      // Background image
import { IoEye, IoEyeOff } from "react-icons/io5";       // Icons to show/hide password
import { useNavigate } from 'react-router-dom';          // Navigation hook
import { userDataContext } from '../context/UserContext'; // Context for server URL and user data
import axios from "axios"                                 // HTTP requests

function SignIn() {
    const navigation = useNavigate()                      // Hook for navigating between routes
    const modalRef = useRef(null)
    const [showPassword, setShowPassword] = useState(false) // Toggle password visibility
    const { serverUrl, setUserData } = useContext(userDataContext) // Get server URL & user setter
    const [email, setEmail] = useState("")                // Email input state
    const [password, setPassword] = useState("")          // Password input state
    const [loading, setLoading] = useState(false)         // Loading state for button
    const [err, setErr] = useState("")                    // Error message state

    useEffect(() => {
        const modal = modalRef.current
        if (modal && !modal.open) modal.showModal()
        return () => {
            if (modal?.open) modal.close()
        }
    }, [])

    // Handle sign-in form submission
    const handleSignIn = async (e) => {
        e.preventDefault()
        setErr("")              // Clear previous errors
        setLoading(true)        // Enable loading state
        try {
            const result = await axios.post(`${serverUrl}/api/auth/signin`, {
                email, password
            }, { withCredentials: true }) // Send credentials with cookies

            setUserData(result.data.user) // Store the signed-in user, including saved assistant settings
            setLoading(false)
            navigation("/")         // Navigate to home page
        } catch (error) {
            console.log(error)
            setUserData(null)        // Clear context if login fails
            setLoading(false)
            setErr(error.response?.data?.message || "Unable to connect to the server. Please try again.")
        }
    }

    return (
        <div className='relative isolate w-full min-h-screen bg-cover bg-center flex justify-center items-center px-4 py-8'
            style={{ backgroundImage: `url(${bg})` }}>

            {/* SIGN-IN FORM */}
                        <dialog ref={modalRef} className='auth-modal auth-card' onCancel={(event) => event.preventDefault()}>
                            <form className='flex flex-col gap-6' onSubmit={handleSignIn}>

                <div>
                    <p className='mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300'>Virtual Assistant</p>
                    <h1 id='signin-title' className='text-white text-3xl sm:text-4xl font-semibold leading-tight'>Welcome back</h1>
                    <p className='mt-2 text-sm sm:text-base text-slate-300'>Sign in to continue to your assistant.</p>
                </div>

                <div className='flex flex-col gap-2'>
                    <label htmlFor='signin-email' className='text-sm font-medium text-slate-200'>Email address</label>
                    <input
                        id='signin-email'
                        type="email"
                        autoComplete='email'
                        placeholder='name@example.com'
                        className='auth-input placeholder:text-slate-400 text-base'
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className='flex flex-col gap-2'>
                    <label htmlFor='signin-password' className='text-sm font-medium text-slate-200'>Password</label>
                    <div className='relative'>
                        <input
                            id='signin-password'
                            type={showPassword ? "text" : "password"}
                            autoComplete='current-password'
                            placeholder='Enter your password'
                            className='auth-input pr-14 placeholder:text-slate-400 text-base'
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type='button'
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className='absolute inset-y-0 right-4 grid place-items-center text-slate-300 transition hover:text-white'
                            onClick={() => setShowPassword((visible) => !visible)}
                        >
                            {showPassword ? <IoEyeOff className='h-5 w-5' /> : <IoEye className='h-5 w-5' />}
                        </button>
                    </div>
                </div>

                {/* DISPLAY ERROR MESSAGE */}
                {err.length > 0 && <p role='alert' className='-mt-3 text-sm text-rose-300'>{err}</p>}

                {/* SUBMIT BUTTON */}
                <button type='submit' className='auth-button w-full mt-1'
                    disabled={loading}>
                    {loading ? "Loading..." : "Sign In"}
                </button>

                {/* NAVIGATE TO SIGNUP */}
                <p className='text-center text-sm text-slate-300'>
                    New here?{' '}
                    <button type='button' className='font-semibold text-sky-300 transition hover:text-white' onClick={() => navigation("/signup")}>
                        Create an account
                    </button>
                </p>
              </form>
            </dialog>
        </div>
    )
}

export default SignIn
