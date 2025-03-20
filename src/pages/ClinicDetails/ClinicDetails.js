import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import Footer from '../../components/Footer/Footer';
import './ClinicDetails.css';

const ClinicDetails = () => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    service: '',
    petId: '',
    notes: '',
  });
  const [bookingStatus, setBookingStatus] = useState({ loading: false, success: false, error: null });
  
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  
  // Try to get clinic from location state first
  const clinicData = location.state?.clinicData;

  // Function to categorize the price
  const categorizePrice = (price) => {
    if (price < 800) return '₱';
    if (price >= 800 && price <= 1400) return '₱₱';
    return '₱₱₱';
  };

  useEffect(() => {
    // Check authentication status
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  

  useEffect(() => {
    async function fetchClinicData() {
      // If we have clinic data from state, use it
      if (clinicData) {
        // Process service prices if available in state data
        const formattedServices = [];
        if (clinicData.servicePrices) {
          Object.entries(clinicData.servicePrices).forEach(([serviceName, price]) => {
            formattedServices.push({ name: serviceName, price });
          });
        }
        
        setClinic({
          ...clinicData,
          services: formattedServices.length > 0 
            ? formattedServices 
            : clinicData.services?.map(s => typeof s === 'object' ? s : { name: s }) || []
        });
        setLoading(false);
        return;
      }
      
      try {
        const clinicDoc = await getDoc(doc(db, "clinics", clinicId));
        
        if (clinicDoc.exists()) {
          const data = clinicDoc.data();
          
          // Process service prices from Firestore
          const formattedServices = [];
          if (data.servicePrices) {
            Object.entries(data.servicePrices).forEach(([serviceName, price]) => {
              formattedServices.push({ 
                name: serviceName, 
                price: price 
              });
            });
          }
          
          setClinic({
            id: clinicDoc.id,
            clinicName: data.clinicName || 'Unnamed Clinic',
            streetAddress: data.streetAddress || '',
            city: data.city || '',
            province: data.province || '',
            postalCode: data.postalCode || '',
            priceCategory: categorizePrice(data.price || 0),
            price: data.price || 0,
            services: formattedServices.length > 0 
              ? formattedServices 
              : (data.services || []).map(s => typeof s === 'object' ? s : { name: s }),
            description: data.description || 'No description available',
            image: data.imgURL || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp',
            phone: data.phone || 'Not available',
            email: data.email || 'Not available',
            hours: data.operatingHours || 'Not available',
            lat: data.lat,
            lng: data.lng
          });
        } else {
          console.error("No clinic found with ID:", clinicId);
          // Redirect back to clinic list if clinic not found
          navigate('/FindClinic');
        }
      } catch (error) {
        console.error("Error fetching clinic data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClinicData();
  }, [clinicId, clinicData, navigate]);

  const handleBookAppointment = () => {
    if (!user) {
      // Show login modal instead of direct redirect
      setShowLoginModal(true);
      return;
    }
    
    // Reset appointment data and initialize with default values if available
    setAppointmentData({
      date: '',
      time: '',
      service: clinic.services.length > 0 ? clinic.services[0].name : '',
      petId: userPets.length > 0 ? userPets[0].id : '',
      notes: '',
    });
    
    // Show booking modal
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData({
      ...appointmentData,
      [name]: value
    });
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    
    if (!appointmentData.date || !appointmentData.time || !appointmentData.service || !appointmentData.petId) {
      setBookingStatus({ 
        loading: false, 
        success: false, 
        error: "Please fill in all required fields" 
      });
      return;
    }
    
    setBookingStatus({ loading: true, success: false, error: null });
    
    try {
      // Create a new appointment document
      const appointmentRef = await addDoc(collection(db, "appointments"), {
        clinicId: clinic.id,
        clinicName: clinic.clinicName,
        userId: user.uid,
        petId: appointmentData.petId,
        service: appointmentData.service,
        date: appointmentData.date,
        time: appointmentData.time,
        notes: appointmentData.notes,
        status: "pending", // pending, confirmed, completed, cancelled
        createdAt: serverTimestamp()
      });
      
      // Show success message
      setBookingStatus({ loading: false, success: true, error: null });
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowModal(false);
        setBookingStatus({ loading: false, success: false, error: null });
        
        // Optional: Navigate to appointments page or show a toast notification
        // navigate('/appointments');
      }, 3000);
    } catch (error) {
      console.error("Error creating appointment:", error);
      setBookingStatus({ 
        loading: false, 
        success: false, 
        error: "Failed to book appointment. Please try again." 
      });
    }
  };

  const handleLoginRedirect = () => {
    // Close the login modal and redirect to login page
    setShowLoginModal(false);
    navigate('/login', { state: { from: `/clinic/${clinicId}` } });
  };

  if (loading) {
    return <div className="loading">Loading clinic details...</div>;
  }

  if (!clinic) {
    return <div className="loading">Clinic not found</div>;
  }

  // Format the full address
  const fullAddress = [
    clinic.streetAddress,
    clinic.city,
    clinic.province,
    clinic.postalCode
  ].filter(Boolean).join(', ');

  return (
    <div className="clinic-details-container">
      <div className="main-content">
        <button className="back-button" onClick={() => navigate('/FindClinic')}>
          ← Back to Clinics
        </button>
        
        <div className="clinic-details-content">
          <div className="clinic-header">
            <h1>{clinic.clinicName}</h1>
            <p className="clinic-address">{fullAddress}</p>
            <p className="price-category">Price Range: {clinic.priceCategory}</p>
          </div>
          
          <div className="clinic-image-container">
            <img 
              src={clinic.image} 
              alt={clinic.clinicName} 
              className="clinic-detail-image"
            />
          </div>
          
          <div className="clinic-info-section">
            <h2>About This Clinic</h2>
            <p className="clinic-description">{clinic.description}</p>
            
            {clinic.services && clinic.services.length > 0 && (
              <>
                <h2>Services</h2>
                <ul className="services-list">
                  {clinic.services.map((service, index) => (
                    <li key={index}>
                      {service.name}
                      {service.price && (
                        <span className="service-price">₱{service.price}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            <div className="contact-info">
              <h2>Contact Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{clinic.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{clinic.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Operating Hours:</span>
                  <span className="info-value">{clinic.hours}</span>
                </div>
              </div>
            </div>
            
            <div className="map-container">
              <h2>Location</h2>
              <div className="clinic-map">
                {clinic.lat && clinic.lng ? (
                  // Replace with actual map implementation
                  <p className="map-placeholder">
                    Map location: {clinic.lat}, {clinic.lng}
                  </p>
                ) : (
                  <p className="map-placeholder">Map will be displayed here</p>
                )}
              </div>
            </div>
            
            <div className="cta-section">
              <button className="book-appointment-btn" onClick={handleBookAppointment}>
                Book an Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="login-modal">
            <div className="modal-header">
              <h2>Login Required</h2>
              <button className="close-button" onClick={() => setShowLoginModal(false)}>×</button>
            </div>
            
            <div className="modal-body login-modal-body">
              <p>You need to be logged in to book an appointment.</p>
             
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment Booking Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="appointment-modal">
            <div className="modal-header">
              <h2>Book an Appointment</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {bookingStatus.success ? (
                <div className="success-message">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                  <p>Appointment booked successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAppointment}>
                  
                  
                  <div className="form-group">
                    <label htmlFor="service">Select Service</label>
                    <select
                      id="service"
                      name="service"
                      value={appointmentData.service}
                      onChange={handleInputChange}
                      required
                    >
                      {clinic.services.map((service, index) => (
                        <option key={index} value={service.name}>
                          {service.name} {service.price ? `- ₱${service.price}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">Date</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={appointmentData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="time">Time</label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={appointmentData.time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="notes">Additional Notes (Optional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={appointmentData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Any specific concerns or requests?"
                    />
                  </div>
                  
                  {bookingStatus.error && (
                    <div className="error-message">{bookingStatus.error}</div>
                  )}
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-btn" 
                      disabled={bookingStatus.loading || userPets.length === 0}
                    >
                      {bookingStatus.loading ? 'Booking...' : 'Book Appointment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ClinicDetails;