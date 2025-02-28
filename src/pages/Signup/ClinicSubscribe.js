import { useNavigate } from 'react-router-dom';
import './ClinicSubscribe.css'; 
import { FaTimes, FaPaw } from "react-icons/fa";
import { FiUser, FiLock, FiMail, FiPhone, FiUpload } from "react-icons/fi";
import { BiClinic, BiBuilding } from "react-icons/bi";
import React, { useState } from 'react';
import { auth, db } from '../../firebase'; // Ensure this path is correct
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const ClinicSubscribe = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    phone: '',
    hasBIR: false
  });

  const [verificationDocs, setVerificationDocs] = useState({
    birDoc: null,
    businessPermit: null,
    otherDocs: null
  });

  // Handle input changes for the initial form
  const handleInitialFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClinicInfo({
      ...clinicInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setVerificationDocs({
      ...verificationDocs,
      [name]: files[0]
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  // Next step handler
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final submission
      setShowModal(false);
      // Process the complete form data
    }
  };

  // Get progress bar width based on current step
  const getProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === 2) return '50%';
    return '100%';
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
          
            <div className="BIR_header">
              <p>Do you have BIR 2303 form?</p>
            </div>

            <div className="BIR">
              <input type="radio" id="yes" name="hasBIR" value="yes" required />
              <label htmlFor="yes">Yes</label>
              <input type="radio" id="no" name="hasBIR" value="no" required />
              <label htmlFor="no">No</label>
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
                <span className="step-label">Verification</span>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                2
                <span className="step-label">Address</span>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                3
                <span className="step-label">Payment</span>
              </div>
            </div>
            
            {/* Step 1: Business Verification */}
            {currentStep === 1 && (
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
            
            {/* Step 2: Address */}
            {currentStep === 2 && (
              <div>
                <h3>Business Address</h3>
                <div className="form-group">
                  <label>Street Address <span className="required">*</span></label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>City <span className="required">*</span></label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Province/State <span className="required">*</span></label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Postal Code <span className="required">*</span></label>
                  <input type="text" required />
                </div>
              </div>
            )}
            
            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div>
                <h3>Payment Information</h3>
                <div className="form-group">
                  <label>Card Number <span className="required">*</span></label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Expiration Date <span className="required">*</span></label>
                  <input type="text" placeholder="MM/YY" required />
                </div>
                <div className="form-group">
                  <label>CVV <span className="required">*</span></label>
                  <input type="text" required />
                </div>
                <div className="form-group">
                  <label>Billing Address <span className="required">*</span></label>
                  <input type="text" required />
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