import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Footer from '../../components/Footer/Footer';
import './ClinicDetails.css';

const ClinicDetails = () => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Try to get clinic from location state first
  const clinicData = location.state?.clinicData;

  // Function to categorize the price
  const categorizePrice = (price) => {
    if (price < 800) return '₱';
    if (price >= 800 && price <= 1400) return '₱₱';
    return '₱₱₱';
  };

  useEffect(() => {
    async function fetchClinicData() {
      // If we have clinic data from state, use it
      if (clinicData) {
        setClinic(clinicData);
        setLoading(false);
        return;
      }
      
      try {
        const clinicDoc = await getDoc(doc(db, "clinics", clinicId));
        
        if (clinicDoc.exists()) {
          const data = clinicDoc.data();
          setClinic({
            id: clinicDoc.id,
            clinicName: data.clinicName,
            streetAddress: data.streetAddress,
            city: data.city || '',
            province: data.province || '',
            postalCode: data.postalCode || '',
            priceCategory: categorizePrice(data.price),
            price: data.price,
            services: data.services || [],
            description: data.description || 'No description available',
            image: data.imgURL || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp',
            phone: data.phone || 'Not available',
            email: data.email || 'Not available',
            hours: data.operatingHours || 'Not available',
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
                  <li key={index}>{service}</li>
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
              {/* You can integrate a map here if you have coordinates */}
              <p className="map-placeholder">Map will be displayed here</p>
            </div>
          </div>
          
          <div className="cta-section">
            <button className="book-appointment-btn">Book an Appointment</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClinicDetails;