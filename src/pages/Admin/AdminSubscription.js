import React, { useEffect, useState } from "react";
import { FaTrash, FaCheck } from "react-icons/fa";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminSubscription.css";
//npm install emailjs-com
import emailjs from "emailjs-com"; 

const ClinicDashboard = () => {
  const [clinics, setClinics] = useState([]);
  const [displayClinics, setDisplayClinics] = useState("registersClinics"); // Default: Review Clinics
  const [searchTerm, setSearchTerm] = useState("");

  const [adminClinicApprovalModalIsOpen, setAdminClinicApprovalModalIsOpen] = useState(false);
  const [adminClinicRegistrationSuccessModalIsOpen, setAdminClinicRegistrationSuccessModalIsOpen] = useState(false);
  const [clinicToApprove, setClinicToApprove] = useState(null);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false);

  // Fetch clinic data
  const fetchClinics = async (collectionName) => {
    try {
      const clinicsSnapshot = await getDocs(collection(db, collectionName));
      const clinicsData = clinicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});
  
      const mergedData = clinicsData.map((clinic) => ({
        ...clinic,
        ...usersData[clinic.id],
      }));
  
      setClinics(mergedData);
    } catch (error) {
      console.error(`Error fetching clinics from ${collectionName}:`, error);
    }
  };
 
  useEffect(() => {
    fetchClinics(displayClinics);
  }, [displayClinics]);
  const handleAdminApproveClinicsButton = () => {
    setDisplayClinics("registersClinics");
    setSearchTerm("");
  };

  const handleAdminRegisteredClinicsButton = () => {
    setDisplayClinics("clinics");
    setSearchTerm("");
  };
  // Search Functionality
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  const filteredClinics = clinics.filter((clinic) => {
    if (!searchTerm) {
      return true; // Show all clinics if no search term
    }
    if (!searchTerm) return true;
    const searchFields = [
      clinic.clinicName,
      clinic.streetAddress,
      clinic.city,
      clinic.province,
      clinic.postalCode,
      clinic.phone,
      clinic.email,
      clinic.ownerFirstName,
      clinic.ownerLastName,
    ];

    return searchFields.some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  // Approve Clinic
  useEffect(() => {
    emailjs.init("59--iStzN3U4AfD9O");
  }, []);
  const handleApproveClinic = async () => {
    if (!clinicToApprove) return;
    try {
      if (displayClinics === "registersClinics") {
        const clinicData = {
          clinicName: clinicToApprove.clinicName,
          streetAddress: clinicToApprove.streetAddress,
          city: clinicToApprove.city,
          province: clinicToApprove.province,
          postalCode: clinicToApprove.postalCode,
          lat: clinicToApprove.lat,
          lng: clinicToApprove.lng,
          servicePrices: clinicToApprove.servicePrices,
          verificationDocs: clinicToApprove.verificationDocs,
          createdAt: clinicToApprove.createdAt,
          email:clinicToApprove.email,
        };
  
        const userData = {
          uid: clinicToApprove.id, // Store the uid
          clinicName: clinicToApprove.clinicName,
          FirstName: clinicToApprove.FirstName,
          LastName: clinicToApprove.LastName,
          email: clinicToApprove.email,
          contactNumber: clinicToApprove.contactNumber,
          Type: "Clinic", // Set type explicitly
          clinicRegistered: doc(db,`clinics/${clinicToApprove.id}`),
        };
  
        await Promise.all([
          setDoc(doc(db, "users", clinicToApprove.id), userData), // Save to users with limited fields
          setDoc(doc(db, "clinics", clinicToApprove.id), clinicData), // Save to clinics with all fields
        ]);
        await deleteDoc(doc(db, "registersClinics", clinicToApprove.id));

        // Send email notification using EmailJS
        const emailParams = {
          to_email: clinicToApprove.email, 
          clinic_name: clinicToApprove.clinicName,
          admin_email: "mareafurwell@gmail.com",
          logo_url: "https://furwell.vercel.app/images/furwell_logo.png", 
          company_name: "Furwell", 
          website_link: "https://furwell.vercel.app", 
          company_email: "mareafurwell@gmail.com", 
        };

        console.log("About to send email with params:", emailParams);
        
        await emailjs.send(
          "service_Furwell", // Service ID
          "template_qw84tt5", // Template ID 
          emailParams,
          "59--iStzN3U4AfD9O" // public API key 
        ).then(
          (response) => {
            console.log("Email sent successfully:", response.status, response.text);
          },
          (error) => {
            console.error("Failed to send email:", error);
          }
        );
      } else if (displayClinics === "clinics") {
        await setDoc(doc(db, "registersClinics", clinicToApprove.id), {
          ...clinicToApprove,
        });
        await deleteDoc(doc(db, "clinics", clinicToApprove.id));
      }
      fetchClinics(displayClinics);
      setAdminClinicRegistrationSuccessModalIsOpen(true);
      setAdminClinicApprovalModalIsOpen(false);
      setClinicToApprove(null);
    } catch (error) {
      console.error("Error approving/unsubscribing clinic:", error);
    }
  };

// for modals
const openAdminClinicApprovalModal = (clinic) => {
  setClinicToApprove(clinic);
  setAdminClinicApprovalModalIsOpen(true);
};

const closeAdminClinicApprovalModal = () => {
  setAdminClinicApprovalModalIsOpen(false);
  setClinicToApprove(null);
};

const closeAdminClinicRegistrationSuccessModal = () => {
  setAdminClinicRegistrationSuccessModalIsOpen(false);
};

const handleConfirmApproveClinic = (clinic) => {
  openAdminClinicApprovalModal(clinic);
};

const handleConfirmUnsubscribeClinic = (clinic) => {
  openAdminClinicApprovalModal(clinic);
};

// deleting the clinic in the review clinic part (ADMIN)
// Delete Clinic
const handleDeleteClinic = async () => {
  if (!clinicToDelete) return;
  try {
    await deleteDoc(doc(db, "registersClinics", clinicToDelete.id));
    fetchClinics(displayClinics);
    setClinicToDelete(null);
    setDeleteConfirmationModalOpen(false); 
    setDeleteConfirmationModalOpen(false);
  } catch (error) {
    console.error("Error deleting clinic:", error);
  }
};

const handleConfirmDeleteClinic = (clinic) => {
  setClinicToDelete(clinic);
  setDeleteConfirmationModalOpen(true); 
};

const closeDeleteConfirmationModal = () => {
  setDeleteConfirmationModalOpen(false);
  setClinicToDelete(null);
};

return (
  <div className="dashboard-container">
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {/* Filetered buttonsss */}
    
      <div className="button-container">
        <button
          className={`adminApproveClinicsButton ${displayClinics === "registersClinics" ? "active" : ""
            }`}
          onClick={handleAdminApproveClinicsButton}
        
        >
          Review Clinics
        </button>
        <button
          className={`adminRegisteredClinicsButton ${displayClinics === "clinics" ? "active" : ""
            }`}
          onClick={handleAdminRegisteredClinicsButton}
          
        >
          Registered Clinics
        </button>
      </div>
    </div>

      <table className="clinic-table">
        <thead>
          <tr>
            <th>Clinic No.</th>
            <th>Clinic Name</th>
            <th>Services</th>
            <th>Address</th>
            <th>Contact No.</th>
            <th>Email</th>
            <th>Clinic Owner</th>
            <th>Verification Docs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {filteredClinics.length > 0 ? (
          filteredClinics.map((clinic, index) => (
            <tr key={clinic.id}>
              <td>{index + 1}</td>
              <td>{clinic.clinicName}</td>
              <td>{clinic.servicePrices
                      ? Object.entries(clinic.servicePrices)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")
                      : "No services available"}
                  </td>
              <td>
                {clinic.streetAddress}, {clinic.city}, {clinic.province},{" "}
                {clinic.postalCode}
              </td>
              <td>{clinic.contactNumber}</td>
              <td>{clinic.email}</td>
              <td>
                {clinic.FirstName} {clinic.LastName}
              </td>
              <td>
                {clinic.verificationDocs && Object.keys(clinic.verificationDocs).length > 0 ? (
                  <>
                    {Object.values(clinic.verificationDocs).map((docUrl, index) => (
                      <div key={index}>
                        {docUrl ? (
                          <a href={docUrl} target="_blank" rel="noopener noreferrer">
                            {docUrl.length > 30 ? `${docUrl.substring(0, 30)}...` : docUrl}
                          </a>
                        ) : (
                          <span>No document available</span>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <span>No documents uploaded</span>
                  )}

                  </td>
                <td>
                  <div className="A-actions">
                    {displayClinics === "registersClinics" ? (
                      <>
                             <button
                          className="icon-buttoncheck"
                          onClick={() => handleConfirmApproveClinic(clinic)}
                        >
                          <FaCheck />
                        </button>
                        <button 
                          className="icon-buttondelete"
                          onClick={() => handleConfirmDeleteClinic(clinic)} 
                        >
                          <FaTrash />
                        </button>
                      </>
                    ) : (
                      <button 
                        className="icon-buttondelete-unsubscribe"
                        onClick={() => handleConfirmUnsubscribeClinic(clinic)}
                      >
                        Unsubscribe
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
             <td colSpan="7" style={{ textAlign: "center" }}>
                No search results found.
              </td>
            </tr>
          )}
         
        </tbody>
      </table>

      {/* Approve Modal */}
      {adminClinicApprovalModalIsOpen && (
        <div className="adminClinicApprovalModal-overlay">
          <div className="adminClinicApprovalModal">
            <h2>
              {displayClinics === "registersClinics" 
                ? "Confirm Clinic Registration"
                : "Confirm Clinic Unsubscription"}
            </h2>
            <p>
              Are you sure you want to{" "}
              {displayClinics === "registersClinics"
                ? "register"
                : "unsubscribe"}{" "}
              {clinicToApprove?.clinicName}?
            </p>
            <button onClick={handleApproveClinic}>Yes</button>
            <button onClick={closeAdminClinicApprovalModal}>Cancel</button>
          </div>
        </div>
      )}
        
           {/* Success Modal */}
      {adminClinicRegistrationSuccessModalIsOpen && (
        <div className="adminClinicRegistrationSuccessModal-overlay">
          <div className="adminClinicRegistrationSuccessModal">
            <h2>
              {displayClinics === "registersClinics" 
                ? "Clinic Registration Successful"
                : "Clinic Unsubscription Successful"}
            </h2>
            <p>
              Clinic has been successfully{" "}
              {displayClinics === "registersClinics"
                ? "registered"
                : "unsubscribed"}
              .
            </p>
            <button onClick={closeAdminClinicRegistrationSuccessModal}>OK</button>
           
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmationModalOpen && (
        <div className="adminClinicApprovalModal-overlay">
          <div className="adminClinicApprovalModal">
            <h2>Confirm Clinic Deletion</h2>
            <button onClick={handleDeleteClinic}>Yes, Delete</button>
            <button onClick={closeDeleteConfirmationModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDashboard;
