import React from 'react';
import mail from '../../images/mail.png';
import phone from '../../images/phone.png';
import notif from '../../images/notif.png';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            {/* Home Section */}
            <section id="home">
                <div className="home-content">
                    <h1>Welcome to Our Platform</h1>
                    <p>
                        Experience seamless services and solutions tailored to meet your needs. Scroll down to learn more
                        about what we offer. Working Now!
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
                    <li>Email: <a href="mailto:support@ourplatform.com">support@ourplatform.com</a></li>
                    <li>Phone: +123-456-7890</li>
                    <li>Address: 123 Main Street, Cityville, Country</li>
                </ul>
                <p>We look forward to hearing from you!</p>
            </section>
            {/* Contact Section */}
            <section id="contact">
                <h2>Contact Us</h2>
                <p>
                    Have questions or need more details? Feel free to reach out to us at:
                </p>
                <ul>
                    <li>Email: <a href="mailto:support@ourplatform.com">support@ourplatform.com</a></li>
                    <li>Phone: +123-456-7890</li>
                    <li>Address: 123 Main Street, Cityville, Country</li>
                </ul>
                <p>We look forward to hearing from you!</p>
            </section>            {/* Contact Section */}
            <section id="contact">
                <h2>Contact Us</h2>
                <p>
                    Have questions or need more details? Feel free to reach out to us at:
                </p>
                <ul>
                    <li>Email: <a href="mailto:support@ourplatform.com">support@ourplatform.com</a></li>
                    <li>Phone: +123-456-7890</li>
                    <li>Address: 123 Main Street, Cityville, Country</li>
                </ul>
                <p>We look forward to hearing from you!</p>
            </section>            {/* Contact Section */}
            <section id="contact">
                <h2>Contact Us</h2>
                <p>
                    Have questions or need more details? Feel free to reach out to us at:
                </p>
                <ul>
                    <li>Email: <a href="mailto:support@ourplatform.com">support@ourplatform.com</a></li>
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
