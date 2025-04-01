import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Home = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [paragraphVisible, setParagraphVisible] = useState(false);
    const [buttonsVisible, setButtonsVisible] = useState(false);
    const [locationVisible, setLocationVisible] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [locateMeVisible, setLocateMeVisible] = useState(true);
    

    const navigate = useNavigate();

    // Navigation handlers
    const handleFindClinicClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/FindClinic');
    };

    const handleServicesClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/services');
    };

    const handleClinicSignUpClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/ClinicSubscribe');
    };

    const handleSearchClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/ClinicLocator', { state: { searchQuery: searchInputValue } });
    };

    // Scroll-based visibility animations
    useEffect(() => {
        const handleScroll = () => {
            const homeText = document.getElementById('home-text');
            const locationSection = document.getElementById('location');

            const isInViewport = (element, offset = 0.75) => {
                const rect = element.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                // Check if element is in viewport (partially or fully visible)
                return rect.top < windowHeight * offset && rect.bottom > 0;
            };

            if (homeText) {
                const inView = isInViewport(homeText);
                setIsVisible(inView);
                if (inView) {
                    setTimeout(() => setParagraphVisible(true), 800);
                    setTimeout(() => setButtonsVisible(true), 1600);
                } else {
                    setParagraphVisible(false);
                    setButtonsVisible(false);
                }
            }

            if (locationSection) {
                setLocationVisible(isInViewport(locationSection, 0.85));
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Trigger on mount

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Locate Me functionality
    const handleLocateMeClick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();
                        if (data?.display_name) {
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

    useEffect(() => {
        setLocateMeVisible(!searchInputValue);
    }, [searchInputValue]);

    return (
        <div className="home-container">
            {/* Home Section */}
            <section id="home">
                <div className="home-content">
                    <div
                        className={`rightSide fade-in ${isVisible ? 'visible' : ''}`}
                        id="home-text"
                    >
                        <h1 className={isVisible ? 'visible' : ''}>
                            Compassionate Care for Every Paw, Hoof, and Claw!
                        </h1>
                        <p className={`fade-in ${paragraphVisible ? 'visible' : ''}`}>
                            Where every pet is treated like family! Offering expert care,
                            compassionate service, and a wide range of veterinary solutions to
                            ensure your furry, feathered, or scaly friends live their happiest,
                            healthiest lives.
                        </p>
                    </div>
                </div>
            </section>

            {/* Buttons Container */}
            <div className={`buttons-container ${buttonsVisible ? 'visible' : ''}`}>
                <button className="service-button" onClick={handleServicesClick}>
                    <img
                        src="https://images.squarespace-cdn.com/content/v1/65380b4b06f21d6d1e04a97b/eb367c7c-28c0-44ef-b89b-2e4326042bad/RAO_icons-03.png"
                        alt="Services"
                    />
                    Services
                </button>
                <button className="service-button" onClick={handleFindClinicClick}>
                    <img
                        src="https://cdn-icons-png.freepik.com/256/12641/12641101.png"
                        alt="Find Clinic"
                    />
                    Find Clinic
                </button>
                <button className="service-button" onClick={handleClinicSignUpClick}>
                    <img
                        src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwly9ieoqBhPisnyYoY9619JiA1gFq8nmmwVUTkWlJMOUG4fgX"
                        alt="Set Appointment"
                    />
                    Grow with Us
                </button>
            </div>

            {/* Location Section */}
            <section
                id="location"
                className={`fade-in ${locationVisible ? 'visible' : ''}`}
            >
                <h2 className={locationVisible ? 'visible' : ''}>
                    Where pets get the care they deserve
                </h2>
                <p className={locationVisible ? 'visible' : ''}>
                    Specialty and emergency veterinary hospitals throughout Cebu
                </p>
                <div className={`search-container ${locationVisible ? 'visible' : ''}`}>
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
                    <button className="search-button" onClick={handleSearchClick}>
                        Search
                    </button>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default Home;