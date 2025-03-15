import React, { useState } from "react";
import { useEffect} from "react";
import "./AdminHome.css";
import { Search } from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";


const AdminHome = () => {

const [clinics, setClinics] = useState([]);

useEffect(() => {
  const fetchClinics = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clinics"));
      const clinicList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClinics(clinicList);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  fetchClinics();
}, []);
    return (
      <div className="admin-home">
        {/* Search Bar */}
        <div className="search-container">
          <input type="text" placeholder="Search" className="search-input" />
          <Search className="search-icon" />
        </div>
  
        {/* Clinic Grid */}
        <div className="clinics-grid">
          {clinics.map((clinic, index) => (
            <div key={index} className="clinics-card">
              <div className="clinic-image" />
              <p className="clinic-name">Main</p>
              <p className="clinic-name">{clinic.clinicName}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default AdminHome;