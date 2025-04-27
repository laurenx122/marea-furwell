import React, { useState, useEffect, useRef } from "react";
import "./PetOwnerHome.css";
import { db, auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import Mobile_Footer from '../../components/Footer/Mobile_Footer';
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import { FaUser, FaCalendarAlt, FaFileMedical, FaHome, FaEnvelope, FaPlus, FaBell, FaSignOutAlt } from "react-icons/fa";
import { MdPets } from "react-icons/md";
import {getAuth, signOut} from "firebase/auth";

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
  deleteDoc,onSnapshot,
} from "firebase/firestore";
import { FaCamera, FaTimes } from "react-icons/fa";
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Month,
  Agenda,
  Inject,
} from "@syncfusion/ej2-react-schedule";
import { registerLicense } from "@syncfusion/ej2-base";
import emailjs from "emailjs-com";

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



  const navigate = useNavigate();
  const handleBookAppointment = () => { navigate("/FindClinic"); };
  const [activePanel, setActivePanel] = useState("petDetails");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [newPet, setNewPet] = useState({
    petName: "",
    Breed: "",
    Color: "",
    Type: "",
    Gender: "",
    Weight: "",
    dateofBirth: "",
  });
  const [sentEmails, setSentEmails] = useState({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isVeterinarian, setIsVeterinarian] = useState(false);
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

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentView, setCurrentView] = useState("Month");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [clickedDate, setClickedDate] = useState(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [takenAppointments, setTakenAppointments] = useState([]);
  const [vetSchedule, setVetSchedule] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_OWNER_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";

  const petTypes = {
    Dog: ["Labrador", "Golden Retriever", "German Shepherd", "Bulldog", "Poodle", "Beagle", "Boxer", "Dachshund", "Rottweiler", "Siberian Husky", "Others"],
    Cat: ["Persian", "Siamese", "Maine Coon", "Calico", "Bengal", "Ragdoll", "British Shorthair", "Abyssinian", "Sphynx", "Scottish Fold", "Others"],
    Bird: ["Parrot", "Canary", "Cockatiel", "Macaw", "Budgerigar", "Lovebird", "African Grey", "Finch", "Conure", "Cockatoo", "Others"],
    Rabbit: ["Holland Lop", "Mini Rex", "Flemish Giant", "Netherland Dwarf", "Lionhead", "Angora", "Rex", "Satin", "Himalayan", "Harlequin", "Others"],
    GuineaPig: ["American", "Abyssinian", "Peruvian", "Silkie", "Teddy", "Coronet", "Texel", "Skinny Pig", "Baldwin", "Crested", "Others"],
    Hamster: ["Syrian", "Dwarf Campbell", "Winter White", "Roborovski", "Chinese", "Fancy Bear", "European", "Golden", "Panda", "Sable", "Others"],
    Ferret: ["Standard", "Angora", "Sable", "Cinnamon", "Chocolate", "Albino", "Panda", "Blaze", "Mitted", "Point", "Others"],
    Fish: ["Goldfish", "Betta", "Guppy", "Neon Tetra", "Angelfish", "Mollie", "Platy", "Swordtail", "Discus", "Cichlid", "Others"],
    Reptile: ["Ball Python", "Corn Snake", "Leopard Gecko", "Bearded Dragon", "Crested Gecko", "Chameleon", "Iguana", "King Snake", "Boa Constrictor", "Monitor Lizard", "Others"],
    Others: []
  };

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("6M4Xlw1XjSDBaIr4t");
  }, []);

  const sendingEmails = useRef({});

  //fetch notif and send email
  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeNotifications;
    let notificationInterval;
  
    const initializeComponent = async () => {
      setLoading(true);
      unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            await Promise.all([
              fetchOwnerInfo(),
              fetchPets(),
              fetchAppointments(),
              fetchNotifications(),
            ]);
          } catch (error) {
            console.error("Error initializing data:", error);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
          navigate("/Home");
        }
      });
  
      // Set up real-time notification listener
      const q = query(
        collection(db, "notifications"),
        where("ownerId", "==", `users/${auth.currentUser?.uid}`),
        where("type", "in", [
          "appointment_accepted",
          "appointment_reminder",
          "appointment_day_of",
          "cancellation_approved",
          "cancellation_declined",
          "reschedule_approved",
          "reschedule_declined",
        ]),
        where("removeViewPetOwner", "==", false)
      );
  
      unsubscribeNotifications = onSnapshot(
        q,
        async (snapshot) => {
          try {
            const notificationsList = await Promise.all(
              snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                try {
                  const clinicDoc = await getDoc(doc(db, "clinics", data.clinicId));
                  const appointmentDoc = await getDoc(doc(db, "appointments", data.appointmentId));
                  const notification = {
                    id: docSnap.id,
                    clinicProfileImageURL: clinicDoc.exists() ? clinicDoc.data().profileImageURL : DEFAULT_OWNER_IMAGE,
                    clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
                    dateofAppointment: appointmentDoc.exists() ? appointmentDoc.data().dateofAppointment.toDate() : null,
                    hasPetOwnerOpened: data.hasPetOwnerOpened || false,
                    message: data.message,
                    dateCreated: data.dateCreated ? data.dateCreated.toDate() : new Date(),
                    type: data.type,
                    hasEmailSent: data.hasEmailSent || false,
                  };
  
                  // Send email for new appointment_day_of notifications
                  if (notification.type === "appointment_day_of" && !notification.hasEmailSent && !sentEmails[notification.id]) {
                    await sendDayOfEmail(notification, appointmentDoc.data(), clinicDoc.data());
                  }
  
                  return notification;
                } catch (error) {
                  console.error(`Error processing notification ${docSnap.id}:`, error);
                  return null;
                }
              })
            );
  
            const filteredNotifications = notificationsList
              .filter((n) => n !== null)
              .sort((a, b) => b.dateCreated - a.dateCreated);
  
            setNotifications(filteredNotifications);
            setUnreadNotifications(filteredNotifications.some((n) => !n.hasPetOwnerOpened));
          } catch (error) {
            console.error("Error processing notifications snapshot:", error);
            setNotifications([]);
            setUnreadNotifications(false);
          }
        },
        (error) => {
          console.error("Error listening to notifications:", error);
          setNotifications([]);
          setUnreadNotifications(false);
        }
      );
  
      notificationInterval = setInterval(fetchNotifications, 300000);
    };
  
    initializeComponent();
  
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (notificationInterval) clearInterval(notificationInterval);
    };
  }, [navigate, sentEmails, auth.currentUser]);

  // send email for day of apptmnt notif
const sendDayOfEmail = async (notification, appointmentData, clinicData) => {
  const notifId = notification.id;

  // If already sending or already sent, skip 
  if (sendingEmails.current[notifId] || sentEmails[notifId]) {
    console.log("Already sending email for:", notifId);
    return;
  }

  sendingEmails.current[notifId] = true;

  try {
    const apptDate = appointmentData.dateofAppointment?.toDate();
    if (!apptDate) return;

    const ownerRef = appointmentData.owner;
    const ownerDoc = await getDoc(ownerRef);
    if (!ownerDoc.exists()) return;
    const ownerData = ownerDoc.data();
    const email = ownerData.email;
    if (!email || !email.includes("@")) return;

    const location = [
      clinicData.streetAddress || "",
      clinicData.province || "",
      clinicData.city || ""
    ].filter(Boolean).join(", ") || "N/A";

    const emailParams = {
      email: email,
      message: notification.message,
      clinic: clinicData.clinicName || "Unknown Clinic",
      service: appointmentData.serviceType || "N/A",
      date: apptDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      time: apptDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      location: location,
      veterinarian: appointmentData.veterinarian || "N/A",
      pet_name: appointmentData.petName || "N/A",
    };

    console.log("Sending day-of email:", emailParams);

    await emailjs.send(
      "service_Furwell",
      "template_s8stabo",
      emailParams,
      "6M4Xlw1XjSDBaIr4t"
    );

    // Mark notification as email sent
    await updateDoc(doc(db, "notifications", notifId), { hasEmailSent: true });
    setSentEmails((prev) => ({ ...prev, [notifId]: true }));
  } catch (error) {
    console.error("Error sending day-of email for notification", notifId, ":", error);
  } finally {
    sendingEmails.current[notifId] = false; 
  }
};

  
  
  //outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const sidebar = document.querySelector(".sidebar-p");
      const hamburgerButton = e.target.closest('.mobile-header-p button');
      
      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target) &&
        !hamburgerButton 
      ) {
        setIsSidebarOpen(false);
      }
  
      const profileModal = document.querySelector(".profile-modal-p");
      const headerProfileImg = e.target.closest(".mobile-header-profile-img-p");
  
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

  // React calendar
  // Handle calendar date click
  const handleCalendarDateClick = (date) => {
    const today = new Date();
    const oneMonthFromToday = new Date(today);
    oneMonthFromToday.setMonth(today.getMonth() + 1);

    const clickedDateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const oneMonthFromTodayLocal = new Date(oneMonthFromToday.getFullYear(), oneMonthFromToday.getMonth(), oneMonthFromToday.getDate());

    if (clickedDateLocal >= todayLocal && clickedDateLocal <= oneMonthFromTodayLocal) {
      const year = clickedDateLocal.getFullYear();
      const month = String(clickedDateLocal.getMonth() + 1).padStart(2, "0");
      const day = String(clickedDateLocal.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      console.log("Clicked date on calendar:", formattedDate);
      setClickedDate(clickedDateLocal);
      setRescheduleDateTime(clickedDateLocal); // Update reschedule date
      const slots = generateTimeSlots(clickedDateLocal, vetSchedule, takenAppointments);
      setAvailableSlots(slots);
      setSelectedRescheduleSlot(null);
    } else {
      const year = clickedDateLocal.getFullYear();
      const month = String(clickedDateLocal.getMonth() + 1).padStart(2, "0");
      const day = String(clickedDateLocal.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      console.log("Clicked date outside one-month span, ignored:", formattedDate);
    }
  };

  // Tile content and styling for React-Calendar
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;

    const today = new Date();
    const oneMonthFromToday = new Date(today);
    oneMonthFromToday.setMonth(today.getMonth() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const dayOfWeek = date.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    const hasSchedule = vetSchedule && vetSchedule.some(
      (sched) => sched.day.toLowerCase() === dayOfWeek
    );
    const slots = generateTimeSlots(date, vetSchedule, takenAppointments);
    const isWithinOneMonth = date >= today && date <= oneMonthFromToday;

    if (clickedDate && date.toDateString() === clickedDate.toDateString()) {
      return "clicked-date"; // Custom class for clicked date
    }
    if (isToday) return "today-date";
    if (!isWithinOneMonth || !hasSchedule) return "disabled-date";
    if (slots.length === 0) return "fully-taken-date";
    return "available-date";
  };

  const fetchNotifications = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("No current user, skipping notification fetch.");
      return;
    }

    // Fetch existing notifications to check for duplicates
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("ownerId", "==", `users/${currentUser.uid}`),
      where("type", "in", [
        "appointment_accepted",
        "appointment_reminder",
        "appointment_day_of",
        "cancellation_approved",
        "cancellation_declined",
        "reschedule_approved",
        "reschedule_declined",
      ]),
      where("removeViewPetOwner", "==", false)
    );

    const querySnapshot = await getDocs(notificationsQuery);
    const existingNotifications = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Check for one-day-before and day-of reminders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("owner", "==", doc(db, "users", currentUser.uid)),
      where("status", "==", "Accepted")
    );
    const apptSnapshot = await getDocs(appointmentsQuery);

    for (const docSnap of apptSnapshot.docs) {
      const apptData = docSnap.data();
      const apptDate = apptData.dateofAppointment.toDate();
      const apptDay = new Date(apptDate);
      apptDay.setHours(0, 0, 0, 0);

      const clinicDoc = await getDoc(apptData.clinic);
      const clinicName = clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic";
      const clinicProfileImageURL = clinicDoc.exists() ? clinicDoc.data().profileImageURL : DEFAULT_OWNER_IMAGE;

      // One-day-before reminder
      if (apptDay.toDateString() === tomorrow.toDateString()) {
        const existingReminder = existingNotifications.find(
          (n) => n.appointmentId === docSnap.id && n.type === "appointment_reminder"
        );

        if (!existingReminder) {
          await addDoc(collection(db, "notifications"), {
            ownerId: `users/${currentUser.uid}`,
            appointmentId: docSnap.id,
            clinicId: apptData.clinic.id,
            type: "appointment_reminder",
            message: `Reminder: Your appointment for ${apptData.petName} at ${clinicName} is tomorrow!`,
            hasPetOwnerOpened: false,
            removeViewPetOwner: false,
            dateCreated: serverTimestamp(),
          });
          console.log(`Created appointment_reminder for appointment ${docSnap.id}`);
        }
      }

      // Day-of reminder
      if (apptDay.toDateString() === today.toDateString()) {
        const existingDayOf = existingNotifications.find(
          (n) => n.appointmentId === docSnap.id && n.type === "appointment_day_of"
        );

        if (!existingDayOf) {
          await addDoc(collection(db, "notifications"), {
            ownerId: `users/${currentUser.uid}`,
            appointmentId: docSnap.id,
            clinicId: apptData.clinic.id,
            type: "appointment_day_of",
            message: `Today is the day! Your appointment for ${apptData.petName} at ${clinicName} is scheduled for ${formatDate(apptDate)}.`,
            hasPetOwnerOpened: false,
            removeViewPetOwner: false,
            dateCreated: serverTimestamp(),
          });
          console.log(`Created appointment_day_of for appointment ${docSnap.id}`);
        }
      }
    }
  } catch (error) {
    console.error("Error in fetchNotifications:", error);
  }
};
            
  const NOTIFICATION_TYPES = {
    APPOINTMENT_ACCEPTED: "appointment_accepted",
    APPOINTMENT_REMINDER: "appointment_reminder",
    APPOINTMENT_DAY_OF: "appointment_day_of",
    CANCELLATION_APPROVED: "cancellation_approved",
    CANCELLATION_DECLINED: "cancellation_declined",
    RESCHEDULE_APPROVED: "reschedule_approved",
    RESCHEDULE_DECLINED: "reschedule_declined",
  };
  // Handle notification icon click
  const handleNotificationClick = async () => {
    try {
      setShowNotificationsModal(true);
      console.log("Set showNotificationsModal to true");
  
      if (unreadNotifications) {
        console.log("Processing unread notifications");
        const unreadNotificationsList = notifications.filter((n) => !n.hasPetOwnerOpened);
        for (const notification of unreadNotificationsList) {
          await markNotificationAsRead(notification.id);
        }
        setNotifications(notifications.map((n) => ({ ...n, hasPetOwnerOpened: true, status: "read" })));
        setUnreadNotifications(false);
        console.log("Unread notifications marked as read");
        await fetchAppointments(); // Refetch to reflect any status changes
      }
    } catch (error) {
      console.error("Error in handleNotificationClick:", error);
    }
  };

  const handleDeleteNotificationClick = (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete notification
  const confirmDeleteNotification = async () => {
    try {
      const notificationRef = doc(db, "notifications", notificationToDelete);
      await updateDoc(notificationRef, { removeViewPetOwner: true });
      setNotifications(notifications.filter(n => n.id !== notificationToDelete));
      setShowDeleteConfirmModal(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Failed to delete notification. Please try again.");
    }
  };


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
    }).replace(",", ",");
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

    const today = new Date(); // Current date as per context
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return `${formattedDate} (${age})`;
  };
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAppointments = pastAppointments.filter(record => {
    const monthName = new Date(record.dateofAppointment).toLocaleString('en-US', { month: 'long' });

    return Object.values({
      petName: record.petName,
      clinicName: record.clinicName,
      serviceType: record.serviceType,
      veterinarian: record.veterinarian,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      completionRemark: record.completionRemark,
      notes: record.notes,
      status: record.status,
      monthName: monthName,
    }).some(value =>

      typeof value === "string" && value.toLowerCase().includes(searchQuery.toLowerCase())
    ) || monthName.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSeeHistory = (petName) => {
    setActivePanel("healthRecords");
    setSearchQuery(petName);
    setShowModal(false);
    console.log(`Switched to Health Records with search query: "${petName}"`);
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
    if (name === "Type") {
      setNewPet({
        ...newPet,
        [name]: value,
        customType: value === "Others" ? newPet.customType : "",
      });
    } else if (name === "Breed") {
      setNewPet({
        ...newPet,
        [name]: value,
        customBreed: value === "Others" ? newPet.customBreed : ""
      });
    } else {
      setNewPet({
        ...newPet,
        [name]: name === "Weight" ? (value === "" ? "" : parseFloat(value)) : value
      });
    }
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
      if (!newPet.petName || !newPet.Type || !newPet.Gender) {
        throw new Error("Pet name, type, and gender are required");
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

      const finalType = newPet.Type === "Others" ? newPet.customType : newPet.Type;
      const finalBreed = newPet.Breed === "Others" ? newPet.customBreed : newPet.Breed;

      const ownerRef = doc(db, "users", currentUser.uid);
      const petDoc = await addDoc(collection(db, "pets"), {
        petName: newPet.petName,
        Type: finalType, // Use final type
        Breed: finalBreed, // Use final breed
        Color: newPet.Color,
        Gender: newPet.Gender,
        Weight: newPet.Weight,
        dateofBirth: newPet.dateofBirth,
        petImageURL,
        owner: ownerRef,
        createdAt: serverTimestamp(),
      });

      setAddPetSuccess(true);
      setNewPet({
        petName: "",
        Type: "",
        Breed: "",
        Color: "",
        Gender: "",
        Weight: "",
        dateofBirth: "",
        customType: "",
        customBreed: ""
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

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const q = query(
      collection(db, "appointments"),
      where("owner", "==", doc(db, "users", auth.currentUser.uid))
    );
  
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Appointments snapshot received:", snapshot.docs.length);
        fetchAppointments(); // Refresh appointments
      },
      (error) => {
        console.error("Error listening to appointments:", error);
      }
    );
  
    return () => unsubscribe();
  }, [auth.currentUser]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("Fetching appointments for user:", currentUser.uid);
  
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("owner", "==", doc(db, "users", currentUser.uid))
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        console.log("All appointments fetched:", querySnapshot.docs.length);
  
        const currentAppointmentsList = [];
        const pastAppointmentsList = [];
        const today = new Date();
        console.log("Today’s date and time:", today.toISOString());
  
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const clinicDoc = await getDoc(data.clinic);
          const startTime = data.dateofAppointment.toDate();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
          const appointmentDetails = {
            Id: doc.id,
            Subject: `${data.petName || "Unknown Pet"} - ${data.serviceType || "N/A"}`,
            StartTime: startTime,
            EndTime: endTime,
            petName: data.petName || "Unknown Pet",
            clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
            clinicId: data.clinic.id,
            serviceType: data.serviceType || "N/A",
            veterinarian: data.veterinarian || "N/A",
            veterinarianId: data.veterinarianId,
            completionRemark: data.completionRemark || "No remarks",
            notes: data.notes || "No notes",
            status: data.status || "N/A",
            diagnosis: data.diagnosis || "N/A",
            treatment: data.treatment || "N/A",
            dateofAppointment: startTime,
            rescheduleDate: data.rescheduleDate ? data.rescheduleDate.toDate() : null,
          };
  
          console.log(
            "Processing appointment - ID:", doc.id,
            "Date:", startTime.toISOString(),
            "Firestore Status:", data.status
          );
  
          // Handle future/present appointments (including Cancelled if date is in the future)
          if (startTime >= today) {
            if (["Accepted", "Request Cancel", "Request Reschedule", "Cancelled"].includes(data.status)) {
              currentAppointmentsList.push({
                ...appointmentDetails,
                status:
                  data.status === "Request Cancel"
                    ? "Pending Cancellation"
                    : data.status === "Request Reschedule"
                    ? "Pending Reschedule"
                    : data.status === "Cancelled"
                    ? "Cancelled"
                    : "Accepted",
              });
              console.log(
                "Added to currentAppointmentsList:",
                appointmentDetails.Id,
                "Date:", startTime.toISOString(),
                "Status:", data.status,
                "→ Display Status:",
                data.status === "Request Cancel"
                  ? "Pending Cancellation"
                  : data.status === "Request Reschedule"
                  ? "Pending Reschedule"
                  : data.status === "Cancelled"
                  ? "Cancelled"
                  : "Accepted"
              );
            }
          }
  
          // Handle past appointments
          if (startTime < today || (data.status === "Cancelled" && startTime < today)) {
            const isDuplicate = pastAppointmentsList.some((appt) => appt.Id === doc.id);
            if (!isDuplicate) {
              pastAppointmentsList.push({
                ...appointmentDetails,
                status:
                  data.status === "Request Cancel"
                    ? "Cancel Requested"
                    : data.status === "Request Reschedule"
                    ? "Reschedule Requested"
                    : data.status === "Cancelled"
                    ? "Cancelled"
                    : "Done",
              });
              console.log(
                "Added to pastAppointmentsList:",
                appointmentDetails.Id,
                "Date:", startTime.toISOString(),
                "Firestore Status:", data.status,
                "→ Table Status:",
                data.status === "Request Cancel"
                  ? "Cancel Requested"
                  : data.status === "Request Reschedule"
                  ? "Reschedule Requested"
                  : data.status === "Cancelled"
                  ? "Cancelled"
                  : "Done"
              );
            }
          }
        }
  
        console.log("Final Current Appointments:", currentAppointmentsList);
        console.log("Final Past Appointments (Health Records):", pastAppointmentsList);
  
        setAppointments(currentAppointmentsList);
        setPastAppointments(pastAppointmentsList);
      } else {
        console.log("No current user found, skipping fetch.");
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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cancel Appointment Action Handlers
  const handleCancelAppointment = async (appointmentId) => {
    try {
      // Reference to the original appointment
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
  
      if (!appointmentSnap.exists()) {
        throw new Error("Appointment not found");
      }
  
      // Update the appointment with status "Request Cancel" and a timestamp
      await updateDoc(appointmentRef, {
        status: "Request Cancel",
        cancelRequestedAt: serverTimestamp(), // Optional: Track when the request was made
      });
  
      // Update local state to reflect the new status
      setAppointments(
        appointments.map((appt) =>
          appt.Id === appointmentId
            ? { ...appt, status: "Request Cancel" }
            : appt
        )
      );
  
      setShowAppointmentModal(false);
      alert("Cancellation request submitted successfully! Awaiting clinic approval.");
    } catch (error) {
      console.error("Error requesting appointment cancellation:", error);
      alert("Failed to request appointment cancellation.");
    }
  };


  const handleEventClick = (args) => {
    args.cancel = true; // Prevent default edit popup
    const appointment = appointments.find((appt) => appt.Id === args.event.Id);
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
    setRescheduleDateTime(null);
    setAvailableSlots([]);
    setShowReschedule(false);
  };

  const handleAppointmentsClick = () => {
    setActivePanel("appointments");
    setCurrentView("Agenda"); // Switch to Agenda view when clicked
  };

  // Fetch all appointments for the clinic and veterinarian
  const fetchTakenAppointments = async (clinicId, veterinarianId) => {
    try {
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("clinic", "==", doc(db, "clinics", clinicId)),
        where("veterinarianId", "==", veterinarianId),
        where("status", "in", ["Accepted", "Request Cancel"]) // fetchhhh both Accepted and Request Cancel
      );
      const querySnapshot = await getDocs(appointmentsQuery);
      const taken = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateofAppointment: doc.data().dateofAppointment.toDate(),
      }));
      console.log("Fetched taken appointments (Accepted only):", taken.map(appt => ({
        id: appt.id,
        date: appt.dateofAppointment.toLocaleString("en-US", { hour: "numeric", hour12: true }),
        status: appt.status
      })));
      setTakenAppointments(taken);
    } catch (error) {
      console.error("Error fetching taken appointments:", error);
      setTakenAppointments([]);
    }
  };

  // Fetch veterinarian's schedule from users collection
  const fetchVetSchedule = async (veterinarianId) => {
    try {
      const vetRef = doc(db, "users", veterinarianId);
      const vetDoc = await getDoc(vetRef);
      if (vetDoc.exists()) {
        const vetData = vetDoc.data();
        if (vetData.Type === "Veterinarian") {
          console.log("Fetched vet schedule:", vetData.schedule);
          setVetSchedule(vetData.schedule); // Store the array directly
        } else {
          console.log("User is not a veterinarian:", veterinarianId);
          setVetSchedule(null);
        }
      } else {
        console.log("No vet document found for ID:", veterinarianId);
        setVetSchedule(null);
      }
    } catch (error) {
      console.error("Error fetching vet schedule:", error);
      setVetSchedule(null);
    }
  };



  // Check if a time slot is taken
  const isSlotTaken = (slotTime, takenAppointments) => {
    const slotEndTime = new Date(slotTime.getTime() + 60 * 60 * 1000);
    return takenAppointments.some((appt) => {
      const apptStart = appt.dateofAppointment;
      const apptEnd = new Date(apptStart.getTime() + 60 * 60 * 1000);
      return slotTime < apptEnd && slotEndTime > apptStart;
    });
  };

  // Generate available time slots for a selected date
  const generateTimeSlots = (selectedDate, vetSchedule, takenAppointments) => {
    if (!vetSchedule) {
      console.log("No vet schedule available for slots generation");
      return [];
    }

    console.log("Generating slots for date:", selectedDate.toISOString().split("T")[0]);
    const dayOfWeek = selectedDate.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    const vetDaySchedule = vetSchedule.find(
      (sched) => sched.day.toLowerCase() === dayOfWeek
    );

    if (!vetDaySchedule) {
      console.log("No schedule for day:", dayOfWeek);
      console.log("Available vet schedule days:", vetSchedule.map(s => s.day.toLowerCase()));
      return [];
    }

    const startHour = parseInt(vetDaySchedule.startTime.split(":")[0], 10); // e.g., 10
    const endHour = parseInt(vetDaySchedule.endTime.split(":")[0], 10);     // e.g., 14
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    console.log("Vet schedule for", dayOfWeek, ":", vetDaySchedule);
    console.log("Start Hour:", startHour);
    console.log("End Hour:", endHour);
    console.log("Is Today:", isToday);
    console.log("Current Time:", today.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));

    const slots = [];
    // Stop at endHour - 1 to exclude the end time as a start slot (e.g., 13 instead of 14)
    for (let hour = startHour; hour < endHour; hour++) {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, 0, 0, 0);

      console.log(
        "Processing slot:",
        slotTime.toLocaleString("en-US", { hour: "numeric", hour12: true }),
        "| Timestamp:",
        slotTime.toISOString()
      );

      if (isToday && slotTime <= today) {
        console.log(
          "Skipping slot (past time):",
          slotTime.toLocaleString("en-US", { hour: "numeric", hour12: true })
        );
        continue;
      }

      if (!isSlotTaken(slotTime, takenAppointments)) {
        const displayTime = slotTime.toLocaleString("en-US", { hour: "numeric", hour12: true });
        console.log("Adding available slot:", displayTime);
        slots.push({
          time: slotTime,
          display: displayTime,
        });
      } else {
        console.log(
          "Slot taken:",
          slotTime.toLocaleString("en-US", { hour: "numeric", hour12: true })
        );
      }
    }
    console.log("Final available slots:", slots.map(slot => slot.display));
    return slots;
  };


  // Reschedule appointment
  const handleRescheduleAppointment = async (appointmentId) => {
    if (!selectedRescheduleSlot) {
      alert("Please select a new time slot.");
      return;
    }
  
    setIsRescheduling(true);
    try {
      const newDateTime = selectedRescheduleSlot.time; // Date object from the slot
      console.log("Requesting reschedule to date:", newDateTime.toISOString().split("T")[0]);
      console.log(
        "Requesting reschedule to time:",
        newDateTime.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      );
  
      // Reference to the appointment
      const appointmentRef = doc(db, "appointments", appointmentId);
  
      // Update Firestore with "Request Reschedule" status and the proposed new time
      await updateDoc(appointmentRef, {
        status: "Request Reschedule",
        rescheduleDate: newDateTime, // Use rescheduleDate to match ClinicHome expectation
        rescheduleRequestedAt: serverTimestamp(), // Optional: Track request time
      });
  
      // Update local state to reflect the pending reschedule
      setAppointments(
        appointments.map((appt) =>
          appt.Id === appointmentId
            ? {
                ...appt,
                status: "Pending Reschedule", // Reflect the pending status in UI
              }
            : appt
        )
      );
  
      setShowAppointmentModal(false);
      setAvailableSlots([]);
      setSelectedRescheduleSlot(null);
      setClickedDate(null);
      alert("Reschedule request submitted successfully! Awaiting clinic approval.");
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      alert("Failed to request reschedule.");
    } finally {
      setIsRescheduling(false);
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


  // Fetch data when appointment modal opens
  useEffect(() => {
    if (selectedAppointment) {
      fetchTakenAppointments(selectedAppointment.clinicId, selectedAppointment.veterinarianId);
      fetchVetSchedule(selectedAppointment.veterinarianId);
    }
  }, [selectedAppointment]);

  useEffect(() => {
    if (!auth.currentUser) return;
  
    const q = query(
      collection(db, "notifications"),
      where("ownerId", "==", `users/${auth.currentUser.uid}`),
      where("type", "in", [
        "appointment_accepted",
        "appointment_reminder",
        "appointment_day_of",
        "cancellation_approved",
        "cancellation_declined",
        "reschedule_approved",
        "reschedule_declined",
      ]),
      where("removeViewPetOwner", "==", false)
    );
  
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const notificationsList = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            try {
              const clinicDoc = await getDoc(doc(db, "clinics", data.clinicId));
              const appointmentDoc = await getDoc(doc(db, "appointments", data.appointmentId));
              return {
                id: docSnap.id,
                clinicProfileImageURL: clinicDoc.exists() ? clinicDoc.data().profileImageURL : DEFAULT_OWNER_IMAGE,
                clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
                dateofAppointment: appointmentDoc.exists() ? appointmentDoc.data().dateofAppointment.toDate() : null,
                hasPetOwnerOpened: data.hasPetOwnerOpened || false,
                message: data.message,
                dateCreated: data.dateCreated ? data.dateCreated.toDate() : new Date(),
                type: data.type,
              };
            } catch (error) {
              console.error(`Error processing notification ${docSnap.id}:`, error);
              return null;
            }
          })
        );
  
        const filteredNotifications = notificationsList
          .filter((n) => n !== null)
          .sort((a, b) => b.dateCreated - a.dateCreated);
  
        setNotifications(filteredNotifications);
        setUnreadNotifications(filteredNotifications.some((n) => !n.hasPetOwnerOpened));
      },
      (error) => {
        console.error("Error listening to notifications:", error);
        setNotifications([]);
        setUnreadNotifications(false);
      }
    );
  
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Real-time notification listener
  /*useEffect(() => {
    if (!auth.currentUser) return;
  
    const q = query(
      collection(db, "notifications"),
      where("ownerId", "==", `users/${auth.currentUser.uid}`),
      where("type", "in", [
        "cancellation_approved",
        "cancellation_declined",
        "reschedule_approved",
        "reschedule_declined",
        "appointment_accepted",
        "appointment_reminder",
        "appointment_day_of",
      ]),
      where("removeViewPetOwner", "==", false)
    );
  
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const notificationsList = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              try {
                const clinicDoc = await getDoc(doc(db, "clinics", data.clinicId));
                const appointmentDoc = await getDoc(doc(db, "appointments", data.appointmentId));
                return {
                  id: docSnap.id,
                  clinicProfileImageURL: clinicDoc.exists() ? clinicDoc.data().profileImageURL : DEFAULT_OWNER_IMAGE,
                  clinicName: clinicDoc.exists() ? clinicDoc.data().clinicName : "Unknown Clinic",
                  dateofAppointment: appointmentDoc.exists() ? appointmentDoc.data().dateofAppointment.toDate() : null,
                  hasPetOwnerOpened: data.hasPetOwnerOpened || false,
                  message: data.message,
                  dateCreated: data.dateCreated ? data.dateCreated.toDate() : new Date(),
                  type: data.type,
                  status: data.status || "unread",
                };
              } catch (error) {
                console.error(`Error processing notification ${docSnap.id}:`, error);
                return null;
              }
            })
          );
  
          const filteredNotifications = notificationsList
            .filter((n) => n !== null)
            .sort((a, b) => b.dateCreated - a.dateCreated);
  
          setNotifications(filteredNotifications);
          setUnreadNotifications(filteredNotifications.some((n) => !n.hasPetOwnerOpened));
        } catch (error) {
          console.error("Error fetching notifications:", error);
          setNotifications([]);
          setUnreadNotifications(false);
        }
      },
      (error) => {
        console.error("Error listening to notifications:", error);
        setNotifications([]);
        setUnreadNotifications(false);
      }
    );
  
    return () => unsubscribe();
  }, [auth.currentUser, DEFAULT_OWNER_IMAGE]);*/

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        hasPetOwnerOpened: true,
        status: "read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };


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

  // Handle account button click to show profile panel
  const handleAccountClick = () => {
    console.log("handleAccountClick invoked");
    setActivePanel("profile");
    console.log("activePanel set to profile");
  };

  // const onCellClick = (args) => {
  //   args.cancel = true; // Prevent adding new events
  // };

  return (
    <div className="pet-owner-container-p">
      {/* Mobile Header with Hamburger Menu */}
      <div className="mobile-header-p">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰ {/* Hamburger icon */}
        </button>
        {ownerInfo && (
          <img
            src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
            alt="Owner Profile"
            className="mobile-header-profile-img-p"
            onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
          />
        )}
      </div>
      {isProfileModalOpen && ownerInfo && (
        <div className="profile-modal-p">
          <div className="profile-modal-content-p">
            <img
              src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
              alt="Owner Profile"
              className="profile-modal-img-p"
            />
            <div className="profile-modal-info-p">
              <p className="profile-modal-name-p" onClick={handleAccountClick} style={{ cursor: "pointer" }}>
                {ownerInfo.FirstName} {ownerInfo.LastName}
              </p>
              <button className="signout-btn-modal-p" onClick={handleSignOut}>
                <FaSignOutAlt className="sidebar-icon-p" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`sidebar-p ${isSidebarOpen ? "open" : ""}`}>
      {ownerInfo && (
              <div className="owner-sidebar-panel-p">
                <div className="owner-img-container-p">
                  <img
                    src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
                    alt="Owner Profile"
                    className="owner-profile-image-p"
                  />
                </div>
                <div className="owner-notification-wrapper">
                  <button
                    className={`owner-button ${activePanel === "profile" ? "active" : ""}`}
                    onClick={() => setActivePanel("profile")}
                  >
                    <FaUser className="sidebar-icon-p" />
                    {ownerInfo.FirstName} {ownerInfo.LastName}
                  </button>
                  <button className="notification-btn-p" onClick={handleNotificationClick}>
                    <div className="notification-icon-container-p">
                      <FaBell className="bell-notif-p" />
                      {unreadNotifications && <span className="notification-dot-p"></span>}
                    </div>
                  </button>
                </div>
              </div>
            )}
            <div className="sidebar-buttons-p">
              <button
                className={`sidebar-btn-p ${activePanel === "petDetails" ? "active" : ""}`}
                onClick={() => setActivePanel("petDetails")}
              >
                <MdPets className="sidebar-icon-p" />
                Pet Details
              </button>
              <button
                className={`sidebar-btn-p ${activePanel === "appointments" ? "active" : ""}`}
                onClick={handleAppointmentsClick}
              >
                <FaCalendarAlt className="sidebar-icon-p" />
                Appointments
              </button>
              <button
                className={`sidebar-btn-p ${activePanel === "healthRecords" ? "active" : ""}`}
                onClick={() => setActivePanel("healthRecords")}
              >
                <FaFileMedical className="sidebar-icon-p" />
                Health Records
              </button>
            </div>
            <button className="signout-btn-p" onClick={handleSignOut}>
              <FaSignOutAlt className="sidebar-icon-p" />
              Sign Out
            </button>
      </div>

          <div className="content-p">
            <div className="panel-container-p">
            {activePanel === "profile" && (
              <div className="panel-p profile-panel-p">
                <h3>Profile</h3>
                {ownerInfo ? (
                  <div className="owner-details-p">
                    <img
                      src={ownerInfo.profileImageURL || "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png"}
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
                ) : (
                  <p>Loading profile...</p>
                )}
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
                        <tr><th>Pet Name</th></tr>
                      </thead>
                      <tbody>
                        {pets.length > 0 ? (
                          pets.map((pet) => (
                            <tr key={pet.id}>
                              <td>
                                <a
                                  href="#!"
                                  onClick={(e) => { e.preventDefault(); handlePetClick(pet); }}
                                  className="pet-name-link-p"
                                >
                                  {pet.petName}
                                </a>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td>No pets found</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              {activePanel === "appointments" && (
                <div className="panel-p appointments-panel-p">
                  <div className="appointments-header-p">
                    <h3>Appointments</h3>
                    <button className="bookapptbutt-p" onClick={handleBookAppointment}>
                      Book Appointment
                    </button>
                  </div>
                  {loading ? (
                    <p>Loading appointments...</p>
                  ) : (
                    <ScheduleComponent
                width="100%"
                height="650px"
                currentView={currentView}
                eventSettings={{ dataSource: appointments }}
                eventClick={handleEventClick}
                popupOpen={(args) => (args.cancel = true)}
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
                <div className="panel-p health-records-panel-p">
                  <h3>Health Records</h3>
                  <form className="psearch-bar-container">
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                  {loading ? (
                    <p>Loading health records...</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Pet</th>
                          <th>Clinic</th>
                          <th>Service</th>
                          <th>Notes</th>
                          <th>Veterinarian</th>
                          <th>Diagnosis</th>
                          <th>Treatment</th>
                          <th>Remarks</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.length > 0 ? (
                          filteredAppointments.map((record) => (
                            <tr key={record.Id}>
                              <td>{formatDate(record.dateofAppointment)}</td>
                              <td>{record.petName}</td>
                              <td>{record.clinicName}</td>
                              <td>{record.serviceType}</td>
                              <td>{record.notes}</td>
                              <td>{record.veterinarian}</td>
                              <td>{record.diagnosis}</td>
                              <td>{record.treatment}</td>
                              <td>{record.completionRemark}</td>
                              <td>{record.status}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="7">No records found</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
      
      {/* <div className="sidebar-p">
    {ownerInfo && (
      <div className="owner-sidebar-panel-p">
        <div className="owner-img-container-p">
          <img
            src={ownerInfo.profileImageURL || DEFAULT_OWNER_IMAGE}
            alt="Owner Profile"
            className="owner-profile-image-p"
          />
        </div>
        <div className="owner-notification-wrapper">
          <button
            className={`owner-button ${activePanel === "profile" ? "active" : ""}`}
            onClick={() => setActivePanel("profile")}
          >
            <FaUser className="sidebar-icon-p" /> 
            {ownerInfo.FirstName} {ownerInfo.LastName}
          </button>
          <button className="notification-btn-p" onClick={handleNotificationClick}>
            <div className="notification-icon-container-p">
              <FaBell className="bell-notif-p" />
              {unreadNotifications && <span className="notification-dot-p"></span>}
            </div>
          </button>
        </div>
      </div>
    )}
    <div className="sidebar-buttons-p">
      <button
        className={`sidebar-btn-p ${activePanel === "petDetails" ? "active" : ""}`}
        onClick={() => setActivePanel("petDetails")}
      >
        <MdPets className="sidebar-icon-p" /> 
        Pet Details
      </button>
      <button
        className={`sidebar-btn-p ${activePanel === "appointments" ? "active" : ""}`}
        onClick={handleAppointmentsClick}
      >
        <FaCalendarAlt className="sidebar-icon-p" /> 
        Appointments
      </button>
      <button
        className={`sidebar-btn-p ${activePanel === "healthRecords" ? "active" : ""}`}
        onClick={() => setActivePanel("healthRecords")}
      >
        <FaFileMedical className="sidebar-icon-p" /> 
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
              <div className="appointments-header-p"> 
                <h3>Appointments</h3>
                <button className="bookapptbutt-p" onClick={handleBookAppointment}>
                  Book Appointment
                </button>
              </div>
              {loading ? (
                <p>Loading appointments...</p>
              ) : (
                <ScheduleComponent
                  width="100%"
                  height="650px"
                  currentView={currentView}
                  currentDate={new Date()} // March 24, 2025
                  eventSettings={{
                    dataSource: appointments,
                    fields: {
                      id: "Id",
                      subject: { name: "Subject" },
                      startTime: { name: "StartTime" },
                      endTime: { name: "EndTime" },
                    },
                  }}
                  eventClick={handleEventClick} // Handle click on agenda item
                  // cellClick={onCellClick}
                  cellClick={(args) => args.cancel = true}
                  popupOpen={(args) => args.cancel = true} // Disable default edit popup
                  readOnly={false}
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
            <div className="panel-p health-records-panel-p">
              <h3>Health Records</h3>
              <form className="psearch-bar-container">
                <input
                  type="text"
                  id="searchRecords"
                  placeholder="Search records (Pet Name, Clinic, Service, Veterinarian, Remarks, Status, Month)..."
                  className="search-bar-p"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              {loading ? (
                <p>Loading health records...</p>
              ) : (
                <>
                  {console.log("pastAppointments before filtering:", pastAppointments)}
                  {console.log("searchQuery:", searchQuery)}
                  {console.log("filteredAppointments:", filteredAppointments)}
                  <table>
                    <thead>
                      <tr>
                        <th>Date of Appointment</th>
                        <th>Pet Name</th>
                        <th>Clinic</th> 
                        <th>Service</th>
                        <th>Veterinarian</th>
                        <th>Remarks</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length > 0 ? (
                        [...filteredAppointments]
                          .sort((a, b) => b.dateofAppointment - a.dateofAppointment)
                          .map((record) => (
                            <tr key={record.Id}>
                              <td>{formatDate(record.dateofAppointment)}</td>
                              <td>{record.petName}</td>
                              <td>{record.clinicName}</td>
                              <td>{record.serviceType}</td>
                              <td>{record.veterinarian}</td>
                              <td>{record.remarks}</td>
                              <td>{record.status}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="7">No matching records found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      </div> */}

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
                <strong>Type:</strong> {selectedPet.Type || "N/A"}
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
                onClick={() => handleSeeHistory(selectedPet.petName)}
                disabled={isSavingImage}
              >
                See History
              </button>
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

{showNotificationsModal && (
  <div className="modal-overlay-p">
    <div className="modal-content-p notifications-modal-p">
      <span className="close-button-p" onClick={() => setShowNotificationsModal(false)}>
        ×
      </span>
      <h2>Notifications</h2>
      {notifications.length > 0 ? (
        <div className="notifications-list-p">
         {notifications.map((notification) => (
  <div
    key={notification.id}
    className={`notification-item-p ${notification.hasPetOwnerOpened ? "read" : "unread"}`}
    onClick={() => !notification.hasPetOwnerOpened && markNotificationAsRead(notification.id)}
  >
    <img
      src={notification.clinicProfileImageURL || DEFAULT_OWNER_IMAGE}
      alt="Clinic"
      className="notification-clinic-img-p"
    />
    <div className="notification-details-p">
      <p>
        {notification.type === "appointment_accepted" && (
          <strong>Appointment Accepted: </strong>
        )}
        {notification.type === "appointment_reminder" && (
          <strong>Appointment Reminder: </strong>
        )}
        {notification.type === "appointment_day_of" && (
          <strong>Day of Appointment: </strong>
        )}
        {notification.type === "cancellation_approved" && (
          <strong>Cancellation Approved: </strong>
        )}
        {notification.type === "cancellation_declined" && (
          <strong>Cancellation Declined: </strong>
        )}
        {notification.type === "reschedule_approved" && (
          <strong>Reschedule Approved: </strong>
        )}
        {notification.type === "reschedule_declined" && (
          <strong>Reschedule Declined: </strong>
        )}
        {notification.message}
      </p>
      <span className="notification-timestamp-p">
        Notified on: {formatDate(notification.dateCreated)}
      </span>
    </div>
    <FaTimes
      className="delete-notification-icon-p"
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteNotificationClick(notification.id);
      }}
    />
  </div>
))}
        </div>
      ) : (
        <p>No notifications available.</p>
      )}
      <div className="modal-actions-p">
        <button
          className="modal-close-btn-p"
          onClick={() => setShowNotificationsModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      {showDeleteConfirmModal && (
        <div className="modal-overlay-p">
          <div className="modal-content-p delete-confirm-modal-p">
            <p>Are you sure you want to remove this notification?</p>
            <div className="modal-actions-p">
              <button
                className="submit-btn-p"
                onClick={confirmDeleteNotification}
              >
                Yes
              </button>
              <button
                className="cancel-btn-p"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
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

{isSignOutConfirmOpen && (
        <div className="modal-overlay-c">
          <div className="modal-content-c signout-confirm-modal-c">
            <p>Are you sure you want to sign out?</p>
            <div className="form-actions-ph">
              <button className="submit-btn-p" onClick={confirmSignOut}>
                Yes
              </button>
              <button
                className="cancel-btn-p"
                onClick={() => setIsSignOutConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSignOutSuccessOpen && (
        <div className="modal-overlay-p">
          <div className="modal-content-p signout-success-modal-p">
            <div className="success-content-p">
              <img
                src="/images/check.gif"
                alt="Success Checkmark"
                className="success-image-p"
              />
              <p>Signed Out Successfully</p>
            </div>
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
                <label>Type*</label>
                <div className="dropdown-wrapper">
                  <select
                    id="Type"
                    name="Type"
                    value={newPet.Type}
                    onChange={handleInputChange}
                    required
                    className={newPet.Type === "Others" ? "shrunk-select" : "full-width-select"}
                  >
                    <option value="">Select Type</option>
                    {Object.keys(petTypes).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {newPet.Type === "Others" && (
                    <div className="custom-input-container">
                      <label className="others-label">Others</label>
                      <input
                        type="text"
                        placeholder="Enter custom type"
                        value={newPet.customType}
                        onChange={(e) => setNewPet({ ...newPet, customType: e.target.value })}
                        className="custom-input"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group-p">
                <label>Breed:</label>
                <div className="dropdown-wrapper">
                  <select
                    id="Breed"
                    name="Breed"
                    value={newPet.Breed}
                    onChange={handleInputChange}
                    className={newPet.Breed === "Others" || newPet.Type === "Others" ? "shrunk-select" : "full-width-select"}
                  >
                    <option value="">Select Breed</option>
                    {newPet.Type && newPet.Type !== "Others" ? (
                      petTypes[newPet.Type].map((breed) => ( // Keep "Others" in the list
                        <option key={breed} value={breed}>{breed}</option>
                      ))
                    ) : newPet.Type === "Others" ? (
                      <option value="Others">Others</option>
                    ) : (
                      <option value="">Select Type first</option>
                    )}
                  </select>
                  {(newPet.Breed === "Others" || newPet.Type === "Others") && (
                    <div className="custom-input-container">
                      <label className="others-label">Others</label>
                      <input
                        type="text"
                        placeholder="Enter custom breed"
                        value={newPet.customBreed}
                        onChange={(e) => setNewPet({ ...newPet, customBreed: e.target.value })}
                        className="custom-input"
                      />
                    </div>
                  )}
                </div>
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

  {showAppointmentModal && selectedAppointment && (
  <div className="modal-overlay-p">
    <div className="modal-content-p">
      <span
        className="close-button-p"
        onClick={() => setShowAppointmentModal(false)}
      >
        ×
      </span>
      <h2>Appointment Details</h2>
      <div className="pet-info-grid-p">
        <div className="info-item-p">
          <strong>Pet Name:</strong> {selectedAppointment.petName}
        </div>
        <div className="info-item-p">
          <strong>Clinic:</strong> {selectedAppointment.clinicName}
        </div>
        <div className="info-item-p">
          <strong>Service:</strong> {selectedAppointment.serviceType}
        </div>
        <div className="info-item-p">
          <strong>Veterinarian:</strong> {selectedAppointment.veterinarian}
        </div>
        <div className="info-item-p">
          <strong>Date:</strong> {formatDate(selectedAppointment.StartTime)}
        </div>
        <div className="info-item-p">
          <strong>Status:</strong> {selectedAppointment.status}
          </div>
        {selectedAppointment.status === "Pending Reschedule" && selectedAppointment.rescheduleDate && (
          <div className="info-item-p">
            <strong>Requested Reschedule Date:</strong> {formatDate(selectedAppointment.rescheduleDate)}
          </div>
        )}
      </div>
      <div className="info-item-p">
        <strong>Notes:</strong> {selectedAppointment.notes}
      </div>

      {!showReschedule ? (
        <div className="modal-actions-p">
          <button
            className="submit-btn-p"
            onClick={() => handleCancelAppointment(selectedAppointment.Id)}
            disabled={
              isRescheduling ||
              selectedAppointment.status === "Pending Cancellation" ||
              selectedAppointment.status === "Pending Reschedule" ||
              selectedAppointment.status === "Cancelled"
            }
          >
            Cancel Appointment
          </button>
          <button
            className="submit-btn-p"
            onClick={() => setShowReschedule(!showReschedule)}
            disabled={
              isRescheduling ||
              selectedAppointment.status === "Pending Cancellation" ||
              selectedAppointment.status === "Pending Reschedule" ||
              selectedAppointment.status === "Cancelled"
            }
          >
            Reschedule
          </button>
          <button
            className="modal-close-btn-p"
            onClick={() => setShowAppointmentModal(false)}
            disabled={isRescheduling}
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <h3>Reschedule Appointment</h3>
          <div className="reschedule-container-p">
            <div className="calendar-container-p">
              <Calendar
                onClickDay={handleCalendarDateClick}
                value={rescheduleDateTime || new Date()}
                minDate={new Date()}
                maxDate={(() => {
                  const max = new Date();
                  max.setMonth(max.getMonth() + 1);
                  return max;
                })()}  // Immediately invoke the function to return the date
                tileClassName={tileClassName}
                locale="en-US"
              />
            </div>
            <div className="time-picker-container-p">
              <label htmlFor="rescheduleTime">Select Time</label>
              <select
                id="rescheduleTime"
                value={
                  selectedRescheduleSlot ? selectedRescheduleSlot.time.toISOString() : ""
                }
                onChange={(e) => {
                  const selectedTime = availableSlots.find(
                    (slot) => slot.time.toISOString() === e.target.value
                  );
                  if (selectedTime) {
                    setSelectedRescheduleSlot(selectedTime);
                  }
                }}
                disabled={!rescheduleDateTime || isRescheduling || availableSlots.length === 0}
              >
                <option value="">Select a time</option>
                {availableSlots.map((slot, index) => (
                  <option key={index} value={slot.time.toISOString()}>
                    {slot.display}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-actions-p">
            <button
              className="submit-btn-p"
              onClick={() => handleCancelAppointment(selectedAppointment.Id)}
              disabled={
                isRescheduling ||
                selectedAppointment.status === "Pending Cancellation" ||
                selectedAppointment.status === "Pending Reschedule" ||
                selectedAppointment.status === "Cancelled"
              }
            >
              Cancel Appointment
            </button>
            <button
              className="submit-btn-p"
              onClick={() => handleRescheduleAppointment(selectedAppointment.Id)}
              disabled={isRescheduling || !selectedRescheduleSlot}
            >
              {isRescheduling ? "Rescheduling..." : "Save Reschedule"}
            </button>
            <button
              className="submit-btn-p"
              onClick={() => setShowReschedule(!showReschedule)}
              disabled={isRescheduling}
            >
              Cancel Reschedule
            </button>
            <button
              className="modal-close-btn-p"
              onClick={() => setShowAppointmentModal(false)}
              disabled={isRescheduling}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  </div>
  )}
      <Mobile_Footer
        onNotificationClick={handleNotificationClick}
        onAccountClick={handleAccountClick}
        activePanel={activePanel} 
        unreadNotifications={unreadNotifications}
        setActivePanel={setActivePanel}
        isVeterinarian={isVeterinarian}
      />
    </div>
  );
};

export default PetOwnerHome;