import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar'; 

import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Home from './pages/Home/Home';
import Maps from './pages/Maps/Maps'; 

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar at the top */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/maps" element={<Maps />} /> 
      </Routes>
    </Router>
  );
}

export default App;
