// src/components/Footer/Mobile_Footer.jsx
import './Mobile_Footer.css';
import { FaUser, FaHome, FaEnvelope, FaPlus, FaBell } from "react-icons/fa";
import React from "react";
import { useNavigate } from "react-router-dom";

const Mobile_Footer = ({ onNotificationClick, onAccountClick, activePanel, unreadNotifications }) => {
  const navigate = useNavigate();

  console.log("Mobile_Footer rendered with props:", {
    onNotificationClick: typeof onNotificationClick,
    onAccountClick: typeof onAccountClick,
    activePanel,
    unreadNotifications,
  });

  const handleHomeClick = () => navigate("/Home");
  const handleDashboardClick = () => navigate("/PetOwnerHome");
  const handleBookNowClick = () => navigate("/FindClinic");

  const handleNotificationClickWrapper = () => {
    onNotificationClick();
  };

  const handleAccountClickWrapper = () => {
    onAccountClick();
  };

  return (
    <footer className="footer-mobile">
      <div className="footer-mobile-p">
        <button className="footer-btn-p" onClick={handleHomeClick}>
          <FaHome />
          <p>Home</p>
        </button>
        <button className="footer-btn-p" onClick={handleDashboardClick}>
          <FaEnvelope />
          <p>Dashboard</p>
        </button>
        <button className="footer-btn-p" onClick={handleBookNowClick}>
          <FaPlus />
        </button>
        <button className="footer-btn-p" onClick={handleNotificationClickWrapper}>
          <FaBell />
          <p>Notifications</p>
          {unreadNotifications && <span className="notification-dot-p"></span>}
        </button>
        <button
          className={`footer-btn-p ${activePanel === 'profile' ? 'active' : ''}`}
          onClick={handleAccountClickWrapper}
        >
          <FaUser />
          <p>Account</p>
        </button>
      </div>
    </footer>
  );
};

export default Mobile_Footer;