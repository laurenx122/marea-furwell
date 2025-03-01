import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Navbar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation(); // Detect route changes
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userDetails, setUserDetails] = useState({ firstName: '', lastName: '', contactNumber: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editedDetails, setEditedDetails] = useState({ firstName: '', lastName: '', contactNumber: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
    const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);


    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setScrollProgress(0);
    }, [location.pathname]); 

    useEffect(() => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
              setIsLoggedIn(true);
              await fetchUserDetails(user.uid);
          } else {
              setIsLoggedIn(false);
              setIsAdmin(false);
              setUserDetails({ firstName: '', lastName: '', contactNumber: '' });
          }
      });

      return () => unsubscribe();
  }, []);

  const fetchUserDetails = async (uid) => {
      try {
          const userDocRef = doc(db, 'users', uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUserDetails({
                  firstName: userData.FirstName || '',
                  lastName: userData.LastName || '',
                  contactNumber: userData.contactNumber || '',
              });
              setEditedDetails({
                firstName: userData.FirstName || '',
                lastName: userData.LastName || '',
                contactNumber: userData.contactNumber || '',
            });
              setIsAdmin(userData.Type === "Admin");
          }
      } catch (error) {
          console.error("Error fetching user details:", error);
      }
  };



const handleSave = async () => {
    setIsConfirmModalOpen(true);
};

const confirmSave = async () => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                FirstName: editedDetails.firstName,
                LastName: editedDetails.lastName,
                contactNumber: editedDetails.contactNumber,
            });
            setUserDetails(editedDetails);
            setIsEditing(false);
            setIsModalOpen(false);
        }
    } catch (error) {
        console.error("Error updating user details:", error);
    }
    setIsConfirmModalOpen(false);
};

const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
};

const confirmSignOut = async () => {
    try {
        await signOut(getAuth());
        setIsSignOutSuccessOpen(true);
    } catch (error) {
        console.error('Error signing out:', error);
    }
    setIsSignOutConfirmOpen(false);
};


    
    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.navbarContent}>
                    {/* Left: Logo */}
                    <div className={styles.logoContainer}>
                        <img src='/images/furwell_logo.png' alt="FurWell Logo" className={styles.logo} />
                    </div>

                    {/* Center: Navigation Links */}
                    <ul className={styles.navbarList}>
                    {isAdmin ? (
                            <>
                                <li className={styles.navbarItem}>
                                    <Link to="/AdminHome" className={styles.navbarLink}>Clinics</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/AdminAnalytics" className={styles.navbarLink}>Analytics</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/AdminSubscription" className={styles.navbarLink}>Subscription</Link>
                                </li>
                            </>
                        ): (
                            <>
                                <li className={styles.navbarItem}>
                                    <Link to="/Home" className={styles.navbarLink}>Home</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                  <Link
                                        to="#"
                                        className={styles.navbarLink}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.scrollTo({
                                                top: document.documentElement.scrollHeight,
                                                behavior: "smooth",
                                            });
                                        }}
                                    >
                                        Contact Us
                                    </Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/maps" className={styles.navbarLink}>Maps</Link>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* Right: User Info or Login Buttons */}
                    <div className={styles.rightSection}>
                        {isLoggedIn ? (
                            <div className={styles.userMenu}>
                                <span 
                                    className={styles.username} 
                                    onClick={() => setIsModalOpen(true)}
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    {userDetails.firstName}
                                </span>
                                <button onClick={handleSignOut} className={styles.logoutButton}>Sign Out</button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => navigate('/Login')} className={styles.loginButton}>Login</button>
                                <button onClick={() => navigate('/signup')} className={styles.signupButton}>Sign Up</button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Scroll Progress Bar (Hidden if progress is 0) */}
            {scrollProgress > 0 && <div className={styles.scrollProgressBar} style={{ width: `${scrollProgress}%` }}></div>}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>User Information</h2>
                        <p>First Name </p>
                        <input type="text" value={editedDetails.firstName} onChange={(e) => setEditedDetails({...editedDetails, firstName: e.target.value})} />
                        <p>Last Name </p>
                        <input type="text" value={editedDetails.lastName} onChange={(e) => setEditedDetails({...editedDetails, lastName: e.target.value})} />
                        <p>Contact Number</p>
                        <input type="text" value={editedDetails.contactNumber} onChange={(e) => setEditedDetails({...editedDetails, contactNumber: e.target.value})} />
                        <button onClick={handleSave}>Save</button>
                        <button onClick={() => setIsModalOpen(false)} className={styles.cancelButton}>Cancel</button>
                    </div>
                </div>
            )}
            {isConfirmModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>Confirm Changes?</p>
                        <button onClick={confirmSave}>Yes</button>
                        <button onClick={() => setIsConfirmModalOpen(false)} className={styles.cancelButton}>Cancel</button>
                    </div>
                </div>
            )}
            {isSignOutConfirmOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>Are you sure you want to sign out?</p>
                        <button onClick={confirmSignOut}>Yes</button>
                        <button onClick={() => setIsSignOutConfirmOpen(false)} className={styles.cancelButton}>Cancel</button>
                    </div>
                </div>
            )}
            {isSignOutSuccessOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>Signed out successfully!</p>
                        <button onClick={() => { setIsSignOutSuccessOpen(false); navigate('/Home'); }}>OK</button>
                    </div>
                </div>
            )}
        </>
    );
  
}

export default Navbar;
