import React, { useState } from 'react';

import './Home.css';

const Home = () => {


    //hi 
    return (
        <div className="home-container">
            {/* Home Section */}
            <section id="home">
                <div className="home-content">
                    <h1>Welcome to Our Platform - KHENT</h1>
                    <p>
                        Experience seamless services and solutions tailored to meet your needs. Scroll down to learn more
                        about what we offer.
                    </p>
                </div>
            </section>

            {/* Services Section */}
            <section id="services">
                <h2>Our Services</h2>
                <div className="services-list">
                    <div className="service-item">
                        <h3>Web Development</h3>
                        <p>Building modern, responsive websites to boost your online presence.</p>
                    </div>
                    <div className="service-item">
                        <h3>Mobile Apps</h3>
                        <p>Developing user-friendly mobile applications for Android and iOS platforms.</p>
                    </div>
                    <div className="service-item">
                        <h3>Consulting</h3>
                        <p>Providing expert guidance to help you achieve your business goals.</p>
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
                    <li>Email: support@ourplatform.com</li>
                    <li>Phone: +123-456-7890</li>
                    <li>Address: 123 Main Street, Cityville, Country</li>
                </ul>
                <p>We look forward to hearing from you!</p>
            </section>

            {/* Location Section */}
            <section id="maps">
                <h2>Explore Our Locations</h2>
                <p>Find out more about our locations on the map!</p>
                <button
                    onClick={() => window.location.href = '/maps'}  
                    className="nearMeButton"
                >
                    Near Me
                </button>
            </section>

            

        </div>


    );
};

export default Home;
