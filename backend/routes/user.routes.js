import express from "express"   // Import Express to manage routing
import { askToAssistant, clearHistory, deleteHistoryItem, editHistoryItem, getCurrentUser, updateAssistant } from "../controllers/user.controllers.js"  // User-related controllers
import isAuth from "../middlewares/isAuth.js"   // Middleware to validate authentication
import upload from "../middlewares/multer.js"   // Multer middleware for handling file uploads

// Initialize router for user-specific operations
const userRouter = express.Router()

// Route to retrieve details of the authenticated user
userRouter.get("/current", isAuth, getCurrentUser)

// Route to update assistant details, including optional image upload
userRouter.post(
    "/update",
    isAuth,                              // Validate user authentication
    upload.single("assistantImage"),     // Handle single file upload with field name "assistantImage"
    updateAssistant                       // Controller to finalize update
)

// Route to process queries sent to the assistant
userRouter.post("/asktoassistant", isAuth, askToAssistant)

// Routes to edit, delete or clear the saved command history
userRouter.patch("/history/:index", isAuth, editHistoryItem)
userRouter.delete("/history/:index", isAuth, deleteHistoryItem)
userRouter.delete("/history", isAuth, clearHistory)

export default userRouter   // Export router for integration in the application
