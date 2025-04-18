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
  const [servAppData, setServAppData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Fetch pets data
      const petsQuery = query(collection(db, "pets"));
      const petsSnapshot = await getDocs(petsQuery);

      const genderCount = {};
      const speciesCount = {};
      const ageCounts = {};
      let totalGenders = 0;
      let totalPets = 0;

      petsSnapshot.forEach((doc) => {
        const petData = doc.data();
        // Count gender
        const gender = petData.Gender || "Unknown";
        genderCount[gender] = (genderCount[gender] || 0) + 1;
        totalGenders++;

        // Count species
        const species = petData.Type || "Unknown";
        speciesCount[species] = (speciesCount[species] || 0) + 1;
        totalPets++;

        // Count ages
        const dateOfBirth = petData.dateofBirth
          ? typeof petData.dateofBirth.toDate === "function"
            ? petData.dateofBirth.toDate()
            : new Date(petData.dateofBirth)
          : undefined;
        if (dateOfBirth) {
          const now = new Date();
          const ageInYears = now.getFullYear() - dateOfBirth.getFullYear();
          ageCounts[ageInYears] = (ageCounts[ageInYears] || 0) + 1;
        }
      });

      // Fetch appointments data
      const appointmentsQuery = query(collection(db, "appointments"));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);

      const serviceTypeCount = {};
      const allServiceTypes = new Set();

      appointmentsSnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        const clinicId = appointmentData.clinic.id; // Extract clinicId from the reference
        const clinicName = appointmentData.clinicName || "Unknown Clinic";
        const serviceType = appointmentData.serviceType || "Unknown";

        allServiceTypes.add(serviceType);

        if (!serviceTypeCount[clinicId]) {
          serviceTypeCount[clinicId] = { clinicName, services: {} };
        }

        serviceTypeCount[clinicId].services[serviceType] =
          (serviceTypeCount[clinicId].services[serviceType] || 0) + 1;
      });

      // Format serviceType data for bar chart
      const formattedServAppData = Object.entries(serviceTypeCount).map(
        ([clinicId, { clinicName, services }]) => ({
          clinicName,
          ...services,
        })
      );

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
        formattedValue: `${((value / totalPets) * 100).toFixed(2)}%`,
      }));

      // Format age data for pie chart
      const formattedAgeData = Object.entries(ageCounts).map(([age, count]) => ({
        id: `${age} years`,
        label: `${age} years`,
        value: count,
      }));

      setServAppData(formattedServAppData);
      setGenderData(formattedGenderData);
      setSpeciesData(formattedSpeciesData);
      setAgeData(formattedAgeData);

      // Set keys dynamically based on all service types
      setKeys(Array.from(allServiceTypes));
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setServAppData([]);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginTop: "100px", textAlign: "center" }}>Admin Analytics</h1>
      <div style={{ height: "70vh", width: "100%" }}>
        <div>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Most Clinic Services Availed</h2>
        </div>
        <ResponsiveBar
          data={servAppData}
          keys={keys} // Dynamically set keys to service types
          indexBy="clinicName" // Use clinicName for axis bottom labels
          margin={{ top: 50, right: window.innerWidth < 600 ? 150 : 200, bottom: window.innerWidth < 600 ? 100 : 80, left: window.innerWidth < 600 ? 70 : 100 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "pastel2" }}
          defs={[]}
          fill={[]}
          borderColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: window.innerWidth < 600 ? 60 : 45, // Rotate more on smaller screens
            legend: "Clinics",
            legendPosition: "middle",
            legendOffset: window.innerWidth < 600 ? 70 : 50, // Adjust legend offset to avoid overlap with rotated labels
            truncateTickAt: 0,
            renderTick: ({ x, y, value, textAnchor, textBaseline, textX, textY }) => (
              <g transform={`translate(${x}, ${y}) rotate(${window.innerWidth < 600 ? 60 : 45})`}>
                <text
                  x={textX}
                  y={textY}
                  textAnchor={textAnchor}
                  dominantBaseline={textBaseline}
                  style={{
                    fontSize: window.innerWidth < 600 ? "10px" : "11px", // Smaller font on mobile
                    fill: "#333",
                  }}
                >
                  {value}
                </text>
              </g>
            ),
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            tickValues: window.innerWidth < 600 ? 5 : 8, // Fewer ticks on smaller screens
            legend: "Services Availed",
            legendPosition: "middle",
            legendOffset: window.innerWidth < 600 ? -50 : -40,
            truncateTickAt: 0,
            renderTick: ({ x, y, value, textAnchor, textBaseline, textX, textY }) => (
              <g transform={`translate(${x}, ${y})`}>
                <text
                  x={textX}
                  y={textY}
                  textAnchor={textAnchor}
                  dominantBaseline={textBaseline}
                  style={{
                    fontSize: window.innerWidth < 600 ? "10px" : "12px", // Smaller font on mobile
                    fill: "#333",
                  }}
                >
                  {value}
                </text>
              </g>
            ),
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: window.innerWidth < 600 ? 100 : 120, // Adjust legend position on smaller screens
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: "hover",
                  style: {
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          barAriaLabel={(e) => e.id + ": " + e.formattedValue + " in clinic: " + e.indexValue}
        />
      </div>
      <div className="chart-container" style={{ display: "flex", flexDirection: "row", width: "100%", marginTop: "90px", flexWrap: "wrap" }}>
        <div className="left-column" style={{ display: "flex", flexDirection: "column", width: "50%" }}>
          <div style={{ height: "450px", width: "100%" }}>
            <div>
              <h2 style={{ textAlign: "center", marginBottom: "0px" }}>Age Distribution of Pets</h2>
            </div>
            {/* change this to another chart bc why did i use another pie in here??? */}
            <ResponsivePie
              data={ageData}
              margin={{ top: 40, right: 80, bottom: 120, left: 80 }}
              activeOuterRadiusOffset={8}
              colors={{ scheme: "pastel1" }}
              borderWidth={1}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.2]],
              }}
              enableArcLinkLabels={false}
              arcLabel="id"
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{
                from: "color",
                modifiers: [["darker", 2]],
              }}
              defs={[]}
              fill={[]}
              legends={[]}
            />
          </div>
          <div style={{ height: "200px", width: "100%" }}>
            <div>
              <h2 style={{ textAlign: "center", marginBottom: "0px" }}>Pet Gender Distribution</h2>
            </div>
            <ResponsiveBar
              data={genderData}
              indexBy="id"
              margin={{ top: 20, right: 50, bottom: 50, left: 100 }}
              padding={0.5}
              innerPadding={0}
              layout="horizontal"
              valueScale={{ type: "linear" }}
              indexScale={{ type: "band", round: true }}
              colors={{ scheme: "paired" }}
              defs={[]}
              fill={[]}
              borderColor={{
                from: "color",
                modifiers: [["darker", 1.6]],
              }}
              axisBottom={null}
              axisTop={null}
              axisRight={null}
              enableTotals={true}
              labelSkipWidth={12}
              labelSkipHeight={12}
              legends={[]}
            />
          </div>
        </div>
        <div className="right-column" style={{ display: "flex", flexDirection: "column", width: "50%" }}>
          <div style={{ height: "650px", width: "100%" }}>
            <div>
              <h2 style={{ textAlign: "center", marginBottom: "0px" }}>Pet Type Distribution</h2>
            </div>
            <ResponsivePie
              data={speciesData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={10}
              activeOuterRadiusOffset={8}
              colors={{ scheme: "red_purple" }}
              borderWidth={1}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.2]],
              }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{
                from: "color",
                modifiers: [["darker", 2]],
              }}
              arcLabel={(d) => d.data.formattedValue}
              tooltip={({ datum }) => (
                <div
                  style={{
                    padding: "12px 16px",
                    color: "#333",
                    background: "#fff",
                    borderRadius: "2px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <strong>{datum.id}</strong>: {datum.data.count}
                </div>
              )}
              defs={[]}
              fill={[]}
              legends={[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Media query adjustments for responsiveness
const responsiveCSS = `
  @media (max-width: 768px) {
    /* Stack the flex container vertically */
    .chart-container {
      flex-direction: column !important;
    }

    /* Ensure all child containers take full width in one column */
    .left-column,
    .right-column {
      width: 100% !important;
    }

    /* Adjust chart heights for smaller screens */
    div[style*="height: 70vh"][style*="width: 100%"] {
      height: clamp(50vh, 60vh, 70vh) !important;
    }

    div[style*="height: 450px"][style*="width: 100%"] {
      height: clamp(300px, 40vh, 450px) !important;
    }

    div[style*="height: 200px"][style*="width: 100%"] {
      height: clamp(150px, 25vh, 200px) !important;
    }

    div[style*="height: 650px"][style*="width: 100%"] {
      height: clamp(350px, 45vh, 650px) !important;
    }

    /* Adjust title font size */
    h1[style*="marginTop: 100px"][style*="textAlign: center"] {
      font-size: clamp(1.5rem, 4vw, 2rem) !important;
    }

    h2[style*="textAlign: center"][style*="marginBottom: 20px"],
    h2[style*="textAlign: center"][style*="marginBottom: 0px"] {
      font-size: clamp(1rem, 3vw, 1.5rem) !important;
    }
  }

  @media (min-width: 769px) {
    /* Maintain the side-by-side layout for larger screens */
    .chart-container {
      flex-direction: row !important;
    }

    .left-column,
    .right-column {
      width: 50% !important;
    }
  }
`;

// Inject CSS into the document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = responsiveCSS;
  document.head.appendChild(styleSheet);
}

export default AdminAnalytics;