import React, { useState, useEffect } from "react";
import "./AdminHome.css";
import { Search } from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaTimes } from "react-icons/fa";

const AdminHome = () => {
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]); // State for filtered clinics
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  useEffect(() => {
    const fetchClinicsAndUsers = async () => {
      try {
        // Fetch clinics (using Firestore document IDs as uids)
        const clinicsSnapshot = await getDocs(collection(db, "clinics"));
        const clinicList = clinicsSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Transform servicePrices object into an array of { name, price } objects
          const servicesArray = data.servicePrices
            ? Object.entries(data.servicePrices).map(([name, price]) => ({
                name,
                price,
              }))
            : [];
          return {
            uid: doc.id,
            ...data,
            services: servicesArray,
          };
        });

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Log userList to debug clinicRegistered values
        console.log("Users:", userList);

        // Combine clinic and user data
        const combinedData = clinicList.map((clinic) => {
          const associatedUser = userList.find((user) => {
            let clinicId;
            if (user.clinicRegistered && typeof user.clinicRegistered === "string") {
              clinicId = user.clinicRegistered.split("/clinics/")[1] || user.clinicRegistered;
            } else if (user.clinicRegistered && user.clinicRegistered.id) {
              clinicId = user.clinicRegistered.id;
            } else {
              return false;
            }
            return clinicId === clinic.uid;
          });

          return {
            ...clinic,
            email: associatedUser ? associatedUser.email : "Not provided",
            contactNumber: associatedUser ? associatedUser.contactNumber : "Not provided",
          };
        });

        setClinics(combinedData);
        setFilteredClinics(combinedData); // Initialize filteredClinics with all clinics
      } catch (error) {
        console.error("Error fetching clinics and users:", error);
      }
    };

    fetchClinicsAndUsers();
  }, []);

  // Handle search input changes and filter clinics
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (!term.trim()) {
      setFilteredClinics(clinics); // If search term is empty, show all clinics
      return;
    }

    const lowerCaseTerm = term.toLowerCase();
    const filtered = clinics.filter((clinic) => {
      // Construct the full address from streetAddress, city, and province
      const fullAddress = [
        clinic.streetAddress,
        clinic.city,
        clinic.province,
      ]
        .filter(Boolean) // Remove undefined/null values
        .join(", ")
        .toLowerCase();

      // Check if the search term matches the clinic name or address
      return (
        clinic.clinicName?.toLowerCase().includes(lowerCaseTerm) ||
        fullAddress.includes(lowerCaseTerm)
      );
    });

    setFilteredClinics(filtered);
  };

  // Function to open the modal with the selected clinic's details
  const openModal = (clinic) => {
    setSelectedClinic(clinic);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setSelectedClinic(null);
    setIsModalOpen(false);
  };

  return (
    <div className="admin-home-container">
      {/* Search Bar */}
      <div className="search-container-a">
        <input
          type="text"
          placeholder="Search by clinic name or address"
          className="search-input"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {/* <Search className="search-icon" /> */}
      </div>

      {/* Clinic Grid */}
      <div className="clinics-grid-admin">
        {filteredClinics.length > 0 ? (
          filteredClinics.map((clinic) => (
            <div
              key={clinic.uid}
              className="clinics-card-con"
              onClick={() => openModal(clinic)}
            >
              <img
                src={clinic.profileImageURL || "images/veterinarian.jpg"}
                alt={`${clinic.clinicName} image`}
                className="clinic-image"
              />
              <p className="clinic-name">{clinic.clinicName}</p>
              <p className="clinic-location">
                {clinic.province || "Location not provided"}
              </p>
            </div>
          ))
        ) : (
          <p>No clinics found matching your search.</p>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedClinic && (
        <div className="modal-overlay-admin">
          <div className="modal-admin">
            <img
              src={selectedClinic.profileImageURL || "images/veterinarian.jpg"}
              alt={`${selectedClinic.clinicName} profile`}
              className="modal-profile-image"
            />
            <div className="modal-header">
              <h2>{selectedClinic.clinicName}</h2>
              <p className="modal-location">
                {selectedClinic.streetAddress && selectedClinic.city
                  ? `${selectedClinic.streetAddress}, ${selectedClinic.city}`
                  : selectedClinic.province || "Location not provided"}
              </p>
            </div>
            <div className="modal-description">
              <p>{selectedClinic.clinicDescription || "Not provided"}</p>
            </div>
            <div className="modal-section-admin">
              <h3>Services</h3>
              <div className="modal-services-admin">
                {selectedClinic.services?.length > 0 ? (
                  selectedClinic.services.map((service, idx) => (
                    <div key={idx} className="service-button-wrapper">
                      <button className="service-button-a">
                        {service.name}
                        <span className="service-price-a"> - ${service.price}</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No services available</p>
                )}
              </div>
            </div>
            <div className="modal-section-contact-a">
              <h3>Contact Information</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Phone:</strong>
                  <p>{selectedClinic.contactNumber || "Not Available"}</p>
                </div>
                <div className="contact-item">
                  <strong>Email:</strong>
                  <p>{selectedClinic.email || "Not Available"}</p>
                </div>
              </div>
            </div>
            <button
              className="close-icon-button"
              onClick={closeModal}
              aria-label="Close modal"
            >
              <FaTimes className="close-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;