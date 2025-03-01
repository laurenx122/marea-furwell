import React, { useState } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom'; // Importing useNavigate for redirection
import Footer from '../../components/Footer/Footer';

const Home = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [paragraphVisible, setParagraphVisible] = useState(false);
    const [buttonsVisible, setButtonsVisible] = useState(false);
    const [locationVisible, setLocationVisible] = useState(false);

    const navigate = useNavigate(); 
    const handleFindClinicClick = () => {navigate('/FindClinic');};
    const handleServicesClick = () => { navigate('/services'); };
    const handleSetAppointmentClick = () => {navigate('/appointments');}; 

    // Scroll event listener to trigger animations when elements come into view
    React.useEffect(() => {
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

            {/* Buttons Container (Between Home & Location) */}
            <div className={`buttons-container ${buttonsVisible ? 'visible' : ''}`}>
                <button className="service-button" onClick={handleServicesClick}>
                    <img src="https://images.squarespace-cdn.com/content/v1/65380b4b06f21d6d1e04a97b/eb367c7c-28c0-44ef-b89b-2e4326042bad/RAO_icons-03.png" alt="Services" />
                    Services
                </button>
                <button className="service-button" onClick={handleFindClinicClick}>
                    <img src="https://cdn-icons-png.freepik.com/256/12641/12641101.png" alt="Find Clinic" />
                    Find Clinic
                </button>
                <button className="service-button" onClick={handleSetAppointmentClick}>
                    <img src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwly9ieoqBhPisnyYoY9619JiA1gFq8nmmwVUTkWlJMOUG4fgX" alt="Set Appointment" />
                    Set Appointment
                </button>
            </div>

            {/* Location Section */}
            <section id="location" className={locationVisible ? 'fade-in visible' : 'fade-in'}>
                <h2>Where pets get the care they deserve</h2>
                <p>Specialty and emergency veterinary hospitals throughout Cebu</p>
                <div className="search-container">
                    <input type="text" placeholder="Enter your Street and House no., Street, Postal Code" className="location-search" />
                    <button className="search-button">Search</button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
