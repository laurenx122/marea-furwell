import React, { useState } from "react";
import "./ClinicHome.css";

const ClinicHome = () => {
  const [activePanel, setActivePanel] = useState("patients");
  const [patients] = useState([]); // No backend, just an empty array

  return (
    <div className="clinic-container">
      <div className="sidebar">
        <h2>Doc Potat</h2>
        <button className={activePanel === "patients" ? "active" : ""} onClick={() => setActivePanel("patients")}>
          Patients
        </button>
        <button className={activePanel === "appointments" ? "active" : ""} onClick={() => setActivePanel("appointments")}>
          Appointments
        </button>
        <button className={activePanel === "records" ? "active" : ""} onClick={() => setActivePanel("records")}>
          Health Records
        </button>
      </div>

      <div className="content">
        <div className="panel-container">
          {activePanel === "patients" && (
            <div className="panel patients-panel">
              <h3>Patients</h3>
              <table>
                <thead>
                  <tr>
                    <th>Pet ID</th>
                    <th>Pet Owner</th>
                    <th>Pet Name</th>
                    <th>Pet Type</th>
                    <th>Gender</th>
                    <th>Next Appointment</th>
                    <th>Health Records</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <tr key={patient.id}>
                        <td>{patient.id}</td>
                        <td>{patient.owner}</td>
                        <td>{patient.name}</td>
                        <td>{patient.type}</td>
                        <td>{patient.gender}</td>
                        <td>{patient.nextAppointment || "N/A"}</td>
                        <td><button>View</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>No patients found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activePanel === "appointments" && (
            <div className="panel appointments-panel">
              <h3>Appointments</h3>
              <table>
                <thead>
                  <tr>
                    <th>Pet ID</th>
                    <th>Pet Owner</th>
                    <th>Pet Name</th>
                    <th>Pet Type</th>
                    <th>See Record</th>
                    <th>Service Type</th>
                    <th>Appointment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty rows */}
                </tbody>
              </table>
            </div>
          )}

          {activePanel === "records" && (
            <div className="panel records-panel">
              <h3>Health Records</h3>
              <table>
                <thead>
                  <tr>
                    <th>Pet ID</th>
                    <th>Pet Name</th>
                    <th>Vaccinations</th>
                    <th>Allergies</th>
                    <th>Surgeries</th>
                    <th>Diagnosis</th>
                    <th>Veterinarian</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty rows */}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicHome;
