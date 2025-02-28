import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Navbar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation(); // Detect route changes
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [userDetails, setUserDetails] = useState({ firstName: '', lastName: '', mobile: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);

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
              setUserDetails({ firstName: '', lastName: '', mobile: '' });
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
                  mobile: userData.Mobile || '',
              });
              setIsAdmin(userData.Type === "Admin");
          }
      } catch (error) {
          console.error("Error fetching user details:", error);
      }
  };

const handleSignOut = async () => {
  try {
      await signOut(getAuth());
      navigate('/Home');
      alert("Signed out successfully!");
  } catch (error) {
      console.error('Error signing out:', error);
  }
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
            {scrollProgress > 0 && (
                <div className={styles.scrollProgressBar} style={{ width: `${scrollProgress}%` }}></div>
            )}
                        {/* Modal for User Details */}
                        {isModalOpen && (
                        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2>User Information</h2>
                        <p><strong>First Name:</strong> {userDetails.firstName}</p>
                        <p><strong>Last Name:</strong> {userDetails.lastName}</p>
                        <p><strong>Mobile Number:</strong> {userDetails.mobile}</p>
                        <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
  
}

export default Navbar;
