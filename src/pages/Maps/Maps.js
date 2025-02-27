import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Maps.css';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

const Maps = () => {
    const mapRef = useRef(null);
    const suggestionBoxRef = useRef(null);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [addingPin, setAddingPin] = useState(false);
    const [markers, setMarkers] = useState([]);
    const [tempCircle, setTempCircle] = useState(null);
    const debounceRef = useRef(null);

    const furIcon = L.icon({
        iconUrl: '/images/fur.png',
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -45],
    });

    // 🌐 Handle search suggestions while typing (debounced)
    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (value.trim().length > 2) fetchSearchResults(value);
            else setSearchResults([]);
        }, 300); // ⚡ Debounce: 300ms for faster response
    };

    const fetchSearchResults = async (query) => {
        try {
            let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}, Cebu&addressdetails=1&countrycodes=ph&limit=5`;
            
            const res = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'TeknoSpaceApp/1.0',
                    'Accept-Language': 'en',
                },
            });
    
            if (!res.ok) throw new Error('Network response was not ok');
            let data = await res.json();
    
            // If no Cebu results found, search globally
            if (data.length === 0) {
                searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`;
                const globalRes = await fetch(searchUrl, {
                    headers: {
                        'User-Agent': 'TeknoSpaceApp/1.0',
                        'Accept-Language': 'en',
                    },
                });
                if (!globalRes.ok) throw new Error('Network response was not ok');
                data = await globalRes.json();
            }
    
            const filteredData = data.map((result) => ({
                lat: result.lat,
                lon: result.lon,
                road: result.address.road || 'N/A',
                suburb: result.address.suburb || 'N/A',
                city: result.address.city || result.address.town || result.address.village || '',
                country: result.address.country || '',
            }));
    
            setSearchResults(filteredData);
        } catch (error) {
            console.error('❌ Error fetching data:', error);
        }
    };
    

    // 🖱️ Detect clicks outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(e.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 🌟 Handle suggestion click - place temporary red circle
    const handleSuggestionClick = (result) => {
        const { lat, lon, road, suburb, city } = result;
        mapRef.current.setView([lat, lon], 16);
        if (tempCircle) mapRef.current.removeLayer(tempCircle);
        const circle = L.circle([lat, lon], {
            color: 'red',
            radius: 100,
        }).addTo(mapRef.current);
        setTempCircle(circle);
        setSearchResults([]);
        setQuery(`${road}, ${suburb}, ${city}`);
    };

    // 📍 Load markers from Firestore
    useEffect(() => {
        if (mapRef.current !== null) mapRef.current.remove();
        mapRef.current = L.map('map').setView([10.3157, 123.8854], 13); // Cebu City center
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);

        const locationsRef = collection(db, 'mapLocations');
        onSnapshot(locationsRef, (snapshot) => {
            markers.forEach(({ marker }) => mapRef.current.removeLayer(marker));
            const newMarkers = [];
            snapshot.forEach((docSnapshot) => {
                const loc = docSnapshot.data();
                const marker = L.marker([loc.lat, loc.lng], { icon: furIcon })
                    .addTo(mapRef.current)
                    .bindPopup(createPopupContent({ lat: loc.lat, lng: loc.lng }, docSnapshot.id));
                newMarkers.push({ id: docSnapshot.id, marker });
            });
            setMarkers(newMarkers);
        });

        mapRef.current.on('click', (e) => {
            if (addingPin) {
                addMarkerToDB(e.latlng.lat, e.latlng.lng);
                setAddingPin(false);
            }
        });
    }, [addingPin]);

    const createPopupContent = (coords, id) => `
        <div>
            <strong>Pin at:</strong><br/>
            Lat: ${Number(coords.lat).toFixed(4)}, Lng: ${Number(coords.lng).toFixed(4)}<br/>
            <button onclick="window.deletePin('${id}')" style="color:red; cursor:pointer;">Delete Pin</button>
        </div>
    `;

    const addMarkerToDB = async (lat, lng) => {
        try {
            await addDoc(collection(db, 'mapLocations'), { lat, lng });
            console.log(`📍 Pin added at Lat: ${lat}, Lng: ${lng}`);
        } catch (error) {
            console.error('❌ Error adding marker: ', error);
        }
    };

    window.deletePin = async (id) => {
        try {
            await deleteDoc(doc(db, 'mapLocations', id));
            console.log(`🗑️ Pin with ID ${id} deleted.`);
        } catch (error) {
            console.error('❌ Error deleting marker: ', error);
        }
    };

    return (
        <div className="maps-container">
            <h2>🌍 Explore Cebu Locations</h2>
            <div className="search-container" ref={suggestionBoxRef}>
                <input
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    placeholder="🔍 Search around Cebu City or Province..."
                    className="search-input"
                />
                {searchResults.length > 0 && (
                    <div className="suggestions-list">
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(result)}
                            >
                                {`${result.road}, ${result.suburb}, ${result.city}`}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => setAddingPin(true)} className="add-pin-btn">
                ➕ Add Pin
            </button>
            <div id="map" style={{ height: '400px' }}></div>
        </div>
    );
};

export default Maps;
