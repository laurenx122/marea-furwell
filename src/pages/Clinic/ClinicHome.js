import React, { useState, useEffect, useRef } from "react";
import "./ClinicHome.css";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import {
  FaCamera,
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaFileMedicalAlt,
  FaBriefcaseMedical,
  FaUserMd,
  FaChartBar,
  FaSignOutAlt,
  FaClinicMedical,
  FaEdit, FaTrash,
  FaTimes,
  FaPlus,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Month,
  Agenda,
  Inject,
} from "@syncfusion/ej2-react-schedule";
//npm install @syncfusion/ej2-grids --save
import { registerLicense } from "@syncfusion/ej2-base";
import emailjs from "emailjs-com";
import Mobile_Footer from '../../components/Footer/Mobile_Footer';

// Import Syncfusion CSS
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-buttons/styles/material.css";
import "@syncfusion/ej2-calendars/styles/material.css";
import "@syncfusion/ej2-dropdowns/styles/material.css";
import "@syncfusion/ej2-inputs/styles/material.css";
import "@syncfusion/ej2-navigations/styles/material.css";
import "@syncfusion/ej2-popups/styles/material.css";
import "@syncfusion/ej2-react-schedule/styles/material.css";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";

const ClinicHome = () => {

  const EMAILJS_PUBLIC_KEY = "6M4Xlw1XjSDBaIr4t";
  const EMAILJS_TEMPLATE_ID = "template_k8aiq7z";
  const EMAILJS_SERVICE_ID = "service_Furwell";
  const LOGO_URL = "https://furwell.vercel.app/images/furwell_logo.png";
  const [sentEmails, setSentEmails] = useState({});
  const [emailError, setEmailError] = useState(null);

  // Register Syncfusion license (replace with your valid key if different)
  registerLicense(
    "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
    // process.env.SYNC_REGISTER_LICENSE
    // "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
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


  // const [genderData, setGenderData] = useState([]);
  // const [speciesData, setSpeciesData] = useState([]);
  // const [ageData, setAgeData] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("patients");
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [services, setServices] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [userFirstName, setUserFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showAddVetModal, setShowAddVetModal] = useState(false);
  const [newVet, setNewVet] = useState({
    FirstName: "",
    LastName: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [vetImage, setVetImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [addingVet, setAddingVet] = useState(false);
  const [addVetError, setAddVetError] = useState("");
  const [addVetSuccess, setAddVetSuccess] = useState(false);
  const [isEditingClinic, setIsEditingClinic] = useState(false);
  const [editedClinicInfo, setEditedClinicInfo] = useState(null);
  const [newClinicImage, setNewClinicImage] = useState(null);
  const [clinicImagePreview, setClinicImagePreview] = useState(null);
  const [isUpdatingClinic, setIsUpdatingClinic] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSignOutSuccessOpen, setIsSignOutSuccessOpen] = useState(false);
  const [showVetInfoModal, setShowVetInfoModal] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [clinicServices, setClinicServices] = useState([]);
  const [newVetServices, setNewVetServices] = useState([]);
  const [vetSchedules, setVetSchedules] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState({ open: false, action: null, appointmentId: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [newSchedule, setNewSchedule] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicPasswordInput, setClinicPasswordInput] = useState("");
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newService, setNewService] = useState({ Type: "", Price: "" });
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [serviceError, setServiceError] = useState("");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_CLINIC_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const scheduleObj = useRef(null);

  const [serviceData, setServiceData] = useState([]);
  const [dayData, setDayData] = useState([]);

  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingVetSchedules, setEditingVetSchedules] = useState([]);
  const [editingVet, setEditingVet] = useState(null);
  const [vetAppointments, setVetAppointments] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [scheduleError, setScheduleError] = useState(""); 
  const [activeChart, setActiveChart] = useState(null);

  const [showConfirmDeleteScheduleModal, setShowConfirmDeleteScheduleModal] = useState(false);
  const [scheduleIndexToDelete, setScheduleIndexToDelete] = useState(null);
  const [showScheduleDeleteSuccess, setShowScheduleDeleteSuccess] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);

    const initializeComponent = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setLoading(true);
          try {
            await Promise.all([
              fetchUserFirstName(),
              fetchClinicInfo(),
              fetchPatients(),
              fetchAppointments(),
              fetchVeterinarians(),
              fetchChartData(),
              fetchPendingAppointments(),
            ]);
          } catch (error) {
            console.error("Error initializing data:", error);
          } finally {
            setLoading(false);
          }
        } else if(!isSigningOut){
          navigate("/Home");
        }
      });
      return () => unsubscribe();
    };

    initializeComponent();
  }, [navigate, isSigningOut]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      const sidebar = document.querySelector(".sidebar-c");
      const hamburgerButton = e.target.closest('.mobile-header-c button');

      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target) &&
        !hamburgerButton
      ) {
        setIsSidebarOpen(false);
      }

      const profileModal = document.querySelector(".profile-modal-c");
      const headerProfileImg = e.target.closest(".mobile-header-profile-img-c");

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

  //Analytics data
  const handlePanelChange = (panel) => {
    setActivePanel(panel);
    const container = document.querySelector(".content-c");
    if (container) {
      container.scrollTo(0, 0);
    }
    if (panel === "analytics") {
      fetchClinicAnalytics(); // Fetch analytics when switching to analytics panel
    }
  };
  const fetchClinicAnalytics = async () => {
    try {
      setLoading(true);
      const clinicId = auth.currentUser?.uid;
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("clinicId", "==", clinicId),
        where("status", "==", "Accepted") // Only count accepted appointments
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);

      const serviceCount = {};
      const dayCount = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
      };

      appointmentsSnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        const serviceType = appointmentData.serviceType || "Unknown";
        serviceCount[serviceType] = (serviceCount[serviceType] || 0) + 1;

        const appointmentDate = appointmentData.dateofAppointment
          ? typeof appointmentData.dateofAppointment.toDate === "function"
            ? appointmentData.dateofAppointment.toDate()
            : new Date(appointmentData.dateofAppointment)
          : null;
        if (appointmentDate) {
          const dayName = appointmentDate.toLocaleString("en-US", { weekday: "long" });
          dayCount[dayName] = (dayCount[dayName] || 0) + 1;
        }
      });

      const formattedServiceData = Object.entries(serviceCount).map(([service, count]) => ({
        id: service,
        label: service,
        value: count,
      }));

      const formattedDayData = Object.entries(dayCount).map(([day, count]) => ({
        id: day,
        label: day,
        value: count,
      }));

      setServiceData(formattedServiceData);
      setDayData(formattedDayData);
    } catch (error) {
      console.error("Error fetching clinic analytics:", error);
      setServiceData([]);
      setDayData([]);
    } finally {
      setLoading(false);
    }
  };


  // Format date function
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
  // Return default if no dateValue is provided
  if (!dateValue) return "N/A";

  let dob;
  // Handle Firestore Timestamp
  if (dateValue && typeof dateValue.toDate === "function") {
    dob = dateValue.toDate();
  }
  // Handle string date
  else if (typeof dateValue === "string") {
    dob = new Date(dateValue);
  }
  // Handle invalid or unsupported types
  else {
    return "N/A";
  }

  // Check if the date is valid
  if (isNaN(dob.getTime())) {
    return "N/A";
  }

  // Format the date of birth
  const formattedDate = dob.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Calculate age in decimal years
  const today = new Date("2025-03-23"); 
  const timeDiff = today.getTime() - dob.getTime(); 
  const ageYears = timeDiff / (1000 * 60 * 60 * 24 * 365.25); // Convert to years, accounting for leap years

  // Format age with one decimal place
  const ageFormatted = Math.abs(ageYears).toFixed(1); 
  const ageString = `${ageFormatted} ${ageFormatted === "1.0" ? "yr" : "yrs"}`;

  return `${formattedDate} (${ageString})`;

    // if (!dateValue) return "N/A";
    // let dob;
    // if (dateValue && typeof dateValue.toDate === "function") {
    //   dob = dateValue.toDate();
    // } else if (typeof dateValue === "string") {
    //   dob = new Date(dateValue);
    // } else {
    //   return "N/A";
    // }

    // const formattedDate = dob.toLocaleString("en-US", {
    //   month: "long",
    //   day: "numeric",
    //   year: "numeric",
    // });

    // const today = new Date("2025-03-23");
    // let age = today.getFullYear() - dob.getFullYear();
    // const monthDiff = today.getMonth() - dob.getMonth();
    // if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    //   age--;
    // }

    // return `${formattedDate} (${age})`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVetImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClinicImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewClinicImage(file);
      setClinicImagePreview(URL.createObjectURL(file));
      setShowClinicModal(true);
      setIsEditingClinic(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVet({ ...newVet, [name]: value });
  };

  const handleClinicInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClinicInfo({ ...editedClinicInfo, [name]: value });
  };

  const handleServiceToggle = (serviceName) => {
    setNewVetServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((name) => name !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;
  
    if (name === "startTime" || name === "endTime") {
      // Ensure minutes are always "00"
      const [hours] = value.split(":");
      updatedValue = `${hours}:00`;
  
      // Forcefully set the input value to our formatted value
      e.target.value = updatedValue;
    }
  
    setNewSchedule((prev) => ({ ...prev, [name]: updatedValue }));
    setScheduleError(""); // Clear error on input change
  };

  // const addSchedule = () => {
  //   if (newSchedule.day && newSchedule.startTime && newSchedule.endTime) {
  //     setVetSchedules((prev) => [...prev, newSchedule]);
  //     setNewSchedule({ day: "", startTime: "", endTime: "" });
  //   }
  // };

  // Get available days (exclude already selected days)
  const allDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getAvailableDays = () => {
    const usedDays = vetSchedules.map((schedule) => schedule.day);
    return allDays.filter((day) => !usedDays.includes(day));
  };

  // Add a new schedule with validation
  const addSchedule = () => {
    const { day, startTime, endTime } = newSchedule;

    // Validate inputs
    if (!day || !startTime || !endTime) {
      setScheduleError("Please select a day, start time, and end time.");
      return;
    }

    // Validate that startTime and endTime are not the same
    if (startTime === endTime) {
      setScheduleError("Start time and end time cannot be the same.");
      return;
    }

    // Add schedule to temporary list
    setVetSchedules([...vetSchedules, { day, startTime, endTime }]);
    setNewSchedule({ day: "", startTime: "", endTime: "" });
    setScheduleError("");
  };

  const removeSchedule = (index) => {
    setVetSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchUserFirstName = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserFirstName(userData.FirstName || "Unknown");
          setClinicEmail(currentUser.email);
        } else {
          setUserFirstName("Unknown");
        }
      }
    } catch (error) {
      console.error("Error fetching user FirstName:", error);
      setUserFirstName("Unknown");
    }
  };

  const fetchClinicInfo = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        const clinicDoc = await getDoc(clinicRef);
        if (clinicDoc.exists()) {
          const clinicData = clinicDoc.data();
          setClinicInfo({
            id: clinicDoc.id,
            clinicDescription: clinicData.clinicDescription || "",
            clinicName: clinicData.clinicName || `Clinic of ${userFirstName}`,
            phone: clinicData.phone || "",
            streetAddress: clinicData.streetAddress || "",
            city: clinicData.city || "",
            profileImageURL: clinicData.profileImageURL || DEFAULT_CLINIC_IMAGE,
          });
          setEditedClinicInfo({
            id: clinicDoc.id,
            clinicDescription: clinicData.clinicDescription || "",
            clinicName: clinicData.clinicName || `Clinic of ${userFirstName}`,
            phone: clinicData.phone || "",
            streetAddress: clinicData.streetAddress || "",
            city: clinicData.city || "",
            profileImageURL: clinicData.profileImageURL || DEFAULT_CLINIC_IMAGE,
          });

          const servicePricesMap = clinicData.servicePrices || {};
          const servicesArray = Object.entries(servicePricesMap).map(
            ([serviceName, price]) => ({
              Type: serviceName,
              Price: price,
            })
          );
          setClinicServices(servicesArray);
          setServices(servicesArray);
        } else {
          setClinicInfo({
            clinicName: `Clinic of ${userFirstName}`,
            profileImageURL: DEFAULT_CLINIC_IMAGE,
          });
          setEditedClinicInfo({
            clinicName: `Clinic of ${userFirstName}`,
            profileImageURL: DEFAULT_CLINIC_IMAGE,
          });
          setClinicServices([]);
          setServices([]);
        }
      }
    } catch (error) {
      console.error("Error fetching clinic info:", error);
      setClinicInfo({
        clinicName: `Clinic of ${userFirstName}`,
        profileImageURL: DEFAULT_CLINIC_IMAGE,
      });
      setEditedClinicInfo({
        clinicName: `Clinic of ${userFirstName}`,
        profileImageURL: DEFAULT_CLINIC_IMAGE,
      });
      setClinicServices([]);
      setServices([]);
    } finally {
      setLoading(false);
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

  // Fetch pending appointments
  const fetchPendingAppointments = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found.");
        return;
      }

      const q = query(
        collection(db, "appointments"),
        where("status", "==", "pending"),
        where("clinicId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      console.log("Pending Appointments Count:", querySnapshot.size);

      if (querySnapshot.empty) {
        console.log("No pending appointments found.");
        setPendingAppointments([]);
        return;
      }

      const appointmentsList = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log("Appointment Data:", data); // Log each appointment's data

          const [ownerData, petData, clinicData] = await Promise.all([
            data.owner ? getDoc(data.owner) : Promise.resolve(null),
            data.petRef ? getDoc(data.petRef) : Promise.resolve(null),
            data.clinic ? getDoc(data.clinic) : Promise.resolve(null),
          ]);

          return {
            id: doc.id,
            ...data,
            owner: ownerData?.data() || {},
            petRef: petData?.data() || {},
            clinic: clinicData?.data() || {},
          };
        })
      );

      console.log("Processed Appointments List:", appointmentsList); // Log the final processed list
      setPendingAppointments(appointmentsList);
    } catch (error) {
      console.error("Error fetching pending appointments:", error);
      setPendingAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter pending appointments based on search query
  const filteredPendingAppointments = pendingAppointments.filter((appointment) => {
    const ownerName = `${appointment.owner?.FirstName || ""} ${appointment.owner?.LastName || ""}`.trim() || "N/A";
    return (
      (appointment.petName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appointment.serviceType?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  });

  //Action confirmation modal
  const handleActionConfirm = async (action) => {
    if (processing) return;
    setProcessing(true);
    const { appointmentId } = showConfirmModal;
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      if (!appointmentDoc.exists()) throw new Error("Appointment not found");

      const appointmentData = appointmentDoc.data();

      if (action === "accept") {
        const newData = {
          ...appointmentData,
          status: "Accepted",
          timestamp: new Date().toISOString(),
        };
        await updateDoc(appointmentRef, newData);

        // Create notification
        const notificationRef = collection(db, "notifications");
        const appointmentDate = appointmentData.dateofAppointment.toDate();
        const formattedDateTime = formatDate(appointmentDate);

        await setDoc(doc(notificationRef), {
          appointmentId: appointmentId,
          clinicId: auth.currentUser.uid,
          ownerId: appointmentData.owner?.path || null,
          petId: appointmentData.petRef?.path || null,
          messageVet: `You have a new appointment on ${formattedDateTime} for ${appointmentData.petName}`,
          message: `Your appointment for ${appointmentData.petName} has been accepted by ${clinicInfo?.clinicName}.`,
          dateCreated: serverTimestamp(),
          hasVetOpened: false,
          hasPetOwnerOpened: false,
          status: "unread",
          type: "appointment_accepted",
          removeViewPetOwner: false,
        });

        // Send email to pet owner
        const appointmentKey = `accepted-${appointmentId}`;
        if (!sentEmails[appointmentKey]) {
          const ownerDoc = appointmentData.owner ? await getDoc(appointmentData.owner) : null;
          const clinicDoc = await getDoc(doc(db, "clinics", auth.currentUser.uid));
          const petDoc = appointmentData.petRef ? await getDoc(appointmentData.petRef) : null;

          if (!clinicDoc.exists() || !petDoc?.exists()) {
            throw new Error("Missing clinic or pet data for email");
          }

          let ownerEmail = "default@email.com";
          let ownerName = "Pet Owner";
          if (ownerDoc?.exists()) {
            const ownerData = ownerDoc.data();
            ownerEmail = ownerData.email || ownerEmail;
            ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || ownerName;
          } else {
            // Fallback to Firebase Auth email
            const user = auth.currentUser;
            if (user && appointmentData.owner?.id === user.uid) {
              ownerEmail = user.email || ownerEmail;
            }
          }

          const clinicData = clinicDoc.data();
          const petData = petDoc.data();

          const apptDate = appointmentData.dateofAppointment.toDate();
          const date = apptDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const time = apptDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          const location = `${clinicData.streetAddress || ""}, ${clinicData.province || ""}, ${clinicData.city || ""}`
            .trim()
            .replace(/,\s*,/g, ",")
            .replace(/,\s*$/, "") || "N/A";

          const emailParams = {
            name: ownerName,
            pet_name: petData.petName || "Your Pet",
            clinic: clinicData.clinicName || "Our Clinic",
            service: appointmentData.serviceType || "N/A",
            date: date,
            time: time,
            location: location,
            vet_name: appointmentData.veterinarian || "N/A",
            message: `Your appointment for ${appointmentData.petName} has been accepted by ${clinicInfo?.clinicName}.`,
            email: ownerEmail,
            logo: LOGO_URL,
            status: "Accepted",
          };

          console.log("Email Params:", emailParams);

          await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            emailParams,
            EMAILJS_PUBLIC_KEY
          );

          console.log("Acceptance email sent successfully for appointment:", appointmentId);
          setSentEmails((prev) => ({ ...prev, [appointmentKey]: true }));
        } else {
          console.log("Email already sent for appointment:", appointmentKey);
        }

        await fetchAppointments();
        console.log("Appointment accepted successfully and notification created!");
      } else if (action === "decline") {
        await updateDoc(appointmentRef, { status: "Declined" });
        await fetchPendingAppointments();
        console.log("Appointment declined successfully!");
      }

      setPendingAppointments(pendingAppointments.filter((appt) => appt.id !== appointmentId));
      setShowConfirmModal({ open: false, action: null, appointmentId: null });
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      setEmailError(`Failed to ${action} appointment or send email: ${error.message}`);
    }
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
  const handleAction = (action, appointmentId) => {
    setShowConfirmModal({ open: true, action: action, appointmentId: appointmentId });
  };
  const handleAddVet = async (e) => {
    e.preventDefault();
    setAddingVet(true);
    setAddVetError("");
    setAddVetSuccess(false);

    try {
      const { FirstName, LastName, contactNumber, email, password, confirmPassword } = newVet;
      if (!FirstName || !LastName || !email || !password || !confirmPassword) {
        throw new Error("All fields are required");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (!clinicPasswordInput) {
        throw new Error("Please enter your clinic password");
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in to add a veterinarian");
      const clinicUid = currentUser.uid;

      const credential = EmailAuthProvider.credential(clinicEmail, clinicPasswordInput);
      try {
        await reauthenticateWithCredential(currentUser, credential);
      } catch (reAuthError) {
        setAddVetError("Incorrect clinic password. Please try again.");
        setAddingVet(false);
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);
      const vetUid = auth.currentUser.uid;

      await signInWithEmailAndPassword(auth, clinicEmail, clinicPasswordInput);

      let profileImageURL = DEFAULT_VET_IMAGE;
      if (vetImage && ["image/jpeg", "image/jpg", "image/png"].includes(vetImage.type)) {
        const image = new FormData();
        image.append("file", vetImage);
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

      const clinicRef = doc(db, "clinics", clinicUid);
      const vetDocRef = doc(db, "users", vetUid);

      await setDoc(vetDocRef, {
        FirstName,
        LastName,
        contactNumber,
        email,
        profileImageURL,
        Type: "Veterinarian",
        clinic: clinicRef,
        uid: vetUid,
        services: newVetServices,
        schedule: vetSchedules,
        status: "Available",
        createdAt: serverTimestamp(),
      });

      setAddVetSuccess(true);
      setNewVet({
        FirstName: "",
        LastName: "",
        contactNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setVetImage(null);
      setImagePreview(null);
      setNewVetServices([]);
      setVetSchedules([]);
      setNewSchedule({ day: "", startTime: "", endTime: "" });
      setClinicPasswordInput("");
      fetchVeterinarians();
      setTimeout(() => {
        setShowAddVetModal(false);
        setAddVetSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding veterinarian:", error);
      if (error.code === "auth/email-already-in-use") {
        setAddVetError("This email is already in use. Please use a different email.");
        await signInWithEmailAndPassword(auth, clinicEmail, clinicPasswordInput).catch(
          (signInError) => {
            console.error("Failed to restore clinic session:", signInError);
            setAddVetError("Failed to restore session. Please re-login.");
            navigate("/login");
          }
        );
      } else if (error.code !== "auth/wrong-password") {
        setAddVetError(error.message || "Failed to add veterinarian");
      }
      setAddingVet(false);
    }
  };

  const handleSaveClinicInfo = async () => {
    try {
      setIsUpdatingClinic(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        let profileImageURL = editedClinicInfo.profileImageURL;

        if (newClinicImage && ["image/jpeg", "image/jpg", "image/png"].includes(newClinicImage.type)) {
          const image = new FormData();
          image.append("file", newClinicImage);
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

        await updateDoc(clinicRef, {
          clinicDescription: editedClinicInfo.clinicDescription,
          clinicName: editedClinicInfo.clinicName,
          phone: editedClinicInfo.phone,
          streetAddress: editedClinicInfo.streetAddress,
          city: editedClinicInfo.city,
          profileImageURL,
        });

        setClinicInfo({ ...editedClinicInfo, profileImageURL });
        setNewClinicImage(null);
        setClinicImagePreview(null);
        setIsEditingClinic(false);
        setShowClinicModal(false);
      }
    } catch (error) {
      console.error("Error updating clinic info:", error);
    } finally {
      setIsUpdatingClinic(false);
    }
  };

  const handleSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const confirmSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut(getAuth());
      setIsSignOutConfirmOpen(false);
      setIsSignOutSuccessOpen(true); 
      setTimeout(() => {
        setIsSignOutSuccessOpen(false);
        setIsSigningOut(false); 
        navigate("/Home");
      }, 2000);
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSignOutConfirmOpen(false);
      setIsSigningOut(false); 
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("clinic", "==", clinicRef)
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const patientIds = new Set();
        const patientsList = [];

        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          const petRef = appointmentData.petRef;

          if (petRef && !patientIds.has(petRef.id)) {
            const petDoc = await getDoc(petRef);
            if (petDoc.exists()) {
              patientsList.push({ id: petDoc.id, ...petDoc.data() });
              patientIds.add(petRef.id);
            }
          }
        }

        setPatients(patientsList);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("clinic", "==", clinicRef),
          where("status", "in", ["Accepted", "Request Cancel", "Request Reschedule"])
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const currentAppointmentsList = [];
        const pastAppointmentsList = [];
        const today = new Date();

        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          console.log("Appointment Status:", appointmentData.status, "Reschedule Date:", appointmentData.rescheduleDate); // Add this
          let ownerName = "Unknown Owner";
          let petName = appointmentData.petName || "Unknown Pet";
          const vetName = appointmentData.veterinarian || "N/A";

          if (appointmentData.owner && typeof appointmentData.owner === "object") {
            const ownerDoc = await getDoc(appointmentData.owner);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "Unknown Owner";
            }
          }

          if (!appointmentData.petName && appointmentData.petRef) {
            const petDoc = await getDoc(appointmentData.petRef);
            if (petDoc.exists()) {
              petName = petDoc.data().petName || "Unknown Pet";
            }
          }

          const startTime = appointmentData.dateofAppointment.toDate();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

          const appointmentDetails = {
            Id: appointmentDoc.id,
            Subject: `${petName} - ${appointmentData.serviceType || "N/A"}`,
            StartTime: startTime,
            EndTime: endTime,
            petName,
            ownerName,
            serviceType: appointmentData.serviceType || "N/A",
            veterinarian: vetName,
            remarks: appointmentData.completionRemark || "No remarks",
            notes: appointmentData.notes || "No Notes",
            dateofAppointment: startTime,
            status: appointmentData.status || "Accepted",
            rescheduleDate: appointmentData.rescheduleDate || null,
          };

          if (startTime < today && appointmentData.status === "Accepted") {
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
  const fetchCompletedAppointments = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const clinicRef = doc(db, "clinics", currentUser.uid);
        const completedAppointmentsQuery = query(
          collection(db, "appointments"),
          where("clinic", "==", clinicRef),
          where("status", "==", "Completed")
        );
        const querySnapshot = await getDocs(completedAppointmentsQuery);
        const completedAppointmentsList = [];

        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          let ownerName = "Unknown Owner";
          let petName = appointmentData.petName || "Unknown Pet";
          const vetName = appointmentData.veterinarian || "N/A";

          if (appointmentData.owner && typeof appointmentData.owner === "object") {
            const ownerDoc = await getDoc(appointmentData.owner);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "Unknown Owner";
            }
          }

          if (!appointmentData.petName && appointmentData.petRef) {
            const petDoc = await getDoc(appointmentData.petRef);
            if (petDoc.exists()) {
              petName = petDoc.data().petName || "Unknown Pet";
            }
          }

          const startTime = appointmentData.dateofAppointment.toDate();

          completedAppointmentsList.push({
            Id: appointmentDoc.id,
            petName,
            ownerName,
            serviceType: appointmentData.serviceType || "N/A",
            veterinarian: vetName,
            remarks: appointmentData.completionRemark || "No remarks",
            diagnosis: appointmentData.diagnosis || "No diagnosis",
            dateofAppointment: startTime,
          });
        }

        setCompletedAppointments(completedAppointmentsList); // Update completedAppointments state
      }
    } catch (error) {
      console.error("Error fetching completed appointments:", error);
      setCompletedAppointments([]); // Clear state on error
    } finally {
      setLoading(false);
    }
  };
  const handleAcceptRequest = async (appointmentId, requestType) => {
    try {
      console.log(`Accepting ${requestType} for appointment:`, appointmentId);
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      if (!appointmentDoc.exists()) throw new Error("Appointment not found");

      const appointmentData = appointmentDoc.data();
      console.log("Appointment Data:", appointmentData);

      const ownerDoc = appointmentData.owner ? await getDoc(appointmentData.owner) : null;
      const petDoc = appointmentData.petRef ? await getDoc(appointmentData.petRef) : null;
      const clinicDoc = await getDoc(doc(db, "clinics", auth.currentUser.uid));

      if (!ownerDoc?.exists() || !petDoc?.exists() || !clinicDoc.exists()) {
        throw new Error("Missing required data for notification");
      }

      const ownerData = ownerDoc.data();
      const petData = petDoc.data();
      const clinicData = clinicDoc.data();

      const apptDate = appointmentData.dateofAppointment.toDate();
      const date = apptDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const time = apptDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "Pet Owner";
      const ownerEmail = ownerData.email || "default@email.com";

      if (requestType === "cancel") {
        // Accept cancellation
        await updateDoc(appointmentRef, {
          status: "Cancelled",
          updatedAt: serverTimestamp(),
        });

        // Create notification
        await setDoc(doc(collection(db, "notifications")), {
          appointmentId,
          clinicId: auth.currentUser.uid,
          ownerId: appointmentData.owner?.path || `users/${ownerData.uid}`,
          petId: appointmentData.petRef?.path || null,
          message: `Your cancellation request for ${petData.petName}'s appointment on ${date} at ${time} has been approved by ${clinicData.clinicName}.`,
          dateCreated: serverTimestamp(),
          hasPetOwnerOpened: false,
          status: "unread",
          type: "cancellation_approved",
          removeViewPetOwner: false
        });

        // Send email
        const emailKey = `cancel-approved-${appointmentId}`;
        if (!sentEmails[emailKey]) {
          const emailParams = {
            name: ownerName,
            pet_name: petData.petName,
            clinic: clinicData.clinicName,
            service: appointmentData.serviceType || "N/A",
            date,
            time,
            email: ownerEmail,
            logo: LOGO_URL,
            message: `Your cancellation request for ${petData.petName}'s appointment on ${date} at ${time} has been approved.`,
            status: "Cancelled",
          };
          try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
            setSentEmails((prev) => ({ ...prev, [emailKey]: true }));
          } catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
            setEmailError("Cancellation approved, but failed to send email notification.");
          }
        }
      } else if (requestType === "reschedule") {
        // Accept reschedule
        if (!appointmentData.rescheduleDate) {
          throw new Error("Reschedule date is missing");
        }
        const rescheduleDate = appointmentData.rescheduleDate.toDate
          ? appointmentData.rescheduleDate.toDate()
          : new Date(appointmentData.rescheduleDate);
        if (isNaN(rescheduleDate.getTime())) {
          throw new Error("Invalid reschedule date");
        }

        await updateDoc(appointmentRef, {
          dateofAppointment: appointmentData.rescheduleDate,
          status: "Accepted",
          updatedAt: serverTimestamp(),
          rescheduleDate: null,
        });
        // Create notification
        await setDoc(doc(collection(db, "notifications")), {
          appointmentId,
          clinicId: auth.currentUser.uid,
          ownerId: appointmentData.owner?.path || `users/${ownerData.uid}`,
          petId: appointmentData.petRef?.path || null,
          message: `Your ${requestType} request for ${petData.petName}'s appointment on ${date} at ${time} was declined by ${clinicData.clinicName}.`,
          dateCreated: serverTimestamp(),
          hasPetOwnerOpened: false,
          status: "unread",
          type: `${requestType}_declined`,
        });

        // Create notification
        const newDate = rescheduleDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const newTime = rescheduleDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        await setDoc(doc(collection(db, "notifications")), {
          appointmentId,
          clinicId: auth.currentUser.uid,
          ownerId: appointmentData.owner?.path || `users/${ownerData.uid}`,
          petId: appointmentData.petRef?.path || null,
          message: `Your reschedule request for ${petData.petName}'s appointment has been approved by ${clinicData.clinicName}. New time: ${newDate} at ${newTime}.`,
          dateCreated: serverTimestamp(),
          hasPetOwnerOpened: false,
          status: "unread",
          type: "reschedule_approved",
          removeViewPetOwner: false,
        });

        await updateDoc(appointmentRef, {
          dateofAppointment: appointmentData.rescheduleDate,
          status: "Accepted",
          updatedAt: serverTimestamp(),
          rescheduleDate: null,
        }).catch((error) => {
          console.error("Update Error:", error);
          throw error;
        });

        // Send email
        const emailKey = `reschedule-approved-${appointmentId}`;
        if (!sentEmails[emailKey]) {
          const emailParams = {
            name: ownerName,
            pet_name: petData.petName,
            clinic: clinicData.clinicName,
            service: appointmentData.serviceType || "N/A",
            date: newDate,
            time: newTime,
            email: ownerEmail,
            logo: LOGO_URL,
            message: `Your reschedule request for ${petData.petName}'s appointment has been approved. New time: ${newDate} at ${newTime}.`,
            status: "Rescheduled",};
          try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
            setSentEmails((prev) => ({ ...prev, [emailKey]: true }));
          } catch (emailError) {
            console.error("Failed to send reschedule email:", emailError);
            setEmailError("Reschedule approved, but failed to send email notification.");
          }
        }
      }

      // Refresh appointments
      await fetchAppointments();
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error(`Error accepting ${requestType} request:`, error);
      setEmailError(`Failed to accept ${requestType} request: ${error.message}`);
    }
  };

  // Handle decline request
  const handleDeclineRequest = async (appointmentId, requestType) => {
    try {
      console.log(`Declining ${requestType} for appointment:`, appointmentId);
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      if (!appointmentDoc.exists()) throw new Error("Appointment not found");

      const appointmentData = appointmentDoc.data();
      console.log("Appointment Data:", appointmentData);

      const ownerDoc = appointmentData.owner ? await getDoc(appointmentData.owner) : null;
      const petDoc = appointmentData.petRef ? await getDoc(appointmentData.petRef) : null;
      const clinicDoc = await getDoc(doc(db, "clinics", auth.currentUser.uid));

      if (!ownerDoc?.exists() || !petDoc?.exists() || !clinicDoc.exists()) {
        throw new Error("Missing required data for notification");
      }

      const ownerData = ownerDoc.data();
      const petData = petDoc.data();
      const clinicData = clinicDoc.data();

      const apptDate = appointmentData.dateofAppointment.toDate();
      const date = apptDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const time = apptDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "Pet Owner";
      const ownerEmail = ownerData.email || "default@email.com";

      // Revert to "Accepted" status
      await updateDoc(appointmentRef, {
        status: "Accepted",
        updatedAt: serverTimestamp(),
        rescheduleDate: null,
      }).catch((error) => {
        console.error("Update Error:", error);
        throw error;
      });

      // Create notification
      await setDoc(doc(collection(db, "notifications")), {
        appointmentId,
        clinicId: auth.currentUser.uid,
        ownerId: appointmentData.owner?.path || `users/${ownerData.uid}`,
        petId: appointmentData.petRef?.path || null,
        message: `Your ${requestType} request for ${petData.petName}'s appointment on ${date} at ${time} was declined by ${clinicData.clinicName}.`,
        dateCreated: serverTimestamp(),
        hasPetOwnerOpened: false,
        status: "unread",
        type: `${requestType}_declined`,
        removeViewPetOwner: false,
      }).catch((error) => {
        console.error("Notification Creation Error:", error);
        throw error;
      });

      // Send email
      const emailKey = `${requestType}-declined-${appointmentId}`;
      if (!sentEmails[emailKey]) {
        const emailParams = {
          name: ownerName,
          pet_name: petData.petName,
          clinic: clinicData.clinicName,
          service: appointmentData.serviceType || "N/A",
          date,
          time,
          email: ownerEmail,
          logo: LOGO_URL,
          message: `Your ${requestType} request for ${petData.petName}'s appointment on ${date} at ${time} was declined.`,
          status: "Declined",
        };
        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
          setSentEmails((prev) => ({ ...prev, [emailKey]: true }));
        } catch (emailError) {
          console.error("Failed to send decline email:", emailError);
          setEmailError(`Decline completed, but failed to send email notification.`);
        }
      }

      // Refresh appointments
      await fetchAppointments();
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error(`Error declining ${requestType} request:`, error);
      setEmailError(`Failed to decline ${requestType} request: ${error.message}`);
    }
  };


  const fetchVeterinarians = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const vetsQuery = query(
          collection(db, "users"),
          where("Type", "==", "Veterinarian"),
          where("clinic", "==", doc(db, "clinics", currentUser.uid))
        );
        const querySnapshot = await getDocs(vetsQuery);
        const vetList = [];
        // querySnapshot.forEach((doc) => {
        //   vetList.push({ id: doc.id, ...doc.data() });
        // });

        for (const docSnapshot of querySnapshot.docs) {
          const vetData = docSnapshot.data();
          const vetId = docSnapshot.id;

          // Check if status exists; if not, update Firestore document
          if (!vetData.hasOwnProperty("status")) {
            const vetRef = doc(db, "users", vetId);
            await updateDoc(vetRef, { status: "Available" });
            vetData.status = "Available"; // update local data to reflect change
          }

          vetList.push({ id: vetId, ...vetData });
        }
        setVeterinarians(vetList);
      }
    } catch (error) {
      console.error("Error fetching veterinarians:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVetNameClick = (vet) => {
    setSelectedVet(vet);
    setShowVetInfoModal(true);
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };
  const onEventClick = (args) => {
    const appointment = appointments.find((appt) => appt.Id === args.event.Id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowAppointmentModal(true);
    }
  };

  const closeAppointmentModal = () => {
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
  };

  const closePatientModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
  };

  const onCellClick = (args) => {
    args.cancel = true; // Prevent adding new events
  };

  const fetchChartData = async () => {
    /*/try {
      setLoading(true);
      const petsQuery = query(collection(db, "pets"));
      const querySnapshot = await getDocs(petsQuery);

      const genderCount = {};
      const speciesCount = {};
      const ageCounts = {};
      let totalGenders = 0;
      let totalPets = 0;

      querySnapshot.forEach((doc) => {
        const petData = doc.data();
        console.log("Pet Data:", petData);
        // Count gender
        const gender = petData.Gender || "Unknown";
        genderCount[gender] = (genderCount[gender] || 0) + 1;
        totalGenders++;

        // Count species
        const species = petData.Species || "Unknown";
        speciesCount[species] = (speciesCount[species] || 0) + 1;
        totalPets++;

        // Count ages
        const dateOfBirth = petData.dateofBirth ? (typeof petData.dateofBirth.toDate === 'function' ? petData.dateofBirth.toDate() : new Date(petData.dateofBirth)) : undefined;
          if (dateOfBirth) {
              const now = new Date();
              const ageInYears = now.getFullYear() - dateOfBirth.getFullYear();
              ageCounts[ageInYears] = (ageCounts[ageInYears] || 0) + 1;
          }
      });

      console.log("Gender Count:", genderCount);
      console.log("Species Count:", speciesCount); // ADD THIS LINE
      console.log("Age Counts:", ageCounts); // ADD THIS LINE
        
      // Format gender data for bar chart
      const formattedGenderData = Object.entries(genderCount).map(([key, value]) => ({
        id: key,
        label: key,
        value: value,
      }));

      // Format species data for pie chart
      const formattedSpeciesData = Object.entries(speciesCount).map(([key, value]) => ({
        id: key,
        label: key,
        count: value,
        value: ((value / totalPets) * 100),
        formattedValue: `${((value / totalPets) * 100)}%`
      }));

      // Format age data for pie chart
      const formattedAgeData = Object.entries(ageCounts).map(([age, count]) => ({
        id: `${age} years`,
        label: `${age} years`,
        value: count,
      }));

      setGenderData(formattedGenderData);
      setSpeciesData(formattedSpeciesData);
      setAgeData(formattedAgeData);

    } catch (error) {
      console.error("Error fetching chart data:", error);
      setGenderData([]);
      setSpeciesData([]);
      setAgeData([]);
    } finally {
      setLoading(false);
    }/*/
  };


  useEffect(() => {
    const initializeData = async () => {
      await fetchUserFirstName();
      await fetchClinicInfo();
      fetchPatients();
      fetchAppointments(); // Ensure this is included
      fetchVeterinarians();
      fetchChartData();
      fetchPendingAppointments();
      fetchCompletedAppointments();
    };
    initializeData();
  }, [userFirstName]);

  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setNewService({ ...newService, [name]: value });
  };

  const handleAddOrEditService = async (e) => {
    e.preventDefault();
    setServiceError("");

    if (!newService.Type || !newService.Price) {
      setServiceError("Both service type and price are required.");
      return;
    }

    const price = parseFloat(newService.Price);
    if (isNaN(price) || price < 0) {
      setServiceError("Price must be a valid positive number.");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in to modify services");

      const clinicRef = doc(db, "clinics", currentUser.uid);
      let updatedServices = [...services];

      if (editingServiceIndex !== null) {
        // Edit existing service
        updatedServices[editingServiceIndex] = { Type: newService.Type, Price: newService.Price };
      } else {
        // Add new service
        updatedServices.push({ Type: newService.Type, Price: newService.Price });
      }

      const servicePricesMap = updatedServices.reduce((acc, service) => {
        acc[service.Type] = service.Price;
        return acc;
      }, {});

      await updateDoc(clinicRef, { servicePrices: servicePricesMap });
      setServices(updatedServices);
      setClinicServices(updatedServices);
      setNewService({ Type: "", Price: "" });
      setEditingServiceIndex(null);
      setShowServiceModal(false);
    } catch (error) {
      console.error("Error saving service:", error);
      setServiceError("Failed to save service. Please try again.");
    }
  };

  const handleEditService = (index) => {
    setNewService(services[index]);
    setEditingServiceIndex(index);
    setShowServiceModal(true);
  };

  const handleDeleteService = async (index) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("You must be logged in to delete services");

        const updatedServices = services.filter((_, i) => i !== index);
        const servicePricesMap = updatedServices.reduce((acc, service) => {
          acc[service.Type] = service.Price;
          return acc;
        }, {});

        const clinicRef = doc(db, "clinics", currentUser.uid);
        await updateDoc(clinicRef, { servicePrices: servicePricesMap });
        setServices(updatedServices);
        setClinicServices(updatedServices);
      } catch (error) {
        console.error("Error deleting service:", error);
        alert("Failed to delete service. Please try again.");
      }
    }
  };
  const handleAccountClick = () => {
    setActivePanel("clinic");
  };

  // edit vet schedule
  const handleEditScheduleClick = (vet) => {
    setEditingVet(vet);
    setEditingVetSchedules(vet.schedule || []);
    setNewSchedule({ day: "", startTime: "", endTime: "" });

    // Fetch upcoming appointments for this veterinarian
    const fetchVetAppointments = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const clinicRef = doc(db, "clinics", currentUser.uid);
          const appointmentsQuery = query(
            collection(db, "appointments"),
            where("status", "==", "Accepted"),
            where("clinic", "==", clinicRef),
            where("veterinarian", "==", `${vet.FirstName} ${vet.LastName}`)
          );
          const querySnapshot = await getDocs(appointmentsQuery);
          const today = new Date();
          const upcomingAppointments = [];

          for (const appointmentDoc of querySnapshot.docs) {
            const appointmentData = appointmentDoc.data();
            const startTime = appointmentData.dateofAppointment.toDate();

            if (startTime >= today) {
              upcomingAppointments.push({
                Id: appointmentDoc.id,
                StartTime: startTime,
                EndTime: new Date(startTime.getTime() + 60 * 60 * 1000),
                ...appointmentData,
              });
            }
          }

          setVetAppointments(upcomingAppointments);
        }
      } catch (error) {
        console.error("Error fetching vet appointments:", error);
        setVetAppointments([]);
      }
    };

    fetchVetAppointments();
    setShowEditScheduleModal(true);
  };

  const hasOverlappingAppointments = (schedule, appointments) => {
    const { day, startTime, endTime } = schedule;

    // Convert startTime and endTime to minutes for easier comparison
    const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
    const endMinutes = parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);

    return appointments.some((appointment) => {
      const apptDate = appointment.StartTime;
      const apptDay = apptDate.toLocaleString("en-US", { weekday: "long" });

      if (apptDay !== day) return false;

      const apptStartMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();
      const apptEndMinutes = apptStartMinutes + 60; // Assuming appointments are 1 hour long

      // Check for overlap: if appointment starts before schedule ends and ends after schedule starts
      return apptStartMinutes < endMinutes && apptEndMinutes > startMinutes;
    });
  };

  // Add a new schedule to the editing vet schedules
  // const addEditingSchedule = () => {
  //   if (newSchedule.day && newSchedule.startTime && newSchedule.endTime) {
  //     setEditingVetSchedules((prev) => [...prev, newSchedule]);
  //     setNewSchedule({ day: "", startTime: "", endTime: "" });
  //   }
  // };
  const addEditingSchedule = () => {
    const { day, startTime, endTime } = newSchedule;
  
    // Validate inputs
    if (!day || !startTime || !endTime) {
      setScheduleError("Please select a day, start time, and end time.");
      return;
    }
  
    // Validate that startTime and endTime are not the same
    if (startTime === endTime) {
      setScheduleError("Start time and end time cannot be the same.");
      return;
    }
  
    // Add schedule to temporary list
    setEditingVetSchedules([...editingVetSchedules, { day, startTime, endTime }]);
    setNewSchedule({ day: "", startTime: "", endTime: "" });
    setScheduleError("");
  };

  // Remove a schedule from the editing vet schedules
  // const removeEditingSchedule = (index) => {
  //   setEditingVetSchedules((prev) => prev.filter((_, i) => i !== index));
  // };
  const removeEditingSchedule = (index) => {
    const scheduleToDelete = editingVetSchedules[index];
    const isDisabled = hasOverlappingAppointments(scheduleToDelete, vetAppointments);

    if (isDisabled) {
      showVetSchedModal(
        "Error",
        "Cannot delete: This schedule has upcoming appointments.",
        [{ text: "OK", onClick: closeVetSchedModal }]
      );
      return;
    }

    showVetSchedModal(
      "Confirm Delete",
      `Are you sure you want to delete the schedule for ${scheduleToDelete.day} (${scheduleToDelete.startTime} - ${scheduleToDelete.endTime})? You must save changes to apply this deletion.`,
      [
        {
          text: "Delete",
          onClick: () => {
            setEditingVetSchedules((prev) => prev.filter((_, i) => i !== index));
            closeVetSchedModal();
            // Removed the alert here
          },
          className: "delete-button",
        },
        { text: "Cancel", onClick: closeVetSchedModal, className: "cancel-button" },
      ]
    );
  };

  let vetSchedModal;
  let vetSchedModalTitle;
  let vetSchedModalMessage;
  let vetSchedModalButtons;

  const showVetSchedModal = (title, message, buttons) => {
    if (!vetSchedModal) {
      vetSchedModal = document.createElement('div');
      vetSchedModal.id = 'vetSchedModal';
      vetSchedModal.innerHTML = `
        <div class="vetSchedModal-content">
          <h2 class="vetSchedModal-title"></h2>
          <p class="vetSchedModal-message"></p>
          <div class="vetSchedModal-buttons"></div>
        </div>
      `;
      document.body.appendChild(vetSchedModal);
      vetSchedModalTitle = vetSchedModal.querySelector('.vetSchedModal-title');
      vetSchedModalMessage = vetSchedModal.querySelector('.vetSchedModal-message');
      vetSchedModalButtons = vetSchedModal.querySelector('.vetSchedModal-buttons');
    }

    vetSchedModalTitle.textContent = title;
    vetSchedModalMessage.textContent = message;
    vetSchedModalButtons.innerHTML = '';
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.onclick = btn.onClick;
      if (btn.className) {
        button.className = btn.className;
      }
      vetSchedModalButtons.appendChild(button);
    });
    vetSchedModal.style.display = 'flex';
  };

  const closeVetSchedModal = () => {
    if (vetSchedModal) {
      vetSchedModal.style.display = 'none';
    }
  };

  // Save the updated schedules to Firestore
  const handleSaveSchedule = async () => {
    try {
      const vetRef = doc(db, "users", editingVet.id);
      await updateDoc(vetRef, { schedule: editingVetSchedules });

      setVeterinarians((prev) =>
        prev.map((vet) =>
          vet.id === editingVet.id ? { ...vet, schedule: editingVetSchedules } : vet
        )
      );

      setShowEditScheduleModal(false);
      setEditingVet(null);
      setEditingVetSchedules([]);
      setNewSchedule({ day: "", startTime: "", endTime: "" });
      setVetAppointments([]); // Clear appointments when saving


    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const isMobile = window.innerWidth <= 768;

  const ServiceChart = () => (
    <div
      className="chart-section-c"
      style={{
        height: "450px",
        width: "100%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 8px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Most Availed Service Types
      </h2>
      {serviceData.length > 0 ? (
        <ResponsivePie
          data={serviceData}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ scheme: "pastel1" }}
          borderWidth={1}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          arcLabel={(d) => d.data.formattedValue}
          tooltip={({ datum }) => (
            <div
              style={{
                padding: "12px 16px",
                color: "#333",
                background: "#fff",
                borderRadius: "2px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
              }}
            >
              <strong>{datum.id}</strong>: {datum.value}
            </div>
          )}
        />
      ) : (
        <p style={{ textAlign: "center" }}>No service data available</p>
      )}
    </div>
  );

  const DayChart = () => (
    <div
      className="chart-section-c"
      style={{
        height: "450px",
        width: "100%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 8px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Days with Most Appointments
      </h2>
      {dayData.length > 0 ? (
        <ResponsivePie
          data={dayData}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ scheme: "red_purple" }}
          borderWidth={1}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          arcLabel={(d) => d.data.formattedValue}
          tooltip={({ datum }) => (
            <div
              style={{
                padding: "12px 16px",
                color: "#333",
                background: "#fff",
                borderRadius: "2px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
              }}
            >
              <strong>{datum.id}</strong>: {datum.value}
            </div>
          )}
        />
      ) : (
        <p style={{ textAlign: "center" }}>No appointment data available</p>
      )}
    </div>
  );


  if (loading) {
    return;
  }

  return (
    <div className="clinic-container-c">
      {/* Mobile Header with Hamburger Menu */}
      <div className="mobile-header-c">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰ {/* Hamburger icon */}
        </button>
        {clinicInfo && (
          <img
            src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
            alt="Clinic Profile"
            className="mobile-header-profile-img-c"
            onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
          />
        )}
      </div>
      {isProfileModalOpen && clinicInfo && (
        <div className="profile-modal-c">
          <div className="profile-modal-content-c">
            <img
              src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
              alt="Clinic Profile"
              className="profile-modal-img-c"
            />
            <div className="profile-modal-info-c">
              <p className="profile-modal-name-c" onClick={handleAccountClick} style={{ cursor: "pointer" }}>
                {clinicInfo.clinicName}
              </p>
              <button className="signout-btn-modal-c" onClick={handleSignOut}>
                <FaSignOutAlt className="sidebar-icon-c" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`sidebar-c ${isSidebarOpen ? "open" : ""}`}>
        {clinicInfo && (
          <div className="clinic-sidebar-panel-c">
            <div className="clinic-img-container-c">
              <img
                src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                alt="Clinic Profile"
                className="clinic-profile-image-c"
              />
            </div>
            <button
              className={`clinic-button-c ${activePanel === "clinic" ? "active" : ""}`}
              onClick={() => handlePanelChange("clinic")}
            >
              <FaClinicMedical className="sidebar-icon-c" />
              {clinicInfo.clinicName}
            </button>
          </div>
        )}
        <div className="sidebar-buttons-c">
          <button
            className={`sidebar-btn-c ${activePanel === "patients" ? "active" : ""}`}
            onClick={() => handlePanelChange("patients")}
          >
            <FaUsers className="sidebar-icon-c" />
            Patients
          </button>
          <button
            className={`sidebar-btn-c ${activePanel === "appointments" ? "active" : ""}`}
            onClick={() => handlePanelChange("appointments")}
          >
            <FaCalendarAlt className="sidebar-icon-c" />
            Appointments
          </button>
          <button
            className={`sidebar-btn-c ${activePanel === "pendingAppointments" ? "active" : ""}`}
            onClick={() => handlePanelChange("pendingAppointments")}
          >
            <FaClock className="sidebar-icon-c" />
            Pending Appointments
          </button>
          <button
            className={`sidebar-btn-c ${activePanel === "records" ? "active" : ""}`}
            onClick={() => handlePanelChange("records")}
          >
            <FaFileMedicalAlt className="sidebar-icon-c" />
            Records
          </button>
          <button
            className={`sidebar-btn-c ${activePanel === "services" ? "active" : ""}`}
            onClick={() => handlePanelChange("services")}
          >
            <FaBriefcaseMedical className="sidebar-icon-c" />
            Services
          </button>
          <button
            className={`sidebar-btn-c ${activePanel === "veterinarians" ? "active" : ""}`}
            onClick={() => handlePanelChange("veterinarians")}
          >
            <FaUserMd className="sidebar-icon-c" />
            Veterinarians
          </button>
          <button
            className={`sidebar-btn-c ${activePanel === "analytics" ? "active" : ""}`}
            onClick={() => handlePanelChange("analytics")}
          >
            <FaChartBar className="sidebar-icon-c" />
            Analytics
          </button>
        </div>
        <button className="signout-btn-c" onClick={handleSignOut}>
          <FaSignOutAlt className="sidebar-icon-c" />
          Sign Out
        </button>
      </div>
      <div className="content-c">
        <div className="panel-container-c">
          {activePanel === "clinic" && clinicInfo && (
            <div className="panel-c clinic-panel-c">
              <h3>Clinic Information</h3>
              {/* This div now controls the overall layout inspired by the image */}
              <div className="clinic-details-c"> {/* Keep this class for potential specific styling */}

                <div className="clinic-header-row-c"> {/* New: Top row container */}

                  {/* Left side: Image with Edit Icon */}
                  <div className="clinic-panel-img-container-c">
                    <img
                      src={clinicImagePreview || editedClinicInfo?.profileImageURL || clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                      alt="Clinic"
                      className="clinic-info-img-c"
                    />
                    <label htmlFor="clinic-panel-image-upload" className="edit-icon-c">
                      <FaCamera />
                    </label>
                    <input
                      type="file"
                      id="clinic-panel-image-upload"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleClinicImageChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  {/* Right side: Name, Button, Contact */}
                  <div className="clinic-header-info-c"> {/* New: Container for right-side info */}
                    <h2 className="clinic-title-c">{clinicInfo.clinicName}</h2> {/* Use h2 or h1 */}
                    <button
                      className="edit-clinic-btn-inline-c" // New class for inline button style
                      onClick={() => {
                        setEditedClinicInfo({ ...clinicInfo });
                        setClinicImagePreview(null);
                        setShowClinicModal(true);
                        setIsEditingClinic(true);
                      }}
                    >
                      Edit Clinic info
                    </button>

                    {/* Container to push contact info to the right */}
                    <div className="clinic-contact-block-c">
                      <p>Phone: {clinicInfo.phone || "N/A"}</p>
                      <p>Address: {clinicInfo.streetAddress || "N/A"}, {clinicInfo.city || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom: Description */}
                <div className="clinic-description-row-c"> {/* New: Description container */}
                  <p className="clinic-description-text-c">
                    <strong>Description:</strong> {clinicInfo.clinicDescription || "N/A"}
                  </p>
                </div>

              </div>
            </div>
          )}

          {activePanel === "patients" && (
            <div className="panel-c patients-panel-c">
              <h3>Patients</h3>
              {/* Search Bar Moved Here */}
              <div className="csearch-bar-container">
                <input
                  type="text"
                  placeholder="Search patients by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-btn-c" onClick={() => { }}>
                  Search
                </button>
              </div>
              {loading ? (
                <p>Loading patients...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length > 0 ? (
                      [...patients]
                        .filter((patient) =>
                          patient.petName.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .sort((a, b) => a.petName.localeCompare(b.petName))
                        .map((patient) => (
                          <tr key={patient.id}>
                            <td>
                              <a
                                href="#!"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePatientClick(patient);
                                }}
                                className="pet-name-link-c"
                              >
                                {patient.petName}
                              </a>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="1">No patients found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activePanel === "appointments" && (
            <div className="panel-c appointments-panel-c">
              <h3>Appointments</h3>
              {loading ? (
                <p>Loading appointments...</p>
              ) : (
                <ScheduleComponent
                  ref={scheduleObj}
                  width="100%"
                  height="650px"
                  // currentDate={new Date(2025, 2, 24)} // March 24, 2025
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

                  eventClick={onEventClick} // Add this line
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
          {activePanel === "pendingAppointments" && (
            <div className="panel-c pending-appointments-panel-c">
              <h3>Pending Appointments</h3>

              {loading ? (
                <p>Loading pending appointments...</p>
              ) : filteredPendingAppointments.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date of Appointment</th>
                        <th>Veterinarian</th>
                        <th>Patient Name</th>
                        <th>Owner</th>
                        <th>Breed</th>
                        <th>Age</th>
                        <th>Service</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>{formatDate(appointment.dateofAppointment)}</td>
                          <td>{appointment.veterinarian || "N/A"}</td>
                          <td>{appointment.petName || "N/A"}</td>
                          <td>{`${appointment.owner?.FirstName || ""} ${appointment.owner?.LastName || ""}`}</td>
                          <td>{appointment.petRef?.Breed || "N/A"}</td>
                          <td>{calculateAge(appointment.petRef?.dateofBirth)}</td>
                          <td>{appointment.serviceType || "N/A"}</td>
                          <td>
                            <div className="v-actions">
                              <button
                                className="vicon-buttoncheck"
                                onClick={() => handleAction("accept", appointment.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="vicon-buttondecline"
                                onClick={() => handleAction("decline", appointment.id)}
                              >
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No pending appointments found.</p>
              )}
            </div>
          )}

          {activePanel === "records" && (
            <div className="panel-c records-panel-c">
              <h3>Records</h3>
              {loading ? (
                <p>Loading records...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date of Appointment</th>
                      <th>Patient Name</th>
                      <th>Owner</th>
                      <th>Service</th>
                      <th>Veterinarian</th>
                      <th>Remarks</th>
                      <th>Diagnosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedAppointments.length > 0 ? (
                      [...completedAppointments]
                        .sort((a, b) => b.dateofAppointment - a.dateofAppointment) // Sort by date descending
                        .map((record) => (
                          <tr key={record.Id}>
                            <td>{formatDate(record.dateofAppointment)}</td>
                            <td>{record.petName}</td>
                            <td>{record.ownerName}</td>
                            <td>{record.serviceType}</td>
                            <td>{record.veterinarian}</td>
                            <td>{record.remarks}</td>
                            <td>{record.diagnosis}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="7">No completed appointments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activePanel === "services" && (
            <div className="panel-c services-panel-c">
              <h3>Services</h3>
              <button
                className="add-service-btn-c theme-btn-c"
                onClick={() => {
                  setNewService({ Type: "", Price: "" });
                  setEditingServiceIndex(null);
                  setShowServiceModal(true);
                }}
              >
                Add Service
              </button>
              <table className="theme-table-c">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? (
                    services.map((service, index) => (
                      <tr key={index}>
                        <td>{service.Type}</td>
                        <td>{service.Price}</td>
                        <td className="action-buttons-c">
                          <button
                            className="edit-service-btn-c theme-action-btn-c"
                            onClick={() => handleEditService(index)}
                            title="Edit Service"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-service-btn-c theme-action-btn-c"
                            onClick={() => handleDeleteService(index)}
                            title="Delete Service"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No services found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activePanel === "veterinarians" && (
            <div className="panel-c veterinarians-panel-c">
              <h3>Veterinarians</h3>
              {loading ? (
                <p>Loading veterinarians...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Services</th>
                      <th>Schedule</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veterinarians.length > 0 ? (
                      veterinarians.map((vet) => (
                        <tr key={vet.id}>
                          <td>
                            <span
                              className="vet-name-link-c"
                              onClick={() => handleVetNameClick(vet)}
                            >
                              {vet.FirstName} {vet.LastName}
                            </span>
                          </td>
                          <td>{vet.contactNumber || "N/A"}</td>
                          <td>{vet.email}</td>
                          <td>
                            {vet.services?.length > 0 ? vet.services.join(", ") : "None"}
                          </td>
                          <td>
                            {vet.schedule?.length > 0
                              ? vet.schedule
                                .map((s) => `${s.day}: ${s.startTime}-${s.endTime}`)
                                .join(", ")
                              : "Not set"}
                            <FaEdit
                              className="edit-schedule-icon-c"
                              onClick={() => handleEditScheduleClick(vet)}
                              style={{ cursor: "pointer", marginLeft: "10px" }}
                              title="Edit Schedule"
                            />
                          </td>
                          <td>{vet.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">No veterinarians found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              <button className="add-vet-btn-c" onClick={() => setShowAddVetModal(true)}>
                Add Veterinarian
              </button>
            </div>
          )}
          {activePanel === "analytics" && (
        <div className="panel-c analytics-panel-c">
          <h3>Clinic Analytics</h3>
          {loading ? (
            <p>Loading analytics...</p>
          ) : (
            <>
              {isMobile ? (
                <>
                  <div className="chart-buttons-c">
                    <button
                      className={`chart-btn-c ${activeChart === "services" ? "active" : ""}`}
                      onClick={() => setActiveChart("services")}
                    >
                      Service Types
                    </button>
                    <button
                      className={`chart-btn-c ${activeChart === "days" ? "active" : ""}`}
                      onClick={() => setActiveChart("days")}
                    >
                      Appointment Days
                    </button>
                  </div>
                  <div className="chart-container-mobile-c">
                    {activeChart === "services" && <ServiceChart />}
                    {activeChart === "days" && <DayChart />}
                    {activeChart === null && (
                      <p style={{ textAlign: "center", marginTop: "20px" }}>
                        Select a chart to view analytics.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div
                  style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
                >
                  <div style={{ width: "48%" }}>
                    <ServiceChart />
                  </div>
                  <div style={{ width: "48%" }}>
                    <DayChart />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
          {/* {activePanel === "analytics" && (
            <div className="panel-c analytics-panel-c">
              <h3>Clinic Analytics</h3>
              {loading ? (
                <p>Loading analytics...</p>
              ) : (

                
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  
                  <div style={{ width: "48%", height: "450px" }}>
                    <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                      Most Availed Service Types
                    </h2>
                    {serviceData.length > 0 ? (
                      <ResponsivePie
                        data={serviceData}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }} 
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: "pastel1" }} 
                        borderWidth={1}
                        borderColor={{
                          from: "color",
                          modifiers: [["darker", 0.2]],
                        }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: "color" }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                          from: "color",
                          modifiers: [["darker", 2]],
                        }}
                        arcLabel={(d) => d.data.formattedValue}
                        tooltip={({ datum }) => (
                          <div
                            style={{
                              padding: "12px 16px",
                              color: "#333",
                              background: "#fff",
                              borderRadius: "2px",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                            }}
                          >
                            <strong>{datum.id}</strong>: {datum.value}
                          </div>
                        )}
                      
                      />
                    ) : (
                      <p style={{ textAlign: "center" }}>No service data available</p>
                    )}
                  </div>


                  
                  <div style={{ width: "48%", height: "450px" }}>
                    <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                      Days with Most Appointments
                    </h2>
                    {dayData.length > 0 ? (
                      <ResponsivePie
                        data={dayData}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }} 
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: "red_purple" }}
                        borderWidth={1}
                        borderColor={{
                          from: "color",
                          modifiers: [["darker", 0.2]],
                        }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: "color" }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{
                          from: "color",
                          modifiers: [["darker", 2]],
                        }}
                        arcLabel={(d) => d.data.formattedValue}
                        tooltip={({ datum }) => (
                          <div
                            style={{
                              padding: "12px 16px",
                              color: "#333",
                              background: "#fff",
                              borderRadius: "2px",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                            }}
                          >
                            <strong>{datum.id}</strong>: {datum.value}
                          </div>
                        )}
                      
                      />
                    ) : (
                      <p style={{ textAlign: "center" }}>No appointment data available</p>
                    )}
                  </div>
                </div>
                
              )}

            </div>


          )} */}
        </div>
      </div>

      {showClinicModal && clinicInfo && (
        <div className="modal-overlay-c">
          <div className="modal-content-c edit-clinic-modal-c">
            <span
              className="close-button-c"
              onClick={() => {
                setShowClinicModal(false);
                setIsEditingClinic(false);
              }}
            >
              ×
            </span>
            {isEditingClinic ? (
              <>
                <h2>Edit Clinic Information</h2>
                <div className="vet-image-upload-container-c">
                  <label
                    htmlFor="clinic-image-upload-modal"
                    className="vet-image-upload-c"
                    style={
                      clinicImagePreview
                        ? { backgroundImage: `url(${clinicImagePreview})` }
                        : { backgroundImage: `url(${editedClinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE})` }
                    }
                  >
                    <FaCamera className="camera-icon-overlay-c" />
                    {!clinicImagePreview && !editedClinicInfo.profileImageURL && (
                      <>
                        <FaCamera className="camera-icon-c" />
                        <p>Upload Clinic Photo</p>
                      </>
                    )}
                    <input
                      type="file"
                      id="clinic-image-upload-modal"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleClinicImageChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <div className="form-group-c">
                  <label htmlFor="clinicDescription">Clinic Description</label>
                  <textarea
                    id="clinicDescription"
                    name="clinicDescription"
                    value={editedClinicInfo.clinicDescription || ""}
                    onChange={handleClinicInputChange}
                    rows="4"
                  />
                </div>
                <div className="form-group-c">
                  <label htmlFor="clinicName">Clinic Name</label>
                  <input
                    type="text"
                    id="clinicName"
                    name="clinicName"
                    value={editedClinicInfo.clinicName || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group-c">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={editedClinicInfo.phone || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group-c">
                  <label htmlFor="streetAddress">Street Address</label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={editedClinicInfo.streetAddress || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group-c">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={editedClinicInfo.city || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-actions-c">
                  <button
                    className="submit-btn-c"
                    onClick={handleSaveClinicInfo}
                    disabled={isUpdatingClinic}
                  >
                    {isUpdatingClinic ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-btn-c"
                    onClick={() => {
                      setShowClinicModal(false);
                      setIsEditingClinic(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{clinicInfo.clinicName}</h2>
                <img
                  src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                  alt="Clinic"
                  className="clinic-info-img-c"
                />
                <p>
                  <strong>Phone:</strong> {clinicInfo.phone || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {clinicInfo.streetAddress || "N/A"},{" "}
                  {clinicInfo.city || "N/A"}
                </p>
                <button
                  className="modal-close-btn-c"
                  onClick={() => setShowClinicModal(false)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="modal-overlay-c">
          <div className="modal-content-c service-modal-c">
            <span
              className="close-button-c"
              onClick={() => setShowServiceModal(false)}
            >
              ×
            </span>
            <h2>{editingServiceIndex !== null ? "Edit Service" : "Add New Service"}</h2>
            {serviceError && <div className="error-message-c">{serviceError}</div>}
            <form onSubmit={handleAddOrEditService}>
              <div className="form-group-c">
                <label htmlFor="Type">Service Type *</label>
                <input
                  type="text"
                  id="Type"
                  name="Type"
                  value={newService.Type}
                  onChange={handleServiceInputChange}
                  required
                />
              </div>
              <div className="form-group-c">
                <label htmlFor="Price">Price (in your currency) *</label>
                <input
                  type="number"
                  id="Price"
                  name="Price"
                  value={newService.Price}
                  onChange={handleServiceInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-actions-c">
                <button
                  type="button"
                  className="cancel-btn-c"
                  onClick={() => setShowServiceModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn-c">
                  {editingServiceIndex !== null ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddVetModal && (
        <div className="modal-overlay-c">
          <div className="modal-content-c add-vet-modal-c">
            <span className="close-button-c" onClick={() => setShowAddVetModal(false)}>
              ×
            </span>
            <h2>Add New Veterinarian</h2>
            {addVetSuccess && (
              <div className="success-message-c">Veterinarian added successfully!</div>
            )}
            {addVetError && <div className="error-message-c">{addVetError}</div>}
            <form onSubmit={handleAddVet}>
              <div className="vet-image-upload-container-c">
                <label
                  htmlFor="vet-image-upload"
                  className="vet-image-upload-c"
                  style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
                >
                  {!imagePreview && (
                    <>
                      <FaCamera className="camera-icon-c" />
                      <p>Upload Profile Photo</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="vet-image-upload"
                    accept="image/jpeg, image/jpg, image/png"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <div className="form-group-c">
                <label htmlFor="FirstName">First Name *</label>
                <input
                  type="text"
                  id="FirstName"
                  name="FirstName"
                  value={newVet.FirstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group-c">
                <label htmlFor="LastName">Last Name *</label>
                <input
                  type="text"
                  id="LastName"
                  name="LastName"
                  value={newVet.LastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group-c">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  value={newVet.contactNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group-c">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newVet.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group-c">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newVet.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group-c">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={newVet.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group-c vet-services-left-c">
                <label>Specializations</label>
                <div className="services-checkboxes-left-c">
                  {clinicServices.length > 0 ? (
                    clinicServices.map((service, index) => (
                      <div key={index} className="checkbox-item-left-c">
                        <input
                          type="checkbox"
                          id={`service-${index}`}
                          checked={newVetServices.includes(service.Type)}
                          onChange={() => handleServiceToggle(service.Type)}
                        />
                        <label htmlFor={`service-${index}`}>{service.Type}</label>
                      </div>
                    ))
                  ) : (
                    <p>No services available</p>
                  )}
                </div>
              </div>
              <div className="form-group-c">
                <label>Schedule</label>
                <div className="schedule-inputs-c">
                  <select name="day" value={newSchedule.day} onChange={handleScheduleChange}>
                    <option value="">Select Day</option>
                    {getAvailableDays().map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    name="startTime"
                    value={newSchedule.startTime}
                    onChange={handleScheduleChange}
                    placeholder="Start Time"
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={newSchedule.endTime}
                    onChange={handleScheduleChange}
                    placeholder="End Time"
                  />
                  <button type="button" className="add-schedule-btn-c" onClick={addSchedule}>
                    Add
                  </button>
                </div>
                {scheduleError && <div className="error-message-c">{scheduleError}</div>}
                {vetSchedules.length > 0 && (
                  <div className="schedule-list-c">
                    {vetSchedules.map((schedule, index) => (
                      <div key={index} className="schedule-item-c">
                        <span>{`${schedule.day}: ${schedule.startTime}-${schedule.endTime}`}</span>
                        <button
                          type="button"
                          className="remove-schedule-btn-c"
                          onClick={() => removeSchedule(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group-c">
                <label htmlFor="clinicPasswordInput">
                  Your Clinic Password (Required to Continue) *
                </label>
                <input
                  type="password"
                  id="clinicPasswordInput"
                  name="clinicPasswordInput"
                  value={clinicPasswordInput}
                  onChange={(e) => setClinicPasswordInput(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions-c">
                <button
                  type="button"
                  className="cancel-btn-c"
                  onClick={() => setShowAddVetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn-c" disabled={addingVet}>
                  {addingVet ? "Adding..." : "Add Veterinarian"}
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
            <div className="form-actions-c">
              <button className="submit-btn-c" onClick={confirmSignOut}>
                Yes
              </button>
              <button
                className="cancel-btn-c"
                onClick={() => setIsSignOutConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {emailError && (
        <div
          className="error-message-c"
          style={{ position: "fixed", top: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}
        >
          <button
            className="error-close-btn"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setEmailError(null)}
            aria-label="Close error message"
          >
            <FaTimes className="error-icon" />
          </button>
          <p>{emailError}</p>
        </div>
      )}

      {isSignOutSuccessOpen && (
        <div className="modal-overlay-c">
          <div className="modal-content-c-signout signout-success-modal-c">
            <div className="success-content-c">
              <img
                src="/images/check.gif"
                alt="Success Checkmark"
                className="success-image-c"
              />
              <p>Signed Out Successfully</p>
            </div>
          </div>
        </div>
      )}

      {showVetInfoModal && selectedVet && (
        <div className="modal-overlay-c">
          <div className="modal-content-c">
            <span className="close-button-c" onClick={() => setShowVetInfoModal(false)}>
              ×
            </span>
            <img
              src={selectedVet.profileImageURL || DEFAULT_VET_IMAGE}
              alt="Veterinarian"
              className="vet-info-img-c"
            />
            <h2>{`${selectedVet.FirstName} ${selectedVet.LastName}`}</h2>
            <p><strong>First Name:</strong> {selectedVet.FirstName}</p>
            <p><strong>Last Name:</strong> {selectedVet.LastName}</p>
            <p>
              <strong>Contact Number:</strong> {selectedVet.contactNumber || "N/A"}
            </p>
            <p><strong>Email:</strong> {selectedVet.email}</p>
            <p><strong>Status:</strong> {selectedVet.status}</p>
            <div className="modal-actions-c">
              <button
                className="modal-close-btn-c"
                onClick={async () => {
                  try {
                    const newStatus = selectedVet.status === "Available" ? "Unavailable" : "Available";
                    const vetRef = doc(db, "users", selectedVet.id);
                    await updateDoc(vetRef, { status: newStatus });

                    // Update local veterinarians state
                    setVeterinarians((prev) =>
                      prev.map((vet) =>
                        vet.id === selectedVet.id ? { ...vet, status: newStatus } : vet
                      )
                    );

                    // Update selectedVet for immediate modal update
                    setSelectedVet((prev) => ({ ...prev, status: newStatus }));
                  } catch (error) {
                    console.error("Error updating status:", error);
                  }
                }}
              >
                {selectedVet.status === "Available" ? "Make Unavailable" : "Make Available"}
              </button>
              <button
                className="modal-close-btn-c"
                onClick={() => setShowVetInfoModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pet Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="modal-overlay-c">
          {/* Add a specific class if needed to avoid affecting other modals */}
          <div className="modal-content-c pet-info-modal-content-c">
            <span className="close-button-c" onClick={closePatientModal}>×</span>

            {/* Left Column: Image */}
            <div className="modal-image-column-c">
              <div className="modal-pet-image-frame-c">
                <img
                  src={selectedPatient.petImageURL || DEFAULT_PET_IMAGE}
                  alt={`${selectedPatient.petName}`} // Use alt text for accessibility
                  className="modal-pet-image-c" // Use a specific class
                />
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="modal-details-column-c">
              <h2 className="modal-pet-name-c">{selectedPatient.petName}</h2>
              <div className="modal-pet-details-list-c">
                {/* Using p tags for key-value pairs */}
                <p className="modal-pet-detail-item-c">
                  <span className="modal-pet-detail-label-c">Type:</span>
                  <span className="modal-pet-detail-value-c">{selectedPatient.Type || "N/A"}</span>
                </p>
                <p className="modal-pet-detail-item-c">
                  <span className="modal-pet-detail-label-c">Breed:</span>
                  <span className="modal-pet-detail-value-c">{selectedPatient.Breed || "N/A"}</span>
                </p>
                <p className="modal-pet-detail-item-c">
                  <span className="modal-pet-detail-label-c">Gender:</span>
                  <span className="modal-pet-detail-value-c">{selectedPatient.Gender || "N/A"}</span>
                </p>
                <p className="modal-pet-detail-item-c">
                  <span className="modal-pet-detail-label-c">Color:</span>
                  <span className="modal-pet-detail-value-c">{selectedPatient.Color || "N/A"}</span>
                </p>
                <p className="modal-pet-detail-item-c">
                  <span className="modal-pet-detail-label-c">Weight:</span>
                  <span className="modal-pet-detail-value-c">{selectedPatient.Weight ? `${selectedPatient.Weight} kg` : "N/A"}</span> {/* Fixed here */}
                </p>
                <p className="modal-pet-detail-item-c">
                  <span className="modal-pet-detail-label-c">Date of Birth:</span>
                  <span className="modal-pet-detail-value-c">{formatDOB(selectedPatient.dateofBirth)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal.open && (
        <div className="modal-overlay-v">
          <div className="modal-content-v signout-confirm-modal-v">
            <p>Are you sure you want to {showConfirmModal.action} this appointment?</p>
            <div className="form-actions-v">
              <button className="submit-btn-v" onClick={() => handleActionConfirm(showConfirmModal.action)}>
                Yes
              </button>
              <button
                className="cancel-btn-v"
                onClick={() => setShowConfirmModal({ open: false, action: null, appointmentId: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showAppointmentModal && selectedAppointment && (
        <div className="modal-overlay-c">
          <div className="modal-content-c">
            <span className="close-button-c" onClick={() => setShowAppointmentModal(false)}>
              ×
            </span>
            <h2>Appointment Details</h2>
            <div className="appointment-info-grid-c">
              <div className="info-item-c">
                <strong>Patient Name:</strong> {selectedAppointment.petName}
              </div>
              <div className="info-item-c">
                <strong>Owner:</strong> {selectedAppointment.ownerName}
              </div>
              <div className="info-item-c">
                <strong>Date & Time:</strong> {formatDate(selectedAppointment.StartTime)}
              </div>
              <div className="info-item-c">
                <strong>Service:</strong> {selectedAppointment.serviceType}
              </div>
              <div className="info-item-c">
                <strong>Veterinarian:</strong> {selectedAppointment.veterinarian}
              </div>
              <div className="info-item-c">
                <strong>Remarks:</strong> {selectedAppointment.remarks}
              </div>
              <div className="info-item-c">
                <strong>Status:</strong> {selectedAppointment.status}
              </div>
              {selectedAppointment.status === "Request Reschedule" && selectedAppointment.rescheduleDate && (
                <div className="info-item-c">
                  <strong>Requested Reschedule Date:</strong>{" "}
                  {formatDate(selectedAppointment.rescheduleDate.toDate())}
                </div>
              )}
            </div>
            <div className="appointment-notes-c">
              <strong>Notes:</strong> {selectedAppointment.notes}
            </div>
            <div className="modal-actions-c">
              {selectedAppointment.status === "Request Cancel" && (
                <>
                  <button
                    className="submit-btn-c"
                    onClick={() => {
                      console.log("Accept Cancel Clicked for ID:", selectedAppointment.Id);
                      handleAcceptRequest(selectedAppointment.Id, "cancel");
                    }}
                  >
                    Accept Cancellation
                  </button>
                  <button
                    className="cancel-btn-c"
                    onClick={() => {
                      console.log("Decline Cancel Clicked for ID:", selectedAppointment.Id);
                      handleDeclineRequest(selectedAppointment.Id, "cancel");
                    }}
                  >
                    Decline Cancellation
                  </button>
                </>
              )}
              {selectedAppointment.status === "Request Reschedule" && (
                <>
                  <button
                    className="submit-btn-c"
                    onClick={() => {
                      console.log("Accept Reschedule Clicked for ID:", selectedAppointment.Id);
                      handleAcceptRequest(selectedAppointment.Id, "reschedule");
                    }}
                  >
                    Accept Reschedule
                  </button>
                  <button
                    className="cancel-btn-c"
                    onClick={() => {
                      console.log("Decline Reschedule Clicked for ID:", selectedAppointment.Id);
                      handleDeclineRequest(selectedAppointment.Id, "reschedule");
                    }}
                  >
                    Decline Reschedule
                  </button>
                </>
              )}
              <button
                className="modal-close-btn-c"
                onClick={() => setShowAppointmentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {showEditScheduleModal && (
        <div className="modal-overlay-c">
          <div className="modal-content-c edit-schedule-modal-c">
            <span
              className="close-button-c"
              onClick={() => {
                setShowEditScheduleModal(false);
                setEditingVet(null);
                setEditingVetSchedules([]);
                setNewSchedule({ day: "", startTime: "", endTime: "" });
                setVetAppointments([]);
                setScheduleError("");
              }}
            >
              ×
            </span>
            <h2 style={{ color: "#ff4081" }}>
              Edit Schedule for {editingVet?.FirstName} {editingVet?.LastName}
            </h2>
            <div className="schedule-section-c">
              <h3>Current Schedules</h3>
              {editingVetSchedules.length > 0 ? (
                <ul className="schedule-list-c">
                  {editingVetSchedules.map((schedule, index) => {
                    const isDisabled = hasOverlappingAppointments(schedule, vetAppointments);
                    return (
                      <li key={index} className="schedule-item-c">
                        <span className="schedule-details-c">
                          {schedule.day}: {schedule.startTime} - {schedule.endTime}
                        </span>
                        <button
                          className="delete-schedule-btn-c"
                          onClick={() => removeEditingSchedule(index)}
                          title={
                            isDisabled
                              ? "Cannot delete: Schedule has upcoming appointments"
                              : "Delete Schedule"
                          }
                          disabled={isDisabled}
                          aria-label="Delete schedule"
                        >
                          <FaTrash />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="no-schedules-c">No schedules set.</p>
              )}
            </div>

            <div className="add-schedule-section-c">
              <h3>Add New Schedule</h3>
              <div className="add-schedule-form-c">
                <div className="schedule-input-row-c">
                  <div className="schedule-input-field-c">
                    <label htmlFor="schedule-day">Day</label>
                    <select
                      id="schedule-day"
                      name="day"
                      value={newSchedule.day}
                      onChange={handleScheduleChange}
                      required
                      aria-required="true"
                    >
                      <option value="">Select Day</option>
                      {
                        [
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((day) => (
                          !editingVetSchedules.some((s) => s.day === day) ? (
                            <option key={day} value={day}>{day}</option>
                          ) : null
                        ))
                      }
                    </select>
                  </div>
                  <div className="schedule-input-field-c">
                    <label htmlFor="start-time">Start Time</label>
                    <input
                      id="start-time"
                      type="time"
                      name="startTime"
                      value={newSchedule.startTime}
                      onChange={handleScheduleChange}
                      required
                      aria-required="true"
                      step="3600"
                    />
                  </div>
                  <div className="schedule-input-field-c">
                    <label htmlFor="end-time">End Time</label>
                    <input
                      id="end-time"
                      type="time"
                      name="endTime"
                      value={newSchedule.endTime}
                      onChange={handleScheduleChange}
                      required
                      aria-required="true"
                      step="3600"
                    />
                  </div>
                  <button
                    className="add-schedule-btn-c"
                    onClick={addEditingSchedule}
                    disabled={!newSchedule.day || !newSchedule.startTime || !newSchedule.endTime}
                    aria-label="Add new schedule"
                  >
                    <FaPlus /> Add
                  </button>
                </div>
                {scheduleError && <div className="error-message-c">{scheduleError}</div>}
              </div>
            </div>

            <div className="modal-actions-c">
              <button
                className="cancel-btn-c"
                onClick={() => {
                  setShowEditScheduleModal(false);
                  setEditingVet(null);
                  setEditingVetSchedules([]);
                  setNewSchedule({ day: "", startTime: "", endTime: "" });
                  setVetAppointments([]);
                }}
              >
                Cancel
              </button>
              <button className="submit-btn-c" onClick={handleSaveSchedule}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Mobile_Footer
        onAccountClick={handleAccountClick}
        setActivePanel={setActivePanel}
        isVetClinic={true}
      />
    </div>
  );
};

export default ClinicHome;