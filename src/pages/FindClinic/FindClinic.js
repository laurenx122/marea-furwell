import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Import Firestore from firebase.js
import { collection, getDocs } from 'firebase/firestore'; // Firestore functions
import './FindClinic.css';
import Footer from '../../components/Footer/Footer'; // Import Footer component

const FindClinic = () => {
  const [clinics, setClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedSort, setSelectedSort] = useState('Relevance');
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [clinicDetails, setClinicDetails] = useState(null); // To store selected clinic's details

  // Function to categorize the price into ₱, ₱₱, and ₱₱₱
  const categorizePrice = (price) => {
    if (price < 800) return '₱';
    if (price >= 800 && price <= 1400) return '₱₱';
    return '₱₱₱';
  };

  // Fetch clinics from Firestore
  const fetchClinics = async () => {
    try {
      const clinicSnapshot = await getDocs(collection(db, "clinics"));  // Fetch from the 'clinics' collection
      const clinicList = clinicSnapshot.docs.map(doc => ({
        id: doc.id,
        clinicName: doc.data().clinicName,
        streetAddress: doc.data().streetAddress,
        city: doc.data().province,  // Using `province` as city
        price: doc.data().price,
        priceCategory: categorizePrice(doc.data().price), // Categorize the price
        services: doc.data().services,
        image: doc.data().imgURL || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp',  // Use imgURL if present
      }));
      setClinics(clinicList);  // Update state with fetched clinics
    } catch (error) {
      console.error("Error fetching clinic data: ", error);
    }
  };

  useEffect(() => {
    fetchClinics();  // Fetch data on component mount
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClinicClick = (clinic) => {
    setClinicDetails(clinic); // Set the selected clinic details
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close the modal
    setClinicDetails(null); // Clear the clinic details
  };

  const handleServiceChange = (e) => {
    const { value } = e.target;
    setSelectedService(prev =>
      prev.includes(value) ? prev.filter(service => service !== value) : [...prev, value]
    );
  };

  const handlePriceChange = (price) => {
    setSelectedPrice(price);
  };

  const handleSortChange = (e) => {
    setSelectedSort(e.target.value);
  };

  // Filtering the clinics based on the search, services, and price selected
  const filteredClinics = clinics.filter(clinic => {
    return (
      (clinic.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) || clinic.city.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedService.length ? selectedService.every(service => clinic.services && clinic.services.includes(service)) : true) &&
      (selectedPrice ? clinic.priceCategory === selectedPrice : true)
    );
  });

  return (
    <div className="find-clinic-container">
      {/* Search Bar */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Clinics"
        />
        <button onClick={() => alert("Search clicked!")}>Search</button>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <h2>Filters</h2>
        {/* Sort By Radio Buttons */}
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
              value="Lorem Ipsum"
              checked={selectedSort === 'Lorem Ipsum'}
              onChange={handleSortChange}
            />
            Lorem Ipsum
          </label>
        </div>

        {/* Quick Filter */}
        <div className="quick-filter">
          <button>Nearby Clinics</button>
        </div>

        {/* Services Filter with checkboxes */}
        <div className="filter">
          <p>Services:</p>
          <label>
            <input
              type="checkbox"
              value="Vaccination"
              checked={selectedService.includes('Vaccination')}
              onChange={handleServiceChange}
            />
            Vaccination
          </label>
          <label>
            <input
              type="checkbox"
              value="Pet Surgery"
              checked={selectedService.includes('Pet Surgery')}
              onChange={handleServiceChange}
            />
            Pet Surgery
          </label>
          <label>
            <input
              type="checkbox"
              value="Consultation"
              checked={selectedService.includes('Consultation')}
              onChange={handleServiceChange}
            />
            Consultation
          </label>
          <label>
            <input
              type="checkbox"
              value="Ultrasound"
              checked={selectedService.includes('Ultrasound')}
              onChange={handleServiceChange}
            />
            Ultrasound
          </label>
        </div>

        {/* Price Filter */}
        <div className="filter">
          <p>Price:</p>
          <button className={selectedPrice === '₱' ? 'selected' : ''} onClick={() => handlePriceChange('₱')}>₱</button>
          <button className={selectedPrice === '₱₱' ? 'selected' : ''} onClick={() => handlePriceChange('₱₱')}>₱₱</button>
          <button className={selectedPrice === '₱₱₱' ? 'selected' : ''} onClick={() => handlePriceChange('₱₱₱')}>₱₱₱</button>
        </div>
      </div>

      {/* Clinic List */}
      <div className="clinic-list">
        {filteredClinics.length === 0 ? (
          <p>No clinics found. Try a different search or filter.</p>
        ) : (
          filteredClinics.map(clinic => (
            <div
              key={clinic.id}
              className={`clinic-card ${selectedClinic === clinic.id ? 'selected' : ''}`}
              onClick={() => handleClinicClick(clinic)}
            >
              <img src={clinic.image || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp'} alt={clinic.clinicName} />
              <h3>{clinic.clinicName}</h3>
              <p>{clinic.streetAddress}, {clinic.city}</p> {/* Display streetAddress first */}
              <p className="price">Price: {clinic.price}</p>
            </div>
          ))
        )}
      </div>

      {/* Modal to show clinic details */}
      {isModalOpen && clinicDetails && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-modal" onClick={closeModal}>X</button>
            <h3>{clinicDetails.clinicName}</h3>
            <p>{clinicDetails.streetAddress}, {clinicDetails.city}</p> {/* Display streetAddress first */}
            <img src={clinicDetails.image || 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp'} alt={clinicDetails.clinicName} />
            <ul>
              {clinicDetails.services && clinicDetails.services.map(service => (
                <li key={service}>{service}</li>
              ))}
            </ul>
            <p className="price">Price: {clinicDetails.price}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Footer placed outside the FindClinic container
const FindClinicWithFooter = () => {
  return (
    <div>
      <FindClinic />
      <Footer />
    </div>
  );
};

export default FindClinicWithFooter;
