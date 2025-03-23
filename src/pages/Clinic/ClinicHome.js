import React, { useState, useEffect } from "react";
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

const ClinicHome = () => {
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

  const navigate = useNavigate();
  const UPLOAD_PRESET = "furwell";
  const DEFAULT_VET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";
  const DEFAULT_CLINIC_IMAGE = "https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png";
  const DEFAULT_PET_IMAGE = "https://images.vexels.com/content/235658/preview/dog-paw-icon-emblem-04b9f2.png";

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (typeof dateValue === "string") {
      try {
        return new Date(dateValue).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      } catch (e) {
        return dateValue;
      }
    }
    return String(dateValue);
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

    const today = new Date("2025-03-23"); // Current date as per context
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
            clinicName: clinicData.clinicName || `Clinic of ${userFirstName}`,
            phone: clinicData.phone || "",
            streetAddress: clinicData.streetAddress || "",
            city: clinicData.city || "",
            profileImageURL: clinicData.profileImageURL || DEFAULT_CLINIC_IMAGE,
          });
          setEditedClinicInfo({
            id: clinicDoc.id,
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
        const appointmentsList = [];

        for (const appointmentDoc of querySnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          let ownerName = "Unknown Owner";
          let petName = appointmentData.petName || "Unknown Pet";

          if (appointmentData.owner && typeof appointmentData.owner === "object") {
            try {
              const ownerDoc = await getDoc(appointmentData.owner);
              if (ownerDoc.exists()) {
                const ownerData = ownerDoc.data();
                ownerName = `${ownerData.FirstName || ""} ${ownerData.LastName || ""}`.trim() || "Unknown Owner";
              }
            } catch (error) {
              console.error("Error fetching owner:", error);
              ownerName = "Error Loading Owner";
            }
          }

          if (!appointmentData.petName && appointmentData.petRef) {
            try {
              const petDoc = await getDoc(appointmentData.petRef);
              if (petDoc.exists()) {
                petName = petDoc.data().petName || "Unknown Pet";
              }
            } catch (error) {
              console.error("Error fetching pet:", error);
              petName = "Error Loading Pet";
            }
          }

          appointmentsList.push({
            id: appointmentDoc.id,
            dateofAppointment: appointmentData.dateofAppointment,
            ownerName,
            petName,
            serviceType: appointmentData.serviceType || "N/A",
            veterinarian: appointmentData.veterinarian || "N/A",
          });
        }

        appointmentsList.sort((a, b) => {
          const dateA = a.dateofAppointment && typeof a.dateofAppointment.toDate === "function"
            ? a.dateofAppointment.toDate()
            : new Date(a.dateofAppointment || 0);
          const dateB = b.dateofAppointment && typeof b.dateofAppointment.toDate === "function"
            ? b.dateofAppointment.toDate()
            : new Date(b.dateofAppointment || 0);
          return dateA - dateB;
        });

        setAppointments(appointmentsList);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {};

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

  const closePatientModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserFirstName();
      await fetchClinicInfo();
      fetchPatients();
      fetchAppointments();
      fetchRecords();
      fetchVeterinarians();
    };
    initializeData();
  }, [userFirstName]);

  return (
    <div className="clinic-container">
      <div className="sidebar_clinicHome">
        {clinicInfo && (
          <div className="clinic-sidebar-panel">
            <div className="clinic-img-container">
              <img
                src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                alt="Clinic Profile"
                className="clinic-profile-image"
              />
              <label htmlFor="clinic-image-upload" className="edit-icon">
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
        <div className="sidebar-buttons">
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
        </div>
        <button className="signout-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="content">
        <div className="panel-container">
          {activePanel === "clinic" && clinicInfo && (
            <div className="panel clinic-panel">
              <h3>Clinic Information</h3>
              <div className="clinic-details">
                <img
                  src={clinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE}
                  alt="Clinic"
                  className="clinic-info-img"
                />
                <p><strong>Name:</strong> {clinicInfo.clinicName}</p>
                <p><strong>Phone:</strong> {clinicInfo.phone || "N/A"}</p>
                <p>
                  <strong>Address:</strong> {clinicInfo.streetAddress || "N/A"},{" "}
                  {clinicInfo.city || "N/A"}
                </p>
                <button
                  className="edit-clinic-btn"
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
            <div className="panel patients-panel">
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
                              className="pet-name-link"
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
            <div className="panel appointments-panel">
              <h3>Appointments</h3>
              {loading ? (
                <p>Loading appointments...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Owner</th>
                      <th>Pet</th>
                      <th>Service</th>
                      <th>Veterinarian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length > 0 ? (
                      appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>{formatDate(appointment.dateofAppointment)}</td>
                          <td>{appointment.ownerName}</td>
                          <td>{appointment.petName}</td>
                          <td>{appointment.serviceType}</td>
                          <td>{appointment.veterinarian}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">No appointments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activePanel === "records" && (
            <div className="panel records-panel">
              <h3>Records</h3>
            </div>
          )}
          {activePanel === "services" && (
            <div className="panel services-panel">
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
            <div className="panel veterinarians-panel">
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
                              className="vet-name-link"
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
              <button className="add-vet-btn" onClick={() => setShowAddVetModal(true)}>
                Add Veterinarian
              </button>
            </div>
          )}
        </div>
      </div>

      {showClinicModal && clinicInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span
              className="close-button"
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
                <div className="vet-image-upload-container">
                  <label
                    htmlFor="clinic-image-upload-modal"
                    className="vet-image-upload"
                    style={
                      clinicImagePreview
                        ? { backgroundImage: `url(${clinicImagePreview})` }
                        : { backgroundImage: `url(${editedClinicInfo.profileImageURL || DEFAULT_CLINIC_IMAGE})` }
                    }
                  >
                    {!clinicImagePreview && !editedClinicInfo.profileImageURL && (
                      <>
                        <FaCamera className="camera-icon" />
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
                <div className="form-group">
                  <label htmlFor="clinicName">Clinic Name</label>
                  <input
                    type="text"
                    id="clinicName"
                    name="clinicName"
                    value={editedClinicInfo.clinicName || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={editedClinicInfo.phone || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="streetAddress">Street Address</label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={editedClinicInfo.streetAddress || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={editedClinicInfo.city || ""}
                    onChange={handleClinicInputChange}
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="submit-btn"
                    onClick={handleSaveClinicInfo}
                    disabled={isUpdatingClinic}
                  >
                    {isUpdatingClinic ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="cancel-btn"
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
                  className="clinic-info-img"
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
                  className="modal-close-btn"
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
        <div className="modal-overlay">
          <div className="modal-content add-vet-modal">
            <span className="close-button" onClick={() => setShowAddVetModal(false)}>
              ×
            </span>
            <h2>Add New Veterinarian</h2>
            {addVetSuccess && (
              <div className="success-message">Veterinarian added successfully!</div>
            )}
            {addVetError && <div className="error-message">{addVetError}</div>}
            <form onSubmit={handleAddVet}>
              <div className="vet-image-upload-container">
                <label
                  htmlFor="vet-image-upload"
                  className="vet-image-upload"
                  style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
                >
                  {!imagePreview && (
                    <>
                      <FaCamera className="camera-icon" />
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
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="text"
                  id="contactNumber"
                  name="contactNumber"
                  value={newVet.contactNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group vet-services-left">
                <label>Specializations</label>
                <div className="services-checkboxes-left">
                  {clinicServices.length > 0 ? (
                    clinicServices.map((service, index) => (
                      <div key={index} className="checkbox-item-left">
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
              <div className="form-group">
                <label>Schedule</label>
                <div className="schedule-inputs">
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
                  <button type="button" className="add-schedule-btn" onClick={addSchedule}>
                    Add
                  </button>
                </div>
                {vetSchedules.length > 0 && (
                  <div className="schedule-list">
                    {vetSchedules.map((schedule, index) => (
                      <div key={index} className="schedule-item">
                        <span>{`${schedule.day}: ${schedule.startTime}-${schedule.endTime}`}</span>
                        <button
                          type="button"
                          className="remove-schedule-btn"
                          onClick={() => removeSchedule(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
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
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddVetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={addingVet}>
                  {addingVet ? "Adding..." : "Add Veterinarian"}
                </button>
              </div>
            </form>
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

      {showVetInfoModal && selectedVet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowVetInfoModal(false)}>
              ×
            </span>
            <img
              src={selectedVet.profileImageURL || DEFAULT_VET_IMAGE}
              alt="Veterinarian"
              className="vet-info-img"
            />
            <h2>{`${selectedVet.FirstName} ${selectedVet.LastName}`}</h2>
            <p><strong>First Name:</strong> {selectedVet.FirstName}</p>
            <p><strong>Last Name:</strong> {selectedVet.LastName}</p>
            <p>
              <strong>Contact Number:</strong> {selectedVet.contactNumber || "N/A"}
            </p>
            <p><strong>Email:</strong> {selectedVet.email}</p>
            <button
              className="modal-close-btn"
              onClick={() => setShowVetInfoModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPatientModal && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-button" onClick={closePatientModal}>×</span>
            <div className="pet-image-container">
              <div className="pet-image-wrapper">
                <img
                  src={selectedPatient.petImageURL || DEFAULT_PET_IMAGE}
                  alt={`${selectedPatient.petName}`}
                  className="pet-image"
                />
              </div>
            </div>
            <h2>{selectedPatient.petName}</h2>
            <div className="pet-info-grid">
              <div className="info-item">
                <strong>Species:</strong> {selectedPatient.Species || "N/A"}
              </div>
              <div className="info-item">
                <strong>Breed:</strong> {selectedPatient.Breed || "N/A"}
              </div>
              <div className="info-item">
                <strong>Color:</strong> {selectedPatient.Color || "N/A"}
              </div>
              <div className="info-item">
                <strong>Gender:</strong> {selectedPatient.Gender || "N/A"}
              </div>
              <div className="info-item">
                <strong>Weight:</strong> {selectedPatient.Weight ? `${selectedPatient.Weight} kg` : "N/A"}
              </div>
              <div className="info-item">
                <strong>Date of Birth:</strong> {formatDOB(selectedPatient.dateofBirth)}
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-close-btn" onClick={closePatientModal}>
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