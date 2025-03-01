import React, { useState } from 'react';
import './FindClinic.css';
import { useNavigate } from 'react-router-dom';

const FindClinic = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedSort, setSelectedSort] = useState('Relevance');
  const [selectedClinic, setSelectedClinic] = useState(null);

  const [clinics, setClinics] = useState([
    {
      id: 1,
      name: 'Furwell Clinic',
      location: 'Cebu City',
      services: ['Consultation', 'Ultrasound'],
      price: '₱₱',
      image: 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp', // Replace with actual image URL
    },
    {
      id: 2,
      name: 'PetCare Clinic',
      location: 'Mandaue',
      services: ['X-Ray', 'Emergency Care'],
      price: '₱₱₱',
      image: 'dhttps://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp', // Replace with actual image URL
    },
    {
      id: 3,
      name: 'Paws & Claws',
      location: 'Cebu City',
      services: ['Endoscopy', 'Consultation'],
      price: '₱₱₱',
      image: 'https://sharpsheets.io/wp-content/uploads/2023/11/veterinary-clinic.jpg.webp', // Replace with actual image URL
    }
  ]);

  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClinicClick = (clinicId) => {
    setSelectedClinic(clinicId);
    navigate(`/clinic/${clinicId}`);
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

  const filteredClinics = clinics.filter(clinic => {
    return (
      (clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) || clinic.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedService.length ? selectedService.every(service => clinic.services.includes(service)) : true) &&
      (selectedPrice ? clinic.price === selectedPrice : true)
    );
  });

  return (
    <div className="find-clinic-container">
      {/* Search Bar outside of the filter */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Clinics"
        />
        <button onClick={() => alert("Search clicked!")}>Search</button>
      </div>

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
          <label>
            <input
              type="checkbox"
              value="Emergency Consultation"
              checked={selectedService.includes('Emergency Consultation')}
              onChange={handleServiceChange}
            />
            Emergency Consultation
          </label>
          <label>
            <input
              type="checkbox"
              value="X-ray Profiles"
              checked={selectedService.includes('X-ray Profiles')}
              onChange={handleServiceChange}
            />
            X-ray Profiles
          </label>
          <label>
            <input
              type="checkbox"
              value="Endoscopy"
              checked={selectedService.includes('Endoscopy')}
              onChange={handleServiceChange}
            />
            Endoscopy
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

      <div className="clinic-list">
        {filteredClinics.length === 0 ? (
          <p>No clinics found. Try a different search or filter.</p>
        ) : (
          filteredClinics.map(clinic => (
            <div
              key={clinic.id}
              className={`clinic-card ${selectedClinic === clinic.id ? 'selected' : ''}`}
              onClick={() => handleClinicClick(clinic.id)}
            >
              <img src={clinic.image} alt={clinic.name} />
              <h3>{clinic.name}</h3>
              <p>{clinic.location}</p>
              <ul>
                {clinic.services.map(service => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              <p className="price">Price: {clinic.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindClinic;
