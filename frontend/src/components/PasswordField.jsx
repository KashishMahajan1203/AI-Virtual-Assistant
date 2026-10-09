import React, { useState } from 'react'
import { IoEye, IoEyeOff } from 'react-icons/io5'

// Password input with a show/hide toggle
function PasswordField({ id, label, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input id={id} type={showPassword ? 'text' : 'password'} className="field pr-12" required {...inputProps} />
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted transition hover:text-fg"
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? <IoEyeOff className="h-5 w-5" /> : <IoEye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}

export default PasswordField
