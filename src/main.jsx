import { StrictMode } from 'react'                    // React strict mode (helps detect potential problems)
import { createRoot } from 'react-dom/client'        // React 18 root API for rendering
import './index.css'                                 // Global CSS
import App from './App.jsx'                           // Main App component
import { BrowserRouter } from "react-router-dom"     // Router for handling URL navigation
import UserContext from './context/UserContext.jsx'  // Context provider for user authentication and data

// Create root and render the app
createRoot(document.getElementById('root')).render(
  <BrowserRouter>            {/* Wrap app in router to enable routing */}
    <UserContext>            {/* Wrap app in context to provide user data to all components */}
      <App />                {/* Main application component */}
    </UserContext>
  </BrowserRouter>,
)
