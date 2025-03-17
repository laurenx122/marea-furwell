import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, provider } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import { CiUser, CiUnlock } from "react-icons/ci";
import { FcGoogle } from "react-icons/fc";

const Login = ({ onClose, onSwitchToSignUp, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const goToSignUp = () => {
    onClose(); 
    onSwitchToSignUp(); 
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    onClose(); 
    onSwitchToSignUp(); 
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      // Check sign-in methods for the email
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      // If the user signed up with Google and is trying to use password login
      if (signInMethods.includes(GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD) &&
          !signInMethods.includes('password')) {
        // Prompt the user to use Google Sign In instead
        alert("This email is registered with Google. Please sign in with Google.");
        return;
      }

  
    // Proceed with normal email/password sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check both 'users' and 'clinics' collections
    const userDocRef = doc(db, "users", user.uid);
    const clinicDocRef = doc(db, "clinics", user.uid);

    const [userDocSnap, clinicDocSnap] = await Promise.all([
      getDoc(userDocRef),
      getDoc(clinicDocRef),
    ]);

    let userData = null;

    if (userDocSnap.exists()) {
      userData = userDocSnap.data();
    } else if (clinicDocSnap.exists()) {
      userData = clinicDocSnap.data();
    }

    if (userData) {
      setEmail('');
      setPassword('');

      // Show success modal
      setShowSuccessModal(true);

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Auto close modal after 2 seconds and navigate
      setTimeout(() => {
        setShowSuccessModal(false);
        if (userData.Type === "Admin") {
          navigate("/AdminHome");
        } else if (userData.Type === "Pet owner") {
          navigate("/PetOwnerHome");
        } else if (userData.Type === "Clinic") {
          navigate("/ClinicHome");
        } else if (userData.Type === "Veterinarian") {
          navigate("/VeterinaryHome");
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
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      // Check if the user already exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // User exists, get their type and navigate accordingly
        const userData = userDocSnap.data();
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Call the onLoginSuccess callback to notify parent component
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
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
        // New user, create a record with the specified fields
        // Extract first and last name from the Google displayName
        const displayName = user.displayName || "";
        const nameParts = displayName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        
        await setDoc(userDocRef, {
          Type: "Pet owner",
          FirstName: firstName,
          LastName: lastName,
          email: user.email,
          contactNumber: "", 
          profileImageURL: user.photoURL || "", // Google profile photo
          uid: user.uid
        });
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Call the onLoginSuccess callback to notify parent component
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Auto close modal and navigate to Pet Owner Home (default)
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/PetOwnerHome");
        }, 2000);
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(error.message);
      alert("Google Sign-In failed: " + error.message);
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
      <div className="login-container-modal"> {/* Update class name for modal styling */}
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
          <button className="google-btn" onClick={handleGoogleSignIn}><FcGoogle size={24}/> Google</button>
          <p className="signup-text">
            Don't have an account yet? <a onClick={goToSignUp} className="signup-link">Sign Up for Free</a>
          </p>
        </div>
        
        {/* Remove redirect buttons as they're not needed in the modal */}
        
        {/* Success Modal */}
        <SuccessModal />
      </div>
  );
};

export default Login;