import React, { useState, useEffect } from "react"; 
import "./PetOwnerHome.css"; 
import { db, auth } from "../../firebase"; 
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { FaCamera, FaPaw } from "react-icons/fa";

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
    dateofBirth: ""
  });
  const [addingPet, setAddingPet] = useState(false);
  const [addPetError, setAddPetError] = useState("");
  const [addPetSuccess, setAddPetSuccess] = useState(false);
  
  // Add state for pet image
  const [petImage, setPetImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [newAppointment, setNewAppointment] = useState({
    petId: "",
    serviceType: "Vaccination",
    dateofAppointment: "",
    veterinarian: "",
    clinicId: ""
  });
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [veterinarians, setVeterinarians] = useState([
    "Dr. Sarah Johnson",
    "Dr. Michael Rodriguez",
    "Dr. Emily Chen",
    "Dr. James Wilson"
  ]);
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  
  // Cloudinary upload preset
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";

  // Function to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString(); // Only date
    }
    
    if (typeof dateValue === 'string') {
      try {
        return new Date(dateValue).toLocaleDateString(); // Only date
      } catch (e) {
        return dateValue;
      }
    }
    
    return String(dateValue);
  };

  // Handle pet image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPet({
      ...newPet,
      [name]: name === "Weight" ? (value === "" ? "" : parseFloat(value)) : value
    });
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment({
      ...newAppointment,
      [name]: value
    });
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

      const currentUser  = auth.currentUser ;
      if (!currentUser ) {
        throw new Error("You must be logged in to add a pet");
      }

      // Upload pet image if one was selected
      let petImageURL = "";
      
      if (petImage && (
        petImage.type === "image/jpeg" ||
        petImage.type === "image/jpg" ||
        petImage.type === "image/png"
      )) {
        try {
          const image = new FormData();
          image.append("file", petImage);
          image.append("cloud_name", "dfgnexrda");
          image.append("upload_preset", UPLOAD_PRESET);

          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
            {
              method: "post",
              body: image
            }
          );

          if (!response.ok) {
            throw new Error("Image upload failed");
          }

          const imgData = await response.json();
          petImageURL = imgData.url.toString();
          console.log("Pet image uploaded successfully:", petImageURL);
        } catch (uploadError) {
          console.error("Error uploading pet image:", uploadError);
          setAddPetError("Failed to upload pet picture. Continuing with pet registration...");
          // Continue with pet addition even if image upload fails
        }
      }

      const ownerRef = doc(db, "users", currentUser .uid);

      await addDoc(collection(db, "pets"), {
        ...newPet,
        petImageURL: petImageURL, // Store the image URL
        owner: ownerRef,
        createdAt: serverTimestamp()
      });

      setAddPetSuccess(true);
      
      setNewPet({
        petName: "",
        Breed: "",
        Color: "",
        Species: "",
        Gender: "",
        Weight: "",
        dateofBirth: ""
      });
      
      // Reset image state
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

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingAppointment(true);
    setAppointmentError("");
    setAppointmentSuccess(false);

    try {
      if (!newAppointment.petId || !newAppointment.serviceType || !newAppointment.dateofAppointment || !newAppointment.veterinarian || !newAppointment.clinicId) {
        throw new Error("All fields are required");
      }

      const currentUser  = auth.currentUser ;
      if (!currentUser ) {
        throw new Error("You must be logged in to book an appointment");
      }

      const selectedPet = pets.find(pet => pet.id === newAppointment.petId);
      if (!selectedPet) {
        throw new Error("Selected pet not found");
      }

      const ownerRef = doc(db, "users", currentUser .uid);
      const petRef = doc(db, "pets", newAppointment.petId);
      const clinicRef = doc(db, "clinics", newAppointment.clinicId);

      // Add the appointment to Firestore
      await addDoc(collection(db, "appointments"), {
        petId: newAppointment.petId,
        petName: selectedPet.petName, 
        petRef: petRef, 
        owner: ownerRef,
        clinic: clinicRef,
        serviceType: newAppointment.serviceType,
        dateofAppointment: new Date(newAppointment.dateofAppointment),
        veterinarian: newAppointment.veterinarian,
        createdAt: serverTimestamp()
      });

      setAppointmentSuccess(true);
      
      setNewAppointment({
        petId: "",
        serviceType: "Vaccination",
        dateofAppointment: "",
        veterinarian: "",
        clinicId: ""
      });

      fetchAppointments();
      
      setTimeout(() => {
        setAppointmentSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error booking appointment:", error);
      setAppointmentError(error.message);
    } finally {
      setBookingAppointment(false);
    }
  };

  // Fetch pets from Firestore
  const fetchPets = async () => {
    try {
      setLoading(true);
      const currentUser  = auth.currentUser ;
      
      if (currentUser ) {
        const petsQuery = query(
          collection(db, "pets"),
          where("owner", "==", doc(db, "users", currentUser .uid))
        );
        
        const querySnapshot = await getDocs(petsQuery);
        const petsList = [];
        
        querySnapshot.forEach((doc) => {
          petsList.push({ id: doc.id, ...doc.data() });
        });
        
        setPets(petsList);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinics from Firestore
  const fetchClinics = async () => {
    try {
      setLoadingClinics(true);
      const clinicsCollection = collection(db, "clinics");
      const querySnapshot = await getDocs(clinicsCollection);
      const clinicsList = [];
      
      querySnapshot.forEach((doc) => {
        const clinicData = doc.data();
        if (clinicData.clinicName) {
          clinicsList.push({ 
            id: doc.id, 
            name: clinicData.clinicName 
          });
        }
      });
      
      setClinics(clinicsList);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoadingClinics(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const currentUser  = auth.currentUser ;
      
      if (currentUser ) {
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("owner", "==", doc(db, "users", currentUser .uid))
        );
        
        const querySnapshot = await getDocs(appointmentsQuery);
        const appointmentsList = [];
        
        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          let appointmentWithResolvedRefs = { 
            id: appointmentDoc.id,
            ...appointmentData
          };
          
          if (typeof appointmentData.petName === 'string') {
          } 
          else if (appointmentData.petName && appointmentData.petName.path) {
            try {
              const petDocRef = appointmentData.petName;
              const petDoc = await getDoc(petDocRef);
              
              if (petDoc.exists()) {
                const petData = petDoc.data();
                appointmentWithResolvedRefs.petName = petData.petName || "Unknown Pet";
              } else {
                appointmentWithResolvedRefs.petName = "Pet Not Found";
              }
            } catch (error) {
              console.error("Error fetching pet reference:", error);
              appointmentWithResolvedRefs.petName = "Error Loading Pet";
            }
          } 
          else if (appointmentData.petId) {
            try {
              const petDocRef = doc(db, "pets", appointmentData.petId);
              const petDoc = await getDoc(petDocRef);
              
              if (petDoc.exists()) {
                const petData = petDoc.data();
                appointmentWithResolvedRefs.petName = petData.petName || "Unknown Pet";
              } else {
                appointmentWithResolvedRefs.petName = "Pet Not Found";
              }
            } catch (error) {
              console.error("Error fetching pet by ID:", error);
              appointmentWithResolvedRefs.petName = "Error Loading Pet";
            }
          } else {
            appointmentWithResolvedRefs.petName = "Unknown Pet";
          }
          
          // Resolve clinic name
          if (appointmentData.clinic) {
            try {
              const clinicDoc = await getDoc(appointmentData.clinic);
              if (clinicDoc.exists()) {
                const clinicData = clinicDoc.data();
                appointmentWithResolvedRefs.clinicName = clinicData.clinicName || "Unknown Clinic";
              } else {
                appointmentWithResolvedRefs.clinicName = "Clinic Not Found";
              }
            } catch (error) {
              console.error("Error fetching clinic:", error);
              appointmentWithResolvedRefs.clinicName = "Error Loading Clinic";
            }
          } else {
            appointmentWithResolvedRefs.clinicName = "Unknown Clinic";
          }
          
          appointmentsList.push(appointmentWithResolvedRefs);
        }
        
        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchPets();
    fetchAppointments();
    fetchClinics();
  }, []);

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPet(null);
  };

  const openAddPetModal = () => {
    setShowAddPetModal(true);
  };

  const closeAddPetModal = () => {
    setShowAddPetModal(false);
    setNewPet({
      petName: "",
      Breed: "",
      Color: "",
      Species: "",
      Gender: "",
      Weight: "",
      dateofBirth: ""
    });
    setPetImage(null);
    setImagePreview(null);
    setAddPetError("");
    setAddPetSuccess(false);
  };

  const handleImageChangeInModal = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const image = new FormData();
        image.append("file", file);
        image.append("cloud_name", "dfgnexrda");
        image.append("upload_preset", UPLOAD_PRESET);

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dfgnexrda/image/upload",
          {
            method: "post",
            body: image
          }
        );

        if (!response.ok) {
          throw new Error("Image upload failed");
        }

        const imgData = await response.json();
        const newImageURL = imgData.url.toString();

        // Update the pet image URL in Firestore
        const petRef = doc(db, "pets", selectedPet.id);
        await updateDoc(petRef, { petImageURL: newImageURL });

        // Update the state to reflect the new image
        setSelectedPet({ ...selectedPet, petImageURL: newImageURL });
      } catch (error) {
        console.error("Error uploading pet image:", error);
      }
    }
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
                <button className="addpetbutt" onClick={openAddPetModal}>Add A Pet</button>
              </div>
              {loading ? (
                <p>Loading pet details...</p>
              ) : (
                <table> 
                  <thead> 
                    <tr> 
                      <th>Pet Name</th> 
                      <th>Date</th> 
                      <th>Veterinarian</th> 
                      <th>Diagnosis</th> 
                      <th>Medication</th> 
                      <th>Comments</th> 
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
                        <td colSpan="6">No pets found</td>
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
                    <th>Time & Date of Appointment</th> 
                    <th>Clinic</th> 
                    <th>Service</th> 
                    <th>Veterinarian</th> 
                  </tr> 
                </thead> 
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{typeof appointment.petName === 'string' ? appointment.petName : 'Unknown Pet'}</td>
                        <td>{formatDate(appointment.dateofAppointment)}</td>
                        <td>{appointment.clinicName || "N/A"}</td>
                        <td>{appointment.serviceType || "N/A"}</td>
                        <td>{appointment.veterinarian || "N/A"}</td>
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
                <div className="success-message">
                  Appointment booked successfully!
                </div>
              )}
              
              {appointmentError && (
                <div className="error-message">
                  {appointmentError}
                </div>
              )}
              
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
                  <label htmlFor="serviceType">Service Type *</label> 
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={newAppointment.serviceType}
                    onChange={handleAppointmentChange}
                    required
                  > 
                    <option value="Vaccination">Vaccination</option> 
                    <option value="Pet Surgery">Pet Surgery</option> 
                    <option value="Regular Checkup">Regular Checkup</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Dental Care">Dental Care</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="veterinarian">Veterinarian *</label>
                  <select
                    id="veterinarian"
                    name="veterinarian"
                    value={newAppointment.veterinarian}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="">Select a veterinarian</option>
                    {veterinarians.map((vet, index) => (
                      <option key={index} value={vet}>
                        {vet}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="clinicId">Clinic Location *</label> 
                  <select
                    id="clinicId"
                    name="clinicId"
                    value={newAppointment.clinicId}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="">Select a clinic</option>
                    {loadingClinics ? (
                      <option value="" disabled>Loading clinics...</option>
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
                  <label htmlFor="dateofAppointment">Appointment Date & Time *</label> 
                  <input
                    type="datetime-local"
                    id="dateofAppointment"
                    name="dateofAppointment"
                    value={newAppointment.dateofAppointment}
                    onChange={handleAppointmentChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  /> 
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

      {/* Pet Details Modal */}
      {showModal && selectedPet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={closeModal}>&times;</span>
            
            {/* Pet Image in modal */}
            <div className="pet-image-container">
              <img 
                src={selectedPet.petImageURL || DEFAULT_PET_IMAGE} 
                alt={`${selectedPet.petName}`} 
                className="pet-image"
              />
            </div>
            
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
            <input 
              type="file" 
              accept="image/jpeg, image/jpg, image/png" 
              onChange={handleImageChangeInModal} 
            />
            <button className="modal-close-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddPetModal && (
        <div className="modal-overlay">
          <div className="modal-content add-pet-modal">
            <span className="close-button" onClick={closeAddPetModal}>&times;</span>
            <h2>Add New Pet</h2>
            
            {addPetSuccess && (
              <div className="success-message">
                Pet added successfully!
              </div>
            )}
            
            {addPetError && (
              <div className="error-message">
                {addPetError}
              </div>
            )}
            
            <form onSubmit={handleAddPet}>
              {/* Pet Image Upload */}
              <div className="pet-image-upload-container">
                <label htmlFor="pet-image-upload" className="pet-image-upload" style={imagePreview ? {backgroundImage: `url(${imagePreview})`} : {}}>
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
                    style={{ display: 'none' }} 
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
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={closeAddPetModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={addingPet}
                >
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