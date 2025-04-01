import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import Footer from '../../components/Footer/Footer';
import './ClinicDetails.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ClinicDetails = () => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
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
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const clinicData = location.state?.clinicData;
  const [veterinarians, setVeterinarians] = useState([]);
  const [loadingVeterinarians, setLoadingVeterinarians] = useState(false);
  const [vetServices, setVetServices] = useState({});
  const [vetSchedules, setVetSchedules] = useState({});
  const [availableDates, setAvailableDates] = useState([]);

  const categorizePrice = (price) => {
    if (price < 800) return '₱';
    if (price >= 800 && price <= 1400) return '₱₱';
    return '₱₱₱';
  };

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

  const getAvailableDates = (schedules) => {
    const dates = [];
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
      let initialClinicInfo = null;

      if (clinicData) {
        const formattedServices = [];
        if (clinicData.servicePrices) {
          Object.entries(clinicData.servicePrices).forEach(([serviceName, price]) => {
            formattedServices.push({ name: serviceName, price });
          });
        }
        initialClinicInfo = {
          ...clinicData,
          services: formattedServices.length > 0
            ? formattedServices
            : clinicData.services?.map(s => typeof s === 'object' ? s : { name: s }) || []
        };
        setClinic(initialClinicInfo);
      }

      try {
        const clinicDoc = await getDoc(doc(db, "clinics", clinicId));
        if (clinicDoc.exists()) {
          const data = clinicDoc.data();
          const formattedServices = [];
          if (data.servicePrices) {
            Object.entries(data.servicePrices).forEach(([serviceName, price]) => {
              formattedServices.push({ name: serviceName, price });
            });
          }

          const clinicInfo = {
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
            clinicDescription: data.clinicDescription || 'No description available',
            image: data.imgURL || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp',
            phone: data.phone || 'Not available',
            email: data.email || 'Not available',
            hours: data.operatingHours || 'Not available',
            lat: data.lat,
            lng: data.lng,
            ...(initialClinicInfo || {})
          };

          setClinic(clinicInfo);
        } else if (!initialClinicInfo) {
          navigate('/FindClinic');
        }
      } catch (error) {
        console.error("Error fetching clinic data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClinicData();
    fetchVeterinarians();

    // Check if we should open the appointment modal
    if (location.state?.openAppointmentModal && auth.currentUser) {
      setShowModal(true);
    }
  }, [clinicId, clinicData, navigate, location.state, auth]);

  useEffect(() => {
    if (clinic && clinic.lat && clinic.lng) {
      if (!mapRef.current) {
        mapRef.current = L.map('mapClinicLocator').setView([clinic.lat, clinic.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        const clinicIcon = L.icon({
          iconUrl: '/images/fur.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const streetViewUrl = `https://www.google.com/maps?q=&layer=c&cbll=${clinic.lat},${clinic.lng}&cbp=11,0,0,0,0`;
        markerRef.current = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon })
          .addTo(mapRef.current)
          .bindPopup(
            `<b>${clinic.clinicName}</b><br>${clinic.streetAddress}, ${clinic.city}<br>` +
            `<a href="${streetViewUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">View in Google Street View</a>`
          )
          .openPopup();
      } else {
        mapRef.current.setView([clinic.lat, clinic.lng], 15);
        markerRef.current.setLatLng([clinic.lat, clinic.lng]);
        markerRef.current.setPopupContent(`<b>${clinic.clinicName}</b><br>${clinic.streetAddress}, ${clinic.city}`);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [loading, clinic]);

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
      setShowLoginModal(true);
      return;
    }

    fetchVeterinarians();
    setAppointmentData({
      petId: userPets.length > 0 ? userPets[0].id : "",
      veterinarianId: "",
      serviceType: "",
      dateofAppointment: "",
    });
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
  
    const { petId, veterinarianId, serviceType, dateofAppointment, notes } = appointmentData;
    if (!petId || !veterinarianId || !serviceType || !dateofAppointment) {
      setBookingStatus({
        loading: false,
        success: false,
        error: "Please fill in all required fields",
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
  
      const pendingAppointmentRef = await addDoc(collection(db, "appointments"), {
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
        notes: notes || "",
        status: "pending", // Add a status field to track approval
        createdAt: serverTimestamp(),
      });
  
      setBookingStatus({ loading: false, success: true, error: null });
  
      setTimeout(() => {
        setShowModal(false);
        setBookingStatus({ loading: false, success: false, error: null });
      }, 3000);
    } catch (error) {
      console.error("Error creating pending appointment:", error);
      setBookingStatus({
        loading: false,
        success: false,
        error: error.message || "Failed to book appointment. Please try again.",
      });
    }
  };
  

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate('/login', { state: { from: `/clinic/${clinicId}`, openAppointmentModal: true } });
  };

  const handleVetClick = (vet) => {
    setSelectedVet(vet);
    setShowVetModal(true);
  };

  if (loading) {
    return <div className="loading">Loading clinic details...</div>;
  }

  if (!clinic) {
    return <div className="loading">Clinic not found</div>;
  }

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
            <div className="cta-section">
              <button className="book-appointment-btn" onClick={handleBookAppointment}>
                Book an Appointment
              </button>
            </div>
          </div>

          <div className="clinic-info-section">
            <h2>About This Clinic</h2>
            <p className="clinic-description">
              {clinic?.clinicDescription ?? "No description available"}
            </p>
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
                <div className="info-item email-item">
                  <span className="info-label">Email:</span>
                  {clinic.email && clinic.email.includes("@") ? (
                    <span className="info-value email-value">
                      <span className="truncated">
                        {(() => {
                          const [name, domain] = clinic.email.split("@");
                          return `${name.substring(0, 10)}...@${domain}`;
                        })()}
                      </span>
                      <span className="full-text">{clinic.email}</span>
                    </span>
                  ) : (
                    <span className="info-value" style={{ color: "gray" }}>Not Available</span>
                  )}
                </div>
                <div className="info-item">
                  <span className="info-label">Operating Hours:</span>
                  <span className="info-value">{clinic.hours}</span>
                </div>
              </div>
            </div>

            <div className="map-container">
              <h2>Location</h2>
              <div id="mapClinicLocator" className="clinic-map" style={{ height: '400px', width: '100%' }}>
                {(!clinic.lat || !clinic.lng) ? (
                  <p className="map-placeholder">Map coordinates not available</p>
                ) : (
                  <p className="map-coordinates">
                    Coordinates: Lat: {clinic.lat}, Lng: {clinic.lng}
                  </p>
                )}
              </div>
            </div>

            <div className="veterinarians-section">
              <h2>Our Veterinarians</h2>
              {loadingVeterinarians ? (
                <p>Loading veterinarians...</p>
              ) : veterinarians.length > 0 ? (
                <ul className="veterinarians-list">
                  {veterinarians.map((vet) => (
                    <li
                      key={vet.id}
                      className="veterinarian-item"
                      onClick={() => handleVetClick(vet)}
                    >
                      <img
                        src={vet.profileImageURL || 'https://via.placeholder.com/50'}
                        alt={`${vet.FirstName} ${vet.LastName}`}
                        className="vet-profile-image"
                      />
                      <div className="vet-info">
                        <span className="vet-name">
                          Dr. {vet.FirstName} {vet.LastName}
                        </span>
                        {vet.services && vet.services.length > 0 && (
                          <span className="vet-services">
                            Specialties: {vet.services.join(', ')}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No veterinarians found for this clinic.</p>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                  <p>Your Appointment booked successfully but please wait for the confirmation!</p>
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

      {showVetModal && selectedVet && (
        <div className="modal-overlay">
          <div className="vet-modal">
            <div className="modal-header">
              <h2>Veterinarian Details</h2>
              <button className="close-button" onClick={() => setShowVetModal(false)}>×</button>
            </div>
            <div className="modal-body vet-modal-body">
              <img
                src={selectedVet.profileImageURL || 'https://via.placeholder.com/100'}
                alt={`${selectedVet.FirstName} ${selectedVet.LastName}`}
                className="vet-modal-image"
              />
              <h3>{`Dr. ${selectedVet.FirstName} ${selectedVet.LastName}`}</h3>
              <p><strong>Contact Number:</strong> {selectedVet.contactNumber || 'Not available'}</p>
              <p><strong>Email:</strong> {selectedVet.email || 'Not available'}</p>
              <div className="vet-schedule">
                <strong>Schedule:</strong>
                {selectedVet.schedule && selectedVet.schedule.length > 0 ? (
                  <ul>
                    {selectedVet.schedule.map((slot, index) => (
                      <li key={index}>
                        {slot.day}: {slot.startTime} - {slot.endTime}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Not available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ClinicDetails;