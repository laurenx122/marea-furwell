import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar'; 

import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Home from './pages/Home/Home';
import ClinicLocator from './pages/Home/ClinicLocator';
import Maps from './pages/Maps/Maps'; 
import About from './pages/About/About'; 
import Services from './pages/Services/Services'; 
import Appointments from './pages/Appointments/Appointments'; 
import ClinicSubscribe from './pages/Signup/ClinicSubscribe';
import ContactUs from './pages/ContactUs/ContactUs'; 
import ClinicHome from './pages/Clinic/ClinicHome';
import PetOwnerHome from './pages/PetOwner/PetOwnerHome';
import VeterinaryHome from './pages/Veterinary/VeterinaryHome';
import AdminClinics from './pages/Admin/AdminHome';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSubscription from './pages/Admin/AdminSubscription';
import FindClinic from './pages/FindClinic/FindClinic';
import ClinicDetails from './pages/ClinicDetails/ClinicDetails';

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar at the top */}
      <Routes>
      <Route path="/" element={<Navigate to="/Home" />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/clinicLocator" element={<ClinicLocator />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/ClinicSubscribe" element={<ClinicSubscribe />} />
        <Route path="/ClinicHome" element={<ClinicHome />} />
        <Route path="/PetOwnerHome" element={<PetOwnerHome />} />
        <Route path="/VeterinaryHome" element={<VeterinaryHome />} />
        <Route path="/AdminHome" element={<AdminClinics />} />
        <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
        <Route path="/AdminSubscription" element={<AdminSubscription />} />
        <Route path="/FindClinic" element={<FindClinic />} />
        <Route path="/FindClinic/:clinicName" element={<ClinicDetails />} />
        <Route path="/clinic/:clinicId" element={<ClinicDetails />} />
      </Routes>
    </Router>
  );
}

export default App;