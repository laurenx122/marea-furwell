import React, { useEffect, useState } from "react";
import { FaTrash, FaCheck } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminSubscription.css";

const ClinicDashboard = () => {

  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "registersClinics"));
        const clinicsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClinics(clinicsData);
      } catch (error) {
        console.error("Error fetching clinics: ", error);
      }
    };

    fetchClinics();
  }, []);
  return (
    <div className="dashboard-container">
      <div className="search-bar">
        <input type="text" placeholder="Search" />
      </div>
      <table className="clinic-table">
        <thead>
          <tr>
            <th>Clinic No.</th>
            <th>Clinic Name</th>
            <th>Address</th>
            <th>Contact No.</th>
            <th>Email</th>
            <th>Clinic Owner</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clinics.map((clinic, index) => (
            <tr key={clinic.id}>
              <td>{index + 1}</td>
              <td>{clinic.clinicName}</td>
              <td>{clinic.streetAddress}, {clinic.city}, {clinic.province}, {clinic.postalCode}</td>
              <td>{clinic.phone}</td>
              <td>{clinic.email}</td>
              <td>{clinic.ownerFirstName} {clinic.ownerLastName}</td>
              <td>
                <div className="actions">
                  <button className="icon-buttoncheck"><FaCheck /></button>
                  <button className="icon-buttondelete"><FaTrash /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClinicDashboard;
