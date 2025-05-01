import React, { useState, useRef, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';
import Mobile_Footer from '../../components/Footer/Mobile_Footer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';


const Home = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [paragraphVisible, setParagraphVisible] = useState(false);
    const [buttonsVisible, setButtonsVisible] = useState(false);
    const [locationVisible, setLocationVisible] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [locateMeVisible, setLocateMeVisible] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [userType, setUserType] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true); 
    const [unreadNotifications, setUnreadNotifications] = useState(false);
    const [activePanel, setActivePanel] = useState('home');
    const [notifications, setNotifications] = useState([]);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [isVeterinarian, setIsVeterinarian] = useState(false);

    const mapRef = useRef(null);
    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    const DEFAULT_OWNER_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";

    
    const handleFindClinicClick = () => {
        window.scrollTo(0, 0);
        navigate('/FindClinic');
    };
    const handleServicesClick = () => {
        window.scrollTo(0, 0);
        navigate('/services');
    };
    const handleClinicSignUpClick = () => {
        window.scrollTo(0, 0);
        navigate('/ClinicSubscribe');
    };

    
    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchInputValue.trim()) {
            window.scrollTo(0, 0);
            navigate('/ClinicLocator', { state: { searchQuery: searchInputValue } });
        }
    };

   
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setIsLoggedIn(!!user);
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserType(userData.Type || null);
                        setIsVeterinarian(userData.Type === 'Veterinarian');
                    } else {
                        console.error('User document not found');
                        setUserType(null);
                    }
                } catch (error) {
                    console.error('Error fetching user type:', error);
                    setUserType(null);
                }
            } else {
                setUserType(null);
            }
            setIsLoadingUser(false);
        });
        return () => unsubscribe();
    }, []);

   
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    
    useEffect(() => {
        const handleScroll = () => {
            const homeText = document.getElementById('home-text');
            const locationSection = document.getElementById('location');

            if (homeText) {
                const rect = homeText.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.75) {
                    setIsVisible(true);
                    setTimeout(() => setParagraphVisible(true), 2000);
                    setTimeout(() => setButtonsVisible(true), 4000);
                }
            }

            if (locationSection) {
                const rect = locationSection.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.85) {
                    setLocationVisible(true);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

   
    const handleLocateMeClick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            setSearchInputValue(data.display_name);
                            setLocateMeVisible(false);
                        } else {
                            alert('Address not found.');
                        }
                    } catch (error) {
                        console.error('Error fetching address:', error);
                        alert('Unable to retrieve address.');
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to retrieve your location.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };

    const handleSearchIconClick = () => {
        handleSearch();
    };

 
    useEffect(() => {
        setLocateMeVisible(!searchInputValue);
    }, [searchInputValue]);

   
    useEffect(() => {
        if (!auth.currentUser || userType !== 'PetOwner') return;

        const q = query(
            collection(db, 'notifications'),
            where('ownerId', '==', `users/${auth.currentUser.uid}`),
            where('type', 'in', [
                'appointment_accepted',
                'appointment_reminder',
                'appointment_day_of',
                'cancellation_approved',
                'cancellation_declined',
                'reschedule_approved',
                'reschedule_declined',
            ]),
            where('removeViewPetOwner', '==', false)
        );

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                try {
                    const notificationsList = await Promise.all(
                        snapshot.docs.map(async (docSnap) => {
                            const data = docSnap.data();
                            try {
                                const clinicDoc = await getDoc(doc(db, 'clinics', data.clinicId));
                                const appointmentDoc = await getDoc(doc(db, 'appointments', data.appointmentId));
                                return {
                                    id: docSnap.id,
                                    clinicProfileImageURL: clinicDoc.exists() ? clinicDoc.data().profileImageURL : DEFAULT_OWNER_IMAGE,
                                    clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : 'Unknown Clinic',
                                    dateofAppointment: appointmentDoc.exists() ? appointmentDoc.data().dateofAppointment.toDate() : null,
                                    hasPetOwnerOpened: data.hasPetOwnerOpened || false,
                                    message: data.message,
                                    dateCreated: data.dateCreated ? data.dateCreated.toDate() : new Date(),
                                    type: data.type,
                                };
                            } catch (error) {
                                console.error(`Error processing notification ${docSnap.id}:`, error);
                                return null;
                            }
                        })
                    );

                    const filteredNotifications = notificationsList
                        .filter((n) => n !== null)
                        .sort((a, b) => b.dateCreated - a.dateCreated);

                    setNotifications(filteredNotifications);
                    setUnreadNotifications(filteredNotifications.some((n) => !n.hasPetOwnerOpened));
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                    setNotifications([]);
                    setUnreadNotifications(false);
                }
            },
            (error) => {
                console.error('Error listening to notifications:', error);
                setNotifications([]);
                setUnreadNotifications(false);
            }
        );

        return () => unsubscribe();
    }, [auth.currentUser, userType]);

    const markNotificationAsRead = async (notificationId) => {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                hasPetOwnerOpened: true,
                status: 'read',
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

   
    const handleNotificationClick = async () => {
        try {
            setShowNotificationsModal(true);
            if (unreadNotifications) {
                const unreadNotificationsList = notifications.filter((n) => !n.hasPetOwnerOpened);
                for (const notification of unreadNotificationsList) {
                    await markNotificationAsRead(notification.id);
                }
                setNotifications(notifications.map((n) => ({ ...n, hasPetOwnerOpened: true })));
                setUnreadNotifications(false);
            }
        } catch (error) {
            console.error('Error in handleNotificationClick:', error);
        }
    };

    const handleAccountClick = () => {
        console.log('Account icon clicked, navigating to PetOwnerHome with petDetails panel');
        navigate('/PetOwnerHome', { state: { activePanel: 'petDetails' } });
    };

    
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        let date = dateValue instanceof Date ? dateValue : dateValue.toDate();
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).replace(',', ',');
    };


     //chatbase script
     useEffect(() => {
        setLocateMeVisible(!searchInputValue);
    }, [searchInputValue]);
    useEffect(() => {
        try {
            if (!isLoggedIn &&!document.getElementById('cx9lMXi2OqAvrfn32yeTs')) { 
                const script = document.createElement('script');
                script.src = 'https://www.chatbase.co/embed.min.js';
                script.id = 'cx9lMXi2OqAvrfn32yeTs';
                script.defer = true;
                script.setAttribute('chatbotId', 'cx9lMXi2OqAvrfn32yeTs');
                script.setAttribute('domain', 'www.chatbase.co');
                document.body.appendChild(script);
    
                script.onload = () => {
                    console.log('Chatbase script loaded.');
                    try {
                        if (window.chatbase) {
                            console.log('Chatbase initialized successfully.');
                        } else {
                            console.warn('Chatbase not available after load.');
                        }
                    } catch (err) {
                        console.error('Error during Chatbase initialization:', err);
                    }
                };
    
                script.onerror = () => {
                    console.error('Failed to load Chatbase script.');
                };
    
                return () => {
                    try {
                        const existingScript = document.getElementById('chatbase-embed');
                        if (existingScript) existingScript.remove();
    
                        const bubbleButton = document.getElementById('chatbase-bubble-button');
                        if (bubbleButton) bubbleButton.remove();
    
                        const bubbleWindow = document.getElementById('chatbase-bubble-window');
                        if (bubbleWindow) bubbleWindow.remove();
    
                        const chatbaseIframes = document.querySelectorAll("iframe[src*='chatbase']");
                        chatbaseIframes.forEach((iframe) => iframe.remove());
    
                        if (window.chatbase) window.chatbase = undefined;
                    } catch (err) {
                        console.error('Error during Chatbase cleanup:', err);
                    }
                };
            } else if (isLoggedIn) {
                console.log('Skipping Chatbase script load due to logged-in state.');
            } else {
                console.log('Chatbase script already exists.');
            }
        } catch (error) {
            console.error('Error initializing Chatbase:', error);
        }
    }, [isLoggedIn]);

    //chatbase script end
   
    return (
        <div className="home-container">
            {/* Home Section */}
            <section id="home">
                <div className="home-content">
                    <div className={`rightSide fade-in ${isVisible ? 'visible' : ''}`} id="home-text">
                        <h1>Compassionate Care for Every Paw, Hoof, and Claw!</h1>
                        <p className={`fade-in ${paragraphVisible ? 'visible' : ''}`}>
                            Where every pet is treated like family! Offering expert care, compassionate service, and a wide range of veterinary solutions to ensure your furry, feathered, or scaly friends live their happiest, healthiest lives.
                        </p>
                    </div>
                </div>
            </section>

            {/* Buttons Container */}
            <div className={`buttons-container ${buttonsVisible ? 'visible' : ''}`}>
                <button className="service-button" onClick={handleServicesClick}>
                    <img src="https://images.squarespace-cdn.com/content/v1/65380b4b06f21d6d1e04a97b/eb367c7c-28c0-44ef-b89b-2e4326042bad/RAO_icons-03.png" alt="Services" />
                    Services
                </button>
                <button className="service-button" onClick={handleFindClinicClick}>
                    <img src="https://cdn-icons-png.freepik.com/256/12641/12641101.png" alt="Find Clinic" />
                    Find Clinic
                </button>
                {!isLoggedIn && (
                    <button className="service-button" onClick={handleClinicSignUpClick}>
                        <img src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwly9ieoqBhPisnyYoY9619JiA1gFq8nmmwVUTkWlJMOUG4fgX" alt="Set Appointment" />
                        Grow with Us
                    </button>
                )}
            </div>

            {/* Location Section */}
            <section id="location" className={locationVisible ? 'fade-in visible' : 'fade-in'}>
                <h2>Where pets get the care they deserve</h2>
                <p>Specialty and emergency veterinary hospitals throughout Cebu</p>
                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="location-search-wrapper" onClick={handleSearchIconClick}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Enter your location to find nearby clinics"
                                className="location-search"
                                value={searchInputValue}
                                onChange={(e) => setSearchInputValue(e.target.value)}
                            />
                            {locateMeVisible && (
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
                                    alt="Locate Me"
                                    className="locate-me-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLocateMeClick();
                                    }}
                                />
                            )}
                        </div>
                        <button type="submit" className="search-button">Search</button>
                    </form>
                </div>
            </section>

            {/* Notifications Modal */}
            {showNotificationsModal && (
                <div className="modal-overlay-p">
                    <div className="modal-content-p notifications-modal-p">
                        <span className="close-button-p" onClick={() => setShowNotificationsModal(false)}>
                            ×
                        </span>
                        <h2>Notifications</h2>
                        {notifications.length > 0 ? (
                            <div className="notifications-list-p">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item-p ${notification.hasPetOwnerOpened ? 'read' : 'unread'}`}
                                        onClick={() => !notification.hasPetOwnerOpened && markNotificationAsRead(notification.id)}
                                    >
                                        <img
                                            src={notification.clinicProfileImageURL || DEFAULT_OWNER_IMAGE}
                                            alt="Clinic"
                                            className="notification-clinic-img-p"
                                        />
                                        <div className="notification-details-p">
                                            <p>
                                                {notification.type === 'appointment_accepted' && <strong>Appointment Accepted: </strong>}
                                                {notification.type === 'appointment_reminder' && <strong>Appointment Reminder: </strong>}
                                                {notification.type === 'appointment_day_of' && <strong>Day of Appointment: </strong>}
                                                {notification.type === 'cancellation_approved' && <strong>Cancellation Approved: </strong>}
                                                {notification.type === 'cancellation_declined' && <strong>Cancellation Declined: </strong>}
                                                {notification.type === 'reschedule_approved' && <strong>Reschedule Approved: </strong>}
                                                {notification.type === 'reschedule_declined' && <strong>Reschedule Declined: </strong>}
                                                {notification.message}
                                            </p>
                                            <span className="notification-timestamp-p">
                                                Notified on: {formatDate(notification.dateCreated)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No notifications available.</p>
                        )}
                        <div className="modal-actions-p">
                            <button
                                className="modal-close-btn-p"
                                onClick={() => setShowNotificationsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conditional Footer Rendering */}
            {isLoggedIn && isMobile && !isLoadingUser ? (
                userType === 'Clinic' ? (
                    <Mobile_Footer
                        onAccountClick={handleAccountClick}
                        setActivePanel={setActivePanel}
                        isVetClinic={true}
                        isVeterinarian={false}
                        isPetOwner={false}
                    />
                ) : userType === 'PetOwner' ? (
                    <Mobile_Footer
                        onNotificationClick={handleNotificationClick}
                        onAccountClick={handleAccountClick}
                        activePanel={activePanel}
                        unreadNotifications={unreadNotifications}
                        setActivePanel={setActivePanel}
                        isVeterinarian={false}
                        isVetClinic={false}
                        isPetOwner={true}
                    />
                ) : userType === 'Veterinarian' ? (
                    <Mobile_Footer
                        onNotificationClick={handleNotificationClick}
                        onAccountClick={handleAccountClick}
                        activePanel={activePanel}
                        unreadNotifications={unreadNotifications}
                        isVeterinarian={true}
                        isVetClinic={false}
                        isPetOwner={false}
                        setActivePanel={setActivePanel}
                    />
                ) : (
                    <Mobile_Footer
                        onNotificationClick={() => console.log('Default notification click handler')}
                        onAccountClick={() => console.log('Default account click handler')}
                        setActivePanel={setActivePanel}
                        isVeterinarian={false}
                        isVetClinic={false}
                        isPetOwner={false}
                        activePanel={activePanel}
                        unreadNotifications={false}
                    />
                )
            ) : (
                <Footer />
            )}
        </div>
    );
};

export default Home;