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
} from "firebase/firestore";
import {
  getAuth,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { FaCamera } from "react-icons/fa";
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
import { useTheme } from "@mui/material";
// import { mockPieData as data } from "../data/mockData";

const ClinicHome = () => {
  // Register Syncfusion license (replace with your valid key if different)
  registerLicense(
    "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
    // process.env.SYNC_REGISTER_LICENSE
    // "Ngo9BigBOggjHTQxAR8/V1NMaF1cXmhNYVF0WmFZfVtgdVVMZFhbRX5PIiBoS35Rc0VgW3xccnBRRGBbVUZz"
  );
  const [pieData, setPieData] = useState([]);
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

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_CLINIC_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const scheduleObj = useRef(null);

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

  const fetchRecords = async () => { };

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
  const fetchPieChartData = async () => {
    try {
      setLoading(true);
      const petsQuery = query(collection(db, "pets"));
      const querySnapshot = await getDocs(petsQuery);
  
      const speciesCount = {};
      querySnapshot.forEach((doc) => {
        const petData = doc.data();
        const species = petData.Species || "Unknown";
        speciesCount[species] = (speciesCount[species] || 0) + 1;
      });
  
      const formattedData = Object.entries(speciesCount).map(([key, value]) => ({
        id: key,
        label: key,
        value: value,
      }));
  
      setPieData(formattedData);
    } catch (error) {
      console.error("Error fetching pie chart data:", error);
      setPieData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserFirstName();
      await fetchClinicInfo();
      fetchPatients();
      fetchAppointments(); // Ensure this is included
      fetchVeterinarians();
      fetchPieChartData();
    };
    initializeData();
  }, [userFirstName]);

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
            <button
              className={activePanel === "clinic" ? "active" : ""}
              onClick={() => setActivePanel("clinic")}
            >
              {clinicInfo.clinicName}
            </button>
          </div>
        )}
        <div className="sidebar-buttons-c">
          <button
            className={activePanel === "patients" ? "active" : ""}
            onClick={() => setActivePanel("patients")}
          >
            Patients
          </button>
          <button
            className={activePanel === "appointments" ? "active" : ""}
            onClick={() => setActivePanel("appointments")}
          >
            Appointments
          </button>
          <button
            className={activePanel === "records" ? "active" : ""}
            onClick={() => setActivePanel("records")}
          >
            Records
          </button>
          <button
            className={activePanel === "services" ? "active" : ""}
            onClick={() => setActivePanel("services")}
          >
            Services
          </button>
          <button
            className={activePanel === "veterinarians" ? "active" : ""}
            onClick={() => setActivePanel("veterinarians")}
          >
            Veterinarians
          </button>
          <button
            className={activePanel === "analytics" ? "active" : ""}
            onClick={() => setActivePanel("analytics")}
          >
            Analytics
          </button>
        </div>
        <button className="signout-btn-c" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="content-c">
        <div className="panel-container-c">
          {activePanel === "clinic" && clinicInfo && (
            <div className="panel-c clinic-panel-c">
              <h3>Clinic Information</h3>
              <div className="clinic-details-c">
                <img
                  src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                  alt="Clinic"
                  className="clinic-info-img-c"
                />
                <p><strong>Name:</strong> {clinicInfo.clinicName}</p>
                <p><strong>Phone:</strong> {clinicInfo.phone || "N/A"}</p>
                <p>
                  <strong>Address:</strong> {clinicInfo.streetAddress || "N/A"},{" "}
                  {clinicInfo.city || "N/A"}
                </p>
                <p>
                  <strong>Description:</strong> {clinicInfo.clinicDescription || "N/A"}
                </p>
                <button
                  className="edit-clinic-btn-c"
                  onClick={() => {
                    setShowClinicModal(true);
                    setIsEditingClinic(true);
                  }}
                >
                  Edit Clinic Info
                </button>
              </div>
            </div>
          )}
          {activePanel === "patients" && (
            <div className="panel-c patients-panel-c">
              <h3>Patients</h3>
              {loading ? (
                <p>Loading patients...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Pet Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length > 0 ? (
                      patients.map((patient) => (
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
                        <td>No patients found</td>
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
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? (
                    services.map((service, index) => (
                      <tr key={index}>
                        <td>{service.Type}</td>
                        <td>{service.Price}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No services found</td>
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
              <div style={{ height: "500px", width: "100%", justifyContent: "flex-start" }}>
                <ResponsivePie
                data={pieData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'red_purple' }}
                borderWidth={1}
                borderColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            0.2
                        ]
                    ]
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [
                        [
                            'darker',
                            2
                        ]
                    ]
                }}
                defs={[
                    {
                        id: 'dots',
                        type: 'patternDots',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        size: 4,
                        padding: 1,
                        stagger: true
                    },
                    {
                        id: 'lines',
                        type: 'patternLines',
                        background: 'inherit',
                        color: 'rgba(255, 255, 255, 0.3)',
                        rotation: -45,
                        lineWidth: 6,
                        spacing: 10
                    }
                ]}
                fill={[
                    {
                        match: {
                            id: 'ruby'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'c'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'go'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'python'
                        },
                        id: 'dots'
                    },
                    {
                        match: {
                            id: 'scala'
                        },
                        id: 'lines'
                    },
                    {
                        match: {
                            id: 'lisp'
                        },
                        id: 'lines'
                    },
                    {
                        match: {
                            id: 'elixir'
                        },
                        id: 'lines'
                    },
                    {
                        match: {
                            id: 'javascript'
                        },
                        id: 'lines'
                    }
                ]}
                legends={[
                    {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemTextColor: '#000'
                                }
                            }
                        ]
                    }
                ]}
            ></ResponsivePie>
            </div>
              )}
              
            </div>
          )}
        </div>
      </div>

      {showClinicModal && clinicInfo && (
        <div className="modal-overlay-c">
          <div className="modal-content-c">
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
                  <input
                    type="text"
                    id="clinicDescription"
                    name="clinicDescription"
                    value={editedClinicInfo.clinicDescription || ""}
                    onChange={handleClinicInputChange}
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
                <img
                  src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                  alt="Clinic"
                  className="clinic-info-img-c"
                />
                <h2>{clinicInfo.clinicName}</h2>
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

      {showPatientModal && selectedPatient && (
        <div className="modal-overlay-c">
          <div className="modal-content-c">
            <span className="close-button-c" onClick={closePatientModal}>×</span>
            <div className="pet-image-container-c">
              <div className="pet-image-wrapper-c">
                <img
                  src={selectedPatient.petImageURL || DEFAULT_PET_IMAGE}
                  alt={`${selectedPatient.petName}`}
                  className="pet-image-c"
                />
              </div>
            </div>
            <h2>{selectedPatient.petName}</h2>
            <div className="pet-info-grid-c">
              <div className="info-item-c">
                <strong>Species:</strong> {selectedPatient.Species || "N/A"}
              </div>
              <div className="info-item-c">
                <strong>Breed:</strong> {selectedPatient.Breed || "N/A"}
              </div>
              <div className="info-item-c">
                <strong>Color:</strong> {selectedPatient.Color || "N/A"}
              </div>
              <div className="info-item-c">
                <strong>Gender:</strong> {selectedPatient.Gender || "N/A"}
              </div>
              <div className="info-item-c">
                <strong>Weight:</strong> {selectedPatient.Weight ? `${selectedPatient.Weight} kg` : "N/A"}
              </div>
              <div className="info-item-c">
                <strong>Date of Birth:</strong> {formatDOB(selectedPatient.dateofBirth)}
              </div>
            </div>
            <div className="modal-actions-c">
              <button className="modal-close-btn-c" onClick={closePatientModal}>
                Close
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