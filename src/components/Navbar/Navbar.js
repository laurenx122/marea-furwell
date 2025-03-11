import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Navbar = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
    const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
    const [newProfileImage, setNewProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [contactNumberError, setContactNumberError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // Cloudinary upload preset - same as in Signup component
    const UPLOAD_PRESET = "furwell";

    // Add scroll event listener to track scroll progress
    useEffect(() => {
        const calculateScrollProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate the scroll percentage
            const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
            
            setScrollProgress(scrollPercentage);
        };

        // Add scroll event listener
        window.addEventListener('scroll', calculateScrollProgress);
        
        // Initial calculation
        calculateScrollProgress();
        
        // Clean up the event listener on component unmount
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
                } else {
                    await signOut(auth);
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    setUserDetails({ firstName: '', lastName: '', contactNumber: '', profileImageURL: '' });
                }
            } else {
                setIsLoggedIn(false);
                setIsAdmin(false);
                setUserDetails({ firstName: '', lastName: '', contactNumber: '', profileImageURL: '' });
            }
        });
    
        return () => unsubscribe();
    }, []);

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewProfileImage(file);
            // Create a preview URL for immediate display
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateContactNumber = (number) => {
        // Check if the contact number starts with '09' and has 11 digits
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
        setEditedDetails({...editedDetails, contactNumber: value});
        validateContactNumber(value);
    };

    const handleSave = async () => {
        if (!validateContactNumber(editedDetails.contactNumber)) {
            return; // Don't proceed if validation fails
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
                
                // Upload new profile image to Cloudinary if selected
                if (newProfileImage && (
                    newProfileImage.type === "image/jpeg" ||
                    newProfileImage.type === "image/jpg" ||
                    newProfileImage.type === "image/png"
                )) {
                    try {
                        const image = new FormData();
                        image.append("file", newProfileImage);
                        image.append("cloud_name", "dfgnexrda");
                        image.append("upload_preset", UPLOAD_PRESET);

                        const response = await fetch(
                            "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
                            {
                                method: "post",
                                body: image
                            }
                        );

                        if (!response.ok) {
                            throw new Error("Image upload failed");
                        }

                        const imgData = await response.json();
                        profileImageURL = imgData.url.toString();
                        console.log("Profile image uploaded successfully:", profileImageURL);
                    } catch (uploadError) {
                        console.error("Error uploading image:", uploadError);
                        // Continue with update even if image upload fails
                    }
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
                                {userDetails.profileImageURL && (
                                    <img 
                                        src={userDetails.profileImageURL} 
                                        alt="Profile" 
                                        className={styles.profileImage}
                                        onClick={() => setIsModalOpen(true)}
                                        style={{ cursor: 'pointer', width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                                    />
                                )}
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
            
            {/* User Profile Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>User Information</h2>
                        
                        {/* Centered Profile Image Section with Camera Icon */}
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
                                
                                {/* Camera Icon Overlay */}
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
                            onChange={(e) => setEditedDetails({...editedDetails, firstName: e.target.value})} 
                        />
                        
                        <p>Last Name </p>
                        <input 
                            type="text" 
                            value={editedDetails.lastName} 
                            onChange={(e) => setEditedDetails({...editedDetails, lastName: e.target.value})} 
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
            
            {/* Confirmation Modals */}
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