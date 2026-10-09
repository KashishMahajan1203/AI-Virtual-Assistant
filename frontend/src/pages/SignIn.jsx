import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { userDataContext } from '../context/userDataContext'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'

function SignIn() {
    const { serverUrl, setUserData } = useContext(userDataContext)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    const handleSignIn = async (e) => {
        e.preventDefault()
        setErr("")
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/signin`, {
                email, password
            }, { withCredentials: true })

            setUserData(result.data.user)   // Includes saved assistant settings; the router redirects
        } catch (error) {
            setUserData(null)
            setErr(error.response?.data?.message || "Unable to connect to the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">Sign in to continue to your assistant.</p>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSignIn}>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signin-email" className="text-sm font-medium">Email address</label>
                    <input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="field"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <PasswordField
                    id="signin-password"
                    label="Password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {err && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>}

                <button type="submit" className="btn btn-primary h-12 w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
                New here?{' '}
                <Link to="/signup" className="font-semibold text-accent hover:underline">Create an account</Link>
            </p>
        </AuthLayout>
    )
}

export default SignIn
