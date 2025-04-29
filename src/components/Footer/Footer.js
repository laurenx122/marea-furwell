// Footer.js
import React from 'react';
import './Footer.css'; 

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* Contact Us Section */}
        <div className="contact-footer">
          <h3>Contact Us</h3>
          <div className="contact-itemf">
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
          <div className="contact-itemf">
            <img src='https://cdn-icons-png.flaticon.com/256/20/20673.png' alt="Facebook Icon" className="contact-icon" />
            <p><a className= "facebook-link" href="https://web.facebook.com/profile.php?id=61575644438300&mibextid=wwXIfr&rdid=jTOR9fuY3oJiqtUn&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F1FKQPt8NTJ%2F%3Fmibextid%3DwwXIfr%26_rdc%3D1%26_rdr">
            Facebook</a></p>
          </div>

          <div className="contact-itemf">
            <img src='https://icons.veryicon.com/png/o/miscellaneous/offerino-icons/instagram-53.png' alt="instagram icon" className="contact-icon"/>
            <p><a className="ig-link" href="https://www.instagram.com/furwell.ph">
              Furwell.ph</a></p>
          </div>
        </div>

        <div className="newsletter-footer">
          <h3>Newsletter</h3>
          <div className="newsletter-item">
            <img src='/images/notif.png' alt="Newsletter Icon" className="contact-icon" />
            <div className="newsletter-input">
              <input type="email" placeholder="Enter your email" />
              <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=mareafurwell@gmail.com&su=Clinic%20Subscription&body=I%20want%20to%20subscribe%20my%20clinic%20to%20your%20page.">
                <button>Subscribe</button>
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
