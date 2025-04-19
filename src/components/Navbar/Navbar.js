import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Login from '../../pages/Login/Login';
import Signup from '../../pages/Signup/Signup';

const Navbar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userDetails, setUserDetails] = useState({
        firstName: '',
        lastName: '',
        contactNumber: '',
        profileImageURL: ''
    });
    const [editedDetails, setEditedDetails] = useState({
        firstName: '',
        lastName: '',
        contactNumber: '',
        profileImageURL: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
    const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [contactNumberError, setContactNumberError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [userType, setUserType] = useState('');

    const UPLOAD_PRESET = "furwell";

    useEffect(() => {
        const calculateScrollProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
            setScrollProgress(scrollPercentage);
        };

        window.addEventListener('scroll', calculateScrollProgress);
        calculateScrollProgress();

        return () => {
            window.removeEventListener('scroll', calculateScrollProgress);
        };
    }, []);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setIsLoggedIn(true);
                    setUserDetails({
                        firstName: userData.FirstName || '',
                        lastName: userData.LastName || '',
                        contactNumber: userData.contactNumber || '',
                        profileImageURL: userData.profileImageURL || ''
                    });
                    setEditedDetails({
                        firstName: userData.FirstName || '',
                        lastName: userData.LastName || '',
                        contactNumber: userData.contactNumber || '',
                        profileImageURL: userData.profileImageURL || ''
                    });
                    setIsAdmin(userData.Type === "Admin");
                    setUserType(userData.Type || '');
                } else {
                    await signOut(auth);
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    setUserType('');
                    setUserDetails({ firstName: '', lastName: '', contactNumber: '', profileImageURL: '' });
                }
            } else {
                setIsLoggedIn(false);
                setIsAdmin(false);
                setUserType('');
                setUserDetails({ firstName: '', lastName: '', contactNumber: '', profileImageURL: '' });
            }
        });

        return () => unsubscribe();
    }, []);

    const getUserHomeRoute = () => {
        switch (userType) {
            case 'Pet owner':
                return '/PetOwnerHome';
            case 'Veterinarian':
                return '/VeterinaryHome';
            case 'Clinic':
                return '/ClinicHome';
            default:
                return '/Home';
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    }

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };

    const handleLoginModalClose = () => {
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = () => {
        setTimeout(() => {
            setIsLoginModalOpen(false);
        }, 2000);
    };

    const handleSignUpClick = () => {
        setIsSignUpModalOpen(true);
    };

    const handleSignUpModalClose = () => {
        setIsSignUpModalOpen(false);
    };

    const switchToLoginModal = () => {
        setIsSignUpModalOpen(false);
        setIsLoginModalOpen(true);
    };

    const switchToSignUpModal = () => {
        setIsLoginModalOpen(false);
        setIsSignUpModalOpen(true);
    };

    const handleOutsideClick = (e) => {
        if (e.target.className === styles.loginModalOverlay) {
            handleSignUpModalClose();
            handleLoginModalClose();
        }
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateContactNumber = (number) => {
        const isValid = /^09\d{9}$/.test(number);
        if (!isValid) {
            setContactNumberError('Contact number must start with 09 and have 11 digits');
            return false;
        }
        setContactNumberError('');
        return true;
    };

    const handleContactNumberChange = (e) => {
        const value = e.target.value;
        setEditedDetails({ ...editedDetails, contactNumber: value });
        validateContactNumber(value);
    };

    const handleSave = async () => {
        if (!validateContactNumber(editedDetails.contactNumber)) {
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const confirmSave = async () => {
        try {
            setIsUploading(true);
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                let profileImageURL = editedDetails.profileImageURL;

                if (newProfileImage && (
                    newProfileImage.type === "image/jpeg" ||
                    newProfileImage.type === "image/jpg" ||
                    newProfileImage.type === "image/png"
                )) {
                    const image = new FormData();
                    image.append("file", newProfileImage);
                    image.append("cloud_name", "dfgnexrda");
                    image.append("upload_preset", UPLOAD_PRESET);

                    const response = await fetch(
                        "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
                        { method: "post", body: image }
                    );

                    if (!response.ok) {
                        throw new Error("Image upload failed");
                    }

                    const imgData = await response.json();
                    profileImageURL = imgData.url.toString();
                }

                await updateDoc(userDocRef, {
                    FirstName: editedDetails.firstName,
                    LastName: editedDetails.lastName,
                    contactNumber: editedDetails.contactNumber,
                    profileImageURL: profileImageURL
                });

                setUserDetails({
                    ...editedDetails,
                    profileImageURL: profileImageURL
                });

                setNewProfileImage(null);
                setImagePreview(null);
                setIsEditing(false);
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error updating user details:", error);
        } finally {
            setIsUploading(false);
            setIsConfirmModalOpen(false);
        }
    };

    const handleSignOut = () => {
        setIsSignOutConfirmOpen(true);
    };

    const confirmSignOut = async () => {
        try {
          await signOut(getAuth());
          setIsSignOutConfirmOpen(false);
          setIsSignOutSuccessOpen(true);
          setTimeout(() => {
            setIsSignOutSuccessOpen(false);
            navigate('/Home');
          }, 2000);
        } catch (error) {
          console.error('Error signing out:', error);
          setIsSignOutConfirmOpen(false);
        }
      };

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.navbarContent}>
                    <div className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`} onClick={toggleMenu}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div className={styles.logoContainer}>
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            window.location.reload(true);
                        }}>
                            <img src='/images/furwell_logo.png' alt="FurWell Logo" className={styles.logo} />
                        </a>
                    </div>

                    <ul className={`${styles.navbarList} ${isMenuOpen ? styles.active : ''}`}>
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
                        ) : (
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
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Contact Us
                                    </Link>
                                </li>
                                {/* <li className={styles.navbarItem}>
                                    <Link to="/maps" className={styles.navbarLink}>Maps</Link>
                                </li> */}
                            </>
                        )}
                    </ul>

                    <div className={styles.rightSection}>
                        {isLoggedIn ? (
                            <div className={styles.userMenu}>
                                {userDetails.profileImageURL && (
                                    <Link to="/PetOwnerHome" onClick={() => setIsMenuOpen(false)}>
                                        <img
                                            src={userDetails.profileImageURL}
                                            alt="Profile"
                                            className={styles.profileImage}
                                            style={{ cursor: 'pointer', width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                                        />
                                    </Link>
                                )}
                                <Link to="/PetOwnerHome" onClick={() => setIsMenuOpen(false)}>
                                    <span
                                        className={styles.username}
                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        {userDetails.firstName}
                                    </span>
                                </Link>
                                <button onClick={handleSignOut} className={styles.logoutButton}>Sign Out</button>
                            </div>
                        ) : (
                            <>
                                <button onClick={handleLoginClick} className={styles.loginButton}>Login</button>
                                <button onClick={handleSignUpClick} className={styles.signupButton}>Sign Up</button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {scrollProgress > 0 && <div className={styles.scrollProgressBar} style={{ width: `${scrollProgress}%` }}></div>}

            {/* {isMenuOpen && !isLoggedIn && (
                <>
                    <div className={`${styles.mobileMenuOverlay} ${isMenuOpen ? styles.active : ''}`} onClick={toggleMenu}></div>
                    <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ''}`}>
                        <ul className={styles.mobileMenuList}>
                            <li className={styles.mobileMenuItem}>
                                <Link to="/Home" className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>Home</Link>
                            </li>
                            <li className={styles.mobileMenuItem}>
                                <button onClick={() => { handleLoginClick(); setIsMenuOpen(false); }} className={styles.mobileLoginButton}>Login</button>
                            </li>
                            <li className={styles.mobileMenuItem}>
                                <button onClick={() => { handleSignUpClick(); setIsMenuOpen(false); }} className={styles.mobileSignupButton}>Sign Up</button>
                            </li>
                        </ul>
                    </div>
                </>
            )} */}
            {isMenuOpen && (
                <>
                    <div className={`${styles.mobileMenuOverlay} ${isMenuOpen ? styles.active : ''}`} onClick={toggleMenu}></div>
                    <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ''}`}>
                        <ul className={styles.mobileMenuList}>
                            {isLoggedIn && isAdmin ? (
                                <>
                                    <li className={styles.mobileMenuItem}>
                                        <Link to="/AdminHome" className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>
                                            Clinics
                                        </Link>
                                    </li>
                                    <li className={styles.mobileMenuItem}>
                                        <Link to="/AdminAnalytics" className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>
                                            Analytics
                                        </Link>
                                    </li>
                                    <li className={styles.mobileMenuItem}>
                                        <Link to="/AdminSubscription" className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>
                                            Subscription
                                        </Link>
                                    </li>
                                    <li className={styles.mobileMenuItem}>
                                        <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className={styles.mobileLogoutButton}>
                                            Sign Out
                                        </button>
                                    </li>
                                </>
                            ) : isLoggedIn ? (
                                <>
                                    {(location.pathname === '/Home' || location.pathname === '/FindClinic' || location.pathname === '/ClinicDetails')  && (
                                        <li className={styles.mobileMenuItem}>
                                            <Link to={getUserHomeRoute()} className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {userDetails.profileImageURL && (
                                                        <img
                                                            src={userDetails.profileImageURL}
                                                            alt="Profile"
                                                            style={{
                                                                width: '30px',
                                                                height: '30px',
                                                                borderRadius: '50%',
                                                                marginRight: '10px'
                                                            }}
                                                        />
                                                    )}
                                                    <span>{userDetails.firstName}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    )}
                                    <li className={styles.mobileMenuItem}>
                                        <Link to="/Home" className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>
                                            Home
                                        </Link>
                                    </li>
                                    <li className={styles.mobileMenuItem}>
                                        <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className={styles.mobileLogoutButton}>
                                            Sign Out
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className={styles.mobileMenuItem}>
                                        <Link to="/Home" className={styles.mobileMenuLink} onClick={() => setIsMenuOpen(false)}>
                                            Home
                                        </Link>
                                    </li>
                                    <li className={styles.mobileMenuItem}>
                                        <button onClick={() => { handleLoginClick(); setIsMenuOpen(false); }} className={styles.mobileLoginButton}>
                                            Login
                                        </button>
                                    </li>
                                    <li className={styles.mobileMenuItem}>
                                        <button onClick={() => { handleSignUpClick(); setIsMenuOpen(false); }} className={styles.mobileSignupButton}>
                                            Sign Up
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </>
            )}
                        
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>User Information</h2>
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                position: 'relative',
                                width: '100px',
                                height: '100px'
                            }}>
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Profile Preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={editedDetails.profileImageURL || 'https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png'}
                                        alt="Profile"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    borderRadius: '50%',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    zIndex: 2
                                }}>
                                    <label htmlFor="profileImage" style={{ cursor: 'pointer', display: 'block' }}>
                                        <img
                                            src="https://www.freeiconspng.com/thumbs/camera-icon/camera-icon-21.png"
                                            alt="Edit"
                                            style={{ width: '20px', height: '20px', display: 'block' }}
                                        />
                                    </label>
                                    <input
                                        type="file"
                                        id="profileImage"
                                        accept="image/jpeg,image/jpg,image/png"
                                        onChange={handleProfileImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <p>First Name </p>
                        <input
                            type="text"
                            value={editedDetails.firstName}
                            onChange={(e) => setEditedDetails({ ...editedDetails, firstName: e.target.value })}
                        />
                        <p>Last Name </p>
                        <input
                            type="text"
                            value={editedDetails.lastName}
                            onChange={(e) => setEditedDetails({ ...editedDetails, lastName: e.target.value })}
                        />
                        <p>Contact Number</p>
                        <input
                            type="text"
                            value={editedDetails.contactNumber}
                            onChange={handleContactNumberChange}
                        />
                        {contactNumberError && (
                            <p style={{ color: 'red', fontSize: '12px', margin: '5px 0' }}>
                                {contactNumberError}
                            </p>
                        )}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={handleSave}
                                disabled={!!contactNumberError || isUploading}
                                style={{
                                    opacity: (contactNumberError || isUploading) ? 0.7 : 1,
                                    cursor: (contactNumberError || isUploading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isUploading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={styles.cancelButton}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoginModalOpen && (
                <div className={styles.loginModalOverlay} onClick={handleOutsideClick}>
                    <div className={styles.loginModalContent}>
                        <Login
                            onClose={handleLoginModalClose}
                            onSwitchToSignUp={switchToSignUpModal}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    </div>
                </div>
            )}

            {isSignUpModalOpen && (
                <div className={styles.loginModalOverlay} onClick={handleOutsideClick}>
                    <div className={styles.loginModalContent}>
                        <Signup
                            onClose={handleSignUpModalClose}
                            onSwitchToLogin={switchToLoginModal}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    </div>
                </div>
            )}

            {isConfirmModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>Confirm Changes?</p>
                        <button onClick={confirmSave} disabled={isUploading}>
                            {isUploading ? 'Saving...' : 'Yes'}
                        </button>
                        <button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className={styles.cancelButton}
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {isSignOutConfirmOpen && (
                    <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>Are you sure you want to sign out?</p>
                        <div className={styles.modalButtons}>
                        <button onClick={confirmSignOut} className={styles.submitBtn}>Yes</button>
                        <button onClick={() => setIsSignOutConfirmOpen(false)} className={styles.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                    </div>
                )}

                {isSignOutSuccessOpen && (
                    <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.signOutSuccessModal}`}>
                        <div className={styles.successContent}>
                        <img
                            src="/images/check.gif"
                            alt="Success Checkmark"
                            className={styles.successImage}
                        />
                        <p>Signed Out Successfully</p>
                        </div>
                    </div>
                    </div>
                )}
        </>
    );
}

export default Navbar;