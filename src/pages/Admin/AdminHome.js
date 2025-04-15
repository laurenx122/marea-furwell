import React, { useState, useEffect } from "react";
import "./AdminHome.css";
import { Search } from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaTimes } from "react-icons/fa"; // Import FaTimes for the close icon

const AdminHome = () => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null); // State for the selected clinic
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clinics"));
        const clinicList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClinics(clinicList);
      } catch (error) {
        console.error("Error fetching clinics:", error);
      }
    };

    fetchClinics();
  }, []);

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
        <input type="text" placeholder="Search" className="search-input" />
        <Search className="search-icon" />
      </div>

      {/* Clinic Grid */}
      <div className="clinics-grid-admin">
        
        {clinics.map((clinic) => (
          <div
            key={clinic.id}
            className="clinics-card-con"
            onClick={() => openModal(clinic)}
          >
            <div className="clinic-image" />
            <p className="clinic-name">{clinic.clinicName}</p>
            <p className="clinic-location">{clinic.location || "Location not provided"}</p>
            <div className="clinic-services">
              {clinic.services?.slice(0, 2).map((service, idx) => (
                <button key={idx} className="service-button">
                  {service}
                </button>
              ))}
              {clinic.services?.length > 2 && (
                <button className="more-button">+{clinic.services.length - 2} MORE</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedClinic && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedClinic.clinicName}</h2>
            <p><strong>Location:</strong> {selectedClinic.location || "Not provided"}</p>
            <p><strong>Contact:</strong> {selectedClinic.contact || "Not provided"}</p>
            <p><strong>Services:</strong></p>
            <div className="modal-services">
              {selectedClinic.services?.map((service, idx) => (
                <button key={idx} className="service-button">
                  {service}
                </button>
              ))}
            </div>
            <button className="close-icon-button" onClick={closeModal} aria-label="Close modal">
              <FaTimes className="close-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;