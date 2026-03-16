import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  
  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Status
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validations
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    // Attempt to register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check if user was created safely
    if (authData?.user) {
      // Insert additional fields into 'users' table
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            institution_name: institutionName,
            email: email,
            phone_number: phoneNumber,
            created_at: new Date().toISOString()
          }
        ])

      if (dbError) {
        console.error("DB Insert Error:", dbError)
        setError("Account created, but failed to save profile details. " + dbError.message)
        // Note: depending on security, sometimes it's better to show a generic error
      } else {
        // Success
        navigate('/dashboard')
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2 className="auth-title">Create an Account</h2>
        <p className="auth-subtitle">Join SchedulAI today</p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="first_name">First Name</label>
              <input id="first_name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label htmlFor="last_name">Last Name</label>
              <input id="last_name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="institution">Institution Name</label>
            <input id="institution" type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="password">Create Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="input-group">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  )
}
