import './Mobile_Footer.css';
import { FaUser, FaHome, FaEnvelope, FaPlus, FaBell } from "react-icons/fa";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Mobile_Footer = ({ onNotificationClick, onAccountClick, activePanel, unreadNotifications, isVeterinarian, setActivePanel, isVetClinic }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isFindClinicOrClinicDetails = location.pathname === '/FindClinic' || location.pathname === '/ClinicDetails';

  console.log("Mobile_Footer rendered with props:", {
    onNotificationClick: typeof onNotificationClick,
    onAccountClick: typeof onAccountClick,
    activePanel,
    unreadNotifications,
    setActivePanel: typeof setActivePanel,
    isFindClinicOrClinicDetails,
  });

  const handleHomeClick = () => navigate("/Home");
  
  const handleDashboardClick = () => {
    if (typeof setActivePanel === 'function') {
      if (isVeterinarian) {
        setActivePanel('appointments');
        navigate('/VeterinaryHome'); 
      } else if (isVetClinic) {
        setActivePanel('patients');
        navigate('/ClinicHome');
      } else {
        setActivePanel('petDetails');
        navigate('/PetOwnerHome');
      }
    } else {
      console.warn('setActivePanel is not a function');
    }
  };

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
        {isFindClinicOrClinicDetails ? (
          <>
            {!isVeterinarian && !isVetClinic && (
              <button className="footer-btn-p" onClick={handleBookNowClick}>
                <FaPlus />
              </button>
            )}
            <button className="footer-btn-p" onClick={handleDashboardClick}>
              <FaEnvelope />
              <p>Dashboard</p>
            </button>
          </>
        ) : (
          <>
            <button className="footer-btn-p" onClick={handleDashboardClick}>
              <FaEnvelope />
              <p>Dashboard</p>
            </button>
            {!isVeterinarian && !isVetClinic && (
              <button className="footer-btn-p" onClick={handleBookNowClick}>
                <FaPlus />
              </button>
            )}
            {!isVetClinic && (
              <button className="footer-btn-notif" onClick={handleNotificationClickWrapper}>
                <div className="notification-icon-container-mf">
                  <FaBell />
                  {unreadNotifications && <span className="notification-dot-mf"></span>}
                </div>
                <p>Notifications</p>
              </button>
            )}
            <button
              className={`footer-btn-p ${activePanel === 'profile' ? 'active' : ''}`}
              onClick={handleAccountClickWrapper}
            >
              <FaUser />
              <p>Account</p>
            </button>
          </>
        )}
      </div>
    </footer>
  );
};

export default Mobile_Footer;