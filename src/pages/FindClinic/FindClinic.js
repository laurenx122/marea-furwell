import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import getAuth to check user login status
import './FindClinic.css';
import Footer from '../../components/Footer/Footer';

const FindClinic = () => {
  const [clinics, setClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedSort, setSelectedSort] = useState('Relevance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicDetails, setClinicDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // New state for login prompt
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(); // Initialize auth

  useEffect(() => {
    if (location.state?.selectedClinicId) {
      const clinicToShow = clinics.find(clinic => clinic.id === location.state.selectedClinicId);
      if (clinicToShow) {
        setClinicDetails(clinicToShow);
        setIsModalOpen(true);
      }
    }
  }, [clinics, location.state]);

  const categorizePrice = (price) => {
    if (price < 800) return '₱';
    if (price >= 800 && price <= 1400) return '₱₱';
    return '₱₱₱';
  };

  const fetchClinics = async () => {
    setLoading(true);
    setError(null);
    try {
      const clinicSnapshot = await getDocs(collection(db, "clinics"));
      if (clinicSnapshot.empty) {
        setError("No clinics found. Please try again later.");
        setClinics([]);
        return;
      }
      
      const clinicList = clinicSnapshot.docs.map(doc => {
        const data = doc.data();
        const servicesFromPrices = data.servicePrices ? Object.keys(data.servicePrices) : [];
        return {
          id: doc.id,
          clinicName: data.clinicName || 'Unknown Clinic',
          streetAddress: data.streetAddress || 'Address not provided',
          city: data.city || '',
          province: data.province || 'Location not specified',
          postalCode: data.postalCode || '',
          price: data.price || 0,
          priceCategory: categorizePrice(data.price || 0),
          services: [...(data.services || []), ...servicesFromPrices],
          clinicDescription: data.clinicDescription || 'No description available',
          image: data.imgURL || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp',
          phone: data.phone || 'Not available',
          email: data.email || 'Not available',
          hours: data.operatingHours || 'Not available',
          servicePrices: data.servicePrices || {},
        };
      });
      
      setClinics(clinicList);
    } catch (error) {
      console.error("Error fetching clinic data: ", error);
      setError("Failed to load clinics. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const serviceList = querySnapshot.docs.map(doc => doc.id);
        const clinicsSnapshot = await getDocs(collection(db, "clinics"));
        const servicePricesList = new Set();
        
        clinicsSnapshot.docs.forEach(doc => {
          const servicePrices = doc.data().servicePrices;
          if (servicePrices) {
            Object.keys(servicePrices).forEach(service => {
              servicePricesList.add(service);
            });
          }
        });
        
        const combinedServices = [...new Set([...serviceList, ...servicePricesList])];
        setServices(combinedServices);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleClinicClick = (clinic) => {
    setClinicDetails(clinic);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setClinicDetails(null);
  };

  const handleServiceChange = (e) => {
    const { value } = e.target;
    setSelectedService(prev =>
      prev.includes(value) ? prev.filter(service => service !== value) : [...prev, value]
    );
  };

  const handlePriceChange = (price) => {
    setSelectedPrice(prev => prev === price ? '' : price);
  };

  const handleSortChange = (e) => {
    setSelectedSort(e.target.value);
  };

  const viewClinicDetails = (clinic) => {
    navigate(`/clinic/${clinic.id}`, { state: { clinicData: clinic } });
  };

  const handleBookNow = (clinic) => {
    const user = auth.currentUser;
    if (!user) {
      setShowLoginPrompt(true);
      setClinicDetails(clinic); // Store clinic details for redirect after login
    } else {
      navigate(`/clinic/${clinic.id}`, { 
        state: { 
          clinicData: clinic,
          openAppointmentModal: true // Flag to open modal
        } 
      });
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginPrompt(false);
    navigate('/login', { 
      state: { 
        from: `/clinic/${clinicDetails.id}`,
        openAppointmentModal: true // Pass flag through login
      } 
    });
  };

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = 
      clinic.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      clinic.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.province?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clinic.services && clinic.services.some(service => 
        service.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    const matchesServices = selectedService.length === 0 || 
      selectedService.every(service => clinic.services && clinic.services.includes(service));

    const matchesPrice = !selectedPrice || clinic.priceCategory === selectedPrice;

    return matchesSearch && matchesServices && matchesPrice;
  });

  const sortedClinics = [...filteredClinics].sort((a, b) => {
    if (selectedSort === 'PriceAsc') {
      return a.price - b.price;
    } else if (selectedSort === 'PriceDesc') {
      return b.price - a.price;
    }
    return a.clinicName.localeCompare(b.clinicName);
  });

  return (
    <div className="find-clinic-container">
      <form className="fsearch-bar-container" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search "
        />
      </form>

      <div className="clinic-content-area">
        <div className="filters-container">
          <h2>Filters</h2>
          <div className="filter">
            <p>Sort by:</p>
            <label>
              <input
                type="radio"
                name="sort"
                value="Relevance"
                checked={selectedSort === 'Relevance'}
                onChange={handleSortChange}
              />
              Relevance
            </label>
            <label>
              <input
                type="radio"
                name="sort"
                value="PriceAsc"
                checked={selectedSort === 'PriceAsc'}
                onChange={handleSortChange}
              />
              Price: Low to High
            </label>
            <label>
              <input
                type="radio"
                name="sort"
                value="PriceDesc"
                checked={selectedSort === 'PriceDesc'}
                onChange={handleSortChange}
              />
              Price: High to Low
            </label>
          </div>
          <div className="quick-filter">
            <button type="button">Nearby Clinics</button>
          </div>
          <div className="filter">
            <p>Services:</p>
            {services.map((service) => (
              <label key={service}>
                <input
                  type="checkbox"
                  value={service}
                  checked={selectedService.includes(service)}
                  onChange={handleServiceChange}
                />
                {service}
              </label>
            ))}
          </div>
          <div className="filter">
            <p>Price:</p>
            <div className="price-buttons">
              <button 
                type="button" 
                className={selectedPrice === '₱' ? 'selected' : ''} 
                onClick={() => handlePriceChange('₱')}
              >
                ₱
              </button>
              <button 
                type="button" 
                className={selectedPrice === '₱₱' ? 'selected' : ''} 
                onClick={() => handlePriceChange('₱₱')}
              >
                ₱₱
              </button>
              <button 
                type="button" 
                className={selectedPrice === '₱₱₱' ? 'selected' : ''} 
                onClick={() => handlePriceChange('₱₱₱')}
              >
                ₱₱₱
              </button>
            </div>
          </div>
          <button 
            className="reset-filters"
            onClick={() => {
              setSearchQuery('');
              setSelectedService([]);
              setSelectedPrice('');
              setSelectedSort('Relevance');
            }}
          >
            Reset Filters
          </button>
        </div>

        <div className="clinic-list">
          {loading ? (
            <div className="loading-container">
              <p>Loading clinics...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <button onClick={fetchClinics}>Try Again</button>
            </div>
          ) : sortedClinics.length === 0 ? (
            <div className="no-results">
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="clinics-grid">
              {sortedClinics.map(clinic => (
                <div
                  key={clinic.id}
                  className="clinic-card"
                  onClick={() => handleClinicClick(clinic)}
                >
                  <div className="fclinic-image-container">
                    <img src={clinic.image} alt={clinic.clinicName} />
                  </div>
                  <div className="clinic-card-content">
                    <h3>{clinic.clinicName}</h3>
                    <p className="clinic-location">{clinic.streetAddress}, {clinic.province}</p>
                    <div className="clinic-tags">
                      <span className="price-tag">{clinic.priceCategory}</span>
                      {clinic.services && clinic.services.slice(0, 2).map((service, idx) => (
                        <span key={idx} className="service-tag">{service}</span>
                      ))}
                      {clinic.services && clinic.services.length > 2 && (
                        <span className="more-tag">+{clinic.services.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && clinicDetails && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>X</button>
            <div className="modal-image-container">
              <img src={clinicDetails.image} alt={clinicDetails.clinicName} />
            </div>
            <div className="modal-content">
              <h3>{clinicDetails.clinicName}</h3>
              <p className="modal-address">{clinicDetails.streetAddress}, {clinicDetails.province}</p>
              <div className="price-services-container">
                <span className="modal-price">{clinicDetails.priceCategory}</span>
                <div className="modal-services">
                  {clinicDetails.services && clinicDetails.services.slice(0, 3).map((service, idx) => (
                    <span key={idx}>{service}</span>
                  ))}
                </div>
              </div>
              <p className="clinic-short-description">
                {clinicDetails.clinicDescription && 
                  (clinicDetails.clinicDescription.length > 150 
                    ? clinicDetails.clinicDescription.substring(0, 150) + '...' 
                    : clinicDetails.clinicDescription)
                }
              </p>
              <div className="modal-actions">
                <button 
                  className="see-more-button"
                  onClick={() => viewClinicDetails(clinicDetails)}
                >
                  See More Details
                </button>
                <button 
                  className="book-now-button"
                  onClick={() => handleBookNow(clinicDetails)}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLoginPrompt && (
        <div className="modal-overlay">
          <div className="login-modal">
            <div className="modal-header">
              <h2>Login Required</h2>
              <button className="close-button" onClick={() => setShowLoginPrompt(false)}>×</button>
            </div>
            <div className="modal-body login-modal-body">
              <p>You need to be logged in to book an appointment.</p>
             
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FindClinicWithFooter = () => {
  return (
    <div className="page-container">
      <FindClinic />
      <Footer />
    </div>
  );
};

export default FindClinicWithFooter;