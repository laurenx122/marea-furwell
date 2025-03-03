import React, { useState } from "react";
import "./AdminHome.css";
import { Search } from "lucide-react";


//must be replace based on the clinics that already subsribe to the furwell
const clinics = [
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
    { name: "Cebu Veterinary" },
  ];
  
  const AdminHome = () => {
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
              <p className="clinic-name">Cebu Veterinary</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default AdminHome;