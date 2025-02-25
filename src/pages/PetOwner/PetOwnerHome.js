import React, { useState } from "react";
import "./PetOwnerHome.css";

const PetOwnerHome = () => {
  const [activePanel, setActivePanel] = useState("petDetails");

  return (
    <div className="pet-owner-container">
      <div className="sidebar">
        <h2>Pet Owner</h2>
        <button
          className={activePanel === "petDetails" ? "active" : ""}
          onClick={() => setActivePanel("petDetails")}
        >
          Pet Details
        </button>
        <button
          className={activePanel === "appointments" ? "active" : ""}
          onClick={() => setActivePanel("appointments")}
        >
          Appointments
        </button>
        <button
          className={activePanel === "bookAppointment" ? "active" : ""}
          onClick={() => setActivePanel("bookAppointment")}
        >
          Book Appointment
        </button>
      </div>

      <div className="content">
        <div className="panel-container">
          {activePanel === "petDetails" && (
            <div className="panel pet-details-panel">
              <h3>Pet Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Pet Name</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Breed</th>
                    <th>Weight (Kg)</th>
                    <th>Diagnosis</th>
                    <th>Vaccination</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Add Pet Details Data Here */}
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
                    <th>Pet Name</th>
                    <th>Time & Date of Appointment</th>
                    <th>Diagnosis</th>
                    <th>Service</th>
                    <th>Veterinarian</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Add Appointment Data Here */}
                </tbody>
              </table>
            </div>
          )}

          {activePanel === "bookAppointment" && (
            <div className="panel book-appointment-panel">
              <h3>Book Appointment</h3>
              <form>
                <label>Choose Pet</label>
                <select>
                  <option>Princess</option>
                  <option>Cupcake</option>
                </select>
                <br />
                <label>Service Type</label>
                <select>
                  <option>Vaccination</option>
                  <option>Pet Surgery</option>
                </select>
                <br />
                <label>Clinic Location</label>
                <input type="text" value="Ayrate Veterinary Center Inc." readOnly />
                <br />
                <label>Appointment Date</label>
                <input type="datetime-local" />
                <br />
                <button type="submit">Book Appointment</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetOwnerHome;
