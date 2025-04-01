import React, { useState, useEffect, useRef } from "react";
import "./VeterinaryHome.css";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { FaCamera, FaTrash, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Month,
  Agenda,
  Inject,
} from "@syncfusion/ej2-react-schedule";
import { registerLicense } from "@syncfusion/ej2-base";

import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";

const VeterinaryHome = () => {
  registerLicense(
    "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
  );

  const [activePanel, setActivePanel] = useState("appointments");
  const [vetInfo, setVetInfo] = useState(null);
  const [editedVetInfo, setEditedVetInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
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
  const [completionRemark, setCompletionRemark] = useState("");
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const scheduleObj = useRef(null);

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).replace(",", ",");
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const dob = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return "N/A";
    const today = new Date("2025-03-24");
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? `${age}` : "N/A";
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  };

  const generateScheduleEvents = (scheduleData) => {
    if (!scheduleData?.length) return [];
    const dayToNumber = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 0,
    };
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    return scheduleData.map((sched, index) => {
      const dayNumber = dayToNumber[sched.day];
      if (!sched.day || !sched.startTime || !sched.endTime || !dayNumber) return null;

      const start = parseTime(sched.startTime);
      const end = parseTime(sched.endTime);

      const startDate = new Date(firstDayOfWeek);
      startDate.setDate(firstDayOfWeek.getDate() + dayNumber);
      startDate.setHours(start.hours, start.minutes, 0, 0);

      const endDate = new Date(firstDayOfWeek);
      endDate.setDate(firstDayOfWeek.getDate() + dayNumber);
      endDate.setHours(end.hours, end.minutes, 0, 0);

      const recurrenceRule = `FREQ=WEEKLY;BYDAY=${sched.day.slice(0, 2).toUpperCase()};INTERVAL=1`;

      return {
        Id: `schedule-${index}`,
        Subject: `Available: ${sched.startTime} - ${sched.endTime}`,
        StartTime: startDate,
        EndTime: endDate,
        RecurrenceRule: recurrenceRule,
        IsAllDay: false,
        IsReadonly: true,
      };
    }).filter(Boolean);
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
    setEditedVetInfo({ ...editedVetInfo, [e.target.name]: e.target.value });
  };

  const fetchVetInfo = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const vetRef = doc(db, "users", user.uid);
        const vetDoc = await getDoc(vetRef);
        if (vetDoc.exists()) {
          const vetData = vetDoc.data();
          const clinicName = (await getDoc(vetData.clinic || doc(db, "clinics", "default"))).data()?.clinicName || "N/A";
          const vetInfoData = {
            id: vetDoc.id,
            FirstName: vetData.FirstName || "",
            LastName: vetData.LastName || "",
            clinicName: clinicName,
            contactNumber: vetData.contactNumber || "",
            email: vetData.email || "",
            profileImageURL: vetData.profileImageURL || DEFAULT_VET_IMAGE,
            schedule: vetData.schedule || [],
          };
          setVetInfo(vetInfoData);
          setEditedVetInfo(vetInfoData);
          setSchedule(vetInfoData.schedule);
          setScheduleEvents(generateScheduleEvents(vetInfoData.schedule));
        }
      }
    } catch (error) {
      console.error("Error fetching vet info:", error);
    }
  };

  const handleSaveVetInfo = async () => {
    try {
      setIsUpdatingVet(true);
      const user = auth.currentUser;
      if (user) {
        const vetRef = doc(db, "users", user.uid);
        let profileImageURL = editedVetInfo.profileImageURL;

        if (newVetImage && ["image/jpeg", "image/jpg", "image/png"].includes(newVetImage.type)) {
          const formData = new FormData();
          formData.append("file", newVetImage);
          formData.append("cloud_name", "dfgnexrda");
          formData.append("upload_preset", UPLOAD_PRESET);

          const response = await fetch("https://api.cloudinary.com/v1_1/dfgnexrda/image/upload", { method: "POST", body: formData });
          if (!response.ok) throw new Error("Image upload failed");
          profileImageURL = (await response.json()).url;
        }

        await updateDoc(vetRef, {
          FirstName: editedVetInfo.FirstName,
          LastName: editedVetInfo.LastName,
          contactNumber: editedVetInfo.contactNumber,
          profileImageURL: profileImageURL,
        });

        setVetInfo({ ...editedVetInfo, profileImageURL: profileImageURL });
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
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "appointments"), where("veterinarianId", "==", user.uid), where("status", "==", "Accepted"));
        const querySnapshot = await getDocs(q);
        const appointmentsList = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const [petData, ownerData] = await Promise.all([
            data.petRef ? getDoc(data.petRef) : Promise.resolve(null),
            data.owner ? getDoc(data.owner) : Promise.resolve(null),
          ]);

          const startTime = data.dateofAppointment.toDate();
          return {
            Id: doc.id,
            Subject: `${data.petName || petData?.data()?.petName || "N/A"} - ${data.serviceType || "N/A"}`,
            StartTime: startTime,
            EndTime: new Date(startTime.getTime() + 60 * 60 * 1000),
            petName: data.petName || petData?.data()?.petName || "N/A",
            species: petData?.data()?.Species || "N/A",
            breed: petData?.data()?.Breed || "N/A",
            age: calculateAge(petData?.data()?.dateofBirth),
            owner: ownerData?.data() ? `${ownerData.data().FirstName || ""} ${ownerData.data().LastName || ""}`.trim() || "N/A" : "N/A",
            service: data.serviceType || "N/A",
            notes: data.notes || "No Notes",
            dateofAppointment: startTime,
          };
        }));

        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPastAppointments = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "pastAppointments"), where("veterinarianId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const appointmentsList = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const [petData, ownerData] = await Promise.all([
            data.petRef ? getDoc(data.petRef) : Promise.resolve(null),
            data.owner ? getDoc(data.owner) : Promise.resolve(null),
          ]);

          return {
            Id: doc.id,
            petName: data.petName || "N/A",
            owner: ownerData?.data() ? `${ownerData.data().FirstName || ""} ${ownerData.data().LastName || ""}`.trim() || "N/A" : "N/A",
            service: data.serviceType || "N/A",
            notes: data.notes || "No Notes",
            dateofAppointment: data.dateofAppointment.toDate(),
            completionRemark: data.completionRemark || "No completion remark",
          };
        }));

        setPastAppointments(appointmentsList.sort((a, b) => b.dateofAppointment - a.dateofAppointment));
      }
    } catch (error) {
      console.error("Error fetching past appointments:", error);
      setPastAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => setIsSignOutConfirmOpen(true);

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

  const completeAppointment = async () => {
    if (selectedAppointment) {
      try {
        const appointmentRef = doc(db, "appointments", selectedAppointment.Id);
        const appointmentDoc = await getDoc(appointmentRef);
        if (!appointmentDoc.exists()) throw new Error("Appointment not found");

        const data = appointmentDoc.data();
        await addDoc(collection(db, "pastAppointments"), {
          ...data,
          status: "Completed",
          completionRemark: completionRemark || "No completion remark",
          timestampCompleted: new Date().toISOString(),
        });

        await deleteDoc(appointmentRef);
        setAppointments(appointments.filter(appt => appt.Id !== selectedAppointment.Id));
        await fetchPastAppointments();

        setShowRemarksModal(false);
        setShowDetailsModal(false);
        setCompletionRemark("");
        setSelectedAppointment(null);
        alert("Appointment completed successfully!");
      } catch (error) {
        console.error("Error completing appointment:", error);
        alert("Failed to complete the appointment. Please try again.");
      }
    }
  };

  const onEventClick = (args) => {
    const appointment = appointments.find(appt => appt.Id === args.event.Id);
    setAppointmentDetails(appointment);
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const onCellClick = (args) => args.cancel = true;

  useEffect(() => {
    fetchVetInfo();
    fetchAppointments();
    fetchPastAppointments();
  }, []);

  return (
    <div className="vet-container-v">
      <div className="sidebar-v">
        {vetInfo && (
          <div className="vet-sidebar-panel-v">
            <div className="vet-img-container-v">
              <img src={vetInfo.profileImageURL} alt="Vet Profile" className="veterinarian-profile-image-v" />
              <label htmlFor="vet-image-upload-v" className="edit-icon-v">
                <FaCamera />
              </label>
              <input
                type="file"
                id="vet-image-upload-v"
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
          <button
            className={activePanel === "healthRecords" ? "active" : ""}
            onClick={() => setActivePanel("healthRecords")}
          >
            Health Records
          </button>
        </div>
        <button className="signout-btn-v" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="content-v">
        <div className="panel-container-v">
          {activePanel === "vetInfo" && vetInfo && (
            <div className="panel-v vet-info-panel-v">
              <h3>Veterinarian Information</h3>
              <div className="vet-details-v">
                <img src={vetInfo.profileImageURL} alt="Veterinarian" className="vet-info-img-v" />
                <p><strong>First Name:</strong> {vetInfo.FirstName}</p>
                <p><strong>Last Name:</strong> {vetInfo.LastName}</p>
                <p><strong>Clinic:</strong> {vetInfo.clinicName}</p>
                <p><strong>Contact:</strong> {vetInfo.contactNumber || "N/A"}</p>
                <p><strong>Email:</strong> {vetInfo.email}</p>
                <button
                  className="edit-vet-btn-v"
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
            <div className="panel-v appointments-panel-v">
              <h3>Upcoming Appointments</h3>
              {loading ? (
                <p>Loading appointments...</p>
              ) : (
                <ScheduleComponent
                  ref={scheduleObj}
                  width="100%"
                  height="650px"
                  currentDate={new Date()}
                  eventSettings={{
                    dataSource: appointments,
                    fields: {
                      id: "Id",
                      subject: { name: "Subject" },
                      startTime: { name: "StartTime" },
                      endTime: { name: "EndTime" },
                    },
                  }}
                  eventClick={onEventClick}
                  cellClick={onCellClick}
                  popupOpen={(args) => args.cancel = true}
                  readOnly={true}
                >
                  <ViewsDirective>
                    <ViewDirective option="Month" />
                    <ViewDirective option="Agenda" />
                  </ViewsDirective>
                  <Inject services={[Month, Agenda]} />
                </ScheduleComponent>
              )}
            </div>
          )}

          {activePanel === "schedule" && (
            <div className="panel-v schedule-panel-v">
              <h3>Schedule</h3>
              {loading ? (
                <p>Loading schedule...</p>
              ) : (
                <ScheduleComponent
                  width="100%"
                  height="650px"
                  currentDate={new Date(2025, 2, 24)}
                  eventSettings={{
                    dataSource: scheduleEvents,
                    fields: {
                      id: "Id",
                      subject: { name: "Subject" },
                      startTime: { name: "StartTime" },
                      endTime: { name: "EndTime" },
                      recurrenceRule: { name: "RecurrenceRule" },
                    },
                  }}
                  readOnly={true}
                  cellClick={onCellClick}
                >
                  <ViewsDirective>
                    <ViewDirective option="Month" />
                    <ViewDirective option="Agenda" />
                  </ViewsDirective>
                  <Inject services={[Month, Agenda]} />
                </ScheduleComponent>
              )}
            </div>
          )}

          {activePanel === "healthRecords" && (
            <div className="panel-v health-records-panel-v">
              <h3>Health Records</h3>
              {loading ? (
                <p>Loading health records...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date of Appointment</th>
                      <th>Patient Name</th>
                      <th>Owner</th>
                      <th>Service</th>
                      <th>Completion Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppointments.length > 0 ? (
                      pastAppointments.map((record) => (
                        <tr key={record.Id}>
                          <td>{formatDate(record.dateofAppointment)}</td>
                          <td>{record.petName}</td>
                          <td>{record.owner}</td>
                          <td>{record.service}</td>
                          <td>{record.completionRemark || "N/A"}</td>
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

      {showVetModal && vetInfo && (
        <div className="modal-overlay-v">
          <div className="modal-content-v">
            <span
              className="close-button-v"
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
                <div className="vet-image-upload-container-v">
                  <label
                    htmlFor="vet-image-upload-modal-v"
                    className="vet-image-upload-v"
                    style={{
                      backgroundImage: `url(${vetImagePreview || editedVetInfo.profileImageURL})`,
                    }}
                  >
                    {!vetImagePreview && !editedVetInfo.profileImageURL && (
                      <>
                        <FaCamera className="camera-icon-v" />
                        <p>Upload Photo</p>
                      </>
                    )}
                    <input
                      type="file"
                      id="vet-image-upload-modal-v"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleVetImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <div className="form-group-v">
                  <label htmlFor="FirstName">First Name</label>
                  <input
                    type="text"
                    id="FirstName"
                    name="FirstName"
                    value={editedVetInfo.FirstName}
                    onChange={handleVetInputChange}
                  />
                </div>
                <div className="form-group-v">
                  <label htmlFor="LastName">Last Name</label>
                  <input
                    type="text"
                    id="LastName"
                    name="LastName"
                    value={editedVetInfo.LastName}
                    onChange={handleVetInputChange}
                  />
                </div>
                <div className="form-group-v">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    type="text"
                    id="contactNumber"
                    name="contactNumber"
                    value={editedVetInfo.contactNumber}
                    onChange={handleVetInputChange}
                  />
                </div>
                <div className="form-group-v">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editedVetInfo.email}
                    readOnly
                  />
                </div>
                <div className="form-actions-v">
                  <button
                    className="submit-btn-v"
                    onClick={handleSaveVetInfo}
                    disabled={isUpdatingVet}
                  >
                    {isUpdatingVet ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-btn-v"
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
                  className="vet-info-img-v"
                />
                <h2>{vetInfo.FirstName} {vetInfo.LastName}</h2>
                <p><strong>Clinic:</strong> {vetInfo.clinicName}</p>
                <p><strong>Contact:</strong> {vetInfo.contactNumber || "N/A"}</p>
                <p><strong>Email:</strong> {vetInfo.email}</p>
                <button
                  className="modal-close-btn-v"
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
        <div className="modal-overlay-v">
          <div className="modal-content-v signout-confirm-modal-v">
            <p>Are you sure you want to sign out?</p>
            <div className="form-actions-v">
              <button className="submit-btn-v" onClick={confirmSignOut}>
                Yes
              </button>
              <button
                className="cancel-btn-v"
                onClick={() => setIsSignOutConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSignOutSuccessOpen && (
        <div className="modal-overlay-v">
          <div className="modal-content-v signout-success-modal-v">
            <div className="success-content-v">
              <img
                src="/images/check.gif"
                alt="Success Checkmark"
                className="success-image-v"
              />
              <p>Signed Out Successfully</p>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && appointmentDetails && (
        <div className="modal-overlay-v">
          <div className="modal-content-v">
            <span className="close-button-v" onClick={() => setShowDetailsModal(false)}>
              ×
            </span>
            <h2>Appointment Details</h2>
            <div className="appointment-info-grid-v">
              <div className="info-item-v">
                <strong>Patient Name:</strong> {appointmentDetails.petName}
              </div>
              <div className="info-item-v">
                <strong>Owner:</strong> {appointmentDetails.owner}
              </div>
              <div className="info-item-v">
                <strong>Date & Time:</strong> {formatDate(appointmentDetails.dateofAppointment)}
              </div>
              <div className="info-item-v">
                <strong>Service:</strong> {appointmentDetails.service}
              </div>
              <div className="info-item-v">
                <strong>Species:</strong> {appointmentDetails.species}
              </div>
              <div className="info-item-v">
                <strong>Breed:</strong> {appointmentDetails.breed}
              </div>
              <div className="info-item-v">
                <strong>Age:</strong> {appointmentDetails.age}
              </div>
            </div>
            <div className="appointment-notes-v">
              <strong>Notes:</strong>
              <p>{appointmentDetails.notes || "No notes available"}</p>
            </div>
            <div className="modal-actions-v">
              <button
                className="submit-btn-v"
                onClick={() => setShowRemarksModal(true)}
              >
                Complete Appointment
              </button>
              <button
                className="modal-close-btn-v"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>

            {showRemarksModal && selectedAppointment && (
              <div className="remarks-overlay-v">
                <div className="remarks-content-v">
                  <span
                    className="remarks-close-button-v"
                    onClick={() => {
                      setShowRemarksModal(false);
                      setCompletionRemark("");
                    }}
                  >
                    ×
                  </span>
                  <h3>Complete Appointment for {selectedAppointment.petName}</h3>
                  <div className="form-group-v">
                    <label htmlFor="completionRemark">Completion Remark</label>
                    <textarea
                      id="completionRemark"
                      value={completionRemark}
                      onChange={(e) => setCompletionRemark(e.target.value)}
                      rows="4"
                      className="remarks-textarea-v"
                      placeholder="Enter completion remarks..."
                    />
                  </div>
                  <div className="form-actions-v">
                    <button className="submit-btn-v" onClick={completeAppointment}>
                      Save and Complete
                    </button>
                    <button
                      className="cancel-btn-v"
                      onClick={() => {
                        setShowRemarksModal(false);
                        setCompletionRemark("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinaryHome;