import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css'; 
import furwell_logo from '../../images/furwell_logo.png';
import { FaTimes, FaPaw } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone } from "react-icons/fi";

const Signup = () => {
  const navigate = useNavigate(); // For navigation

  return (
      <div className="signup-container">
        <div className="signup-box">
          {/* Header */}
          <div className="signup-header">
          <div className="signup-head">
            <h2>Sign Up</h2>
            <p>Compassionate Care for Every Paw, Hoof, and Claw!</p>
          </div>
          <img src={furwell_logo} alt="FurWell Logo" className="signup-logo" />
        </div>
           {/* Form Fields */}
        <form>
        <div className="name-container">
            <input type="text" placeholder="First Name" required />
            <input type="text" placeholder="Last Name" required />
          </div>

          <div className="input-container">
            <FiMail className="icon" />
            <input type="email" placeholder="Email Address" required />
          </div>

          <div className="input-container">
            <FiPhone className="icon" />
            <select className="country-code">
              <option>PH +63</option>
              {/* Add other country codes if needed */}
            </select>
            <input type="text" placeholder="XXX - XXXX - XXX" required />
          </div>

          <div className="input-container">
            <FiLock className="icon" />
            <input type="password" placeholder="Password" required />
          </div>

          <div className="input-container">
            <FiLock className="icon" />
            <input type="password" placeholder="Confirm Password" required />
          </div>

          {/* Terms & Conditions */}
          <div className="terms">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="/">Terms and Conditions</a>
            </span>
          </div>

          {/* Create Account Button */}
          <button className="create-account">
            <FaPaw className="paw-icon" /> Create Account
          </button>
        </form>
      </div>
      </div>
  );
};

export default Signup
