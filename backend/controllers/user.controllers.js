import { response } from "express"                     // Importing Express response object (not typically needed directly)
import uploadOnCloudinary from "../config/cloudinary.js" // Utility for uploading images to Cloudinary
import geminiResponse from "../gemini.js"               // AI assistant response generator
import User from "../models/user.model.js"              // User model for DB operations
import moment from "moment"                             // Library for date and time formatting
import fs from "fs"                                     // File system module for discarding rejected uploads

// Retrieve the currently authenticated user
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId                              // Extract authenticated user's ID
        const user = await User.findById(userId).select("-password") // Fetch user while excluding password
        if (!user) {
            return res.status(400).json({ message: "user not found" }) // No matching user
        }
        return res.status(200).json(user)                      // Respond with user details
    } catch (error) {
        return res.status(400).json({ message: "get current user error" }) // Error handling
    }
}

// Update assistant configuration such as name and image
export const updateAssistant = async (req, res) => {
    try {
        const assistantName = typeof req.body?.assistantName === "string"
            ? req.body.assistantName.trim()
            : ""
        const { imageUrl } = req.body || {}

        if (!assistantName || assistantName.length > 40) {
            if (req.file) fs.rm(req.file.path, { force: true }, () => {})   // Discard the rejected upload
            return res.status(400).json({ message: "Assistant name must be between 1 and 40 characters" })
        }

        const updateFields = { assistantName }

        // Check whether user uploaded a new image
        if (req.file) {
            updateFields.assistantImage = await uploadOnCloudinary(req.file.path)
        } else if (typeof imageUrl === "string" && imageUrl.trim()) {
            // Accept only https URLs or same-origin paths (bundled preset images)
            const trimmedUrl = imageUrl.trim()
            if (trimmedUrl.length > 2048 || !/^(https:\/\/|\/(?!\/))/i.test(trimmedUrl)) {
                return res.status(400).json({ message: "Assistant image must be an https URL" })
            }
            updateFields.assistantImage = trimmedUrl
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            updateFields,
            { new: true, runValidators: true }
        ).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        return res.status(200).json(user)                       // Return updated user details
    } catch (error) {
        console.error("ASSISTANT UPDATE ERROR:", error)
        const message = process.env.NODE_ENV === "production"
            ? "Could not update assistant settings"
            : error.message
        return res.status(500).json({ message })
    }
}

// Process user commands directed to the assistant
export const askToAssistant = async (req, res) => {
    try {
        const command = typeof req.body?.command === "string" ? req.body.command.trim() : ""
        if (!command || command.length > 2000) {
            return res.status(400).json({ response: "Command must be between 1 and 2000 characters." })
        }

        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ response: "User not found" })
        }

        user.history.push(command)
        if (user.history.length > 500) user.history.shift()
        await user.save()

        const userName = user.name                              // For AI persona personalization
        const assistantName = user.assistantName

        // Generate AI assistant response
        const result = await geminiResponse(command, assistantName, userName)
        if (typeof result !== "string") {
            return res.status(502).json({ response: "Assistant service is temporarily unavailable." })
        }

        // Extract JSON structure from AI response
        const jsonMatch = result.match(/{[\s\S]*}/)
        if (!jsonMatch) {
            return res.status(400).json({ response: "sorry, i can't understand" }) // Invalid AI output
        }

        const gemResult = JSON.parse(jsonMatch[0])              // Convert string to JSON object
        console.log(gemResult)

        const type = gemResult.type                             // Determine response category

        // Handle command types
        switch (type) {
            case 'get-date':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `current date is ${moment().format("YYYY-MM-DD")}` // Today's date
                });
            case 'get-time':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `current time is ${moment().format("hh:mm:A")}`     // Current time
                });
            case 'get-day':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `today is ${moment().format("dddd")}`               // Weekday name
                });
            case 'get-month':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `today is ${moment().format("MMMM")}`               // Month name
                });
            // Return AI-generated response for general command categories
            case 'google-search':
            case 'youtube-search':
            case 'youtube-play':
            case 'general':
            case "calculator-open":
            case "instagram-open":
            case "facebook-open":
            case "weather-show":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: gemResult.response,
                });

            default:
                return res.status(400).json({ response: "I didn't understand that command." }) // Unsupported command
        }

        return res.status.json                                  // Unreachable fallback (not used)
    } catch (error) {
        return res.status(500).json({ response: "ask assistant error" }) // Critical system error
    }
}

// ================= COMMAND HISTORY =================
// Items are addressed by their index in user.history; the client also sends the text it saw
// at that index, so a stale request (history changed meanwhile) gets 409 instead of touching the wrong item.
const parseHistoryRequest = (req) => {
    const index = Number(req.params.index)
    const command = typeof req.body?.command === "string" ? req.body.command : ""
    if (!Number.isInteger(index) || index < 0 || index >= 500 || !command) return null
    return { index, command }
}

const sendHistory = async (req, res) => {
    const user = await User.findById(req.userId).select("history")
    if (!user) return res.status(404).json({ message: "User not found" })
    return res.status(200).json({ history: user.history })
}

// Edit one command in the history
export const editHistoryItem = async (req, res) => {
    try {
        const target = parseHistoryRequest(req)
        const newCommand = typeof req.body?.newCommand === "string" ? req.body.newCommand.trim() : ""
        if (!target || !newCommand || newCommand.length > 2000) {
            return res.status(400).json({ message: "Command must be between 1 and 2000 characters" })
        }

        const result = await User.updateOne(
            { _id: req.userId, [`history.${target.index}`]: target.command },
            { $set: { [`history.${target.index}`]: newCommand } }
        )
        if (result.matchedCount === 0) {
            return res.status(409).json({ message: "This command has changed. Refresh and try again." })
        }
        return sendHistory(req, res)
    } catch (error) {
        console.error("HISTORY EDIT ERROR:", error)
        return res.status(500).json({ message: "Could not edit command" })
    }
}

// Delete one command from the history
export const deleteHistoryItem = async (req, res) => {
    try {
        const target = parseHistoryRequest(req)
        if (!target) return res.status(400).json({ message: "Invalid history item" })

        // Remove the element at `index` in a single atomic update
        const result = await User.updateOne(
            { _id: req.userId, [`history.${target.index}`]: target.command },
            [{
                $set: {
                    history: {
                        $concatArrays: [
                            { $slice: ["$history", target.index] },
                            { $slice: ["$history", target.index + 1, { $size: "$history" }] },
                        ],
                    },
                },
            }]
        )
        if (result.matchedCount === 0) {
            return res.status(409).json({ message: "This command has changed. Refresh and try again." })
        }
        return sendHistory(req, res)
    } catch (error) {
        console.error("HISTORY DELETE ERROR:", error)
        return res.status(500).json({ message: "Could not delete command" })
    }
}

// Clear the whole history
export const clearHistory = async (req, res) => {
    try {
        await User.updateOne({ _id: req.userId }, { $set: { history: [] } })
        return sendHistory(req, res)
    } catch (error) {
        console.error("HISTORY CLEAR ERROR:", error)
        return res.status(500).json({ message: "Could not clear history" })
    }
}
