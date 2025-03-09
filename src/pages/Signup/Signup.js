import { useNavigate } from 'react-router-dom';
import './Signup.css'; 
import { FaTimes, FaPaw, FaCamera } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone, FiEye, FiEyeOff } from "react-icons/fi";
import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../../firebase'; // Ensure storage is exported
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setfName] = useState("");
  const [lname, setlName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  const isValidPhilippinesNumber = (number) => {
    const phRegex = /^(\+63|0)9\d{9}$/;
    return phRegex.test(number);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
 
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Reset any existing errors
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!isValidPhilippinesNumber(contactNumber)) {
      setError("Invalid Philippines contact number");
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Upload profile picture if one was selected
      let profilePictureUrl = null;
      if (profilePicture) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, profilePicture);
        profilePictureUrl = await getDownloadURL(storageRef);
      }
      
      // Store user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        Type: "Pet owner",
        FirstName: fname,
        LastName: lname,
        email: email,
        contactNumber: contactNumber,
        uid: user.uid,
        profilePictureUrl: profilePictureUrl
      });
      
      // Show success modal instead of alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Signup error:", error);
      
      // Handle specific Firebase errors with user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please use a different email or try logging in.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email format. Please check your email address.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError("An error occurred during signup. Please try again later.");
      }
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/Login');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Function to navigate to login page
  const goToLogin = () => {
    navigate('/Login');
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        {/* Header */}
        <div className="signup-header">
          <div className="signup-head">
            <h2>Sign Up</h2>
            <p>Compassionate Care for Every Paw, Hoof, and Claw!</p>
          </div>
          <img src='/images/furwell_logo.png' alt="FurWell Logo" className="signup-logo" />
        </div>
        
        {/* Error message with improved styling */}
        {error && (
          <div className="error-message">
            <FaTimes className="error-icon" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSignup}>
          {/* Profile Picture Upload */}
          <div className="profile-picture-container">
            <div 
              className="profile-picture-upload" 
              onClick={triggerFileInput}
              style={{ backgroundImage: previewUrl ? `url(${previewUrl})` : 'none' }}
            >
              {!previewUrl && (
                <>
                  <FaCamera className="camera-icon" />
                  <p>Upload Photo</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
          
          <div className="name-container">
            <input type="text" placeholder="First Name" value={fname} onChange={(e) => setfName(e.target.value)} required /> 
            <input type="text" placeholder="Last Name"  value={lname} onChange={(e) => setlName(e.target.value)} required />
          </div>

          <div className="input-container">
            <FiMail className="icon" />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-container">
            <FiPhone className="icon" />
            <select className="country-code">
              <option>PH +63</option>
            </select>
            <input type="text" placeholder="09XXX-XXXX-XXX" value={contactNumber} onChange={(e) => setContactNumber(e.target.value.replace(/[^0-9]/g, ""))} required />
          </div>

          <div className="input-container">
            <FiLock className="icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <div className="password-toggle" onClick={togglePasswordVisibility}>
              {showPassword ? (
                <img src="https://www.freeiconspng.com/thumbs/eye-icon/eyeball-icon-png-eye-icon-1.png" alt="Hide" className="eye-icon" />
              ) : (
                <img src="https://static.thenounproject.com/png/22249-200.png" alt="Show" className="eye-icon" />
              )}
            </div>
          </div>

          <div className="input-container">
            <FiLock className="icon" />
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
            <div className="password-toggle" onClick={toggleConfirmPasswordVisibility}>
              {showConfirmPassword ? (
                <img src="https://www.freeiconspng.com/thumbs/eye-icon/eyeball-icon-png-eye-icon-1.png" alt="Hide" className="eye-icon" />
              ) : (
                <img src="https://static.thenounproject.com/png/22249-200.png" alt="Show" className="eye-icon" />
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="terms">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="/">Terms and Conditions</a>
            </span>
          </div>

          {/* Create Account Button */}
          <button type="submit" className="create-account">
            <FaPaw className="paw-icon" /> Create Account
          </button>
          
          {/* Already have an account link */}
          <div className="already-account">
            Already have an account? <a onClick={goToLogin} className="login-link">Login</a>
          </div>
        </form>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-modal-content">
              <img src="/images/furwell_logo.png" alt="FurWell Logo" className="modal-logo" />
              <h2>Welcome to FurWell!</h2>
              <p>Your account has been successfully created.</p>
              <p className="success-message">Get ready for compassionate care for your furry friend!</p>
              <button onClick={closeSuccessModal} className="modal-button">
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;