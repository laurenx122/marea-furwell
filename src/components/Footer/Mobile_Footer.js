import './Mobile_Footer.css';
import { FaUser, FaHome, FaEnvelope, FaPlus, FaBell } from 'react-icons/fa';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Mobile_Footer = ({
  onNotificationClick,
  onAccountClick,
  activePanel,
  unreadNotifications,
  isVeterinarian,
  setActivePanel,
  isVetClinic,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isFindClinicOrClinicDetails = location.pathname === '/FindClinic' || location.pathname === '/ClinicDetails';

  console.log('Mobile_Footer rendered with props:', {
    onNotificationClick: typeof onNotificationClick,
    onAccountClick: typeof onAccountClick,
    activePanel,
    unreadNotifications,
    setActivePanel: typeof setActivePanel,
    isFindClinicOrClinicDetails,
    isVeterinarian,
    isVetClinic,
  });

  const handleHomeClick = () => navigate('/Home');

  const handleDashboardClick = () => {
    console.log('Dashboard clicked, userType:', { isVeterinarian, isVetClinic });
    if (typeof setActivePanel === 'function') {
      if (isVeterinarian) {
        console.log('Navigating to VeterinaryHome');
        setActivePanel('appointments');
        navigate('/VeterinaryHome');
      } else if (isVetClinic) {
        console.log('Navigating to ClinicHome');
        setActivePanel('patients');
        navigate('/ClinicHome');
      } else {
        console.log('Navigating to PetOwnerHome');
        setActivePanel('petDetails');
        navigate('/PetOwnerHome');
      }
    } else {
      console.warn('setActivePanel is not a function');
    }
  };

  const handleBookNowClick = () => navigate('/FindClinic');

  const handleNotificationClickWrapper = () => {
    if (typeof onNotificationClick === 'function') {
      onNotificationClick();
    } else {
      console.warn('onNotificationClick is not a function');
    }
  };

  const handleAccountClickWrapper = () => {
    if (typeof onAccountClick === 'function') {
      onAccountClick();
    } else {
      console.warn('onAccountClick is not a function');
    }
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
              <button className="footer-btn-p" onClick={handleNotificationClickWrapper}>
                <FaBell />
                <p>Notifications</p>
                {unreadNotifications && <span className="notification-dot-p"></span>}
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