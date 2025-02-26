import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import furwell_logo from '../../images/furwell_logo.png';

const Navbar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation(); // Detect route changes

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

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.navbarContent}>
                    {/* Left: Logo */}
                    <div className={styles.logoContainer}>
                        <img src={furwell_logo} alt="FurWell Logo" className={styles.logo} />
                    </div>

                    {/* Center: Navigation Links */}
                    <ul className={styles.navbarList}>
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
                    </ul>

                    {/* Right: Login and Signup Buttons */}
                    <div className={styles.rightSection}>
                        <button onClick={() => navigate('/Login')} className={styles.loginButton}>Login</button>
                        <button onClick={() => navigate('/signup')} className={styles.signupButton}>Sign Up</button>
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
