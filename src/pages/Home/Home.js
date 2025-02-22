import React from 'react';
import './Home.css'; // Ensure the CSS file is imported
import mail from '../../images/mail.png';
import notif from '../../images/notif.png';
import phone from '../../images/phone.png';
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
                        {/* Footer Section */}
                        <footer className="footer">
                <div className="footer-content">
                    
                    {/* Contact Us Section */}
                    <div className="contact-footer">
                        <h3>Contact Us</h3>
                        <div className="contact-item">
                            <img src={mail} alt="Email Icon" className="contact-icon" />
                            <p>
                                <i className="fas fa-envelope"></i> 
                                <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=mareafurwell@gmail.com&su=Clinic%20Subscription&body=I%20want%20to%20subscribe%20my%20clinic%20to%20your%20page."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="email-link">
                                    mareafurwell@gmail.com
                                </a>
                            </p>
                        </div>
                        <div className="contact-item">
                            <img src={phone} alt="Phone Icon" className="contact-icon" />
                            <p><i className="fas fa-phone"></i> 123-456-789</p>
                        </div>
                        
                    </div>

                    {/* Newsletter Section */}
                    <div className="newsletter-footer">
                        <h3>Newsletter</h3>
                        <div className="newsletter-item">
                            <img src={notif} alt="Newsletter Icon" className="contact-icon" />
                            <div className="newsletter-input">
                                <input type="email" placeholder="Enter your email" />
                                <button>Subscribe</button>
                            </div>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    );
};

export default Home;
