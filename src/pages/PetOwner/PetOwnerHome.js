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
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  Inject,
} from "@syncfusion/ej2-react-schedule";
import { registerLicense } from "@syncfusion/ej2-base";

// Import Syncfusion CSS
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";

const PetOwnerHome = () => {
  // Register Syncfusion license (replace with your valid key if different)
  registerLicense(
    "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
  );

  const [activePanel, setActivePanel] = useState("petDetails");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
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
    let date;
    if (dateValue && typeof dateValue.toDate === "function") {
      date = dateValue.toDate();
    } else if (typeof dateValue === "string") {
      date = new Date(dateValue);
    } else {
      date = dateValue;
    }

    if (!(date instanceof Date) || isNaN(date)) return "N/A";

    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " at");
  };

  const formatDOB = (dateValue) => {
    if (!dateValue) return "N/A";
    let dob;
    if (dateValue && typeof dateValue.toDate === "function") {
      dob = dateValue.toDate();
    } else if (typeof dateValue === "string") {
      dob = new Date(dateValue);
    } else {
      return "N/A";
    }

    const formattedDate = dob.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const today = new Date("2025-03-24"); // Current date as per context
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return `${formattedDate} (${age})`;
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
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("owner", "==", doc(db, "users", currentUser.uid))
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const currentAppointmentsList = [];
        const pastAppointmentsList = [];
        const today = new Date("2025-03-24"); // Current date as per context

        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const clinicDoc = await getDoc(data.clinic);
          const startTime = data.dateofAppointment.toDate();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assuming 1-hour duration

          const appointmentDetails = {
            Id: doc.id,
            Subject: `${data.petName || "Unknown Pet"} - ${data.serviceType || "N/A"}`,
            StartTime: startTime,
            EndTime: endTime,
            petName: data.petName || "Unknown Pet",
            clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
            serviceType: data.serviceType || "N/A",
            veterinarian: data.veterinarian || "N/A",
            remarks: data.remarks || "No remarks",
            dateofAppointment: startTime,
          };

          if (startTime < today) {
            pastAppointmentsList.push(appointmentDetails);
          } else {
            currentAppointmentsList.push(appointmentDetails);
          }
        }

        setAppointments(currentAppointmentsList);
        setPastAppointments(pastAppointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
      setPastAppointments([]);
    } finally {
      setLoading(false);
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

  const onCellClick = (args) => {
    args.cancel = true; // Prevent adding new events
  };

  return (
    <div className="pet-owner-container-p">
      <div className="sidebar-p">
        {ownerInfo && (
          <div className="owner-sidebar-panel-p">
            <div className="owner-img-container-p">
              <img
                src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                alt="Owner Profile"
                className="owner-profile-image-p"
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
        <div className="sidebar-buttons-p">
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
          <button
            className={activePanel === "healthRecords" ? "active" : ""}
            onClick={() => setActivePanel("healthRecords")}
          >
            Health Records
          </button>
        </div>
      </div>

      <div className="content-p">
        <div className="panel-container-p">
          {activePanel === "profile" && ownerInfo && (
            <div className="panel-p profile-panel-p">
              <h3>Profile</h3>
              <div className="owner-details-p">
                <img
                  src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                  alt="Owner"
                  className="owner-info-img-p"
                />
                <p><strong>First Name:</strong> {ownerInfo.FirstName}</p>
                <p><strong>Last Name:</strong> {ownerInfo.LastName}</p>
                <p><strong>Contact Number:</strong> {ownerInfo.contactNumber || "N/A"}</p>
                <p><strong>Email:</strong> {ownerInfo.email}</p>
                <button className="edit-owner-btn-p" onClick={openEditOwnerModal}>
                  Edit Profile
                </button>
              </div>
            </div>
          )}
          {activePanel === "petDetails" && (
            <div className="panel-p pet-details-panel-p">
              <div className="pet-details-header-p">
                <h3>Pet Details</h3>
                <button className="addpetbutt-p" onClick={openAddPetModal}>
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
                              className="pet-name-link-p"
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
            <div className="panel-p appointments-panel-p">
              <h3>Appointments</h3>
              {loading ? (
                <p>Loading appointments...</p>
              ) : (
                <ScheduleComponent
                  width="100%"
                  height="650px"
                  currentDate={new Date(2025, 2, 24)} // March 24, 2025
                  eventSettings={{
                    dataSource: appointments,
                    fields: {
                      id: "Id",
                      subject: { name: "Subject" },
                      startTime: { name: "StartTime" },
                      endTime: { name: "EndTime" },
                    },
                  }}
                  cellClick={onCellClick}
                  readOnly={true}
                >
                  <ViewsDirective>
                    <ViewDirective option="Day" />
                    <ViewDirective option="Week" />
                    <ViewDirective option="WorkWeek" />
                    <ViewDirective option="Month" />
                    <ViewDirective option="Agenda" />
                  </ViewsDirective>
                  <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
                </ScheduleComponent>
              )}
            </div>
          )}
          {activePanel === "healthRecords" && (
            <div className="panel-p health-records-panel-p">
              <h3>Health Records</h3>
              {loading ? (
                <p>Loading health records...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date of Appointment</th>
                      <th>Pet Name</th>
                      <th>Service</th>
                      <th>Veterinarian</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppointments.length > 0 ? (
                      pastAppointments.map((record) => (
                        <tr key={record.Id}>
                          <td>{formatDate(record.dateofAppointment)}</td>
                          <td>{record.petName}</td>
                          <td>{record.serviceType}</td>
                          <td>{record.veterinarian}</td>
                          <td>{record.remarks}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">No past appointments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedPet && (
        <div className="modal-overlay-p">
          <div className="modal-content-p">
            <span className="close-button-p" onClick={closeModal}>×</span>
            <div className="pet-image-container-p">
              <div className="pet-image-wrapper-p">
                {newImagePreview ? (
                  <img
                    src={newImagePreview}
                    alt={`${selectedPet.petName}`}
                    className="pet-image-p"
                  />
                ) : (
                  <img
                    src={selectedPet.petImageURL || DEFAULT_PET_IMAGE}
                    alt={`${selectedPet.petName}`}
                    className="pet-image-p"
                  />
                )}
                <div
                  className="edit-image-icon-p"
                  onClick={() => document.getElementById("pet-image-edit-p").click()}
                >
                  <img
                    src="https://www.freeiconspng.com/thumbs/camera-icon/camera-icon-21.png"
                    alt="Edit"
                    style={{ width: "18px", height: "18px" }}
                  />
                </div>
                <input
                  type="file"
                  id="pet-image-edit-p"
                  accept="image/jpeg, image/jpg, image/png"
                  onChange={handleModalImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
            {imageUploadError && <div className="error-message-p">{imageUploadError}</div>}
            <h2>{selectedPet.petName}</h2>
            <div className="pet-info-grid-p">
              <div className="info-item-p">
                <strong>Species:</strong> {selectedPet.Species || "N/A"}
              </div>
              <div className="info-item-p">
                <strong>Breed:</strong> {selectedPet.Breed || "N/A"}
              </div>
              <div className="info-item-p">
                <strong>Color:</strong> {selectedPet.Color || "N/A"}
              </div>
              <div className="info-item-p">
                <strong>Gender:</strong> {selectedPet.Gender || "N/A"}
              </div>
              <div className="info-item-p">
                <strong>Weight:</strong> {selectedPet.Weight ? `${selectedPet.Weight} kg` : "N/A"}
              </div>
              <div className="info-item-p">
                <strong>Date of Birth:</strong> {formatDOB(selectedPet.dateofBirth)}
              </div>
            </div>
            <div className="modal-actions-p">
              <button
                className="modal-close-btn-p"
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
        <div className="modal-overlay-p">
          <div className="modal-content-p">
            <span className="close-button-p" onClick={closeEditOwnerModal}>×</span>
            <h2>Edit Profile</h2>
            {imageUploadError && <div className="error-message-p">{imageUploadError}</div>}
            <div className="pet-image-container-p">
              <div className="pet-image-wrapper-p">
                <img
                  src={ownerImagePreview || ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                  alt="Owner"
                  className="pet-image-p"
                />
                <div
                  className="edit-image-icon-p"
                  onClick={() => document.getElementById("owner-image-edit-p").click()}
                >
                  <FaCamera />
                </div>
                <input
                  type="file"
                  id="owner-image-edit-p"
                  accept="image/jpeg, image/jpg, image/png"
                  onChange={handleOwnerImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveOwnerProfile(); }}>
              <div className="form-group-p">
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
              <div className="form-group-p">
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
              <div className="form-group-p">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={editedOwnerInfo.contactNumber}
                  onChange={handleOwnerInputChange}
                />
              </div>
              <div className="modal-actions-p">
                <button type="button" className="cancel-btn-p" onClick={closeEditOwnerModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn-p" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPetModal && (
        <div className="modal-overlay-p">
          <div className="modal-content-p add-pet-modal-p">
            <span className="close-button-p" onClick={closeAddPetModal}>×</span>
            <h2>Add New Pet</h2>
            {addPetSuccess && <div className="success-message-p">Pet added successfully!</div>}
            {addPetError && <div className="error-message-p">{addPetError}</div>}
            <form onSubmit={handleAddPet}>
              <div className="pet-image-upload-container-p">
                <label
                  htmlFor="pet-image-upload-p"
                  className="pet-image-upload-p"
                  style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
                >
                  {!imagePreview && (
                    <>
                      <FaCamera className="camera-icon-p" />
                      <p>Upload Pet Photo</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="pet-image-upload-p"
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <div className="form-group-p">
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
              <div className="form-group-p">
                <label htmlFor="Species">Species *</label>
                <input
                  type="text"
                  id="Species"
                  name="Species"
                  value={newPet.Species}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-p">
                <label htmlFor="Breed">Breed</label>
                <input
                  type="text"
                  id="Breed"
                  name="Breed"
                  value={newPet.Breed}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-p">
                <label htmlFor="Color">Color</label>
                <input
                  type="text"
                  id="Color"
                  name="Color"
                  value={newPet.Color}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-p">
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
              <div className="form-group-p">
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
              <div className="form-group-p">
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
              <div className="form-actions-p">
                <button type="button" className="cancel-btn-p" onClick={closeAddPetModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn-p" disabled={addingPet}>
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