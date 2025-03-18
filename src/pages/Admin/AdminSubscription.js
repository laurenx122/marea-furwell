import React, { useEffect, useState } from "react";
import { FaTrash, FaCheck } from "react-icons/fa";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminSubscription.css";

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
      const querySnapshot = await getDocs(collection(db, collectionName));
      const clinicsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClinics(clinicsData);
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
  // Approve Clinic
  const handleApproveClinic = async () => {
    if (!clinicToApprove) return;
    try {
      if (displayClinics === "registersClinics") {
        const userData = {
          FirstName: clinicToApprove.ownerFirstName,
          LastName: clinicToApprove.ownerLastName,
          Type: "Clinic",
          contactNumber: clinicToApprove.phone,
          uid: clinicToApprove.id,
          email: clinicToApprove.email,
          profileImageURL: "default_profile_image_url", // Add default profile image URL
          clinicRegistered: doc(db, "clinics", clinicToApprove.id),
        };

        const clinicData = {
          city: clinicToApprove.city,
          clinicName: clinicToApprove.clinicName,
          createdAt: clinicToApprove.createdAt,
          // email: clinicToApprove.email,
          id: clinicToApprove.id,
          lat: clinicToApprove.lat,
          lng: clinicToApprove.lng,
          // ownerFirstName: clinicToApprove.ownerFirstName,
          // ownerLastName: clinicToApprove.ownerLastName,
          phone: clinicToApprove.phone,
          postalCode: clinicToApprove.postalCode,
          province: clinicToApprove.province,
          services: clinicToApprove.services,
          streetAddress: clinicToApprove.streetAddress,
          verificationDocs: clinicToApprove.verificationDocs || null,
        };
        console.log("Clinic to approve (registersClinics):", clinicToApprove);
        console.log("User data to save:", userData);
        console.log("Clinic data to save:", clinicData);

        // await Promise.all([
        //   setDoc(doc(db, "users", clinicToApprove.id), userData),
        //   setDoc(doc(db, "clinics", clinicToApprove.id), clinicData),
        //   deleteDoc(doc(db, "registersClinics", clinicToApprove.id)),
        // ]);

        // Save clinic data first
        await setDoc(doc(db, "clinics", clinicToApprove.id), clinicData);

        // Reference clinic in user data
        await setDoc(doc(db, "users", clinicToApprove.id), userData);

        // Delete from registersClinics
        await deleteDoc(doc(db, "registersClinics", clinicToApprove.id));

        console.log("Clinic approved and data saved successfully.");

        // const clinicData = {
        //   ...clinicToApprove,
        //   Type: "Clinic", // Set type explicitly
        //   // Status: "approved", // Mark as approved
        // };

        // await Promise.all([
        //   // setDoc(doc(db, "users", clinicToApprove.id), clinicData), // Save to users with type "Clinic"
        //   setDoc(doc(db, "clinics", clinicToApprove.id), clinicData), // Save to clinics
        // ]);
        // await deleteDoc(doc(db, "registersClinics", clinicToApprove.id));
      } else if
        (displayClinics === "clinics") {
        const clinicId = clinicToApprove.id;

        // Fetch data from clinics and users
        const clinicDoc = await getDocs(doc(db, "clinics", clinicId));
        const userDoc = await getDocs(doc(db, "users", clinicId));

        if (clinicDoc.exists() && userDoc.exists()) {
          const clinicData = clinicDoc.data();
          const userData = userDoc.data();

          // Save combined data to registersClinics
          await setDoc(doc(db, "registersClinics", clinicId), clinicData);

          // Update user data to reflect unsubscription
          const updatedUserData = {
            ...userData,
            clinicRegistered: null,
          };

          await setDoc(doc(db, "users", clinicId), updatedUserData);

          // Delete from clinics and users
          await Promise.all([
            deleteDoc(doc(db, "clinics", clinicId)),
            deleteDoc(doc(db, "users", clinicId)),
          ]);

          console.log("Clinic unsubscribed and data moved successfully.");
        } else {
          console.error("Clinic or user data not found.");
        }
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
                <td>{clinic.services}</td>
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
