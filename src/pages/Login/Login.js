import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import "./Login.css";

function Login({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAdminRedirect = (email) => {
    if (email === 'swiftsail.ferries@gmail.com') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleAdminRedirect(userCredential.user.email);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.displayName,
        lastLogin: new Date(),
      }, { merge: true });
      handleAdminRedirect(user.email);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <button className="close-button" onClick={onClose}>×</button>
        <img src="dddddddddd"  className="logo" />
        <h2>FURWELL</h2>
        {error && <div className="error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input type="text" placeholder="Username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="sign-in-button">Sign In</button>
        </form>
        <p className="or">or</p>
        <button className="google-sign-in" onClick={() => handleSocialLogin(new GoogleAuthProvider())}>
          <img src="google-logo.png" alt="Google" className="google-icon" />
          Sign in with Google
        </button>
        <p className="create-account">New to FurWell? <a href="/signup">Create Account</a></p>
      </div>
    </div>
  );
};

export default Login;
