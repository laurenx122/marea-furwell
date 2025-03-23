// VeterinaryHome.jsx
import React, { useState, useEffect } from "react";
import "./VeterinaryHome.css";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { FaCamera, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const VeterinaryHome = () => {
  const [activePanel, setActivePanel] = useState("appointments");
  const [vetInfo, setVetInfo] = useState(null);
  const [editedVetInfo, setEditedVetInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVetModal, setShowVetModal] = useState(false);
  const [isEditingVet, setIsEditingVet] = useState(false);
  const [newVetImage, setNewVetImage] = useState(null);
  const [vetImagePreview, setVetImagePreview] = useState(null);
  const [isUpdatingVet, setIsUpdatingVet] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newRemark, setNewRemark] = useState("");

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    let date;
    if (typeof dateValue.toDate === "function") {
      date = dateValue.toDate();
    } else if (typeof dateValue === "string" || dateValue instanceof Date) {
      date = new Date(dateValue);
    } else {
      return "N/A";
    }
  
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
  
    return `${month} ${day}, ${year} at ${hour12}:${minutes} ${period}`;
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const handleVetImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewVetImage(file);
      setVetImagePreview(URL.createObjectURL(file));
      setShowVetModal(true);
      setIsEditingVet(true);
    }
  };

  const handleVetInputChange = (e) => {
    const { name, value } = e.target;
    setEditedVetInfo({ ...editedVetInfo, [name]: value });
  };

  const fetchVetInfo = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const vetRef = doc(db, "users", currentUser.uid);
        const vetDoc = await getDoc(vetRef);
        if (vetDoc.exists()) {
          const vetData = vetDoc.data();
          let clinicName = "N/A";
          if (vetData.clinic) {
            const clinicDoc = await getDoc(vetData.clinic);
            if (clinicDoc.exists()) {
              clinicName = clinicDoc.data().clinicName || "N/A";
            }
          }
          const vetInfoData = {
            id: vetDoc.id,
            FirstName: vetData.FirstName || "",
            LastName: vetData.LastName || "",
            clinicName,
            contactNumber: vetData.contactNumber || "",
            email: vetData.email || "",
            profileImageURL: vetData.profileImageURL || DEFAULT_VET_IMAGE,
            schedule: vetData.schedule || [],
          };
          setVetInfo(vetInfoData);
          setEditedVetInfo(vetInfoData);
          setSchedule(vetData.schedule || []);
        }
      }
    } catch (error) {
      console.error("Error fetching vet info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVetInfo = async () => {
    try {
      setIsUpdatingVet(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const vetRef = doc(db, "users", currentUser.uid);
        let profileImageURL = editedVetInfo.profileImageURL;

        if (newVetImage && ["image/jpeg", "image/jpg", "image/png"].includes(newVetImage.type)) {
          const image = new FormData();
          image.append("file", newVetImage);
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

        await updateDoc(vetRef, {
          FirstName: editedVetInfo.FirstName,
          LastName: editedVetInfo.LastName,
          contactNumber: editedVetInfo.contactNumber,
          profileImageURL,
        });

        setVetInfo({ ...editedVetInfo, profileImageURL });
        setNewVetImage(null);
        setVetImagePreview(null);
        setIsEditingVet(false);
        setShowVetModal(false);
      }
    } catch (error) {
      console.error("Error updating vet info:", error);
    } finally {
      setIsUpdatingVet(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const vetRef = doc(db, "users", currentUser.uid);
        const vetDoc = await getDoc(vetRef);
        if (!vetDoc.exists()) {
          console.error("Veterinarian document does not exist for UID:", currentUser.uid);
          return;
        }
  
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("veterinarianId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const appointmentsList = [];
  
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          let petData = {};
          let ownerName = "N/A";
  
          if (data.petRef) {
            const petDoc = await getDoc(data.petRef);
            if (petDoc.exists()) {
              petData = petDoc.data();
            }
          }
  
          if (data.owner) {
            const ownerDoc = await getDoc(data.owner);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "N/A";
            }
          }
  
          appointmentsList.push({
            id: doc.id,
            dateofAppointment: data.dateofAppointment, // Use the actual Firestore data
            petName: data.petName || petData.petName || "N/A",
            species: petData.Species || "N/A",
            breed: petData.Breed || "N/A",
            age: calculateAge(petData.dateofBirth),
            owner: ownerName,
            service: data.serviceType || "N/A",
            remarks: data.remarks || "",
          });
        }
  
        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut(getAuth());
      setIsSignOutConfirmOpen(false);
      setIsSignOutSuccessOpen(true);
      setTimeout(() => {
        setIsSignOutSuccessOpen(false);
        navigate("/Home");
      }, 2000);
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSignOutConfirmOpen(false);
    }
  };

  const openRemarksModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNewRemark(appointment.remarks || "");
    setShowRemarksModal(true);
  };

  const handleRemarkChange = (e) => {
    setNewRemark(e.target.value);
  };

  const saveRemark = async () => {
    if (selectedAppointment) {
      try {
        const appointmentRef = doc(db, "appointments", selectedAppointment.id);
        await updateDoc(appointmentRef, { remarks: newRemark });
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === selectedAppointment.id ? { ...appt, remarks: newRemark } : appt
          )
        );
        setShowRemarksModal(false);
        setSelectedAppointment(null);
        setNewRemark("");
      } catch (error) {
        console.error("Error updating remark:", error);
      }
    }
  };

  useEffect(() => {
    fetchVetInfo();
    fetchAppointments();
  }, []);

  return (
    <div className="vet-container">
      <div className="sidebar-v">
        {vetInfo && (
          <div className="vet-sidebar-panel">
            <div className="vet-img-container">
              <img
                src={vetInfo.profileImageURL}
                alt="Vet Profile"
                className="veterinarian-profile-image"
              />
              <label htmlFor="vet-image-upload" className="edit-icon">
                <FaCamera />
              </label>
              <input
                type="file"
                id="vet-image-upload"
                accept="image/jpeg, image/jpg, image/png"
                onChange={handleVetImageChange}
                style={{ display: "none" }}
              />
            </div>
            <button
              className={activePanel === "vetInfo" ? "active" : ""}
              onClick={() => setActivePanel("vetInfo")}
            >
              {vetInfo.FirstName} {vetInfo.LastName}
            </button>
          </div>
        )}
        <div className="sidebar-buttons-v">
          <button
            className={activePanel === "appointments" ? "active" : ""}
            onClick={() => setActivePanel("appointments")}
          >
            Upcoming Appointments
          </button>
          <button
            className={activePanel === "schedule" ? "active" : ""}
            onClick={() => setActivePanel("schedule")}
          >
            Schedule
          </button>
        </div>
        <button className="signout-btn-v" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="content">
        <div className="panel-container">
          {activePanel === "vetInfo" && vetInfo && (
            <div className="panel vet-info-panel">
              <h3>Veterinarian Information</h3>
              <div className="vet-details">
                <img
                  src={vetInfo.profileImageURL}
                  alt="Veterinarian"
                  className="vet-info-img"
                />
                <p><strong>First Name:</strong> {vetInfo.FirstName}</p>
                <p><strong>Last Name:</strong> {vetInfo.LastName}</p>
                <p><strong>Clinic:</strong> {vetInfo.clinicName}</p>
                <p><strong>Contact:</strong> {vetInfo.contactNumber || "N/A"}</p>
                <p><strong>Email:</strong> {vetInfo.email}</p>
                <button
                  className="edit-vet-btn"
                  onClick={() => {
                    setShowVetModal(true);
                    setIsEditingVet(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}

          {activePanel === "appointments" && (
            <div className="panel appointments-panel">
              <h3>Upcoming Appointments</h3>
              {loading ? (
                <p>Loading appointments...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date of Appointment</th>
                      <th>Pet Name</th>
                      <th>Species</th>
                      <th>Breed</th>
                      <th>Age</th>
                      <th>Owner</th>
                      <th>Service</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length > 0 ? (
                      appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td>{formatDate(appt.dateofAppointment)}</td>
                          <td>{appt.petName}</td>
                          <td>{appt.species}</td>
                          <td>{appt.breed}</td>
                          <td>{appt.age}</td>
                          <td>{appt.owner}</td>
                          <td>{appt.service}</td>
                          <td>
                            {appt.remarks || "N/A"}
                            <FaEdit
                              className="edit-remark-icon"
                              onClick={() => openRemarksModal(appt)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">No upcoming appointments</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activePanel === "schedule" && (
            <div className="panel schedule-panel">
              <h3>Schedule</h3>
              <table>
                <thead>
                  <tr>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                    <th>Saturday</th>
                    <th>Sunday</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                      const sched = schedule.find((s) => s.day === day);
                      return (
                        <td key={day}>
                          {sched ? `${sched.startTime} - ${sched.endTime}` : "N/A"}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showVetModal && vetInfo && (
        <div className="modal-overlay">
          <div className="modal-content-v">
            <span
              className="close-button"
              onClick={() => {
                setShowVetModal(false);
                setIsEditingVet(false);
              }}
            >
              ×
            </span>
            {isEditingVet ? (
              <>
                <h2>Edit Veterinarian Information</h2>
                <div className="vet-image-upload-container">
                  <label
                    htmlFor="vet-image-upload-modal"
                    className="vet-image-upload"
                    style={
                      vetImagePreview
                        ? { backgroundImage: `url(${vetImagePreview})` }
                        : { backgroundImage: `url(${editedVetInfo.profileImageURL})` }
                    }
                  >
                    {!vetImagePreview && !editedVetInfo.profileImageURL && (
                      <>
                        <FaCamera className="camera-icon" />
                        <p>Upload Photo</p>
                      </>
                    )}
                    <input
                      type="file"
                      id="vet-image-upload-modal"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleVetImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="FirstName">First Name</label>
                  <input
                    type="text"
                    id="FirstName"
                    name="FirstName"
                    value={editedVetInfo.FirstName}
                    onChange={handleVetInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="LastName">Last Name</label>
                  <input
                    type="text"
                    id="LastName"
                    name="LastName"
                    value={editedVetInfo.LastName}
                    onChange={handleVetInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    type="text"
                    id="contactNumber"
                    name="contactNumber"
                    value={editedVetInfo.contactNumber}
                    onChange={handleVetInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editedVetInfo.email}
                    readOnly
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="submit-btn"
                    onClick={handleSaveVetInfo}
                    disabled={isUpdatingVet}
                  >
                    {isUpdatingVet ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowVetModal(false);
                      setIsEditingVet(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={vetInfo.profileImageURL}
                  alt="Veterinarian"
                  className="vet-info-img"
                />
                <h2>{vetInfo.FirstName} {vetInfo.LastName}</h2>
                <p><strong>Clinic:</strong> {vetInfo.clinicName}</p>
                <p><strong>Contact:</strong> {vetInfo.contactNumber || "N/A"}</p>
                <p><strong>Email:</strong> {vetInfo.email}</p>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowVetModal(false)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isSignOutConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content signout-confirm-modal">
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
          <div className="modal-content signout-success-modal">
            <div className="success-content">
              <img
                src="/images/check.gif"
                alt="Success Checkmark"
                className="success-image"
              />
              <p>Signed Out Successfully</p>
            </div>
          </div>
        </div>
      )}

      {showRemarksModal && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span
              className="close-button"
              onClick={() => setShowRemarksModal(false)}
            >
              ×
            </span>
            <h2>Add/Edit Remark for {selectedAppointment.petName}</h2>
            <div className="form-group">
              <label htmlFor="remark">Remark</label>
              <textarea
                id="remark"
                value={newRemark}
                onChange={handleRemarkChange}
                rows="4"
                style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
              />
            </div>
            <div className="form-actions">
              <button className="submit-btn" onClick={saveRemark}>
                Save
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowRemarksModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinaryHome;