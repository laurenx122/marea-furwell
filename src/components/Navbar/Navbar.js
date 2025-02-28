import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
const Navbar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation(); // Detect route changes
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
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
        // Listen for Firebase auth state changes
        const unsubscribe = onAuthStateChanged( getAuth(), (user) => {
            setIsLoggedIn(!!user);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [ getAuth()]);  useEffect(() => {
        // Check Firebase auth state
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoggedIn(true);
                checkAdminStatus(user.email); // Check if the user is an admin
            } else {
                setIsLoggedIn(false);
                setIsAdmin(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(getAuth());
            navigate('/Home'); // Redirect to home after sign out
            alert("Signout Successfully!")
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    const checkAdminStatus = (email) => {
        if (email === "mareafur@gmail.com") {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
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
                                    <Link to="/about" className={styles.navbarLink}>About</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/services" className={styles.navbarLink}>Services</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/appointments" className={styles.navbarLink}>Appointments</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/contact" className={styles.navbarLink}>Contact Us</Link>
                                </li>
                                <li className={styles.navbarItem}>
                                    <Link to="/maps" className={styles.navbarLink}>Maps</Link>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* Right: Login and Signup Buttons */}
                    <div className={styles.rightSection}>
                        {isLoggedIn ? (
                            <button onClick={handleSignOut} className={styles.logoutButton}>Sign Out</button>
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
        </>
    );
};

export default Navbar;
