import axios from 'axios'
import React, { useCallback, useEffect, useState } from 'react'
import { userDataContext } from './userDataContext'

const configuredServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
const serverUrl = configuredServerUrl.replace(/\/+$/, "")
const UserDataProvider = userDataContext.Provider

function UserContext({ children }) {
    // State variables to manage user data and image selections
    const [userData, setUserData] = useState(null)        // Stores current logged-in user info
    const [authChecked, setAuthChecked] = useState(false) // True once the session check has finished
    const [frontendImage, setFrontendImage] = useState(null) // Stores uploaded frontend image
    const [backendImage, setBackendImage] = useState(null)   // Stores uploaded backend image
    const [selectedImage, setSelectedImage] = useState(null) // Stores the currently selected assistant image

    // Fetch the current authenticated user's data from backend.
    // The JWT lives in an httpOnly cookie that JavaScript cannot read, so always ask the server.
    const handleCurrentUser = useCallback(async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
            setUserData(result.data)
        } catch (error) {
            if (error.response?.status !== 401) console.error("Error fetching user:", error)
            setUserData(null)
        } finally {
            setAuthChecked(true)
        }
    }, [])

    // Send a command to the AI assistant; errors are rethrown so the caller can show them
    const getGeminiResponse = useCallback(async (command) => {
        const result = await axios.post(
            `${serverUrl}/api/user/asktoassistant`,
            { command },
            { withCredentials: true }      // Include cookies for authentication
        )
        return result.data
    }, [])

    // Fetch user data when component mounts
    useEffect(() => {
        handleCurrentUser()
    }, [handleCurrentUser])

    const value = {
        serverUrl,
        userData,
        setUserData,
        authChecked,
        backendImage,
        setBackendImage,
        frontendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse,
        handleCurrentUser,
    }

    return (
        <UserDataProvider value={value}>
            {children}
        </UserDataProvider>
    )
}

export default UserContext
