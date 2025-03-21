import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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
    petId: "",
    veterinarianId: "",
    serviceType: "",
    dateofAppointment: "",
  });
  const [bookingStatus, setBookingStatus] = useState({ loading: false, success: false, error: null });
  
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  
  // Try to get clinic from location state first
  const clinicData = location.state?.clinicData;

  // Additional states from PetOwnerHome for appointment booking
  const [veterinarians, setVeterinarians] = useState([]);
  const [loadingVeterinarians, setLoadingVeterinarians] = useState(false);
  const [vetServices, setVetServices] = useState({});
  const [vetSchedules, setVetSchedules] = useState({});
  const [availableDates, setAvailableDates] = useState([]);

  // Function to categorize the price
  const categorizePrice = (price) => {
    if (price < 800) return '₱';
    if (price >= 800 && price <= 1400) return '₱₱';
    return '₱₱₱';
  };

  // Utility to format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (typeof dateValue === "string") {
      try {
        return new Date(dateValue).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      } catch (e) {
        return dateValue;
      }
    }
    return String(dateValue);
  };

  // Convert vet schedule to specific dates
  const getAvailableDates = (schedules) => {
    const dates = [];
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Look ahead 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dayName = daysOfWeek[currentDate.getDay()];

      schedules.forEach((schedule) => {
        if (schedule.day === dayName) {
          const [startHour, startMinute] = schedule.startTime.split(":");
          const [endHour, endMinute] = schedule.endTime.split(":");
          const start = new Date(currentDate);
          start.setHours(parseInt(startHour), parseInt(startMinute), 0);
          const end = new Date(currentDate);
          end.setHours(parseInt(endHour), parseInt(endMinute), 0);

          // Only include future times
          if (start > new Date()) {
            dates.push({
              date: start,
              end,
              display: `${formatDate(start)} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
            });
          }
        }
      });
    }
    return dates;
  };

  useEffect(() => {
    // Check authentication status
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserPets(currentUser.uid);
      }
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

  // Fetch user's pets
  const fetchUserPets = async (userId) => {
    try {
      const petsQuery = query(
        collection(db, "pets"),
        where("owner", "==", doc(db, "users", userId))
      );
      const querySnapshot = await getDocs(petsQuery);
      const petsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUserPets(petsList);
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

  // Fetch veterinarians for this clinic
  const fetchVeterinarians = async () => {
    try {
      setLoadingVeterinarians(true);
      const vetsQuery = query(
        collection(db, "users"),
        where("Type", "==", "Veterinarian"),
        where("clinic", "==", doc(db, "clinics", clinicId))
      );
      const querySnapshot = await getDocs(vetsQuery);
      const vetList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVeterinarians(vetList);
      setVetServices(vetList.reduce((acc, v) => ({ ...acc, [v.id]: v.services || [] }), {}));
      setVetSchedules(vetList.reduce((acc, v) => ({ ...acc, [v.id]: v.schedule || [] }), {}));
    } catch (error) {
      console.error("Error fetching veterinarians:", error);
    } finally {
      setLoadingVeterinarians(false);
    }
  };

  const handleBookAppointment = () => {
    if (!user) {
      // Show login modal instead of direct redirect
      setShowLoginModal(true);
      return;
    }
    
    fetchVeterinarians();
    
    // Reset appointment data and initialize with default values if available
    setAppointmentData({
      petId: userPets.length > 0 ? userPets[0].id : "",
      veterinarianId: "",
      serviceType: "",
      dateofAppointment: "",
    });
    
    // Show booking modal
    setShowModal(true);
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setAppointmentData((prev) => ({ ...prev, [name]: value }));

    if (name === "veterinarianId" && value) {
      const vet = veterinarians.find((v) => v.id === value);
      const vetServicesList = vet.services || [];
      setVetServices({ [value]: vetServicesList });
      setVetSchedules({ [value]: vet.schedule || [] });
      setAvailableDates(getAvailableDates(vet.schedule || []));
      setAppointmentData((prev) => ({
        ...prev,
        serviceType: vetServicesList.length > 0 ? vetServicesList[0] : "",
        dateofAppointment: "",
      }));
    } else if (name === "serviceType" && value) {
      const vetId = appointmentData.veterinarianId;
      if (vetId) {
        const vet = veterinarians.find((v) => v.id === vetId);
        setVetSchedules({ [vetId]: vet.schedule || [] });
        setAvailableDates(getAvailableDates(vet.schedule || []));
      }
    }
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const { petId, veterinarianId, serviceType, dateofAppointment } = appointmentData;
    if (!petId || !veterinarianId || !serviceType || !dateofAppointment) {
      setBookingStatus({ 
        loading: false, 
        success: false, 
        error: "Please fill in all required fields" 
      });
      return;
    }
    
    setBookingStatus({ loading: true, success: false, error: null });
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in to book an appointment");

      const selectedPet = userPets.find((pet) => pet.id === petId);
      if (!selectedPet) throw new Error("Selected pet not found");

      const ownerRef = doc(db, "users", currentUser.uid);
      const petRef = doc(db, "pets", petId);
      const clinicRef = doc(db, "clinics", clinicId);
      const vetRef = doc(db, "users", veterinarianId);

      // Create a new appointment document
      const appointmentRef = await addDoc(collection(db, "appointments"), {
        petId,
        petName: selectedPet.petName,
        petRef,
        owner: ownerRef,
        clinic: clinicRef,
        clinicId: clinicId,
        clinicName: clinic.clinicName,
        veterinarianId,
        veterinarian: veterinarians.find((v) => v.id === veterinarianId).FirstName + " " + 
                     veterinarians.find((v) => v.id === veterinarianId).LastName,
        serviceType,
        dateofAppointment: new Date(dateofAppointment),
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      // Show success message
      setBookingStatus({ loading: false, success: true, error: null });
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowModal(false);
        setBookingStatus({ loading: false, success: false, error: null });
      }, 3000);
    } catch (error) {
      console.error("Error creating appointment:", error);
      setBookingStatus({ 
        loading: false, 
        success: false, 
        error: error.message || "Failed to book appointment. Please try again." 
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
                    <label htmlFor="petId">Choose Pet *</label>
                    <select
                      id="petId"
                      name="petId"
                      value={appointmentData.petId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a pet</option>
                      {userPets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.petName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="veterinarianId">Veterinarian *</label>
                    <select
                      id="veterinarianId"
                      name="veterinarianId"
                      value={appointmentData.veterinarianId}
                      onChange={handleInputChange}
                      required
                      disabled={loadingVeterinarians || !appointmentData.petId}
                    >
                      <option value="">Select a veterinarian</option>
                      {loadingVeterinarians ? (
                        <option value="" disabled>
                          Loading veterinarians...
                        </option>
                      ) : (
                        veterinarians.map((vet) => (
                          <option key={vet.id} value={vet.id}>
                            {vet.FirstName} {vet.LastName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="serviceType">Service Type *</label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={appointmentData.serviceType}
                      onChange={handleInputChange}
                      required
                      disabled={!appointmentData.veterinarianId}
                    >
                      <option value="">Select a service</option>
                      {appointmentData.veterinarianId &&
                        vetServices[appointmentData.veterinarianId]?.map((service, index) => (
                          <option key={index} value={service}>
                            {service}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dateofAppointment">Date & Time *</label>
                    <select
                      id="dateofAppointment"
                      name="dateofAppointment"
                      value={appointmentData.dateofAppointment}
                      onChange={handleInputChange}
                      required
                      disabled={!appointmentData.serviceType}
                    >
                      <option value="">Select a date and time</option>
                      {availableDates.map((slot, index) => (
                        <option key={index} value={slot.date.toISOString()}>
                          {slot.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Additional Notes (Optional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={appointmentData.notes || ""}
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