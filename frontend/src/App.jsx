import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom' // Routing components
import SignUp from './pages/SignUp'                         // Sign-up page
import SignIn from './pages/SignIn'                         // Sign-in page
import Home from './pages/Home'                             // Home page (main assistant interface)
import Customize from './pages/Customize'                   // Assistant image customization page
import Customize2 from './pages/Customize2'                 // Assistant name customization page
import { userDataContext } from './context/UserContext'    // Context for user authentication & data

function App() {
  const { userData } = useContext(userDataContext)         // Access current user data from context

  return (
    <Routes>
      {/* Existing users always return to Home, even before setting assistant details. */}
      <Route path='/' 
        element={userData ? <Home /> : <Navigate to={"/signup"} />} 
      />

      {/* Sign-up route: accessible only if user is not logged in */}
      <Route path='/signup' 
        element={!userData ? <SignUp /> : <Navigate to={"/"} />} 
      />

      {/* Sign-in route: accessible only if user is not logged in */}
      <Route path='/signin' 
        element={!userData ? <SignIn /> : <Navigate to={"/"} />} 
      />

      {/* Customize assistant image: accessible only if user is logged in */}
      <Route path='/customize' 
        element={userData ? <Customize /> : <Navigate to={"/signup"} />} 
      />

      {/* Customize assistant name: accessible only if user is logged in */}
      <Route path='/customize2' 
        element={userData ? <Customize2 /> : <Navigate to={"/signup"} />} 
      />
    </Routes>
  )
}

export default App
