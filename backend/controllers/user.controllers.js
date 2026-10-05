import { response } from "express"                     // Importing Express response object (not typically needed directly)
import uploadOnCloudinary from "../config/cloudinary.js" // Utility for uploading images to Cloudinary
import geminiResponse from "../gemini.js"               // AI assistant response generator
import User from "../models/user.model.js"              // User model for DB operations
import moment from "moment"                             // Library for date and time formatting

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

        if (!assistantName) {
            return res.status(400).json({ message: "Assistant name is required" })
        }

        const updateFields = { assistantName }

        // Check whether user uploaded a new image
        if (req.file) {
            updateFields.assistantImage = await uploadOnCloudinary(req.file.path)
        } else if (typeof imageUrl === "string" && imageUrl.trim()) {
            updateFields.assistantImage = imageUrl.trim()
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
