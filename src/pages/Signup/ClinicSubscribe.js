import { useNavigate } from 'react-router-dom';
import './ClinicSubscribe.css';
import { FaTimes, FaPaw } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone, FiUpload } from "react-icons/fi";
import { BiClinic, BiBuilding } from "react-icons/bi";
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase'; // Ensure this path is correct
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { CiUser, CiUnlock } from "react-icons/ci";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ClinicSubscribe = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Add this state outside of useEffect
  const [selectedServices, setSelectedServices] = useState([]);

  // Form state
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
    lat: 10.3157, // Default latitude for Cebu City
    lng: 123.8854,
  });

  const [verificationDocs, setVerificationDocs] = useState({
    birDoc: null,
    businessPermit: null,
    otherDocs: null
  });

  // Handle service selection - move this outside of useEffect
  const handleServiceToggle = (service) => {
    setSelectedServices((prevSelected) => 
      prevSelected.includes(service)
        ? prevSelected.filter(s => s !== service)  // Remove if already selected
        : [...prevSelected, service]               // Add if not already selected
    );
  };
  
  // Handle input changes for the initial form
  const handleInitialFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClinicInfo({
      ...clinicInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files[0];
  
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "furwell"); // Cloudinary upload preset
  
    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/dbqoga68a/upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
  
      if (data.secure_url) {
        console.log("File uploaded to Cloudinary:", data.secure_url);
  
        // Update local state
        setVerificationDocs((prevDocs) => {
          const updatedDocs = {
            ...prevDocs,
            [name]: data.secure_url,
          };
  
          // Store in Firestore after state is updated
          updateFirestoreVerificationDocs(updatedDocs);
          return updatedDocs;
        });
  
        alert("Document uploaded successfully!");
      } else {
        throw new Error("No secure URL received from Cloudinary.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload document. Please try again.");
    }
  };
  
  // Helper function to update Firestore
  const updateFirestoreVerificationDocs = async (updatedDocs) => {
    try {
      const clinicRef = doc(db, "registersClinics", auth.currentUser?.uid);
      await setDoc(clinicRef, { verificationDocs: updatedDocs }, { merge: true });
      console.log("Verification docs updated in Firestore:", updatedDocs);
    } catch (error) {
      console.error("Error updating Firestore:", error);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  // Next step handler
  const nextStep = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final submission
      try {
        // Step 1: Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          clinicInfo.email, 
          'defaultPassword'
        );
        
        // Step 2: Only proceed to database operation if authentication succeeds
        const user = userCredential.user;
        
        const userData = {
          clinicName: clinicInfo.clinicName,
          ownerFirstName: clinicInfo.ownerFirstName,
          ownerLastName: clinicInfo.ownerLastName,
          email: clinicInfo.email,
          phone: clinicInfo.phone,
          streetAddress: clinicInfo.streetAddress,
          city: clinicInfo.city,
          province: clinicInfo.province,
          postalCode: clinicInfo.postalCode,
          lat: clinicInfo.lat,
          lng: clinicInfo.lng,
          services: selectedServices,
          status: "pending",
          verificationDocs,
          createdAt: new Date()
        };
        setShowModal(false);
        alert('Pending Account: Please wait for the admin to confirm the clinic information');
        navigate('/Home');
        // Store user data in Firestore
        await setDoc(doc(db, "registersClinics", user.uid), userData);        
      } catch (error) {
        // Check for specific authentication errors
        if (error.code === 'auth/email-already-in-use') {
          alert('This email is already registered. Please use a different email.');
        } else {
          alert(`Error creating user: ${error.message}`);
        }
      }
    }
  };

  // Get progress bar width based on current step
  const getProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === 2) return '50%';
    return '100%';
  };

  // Handle address input change in modal step 2
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setClinicInfo({
      ...clinicInfo,
      [name]: value
    });
  };

  // Map integration
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    console.log("useEffect triggered, currentStep:", currentStep);
    if (currentStep === 2 && mapContainerRef.current) {
      console.log("Current step is 2 and map container exists.");
      if (!mapRef.current) {
        console.log("Initializing map.");
        mapRef.current = L.map(mapContainerRef.current).setView([clinicInfo.lat, clinicInfo.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);

        const myIcon = L.icon({
          iconUrl: '/images/pawPin3.png', 
          iconSize: [32, 32], 
          iconAnchor: [16, 32], 
          popupAnchor: [0, -32],
        });

        markerRef.current = L.marker([clinicInfo.lat, clinicInfo.lng], {
          draggable: true,
          icon: myIcon,
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', function (event) {
          const marker = event.target;
          const position = marker.getLatLng();
          setClinicInfo(prevState => ({
            ...prevState,
            lat: position.lat,
            lng: position.lng
          }));
        });
      } else {
        console.log("Updating existing map.");
        mapRef.current.setView([clinicInfo.lat, clinicInfo.lng], 15);
        markerRef.current.setLatLng([clinicInfo.lat, clinicInfo.lng]);
      }
    }

    return () => {
      console.log("Cleanup triggered, currentStep:", currentStep);
      if (mapRef.current && currentStep !== 2) {
        console.log("Removing map and marker.");
        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
          markerRef.current = null;
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentStep, clinicInfo.lat, clinicInfo.lng]);

  // Search location based on address fields
  const searchLocation = async () => {
    const { streetAddress, city, province, postalCode } = clinicInfo;
    const address = `${streetAddress}, ${city}, ${province}, ${postalCode}`;

    try {
      console.log("Searching location:", address);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        console.log("Location found:", lat, lon);

        setClinicInfo(prevState => ({
          ...prevState,
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        }));

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], 15);
          markerRef.current.setLatLng([lat, lon]);
        }
      } else {
        console.log("Location not found.");
        alert('Location not found. Please check the address details.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching for location. Please try again.');
    }
  };

  // Custom Chip component to replace MUI Chip
  const CustomChip = ({ label, onClick, isSelected }) => (
    <button
      type="button"
      onClick={onClick}
      className={`custom-chip ${isSelected ? 'selected' : ''}`}
      style={{
        margin: '4px',
        padding: '4px 12px',
        borderRadius: '16px',
        border: isSelected ? 'none' : '1px solid #bdbdbd',
        backgroundColor: isSelected ? '#1976d2' : 'transparent',
        color: isSelected ? 'white' : 'inherit',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '400',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="CS_container">
      <div className="right-content">
        <div className="clinic_header">
          <h2>Boost your appointments with Furwell!</h2>
          <p>Sign up now and start receiving more bookings with the</p>
          <p>leading appointment scheduling service for veterinary clinics.</p>
        </div>

        <div className="CS_box">
          {/* Header */}
          <div className="CS_header">
            <div className="clinic-head">
              <h2>Ready to grow your clinic?</h2>
            </div>
            <img src='/images/furwell_logo.png' alt="FurWell Logo" className="logo" />
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit}>
            <div className="CS_input-container">
              <BiClinic className="icon" />
              <input
                type="text"
                name="clinicName"
                placeholder="Clinic Name"
                value={clinicInfo.clinicName}
                onChange={handleInitialFormChange}
                required
              />
            </div>

            <div className="CS_input-container">
              <FiUser className="icon" />
              <input
                type="text"
                name="ownerFirstName"
                placeholder="Clinic Owner First Name"
                value={clinicInfo.ownerFirstName}
                onChange={handleInitialFormChange}
                required
              />
            </div>

            <div className="CS_input-container">
              <FiUser className="icon" />
              <input
                type="text"
                name="ownerLastName"
                placeholder="Clinic Owner Last Name"
                value={clinicInfo.ownerLastName}
                onChange={handleInitialFormChange}
                required
              />
            </div>

            <div className="CS_input-container">
              <FiMail className="icon" />
              <input
                type="email"
                name="email"
                placeholder="Enter your Clinic Email"
                value={clinicInfo.email}
                onChange={handleInitialFormChange}
                required
              />
            </div>
            <div className="CS_input-container">
              <CiUnlock className="icon" />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleInitialFormChange}
                required
              />
            </div>

            <div className="CS_input-container">
              <FiPhone className="icon" />
              <select className="country-code">
                <option>PH +63</option>
                {/* Add other country codes if needed */}
              </select>
              <input
                type="text"
                name="phone"
                placeholder="XXX - XXXX - XXX"
                value={clinicInfo.phone}
                onChange={handleInitialFormChange}
                required
              />
            </div>


            {/* Create Account Button */}
            <button type="submit" className="get-started">
              <FaPaw className="paw-icon" /> Get Started
            </button>
          </form>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Business Verification</h2>
              <p>Please provide the necessary documents to verify your clinic.</p>
            </div>

            {/* Progress indicator */}
            <div className="progress-container">
              <div className="progress-bar" style={{ width: getProgressWidth() }}></div>
              <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                1
                <span className="step-label">Services</span>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                2
                <span className="step-label">Address</span>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                3
                <span className="step-label">Verification</span>
              </div>
            </div>
            
            {/* Step 1: Offered Services */}
            {currentStep === 1 && (
              <div>
                <h3>Offered Services</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {/* Pre-defined services */}
                  {[
                    "Wellness & Prevention", 
                    "Testing & Diagnostics", 
                    "Advanced Care", 
                    "Pet Anesthesia", 
                    "Pet Dental Surgery", 
                    "Orthopedic Pet Surgery", 
                    "Pet Surgery", 
                    "Urgent Care",
                    "Behavioral Consultation",
                    "Nutritional Counseling",
                    "Geriatric Care"
                  ].map((service) => (
                    <CustomChip
                      key={service}
                      label={service}
                      onClick={() => handleServiceToggle(service)}
                      isSelected={selectedServices.includes(service)}
                    />
                  ))}
                </div>
              </div>
            )}


            {/* Step 2: Address */}
            {currentStep === 2 && (
              <div>
                <h3>Business Address</h3>
                <div className="form-group">
                  <label>Street Address <span className="required">*</span></label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={clinicInfo.streetAddress}
                    onChange={handleAddressChange}
                    required />

                </div>
                <div className="form-group">
                  <label>City <span className="required">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={clinicInfo.city}
                    onChange={handleAddressChange}
                    required />
                </div>
                <div className="form-group">
                  <label>Province/State <span className="required">*</span></label>
                  <input
                    type="text"
                    name="province"
                    value={clinicInfo.province}
                    onChange={handleAddressChange}
                    required />
                </div>
                <div className="form-group">
                  <label>Postal Code <span className="required">*</span></label>
                  <input
                    type="text"
                    name="postalCode"
                    value={clinicInfo.postalCode}
                    onChange={handleAddressChange}
                    required />
                </div>

                {/* Search User Address */}
                <div className="form-group">
                  <button
                    type="button"
                    className="location-search-btn"
                    onClick={searchLocation}
                  >
                    Search Location
                  </button>
                </div>
                <div className="location-coordinates">
                  <p>Latitude: {clinicInfo.lat.toFixed(6)}</p>
                  <p>Longitude: {clinicInfo.lng.toFixed(6)}</p>
                  <p className="map-instruction">You can drag the marker to adjust the exact location</p>
                </div>
                <div ref={mapContainerRef} className="mapClinic-container"></div>


              </div>
            )}

            {/* Step 3: Business Verification */}
            {currentStep === 3 && (
              <div>
                <h3>Business Verification</h3>

                {/* Read-only clinic name */}
                <div className="form-group">
                  <label>Clinic Name</label>
                  <input
                    type="text"
                    value={clinicInfo.clinicName}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Document uploads */}
                <div className="form-group">
                  <label>BIR 2303 Form <span className="required">*</span></label>
                  <div className="file-upload-container">
                    <FiUpload className="upload-icon" />
                    <input
                      type="file"
                      name="birDoc"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Permit <span className="required">*</span></label>
                  <div className="file-upload-container">
                    <FiUpload className="upload-icon" />
                    <input
                      type="file"
                      name="businessPermit"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Other Supporting Documents (optional)</label>
                  <div className="file-upload-container">
                    <FiUpload className="upload-icon" />
                    <input
                      type="file"
                      name="otherDocs"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            )}
            

            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setShowModal(false)}
              >
                {currentStep > 1 ? 'Back' : 'Cancel'}
              </button>
              <button className="btn btn-next" onClick={nextStep}>
                {currentStep < 3 ? `Next step: ${currentStep === 1 ? 'Address' : 'Payment'}` : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicSubscribe;