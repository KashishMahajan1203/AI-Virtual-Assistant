import assert from "node:assert/strict";
import dns from "node:dns";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import dotenv from "dotenv";

const backendDirectory = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(backendDirectory, ".env"), quiet: true });
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const require = createRequire(new URL("../package.json", import.meta.url));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const baseUrl = process.env.SECURITY_TEST_BASE_URL || "http://localhost:5011";
const secureHeaders = { "x-forwarded-proto": "https" };
const testId = Date.now();
const email = `security-check-${testId}@example.test`;
const password = `Security-Check-${testId}`;
const avatarUrl = "https://security-check.invalid/avatar.png";
const testIp = (offset) => `198.51.100.${1 + ((testId + offset) % 254)}`;
let testUserCreated = false;

const checkStatus = async (label, response, expectedStatus) => {
    assert.equal(response.status, expectedStatus, `${label}: expected ${expectedStatus}, received ${response.status}`);
    console.log(`PASS ${label}: ${response.status}`);
};

try {
    await checkStatus("production HTTPS enforcement", await fetch(`${baseUrl}/`), 426);

    const secureResponse = await fetch(`${baseUrl}/`, {
        headers: { ...secureHeaders, origin: "https://test-frontend.local" },
    });
    await checkStatus("HTTPS request", secureResponse, 200);
    assert.ok(secureResponse.headers.get("strict-transport-security"));
    assert.equal(secureResponse.headers.get("x-content-type-options"), "nosniff");
    assert.equal(secureResponse.headers.get("x-powered-by"), null);
    assert.equal(secureResponse.headers.get("access-control-allow-origin"), "https://test-frontend.local");
    console.log("PASS Helmet headers and allowed CORS origin");

    await checkStatus("CORS rejects an unknown origin", await fetch(`${baseUrl}/`, {
        headers: { ...secureHeaders, origin: "https://not-allowed.local" },
    }), 403);

    await checkStatus("invalid JWT is rejected", await fetch(`${baseUrl}/api/user/current`, {
        headers: { ...secureHeaders, authorization: "Bearer invalid-token" },
    }), 401);

    const validationHeaders = {
        ...secureHeaders,
            "x-forwarded-for": testIp(1),
        "content-type": "application/json",
    };
    await checkStatus("short signup password is rejected", await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: validationHeaders,
        body: JSON.stringify({ name: "Test User", email, password: "short" }),
    }), 400);

    const authStatuses = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(`${baseUrl}/api/auth/signin`, {
            method: "POST",
            headers: {
                ...secureHeaders,
                "x-forwarded-for": testIp(2),
                "content-type": "application/json",
            },
            body: "{}",
        });
        authStatuses.push(response.status);
    }
    assert.deepEqual(authStatuses, [400, 400, 429]);
    console.log("PASS authentication rate limit: 400, 400, 429");

    const oversizedJson = JSON.stringify({ data: "x".repeat(17000) });
    await checkStatus("JSON body limit", await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
            ...secureHeaders,
            "x-forwarded-for": testIp(3),
            "content-type": "application/json",
        },
        body: oversizedJson,
    }), 413);

    const token = jwt.sign({ userId: "64b000000000000000000001" }, process.env.JWT_SECRET, { expiresIn: "1m" });
    const textFileForm = new FormData();
    textFileForm.set("assistantName", "Smoke Test");
    textFileForm.set("assistantImage", new Blob(["not an image"], { type: "text/plain" }), "not-image.txt");
    await checkStatus("non-image upload rejected", await fetch(`${baseUrl}/api/user/update`, {
        method: "POST",
        headers: { ...secureHeaders, authorization: `Bearer ${token}` },
        body: textFileForm,
    }), 400);

    const largeFileForm = new FormData();
    largeFileForm.set("assistantName", "Smoke Test");
    largeFileForm.set("assistantImage", new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: "image/png" }), "oversized.png");
    await checkStatus("image over 5 MB rejected", await fetch(`${baseUrl}/api/user/update`, {
        method: "POST",
        headers: { ...secureHeaders, authorization: `Bearer ${token}` },
        body: largeFileForm,
    }), 413);

    const signup = await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
            ...secureHeaders,
            "x-forwarded-for": testIp(4),
            "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Security Test", email, password }),
    });
    await checkStatus("valid signup", signup, 201);
    testUserCreated = true;
    const setCookieHeader = signup.headers.getSetCookie()[0];
    const cookie = setCookieHeader.split(";")[0];
    assert.match(setCookieHeader, /HttpOnly/i);
    assert.match(setCookieHeader, /Secure/i);
    assert.match(setCookieHeader, /SameSite=None/i);

    const updateForm = new FormData();
    updateForm.set("assistantName", "Security Test Assistant");
    updateForm.set("imageUrl", avatarUrl);
    await checkStatus("assistant image update", await fetch(`${baseUrl}/api/user/update`, {
        method: "POST",
        headers: { ...secureHeaders, cookie },
        body: updateForm,
    }), 200);

    await checkStatus("logout", await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: { ...secureHeaders, "x-forwarded-for": testIp(5), cookie },
    }), 200);

    const login = await fetch(`${baseUrl}/api/auth/signin`, {
        method: "POST",
        headers: {
            ...secureHeaders,
            "x-forwarded-for": testIp(6),
            "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });
    await checkStatus("valid login", login, 200);
    const loginBody = await login.json();
    assert.equal(loginBody.user.assistantImage, avatarUrl);
    assert.equal(loginBody.user.assistantName, "Security Test Assistant");
    console.log("PASS saved assistant settings restored at login");

    const mongoUri = [process.env.MONGODB_URL, process.env.MONGO_URI, process.env.MONGODB_URI].find(Boolean);
    assert.ok(mongoUri, "MongoDB URI must be configured for this smoke test");
    await mongoose.connect(mongoUri);
    const storedUser = await User.findOne({ email });
    assert.ok(storedUser);
    assert.match(storedUser.password, /^\$2[aby]\$/);
    assert.equal(await bcrypt.compare(password, storedUser.password), true);
    const indexes = await User.collection.indexes();
    assert.ok(indexes.some((index) => index.key.email === 1 && index.unique));
    console.log("PASS bcrypt password hash and unique MongoDB email index");
} catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
} finally {
    if (testUserCreated) {
        try {
            const mongoUri = [process.env.MONGODB_URL, process.env.MONGO_URI, process.env.MONGODB_URI].find(Boolean);
            if (mongoose.connection.readyState !== 1) await mongoose.connect(mongoUri);
            await User.deleteOne({ email });
            console.log("Temporary security test user removed");
        } catch (error) {
            console.error(`CLEANUP FAILED ${error.message}`);
            process.exitCode = 1;
        }
    }
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
}