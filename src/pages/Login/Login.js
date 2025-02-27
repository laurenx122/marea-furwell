import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import doggo from '../../images/baby_doggy.png';
import furwell_logo from '../../images/furwell_logo.png';
import { CiUser , CiUnlock } from "react-icons/ci";
import { FcGoogle } from "react-icons/fc";

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
      console.log('User logged in:', userCredential.user);
      
      // Navigate to Clinic Home after login
      navigate('/PetOwnerHome');
    } catch (error) {
      setError(error.message);
      alert("Login failed: " + error.message);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email,
          name: user.displayName,
          lastLogin: new Date(),
        },
        { merge: true }
      );

      console.log('User logged in and data stored:', user);
      alert('Login successful!');

      // Navigate after successful login
      navigate("/ClinicHome");
    } catch (error) {
      setError(error.message);
      alert("Login failed: " + error.message);
    }
  };

  return (
      <div className="login-container">
        <div className="login-box">
          <img src={doggo} alt="Dog" className="dog-img" />
          <img src={furwell_logo} alt="FurWell Logo" className="logo" />
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
        {/* Redirect to PetOwner */}
        <button className="petowner-home-button" onClick={() => navigate('/PetOwnerHome')}>
          Go to Pet Owner Home
        </button>
      </div>
  );
};

export default Login;
