import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { userDataContext } from "../context/userDataContext";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";

function SignUp() {
    const { serverUrl, setUserData } = useContext(userDataContext);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const passwordBytes = new TextEncoder().encode(password).length;
    const passwordOk = password.length >= 8 && passwordBytes <= 72;

    const handleSignUp = async (e) => {
        e.preventDefault();
        setErr("");

        if (!name.trim() || !email.trim() || !password) {
            setErr("Please fill in your name, email and password.");
            return;
        }

        if (!passwordOk) {
            setErr("Password must be at least 8 characters and no more than 72 bytes.");
            return;
        }

        setLoading(true);
        try {
            const result = await axios.post(
                `${serverUrl}/api/auth/signup`,
                { name: name.trim(), email: email.trim(), password },
                { withCredentials: true }
            );

            setUserData(result.data.user);   // The router redirects to /customize
        } catch (error) {
            setUserData(null);
            if (error.response) {
                setErr(error.response.data?.message || `Signup failed. Server returned ${error.response.status}.`);
            } else {
                setErr("Unable to connect to the server. Please make sure the backend is running.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-muted">A few details, then your assistant is yours to personalise.</p>

            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSignUp}>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-name" className="text-sm font-medium">Your name</label>
                    <input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your name"
                        className="field"
                        maxLength={80}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-email" className="text-sm font-medium">Email address</label>
                    <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="field"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <PasswordField
                        id="signup-password"
                        label="Password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        aria-describedby="signup-password-hint"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <p
                        id="signup-password-hint"
                        className={`mt-1.5 text-xs ${password && !passwordOk ? "text-danger" : password ? "text-success" : "text-muted"}`}
                    >
                        {password && passwordOk ? "Looks good." : "Use 8 or more characters."}
                    </p>
                </div>

                {err && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>}

                <button type="submit" disabled={loading} className="btn btn-primary h-12 w-full">
                    {loading ? "Creating account…" : "Create account"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link to="/signin" className="font-semibold text-accent hover:underline">Sign in</Link>
            </p>
        </AuthLayout>
    );
}

export default SignUp;
