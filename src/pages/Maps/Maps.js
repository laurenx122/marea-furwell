import React, { useState, useEffect } from 'react';
import './Maps.css';

const Maps = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState(null);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Request user's location
    const requestUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setError(null); 
                },
                (err) => {
                    setError("Unable to access your location. Please enable location services.");
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    };

    useEffect(() => {
        requestUserLocation(); // Request location for user
    }, []);

    // to be changed from database location
    const locations = [
        'Tres, Labangon',
        'Katipunan, Labangon',
        'Upper Linao, Minglanilla',
        'Talisay',
        'Mabolo',
    ];

    const filteredLocations = locations.filter(location =>
        location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="maps-container">
            <h2>Explore Our Locations</h2>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search for a location..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="locations-list">
                {filteredLocations.length > 0 ? (
                    filteredLocations.map((location, index) => (
                        <div key={index} className="location-item">
                            <p>{location}</p>
                        </div>
                    ))
                ) : (
                    <p>No locations found. Try searching with different terms.</p>
                )}
            </div>


            <div className="map-section">
                <iframe
                    title="Location Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.883713418972!2d-122.08424968469012!3d37.4220659798251!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fba2d4f7c1c07%3A0x5fdee742c5ba2471!2sGoogleplex!5e0!3m2!1sen!2sus!4v1690754295550!5m2!1sen!2sus"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>


{/* 
            <div className="map-section">
                <h2>Find Us</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {userLocation ? (
                    <iframe
                        title="User Location Map"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyCnvsbMoJObv26qDgkflQvMFIuBPYhQj2g&q=${userLocation.lat},${userLocation.lng}`}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                ) : (
                    <p>Loading map...</p>
                )}
            </div> */}
        </div>
    );
};

export default Maps;
