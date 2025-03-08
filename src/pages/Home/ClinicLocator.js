
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ClinicLocator.css';

const ClinicLocator = () => {
    const location = useLocation();
    const [clinicSearchQuery, setClinicSearchQuery] = useState('');

    const [userLat, setUserLat] = useState(null);
    const [userLng, setUserLng] = useState(null);
    const [clinicMarkers, setClinicMarkers] = useState([]);
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const clinicMarkersRef = useRef([]);

    useEffect(() => {
        if (location.state && location.state.searchQuery) {
            setClinicSearchQuery(location.state.searchQuery);
            fetchCoordinates(location.state.searchQuery);
        }
    }, [location.state]);

    const fetchCoordinates = async (address) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setUserLat(parseFloat(lat));
                setUserLng(parseFloat(lon));
                console.log("Location found from address:", lat, lon);
            } else {
                setUserLat(10.3157); 
                setUserLng(123.8854); 
                alert('Address not found. Showing Cebu City.');
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            setUserLat(10.3157);
            setUserLng(123.8854);
            alert('Error fetching coordinates. Showing Cebu City.');
        }
    };

    // if pin is dragged, maps need to be updated
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setClinicSearchQuery(data.display_name); 
            } else if (data && data.address) {
                const addressParts = [
                    data.address.house_number,
                    data.address.road || data.address.pedestrian,
                    data.address.neighbourhood,
                    data.address.village || data.address.town || data.address.city,
                    data.address.county,
                    data.address.state,
                    data.address.postcode,
                    data.address.country,
                ].filter(Boolean);
                const address = addressParts.join(', ');
                setClinicSearchQuery(address);
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    };

    useEffect(() => {
        if (userLat !== null && userLng !== null) {
            if (!mapRef.current) {
                mapRef.current = L.map('mapClinicLocator').setView([userLat, userLng], 18);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapRef.current);

                const userIcon = L.icon({
                    iconUrl: '/images/fur.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32],
                });

                userMarkerRef.current = L.marker([userLat, userLng], {
                    draggable: true,
                    icon: userIcon,
                }).addTo(mapRef.current);

                // userMarkerRef.current.on('dragend', function (event) {
                //     const marker = event.target;
                //     const position = marker.getLatLng();
                //     setUserLat(position.lat);
                //     setUserLng(position.lng);
                // });
                console.log("BEFORE: Map initialized at:", userLat, userLng);

                userMarkerRef.current.on('dragend', function (event) {
                    const marker = event.target;
                    const position = marker.getLatLng();
                    setUserLat(position.lat);
                    setUserLng(position.lng);
                    reverseGeocode(position.lat, position.lng); // Reverse geocode on drag end
                });

                console.log("AFTER: Map initialized at:", userLat, userLng);
            } else {
                mapRef.current.setView([userLat, userLng], 13);
                userMarkerRef.current.setLatLng([userLat, userLng]);
                console.log("Map view updated to:", userLat, userLng);
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                userMarkerRef.current = null;
            }
        };
    }, [userLat, userLng]);


    const handleClinicSearch = async () => {
        if (mapRef.current && clinicMarkersRef.current) {
            clinicMarkersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
            clinicMarkersRef.current = [];
        }

        try {
            const clinicsCollection = collection(db, 'clinics');
            const querySnapshot = await getDocs(clinicsCollection);
            const markers = querySnapshot.docs.map(doc => {
                const data = doc.data();
                if (data.lat && data.lng) {
                    const marker = L.marker([data.lat, data.lng]).addTo(mapRef.current);
                    clinicMarkersRef.current.push(marker);
                    return marker;
                }
                return null;
            }).filter(marker => marker !== null);

            setClinicMarkers(markers);
        } catch (error) {
            console.error('Error fetching clinics:', error);
            alert('Error fetching clinics. Please try again.');
        }
    };

    return (
        <div className="clinicLocatorContainer">
            <h2 className="clinicLocatorTitle">Search for a Clinic</h2>
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
            <div id="mapClinicLocator" className="mapClinicLocatorContainer" style={{ height: '420px' }}></div> 
        </div>
    );
};

export default ClinicLocator;