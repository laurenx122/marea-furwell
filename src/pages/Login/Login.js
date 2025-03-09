import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import { CiUser, CiUnlock } from "react-icons/ci";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setEmail('');
            setPassword('');
            
            // Show success modal
            setShowSuccessModal(true);
            
            // Auto close modal after 2 seconds and navigate
            setTimeout(() => {
                setShowSuccessModal(false);
                if (userData.Type === "Admin") {
                    navigate("/AdminHome"); 
                } else if (userData.Type === "Pet owner") {
                    navigate("/PetOwnerHome"); 
                } else if (userData.Type === "Clinic") {
                    navigate("/ClinicHome"); 
                }
            }, 2000);
        } else {
            console.error("User data not found in Firestore.");
            setEmail('');
            setPassword('');
            alert("Login failed: User data not found.");
            setError("User data not found in Firestore.");
        }
    } catch (error) {
        setError(error.message);
        alert("Login failed: " + error.message);
    }
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <div className="success-modal-overlay">
        <div className="success-modal">
          <div className="success-content">
            <img src="https://cliply.co/wp-content/uploads/2021/03/372103860_CHECK_MARK_400px.gif" alt="Success" className="success-gif" />
            <h3>Logged In Successfully</h3>
          </div>
        </div>
      </div>
    );
  };

  return (
      <div className="login-container">
        <div className="login-box">
          <img src='/images/baby_doggy.png' alt="Dog" className="dog-img" />
          <img src='/images/furwell_logo.png' alt="FurWell Logo" className="logo-furwell" />
          <form onSubmit={handleSubmit}>
            <div className="input-container">
              <CiUser className="icon"/>
              <input type="text" placeholder="Email / Mobile Number"  value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-container">
              <CiUnlock className="icon"/>
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
            <button className="sign-in-btn">Sign In</button>
          </form>
          <p>or continue with</p>
          <button className="google-btn"><FcGoogle size={24}/> Google</button>
          <p className="signup-text">
            Don't have an account yet? <a href="/signup">Sign Up for Free</a>
          </p>
        </div>
        
        {/* Redirect to ClinicHome */}
        <button className="clinic-home-btn" onClick={() => navigate('/ClinicHome')}>
          Go to Clinic Home
        </button>
        <button className="petowner-home-button" onClick={() => navigate('/VeterinaryHome')}>
          Go to Vet Home
        </button>
      {/* Success Modal */}
      <SuccessModal />
    </div>
  );
};

export default Login;