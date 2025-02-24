import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import doggo from '../../images/baby_doggy.png';
import furwell_logo from '../../images/furwell_logo.png';
import { CiUser , CiUnlock } from "react-icons/ci";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate(); // For navigation

  return (
      <div className="login-container">
        <div className="login-box">
          <img src={doggo} alt="Dog" className="dog-img" />
          <img src={furwell_logo} alt="FurWell Logo" className="logo" />
          <form>
            <div className="input-container">
              <CiUser className="icon"/>
              <input type="text" placeholder="Email / Mobile Number" required />
            </div>
            <div className="input-container">
              <CiUnlock className="icon"/>
              <input type="password" placeholder="Password" required />
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
