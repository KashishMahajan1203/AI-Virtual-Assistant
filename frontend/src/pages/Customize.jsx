import React, { useContext, useEffect, useRef, useState } from 'react'
import { RiImageAddLine } from "react-icons/ri";           // Icon for "Add Image"
import { RiLogoutBoxRLine } from "react-icons/ri"
import axios from 'axios'
import Card from '../components/Card'                      // Card component for preset images
import image1 from '../assets/image1.png'
import image2 from '../assets/image2.jpg'
import image3 from '../assets/authBg.png'
import image4 from '../assets/image4.png'
import image5 from '../assets/image5.png'
import image6 from '../assets/image6.jpeg'
import image7 from '../assets/image7.jpeg'
import { userDataContext } from '../context/UserContext'   // Context for user data and image states
import { useNavigate } from 'react-router-dom'             // For programmatic navigation

function Customize() {
  // Consume context values for selected images and state setters
  const { userData, setBackendImage, frontendImage, setFrontendImage, selectedImage, setSelectedImage, serverUrl, setUserData } = useContext(userDataContext)
  const navigate = useNavigate()         // Navigation hook to move between routes
  const inputImage = useRef(null)        // Ref to hidden file input element
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [uploadError, setUploadError] = useState("")

  useEffect(() => {
    setSelectedImage(userData?.assistantImage || null)
    setBackendImage(null)
    setFrontendImage(null)
  }, [userData?.assistantImage, setBackendImage, setFrontendImage, setSelectedImage])

  useEffect(() => () => {
    if (frontendImage) URL.revokeObjectURL(frontendImage)
  }, [frontendImage])

  const handleLogOut = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setUserData(null)
      navigate('/signin')
    }
  }

  // Handle image upload from user's local device
  const handleImage = (e) => {
    const file = e.target.files?.[0]     // Get first selected file
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file to upload.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.")
      return
    }
    setUploadError("")
    setBackendImage(file)                 // Store raw file for backend upload
    setFrontendImage(URL.createObjectURL(file)) // Create preview URL for frontend display
    setSelectedImage("input")
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-slate-950 via-[#030353] to-slate-900 flex justify-center items-center flex-col p-4 sm:p-6">
      <button
        type="button"
        className="glass-panel absolute right-5 top-5 z-10 flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
        onClick={() => setShowLogoutConfirm(true)}
      >
        <RiLogoutBoxRLine className="h-[18px] w-[18px]" />
        Log Out
      </button>

      {/* HEADING SECTION */}
      <h1 className="text-white text-2xl sm:text-3xl mb-8 sm:mb-10 text-center px-4">
        Select your <span className="text-blue-200">Assistant Image</span>
      </h1>

      {/* CARDS SECTION: Preset Images */}
      <div className="w-full max-w-[900px] flex justify-center items-center flex-wrap gap-4">
        {userData?.assistantImage && ![image1, image2, image3, image4, image5, image6, image7].includes(userData.assistantImage) && (
          <button
            type="button"
            aria-pressed={selectedImage === userData.assistantImage}
            aria-label="Keep current assistant image"
            className={`relative h-[190px] w-[110px] overflow-hidden rounded-2xl border-2 bg-[#020220] transition hover:border-white sm:h-[210px] sm:w-[120px] lg:h-[250px] lg:w-[150px] ${selectedImage === userData.assistantImage ? "border-white shadow-2xl shadow-blue-950" : "border-blue-500/40"}`}
            onClick={() => {
              setSelectedImage(userData.assistantImage)
              setBackendImage(null)
              setFrontendImage(null)
              setUploadError("")
            }}
          >
            <img src={userData.assistantImage} alt="Current assistant" className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-slate-950/80 py-2 text-xs font-semibold text-white">Current image</span>
          </button>
        )}
        <Card image={image1} />
        <Card image={image2} />
        <Card image={image3} />
        <Card image={image4} />
        <Card image={image5} />
        <Card image={image6} />
        <Card image={image7} />

        {/* CUSTOM IMAGE UPLOAD CARD */}
        <div
          className={`w-[110px] h-[190px] sm:w-[120px] sm:h-[210px] lg:w-[150px] lg:h-[250px]
            bg-[#020220] border-2 border-[#0000ff66] rounded-2xl
            overflow-hidden hover:shadow-2xl hover:shadow-blue-500
            cursor-pointer hover:border-4 hover:border-white flex
            justify-center items-center ${selectedImage === "input" ? "border-4 border-white shadow-2xl shadow-blue-950" : ""}`}
          onClick={() => {
            inputImage.current.click()   // Open file selection dialog
          }}
        >
          {/* Show icon if no image is uploaded; otherwise show uploaded preview */}
          {!frontendImage ? (
            <RiImageAddLine className="text-white w-6 h-6" />
          ) : (
            <img src={frontendImage} alt="Uploaded" className="h-full w-full object-cover" />
          )}
        </div>

        {/* HIDDEN FILE INPUT */}
        <input
          type="file"
          accept="image/*"
          ref={inputImage}             // Reference for programmatic click
          hidden
          onChange={handleImage}       // Handle file selection
        />
      </div>

      {uploadError && <p role="alert" className="mt-4 text-center text-sm text-rose-300">{uploadError}</p>}

      {/* NEXT BUTTON */}
      {selectedImage && (
        <button
          className="min-w-[150px] h-[56px] mt-[30px] text-black 
                     font-semibold cursor-pointer bg-white rounded-full text-base sm:text-lg hover:bg-gray-200 
                     transition-all shadow-lg shadow-blue-500/20"
          onClick={() => navigate("/customize2")} // Navigate to next customization step
        >
          Next
        </button>
      )}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLogoutConfirm(false)
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="customize-logout-title"
            aria-describedby="customize-logout-description"
            className="auth-card glass-panel w-full max-w-[420px] rounded-[24px] p-6 sm:p-8"
          >
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-rose-400/10 text-rose-300">
              <RiLogoutBoxRLine className="h-6 w-6" />
            </div>
            <h2 id="customize-logout-title" className="text-xl font-semibold text-white">Log out of your assistant?</h2>
            <p id="customize-logout-description" className="mt-2 text-sm leading-6 text-slate-300">You can sign back in whenever you’re ready.</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="h-11 rounded-full border border-white/15 px-5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-11 rounded-full bg-rose-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
                onClick={handleLogOut}
              >
                Log Out
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Customize
