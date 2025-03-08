import React, { useState, useEffect } from "react"; 
import "./PetOwnerHome.css"; 
import { db, auth } from "../../firebase"; // Import db and auth from your firebase.js
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp } from "firebase/firestore";
 
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
 
  // Function to safely format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    
    // If dateValue is a Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }
    
    // If dateValue is a string, try to parse it
    if (typeof dateValue === 'string') {
      try {
        return new Date(dateValue).toLocaleDateString();
      } catch (e) {
        return dateValue; // Return original string if parsing fails
      }
    }
    
    // Return as is for other cases
    return String(dateValue);
  };

  // Handle input changes for the new pet form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPet({
      ...newPet,
      [name]: name === "Weight" ? (value === "" ? "" : parseFloat(value)) : value
    });
  };

  // Function to add a new pet to Firebase
  const handleAddPet = async (e) => {
    e.preventDefault();
    setAddingPet(true);
    setAddPetError("");
    setAddPetSuccess(false);

    try {
      // Validate form
      if (!newPet.petName || !newPet.Species || !newPet.Gender) {
        throw new Error("Pet name, species, and gender are required");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to add a pet");
      }

      // Create a reference to the owner document
      const ownerRef = doc(db, "users", currentUser.uid);

      // Add the pet to Firestore
      await addDoc(collection(db, "pets"), {
        ...newPet,
        owner: ownerRef,
        createdAt: serverTimestamp()
      });

      // Show success message
      setAddPetSuccess(true);
      
      // Reset the form
      setNewPet({
        petName: "",
        Breed: "",
        Color: "",
        Species: "",
        Gender: "",
        Weight: "",
        dateofBirth: ""
      });

      // Refresh the pets list
      fetchPets();
      
      // Close modal after a short delay
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

  // Fetch pets from Firestore
  const fetchPets = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Query pets collection where owner matches current user ID
        const petsQuery = query(
          collection(db, "pets"),
          where("owner", "==", doc(db, "users", currentUser.uid))
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

  // Fetch pets when component mounts
  useEffect(() => {
    fetchPets();
    fetchAppointments();
  }, []);

  // Fetch appointments
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
        
        querySnapshot.forEach((doc) => {
          appointmentsList.push({ id: doc.id, ...doc.data() });
        });
        
        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

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
                    <th>Diagnosis</th> 
                    <th>Service</th> 
                    <th>Veterinarian</th> 
                  </tr> 
                </thead> 
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.petName}</td>
                        <td>{formatDate(appointment.date)}</td>
                        <td>{appointment.diagnosis || "N/A"}</td>
                        <td>{appointment.service || "N/A"}</td>
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
              <form> 
                <label>Choose Pet</label> 
                <select>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.petName}
                    </option>
                  ))}
                </select> 
                <br /> 
                <label>Service Type</label> 
                <select> 
                  <option>Vaccination</option> 
                  <option>Pet Surgery</option> 
                  <option>Regular Checkup</option>
                  <option>Grooming</option>
                  <option>Dental Care</option>
                </select> 
                <br /> 
                <label>Clinic Location</label> 
                <input type="text" value="Ayrate Veterinary Center Inc." readOnly /> 
                <br /> 
                <label>Appointment Date</label> 
                <input type="datetime-local" /> 
                <br /> 
                <button type="submit">Book Appointment</button> 
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