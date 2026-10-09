// End-to-end API checks for the dashboard flow and the security features.
// Run against a production-mode server (see "test:api" in package.json):
//   NODE_ENV=production PORT=5011 CORS_ORIGINS=https://test-frontend.local AUTH_RATE_LIMIT_MAX=2 node index.js
import assert from "node:assert/strict";
import dns from "node:dns";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

const backendDirectory = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(backendDirectory, ".env"), quiet: true });
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const require = createRequire(new URL("../package.json", import.meta.url));
const jwt = require("jsonwebtoken");
const baseUrl = process.env.SECURITY_TEST_BASE_URL || "http://localhost:5011";
const testId = Date.now();
const email = `api-check-${testId}@example.test`;
const password = `Api-Check-${testId}`;
let ipCounter = 0;
let passed = 0;
let testUserCreated = false;

// Every request gets a fresh client IP so the auth rate limiter only trips where a test wants it to
const headers = (extra = {}) => ({
    "x-forwarded-proto": "https",
    "x-forwarded-for": `203.0.113.${1 + ((testId + ++ipCounter) % 254)}`,
    ...extra,
});
const jsonHeaders = (extra = {}) => headers({ "content-type": "application/json", ...extra });
const api = (route, options = {}) => fetch(`${baseUrl}${route}`, options);

const check = async (label, fn) => {
    await fn();
    passed += 1;
    console.log(`PASS ${label}`);
};

const mongoUri = [process.env.MONGODB_URL, process.env.MONGO_URI, process.env.MONGODB_URI].find(Boolean);

try {
    // ---------- Environment variables ----------
    await check(".env is ignored by git", () => {
        const ignored = execFileSync("git", ["check-ignore", ".env"], { cwd: backendDirectory }).toString().trim();
        assert.equal(ignored, ".env");
    });

    await check("server refuses to start with a weak JWT_SECRET", async () => {
        const child = spawn(process.execPath, ["index.js"], {
            cwd: backendDirectory,
            env: { ...process.env, JWT_SECRET: "too-short", PORT: "5099" },
            stdio: "pipe",
        });
        let output = "";
        child.stderr.on("data", (chunk) => { output += chunk; });
        const code = await new Promise((resolve) => child.on("exit", resolve));
        assert.equal(code, 1);
        assert.match(output, /JWT_SECRET must be configured/);
    });

    // ---------- Input validation ----------
    await check("signup rejects an invalid email", async () => {
        const response = await api("/api/auth/signup", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ name: "Test", email: "not-an-email", password }),
        });
        assert.equal(response.status, 400);
    });

    await check("signup rejects missing fields", async () => {
        const response = await api("/api/auth/signup", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ email }),
        });
        assert.equal(response.status, 400);
    });

    await check("signup rejects a password over 72 bytes", async () => {
        const response = await api("/api/auth/signup", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ name: "Test", email, password: "x".repeat(73) }),
        });
        assert.equal(response.status, 400);
    });

    await check("signin rejects non-string values (NoSQL injection shape)", async () => {
        const response = await api("/api/auth/signin", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ email: { $ne: null }, password: { $ne: null } }),
        });
        assert.equal(response.status, 400);
    });

    // ---------- Signup / JWT cookie ----------
    let cookie = "";
    await check("signup creates the account and sets an HttpOnly JWT cookie", async () => {
        const response = await api("/api/auth/signup", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ name: "Api Test", email: email.toUpperCase(), password }),
        });
        assert.equal(response.status, 201);
        testUserCreated = true;
        const body = await response.json();
        assert.equal(body.user.email, email, "email is normalised to lowercase");
        assert.equal(body.user.password, undefined);
        const setCookie = response.headers.getSetCookie()[0];
        assert.match(setCookie, /^token=/);
        assert.match(setCookie, /HttpOnly/i);
        cookie = setCookie.split(";")[0];
        const decoded = jwt.verify(cookie.slice("token=".length), process.env.JWT_SECRET);
        assert.ok(decoded.userId);
        assert.ok(decoded.exp - decoded.iat === 7 * 24 * 60 * 60, "token expires in 7 days");
    });

    await check("duplicate email is rejected", async () => {
        const response = await api("/api/auth/signup", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ name: "Api Test", email, password }),
        });
        assert.equal(response.status, 400);
    });

    await check("wrong password returns a generic 401", async () => {
        const response = await api("/api/auth/signin", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ email, password: "Wrong-Password-1" }),
        });
        assert.equal(response.status, 401);
        assert.equal((await response.json()).message, "Invalid email or password");
    });

    await check("unknown email returns the same generic 401", async () => {
        const response = await api("/api/auth/signin", {
            method: "POST",
            headers: jsonHeaders(),
            body: JSON.stringify({ email: `missing-${testId}@example.test`, password }),
        });
        assert.equal(response.status, 401);
        assert.equal((await response.json()).message, "Invalid email or password");
    });

    // ---------- JWT protection ----------
    const userId = jwt.decode(cookie.slice("token=".length)).userId;

    await check("protected route without a token returns 401", async () => {
        assert.equal((await api("/api/user/current", { headers: headers() })).status, 401);
    });

    await check("expired JWT returns 401", async () => {
        const expired = jwt.sign({ userId, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
        const response = await api("/api/user/current", { headers: headers({ authorization: `Bearer ${expired}` }) });
        assert.equal(response.status, 401);
    });

    await check("JWT signed with another secret returns 401", async () => {
        const forged = jwt.sign({ userId }, "x".repeat(48));
        const response = await api("/api/user/current", { headers: headers({ authorization: `Bearer ${forged}` }) });
        assert.equal(response.status, 401);
    });

    await check("unsigned (alg=none) JWT returns 401", async () => {
        const unsigned = jwt.sign({ userId }, null, { algorithm: "none" });
        const response = await api("/api/user/current", { headers: headers({ authorization: `Bearer ${unsigned}` }) });
        assert.equal(response.status, 401);
    });

    // ---------- Dashboard flow ----------
    await check("current user is returned without the password hash", async () => {
        const response = await api("/api/user/current", { headers: headers({ cookie }) });
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.email, email);
        assert.equal(body.password, undefined);
    });

    const updateAssistant = (fields) => {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields)) form.set(key, value);
        return api("/api/user/update", { method: "POST", headers: headers({ cookie }), body: form });
    };

    await check("assistant name is required", async () => {
        assert.equal((await updateAssistant({ assistantName: "   " })).status, 400);
    });

    await check("assistant name over 40 characters is rejected", async () => {
        assert.equal((await updateAssistant({ assistantName: "a".repeat(41) })).status, 400);
    });

    await check("non-https image URL is rejected", async () => {
        assert.equal((await updateAssistant({ assistantName: "Jarvis", imageUrl: "javascript:alert(1)" })).status, 400);
        assert.equal((await updateAssistant({ assistantName: "Jarvis", imageUrl: "//evil.example/x.png" })).status, 400);
    });

    await check("assistant can be customised with a preset image", async () => {
        const response = await updateAssistant({ assistantName: "Jarvis", imageUrl: "/assets/image1.png" });
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.equal(body.assistantName, "Jarvis");
        assert.equal(body.assistantImage, "/assets/image1.png");
        assert.equal(body.password, undefined);
    });

    const ask = (command, extraHeaders = { cookie }) => api("/api/user/asktoassistant", {
        method: "POST",
        headers: jsonHeaders(extraHeaders),
        body: JSON.stringify({ command }),
    });

    await check("assistant rejects an empty command", async () => {
        assert.equal((await ask("  ")).status, 400);
    });

    await check("assistant rejects a command over 2000 characters", async () => {
        assert.equal((await ask("a".repeat(2001))).status, 400);
    });

    await check("assistant requires authentication", async () => {
        assert.equal((await ask("Jarvis what time is it", {})).status, 401);
    });

    await check("assistant answers or fails gracefully and records history", async () => {
        const response = await ask("Jarvis what time is it");
        const body = await response.json();
        if (process.env.AI_API_KEY || process.env.GEMINI_API_URL) {
            assert.equal(response.status, 200);
            assert.ok(body.type);
            assert.ok(body.response);
        } else {
            assert.equal(response.status, 502, "without an AI provider the API reports the AI service as unavailable");
        }
        const current = await (await api("/api/user/current", { headers: headers({ cookie }) })).json();
        assert.equal(current.history.at(-1), "Jarvis what time is it");
    });

    // ---------- Command history: edit / delete / clear ----------
    const historyCall = (method, route, body, extraHeaders = { cookie }) => api(`/api/user/history${route}`, {
        method,
        headers: jsonHeaders(extraHeaders),
        body: body && JSON.stringify(body),
    });
    await ask("Jarvis what day is it");
    await ask("Jarvis open youtube");

    await check("history routes require authentication", async () => {
        assert.equal((await historyCall("DELETE", "", undefined, {})).status, 401);
    });

    await check("history edit rejects bad input", async () => {
        assert.equal((await historyCall("PATCH", "/0", { command: "Jarvis what time is it", newCommand: "  " })).status, 400);
        assert.equal((await historyCall("PATCH", "/abc", { command: "x", newCommand: "y" })).status, 400);
        assert.equal((await historyCall("PATCH", "/-1", { command: "x", newCommand: "y" })).status, 400);
    });

    await check("history edit with a stale command returns 409", async () => {
        assert.equal((await historyCall("PATCH", "/0", { command: "not what is stored", newCommand: "y" })).status, 409);
    });

    await check("history item can be edited", async () => {
        const response = await historyCall("PATCH", "/0", { command: "Jarvis what time is it", newCommand: "Jarvis what is the time now" });
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).history, ["Jarvis what is the time now", "Jarvis what day is it", "Jarvis open youtube"]);
    });

    await check("history item can be deleted (only that item)", async () => {
        const response = await historyCall("DELETE", "/1", { command: "Jarvis what day is it" });
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).history, ["Jarvis what is the time now", "Jarvis open youtube"]);
        assert.equal((await historyCall("DELETE", "/1", { command: "Jarvis what day is it" })).status, 409);
    });

    await check("history can be cleared", async () => {
        const response = await historyCall("DELETE", "");
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).history, []);
    });

    // ---------- Rate limiting / CORS headers ----------
    await check("API responses carry RateLimit headers", async () => {
        const response = await api("/api/user/current", { headers: headers({ cookie }) });
        assert.ok(response.headers.get("ratelimit-policy") || response.headers.get("ratelimit"));
    });

    await check("CORS preflight allows the configured frontend with credentials", async () => {
        const response = await api("/api/user/update", {
            method: "OPTIONS",
            headers: headers({
                origin: "https://test-frontend.local",
                "access-control-request-method": "POST",
            }),
        });
        assert.equal(response.status, 204);
        assert.equal(response.headers.get("access-control-allow-origin"), "https://test-frontend.local");
        assert.equal(response.headers.get("access-control-allow-credentials"), "true");
    });

    // ---------- Logout ----------
    await check("logout clears the token cookie", async () => {
        const response = await api("/api/auth/logout", { method: "POST", headers: headers({ cookie }) });
        assert.equal(response.status, 200);
        assert.match(response.headers.getSetCookie()[0], /token=;.*Expires=Thu, 01 Jan 1970/i);
    });

    // ---------- MongoDB ----------
    await check("MongoDB stores a bcrypt hash and enforces unique email", async () => {
        await mongoose.connect(mongoUri);
        const stored = await User.findOne({ email });
        assert.match(stored.password, /^\$2[aby]\$12\$/, "bcrypt with cost factor 12");
        assert.notEqual(stored.password, password);
        await assert.rejects(User.create({ name: "Dup", email, password: "x" }), { code: 11000 });
    });

    console.log(`\nAll ${passed} API checks passed`);
} catch (error) {
    console.error(`FAIL after ${passed} passing checks: ${error.message}`);
    process.exitCode = 1;
} finally {
    if (testUserCreated) {
        try {
            if (mongoose.connection.readyState !== 1) await mongoose.connect(mongoUri);
            await User.deleteOne({ email });
            console.log("Temporary API test user removed");
        } catch (error) {
            console.error(`CLEANUP FAILED ${error.message}`);
            process.exitCode = 1;
        }
    }
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
}
