import React from 'react';
import './Services.css'; 
import Footer from '../../components/Footer/Footer'; 

const Services = () => {
    return (
        <div>
            <div className="services-container animate__animated animate__fadeInUpBig">
                <div className="services-title">
               <h1><span className="our">Our</span> <span className="services">Services</span></h1>
                </div>
                <div className="services-grid">
                    {/* Service Items */}
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Wellness & Prevention Icon" 
                            />
                        </div>
                        <p>Wellness & Prevention</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Testing & Diagnostics Icon" 
                            />
                        </div>
                        <p>Testing & Diagnostics</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Advanced Care Icon" 
                            />
                        </div>
                        <p>Advanced Care</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Pet Anaesthesia Icon" 
                            />
                        </div>
                        <p>Pet Anaesthesia</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Pet Surgery Icon" 
                            />
                        </div>
                        <p>Pet Surgery</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Urgent Care Icon" 
                            />
                        </div>
                        <p>Urgent Care</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Pet Dental Surgery Icon" 
                            />
                        </div>
                        <p>Pet Dental Surgery</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Orthopedic Pet Surgery Icon" 
                            />
                        </div>
                        <p>Orthopedic Pet Surgery</p>
                    </div>
                    <div className="service-item">
                        <div className="icon">
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDdth6s8wfllNAHbXJ3oFo_xFT7b_6s2cajw&s"
                                alt="Others Icon" 
                            />
                        </div>
                        <p>Others</p>
                    </div>
                </div>
            </div>

            {/* Footer outside of the services container */}
            <Footer />
        </div>
    );
};

export default Services;
