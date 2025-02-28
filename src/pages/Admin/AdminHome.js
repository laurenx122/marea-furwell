import React, { useState } from "react";
import "./AdminHome.css";
import { Search } from "lucide-react";


//must be replace based on the clinics that already subsribe to the furwell
const clinics = [
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
    { name: "Cebu Veterinary", branch: "Main" },
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
        <div className="clinic-grid">
          {clinics.map((clinic, index) => (
            <div key={index} className="clinic-card">
              <div className="clinic-image" />
              <h3>{clinic.name}</h3>
              <p className="clinic-branch">{clinic.branch}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default AdminHome;