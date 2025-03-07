import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import { CiUser , CiUnlock } from "react-icons/ci";
import { FcGoogle } from "react-icons/fc";
import { getDoc } from 'firebase/firestore';

const Login = () => {
  const navigate = useNavigate(); // For navigation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

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
            alert("Login successfully!"); 
          
            if (userData.Type === "Admin") {
                navigate("/AdminHome"); 
            } else if  (userData.Type === "Pet owner") {
                navigate("/PetOwnerHome"); 
            }else if (userData.Type === "Clinic"){
              navigate("/ClinicHome"); 
            }
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


  return (
      <div className="login-container">
        <div className="login-box">
          <img src='/images/baby_doggy.png' alt="Dog" className="dog-img" />
          <img src='/images/furwell_logo.png' alt="FurWell Logo" className="logo" />
          <form onSubmit={handleSubmit}>
            <div className="input-container">
              <CiUser className="icon"/>
              <input type="text" placeholder="Email / Mobile Number"  value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-container">
              <CiUnlock className="icon"/>
              <input type="password" placeholder="Password"  value={password}
              onChange={(e) => setPassword(e.target.value)} required />
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
      </div>
  );
};

export default Login;
