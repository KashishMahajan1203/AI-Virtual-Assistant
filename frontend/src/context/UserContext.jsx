import axios from 'axios'
import React, { useEffect, useState, createContext } from 'react'

// Create a context to share user-related data and functions across the app
export const userDataContext = createContext()

function UserContext({ children }) {
    const configuredServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
    const serverUrl = configuredServerUrl.replace(/\/+$/, "")

    // State variables to manage user data and image selections
    const [userData, setUserData] = useState(null)        // Stores current logged-in user info
    const [frontendImage, setFrontendImage] = useState(null) // Stores uploaded frontend image
    const [backendImage, setBackendImage] = useState(null)   // Stores uploaded backend image
    const [selectedImage, setSelectedImage] = useState(null) // Stores the currently selected assistant image

    // Fetch the current authenticated user's data from backend
   const handleCurrentUser = async () => {
    // 1. Agar login token/cookie stored nahi hai to request mat bhejo
    const hasToken = document.cookie.includes('token'); // Apni cookie name check karein (e.g. 'token' ya 'jwt')

    if (!hasToken) {
        setUserData(null);
        return;
    }

    // 2. Agar token hai tabhi Request send karo
    try {
        const result = await axios.get(`${serverUrl}/api/user/current`, { 
            withCredentials: true 
        });
        setUserData(result.data);
    } catch (error) {
        if (error.response?.status === 401) {
            setUserData(null);
        } else {
            console.error("Error fetching user:", error);
        }
    }
};

    // Send a command to the AI assistant and get its response
    const getGeminiResponse = async (command) => {
        try {
            const result = await axios.post(
                `${serverUrl}/api/user/asktoassistant`,
                { command },
                { withCredentials: true }      // Include cookies for authentication
            )
            return result.data                  // Return AI assistant response
        } catch (error) {
            console.error("Error asking assistant:", error) // Handle errors
        }
    }

    // Fetch user data when component mounts
    useEffect(() => {
        handleCurrentUser()
    }, [])

    // Value object to provide context to consuming components
    const value = {
        serverUrl,
        userData,
        setUserData,
        backendImage,
        setBackendImage,
        frontendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse,
        handleCurrentUser // Added in case you want to refresh user manually after login/register
    }

    return (
        // Provide user data and functions to child components
        <userDataContext.Provider value={value}>
            {children}
        </userDataContext.Provider>
    )
}

export default UserContext