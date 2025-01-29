
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from './components/Navbar/Navbar'; 
import Home from './pages/Home/Home';
import Maps from './pages/Maps/Maps'; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/maps" element={<Maps />} /> 
      </Routes>
    </Router>
  );
}

export default App;
