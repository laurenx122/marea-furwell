import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar'; 

import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Home from './pages/Home/Home';
import Maps from './pages/Maps/Maps'; 
import About from './pages/About/About'; // Corrected path
import Services from './pages/Services/Services'; // Corrected path
import Appointments from './pages/Appointments/Appointments'; // Corrected path
import ContactUs from './pages/ContactUs/ContactUs'; // Corrected path
import ClinicHome from './pages/Clinic/ClinicHome';

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar at the top */}
      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/ClinicHome" element={<ClinicHome />} />
      </Routes>
    </Router>
  );
}

export default App;
