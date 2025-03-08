import React, { useEffect, useState } from "react";
import { FaTrash, FaCheck } from "react-icons/fa";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminSubscription.css";

const ClinicDashboard = () => {

  const [clinics, setClinics] = useState([]);
  const [displayClinics, setDisplayClinics] = useState("registersClinics"); // Default to review clinics
  const [searchTerm, setSearchTerm] = useState("");

  const [adminClinicApprovalModalIsOpen, setAdminClinicApprovalModalIsOpen] = useState(false);
  const [adminClinicRegistrationSuccessModalIsOpen, setAdminClinicRegistrationSuccessModalIsOpen] = useState(false);
  const [clinicToApprove, setClinicToApprove] = useState(null);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false);


  // fetching data
  const fetchClinics = async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const clinicsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClinics(clinicsData);
    } catch (error) {
      console.error(`Error fetching clinics from ${collectionName}: `, error);
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // for searching
  const filteredClinics = clinics.filter((clinic) => {
    if (!searchTerm) {
      return true; // Show all clinics if no search term
    }
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

  // approving the clinic
  const handleApproveClinic = async () => {
    if (!clinicToApprove) return;
    try {
      if (displayClinics === "registersClinics") {
        await setDoc(doc(db, "clinics", clinicToApprove.id), {
          ...clinicToApprove,
        });
        await deleteDoc(doc(db, "registersClinics", clinicToApprove.id));
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
  const handleDeleteClinic = async () => {
    if (!clinicToDelete) return;
    try {
      await deleteDoc(doc(db, "registersClinics", clinicToDelete.id));
      fetchClinics(displayClinics);
      setClinicToDelete(null);
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
            <th>Address</th>
            <th>Contact No.</th>
            <th>Email</th>
            <th>Clinic Owner</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>

          {filteredClinics.length > 0 ? (
            filteredClinics.map((clinic, index) => (
              <tr key={clinic.id}>
                <td>{index + 1}</td>
                <td>{clinic.clinicName}</td>
                <td>
                  {clinic.streetAddress}, {clinic.city}, {clinic.province},{" "}
                  {clinic.postalCode}
                </td>
                <td>{clinic.phone}</td>
                <td>{clinic.email}</td>
                <td>
                  {clinic.ownerFirstName} {clinic.ownerLastName}
                </td>
                <td>
                  <div className="actions">
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
                        className="icon-buttondelete"
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

          {/* {clinics.map((clinic, index) => (
            <tr key={clinic.id}>
              <td>{index + 1}</td>
              <td>{clinic.clinicName}</td>
              <td>{clinic.streetAddress}, {clinic.city}, {clinic.province}, {clinic.postalCode}</td>
              <td>{clinic.phone}</td>
              <td>{clinic.email}</td>
              <td>{clinic.ownerFirstName} {clinic.ownerLastName}</td>
              <td>
                <div className="actions">
                  <button className="icon-buttoncheck"><FaCheck /></button>
                  <button className="icon-buttondelete"><FaTrash /></button>
                </div>
              </td>
            </tr>
          ))} */}

        </tbody>
      </table>


      {/* Modals for Approve, Delete, Unsubscribe */}
      {/* Confirmation Modal */}
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
            <p>
              Are you sure you want to delete {clinicToDelete?.clinicName}?
            </p>
            <button onClick={handleDeleteClinic}>Yes, Delete</button>
            <button onClick={closeDeleteConfirmationModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDashboard;
