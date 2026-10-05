
import React, { useContext, useEffect, useRef, useState } from "react";
import bg from "../assets/authBg.png";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext";
import axios from "axios";

function SignUp() {
    const navigation = useNavigate();
    const modalRef = useRef(null);

    const { serverUrl, setUserData } = useContext(userDataContext);

    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const modal = modalRef.current;
        if (modal && !modal.open) modal.showModal();
        return () => {
            if (modal?.open) modal.close();
        };
    }, []);

    // Handle Sign Up
    const handleSignUp = async (e) => {
        e.preventDefault();

        // Clear old error
        setErr("");

        // Basic validation
        if (!name.trim()) {
            setErr("Please enter your name.");
            return;
        }

        if (!email.trim()) {
            setErr("Please enter your email.");
            return;
        }

        if (!password.trim()) {
            setErr("Please enter your password.");
            return;
        }

        if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
            setErr("Password must be at least 8 characters and no more than 72 bytes.");
            return;
        }

        setLoading(true);

        try {
            console.log("Sending signup request...");
            console.log("Server URL:", serverUrl);

            const result = await axios.post(
                `${serverUrl}/api/auth/signup`,
                {
                    name: name.trim(),
                    email: email.trim(),
                    password,
                },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Signup successful:", result.data);

            // Save user data
            setUserData(result.data.user);

            // Navigate after successful signup
            navigation("/customize");

        } catch (error) {
            console.error("SIGNUP ERROR:", error);

            // Backend response error
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Response:", error.response.data);

                setErr(
                    error.response.data?.message ||
                    error.response.data?.error ||
                    `Signup failed. Server returned ${error.response.status}.`
                );
            }

            // Request was sent but no response received
            else if (error.request) {
                console.error("No response received:", error.request);

                setErr(
                    "Unable to connect to the server. Please make sure the backend is running."
                );
            }

            // Something went wrong before request was sent
            else {
                console.error("Request error:", error.message);

                setErr(
                    error.message || "An error occurred during sign up."
                );
            }

            setUserData(null);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="relative isolate w-full min-h-screen bg-cover bg-center flex justify-center items-center px-4 py-8 scroll-hidden"
            style={{ backgroundImage: `url(${bg})` }}
        >
            <dialog ref={modalRef} className="auth-modal auth-card scroll-hidden" onCancel={(event) => event.preventDefault()}>
              <form className="flex flex-col gap-5" onSubmit={handleSignUp}>
                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Virtual Assistant</p>
                    <h1 id="signup-title" className="text-white text-3xl sm:text-4xl font-semibold leading-tight">Create your account</h1>
                    <p className="mt-2 text-sm sm:text-base text-slate-300">A few details, then your assistant is yours to personalize.</p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="signup-name" className="text-sm font-medium text-slate-200">Your name</label>
                    <input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your name"
                        className="auth-input placeholder:text-slate-400 text-base"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="signup-email" className="text-sm font-medium text-slate-200">Email address</label>
                    <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="auth-input placeholder:text-slate-400 text-base"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="signup-password" className="text-sm font-medium text-slate-200">Password</label>
                    <div className="relative">
                        <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            className="auth-input pr-14 placeholder:text-slate-400 text-base"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-4 grid place-items-center text-slate-300 transition hover:text-white"
                            onClick={() => setShowPassword((visible) => !visible)}
                        >
                            {showPassword ? <IoEyeOff className="h-5 w-5" /> : <IoEye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {err && (
                    <p role="alert" className="-mt-2 text-sm text-rose-300">
                        * {err}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="auth-button w-full mt-1"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>

                {/* Sign In */}
                <p className="text-center text-sm text-slate-300">
                    Already have an account?{" "}
                    <button type="button" className="font-semibold text-sky-300 transition hover:text-white" onClick={() => navigation("/signin")}>
                        Sign in
                    </button>
                </p>
                            </form>
                        </dialog>
        </div>
    );
}

export default SignUp;

