import React from 'react'; // Removed useEffect import if not used elsewhere in App.js

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';

import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Home from './pages/Home/Home';
import ClinicLocator from './pages/Home/ClinicLocator';
import Maps from './pages/Maps/Maps';
import About from './pages/About/About';
import Services from './pages/Services/Services';
// import Appointments from './pages/Appointments/Appointments';
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

const Layout = ({ children }) => {
  const location = useLocation();
  // Add routes where Navbar should not appear (e.g., specific dashboards)
  const noNavbarRoutes = ['/ClinicHome', '/VeterinaryHome', '/AdminHome', '/AdminAnalytics', '/AdminSubscription'];
  // Check if the current path starts with any of the noNavbarRoutes
  const hideNavbar = noNavbarRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
};


function App() {

  // *** The useEffect hook for Chatbase has been removed from here ***

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/Home" />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/clinicLocator" element={<ClinicLocator />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          {/* <Route path="/appointments" element={<Appointments />} /> */}
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/ClinicSubscribe" element={<ClinicSubscribe />} />
          {/* Clinic Routes */}
          <Route path="/ClinicHome" element={<ClinicHome />} />
           {/* Pet Owner Routes */}
          <Route path="/PetOwnerHome" element={<PetOwnerHome />} />
          {/* Veterinary Routes */}
          <Route path="/VeterinaryHome" element={<VeterinaryHome />} />
          {/* Admin Routes */}
          <Route path="/AdminHome" element={<AdminClinics />} />
          <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
          <Route path="/AdminSubscription" element={<AdminSubscription />} />
          {/* Find Clinic & Details */}
          <Route path="/FindClinic" element={<FindClinic />} />
          <Route path="/FindClinic/:clinicName" element={<ClinicDetails />} />
          <Route path="/clinic/:clinicId" element={<ClinicDetails />} />
           {/* Fallback or 404 Route - Optional */}
           {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;