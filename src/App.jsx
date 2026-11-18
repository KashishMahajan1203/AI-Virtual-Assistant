import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Home from './pages/Home'
import Customize from './pages/Customize'
import Customize2 from './pages/Customize2'
import { userDataContext } from './context/userDataContext'

function App() {
  const { userData, authChecked } = useContext(userDataContext)

  // Wait for the session check so a refresh doesn't bounce signed-in users to /signup
  if (!authChecked) {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-accent" />
      </div>
    )
  }

  // After signing in/up, users without an assistant go straight to setting one up
  const afterAuth = <Navigate to={userData?.assistantName ? "/" : "/customize"} replace />

  return (
    <Routes>
      {/* Existing users always return to Home, even before setting assistant details. */}
      <Route path='/' element={userData ? <Home /> : <Navigate to="/signup" />} />
      <Route path='/signup' element={!userData ? <SignUp /> : afterAuth} />
      <Route path='/signin' element={!userData ? <SignIn /> : afterAuth} />
      <Route path='/customize' element={userData ? <Customize /> : <Navigate to="/signin" />} />
      <Route path='/customize2' element={userData ? <Customize2 /> : <Navigate to="/signin" />} />
      <Route path='*' element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
