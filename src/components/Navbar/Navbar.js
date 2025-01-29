import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

import Login from '../../pages/Login/Login';
import Signup from '../../pages/Signup/Signup';

const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleSignupClick = () => {
        navigate('/signup');
    };


    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const goToHome = () => {
        if (location.pathname === '/maps') {
            navigate('/');
        } else {
            scrollToSection('home');
        }
    };

    const goToService = () => {
        if (location.pathname === '/maps') {
            navigate('/');
            setTimeout(() => {
                scrollToSection('services');
            }, 100);
        } else {
            scrollToSection('services');
        }
    };

    const goToContact = () => {
        if (location.pathname === '/maps') {
            navigate('/');
            setTimeout(() => {
                scrollToSection('contact');
            }, 100);
        } else {
            scrollToSection('contact');
        }
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContent}>
                {/* Left: Logo */}
                <div className={styles.logoContainer}>
                    <img src="/images/logo.png" alt="FurWell Logo" className={styles.logo} />
                </div>

                {/* Center: Navigation Links */}
                <ul className={styles.navbarList}>
                    <li className={styles.navbarItem} onClick={goToHome}>
                        Home
                    </li>
                    <li className={styles.navbarItem} onClick={goToService}>
                        Services
                    </li>
                    <li className={styles.navbarItem} onClick={goToContact}>
                        Contact Us
                    </li>
                    <li className={styles.navbarItem}>
                        <Link
                            to="/maps"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                        >
                            Maps
                        </Link>
                    </li>
                </ul>

                {/* Right: Login and Signup Buttons */}
                <div className={styles.rightSection}>
                    <button onClick={handleLoginClick} className={styles.loginButton}>
                        Login
                    </button>
                    <button onClick={handleSignupClick} className={styles.signupButton}>
                        Sign Up
                    </button>
                </div>
            </div>

        </nav>
    );
};

export default Navbar;
