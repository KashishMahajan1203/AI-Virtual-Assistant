import React, { useContext, useEffect, useRef, useState } from 'react'
import { RiImageAddLine, RiArrowRightLine, RiCheckLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import AppHeader from '../components/AppHeader'
import StepHeader from '../components/StepHeader'
import image1 from '../assets/image1.png'
import image2 from '../assets/image2.jpg'
import image3 from '../assets/authBg.png'
import image4 from '../assets/image4.png'
import image5 from '../assets/image5.png'
import image6 from '../assets/image6.jpeg'
import image7 from '../assets/image7.jpeg'
import { userDataContext } from '../context/userDataContext'

const presetImages = [image1, image2, image3, image4, image5, image6, image7]

function Customize() {
  const { userData, setBackendImage, frontendImage, setFrontendImage, selectedImage, setSelectedImage } = useContext(userDataContext)
  const navigate = useNavigate()
  const inputImage = useRef(null)        // Ref to hidden file input element
  const [uploadError, setUploadError] = useState("")
  const hasCustomCurrentImage = userData?.assistantImage && !presetImages.includes(userData.assistantImage)

  useEffect(() => {
    setSelectedImage(userData?.assistantImage || null)
    setBackendImage(null)
    setFrontendImage(null)
  }, [userData?.assistantImage, setBackendImage, setFrontendImage, setSelectedImage])

  useEffect(() => () => {
    if (frontendImage) URL.revokeObjectURL(frontendImage)
  }, [frontendImage])

  // Handle image upload from user's local device
  const handleImage = (e) => {
    const file = e.target.files?.[0]
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
    setBackendImage(file)                       // Raw file for the backend upload
    setFrontendImage(URL.createObjectURL(file)) // Preview URL for display
    setSelectedImage("input")
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
        <StepHeader
          step={1}
          total={2}
          title="Choose how your assistant looks"
          description="Pick one of the presets or upload your own image (PNG, JPG or GIF, up to 5 MB)."
        />

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
          {hasCustomCurrentImage && (
            <button
              type="button"
              aria-pressed={selectedImage === userData.assistantImage}
              aria-label="Keep current assistant image"
              className={`group relative aspect-[3/5] w-full overflow-hidden rounded-2xl border-2 bg-surface-2 transition
                ${selectedImage === userData.assistantImage ? "border-accent ring-4 ring-accent-soft" : "border-transparent hover:border-line"}`}
              onClick={() => {
                setSelectedImage(userData.assistantImage)
                setBackendImage(null)
                setFrontendImage(null)
                setUploadError("")
              }}
            >
              <img src={userData.assistantImage} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 py-1.5 text-center text-xs font-semibold text-white">Current</span>
              {selectedImage === userData.assistantImage && (
                <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-fg shadow">
                  <RiCheckLine className="h-4 w-4" />
                </span>
              )}
            </button>
          )}

          {presetImages.map((image, index) => (
            <Card key={image} image={image} label={`Preset assistant image ${index + 1}`} />
          ))}

          {/* CUSTOM IMAGE UPLOAD TILE */}
          <button
            type="button"
            aria-pressed={selectedImage === "input"}
            aria-label={frontendImage ? "Replace uploaded image" : "Upload your own image"}
            className={`relative flex aspect-[3/5] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed bg-surface text-muted transition hover:text-fg
              ${selectedImage === "input" ? "border-accent ring-4 ring-accent-soft" : "border-line hover:border-accent"}`}
            onClick={() => inputImage.current.click()}
          >
            {!frontendImage ? (
              <>
                <RiImageAddLine className="h-7 w-7" />
                <span className="px-2 text-center text-xs font-medium">Upload image</span>
              </>
            ) : (
              <img src={frontendImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </button>

          <input type="file" accept="image/*" ref={inputImage} hidden onChange={handleImage} />
        </div>

        {uploadError && <p role="alert" className="mt-4 text-sm text-danger">{uploadError}</p>}
      </main>

      {/* STICKY FOOTER */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <p className="text-sm text-muted">{selectedImage ? "Nice choice." : "Select an image to continue."}</p>
          <button
            type="button"
            className="btn btn-primary h-12 px-6"
            disabled={!selectedImage}
            onClick={() => navigate("/customize2")}
          >
            Next
            <RiArrowRightLine className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Customize
