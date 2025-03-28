import React, { useState, useEffect, useRef } from "react";
import "./VeterinaryHome.css";
import { db, auth } from "../../firebase";
import { collection, query, setDoc,where, getDocs, doc, getDoc, updateDoc,addDoc,deleteDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { FaCamera, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaCheck } from "react-icons/fa";
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Month,
  Agenda,
  Inject,
} from "@syncfusion/ej2-react-schedule";
import { registerLicense } from "@syncfusion/ej2-base";

// Import Syncfusion CSS for proper styling
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
    // process.env.SYNC_REGISTER_LICENSE
  );

  const [activePanel, setActivePanel] = useState("appointments");
  const [vetInfo, setVetInfo] = useState(null);
  const [editedVetInfo, setEditedVetInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]); // New state for past appointments
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
  const [newRemark, setNewRemark] = useState("");
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE =
    "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const scheduleObj = useRef(null);

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
    let dob;
    if (typeof dateOfBirth.toDate === "function") {
      dob = dateOfBirth.toDate();
    } else if (typeof dateOfBirth === "string") {
      dob = new Date(dateOfBirth);
    } else {
      return "N/A";
    }

    if (isNaN(dob.getTime())) return "N/A";

    const today = new Date("2025-03-24"); // Current date as per context
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
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
    if (!scheduleData || scheduleData.length === 0) return [];

    const events = [];
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

    scheduleData.forEach((sched, index) => {
      if (!sched.day || !sched.startTime || !sched.endTime) return;

      const dayNumber = dayToNumber[sched.day];
      if (dayNumber === undefined) return;

      const start = parseTime(sched.startTime);
      const end = parseTime(sched.endTime);

      const startDate = new Date(firstDayOfWeek);
      startDate.setDate(firstDayOfWeek.getDate() + dayNumber);
      startDate.setHours(start.hours, start.minutes, 0, 0);

      const endDate = new Date(firstDayOfWeek);
      endDate.setDate(firstDayOfWeek.getDate() + dayNumber);
      endDate.setHours(end.hours, end.minutes, 0, 0);

      const recurrenceRule = `FREQ=WEEKLY;BYDAY=${sched.day.slice(0, 2).toUpperCase()};INTERVAL=1`;

      events.push({
        Id: `schedule-${index}`,
        Subject: `Available: ${sched.startTime} - ${sched.endTime}`,
        StartTime: startDate,
        EndTime: endDate,
        RecurrenceRule: recurrenceRule,
        IsAllDay: false,
        IsReadonly: true,
      });
    });

    return events;
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
          const events = generateScheduleEvents(vetData.schedule || []);
          setScheduleEvents(events);
        }
      }
    } catch (error) {
      console.error("Error fetching vet info:", error);
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

  //pending appointments
 
  const fetchPendingAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const pendingAppointmentsQuery = query(
          collection(db, "pendingAppointments"),
          where("veterinarianId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(pendingAppointmentsQuery);
  
        // Map over the documents and resolve references
        const pendingAppointmentsList = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
  
            // Resolve the owner reference
            const ownerRef = data.owner;
            let ownerData = {};
            if (ownerRef) {
              const ownerDoc = await getDoc(ownerRef);
              ownerData = ownerDoc.exists() ? ownerDoc.data() : {};
            }
  
            // Resolve the pet reference
            const petRef = data.petRef;
            let petData = {};
            if (petRef) {
              const petDoc = await getDoc(petRef);
              petData = petDoc.exists() ? petDoc.data() : {};
            }
  
            // Resolve the clinic reference
            const clinicRef = data.clinic;
            let clinicData = {};
            if (clinicRef) {
              const clinicDoc = await getDoc(clinicRef);
              clinicData = clinicDoc.exists() ? clinicDoc.data() : {};
            }
  
            return {
              id: doc.id,
              ...data,
              owner: ownerData, // Replace the reference with actual data
              petRef: petData, // Replace the reference with actual data
              clinic: clinicData, // Replace the reference with actual data
            };
          })
        );
        console.log("Fetched pendingAppointments:", pendingAppointmentsList); // Log the fetched data
        setPendingAppointments(pendingAppointmentsList);
      }
  
  setLoading(false);
    } catch (error) {
      console.error("Error fetching pending appointments:", error);
    } finally {
      setLoading(false);
    }
  };
 //searchQuery in pending
 const [searchQuery, setSearchQuery] = useState("");

 const filteredPendingAppointments = pendingAppointments.filter((appointment) => {
   const ownerName = `${appointment.owner?.FirstName || ""} ${appointment.owner?.LastName || ""}`.trim() || "N/A";
   return (
     (appointment.petName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
     ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (appointment.serviceType?.toLowerCase() || "").includes(searchQuery.toLowerCase())
   );
 });
 const handleApproveAppointment = async (appointmentId) => {
  try {
    console.log("Approving appointment with ID:", appointmentId);
    console.log("Current pendingAppointments:", pendingAppointments);

    // Find the appointment in the pendingAppointments state using the appointment ID
    const appointment = pendingAppointments.find((appt) => appt.id === appointmentId);

    if (!appointment) {
      console.error("Appointment not found in pendingAppointments");
      return;
    }

    // Rest of the function...
    const appointmentData = {
      clinic: doc(db, "clinics", appointment.clinicId),
      clinicId: appointment.clinicId,
      clinicName: appointment.clinicName,
      createdAt: appointment.createdAt,
      dateofAppointment: appointment.dateofAppointment,
      owner: doc(db, "users", appointment.petRef.owner.id),
      petId: appointment.petId,
      petName: appointment.petName,
      petRef: doc(db, "pets", appointment.petId),
      serviceType: appointment.serviceType,
      veterinarian: appointment.veterinarian,
      veterinarianId: appointment.veterinarianId,
      notes: appointment.notes || "",
      remarks: appointment.remarks || "",
    };

    const appointmentsRef = collection(db, "appointments");
    await addDoc(appointmentsRef, appointmentData);

    const pendingAppointmentRef = doc(db, "pendingAppointments", appointment.id);
    await deleteDoc(pendingAppointmentRef);

    setPendingAppointments((prev) => prev.filter((appt) => appt.id !== appointment.id));
    await fetchAppointments();

    alert("Appointment approved successfully!");
  } catch (error) {
    console.error("Error approving appointment:", error);
    alert("Failed to approve the appointment. Please try again.");
  }
};
// Add this function to handle declining an appointment
const handleDeclineAppointment = async (appointmentId) => {
  try {
    // Delete the document from the pendingAppointments collection
    const pendingAppointmentRef = doc(db, "pendingAppointments", appointmentId);
    await deleteDoc(pendingAppointmentRef);

    // Update the state to remove the declined appointment
    setPendingAppointments((prev) => prev.filter((appt) => appt.id !== appointmentId));

    alert("Appointment declined successfully!");
  } catch (error) {
    console.error("Error declining appointment:", error);
    alert("Failed to decline the appointment. Please try again.");
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
        const currentAppointmentsList = [];
        const pastAppointmentsList = [];
        const today = new Date(); // Current date as per context

        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          let petData = {};
          let ownerName = "N/A";

          if (data.petRef) {
            const petDoc = await getDoc(data.petRef);
            if (petDoc.exists()) {
              petData = petDoc.data();
            } else {
              console.warn("Pet document does not exist for petRef:", data.petRef);
            }
          }

          if (data.owner) {
            const ownerDoc = await getDoc(data.owner);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "N/A";
            }
          }

          const startTime = data.dateofAppointment.toDate();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
          const petAge = calculateAge(petData.dateofBirth);

          const appointmentDetails = {
            Id: doc.id,
            Subject: `${data.petName || petData.petName || "N/A"} - ${data.serviceType || "N/A"}`,
            StartTime: startTime,
            EndTime: endTime,
            petName: data.petName || petData.petName || "N/A",
            species: petData.Species || "N/A",
            breed: petData.Breed || "N/A",
            age: petAge,
            owner: ownerName,
            service: data.serviceType || "N/A",
            remarks: data.remarks || "No Remarks",
            notes: data.notes || "No Notes",
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
        const appointmentRef = doc(db, "appointments", selectedAppointment.Id || selectedAppointment.id);
        await updateDoc(appointmentRef, { remarks: newRemark });

        setAppointments((prev) =>
          prev.map((appt) =>
            appt.Id === selectedAppointment.Id ? { ...appt, remarks: newRemark } : appt
          )
        );
        setPastAppointments((prev) =>
          prev.map((appt) =>
            appt.Id === selectedAppointment.Id ? { ...appt, remarks: newRemark } : appt
          )
        );

        setAppointmentDetails((prev) =>
          prev && prev.Id === selectedAppointment.Id ? { ...prev, remarks: newRemark } : prev
        );

        setShowRemarksModal(false);
        setSelectedAppointment(null);
        setNewRemark("");
      } catch (error) {
        console.error("Error updating remark:", error);
      }
    }
  };

  const onEventClick = (args) => {
    const appointment = appointments.find((appt) => appt.Id === args.event.Id);
    setAppointmentDetails(appointment);
    setShowDetailsModal(true);
  };

  const onCellClick = (args) => {
    args.cancel = true;
  };

  useEffect(() => {
    fetchVetInfo();
    fetchAppointments();
    fetchPendingAppointments(); // Fetch pending appointments
  }, []);

  return (
    <div className="vet-container-v">
      <div className="sidebar-v">
        {vetInfo && (
          <div className="vet-sidebar-panel-v">
            <div className="vet-img-container-v">
              <img
                src={vetInfo.profileImageURL}
                alt="Vet Profile"
                className="veterinarian-profile-image-v"
              />
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
          <button
            className={activePanel === "pendingAppointments" ? "active" : ""}
            onClick={() => setActivePanel("pendingAppointments")}
          >
            Pending Appointments
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
                <img
                  src={vetInfo.profileImageURL}
                  alt="Veterinarian"
                  className="vet-info-img-v"
                />
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
                  cellClick={(args) => args.cancel = true}
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
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppointments.length > 0 ? (
                      [...pastAppointments] // Create a shallow copy to avoid mutating the original array
                        .sort((a, b) => b.dateofAppointment - a.dateofAppointment) // Sort by date descending
                        .map((record) => (
                          <tr key={record.Id}>
                            <td>{formatDate(record.dateofAppointment)}</td>
                            <td>{record.petName}</td>
                            <td>{record.owner}</td>
                            <td>{record.service}</td>
                            <td>{record.remarks || "N/A"}</td>
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
          {activePanel === "pendingAppointments" && (
            <div className="panel-v health-records-panel-v">
              <h3>Pending Appointments</h3>
              <form className="search-bar-container-v">
                <input
                  type="text"
                  placeholder="Search pending appointments (Pet Name, Owner, Service)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-bar-v"
                />
              </form>
              {loading ? (
                <p>Loading pending appointments...</p>
              ) : filteredPendingAppointments.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Date of Appointment</th>
                      <th>Patient Name</th>
                      <th>Owner</th>
                      <th>Breed</th>
                      <th>Age</th>
                      <th>Service</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                        {filteredPendingAppointments.map((appointment) => {
                          const ownerName = `${appointment.owner?.FirstName || ""} ${appointment.owner?.LastName || ""}`.trim() || "N/A";
                          const petAge = calculateAge(appointment.petRef?.dateofBirth);
                          console.log("Rendering appointment with ID:", appointment.id); // Add this log
                          return (
                            <tr key={appointment.id}>
                              <td>{formatDate(appointment.dateofAppointment)}</td>
                              <td>{appointment.petName || "N/A"}</td>
                              <td>{ownerName}</td>
                              <td>{appointment.petRef?.Breed || "N/A"}</td>
                              <td>{petAge}</td>
                              <td>{appointment.serviceType || "N/A"}</td>
                              <td>
                                <div className="v-actions">
                                  <button
                                    className="vicon-buttoncheck"
                                    onClick={() => handleApproveAppointment(appointment.id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="vicon-buttondelete"
                                    onClick={() => handleDeclineAppointment(appointment.id)}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p>No pending appointments found.</p>
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
                    style={
                      vetImagePreview
                        ? { backgroundImage: `url(${vetImagePreview})` }
                        : { backgroundImage: `url(${editedVetInfo.profileImageURL})` }
                    }
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
              <div className="info-item-v">
                <strong>Remarks:</strong> {appointmentDetails.remarks}
              </div>
            </div>
            <div className="appointment-notes-v">
              <strong>Notes:</strong>
              <p>{appointmentDetails.notes || "No notes available"}</p>
            </div>
            <div className="modal-actions-v">
              <button
                className="submit-btn-v"
                onClick={() => openRemarksModal(appointmentDetails)}
              >
                Edit Remark
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
                    onClick={() => setShowRemarksModal(false)}
                  >
                    ×
                  </span>
                  <h3>Add/Edit Remark for {selectedAppointment.petName}</h3>
                  <div className="form-group-v">
                    <label htmlFor="remark">Remark</label>
                    <textarea
                      id="remark"
                      value={newRemark}
                      onChange={handleRemarkChange}
                      rows="4"
                      className="remarks-textarea-v"
                    />
                  </div>
                  <div className="form-actions-v">
                    <button className="submit-btn-v" onClick={saveRemark}>
                      Save
                    </button>
                    <button
                      className="cancel-btn-v"
                      onClick={() => setShowRemarksModal(false)}
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