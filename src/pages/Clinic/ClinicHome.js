import React, { useState, useEffect } from "react";
import "./ClinicHome.css";
import { db, auth, secondaryAuth, createUserWithEmailAndPassword, signOut } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
//import { getAuth, signOut, initializeApp } from "firebase/auth"; // Removed createUserWithEmailAndPassword
import { FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Secondary Firebase app for user creation
//import firebaseConfig from "../../firebase"; // Assuming this is your config file
//const secondaryApp = initializeApp(firebaseConfig, "Secondary");
//const secondaryAuth = getAuth(secondaryApp);

const ClinicHome = () => {
  const [activePanel, setActivePanel] = useState("patients");
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [services, setServices] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [userFirstName, setUserFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showAddVetModal, setShowAddVetModal] = useState(false);
  const [newVet, setNewVet] = useState({
    FirstName: "",
    LastName: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [vetImage, setVetImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [addingVet, setAddingVet] = useState(false);
  const [addVetError, setAddVetError] = useState("");
  const [addVetSuccess, setAddVetSuccess] = useState(false);
  const [isEditingClinic, setIsEditingClinic] = useState(false);
  const [editedClinicInfo, setEditedClinicInfo] = useState(null);
  const [newClinicImage, setNewClinicImage] = useState(null);
  const [clinicImagePreview, setClinicImagePreview] = useState(null);
  const [isUpdatingClinic, setIsUpdatingClinic] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
  const [showVetInfoModal, setShowVetInfoModal] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_CLINIC_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleDateString();
    }
    if (typeof dateValue === "string") {
      try {
        return new Date(dateValue).toLocaleDateString();
      } catch (e) {
        return dateValue;
      }
    }
    return String(dateValue);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClinicImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewClinicImage(file);
      setClinicImagePreview(URL.createObjectURL(file));
      setShowClinicModal(true);
      setIsEditingClinic(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVet({ ...newVet, [name]: value });
  };

  const handleClinicInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClinicInfo({ ...editedClinicInfo, [name]: value });
  };

  const fetchUserFirstName = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserFirstName(userData.FirstName || "Unknown");
        } else {
          setUserFirstName("Unknown");
        }
      }
    } catch (error) {
      console.error("Error fetching user FirstName:", error);
      setUserFirstName("Unknown");
    }
  };

  const fetchClinicInfo = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        const clinicDoc = await getDoc(clinicRef);
        if (clinicDoc.exists()) {
          const clinicData = { id: clinicDoc.id, ...clinicDoc.data() };
          setClinicInfo(clinicData);
          setEditedClinicInfo(clinicData);
        } else {
          setClinicInfo({
            clinicName: `Clinic of ${userFirstName}`,
            profileImageURL: DEFAULT_CLINIC_IMAGE,
          });
          setEditedClinicInfo({
            clinicName: `Clinic of ${userFirstName}`,
            profileImageURL: DEFAULT_CLINIC_IMAGE,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching clinic info:", error);
      setClinicInfo({
        clinicName: `Clinic of ${userFirstName}`,
        profileImageURL: DEFAULT_CLINIC_IMAGE,
      });
      setEditedClinicInfo({
        clinicName: `Clinic of ${userFirstName}`,
        profileImageURL: DEFAULT_CLINIC_IMAGE,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVet = async (e) => {
    e.preventDefault();
    setAddingVet(true);
    setAddVetError("");
    setAddVetSuccess(false);

    try {
      const { FirstName, LastName, contactNumber, email, password, confirmPassword } = newVet;
      if (!FirstName || !LastName || !email || !password || !confirmPassword) {
        throw new Error("All fields are required");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in to add a veterinarian");

      let profileImageURL = DEFAULT_VET_IMAGE;
      if (vetImage && ["image/jpeg", "image/jpg", "image/png"].includes(vetImage.type)) {
        const image = new FormData();
        image.append("file", vetImage);
        image.append("cloud_name", "dfgnexrda");
        image.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
          {
            method: "post",
            body: image,
          }
        );

        if (!response.ok) throw new Error("Image upload failed");

        const imgData = await response.json();
        profileImageURL = imgData.url.toString();
      }

      // Use secondaryAuth which is imported from firebase.js
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const vetUid = userCredential.user.uid;

      // Sign out from secondary auth to clean up
      await signOut(secondaryAuth);

      // Reference to the clinic
      const clinicRef = doc(db, "clinics", currentUser.uid);

      // Create veterinarian document in Firestore
      await setDoc(doc(db, "users", vetUid), {
        uid: vetUid,
        FirstName,
        LastName,
        contactNumber,
        email,
        profileImageURL,
        Type: "Veterinarian",
        clinicRegistered: clinicRef,
        createdAt: serverTimestamp(),
      });

      setAddVetSuccess(true);
      setNewVet({
        FirstName: "",
        LastName: "",
        contactNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setVetImage(null);
      setImagePreview(null);
      fetchVeterinarians();
      setTimeout(() => {
        setShowAddVetModal(false);
        setAddVetSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding veterinarian:", error);
      if (error.code === "auth/email-already-in-use") {
        setAddVetError("This email is already registered");
      } else {
        setAddVetError(error.message || "Failed to add veterinarian");
      }
    } finally {
      setAddingVet(false);
    }
  };

  // ... rest of your component code remains the same ...

  const handleSaveClinicInfo = async () => {
    try {
      setIsUpdatingClinic(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        let profileImageURL = editedClinicInfo.profileImageURL;

        if (newClinicImage && ["image/jpeg", "image/jpg", "image/png"].includes(newClinicImage.type)) {
          const image = new FormData();
          image.append("file", newClinicImage);
          image.append("cloud_name", "dfgnexrda");
          image.append("upload_preset", UPLOAD_PRESET);

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
            {
              method: "post",
              body: image,
            }
          );

          if (!response.ok) throw new Error("Image upload failed");

          const imgData = await response.json();
          profileImageURL = imgData.url.toString();
        }

        await updateDoc(clinicRef, {
          clinicName: editedClinicInfo.clinicName,
          phone: editedClinicInfo.phone,
          streetAddress: editedClinicInfo.streetAddress,
          city: editedClinicInfo.city,
          profileImageURL,
        });

        setClinicInfo({ ...editedClinicInfo, profileImageURL });
        setNewClinicImage(null);
        setClinicImagePreview(null);
        setIsEditingClinic(false);
        setShowClinicModal(false);
      }
    } catch (error) {
      console.error("Error updating clinic info:", error);
    } finally {
      setIsUpdatingClinic(false);
    }
  };

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut(auth);
      setIsSignOutSuccessOpen(true);
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setIsSignOutConfirmOpen(false);
  };

  const fetchPatients = async () => {
    setLoading(false);
  };
  const fetchAppointments = async () => {};
  const fetchRecords = async () => {};
  const fetchServices = async () => {
    setServices([
      { id: "1", Type: "Vaccination", Price: 50, Description: "Annual vaccination" },
      { id: "2", Type: "Grooming", Price: 30, Description: "Full grooming service" },
    ]);
  };
  const fetchVeterinarians = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const vetsQuery = query(
          collection(db, "users"),
          where("Type", "==", "Veterinarian"),
          where("clinicRegistered", "==", doc(db, "clinics", currentUser.uid))
        );
        const querySnapshot = await getDocs(vetsQuery);
        const vetList = [];
        querySnapshot.forEach((doc) => {
          vetList.push({ id: doc.id, ...doc.data() });
        });
        setVeterinarians(vetList);
      }
    } catch (error) {
      console.error("Error fetching veterinarians:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVetNameClick = (vet) => {
    setSelectedVet(vet);
    setShowVetInfoModal(true);
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserFirstName();
      await fetchClinicInfo();
      fetchPatients();
      fetchAppointments();
      fetchRecords();
      fetchServices();
      fetchVeterinarians();
    };
    initializeData();
  }, [userFirstName]);

  return (
    <div className="clinic-container">
      <div className="sidebar_clinicHome">
        {clinicInfo && (
          <div className="clinic-sidebar-panel">
            <div className="clinic-img-container">
              <img
                src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                alt="Clinic Profile"
                className="clinic-profile-image"
              />
              <label htmlFor="clinic-image-upload" className="edit-icon">
                <FaCamera />
              </label>
              <input
                type="file"
                id="clinic-image-upload"
                accept="image/jpeg, image/jpg, image/png"
                onChange={handleClinicImageChange}
                style={{ display: "none" }}
              />
            </div>
            <button
              className={activePanel === "clinic" ? "active" : ""}
              onClick={() => setActivePanel("clinic")}
            >
              {clinicInfo.clinicName}
            </button>
          </div>
        )}
        <div className="sidebar-buttons">
          <button
            className={activePanel === "patients" ? "active" : ""}
            onClick={() => setActivePanel("patients")}
          >
            Patients
          </button>
          <button
            className={activePanel === "appointments" ? "active" : ""}
            onClick={() => setActivePanel("appointments")}
          >
            Appointments
          </button>
          <button
            className={activePanel === "records" ? "active" : ""}
            onClick={() => setActivePanel("records")}
          >
            Records
          </button>
          <button
            className={activePanel === "services" ? "active" : ""}
            onClick={() => setActivePanel("services")}
          >
            Services
          </button>
          <button
            className={activePanel === "veterinarians" ? "active" : ""}
            onClick={() => setActivePanel("veterinarians")}
          >
            Veterinarians
          </button>
        </div>
        <button className="signout-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="content">
        <div className="panel-container">
          {activePanel === "clinic" && clinicInfo && (
            <div className="panel clinic-panel">
              <h3>Clinic Information</h3>
              <div className="clinic-details">
                <img
                  src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                  alt="Clinic"
                  className="clinic-info-img"
                />
                <p><strong>Name:</strong> {clinicInfo.clinicName}</p>
                <p><strong>Phone:</strong> {clinicInfo.phone || "N/A"}</p>
                <p><strong>Address:</strong> {clinicInfo.streetAddress || "N/A"}, {clinicInfo.city || "N/A"}</p>
                <button
                  className="edit-clinic-btn"
                  onClick={() => {
                    setShowClinicModal(true);
                    setIsEditingClinic(true);
                  }}
                >
                  Edit Clinic Info
                </button>
              </div>
            </div>
          )}
          {activePanel === "patients" && (
            <div className="panel patients-panel">
              <h3>Patients</h3>
            </div>
          )}
          {activePanel === "appointments" && (
            <div className="panel appointments-panel">
              <h3>Appointments</h3>
            </div>
          )}
          {activePanel === "records" && (
            <div className="panel records-panel">
              <h3>Records</h3>
            </div>
          )}
          {activePanel === "services" && (
            <div className="panel services-panel">
              <h3>Services</h3>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? (
                    services.map((service) => (
                      <tr key={service.id}>
                        <td>{service.Type}</td>
                        <td>${service.Price}</td>
                        <td>{service.Description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No services found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activePanel === "veterinarians" && (
            <div className="panel veterinarians-panel">
              <h3>Veterinarians</h3>
              {loading ? (
                <p>Loading veterinarians...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veterinarians.length > 0 ? (
                      veterinarians.map((vet) => (
                        <tr key={vet.id}>
                          <td>
                            <span
                              className="vet-name-link"
                              onClick={() => handleVetNameClick(vet)}
                            >
                              {vet.FirstName} {vet.LastName}
                            </span>
                          </td>
                          <td>{vet.contactNumber || "N/A"}</td>
                          <td>{vet.email}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">No veterinarians found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              <button className="add-vet-btn" onClick={() => setShowAddVetModal(true)}>
                Add Veterinarian
              </button>
            </div>
          )}
        </div>
      </div>

      {showClinicModal && clinicInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span
              className="close-button"
              onClick={() => {
                setShowClinicModal(false);
                setIsEditingClinic(false);
              }}
            >
              ×
            </span>
            {isEditingClinic ? (
              <>
                <h2>Edit Clinic Information</h2>
                <div className="vet-image-upload-container">
                  <label
                    htmlFor="clinic-image-upload-modal"
                    className="vet-image-upload"
                    style={
                      clinicImagePreview
                        ? { backgroundImage: `url(${clinicImagePreview})` }
                        : { backgroundImage: `url(${editedClinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE})` }
                    }
                  >
                    {!clinicImagePreview && !editedClinicInfo.profileImageURL && (
                      <>
                        <FaCamera className="camera-icon" />
                        <p>Upload Clinic Photo</p>
                      </>
                    )}
                    <input
                      type="file"
                      id="clinic-image-upload-modal"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleClinicImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="clinicName">Clinic Name</label>
                  <input
                    type="text"
                    id="clinicName"
                    name="clinicName"
                    value={editedClinicInfo.clinicName || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={editedClinicInfo.phone || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="streetAddress">Street Address</label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={editedClinicInfo.streetAddress || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={editedClinicInfo.city || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="submit-btn"
                    onClick={handleSaveClinicInfo}
                    disabled={isUpdatingClinic}
                  >
                    {isUpdatingClinic ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowClinicModal(false);
                      setIsEditingClinic(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                  alt="Clinic"
                  className="clinic-info-img"
                />
                <h2>{clinicInfo.clinicName}</h2>
                <p>
                  <strong>Phone:</strong> {clinicInfo.phone || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {clinicInfo.streetAddress || "N/A"},{" "}
                  {clinicInfo.city || "N/A"}
                </p>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowClinicModal(false)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAddVetModal && (
        <div className="modal-overlay">
          <div className="modal-content add-vet-modal">
            <span
              className="close-button"
              onClick={() => setShowAddVetModal(false)}
            >
              ×
            </span>
            <h2>Add New Veterinarian</h2>
            {addVetSuccess && (
              <div className="success-message">
                Veterinarian added successfully!
              </div>
            )}
            {addVetError && <div className="error-message">{addVetError}</div>}
            <form onSubmit={handleAddVet}>
              <div className="vet-image-upload-container">
                <label
                  htmlFor="vet-image-upload"
                  className="vet-image-upload"
                  style={
                    imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}
                  }
                >
                  {!imagePreview && (
                    <>
                      <FaCamera className="camera-icon" />
                      <p>Upload Profile Photo</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="vet-image-upload"
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="FirstName">First Name *</label>
                <input
                  type="text"
                  id="FirstName"
                  name="FirstName"
                  value={newVet.FirstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="LastName">Last Name *</label>
                <input
                  type="text"
                  id="LastName"
                  name="LastName"
                  value={newVet.LastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  value={newVet.contactNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newVet.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newVet.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={newVet.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddVetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={addingVet}
                >
                  {addingVet ? "Adding..." : "Add Veterinarian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSignOutConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Are you sure you want to sign out?</p>
            <div className="form-actions">
              <button className="submit-btn" onClick={confirmSignOut}>
                Yes
              </button>
              <button
                className="cancel-btn"
                onClick={() => setIsSignOutConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSignOutSuccessOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Signed out successfully!</p>
            <button
              className="modal-close-btn"
              onClick={() => {
                setIsSignOutSuccessOpen(false);
                navigate("/Home");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showVetInfoModal && selectedVet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span
              className="close-button"
              onClick={() => setShowVetInfoModal(false)}
            >
              ×
            </span>
            <img
              src={selectedVet.profileImageURL || DEFAULT_VET_IMAGE}
              alt="Veterinarian"
              className="vet-info-img"
            />
            <h2>{`${selectedVet.FirstName} ${selectedVet.LastName}`}</h2>
            <p><strong>First Name:</strong> {selectedVet.FirstName}</p>
            <p><strong>Last Name:</strong> {selectedVet.LastName}</p>
            <p><strong>Contact Number:</strong> {selectedVet.contactNumber || "N/A"}</p>
            <p><strong>Email:</strong> {selectedVet.email}</p>
            <button
              className="modal-close-btn"
              onClick={() => setShowVetInfoModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicHome;