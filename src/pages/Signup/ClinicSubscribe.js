
import { useNavigate } from 'react-router-dom';
import './ClinicSubscribe.css'; 
import { FaTimes, FaPaw } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone } from "react-icons/fi";
import React, { useState } from 'react';
import { auth, db } from '../../firebase'; // Ensure this path is correct
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';



const ClinicSubscribe = () => {
  const navigate = useNavigate(); // For navigation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setfName] = useState("");
  const [lname, setlName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState(null);

  const isValidPhilippinesNumber = (number) => {
    const phRegex = /^(\+63|0)9\d{9}$/;
    return phRegex.test(number);
  };
 
  const handleSignup = async (e) => {
    e.preventDefault();
    
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
      
      // Store user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        Type: "Pet owner",
        FirstName: fname,
        LastName: lname,
        email: email,
        contactNumber: contactNumber,
        uid: user.uid,
      });
      alert("Signup successful! 🎉"); 
    } catch (error) {
      setError(error.message);
    }
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
           {/* Form Fields */}
           {error && <p style={{ color: "red" }}>{error}</p>}
        <form  onSubmit={handleSignup}>
        <div className="name-container">
            {/* setting the values of the field */}
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
              {/* Add other country codes if needed */}
            </select>
            <input type="text" placeholder="XXX - XXXX - XXX"value={contactNumber}   onChange={(e) => setContactNumber(e.target.value.replace(/[^0-9]/g, ""))}    required />
          </div>

          <div className="input-container">
            <FiLock className="icon" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="input-container">
            <FiLock className="icon" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}  required />
          </div>

          {/* Terms & Conditions */}
          <div className="terms">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="/">Terms and Conditions</a>
            </span>
          </div>

          {/* Create Account Button */}
          <button  type="submit" className="create-account">
            <FaPaw className="paw-icon" /> Create Account
          </button>
        </form>
      </div>
      </div>
  );
};

export default ClinicSubscribe
