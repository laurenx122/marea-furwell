import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import doggo from '../../images/baby_doggy.png';

const Login = () => {
  const navigate = useNavigate(); // For navigation

  return (
      <div className="login-container">
        <div className="login-box">
          <img src={doggo} alt="Dog" className="dog-img" />
          <h1 className="logo">FURWELL</h1>
          <form>
            <div className="input-container">
              <input type="text" placeholder="Username" required />
            </div>
            <div className="input-container">
              <input type="password" placeholder="Password" required />
            </div>
            <button className="sign-in-btn">Sign In</button>
          </form>
          <p>or continue with</p>
          <button className="google-btn">Google</button>
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
