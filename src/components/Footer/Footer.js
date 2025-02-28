// Footer.js
import React from 'react';
import './Footer.css'; 

const Footer = ( ) => {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* Contact Us Section */}
        <div className="contact-footer">
          <h3>Contact Us</h3>
          <div className="contact-item">
            <img src='/images/mail.png' alt="Email Icon" className="contact-icon" />
            <p>
              <i className="fas fa-envelope"></i> 
              <a 
                href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=mareafurwell@gmail.com&su=Clinic%20Subscription&body=I%20want%20to%20subscribe%20my%20clinic%20to%20your%20page."
                target="_blank"
                rel="noopener noreferrer"
                className="email-link"
              >
                mareafurwell@gmail.com
              </a>
            </p>
          </div>
          <div className="contact-item">
            <img src='/images/phone.png' alt="Phone Icon" className="contact-icon" />
            <p><i className="fas fa-phone"></i> 123-456-789</p>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="newsletter-footer">
          <h3>Newsletter</h3>
          <div className="newsletter-item">
            <img src='/images/notif.png' alt="Newsletter Icon" className="contact-icon" />
            <div className="newsletter-input">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
