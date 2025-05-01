import { useNavigate } from 'react-router-dom';
import './Signup.css'; 
import { FaTimes, FaPaw, FaCamera } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone } from "react-icons/fi";
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import emailjs from 'emailjs-com';

const Signup = ({ onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setfName] = useState("");
  const [lname, setlName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [userCredentialTemp, setUserCredentialTemp] = useState(null);
  const otpModalRef = useRef(null);
  const UPLOAD_PRESET = "furwell";
  const [showTermsModal, setShowTermsModal] = useState(false);
  const termsModalRef = useRef(null);

   const handleOutsideClick = (e) => {
    if (otpModalRef.current && !otpModalRef.current.contains(e.target)) {
      setShowOTPModal(false);
      setOtp("");
      setGeneratedOTP("");
    }
    if (termsModalRef.current && !termsModalRef.current.contains(e.target)) {
      setShowTermsModal(false);
    }
  };

  // Add handler for opening terms modal
  const openTermsModal = (e) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  useEffect(() => {
    emailjs.init("59--iStzN3U4AfD9O"); // Your EmailJS public key
  }, []);

  useEffect(() => {
    if (showOTPModal) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showOTPModal]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const isValidPhilippinesNumber = (number) => {
    const phRegex = /^(\+63|0)9\d{9}$/;
    return phRegex.test(number);
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  const sendOTPEmail = async (emailToSend) => {
    if (!emailToSend || emailToSend.trim() === "") {
      throw new Error("Email address is empty");
    }

    const emailParams = {
      to_email: emailToSend,
      otp: generateOTP(),
      company_name: "Furwell",
      logo_url: "https://furwell.vercel.app/images/furwell_logo.png",
      company_email: "mareafurwell@gmail.com",
    };

    try {
      const response = await emailjs.send(
        "service_Furwell", // Your EmailJS Service ID
        "template_2aive7t", // Your EmailJS Template ID
        emailParams,
        "59--iStzN3U4AfD9O" // Your EmailJS Public Key
      );
      setGeneratedOTP(emailParams.otp); // Set OTP after successful send
    } catch (error) {
      setError(`Failed to send OTP email: ${error.text || error.message || "Unknown error"}`);
      throw error;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Clear previous errors
    
    const formEmail = e.target.elements.email.value || email;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    if (!isValidPhilippinesNumber(contactNumber)) {
      setError("Invalid Philippines contact number");
      setIsLoading(false);
      return;
    }

    if (!formEmail || formEmail.trim() === "") {
      setError("Email address is required");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formEmail, password);
      setUserCredentialTemp(userCredential);

      await sendOTPEmail(formEmail);
      
      setIsLoading(false);
      setShowOTPModal(true);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.message || String(error);
      if (errorMessage.includes("Failed to send OTP")) {
        // Error already set in sendOTPEmail
      } else {
        handleSignupError(error);
      }
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp !== generatedOTP) {
      setError("Invalid OTP. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      const user = userCredentialTemp.user;
      let profileImageURL = "";

      if (profileImage && (
        profileImage.type === "image/jpeg" ||
        profileImage.type === "image/jpg" ||
        profileImage.type === "image/png"
      )) {
        try {
          const image = new FormData();
          image.append("file", profileImage);
          image.append("cloud_name", "dfgnexrda");
          image.append("upload_preset", UPLOAD_PRESET);

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
            { method: "post", body: image }
          );

          if (!response.ok) throw new Error("Image upload failed");
          const imgData = await response.json();
          profileImageURL = imgData.url.toString();
        } catch (uploadError) {
          setError("Failed to upload profile picture. Continuing with signup...");
        }
      }

      await setDoc(doc(db, "users", user.uid), {
        Type: "Pet owner",
        FirstName: fname,
        LastName: lname,
        email: email,
        contactNumber: contactNumber,
        profileImageURL: profileImageURL,
        uid: user.uid,
      });

      setIsLoading(false);
      setShowOTPModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      setError("An error occurred during verification. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSignupError = (error) => {
    if (error.code === 'auth/email-already-in-use') {
      setError("This email is already registered. Please use a different email or try logging in.");
    } else if (error.code === 'auth/weak-password') {
      setError("Password is too weak. Please use at least 6 characters.");
    } else if (error.code === 'auth/invalid-email') {
      setError("Invalid email format. Please check your email address.");
    } else if (error.code === 'auth/network-request-failed') {
      setError("Network error. Please check your internet connection and try again.");
    } else {
      setError(`An error occurred during signup: ${error.message || "Unknown error"}`);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
    onSwitchToLogin();
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const goToLogin = () => {
    onClose();
    onSwitchToLogin();
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <div className="signup-head">
            <h2>Sign Up</h2>
            <p>Compassionate Care for Every Paw, Hoof, and Claw!</p>
          </div>
          <img src='/images/furwell_logo.png' alt="FurWell Logo" className="signup-logo" />
        </div>
        
        {error && (
          <div className="error-message">
            <FaTimes className="error-icon" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSignup}>
          <div className="name-container">
            <input type="text" placeholder="First Name" value={fname} onChange={(e) => setfName(e.target.value)} required />
            <input type="text" placeholder="Last Name" value={lname} onChange={(e) => setlName(e.target.value)} required />
          </div>

          <div className="input-container">
            <FiMail className="icon" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-container">
            <FiPhone className="icon" />
            <select className="country-code">
              <option>PH +63</option>
            </select>
            <input type="text" placeholder="09XXX - XXXX - XXX" value={contactNumber} onChange={(e) => setContactNumber(e.target.value.replace(/[^0-9]/g, ""))} required />
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

          <div className="terms">
            <input type="checkbox" required />
            <span>I agree to the <a href="#" onClick={openTermsModal}>Terms and Conditions</a></span>
          </div>
          {showTermsModal && (
          <div className="modal-overlay">
            <div className="terms-modal" ref={termsModalRef}>
              <button 
                className="modal-close-btn"
                onClick={() => setShowTermsModal(false)}
              >
                <FaTimes />
              </button>
        <h2>Terms and Conditions</h2>
        <div className="terms-content">
          <p>Welcome to FurWell! By signing up and using our services, you agree to the following terms and conditions. Please read them carefully.</p>
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing or using FurWell’s services, you agree to be bound by these Terms and Conditions, our Privacy Policy, and any additional guidelines or rules provided by FurWell.</p>
          <h3>2. Account Responsibilities</h3>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during signup.</p>
          <h3>3. Use of Services</h3>
          <p>FurWell provides a platform for pet owners to book veterinary appointments. You agree to use our services only for lawful purposes and in a manner that does not infringe on the rights of others.</p>
          <h3>4. Intellectual Property</h3>
          <p>All content on FurWell, including logos, text, and images, is the property of FurWell or its licensors. You may not reproduce or distribute this content without permission.</p>
          <h3>5. Termination</h3>
          <p>FurWell reserves the right to suspend or terminate your account if you violate these terms or engage in prohibited activities.</p>
          <h3>6. Limitation of Liability</h3>
          <p>FurWell is not liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>
          <h3>7. Contact Us</h3>
          <p>If you have questions about these Terms, contact us at <a href="mailto:mareafurwell@gmail.com">mareafurwell@gmail.com</a>.</p>
          <p>By clicking “I agree” during signup, you acknowledge that you have read, understood, and agree to these Terms and Conditions.</p>
        </div>
      </div>
    </div>
  )}

          <button type="submit" className="create-account" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : (
              <>
                <FaPaw className="paw-icon" /> Create Account
              </>
            )}
          </button>

          <div className="already-account">
            Already have an account? <a onClick={goToLogin} className="login-link">Login</a>
          </div>
        </form>
      </div>

      {showOTPModal && (
        <div className="modal-overlay">
          <div className="otp-modal" ref={otpModalRef}>
            <h2>Verify Your Email</h2>
            <p>We’ve sent a 6-digit OTP to {email}. Please enter it below:</p>
            <form onSubmit={handleOTPVerification}>
              <div className="input-container">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength="6"
                />
              </div>
              <button type="submit" className="create-account" disabled={isLoading}>
                {isLoading ? 'Verifying...' : (
                  <>
                    <FaPaw className="paw-icon" /> Verify OTP
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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