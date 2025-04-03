import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  deleteDoc,
  count,
} from "firebase/firestore";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";

const AdminAnalytics = () => {
    const [genderData, setGenderData] = useState([]);
    const [speciesData, setSpeciesData] = useState([]);
    const [ageData, setAgeData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchChartData = async () => {
        try {
          setLoading(true);
          const petsQuery = query(collection(db, "pets"));
          const querySnapshot = await getDocs(petsQuery);
    
          const genderCount = {};
          const speciesCount = {};
          const ageCounts = {};
          let totalGenders = 0;
          let totalPets = 0;
    
          querySnapshot.forEach((doc) => {
            const petData = doc.data();
            console.log("Pet Data:", petData);
            // Count gender
            const gender = petData.Gender || "Unknown";
            genderCount[gender] = (genderCount[gender] || 0) + 1;
            totalGenders++;
    
            // Count species
            const species = petData.Species || "Unknown";
            speciesCount[species] = (speciesCount[species] || 0) + 1;
            totalPets++;
    
            // Count ages
            const dateOfBirth = petData.dateofBirth ? (typeof petData.dateofBirth.toDate === 'function' ? petData.dateofBirth.toDate() : new Date(petData.dateofBirth)) : undefined;
              if (dateOfBirth) {
                  const now = new Date();
                  const ageInYears = now.getFullYear() - dateOfBirth.getFullYear();
                  ageCounts[ageInYears] = (ageCounts[ageInYears] || 0) + 1;
              }
          });
    
          console.log("Gender Count:", genderCount);
          console.log("Species Count:", speciesCount); // ADD THIS LINE
          console.log("Age Counts:", ageCounts); // ADD THIS LINE
            
          // Format gender data for bar chart
          const formattedGenderData = Object.entries(genderCount).map(([key, value]) => ({
            id: key,
            label: key,
            value: value,
          }));
    
          // Format species data for pie chart
          const formattedSpeciesData = Object.entries(speciesCount).map(([key, value]) => ({
            id: key,
            label: key,
            count: value,
            value: ((value / totalPets) * 100),
            formattedValue: `${((value / totalPets) * 100)}%`
          }));
    
          // Format age data for pie chart
          const formattedAgeData = Object.entries(ageCounts).map(([age, count]) => ({
            id: `${age} years`,
            label: `${age} years`,
            value: count,
          }));
    
          setGenderData(formattedGenderData);
          setSpeciesData(formattedSpeciesData);
          setAgeData(formattedAgeData);
    
        } catch (error) {
          console.error("Error fetching chart data:", error);
          setGenderData([]);
          setSpeciesData([]);
          setAgeData([]);
        } finally {
          setLoading(false);
        }
      };
        useEffect(() => {
          const initializeData = async () => {
            fetchChartData();
          };
          initializeData();
        }, []);  
    return (
        <div>
         <h1 style={{ marginTop: "100px" }}>Admin Analytics</h1>
           <div style={{ display: 'flex', width: '100%' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                             <div style={{ height: "450px", width: "100%" }}>
                             <div><h2 style= {{textAlign: "center", marginBottom: "0px"}}>Age Distribution of Pets</h2></div>
                             {/* change this to another chart bc why did i use another pie in here??? */}
                               <ResponsivePie
                                   data={ageData}
                                   margin={{ top: 40, right: 80, bottom: 120, left: 80 }}
                                   activeOuterRadiusOffset={8}
                                   colors={{ scheme: 'pastel1' }}
                                   borderWidth={1}
                                   borderColor={{
                                       from: 'color',
                                       modifiers: [
                                           ['darker', 0.2]
                                       ]
                                   }}
                                   enableArcLinkLabels={false}
                                   arcLabel="id"
                                   arcLabelsSkipAngle={10}
                                   arcLabelsTextColor={{
                                       from: 'color',
                                       modifiers: [['darker', 2]]
                                   }}
                                   defs={[]}
                                   fill={[]}
                                   legends={[]}
                               />
                           </div>
                           <div style={{ height: "200px", width: "100%" }}>
                             <div><h2 style= {{textAlign: "center", marginBottom: "0px"}}>Breed Breakdown Treated</h2></div>
                             <ResponsiveBar
                               data={genderData}
                               indexBy="id"
                               margin={{ top: 20, right: 50, bottom: 50, left: 60 }}
                               padding={0.5}
                               innerPadding={0}
                               layout="horizontal"
                               valueScale={{ type: 'linear' }}
                               indexScale={{ type: 'band', round: true }}
                               colors={{ scheme: 'paired' }}
                               defs={[]}
                               fill={[]}
                               borderColor={{
                                   from: 'color',
                                   modifiers: [
                                       [
                                           'darker',
                                           1.6
                                       ]
                                   ]
                               }}
                               axisBottom={null}
                               axisTop={null}
                               axisRight={null}
                               enableTotals={true}
                               labelSkipWidth={12}
                               labelSkipHeight={12}
                               legends={[]}
                           ></ResponsiveBar>
                           </div>
                           </div>
                           <div style={{flexDirection: 'column', width: '100%' }}>
                           <div style={{ height: "550px", width: "100%" }}>
                             <div><h2 style= {{textAlign: "center", marginBottom: "0px"}}>Pet Type Distribution</h2></div>
                           <ResponsivePie
                               data={speciesData}
                               margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                               innerRadius={0.5}
                               padAngle={0.7}
                               cornerRadius={10}
                               activeOuterRadiusOffset={8}
                               colors={{ scheme: 'red_purple' }}
                               borderWidth={1}
                               borderColor={{
                                   from: 'color',
                                   modifiers: [
                                       [
                                           'darker',
                                           0.2
                                       ]
                                   ]
                               }}
                               arcLinkLabelsSkipAngle={10}
                               arcLinkLabelsTextColor="#333333"
                               arcLinkLabelsThickness={2}
                               arcLinkLabelsColor={{ from: 'color' }}
                               arcLabelsSkipAngle={10}
                               arcLabelsTextColor={{
                                   from: 'color',
                                   modifiers: [
                                       [
                                           'darker',
                                           2
                                       ]
                                   ]
                               }}
                               arcLabel={(d) => d.data.formattedValue} 
                               tooltip={({ datum }) => ( 
                                 <div
                                     style={{
                                         padding: '12px 16px',
                                         color: '#333',
                                         background: '#fff',
                                         borderRadius: '2px',
                                         boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                                     }}
                                 >
                                     <strong>{datum.id}</strong>: {datum.data.count}
                                 </div>
                             )}
                               defs={[]}
                               fill={[]}
                             legends={[]}
                           ></ResponsivePie>
                         </div>
                         <div style={{ height: "200px", width: "100%" }}>
                             <div><h2 style= {{textAlign: "center", marginBottom: "0px"}}>Pet Gender Distribution</h2></div>
                             <ResponsiveBar
                               data={genderData}
                               indexBy="id"
                               margin={{ top: 20, right: 50, bottom: 50, left: 60 }}
                               padding={0.5}
                               innerPadding={0}
                               layout="horizontal"
                               valueScale={{ type: 'linear' }}
                               indexScale={{ type: 'band', round: true }}
                               colors={{ scheme: 'paired' }}
                               defs={[]}
                               fill={[]}
                               borderColor={{
                                   from: 'color',
                                   modifiers: [
                                       [
                                           'darker',
                                           1.6
                                       ]
                                   ]
                               }}
                               axisBottom={null}
                               axisTop={null}
                               axisRight={null}
                               enableTotals={true}
                               labelSkipWidth={12}
                               labelSkipHeight={12}
                               legends={[]}
                           ></ResponsiveBar>
                           </div>
                         </div>
                       </div>
        </div>
    );
};

export default AdminAnalytics;