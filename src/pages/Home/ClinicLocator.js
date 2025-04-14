
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ClinicLocator.css';

const ClinicLocator = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [clinicSearchQuery, setClinicSearchQuery] = useState('');

    const [userLat, setUserLat] = useState(null);
    const [userLng, setUserLng] = useState(null);
    const [clinicMarkers, setClinicMarkers] = useState([]);
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const clinicMarkersRef = useRef([]);

    const [searchRadius, setSearchRadius] = useState(5);
    const [clinics, setClinics] = useState([]);

    const [showClinicLocatorNoClinicsModal, setShowClinicLocatorNoClinicsModal] = useState(false);

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

    // Calculate distance between two points using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
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


    const updateClinicMarkers = (lat, lng, clinicsData) => {
        if (mapRef.current && clinicMarkersRef.current) {
            clinicMarkersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
            clinicMarkersRef.current = [];
        }

        const nearbyClinicMarkers = [];
        const clinicIcon = L.icon({
            iconUrl: '/images/blue_fur.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
        });

        // Overlapping
        // Store adjusted coordinates to avoid overlap
        const usedCoordinates = new Set();
        const coordinateThreshold = 0.00001; // ~1 meter
        const offset = 0.0005; // ~11 meters

        clinicsData.forEach((clinic, index) => {
            // Validate coordinates
            if (!clinic.lat || !clinic.lng || isNaN(clinic.lat) || isNaN(clinic.lng)) {
                console.warn(`Skipping clinic ${clinic.clinicName || 'Unnamed'} (index ${index}) due to invalid coordinates: lat=${clinic.lat}, lng=${clinic.lng}`);
                return;
            }

            const distance = calculateDistance(lat, lng, clinic.lat, clinic.lng);
            if (distance <= searchRadius) {
                // Check for overlapping coordinates
                let adjustedLat = clinic.lat;
                let adjustedLng = clinic.lng;
                const coordKey = `${clinic.lat.toFixed(6)},${clinic.lng.toFixed(6)}`;

                // If coordinates are too close to an existing marker, apply offset
                let offsetCount = 0;
                while (usedCoordinates.has(`${adjustedLat.toFixed(6)},${adjustedLng.toFixed(6)}`)) {
                    offsetCount++;
                    adjustedLat = clinic.lat + offset * offsetCount;
                    console.log(`Applied offset to clinic ${clinic.clinicName || 'Unnamed'} (index ${index}) to avoid overlap: new lat=${adjustedLat}, attempt ${offsetCount}`);
                }
                usedCoordinates.add(`${adjustedLat.toFixed(6)},${adjustedLng.toFixed(6)}`);

                const marker = L.marker([adjustedLat, adjustedLng], { icon: clinicIcon }).addTo(mapRef.current);

                //original
                // const marker = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon }).addTo(mapRef.current);

                let fullAddress = '';
                if (clinic.streetAddress) {
                    fullAddress += clinic.streetAddress;
                }
                if (clinic.province) {
                    fullAddress += (fullAddress ? ', ' : '') + clinic.province;
                }
                if (clinic.postalCode) {
                    fullAddress += (fullAddress ? ' ' : '') + clinic.postalCode;
                }

                console.log("Clinic Address:", fullAddress);

                const popupContent = `
                    <div class="clinic-popup">
                        <h3>${clinic.clinicName || 'Unnamed Clinic'}</h3>
                        <p><strong>Address:</strong> ${fullAddress || 'No address available'}</p>
                        <p><strong>Distance:</strong> ${distance.toFixed(2)} km</p>
                        <p><strong>Phone:</strong> ${clinic.phone || 'No phone available'}</p>
                        <button class="see-details-button" data-clinic-id="${clinic.id}">See Details</button>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // "See Details" button
                marker.on('popupopen', () => {
                    const button = document.querySelector(`.see-details-button[data-clinic-id="${clinic.id}"]`);
                    if (button) {
                        button.addEventListener('click', (e) => {
                            const clinicId = e.target.getAttribute('data-clinic-id');
                            console.log("Clinic ID clicked:", clinicId);
                            navigate('/FindClinic', { state: { selectedClinicId: clinicId } });
                        });
                    }
                });


                nearbyClinicMarkers.push(marker);
            }
        });

        clinicMarkersRef.current = nearbyClinicMarkers;
        console.log("Clinic Markers:", nearbyClinicMarkers);

        if (nearbyClinicMarkers.length === 0) {
            setShowClinicLocatorNoClinicsModal(true);
        } else {
            console.log(`Found ${nearbyClinicMarkers.length} clinics within ${searchRadius} km.`);
            // Fit map to show all markers
            if (nearbyClinicMarkers.length > 0) {
                const group = L.featureGroup(nearbyClinicMarkers);
                mapRef.current.fitBounds(group.getBounds().pad(0.2)); // 20% padding
                console.log("Map adjusted to fit all markers");
            }
        }
    };

    const handleClinicSearch = async () => {
        await fetchCoordinates(clinicSearchQuery);

        try {
            // Fetch all clinics from the database
            const clinicsCollection = collection(db, 'clinics');
            const querySnapshot = await getDocs(clinicsCollection);

            const clinicData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data
                };
            }).filter(clinic => clinic.lat && clinic.lng); // Ensure clinics have coordinates

            setClinics(clinicData);
            console.log("Data from Firebase:", clinicData);

            // Update the map with nearby clinics
            if (userLat !== null && userLng !== null) {
                updateClinicMarkers(userLat, userLng, clinicData);
            }

        } catch (error) {
            console.error('Error fetching clinics:', error);
            alert('Error fetching clinics. Please try again.');
        }
    };

    // modal
    const ClinicLocatorNoClinicsModal = () => (
        <div className="clinic-locator-modal-overlay">
            <div className="clinic-locator-modal-content">
                <h3>No Clinics Found</h3>
                <p>No clinics were found within {searchRadius} km of your location.</p>
                <div className="clinic-locator-modal-buttons">
                    <button
                        className="clinic-locator-modal-see-all-button"
                        onClick={() => navigate('/FindClinic')}
                    >
                        See All Clinics
                    </button>
                    <button
                        className="clinic-locator-modal-close-button"
                        onClick={() => setShowClinicLocatorNoClinicsModal(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

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

                <select
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="radiusSelector"
                >
                    <option value="1">1 km</option>
                    <option value="3">3 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                </select>

                <button onClick={handleClinicSearch} className="clinicSearchButton">Search</button>
            </div>

            {clinics.length > 0 && (
                <div className="clinicListContainer">
                    <h3>Nearby Clinics ({clinics.filter(clinic =>
                        calculateDistance(userLat, userLng, clinic.lat, clinic.lng) <= searchRadius
                    ).length})</h3>
                    {/* <ul className="clinicList">
                        {clinics
                            .filter(clinic => calculateDistance(userLat, userLng, clinic.lat, clinic.lng) <= searchRadius)
                            .sort((a, b) =>
                                calculateDistance(userLat, userLng, a.lat, a.lng) -
                                calculateDistance(userLat, userLng, b.lat, b.lng)
                            )
                            .map(clinic => (
                                <li key={clinic.id} className="clinicListItem">
                                    <h4>{clinic.name || 'Unnamed Clinic'}</h4>
                                    <p>{clinic.address || 'No address available'}</p>
                                    <p>Distance: {calculateDistance(userLat, userLng, clinic.lat, clinic.lng).toFixed(2)} km</p>
                                </li>
                            ))
                        }
                    </ul> */}
                </div>
            )}

            <div id="mapClinicLocator" className="mapClinicLocatorContainer" style={{ height: '420px' }}></div>

            {showClinicLocatorNoClinicsModal && <ClinicLocatorNoClinicsModal />}

        </div>
    );
};

export default ClinicLocator;