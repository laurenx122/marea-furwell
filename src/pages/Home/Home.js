import React from 'react';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            {/* Home Section */}
            <section id="home">
                <div className="home-content">
                    <h1>Welcome to Our Platform</h1>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </div>
            </section>

            {/* Services Section */}
            <section id="services">
                <h2>Our Services</h2>
                <div className="services-list">
                    <div className="service-item">
                        <h3>Lorem</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
                    </div>
                    <div className="service-item">
                        <h3>ipsum</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
                    </div>
                    <div className="service-item">
                        <h3>dolor</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact">
                <h2>Contact Us</h2>
                <p>
                    Have questions or need more details? Feel free to reach out to us at:
                </p>
                <ul>
                    <li>Email: marea.furwell@gmail.com</li>
                    <li>Phone: +123456789</li>
                    <li>Address: 123456789</li>
                </ul>
                <p>We look forward to hearing from you!</p>
            </section>

            {/* Location Section */}
            <section id="maps">
                <h2>Explore Our Locations</h2>
                <p>Find out more about our locations on the map!</p>
                <button
                    onClick={() => window.location.href = '/maps'}  // Redirect to Maps.js page
                    className="nearMeButton"
                >
                    Near Me
                </button>
            </section>

        </div>
    );
};

export default Home;
