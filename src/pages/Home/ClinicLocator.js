// ClinicLocator.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ClinicLocator.css';

const ClinicLocator = () => {
    const location = useLocation();
    const [clinicSearchQuery, setClinicSearchQuery] = useState('');

    useEffect(() => {
        if (location.state && location.state.searchQuery) {
            setClinicSearchQuery(location.state.searchQuery);
        }
    }, [location.state]);

    const handleClinicSearch = () => {
        console.log("Searching for clinics near:", clinicSearchQuery);
    };

    return (
        <div className="clinicLocatorContainer">
            <h2 className="clinicLocatorTitle">Find a Clinic</h2>
            <div className="clinicSearchInputContainer">
                <input
                    type="text"
                    placeholder="Enter location"
                    value={clinicSearchQuery}
                    onChange={(e) => setClinicSearchQuery(e.target.value)}
                    className="clinicSearchInputField"
                />
                <button onClick={handleClinicSearch} className="clinicSearchButton">Search</button>
            </div>
            
        </div>
    );
};

export default ClinicLocator;