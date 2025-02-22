import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import furwell_logo from '../../images/furwell_logo.png';

import Login from '../../pages/Login/Login';
import Signup from '../../pages/Signup/Signup';

const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginClick = () => navigate('/login');
    const handleSignupClick = () => navigate('/signup');

    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const navigateAndScroll = (id) => {
        if (location.pathname === '/maps') {
            navigate('/');
            setTimeout(() => scrollToSection(id), 100);
        } else {
            scrollToSection(id);
        }
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };
    const goToContact = () => {
        if (location.pathname === '/maps') {
            navigate('/');
            setTimeout(scrollToBottom, 100);
        } else {
            scrollToBottom();
        }
    };
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
                <li className={styles.navbarItem} onClick={() => navigateAndScroll('home')}>Home</li>
                        <li className={styles.navbarItem} onClick={() => navigateAndScroll('about')}>About</li>
                        <li className={styles.navbarItem} onClick={() => navigateAndScroll('services')}>Services</li>
                        <li className={styles.navbarItem} onClick={() => navigateAndScroll('appointments')}>Appointments</li>
                        <li className={styles.navbarItem} onClick={goToContact}>Contact Us</li>
                    <li className={styles.navbarItem}>
                        <Link to="/maps" className={styles.navbarLink}>Maps</Link>
                    </li>
                </ul>

                {/* Right: Login and Signup Buttons */}
                <div className={styles.rightSection}>
                    <button onClick={handleLoginClick} className={styles.loginButton}>Login</button>
                    <button onClick={handleSignupClick} className={styles.signupButton}>Sign Up</button>
                </div>
            </div>
        </nav>
        <div className={styles.scrollProgressBar} style={{ width: `${scrollProgress}%` }}></div>
        </>
    );
};

export default Navbar;