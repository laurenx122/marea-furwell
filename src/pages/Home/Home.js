import React from 'react';
import './Home.css'; // Ensure the CSS file is imported

const Home = () => {
    return (
        <div className="home-container">
            {/* Home Section with Background Image and Color Grading */}
            <section id="home">
                <div className="home-content">
                    <div className="rightSide">
                        <h1>Compassionate Care for Every Paw, Hoof, and Claw!</h1>
                        <p>
                            Where every pet is treated like family! Offering expert care, compassionate service, and a wide range of veterinary solutions to ensure your furry, feathered, or scaly friends live their happiest, healthiest lives.
                        </p>
                    </div>
                </div>
            </section>

            {/* Buttons Container Positioned below the Text */}
            <div className="buttons-container">
                <button className="service-button">
                    <img src="https://images.squarespace-cdn.com/content/v1/65380b4b06f21d6d1e04a97b/eb367c7c-28c0-44ef-b89b-2e4326042bad/RAO_icons-03.png" alt="Services Icon" />
                    Services
                </button>
                <button className="service-button">
                    <img src="https://cdn-icons-png.freepik.com/256/12641/12641101.png" alt="Find Clinic Icon" />
                    Find Clinic
                </button>
                <button className="service-button">
                    <img src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwly9ieoqBhPisnyYoY9619JiA1gFq8nmmwVUTkWlJMOUG4fgX" alt="Set Appointment Icon" />
                    Set Appointment
                </button>
            </div>

            {/* Location Search Section */}
            <section id="location">
                <h2>Where pets get the care they deserve</h2>
                <p>Specialty and emergency veterinary hospitals throughout Cebu</p>
                <div className="search-container">
                    <input type="text" placeholder="Enter your Street and House no., Street, Postal Code" className="location-search" />
                    <button className="search-button">Search</button>
                </div>
            </section>
        </div>
    );
};

export default Home;
