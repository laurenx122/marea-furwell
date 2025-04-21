import React, { useState, useEffect, useRef } from "react";
import "./VeterinaryHome.css";
import Mobile_Footer from '../../components/Footer/Mobile_Footer';
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { FaCamera, FaTrash, FaCheck, FaBell, FaTimes, FaUser, FaCalendarAlt, FaFileMedical, FaHome, FaEnvelope, FaPlus, FaClock, FaSignOutAlt } from "react-icons/fa";
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

  useEffect(() => {
    const hideLicenseNotification = () => {
      const notificationDiv = document.querySelector('div[style*="position: fixed"][style*="z-index: 999999999"]');
      if (notificationDiv) {
        notificationDiv.style.display = 'none';
      }
    };

    hideLicenseNotification();

    const observer = new MutationObserver((mutations) => {
      hideLicenseNotification();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  const [activePanel, setActivePanel] = useState("appointments");
  const [vetInfo, setVetInfo] = useState(null);
  const [editedVetInfo, setEditedVetInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
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

  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); 

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const scheduleObj = useRef(null);


  useEffect(() => {
    let unsubscribe;
  
    const initializeComponent = async () => {
      setLoading(true);
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            await fetchVetInfo();
          } catch (error) {
            console.error("Error fetching vet info:", error);
          }
        } else {
          navigate("/Home");
          setLoading(false);
        }
      });
    };
  
    initializeComponent();
  
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);
  
  //useEffect for OutsideClicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const sidebar = document.querySelector(".sidebar-v");
      const hamburgerButton = e.target.closest('.mobile-header-v button');
      
      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target) &&
        !hamburgerButton 
      ) {
        setIsSidebarOpen(false);
      }
  
      const profileModal = document.querySelector(".profile-modal-v");
      const headerProfileImg = e.target.closest(".profile-navbar-v");
  
      if (
        isProfileModalOpen &&
        profileModal &&
        !profileModal.contains(e.target) &&
        !headerProfileImg 
      ) {
        setIsProfileModalOpen(false);
      }
    };
  
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isSidebarOpen, isProfileModalOpen]);

  // useEffect to fetch appointments, notifications, and set up interval after vetInfo is set
  useEffect(() => {
    if (vetInfo?.clinicId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          console.log("Fetching data with clinicId:", vetInfo.clinicId);
          await Promise.all([fetchAppointments(), fetchNotifications()]);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
  
      // Set up interval for notifications
      const notificationInterval = setInterval(() => {
        console.log("Polling notifications for clinicId:", vetInfo.clinicId);
        fetchNotifications();
      }, 300000); // 5 minutes
  
      return () => clearInterval(notificationInterval);
    }
  }, [vetInfo?.clinicId]);


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

  const handleAccountClick = () => {
    setActivePanel("vetInfo");
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

  const handleNotificationClick = async () => {
    setShowNotificationsModal(true);
    if (unreadNotifications) {
      try {
        const unreadNotifications = notifications.filter(n => !n.hasVetOpened);
        for (const notification of unreadNotifications) {
          const notificationRef = doc(db, "notifications", notification.id);
          await updateDoc(notificationRef, { hasVetOpened: true });
        }
        setNotifications(notifications.map(n => ({ ...n, hasVetOpened: true })));
        setUnreadNotifications(false);
      } catch (error) {
        console.error("Error updating notifications:", error);
      }
    }
  };

  const handleDeleteNotificationClick = (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteNotification = async () => {
    try {
      const notificationRef = doc(db, "notifications", notificationToDelete);
      await updateDoc(notificationRef, { removeViewVet: true }); // Add removeViewVet field
      setNotifications(notifications.filter(n => n.id !== notificationToDelete));
      setShowDeleteConfirmModal(false);
      setNotificationToDelete(null);
      setUnreadNotifications(notifications.filter(n => n.id !== notificationToDelete).some(n => !n.hasVetOpened));
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Failed to delete notification. Please try again.");
    }
  };

  const fetchNotifications = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && vetInfo?.clinicId) {
        console.log("Fetching notifications for clinicId:", vetInfo.clinicId);
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("clinicId", "==", vetInfo.clinicId),
          where("type", "==", "appointment_accepted")
        );
        const querySnapshot = await getDocs(notificationsQuery);
        const notificationsList = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          if (data.removeViewVet !== true) {
            const clinicDoc = await getDoc(doc(db, "clinics", data.clinicId));
            const appointmentDoc = await getDoc(doc(db, "appointments", data.appointmentId));
            const notification = {
              id: docSnap.id,
              clinicProfileImageURL: clinicDoc.exists() ? clinicDoc.data().profileImageURL : DEFAULT_VET_IMAGE,
              clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
              dateofAppointment: appointmentDoc.exists() ? appointmentDoc.data().dateofAppointment.toDate() : null,
              hasVetOpened: data.hasVetOpened,
              message: data.messageVet, // Use messageVet if available
            };
            console.log("Notification:", notification);
            return notification;
          }
          return null;
        }));
        const filteredNotifications = notificationsList.filter(n => n !== null);
        console.log("Filtered Notifications:", filteredNotifications);
        setNotifications(filteredNotifications);
        const hasUnread = filteredNotifications.some(n => !n.hasVetOpened);
        console.log("Has Unread Notifications (hasVetOpened: false):", hasUnread);
        setUnreadNotifications(hasUnread);
      } else {
        console.log("Skipping fetch: currentUser or vetInfo.clinicId missing");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadNotifications(false);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      appointment.petName.toLowerCase().includes(searchLower) ||
      appointment.owner.toLowerCase().includes(searchLower) ||
      appointment.service.toLowerCase().includes(searchLower) ||
      appointment.status.toLowerCase().includes(searchLower)
    );
  });

  const fetchVetInfo = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const vetRef = doc(db, "users", user.uid);
        const vetDoc = await getDoc(vetRef);
        if (vetDoc.exists()) {
          const vetData = vetDoc.data();
          const clinicRef = vetData.clinic; // Assuming this is a reference
          const clinicDoc = clinicRef ? await getDoc(clinicRef) : null;
          const clinicName = clinicDoc?.data()?.clinicName || "N/A";
          const clinicId = clinicRef?.id || "N/A"; // Extract clinicId
          const vetInfoData = {
            id: vetDoc.id,
            FirstName: vetData.FirstName || "",
            LastName: vetData.LastName || "",
            clinicName: clinicName,
            clinicId: clinicId,
            contactNumber: vetData.contactNumber || "",
            email: vetData.email || "",
            profileImageURL: vetData.profileImageURL || DEFAULT_VET_IMAGE,
            schedule: vetData.schedule || [],
          };
          console.log("Vet Info Fetched:", vetInfoData);
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
        const q = query(collection(db, "appointments"), where("veterinarianId", "==", user.uid));
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
            type: petData?.data()?.Type || "N/A",
            breed: petData?.data()?.Breed || "N/A",
            age: calculateAge(petData?.data()?.dateofBirth),
            owner: ownerData?.data() ? `${ownerData.data().FirstName || ""} ${ownerData.data().LastName || ""}`.trim() || "N/A" : "N/A",
            service: data.serviceType || "N/A",
            notes: data.notes || "No Notes",
            dateofAppointment: startTime,
            status: data.status || "Accepted",
            completionRemark: data.completionRemark || "",
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
  
        await updateDoc(appointmentRef, {
          status: "Completed",
          completionRemark: completionRemark || "No completion remark",
        });
  
        setAppointments(appointments.map(appt => 
          appt.Id === selectedAppointment.Id 
            ? { ...appt, status: "Completed", completionRemark: completionRemark || "No completion remark" }
            : appt
        ));
  
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
  }, []);

  // FOR RELOAD I COMMENTED THIS
  // useEffect(() => {
  //   if (vetInfo?.clinicId) {
  //     fetchNotifications();
  //   }
  // }, [vetInfo?.clinicId]);

  return (
      <div className="vet-container-v">
        <div className="mobile-header-v">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰ {/* Hamburger icon */}
          </button>
          {vetInfo && (
            <div
              className="profile-navbar-v"
              onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
            >
              <img
                src={vetInfo.profileImageURL || DEFAULT_VET_IMAGE}
                alt="Vet Profile"
                className="navbar-profile-img-v"
              />
            </div>
          )}
        </div>
        <div className={`sidebar-v ${isSidebarOpen ? "open" : ""}`}>
          {vetInfo && (
            <div className="vet-sidebar-panel-v">
              <div className="vet-img-container-v">
                <img
                  src={vetInfo.profileImageURL || DEFAULT_VET_IMAGE}
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
              <div className="vet-notification-wrapper">
                <button
                  className={`vet-button ${activePanel === "vetInfo" ? "active" : ""}`}
                  onClick={() => {
                    setActivePanel("vetInfo");
                    setIsSidebarOpen(false);
                  }}
                >
                  <FaUser className="sidebar-icon-v" />
                  {vetInfo.FirstName} {vetInfo.LastName}
                </button>
                <button className="notification-btn-v" onClick={handleNotificationClick}>
                  <div className="notification-icon-container-v">
                    <FaBell className="bell-notif" />
                    {unreadNotifications && <span className="notification-dot-v"></span>}
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-buttons-v">
            <button
              className={`sidebar-btn-v ${activePanel === "appointments" ? "active" : ""}`}
              onClick={() => {
                setActivePanel("appointments");
                setIsSidebarOpen(false);
              }}
            >
              <FaCalendarAlt className="sidebar-icon-v" />
              Upcoming Appointments
            </button>
            <button
              className={`sidebar-btn-v ${activePanel === "schedule" ? "active" : ""}`}
              onClick={() => {
                setActivePanel("schedule");
                setIsSidebarOpen(false);
              }}
            >
              <FaClock className="sidebar-icon-v" />
              Schedule
            </button>
            <button
              className={`sidebar-btn-v ${activePanel === "healthRecords" ? "active" : ""}`}
              onClick={() => {
                setActivePanel("healthRecords");
                setIsSidebarOpen(false);
              }}
            >
              <FaFileMedical className="sidebar-icon-v" />
              Health Records
            </button>
          </div>
          <button className="signout-btn-v" onClick={handleSignOut}>
              <FaSignOutAlt className="sidebar-icon-v" />
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
                    dataSource: appointments.filter(appt => appt.status === "Accepted"),
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
                <div className="search-bar-container-v">
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
                    {appointments
                      .filter(appt => appt.status === "Completed") // Filter only completed appointments
                      .filter(appt => {
                        const searchLower = searchQuery.toLowerCase();
                        return (
                          appt.petName.toLowerCase().includes(searchLower) ||
                          appt.owner.toLowerCase().includes(searchLower) ||
                          appt.service.toLowerCase().includes(searchLower) ||
                          appt.completionRemark.toLowerCase().includes(searchLower)
                        );
                      }) // Apply search query to completed appointments
                      .map(record => (
                        <tr key={record.Id}>
                          <td>{formatDate(record.dateofAppointment)}</td>
                          <td>{record.petName}</td>
                          <td>{record.owner}</td>
                          <td>{record.service}</td>
                          <td>{record.completionRemark || "N/A"}</td>
                        </tr>
                      ))
                    }
                    {appointments.filter(appt => appt.status === "Completed").length === 0 && (
                      <tr>
                        <td colSpan="5">No completed appointments found</td>
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

      {showNotificationsModal && (
        <div className="modal-overlay-v">
          <div className="modal-content-v notifications-modal-v">
            <span className="close-button-v" onClick={() => setShowNotificationsModal(false)}>×</span>
            <h2>Notifications</h2>
            {notifications.length > 0 ? (
              <div className="notifications-list-v">
                {notifications.map((notification) => (
                  <div key={notification.id} className="notification-item-v">
                    <img
                      src={notification.clinicProfileImageURL}
                      alt="Clinic"
                      className="notification-clinic-img-v"
                    />
                    <p>
                      {notification.message}
                    </p>
                    <FaTimes
                      className="delete-notification-icon-v"
                      onClick={() => handleDeleteNotificationClick(notification.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>No notifications available.</p>
            )}
            <div className="modal-actions-v">
              <button
                className="modal-close-btn-v"
                onClick={() => setShowNotificationsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="modal-overlay-v">
          <div className="modal-content-v delete-confirm-modal-v">
            <p>Are you sure you want to remove this notification?</p>
            <div className="modal-actions-v">
              <button
                className="submit-btn-v"
                onClick={confirmDeleteNotification}
              >
                Yes
              </button>
              <button
                className="cancel-btn-v"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileModalOpen && vetInfo && (
        <div
          className="profile-modal-v"
          onClick={() => setIsProfileModalOpen(false)} 
        >
            <img
              src={vetInfo.profileImageURL || DEFAULT_VET_IMAGE}
              alt="Vet Profile"
              className="profile-modal-img-v"
            />
            <div className="profile-modal-info-v">
              <p
                className="profile-modal-name-v"
                onClick={() => {
                  setActivePanel("vetInfo"); 
                  setIsProfileModalOpen(false); 
                  setIsSidebarOpen(false); 
                }}
                style={{ cursor: "pointer" }} 
              >
                {vetInfo.FirstName} {vetInfo.LastName}
              </p>
              <button className="signout-btn-modal-v" onClick={handleSignOut}>
                <FaSignOutAlt className="sidebar-icon-v" />
                Sign Out
              </button>
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
                <strong>Type:</strong> {appointmentDetails.type}
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

      <Mobile_Footer
          onNotificationClick={handleNotificationClick}
          onAccountClick={handleAccountClick}
          activePanel={activePanel}
          unreadNotifications={unreadNotifications}
          isVeterinarian={true}
          setActivePanel={setActivePanel}
      />
    </div>
  );
};

export default VeterinaryHome;