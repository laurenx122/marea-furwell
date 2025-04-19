import React, { useState, useEffect } from 'react';
import './Services.css'; 
import Footer from '../../components/Footer/Footer'; 
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Services = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const servicesCollection = collection(db, 'services');
                const servicesSnapshot = await getDocs(servicesCollection);
                const servicesList = servicesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.id
                }));
                setServices(servicesList);
            } catch (error) {
                console.error("Error fetching services: ", error);
            }
        };

        fetchServices();
    }, []);

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            overflowX: 'hidden'
        }}>
            <div className="services-container animate__animated animate__fadeInUpBig">
                <div className="services-title">
                    <h1><span className="our">Our</span> <span className="services">Services</span></h1>
                </div>
                <div className="services-grid">
                    {services.length > 0 ? (
                        services.map((service) => (
                            <div key={service.id} className="service-item">
                                <div className="icon">
                                    <img
                                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                        alt={`${service.name} Icon`}
                                    />
                                </div>
                                <p>{service.name}</p>
                            </div>
                        ))
                    ) : (
                        <p>Loading services...</p>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Services;