import React, { useState, useRef, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { auth } from '../../firebase';

const Home = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [paragraphVisible, setParagraphVisible] = useState(false);
    const [buttonsVisible, setButtonsVisible] = useState(false);
    const [locationVisible, setLocationVisible] = useState(false);

    const [searchInputValue, setSearchInputValue] = useState('');
    const [locateMeVisible, setLocateMeVisible] = useState(true);
    const mapRef = useRef(null);

    const navigate = useNavigate();
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
    const handleSearchClick = () => {
        window.scrollTo(0, 0);
        navigate('/ClinicLocator', { state: { searchQuery: searchInputValue } });
    };

    // Scroll event listener to trigger animations when elements come into view
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

    // Locate me functionality
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
                            alert("Address not found.");
                        }
                    } catch (error) {
                        console.error("Error fetching address:", error);
                        alert("Unable to retrieve address.");
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to retrieve your location.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };
    const [isLoggedIn, setIsLoggedIn] = useState(false);


    useEffect(() => {
        setLocateMeVisible(!searchInputValue);
    }, [searchInputValue]);
    useEffect(() => {
        try {
            if (!isLoggedIn &&!document.getElementById('cx9lMXi2OqAvrfn32yeTs')) { // Only load if not logged in
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
                <button className="service-button" onClick={handleClinicSignUpClick}>
                    <img src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwly9ieoqBhPisnyYoY9619JiA1gFq8nmmwVUTkWlJMOUG4fgX" alt="Set Appointment" />
                    Grow with Us
                </button>
            </div>

            {/* Location Section */}
            <section id="location" className={locationVisible ? 'fade-in visible' : 'fade-in'}>
                <h2>Where pets get the care they deserve</h2>
                <p>Specialty and emergency veterinary hospitals throughout Cebu</p>
                <div className="search-container">
                    <div className="location-search-wrapper">
                        <input
                            type="text"
                            placeholder="Enter your Street and House no., Street, Postal Code"
                            className="location-search"
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                        />
                        {locateMeVisible && (
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
                                alt="Locate Me"
                                className="locate-me-icon"
                                onClick={handleLocateMeClick}
                            />
                        )}
                    </div>
                    <button className="search-button" onClick={handleSearchClick}>Search</button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;