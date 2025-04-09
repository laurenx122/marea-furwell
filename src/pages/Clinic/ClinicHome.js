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
  // Register Syncfusion license (replace with your valid key if different)
  registerLicense(
    "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
    // process.env.SYNC_REGISTER_LICENSE
    // "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
  );
  // const [genderData, setGenderData] = useState([]);
  // const [speciesData, setSpeciesData] = useState([]);
  // const [ageData, setAgeData] = useState([]);
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

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newService, setNewService] = useState({ Type: "", Price: "" });
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [serviceError, setServiceError] = useState("");

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_CLINIC_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const scheduleObj = useRef(null);
// Analytics State
const [serviceData, setServiceData] = useState([]);
const [dayData, setDayData] = useState([]);

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

    const today = new Date("2025-03-23");
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
    setNewSchedule((prev) => ({ ...prev, [name]: value }));
  };

  const addSchedule = () => {
    if (newSchedule.day && newSchedule.startTime && newSchedule.endTime) {
      setVetSchedules((prev) => [...prev, newSchedule]);
      setNewSchedule({ day: "", startTime: "", endTime: "" });
    }
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
      const { appointmentId } = showConfirmModal;
      try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);
        if (!appointmentDoc.exists()) throw new Error("Appointment not found");
    
        if (action === "accept") {
          const appointmentData = appointmentDoc.data();
          const newData = { 
            ...appointmentData, 
            status: "Accepted", 
            timestamp: new Date().toISOString() 
          };
          await updateDoc(appointmentRef, newData);
    
          // Create notification in the "notifications" collection
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
          });
    
          await fetchAppointments();
          console.log("Appointment accepted successfully and notification created!");
        } else if (action === "decline") {
          await updateDoc(appointmentRef, { status: "Declined" });
          await fetchPendingAppointments(); 
          console.log("Appointment declined successfully!");
        }
    
        setPendingAppointments(pendingAppointments.filter(appt => appt.id !== appointmentId));
        setShowConfirmModal({ open: false, action: null, appointmentId: null });
      } catch (error) {
        console.error(`Error ${action}ing appointment:`, error);
        alert(`Failed to ${action} the appointment. Please try again.`);
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
          where("status", "==", "Accepted"),
          where("clinic", "==", clinicRef)
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const currentAppointmentsList = [];
        const pastAppointmentsList = [];
        // const today = new Date("2025-03-25"); // Current date as per system info
        const today = new Date(); // Dynamically fetch current date

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
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assuming 1-hour duration

          const appointmentDetails = {
            Id: appointmentDoc.id,
            Subject: `${petName} - ${appointmentData.serviceType || "N/A"}`,
            StartTime: startTime,
            EndTime: endTime,
            petName,
            ownerName,
            serviceType: appointmentData.serviceType || "N/A",
            veterinarian: vetName, // Directly use the string
            remarks: appointmentData.remarks || "No remarks",
            notes: appointmentData.notes || "No Notes",
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
        setRecords(pastAppointmentsList); // Set past appointments as records
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
      setPastAppointments([]);
      setRecords([]);
    } finally {
      setLoading(false);
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
        querySnapshot.forEach((doc) => {
          vetList.push({ id: doc.id, ...doc.data() });
        });
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

  return (
    <div className="clinic-container-c">
      <div className="sidebar-c">
        {clinicInfo && (
          <div className="clinic-sidebar-panel-c">
            <div className="clinic-img-container-c">
              <img
                src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                alt="Clinic Profile"
                className="clinic-profile-image-c"
              />
              <label htmlFor="clinic-image-upload" className="edit-icon-c">
                <FaCamera />
              </label>
              <input
                type="file"
                id="clinic-image-upload"
                accept="image/jpeg, image/jpg, image/png"
                onChange={handleClinicImageChange}
                style={{ display: "none" }}
              />
            </div>
            {/* Clinic Info Button */}
            <button
              className={activePanel === "clinic" ? "active" : ""}
              onClick={() => handlePanelChange("clinic")}
            >
              <FaClinicMedical className="sidebar-icon-c" /> {/* Icon Added */}
              {clinicInfo.clinicName}
            </button>
          </div>
        )}
        <div className="sidebar-buttons-c">
          {/* Patients Button */}
          <button
            className={activePanel === "patients" ? "active" : ""}
            onClick={() => handlePanelChange("patients")}
          >
            <FaUsers className="sidebar-icon-c" /> {/* Icon Added */}
            Patients
          </button>
          {/* Appointments Button */}
          <button
            className={activePanel === "appointments" ? "active" : ""}
            onClick={() => handlePanelChange("appointments")}
          >
            <FaCalendarAlt className="sidebar-icon-c" /> {/* Icon Added */}
            Appointments
          </button>
          {/* Pending Appointments Button */}
          <button
            className={activePanel === "pendingAppointments" ? "active" : ""}
            onClick={() => handlePanelChange("pendingAppointments")}
          >
            <FaClock className="sidebar-icon-c" /> {/* Icon Added */}
            Pending Appointments
          </button>
          {/* Records Button */}
          <button
            className={activePanel === "records" ? "active" : ""}
            onClick={() => handlePanelChange("records")}
          >
            <FaFileMedicalAlt className="sidebar-icon-c" /> {/* Icon Added */}
            Records
          </button>
          {/* Services Button */}
          <button
            className={activePanel === "services" ? "active" : ""}
            onClick={() => handlePanelChange("services")}
          >
            <FaBriefcaseMedical className="sidebar-icon-c" /> {/* Icon Added */}
            Services
          </button>
          {/* Veterinarians Button */}
          <button
            className={activePanel === "veterinarians" ? "active" : ""}
            onClick={() => handlePanelChange("veterinarians")}
          >
            <FaUserMd className="sidebar-icon-c" /> {/* Icon Added */}
            Veterinarians
          </button>
          {/* Analytics Button */}
           <button
            className={activePanel === "analytics" ? "active" : ""}
            onClick={() => handlePanelChange("analytics")}
          >
            <FaChartBar className="sidebar-icon-c" /> {/* Icon Added */}
            Analytics
          </button>
        </div>
        {/* Sign Out Button */}
        <button className="signout-btn-c" onClick={handleSignOut}>
           <FaSignOutAlt className="sidebar-icon-c" /> {/* Icon Added */}
           Sign Out
        </button>
      </div>

      <div className="content-c">
        <div className="panel-container-c">
          {activePanel === "clinic" && clinicInfo && (
            <div className="panel-c clinic-panel-c">
            {/* Remove <h3>Clinic Information</h3> if you don't want it above the new layout */}
            {/* <h3>Clinic Information</h3> */}
        
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
         <button className="search-btn-c" onClick={() => {}}>
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
                  <Inject services={[ Month, Agenda]} />
                </ScheduleComponent>
              )}
            </div>
          )}
            {activePanel === "pendingAppointments" && (
        <div className="panel-v health-records-panel-v">
          <h3>Pending Appointments</h3>
          {loading ? (
            <p>Loading pending appointments...</p>
          ) : pendingAppointments.length > 0 ? (
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
          {pendingAppointments.map((appointment) => (
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
                            <td>{record.ownerName}</td>
                            <td>{record.serviceType}</td>
                            <td>{record.veterinarian}</td>
                            <td>{record.remarks}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="6">No past appointments found</td>
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
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">No veterinarians found</td>
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
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  {/* Most Availed Service Type Pie Chart */}
                  <div style={{ width: "48%", height: "450px" }}>
                    <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                      Most Availed Service Types
                    </h2>
                    {serviceData.length > 0 ? (
                      <ResponsivePie
                        data={serviceData}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }} // Adjusted margins since no legend
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ scheme: "pastel1" }} // Vibrant color scheme
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
                        // Removed legends prop
                      />
                    ) : (
                      <p style={{ textAlign: "center" }}>No service data available</p>
                    )}
                  </div>

                  {/* Days with Most Appointments Pie Chart */}
                  <div style={{ width: "48%", height: "450px" }}>
                    <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                      Days with Most Appointments
                    </h2>
                    {dayData.length > 0 ? (
                      <ResponsivePie
                        data={dayData}
                        margin={{ top: 40, right: 40, bottom: 40, left: 40 }} // Adjusted margins since no legend
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
                        // Removed legends prop
                      />
                    ) : (
                      <p style={{ textAlign: "center" }}>No appointment data available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
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

      {isSignOutSuccessOpen && (
        <div className="modal-overlay-c">
          <div className="modal-content-c signout-success-modal-c">
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
            <button
              className="modal-close-btn-c"
              onClick={() => setShowVetInfoModal(false)}
            >
              Close
            </button>
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
            <span className="close-button-c" onClick={closeAppointmentModal}>×</span>
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
            </div>
            <div className="appointment-notes-c">
                <strong>Notes:</strong> {selectedAppointment.notes}
              </div>
            <div className="modal-actions-c">
              <button className="modal-close-btn-c" onClick={closeAppointmentModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicHome;