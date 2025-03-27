import { useNavigate } from 'react-router-dom';
import './ClinicSubscribe.css';
import { FaTimes, FaPaw } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone, FiUpload } from "react-icons/fi";
import { BiClinic, BiBuilding } from "react-icons/bi";
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase'; // Ensure this path is correct
import { confirmPasswordReset, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { CiUser, CiUnlock } from "react-icons/ci";
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ClinicSubscribe = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // to show password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  // Add this state outside of useEffect
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicePrices, setServicePrices] = useState({});
  const [otherServices, setOtherServices] = useState([]);
  const [newOtherService, setNewOtherService] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState([]);

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
    password: '',
    confirmPassword: ''
  });

  const [verificationDocs, setVerificationDocs] = useState({
    birDoc: null,
    businessPermit: null,
  });

  const handleServiceToggle = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
      const updatedPrices = { ...servicePrices };
      delete updatedPrices[service]; // Remove price if service is deselected
      setServicePrices(updatedPrices);
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handlePriceChange = (service, price) => {
    setServicePrices({ ...servicePrices, [service]: price });
  };

  // Add new custom service
  const handleAddOtherService = () => {
    if (newOtherService.trim() !== '') {
      setOtherServices([...otherServices, newOtherService]);
      setSelectedServices([...selectedServices, newOtherService]);
      setNewOtherService('');
    }
  };

  // Remove custom service
  const handleRemoveOtherService = (serviceToRemove) => {
    setOtherServices(otherServices.filter(service => service !== serviceToRemove));
    setSelectedServices(selectedServices.filter(service => service !== serviceToRemove));

    // Remove price if service is removed
    const updatedPrices = { ...servicePrices };
    delete updatedPrices[serviceToRemove];
    setServicePrices(updatedPrices);
  };
  // Handle input changes for the initial form
  const handleInitialFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClinicInfo({
      ...clinicInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const isValidPhilippinesNumber = (number) => {
    const phRegex = /^(\+63|0)9\d{9}$/;
    return phRegex.test(number);
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (!files[0]) return;
  
    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("upload_preset", "furwell");
  
    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/dbqoga68a/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
  
      if (data.secure_url) {
        setVerificationDocs((prevDocs) => {
          const updatedDocs = { ...prevDocs, [name]: data.secure_url };
          updateFirestoreVerificationDocs(updatedDocs); // 🔥 Ensure Firestore is updated
          return updatedDocs;
        });
      } else {
        throw new Error("No secure URL received from Cloudinary.");
      }
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      alert("Failed to upload document. Please try again.");
    }
  };
  
  const updateFirestoreVerificationDocs = async (updatedDocs) => {
    try {
      if (!updatedDocs || typeof updatedDocs !== "object") throw new Error("Invalid updatedDocs object");
  
      // Wait for authentication state change
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            resolve(user);
            unsubscribe(); // Stop listening once user is found
          }
        });
      });
  
      const clinicRef = doc(db, "registersClinics", auth.currentUser?.uid);
      if (!auth.currentUser?.uid) throw new Error("No authenticated user found");
  
      await setDoc(clinicRef, { verificationDocs: updatedDocs }, { merge: true });
  
      console.log("✅ Firestore updated successfully with verification documents.");
    } catch (error) {
      console.error("❌ Error updating Firestore:", error);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidPhilippinesNumber(clinicInfo.phone)) return setError("Invalid Philippines contact number");
    if (clinicInfo.password !== clinicInfo.confirmPassword) return setError("Passwords do not match");
    setError("");
    setShowModal(true);
  };
  
  const retryOperation = (operation, delay, retries) => new Promise((resolve, reject) => {
    operation().then(resolve).catch((reason) => {
      if (retries > 0) setTimeout(() => retryOperation(operation, delay, retries - 1).then(resolve).catch(reject), delay);
      else reject(reason);
    });
   });

   const storeClinicDatas = async (user) => {
    try {
      const userData = {
        clinicName: clinicInfo.clinicName,
        FirstName: clinicInfo.ownerFirstName,
        LastName: clinicInfo.ownerLastName,
        email: clinicInfo.email,
        contactNumber: clinicInfo.phone,
        streetAddress: clinicInfo.streetAddress,
        city: clinicInfo.city,
        province: clinicInfo.province,
        postalCode: clinicInfo.postalCode,
        lat: clinicInfo.lat,
        lng: clinicInfo.lng,
        servicePrices: servicePrices,
        verificationDocs, // Attach uploaded documents
        status: "pending", // Pending approval
        createdAt: new Date(),
      };
  
      console.log("🔥 Storing user data in Firestore:", userData);
      
      // ✅ Store user data in Firestore
      await setDoc(doc(db, "registersClinics", user.uid), userData);
  
      console.log("✅ Firestore Document Created for:", user.uid);
  
      // ✅ Show success message and navigate
      alert("Clinic registration successful. Please wait for approval.");
      setTimeout(() => {
        navigate("/Home");
      }, 3000);
      
    } catch (error) {
      console.error("❌ Error storing data in Firestore:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const nextStep = async () => {
    if (currentStep < 4) {
      if (currentStep === 1 && selectedServices.length === 0) return alert("Please select at least one service.");
      if (currentStep === 2 && !selectedServices.every(service => service === "Others" || servicePrices[service])) 
        return alert("Please set prices for all selected services.");
      if (currentStep === 3 && Object.values(clinicInfo).some(val => !val))
        return alert("Please fill in all required fields.");
  
      setCurrentStep(currentStep + 1);
    } else {
      try {
        // ✅ Ensure required documents are uploaded
        if (!verificationDocs?.birDoc || !verificationDocs?.businessPermit) {
          alert("Please upload the required documents.");
          return;
        }
  
        // ✅ Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, clinicInfo.email, clinicInfo.password);
        const user = userCredential.user;
  
        console.log("✅ Firebase Auth User Created:", user.uid);
  
        // ✅ Call the function to store user data in Firestore
        await storeClinicDatas(user);
        alert("Clinic registration successful. Please wait for approval.");
        
        setTimeout(() => {navigate("/Home");}, 3000);
  
      } catch (error) {
        console.error("❌ Error creating user:", error);
        if (error.code === "auth/email-already-in-use") {
          alert("This email is already registered. Please use a different email.");
        } else {
          alert(`Error: ${error.message}`);
        }
      }
    }
  };
  
  //  const nextStep = async () => {
  //   if (currentStep < 4) {
  //     if (currentStep === 1 && selectedServices.length === 0) return alert("Please select at least one service.");
  //     if (currentStep === 2 && !selectedServices.every(service => service === "Others" || servicePrices[service])) 
  //       return alert("Please set prices for all selected services.");
  //     if (currentStep === 3 && Object.values(clinicInfo).some(val => !val))
  //       return alert("Please fill in all required fields.");
  
  //     setCurrentStep(currentStep + 1);
  //   } else {
  //     try {
  //       // ✅ Ensure required documents are uploaded
  //       if (!verificationDocs?.birDoc || !verificationDocs?.businessPermit) {
  //         alert("Please upload the required documents.");
  //         return;
  //       }
  
  //       // ✅ Create user in Firebase Authentication
  //       const userCredential = await createUserWithEmailAndPassword(auth, clinicInfo.email, clinicInfo.password);
  //       const user = userCredential.user;
  
  //       console.log("✅ Firebase Auth User Created:", user.uid);
  
  //       // ✅ Store clinic data in Firestore
  //       const userData = {
  //         clinicName: clinicInfo.clinicName,
  //         FirstName: clinicInfo.ownerFirstName,
  //         LastName: clinicInfo.ownerLastName,
  //         email: clinicInfo.email,
  //         contactNumber: clinicInfo.phone,
  //         streetAddress: clinicInfo.streetAddress,
  //         city: clinicInfo.city,
  //         province: clinicInfo.province,
  //         postalCode: clinicInfo.postalCode,
  //         lat: clinicInfo.lat,
  //         lng: clinicInfo.lng,
  //         servicePrices: servicePrices,
  //         verificationDocs, // Attach uploaded documents
  //         status: "pending", // Pending approval
  //         createdAt: new Date(),
  //       };
  
  //       console.log("🔥 Storing user data in Firestore:", userData);
  
  //       // ✅ Store user data in Firestore with the generated user ID
  //       await setDoc(doc(db, "registersClinics", user.uid), userData);
  
  //       console.log("✅ Firestore Document Created for:", user.uid);
  
  //       // ✅ Show success modal instead of alert
  //       window.alert("Clinic registration successful. Please wait for approval.");
  //      console.log("✅ Alert should have been triggered.");
  //       // ✅ Navigate to Home after 3 seconds
  //       setShowModal(false);
  //       setTimeout(() => {
  //         navigate("/Home");
  //       }, 3000);
  
  //     } catch (error) {
  //       console.error("❌ Error creating user or storing data:", error);
  //       if (error.code === "auth/email-already-in-use") {
  //         alert("This email is already registered. Please use a different email.");
  //       } else {
  //         alert(`Error: ${error.message}`);
  //       }
  //     }
  //   }
  // };
  // Get progress bar width based on current step
  const getProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === 2) return '35%';
    if (currentStep === 3) return '65%';
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

    if (currentStep === 3 && mapContainerRef.current) {

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
          reverseGeocode(position.lat, position.lng); // Reverse geocode on drag end
        });
      } else {

        mapRef.current.setView([clinicInfo.lat, clinicInfo.lng], 15);
        markerRef.current.setLatLng([clinicInfo.lat, clinicInfo.lng]);
      }
    }

    return () => {

      if (mapRef.current && currentStep !== 3) {

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

  // Reverse geocoding function with detailed address extraction
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();

      if (data && data.address) {
        const { road, neighbourhood, suburb, city, town, village, county, state, postcode, administrative_area, hamlet, quarter, } = data.address;

        let updatedCity = city || town || village || '';
        let updatedProvince = administrative_area || state || county || '';
        let updatedPostalCode = postcode || '';

        if (updatedCity.toLowerCase() === 'cebu' || updatedCity.toLowerCase() === 'cebu city') {
          updatedProvince = 'Cebu';
          updatedPostalCode = '6000';
          console.log(`City detected as '${updatedCity}', setting province to 'Cebu'`);
        } else {
          console.log(`City is '${updatedCity}', province remains '${updatedProvince}'`);
        }

        setClinicInfo(prevState => ({
          ...prevState,
          streetAddress: road ? road : (neighbourhood || suburb || quarter || hamlet || ''),
          city: updatedCity,
          province: updatedProvince,
          postalCode: updatedPostalCode,
        }));

        // Log the extracted address details for debugging
        console.log("Reverse Geocoding Result:", {
          streetAddress: road ? road : (neighbourhood || suburb || quarter || hamlet || ''),
          city: updatedCity,
          province: updatedProvince,
          postalCode: updatedPostalCode,
        });

      } else {
        console.error('Reverse geocoding failed: Address not found.');
      }
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const serviceList = querySnapshot.docs.map(doc => doc.id); // Fetching document IDs as service names
        setServices(serviceList);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  // Go to next step
  const goToNextStep = () => {
    if (currentStep === 1 && selectedServices.length > 0) {
      setCurrentStep(2);
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    setCurrentStep(1);
  };

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
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={clinicInfo.password}
                onChange={handleInitialFormChange}
                required
              />
              <div className="cpassword-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? (
                  <img src="https://www.freeiconspng.com/thumbs/eye-icon/eyeball-icon-png-eye-icon-1.png" alt="Hide" className="ceye-icon" />
                ) : (
                  <img src="https://static.thenounproject.com/png/22249-200.png" alt="Show" className="eye-icon" />
                )}
              </div>
            </div>
            <div className="CS_input-container">
              <CiUnlock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Enter your password"
                value={clinicInfo.confirmPassword}
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

            {error && <p style={{ color: 'red' }}>{error}</p>}
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
            <div className="modal-header-CS">
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
                <span className="step-label">Price</span>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                3
                <span className="step-label">Address</span>
              </div>
              <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                4
                <span className="step-label">Verification</span>
              </div>
            </div>

            {/* Step 1: Offered Services */}
            {currentStep === 1 && (
              <div>
                <h3>Select Services</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[...services, "Others"].map((service) => (
                    <CustomChip
                      key={service}
                      label={service}
                      onClick={() => handleServiceToggle(service)}
                      isSelected={selectedServices.includes(service)}
                    />
                  ))}
                </div>

                {selectedServices.includes("Others") && (
                  <div style={{ marginTop: '15px' }}>
                    <h4>Add Custom Services</h4>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Enter service name"
                        value={newOtherService}
                        onChange={(e) => setNewOtherService(e.target.value)}
                        style={{ padding: '8px', marginRight: '8px', width: '200px' }}
                      />
                      <button
                        onClick={handleAddOtherService}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>

                    {otherServices.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <h4>Added Custom Services:</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {otherServices.map((service, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', margin: '4px' }}>
                              <span style={{
                                backgroundColor: '#e1f5fe',
                                padding: '6px 10px',
                                borderRadius: '16px',
                                marginRight: '5px'
                              }}>
                                {service}
                              </span>
                              <button
                                onClick={() => handleRemoveOtherService(service)}
                                style={{
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3>Set Prices for Selected Services</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedServices
                    .filter(service => service !== "Others")
                    .map((service) => (
                      <div key={service} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '200px', fontWeight: 'bold' }}>{service}</div>
                        <input
                          type="number"
                          placeholder="Enter price"
                          value={servicePrices[service] || ""}
                          onChange={(e) => handlePriceChange(service, e.target.value)}
                          style={{
                            padding: '8px',
                            width: '150px',
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}


            {/* Step 3: Address */}
            {currentStep === 3 && (
              <div>
                <h3>Business Address</h3>
                <div className="form-group-CS">
                  <label>Street Address <span className="required">*</span></label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={clinicInfo.streetAddress}
                    onChange={handleAddressChange}
                    required />

                </div>
                <div className="form-group-CS">
                  <label>City <span className="required">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={clinicInfo.city}
                    onChange={handleAddressChange}
                    required />
                </div>
                <div className="form-group-CS">
                  <label>Province/State <span className="required">*</span></label>
                  <input
                    type="text"
                    name="province"
                    value={clinicInfo.province}
                    onChange={handleAddressChange}
                    required />
                </div>
                <div className="form-group-CS">
                  <label>Postal Code <span className="required">*</span></label>
                  <input
                    type="text"
                    name="postalCode"
                    value={clinicInfo.postalCode}
                    onChange={handleAddressChange}
                    required />
                </div>

                {/* Search User Address */}
                <div className="form-group-CS">
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

            {/* Step 4: Business Verification */}
            {currentStep === 4 && (
              <div>
                <h3>Business Verification</h3>

                {/* Read-only clinic name */}
                <div className="form-group-CS">
                  <label>Clinic Name</label>
                  <input
                    type="text"
                    value={clinicInfo.clinicName}
                    disabled
                    className="readonly-input"
                  />
                </div>

                {/* Document uploads */}
                <div className="form-group-CS">
                  <label>BIR 2303 Form <span className="required">*</span></label>
                  <div className="file-upload-container">
                    <FiUpload className="upload-icon" />
                    <input
                      type="file"
                      name="birDoc"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-CS">
                  <label>Business Permit <span className="required">*</span></label>
                  <div className="file-upload-container">
                    <FiUpload className="upload-icon" />
                    <input
                      type="file"
                      name="businessPermit"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>

                {/* <div className="form-group">
                  <label>Other Supporting Documents (optional)</label>
                  <div className="file-upload-container">
                    <FiUpload className="upload-icon" />
                    <input
                      type="file"
                      name="otherDocs"
                      onChange={handleFileChange}
                    />
                  </div>
                </div> */}
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
                {currentStep < 4 ? `Next step: ${currentStep === 1 ? 'Price' : currentStep === 2 ? 'Address' : 'Verifications'}` : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicSubscribe;