import React from "react";
import { FaTrash, FaCheck } from "react-icons/fa";
import "./AdminSubscription.css";

const ClinicDashboard = () => {
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
          <tr>
            <td>1</td>
            <td>Example Clinic</td>
            <td>123 Main St</td>
            <td>+123456789</td>
            <td>clinic@example.com</td>
            <td>Dr. Smith</td>
            <td>
           <div className="actions">
                <button className="icon-buttoncheck"><FaCheck /></button>
                <button className="icon-buttondelete"><FaTrash /></button>
            </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ClinicDashboard;
