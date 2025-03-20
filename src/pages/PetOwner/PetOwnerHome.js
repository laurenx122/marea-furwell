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

  // Pet image states
  const [petImage, setPetImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newPetImage, setNewPetImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  // Appointment states
  const [newAppointment, setNewAppointment] = useState({
    petId: "",
    clinicId: "",
    veterinarianId: "",
    serviceType: "",
    dateofAppointment: "",
  });
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [veterinarians, setVeterinarians] = useState([]);
  const [loadingVeterinarians, setLoadingVeterinarians] = useState(false);
  const [vetServices, setVetServices] = useState({});
  const [vetSchedules, setVetSchedules] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [allVeterinarians, setAllVeterinarians] = useState([]);

  const UPLOAD_PRESET = "furwell";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";

  // Utility to format dates
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

  // Convert vet schedule to specific dates
  const getAvailableDates = (schedules) => {
    const dates = [];
    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Look ahead 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dayName = daysOfWeek[currentDate.getDay()];

      schedules.forEach((schedule) => {
        if (schedule.day === dayName) {
          const [startHour, startMinute] = schedule.startTime.split(":");
          const [endHour, endMinute] = schedule.endTime.split(":");
          const start = new Date(currentDate);
          start.setHours(parseInt(startHour), parseInt(startMinute), 0);
          const end = new Date(currentDate);
          end.setHours(parseInt(endHour), parseInt(endMinute), 0);

          // Only include future times
          if (start > new Date()) {
            dates.push({
              date: start,
              end,
              display: `${formatDate(start)} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
            });
          }
        }
      });
    }
    return dates;
  };

  // Image handling
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

  const handleSaveImageAndClose = async () => {
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

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPet({
      ...newPet,
      [name]: name === "Weight" ? (value === "" ? "" : parseFloat(value)) : value,
    });
  };

  const handleAppointmentChange = async (e) => {
    const { name, value } = e.target;
    setNewAppointment((prev) => ({ ...prev, [name]: value }));
  
    if (name === "clinicId" && value) {
      setLoadingVeterinarians(true);
      await fetchVeterinarians(value);
      setLoadingVeterinarians(false);
      setNewAppointment((prev) => ({
        ...prev,
        veterinarianId: "",
        serviceType: "",
        dateofAppointment: "",
      }));
      setAvailableDates([]);
    } else if (name === "veterinarianId" && value) {
      const vet = allVeterinarians.find((v) => v.id === value);
      const vetServicesList = vet.services || [];
      setVetServices({ [value]: vetServicesList });
      setVetSchedules({ [value]: vet.schedule || [] });
      setAvailableDates(getAvailableDates(vet.schedule || []));
      setNewAppointment((prev) => ({
        ...prev,
        serviceType: vetServicesList.length > 0 ? vetServicesList[0] : "",
        dateofAppointment: "",
      }));
    } else if (name === "serviceType" && value) {
      const vetId = newAppointment.veterinarianId;
      if (vetId) {
        const vet = allVeterinarians.find((v) => v.id === vetId);
        setVetSchedules({ [vetId]: vet.schedule || [] });
        setAvailableDates(getAvailableDates(vet.schedule || []));
      } else {
        // Filter veterinarians from the full list based on the selected service
        const filteredVets = allVeterinarians.filter((v) =>
          (v.services || []).includes(value)
        );
        setVeterinarians(filteredVets); // Update the displayed list
        setVetServices(
          filteredVets.reduce((acc, v) => ({ ...acc, [v.id]: v.services }), {})
        );
        setVetSchedules(
          filteredVets.reduce((acc, v) => ({ ...acc, [v.id]: v.schedule }), {})
        );
        setNewAppointment((prev) => ({
          ...prev,
          veterinarianId: filteredVets.length > 0 ? filteredVets[0].id : "",
          dateofAppointment: "",
        }));
        if (filteredVets.length > 0) {
          setAvailableDates(getAvailableDates(filteredVets[0].schedule || []));
        } else {
          setAvailableDates([]);
        }
      }
    }
  };

  // Add pet
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

  // Book appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingAppointment(true);
    setAppointmentError("");
    setAppointmentSuccess(false);

    try {
      const { petId, clinicId, veterinarianId, serviceType, dateofAppointment } = newAppointment;
      if (!petId || !clinicId || !veterinarianId || !serviceType || !dateofAppointment) {
        throw new Error("All fields are required");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in to book an appointment");

      const selectedPet = pets.find((pet) => pet.id === petId);
      if (!selectedPet) throw new Error("Selected pet not found");

      const ownerRef = doc(db, "users", currentUser.uid);
      const petRef = doc(db, "pets", petId);
      const clinicRef = doc(db, "clinics", clinicId);
      const vetRef = doc(db, "users", veterinarianId);

      await addDoc(collection(db, "appointments"), {
        petId,
        petName: selectedPet.petName,
        petRef,
        owner: ownerRef,
        clinic: clinicRef,
        veterinarianId,
        veterinarian: veterinarians.find((v) => v.id === veterinarianId).FirstName + " " + veterinarians.find((v) => v.id === veterinarianId).LastName,
        serviceType,
        dateofAppointment: new Date(dateofAppointment),
        createdAt: serverTimestamp(),
      });

      setAppointmentSuccess(true);
      setNewAppointment({
        petId,
        clinicId: "",
        veterinarianId: "",
        serviceType: "",
        dateofAppointment: "",
      });
      setVeterinarians([]);
      setVetServices({});
      setVetSchedules({});
      setAvailableDates([]);
      fetchAppointments();
      setTimeout(() => setAppointmentSuccess(false), 3000);
    } catch (error) {
      console.error("Error booking appointment:", error);
      setAppointmentError(error.message);
    } finally {
      setBookingAppointment(false);
    }
  };

  // Fetch data
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

  const fetchClinics = async () => {
    try {
      setLoadingClinics(true);
      const querySnapshot = await getDocs(collection(db, "clinics"));
      const clinicsList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, name: doc.data().clinicName }))
        .filter((c) => c.name);
      setClinics(clinicsList);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoadingClinics(false);
    }
  };

const fetchVeterinarians = async (clinicId) => {
  try {
    const vetsQuery = query(
      collection(db, "users"),
      where("Type", "==", "Veterinarian"),
      where("clinic", "==", doc(db, "clinics", clinicId))
    );
    const querySnapshot = await getDocs(vetsQuery);
    const vetList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAllVeterinarians(vetList); // Store the full list
    setVeterinarians(vetList); // Initially set the filtered list to the full list
    setVetServices(vetList.reduce((acc, v) => ({ ...acc, [v.id]: v.services || [] }), {}));
    setVetSchedules(vetList.reduce((acc, v) => ({ ...acc, [v.id]: v.schedule || [] }), {}));
  } catch (error) {
    console.error("Error fetching veterinarians:", error);
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
        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    fetchPets();
    fetchAppointments();
    fetchClinics();
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

  return (
    <div className="pet-owner-container">
      <div className="sidebar">
        <h2>Pet Owner</h2>
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
          className={activePanel === "bookAppointment" ? "active" : ""}
          onClick={() => setActivePanel("bookAppointment")}
        >
          Book Appointment
        </button>
      </div>

      <div className="content">
        <div className="panel-container">
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

          {activePanel === "bookAppointment" && (
            <div className="panel book-appointment-panel">
              <h3>Book Appointment</h3>
              {appointmentSuccess && (
                <div className="success-message">Appointment booked successfully!</div>
              )}
              {appointmentError && <div className="error-message">{appointmentError}</div>}
              <form onSubmit={handleBookAppointment}>
                <div className="form-group">
                  <label htmlFor="petId">Choose Pet *</label>
                  <select
                    id="petId"
                    name="petId"
                    value={newAppointment.petId}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="">Select a pet</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.petName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="clinicId">Clinic *</label>
                  <select
                    id="clinicId"
                    name="clinicId"
                    value={newAppointment.clinicId}
                    onChange={handleAppointmentChange}
                    required
                    disabled={!newAppointment.petId}
                  >
                    <option value="">Select a clinic</option>
                    {loadingClinics ? (
                      <option value="" disabled>
                        Loading clinics...
                      </option>
                    ) : (
                      clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="veterinarianId">Veterinarian *</label>
                  <select
                    id="veterinarianId"
                    name="veterinarianId"
                    value={newAppointment.veterinarianId}
                    onChange={handleAppointmentChange}
                    required
                    disabled={!newAppointment.clinicId || loadingVeterinarians}
                  >
                    <option value="">Select a veterinarian</option>
                    {loadingVeterinarians ? (
                      <option value="" disabled>
                        Loading veterinarians...
                      </option>
                    ) : (
                      veterinarians.map((vet) => (
                        <option key={vet.id} value={vet.id}>
                          {vet.FirstName} {vet.LastName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="serviceType">Service Type *</label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={newAppointment.serviceType}
                    onChange={handleAppointmentChange}
                    required
                    disabled={!newAppointment.clinicId || loadingVeterinarians}
                  >
                    <option value="">Select a service</option>
                    {newAppointment.veterinarianId &&
                      vetServices[newAppointment.veterinarianId]?.map((service, index) => (
                        <option key={index} value={service}>
                          {service}
                        </option>
                      ))}
                    {!newAppointment.veterinarianId &&
                      Object.values(vetServices)
                        .flat()
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map((service, index) => (
                          <option key={index} value={service}>
                            {service}
                          </option>
                        ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dateofAppointment">Date & Time *</label>
                  <select
                    id="dateofAppointment"
                    name="dateofAppointment"
                    value={newAppointment.dateofAppointment}
                    onChange={handleAppointmentChange}
                    required
                    disabled={!newAppointment.veterinarianId}
                  >
                    <option value="">Select a date and time</option>
                    {availableDates.map((slot, index) => (
                      <option key={index} value={slot.date.toISOString()}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={bookingAppointment || !newAppointment.petId}
                    className="submit-btn"
                  >
                    {bookingAppointment ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </form>
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
                onClick={handleSaveImageAndClose}
                disabled={isSavingImage}
              >
                {isSavingImage ? "Saving..." : isEditingImage ? "Save & Close" : "Close"}
              </button>
            </div>
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