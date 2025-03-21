import React, { useState, useEffect } from "react";
import "./PetOwnerHome.css";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { FaCamera } from "react-icons/fa";

const PetOwnerHome = () => {
  const [activePanel, setActivePanel] = useState("petDetails");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [newPet, setNewPet] = useState({
    petName: "",
    Breed: "",
    Color: "",
    Species: "",
    Gender: "",
    Weight: "",
    dateofBirth: "",
  });
  const [addingPet, setAddingPet] = useState(false);
  const [addPetError, setAddPetError] = useState("");
  const [addPetSuccess, setAddPetSuccess] = useState(false);
  const [petImage, setPetImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newPetImage, setNewPetImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [newOwnerImage, setNewOwnerImage] = useState(null);
  const [ownerImagePreview, setOwnerImagePreview] = useState(null);
  const [editedOwnerInfo, setEditedOwnerInfo] = useState(null);

  const UPLOAD_PRESET = "furwell";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_OWNER_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (typeof dateValue === "string") {
      try {
        return new Date(dateValue).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      } catch (e) {
        return dateValue;
      }
    }
    return String(dateValue);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleModalImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPetImage(file);
      setNewImagePreview(URL.createObjectURL(file));
      setIsEditingImage(true);
      setImageUploadError("");
    }
  };

  const handleOwnerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewOwnerImage(file);
      setOwnerImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSavePetImage = async () => {
    if (!newPetImage || !selectedPet) {
      setShowModal(false);
      return;
    }

    setIsSavingImage(true);
    setImageUploadError("");

    try {
      const image = new FormData();
      image.append("file", newPetImage);
      image.append("cloud_name", "dfgnexrda");
      image.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
        { method: "post", body: image }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const imgData = await response.json();
      const newImageURL = imgData.url.toString();

      const petRef = doc(db, "pets", selectedPet.id);
      await updateDoc(petRef, { petImageURL: newImageURL });

      setSelectedPet({ ...selectedPet, petImageURL: newImageURL });
      setPets(pets.map((p) => (p.id === selectedPet.id ? { ...p, petImageURL: newImageURL } : p)));

      setIsEditingImage(false);
      setNewPetImage(null);
      setNewImagePreview(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error uploading pet image:", error);
      setImageUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPet({
      ...newPet,
      [name]: name === "Weight" ? (value === "" ? "" : parseFloat(value)) : value,
    });
  };

  const handleOwnerInputChange = (e) => {
    const { name, value } = e.target;
    setEditedOwnerInfo({ ...editedOwnerInfo, [name]: value });
  };

  const handleAddPet = async (e) => {
    e.preventDefault();
    setAddingPet(true);
    setAddPetError("");
    setAddPetSuccess(false);

    try {
      if (!newPet.petName || !newPet.Species || !newPet.Gender) {
        throw new Error("Pet name, species, and gender are required");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in to add a pet");

      let petImageURL = DEFAULT_PET_IMAGE;
      if (petImage && ["image/jpeg", "image/jpg", "image/png"].includes(petImage.type)) {
        const image = new FormData();
        image.append("file", petImage);
        image.append("cloud_name", "dfgnexrda");
        image.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
          { method: "post", body: image }
        );

        if (!response.ok) throw new Error("Image upload failed");

        const imgData = await response.json();
        petImageURL = imgData.url.toString();
      }

      const ownerRef = doc(db, "users", currentUser.uid);
      const petDoc = await addDoc(collection(db, "pets"), {
        ...newPet,
        petImageURL,
        owner: ownerRef,
        createdAt: serverTimestamp(),
      });

      setAddPetSuccess(true);
      setNewPet({
        petName: "",
        Breed: "",
        Color: "",
        Species: "",
        Gender: "",
        Weight: "",
        dateofBirth: "",
      });
      setPetImage(null);
      setImagePreview(null);
      fetchPets();
      setTimeout(() => {
        setShowAddPetModal(false);
        setAddPetSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding pet:", error);
      setAddPetError(error.message);
    } finally {
      setAddingPet(false);
    }
  };

  const handleSaveOwnerProfile = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const ownerRef = doc(db, "users", currentUser.uid);
        let profileImageURL = editedOwnerInfo.profileImageURL;

        if (newOwnerImage) {
          const image = new FormData();
          image.append("file", newOwnerImage);
          image.append("cloud_name", "dfgnexrda");
          image.append("upload_preset", UPLOAD_PRESET);

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
            { method: "post", body: image }
          );

          if (!response.ok) throw new Error("Image upload failed");

          const imgData = await response.json();
          profileImageURL = imgData.url.toString();
        }

        await updateDoc(ownerRef, {
          FirstName: editedOwnerInfo.FirstName,
          LastName: editedOwnerInfo.LastName,
          contactNumber: editedOwnerInfo.contactNumber,
          profileImageURL,
        });

        setOwnerInfo({ ...editedOwnerInfo, profileImageURL });
        setNewOwnerImage(null);
        setOwnerImagePreview(null);
        setShowEditOwnerModal(false);
      }
    } catch (error) {
      console.error("Error updating owner profile:", error);
      setImageUploadError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPets = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const petsQuery = query(
          collection(db, "pets"),
          where("owner", "==", doc(db, "users", currentUser.uid))
        );
        const querySnapshot = await getDocs(petsQuery);
        const petsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPets(petsList);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("owner", "==", doc(db, "users", currentUser.uid))
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const appointmentsList = [];
  
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const clinicDoc = await getDoc(data.clinic);
          appointmentsList.push({
            id: doc.id,
            petName: data.petName || "Unknown Pet",
            clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
            serviceType: data.serviceType || "N/A",
            veterinarian: data.veterinarian || "N/A",
            dateofAppointment: data.dateofAppointment,
          });
        }
  
        // Sort appointments by dateofAppointment in ascending order
        appointmentsList.sort((a, b) => {
          const dateA = a.dateofAppointment && typeof a.dateofAppointment.toDate === "function"
            ? a.dateofAppointment.toDate()
            : new Date(a.dateofAppointment || 0);
          const dateB = b.dateofAppointment && typeof b.dateofAppointment.toDate === "function"
            ? b.dateofAppointment.toDate()
            : new Date(b.dateofAppointment || 0);

          return dateA - dateB;
        });
  
        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchOwnerInfo = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const ownerRef = doc(db, "users", currentUser.uid);
        const ownerDoc = await getDoc(ownerRef);
        if (ownerDoc.exists()) {
          const ownerData = ownerDoc.data();
          setOwnerInfo({
            FirstName: ownerData.FirstName || "Unknown",
            LastName: ownerData.LastName || "",
            contactNumber: ownerData.contactNumber || "",
            email: currentUser.email,
            profileImageURL: ownerData.profileImageURL || DEFAULT_OWNER_IMAGE,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching owner info:", error);
    }
  };

  useEffect(() => {
    fetchOwnerInfo();
    fetchPets();
    fetchAppointments();
  }, []);

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    setShowModal(true);
    setIsEditingImage(false);
    setNewPetImage(null);
    setNewImagePreview(null);
    setImageUploadError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPet(null);
    setIsEditingImage(false);
    setNewPetImage(null);
    setNewImagePreview(null);
    setImageUploadError("");
  };

  const openAddPetModal = () => setShowAddPetModal(true);
  const closeAddPetModal = () => {
    setShowAddPetModal(false);
    setNewPet({
      petName: "",
      Breed: "",
      Color: "",
      Species: "",
      Gender: "",
      Weight: "",
      dateofBirth: "",
    });
    setPetImage(null);
    setImagePreview(null);
    setAddPetError("");
    setAddPetSuccess(false);
  };

  const openEditOwnerModal = () => {
    setEditedOwnerInfo({ ...ownerInfo });
    setShowEditOwnerModal(true);
    setNewOwnerImage(null);
    setOwnerImagePreview(null);
    setImageUploadError("");
  };

  const closeEditOwnerModal = () => {
    setShowEditOwnerModal(false);
    setNewOwnerImage(null);
    setOwnerImagePreview(null);
    setImageUploadError("");
  };

  return (
    <div className="pet-owner-container">
      <div className="sidebar">
        {ownerInfo && (
          <div className="owner-sidebar-panel">
            <div className="owner-img-container">
              <img
                src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                alt="Owner Profile"
                className="owner-profile-image"
              />
            </div>
            <button
              className={activePanel === "profile" ? "active" : ""}
              onClick={() => setActivePanel("profile")}
            >
              {ownerInfo.FirstName} {ownerInfo.LastName}
            </button>
          </div>
        )}
        <div className="sidebar-buttons">
          <button
            className={activePanel === "petDetails" ? "active" : ""}
            onClick={() => setActivePanel("petDetails")}
          >
            Pet Details
          </button>
          <button
            className={activePanel === "appointments" ? "active" : ""}
            onClick={() => setActivePanel("appointments")}
          >
            Appointments
          </button>
        </div>
      </div>

      <div className="content">
        <div className="panel-container">
          {activePanel === "profile" && ownerInfo && (
            <div className="panel profile-panel">
              <h3>Profile</h3>
              <div className="owner-details">
                <img
                  src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                  alt="Owner"
                  className="owner-info-img"
                />
                <p><strong>First Name:</strong> {ownerInfo.FirstName}</p>
                <p><strong>Last Name:</strong> {ownerInfo.LastName}</p>
                <p><strong>Contact Number:</strong> {ownerInfo.contactNumber || "N/A"}</p>
                <p><strong>Email:</strong> {ownerInfo.email}</p>
                <button className="edit-owner-btn" onClick={openEditOwnerModal}>
                  Edit Profile
                </button>
              </div>
            </div>
          )}
          {activePanel === "petDetails" && (
            <div className="panel pet-details-panel">
              <div className="pet-details-header">
                <h3>Pet Details</h3>
                <button className="addpetbutt" onClick={openAddPetModal}>
                  Add A Pet
                </button>
              </div>
              {loading ? (
                <p>Loading pet details...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Pet Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pets.length > 0 ? (
                      pets.map((pet) => (
                        <tr key={pet.id}>
                          <td>
                            <a
                              href="#!"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePetClick(pet);
                              }}
                              className="pet-name-link"
                            >
                              {pet.petName}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td>No pets found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activePanel === "appointments" && (
            <div className="panel appointments-panel">
              <h3>Appointments</h3>
              <table>
                <thead>
                  <tr>
                    <th>Pet Name</th>
                    <th>Date & Time</th>
                    <th>Clinic</th>
                    <th>Service</th>
                    <th>Veterinarian</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.petName}</td>
                        <td>{formatDate(appointment.dateofAppointment)}</td>
                        <td>{appointment.clinicName}</td>
                        <td>{appointment.serviceType}</td>
                        <td>{appointment.veterinarian}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No appointments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedPet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={closeModal}>×</span>
            <div className="pet-image-container">
              <div className="pet-image-wrapper">
                {newImagePreview ? (
                  <img
                    src={newImagePreview}
                    alt={`${selectedPet.petName}`}
                    className="pet-image"
                  />
                ) : (
                  <img
                    src={selectedPet.petImageURL || DEFAULT_PET_IMAGE}
                    alt={`${selectedPet.petName}`}
                    className="pet-image"
                  />
                )}
                <div
                  className="edit-image-icon"
                  onClick={() => document.getElementById("pet-image-edit").click()}
                >
                  <img
                    src="https://www.freeiconspng.com/thumbs/camera-icon/camera-icon-21.png"
                    alt="Edit"
                    style={{ width: "18px", height: "18px" }}
                  />
                </div>
                <input
                  type="file"
                  id="pet-image-edit"
                  accept="image/jpeg, image/jpg, image/png"
                  onChange={handleModalImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
            {imageUploadError && <div className="error-message">{imageUploadError}</div>}
            <h2>{selectedPet.petName}</h2>
            <div className="pet-info-grid">
              <div className="info-item">
                <strong>Species:</strong> {selectedPet.Species || "N/A"}
              </div>
              <div className="info-item">
                <strong>Breed:</strong> {selectedPet.Breed || "N/A"}
              </div>
              <div className="info-item">
                <strong>Color:</strong> {selectedPet.Color || "N/A"}
              </div>
              <div className="info-item">
                <strong>Gender:</strong> {selectedPet.Gender || "N/A"}
              </div>
              <div className="info-item">
                <strong>Weight:</strong> {selectedPet.Weight ? `${selectedPet.Weight} kg` : "N/A"}
              </div>
              <div className="info-item">
                <strong>Date of Birth:</strong> {formatDate(selectedPet.dateofBirth)}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="modal-close-btn"
                onClick={handleSavePetImage}
                disabled={isSavingImage}
              >
                {isSavingImage ? "Saving..." : isEditingImage ? "Save & Close" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditOwnerModal && ownerInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={closeEditOwnerModal}>×</span>
            <h2>Edit Profile</h2>
            {imageUploadError && <div className="error-message">{imageUploadError}</div>}
            <div className="pet-image-container">
              <div className="pet-image-wrapper">
                <img
                  src={ownerImagePreview || ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                  alt="Owner"
                  className="pet-image"
                />
                <div
                  className="edit-image-icon"
                  onClick={() => document.getElementById("owner-image-edit").click()}
                >
                  <FaCamera />
                </div>
                <input
                  type="file"
                  id="owner-image-edit"
                  accept="image/jpeg, image/jpg, image/png"
                  onChange={handleOwnerImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveOwnerProfile(); }}>
              <div className="form-group">
                <label htmlFor="FirstName">First Name</label>
                <input
                  type="text"
                  id="FirstName"
                  name="FirstName"
                  value={editedOwnerInfo.FirstName}
                  onChange={handleOwnerInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="LastName">Last Name</label>
                <input
                  type="text"
                  id="LastName"
                  name="LastName"
                  value={editedOwnerInfo.LastName}
                  onChange={handleOwnerInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={editedOwnerInfo.contactNumber}
                  onChange={handleOwnerInputChange}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeEditOwnerModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPetModal && (
        <div className="modal-overlay">
          <div className="modal-content add-pet-modal">
            <span className="close-button" onClick={closeAddPetModal}>×</span>
            <h2>Add New Pet</h2>
            {addPetSuccess && <div className="success-message">Pet added successfully!</div>}
            {addPetError && <div className="error-message">{addPetError}</div>}
            <form onSubmit={handleAddPet}>
              <div className="pet-image-upload-container">
                <label
                  htmlFor="pet-image-upload"
                  className="pet-image-upload"
                  style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
                >
                  {!imagePreview && (
                    <>
                      <FaCamera className="camera-icon" />
                      <p>Upload Pet Photo</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="pet-image-upload"
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="petName">Pet Name *</label>
                <input
                  type="text"
                  id="petName"
                  name="petName"
                  value={newPet.petName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="Species">Species *</label>
                <input
                  type="text"
                  id="Species"
                  name="Species"
                  value={newPet.Species}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Breed">Breed</label>
                <input
                  type="text"
                  id="Breed"
                  name="Breed"
                  value={newPet.Breed}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Color">Color</label>
                <input
                  type="text"
                  id="Color"
                  name="Color"
                  value={newPet.Color}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Gender">Gender *</label>
                <select
                  id="Gender"
                  name="Gender"
                  value={newPet.Gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="Weight">Weight (kg)</label>
                <input
                  type="number"
                  id="Weight"
                  name="Weight"
                  value={newPet.Weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateofBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateofBirth"
                  name="dateofBirth"
                  value={newPet.dateofBirth}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeAddPetModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={addingPet}>
                  {addingPet ? "Adding..." : "Add Pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetOwnerHome;