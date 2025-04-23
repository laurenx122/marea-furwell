import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";

const AdminAnalytics = () => {
  const [servicesData, setServicesData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState(null);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      const petsQuery = query(collection(db, "pets"));
      const petsSnapshot = await getDocs(petsQuery);

      const genderCount = {};
      const speciesCount = {};
      const ageCounts = {};
      let totalGenders = 0;
      let totalPets = 0;

      petsSnapshot.forEach((doc) => {
        const petData = doc.data();
        const gender = petData.Gender || "Unknown";
        genderCount[gender] = (genderCount[gender] || 0) + 1;
        totalGenders++;

        const species = petData.Type || "Unknown";
        speciesCount[species] = (speciesCount[species] || 0) + 1;
        totalPets++;

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

      const appointmentsQuery = query(collection(db, "appointments"));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);

      const serviceTypeCount = {};

      appointmentsSnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        const serviceType = appointmentData.serviceType || "Unknown";
        serviceTypeCount[serviceType] = (serviceTypeCount[serviceType] || 0) + 1;
      });

      const formattedServicesData = Object.entries(serviceTypeCount).map(
        ([serviceType, count]) => ({
          id: serviceType,
          label: serviceType,
          value: count,
        })
      );

      const formattedGenderData = Object.entries(genderCount).map(
        ([key, value]) => ({
          id: key,
          label: key,
          value: value,
        })
      );

      const formattedSpeciesData = Object.entries(speciesCount).map(
        ([key, value]) => ({
          id: key,
          label: key,
          count: value,
          value: (value / totalPets) * 100,
          formattedValue: `${((value / totalPets) * 100).toFixed(2)}%`,
        })
      );

      const formattedAgeData = Object.entries(ageCounts).map(
        ([age, count]) => ({
          id: `${age} years`,
          label: `${age} years`,
          value: count,
        })
      );

      setServicesData(formattedServicesData);
      setGenderData(formattedGenderData);
      setSpeciesData(formattedSpeciesData);
      setAgeData(formattedAgeData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setServicesData([]);
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

  const isMobile = window.innerWidth <= 768;

  const ServicesChart = () => (
    <div
      style={{
        height: "450px",
        width: "100%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 8px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div>
        <h2 style={{ textAlign: "center" }}>
          Most Clinic Services Availed
        </h2>
      </div>
      <ResponsiveBar
        data={servicesData}
        keys={["value"]}
        indexBy="id"
        margin={
          isMobile
            ? { top: 20, right: 50, bottom: 90, left: 60 } // Increased bottom margin for wrapped labels on mobile
            : { top: 20, right: 50, bottom: 70, left: 60 } // Increased bottom margin for wrapped labels on desktop
        }
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors="rgb(143, 195, 213)"
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
          tickRotation: isMobile ? 45 : 0, // Slant labels on mobile
          legend: "Service Type",
          legendPosition: "middle",
          legendOffset: isMobile ? 70 : 50, // Adjusted to match new bottom margin
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Count",
          legendPosition: "middle",
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        legends={[]}
        barAriaLabel={(e) => e.id + ": " + e.formattedValue}
      />
    </div>
  );

  const AgeChart = () => (
    <div
      style={{
        height: "450px",
        width: "100%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 8px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div>
        <h2 style={{ textAlign: "center" }}>
          Age Distribution of Pets
        </h2>
      </div>
      <ResponsiveBar
        data={ageData}
        keys={["value"]}
        indexBy="id"
        margin={
          isMobile
            ? { top: 20, right: 50, bottom: 70, left: 60 }
            : { top: 20, right: 50, bottom: 50, left: 60 }
        }
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={{ scheme: "pastel1" }}
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
          tickRotation: isMobile ? 45 : 0,
          legend: "Age (Years)",
          legendPosition: "middle",
          legendOffset: isMobile ? 50 : 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Count",
          legendPosition: "middle",
          legendOffset: -40,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        legends={[]}
        barAriaLabel={(e) => e.id + ": " + e.formattedValue}
      />
    </div>
  );

  const GenderChart = () => (
    <div
      style={{
        height: "450px",
        width: "100%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 8px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div>
        <h2 style={{ textAlign: "center", marginBottom: "0px" }}>
          Pet Gender Distribution
        </h2>
      </div>
      <ResponsivePie
        data={genderData}
        margin={
          window.innerWidth <= 768
            ? { top: 20, right: 40, bottom: 60, left: 40 }
            : { top: 40, right: 80, bottom: 120, left: 80 }
        }
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ scheme: "pastel2" }}
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
        arcLabel={(d) => `${d.id} (${d.value})`}
        defs={[]}
        fill={[]}
        legends={[]}
      />
    </div>
  );

  const TypeChart = () => (
    <div
      style={{
        height: "450px",
        width: "100%",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 8px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div>
        <h2 style={{ textAlign: "center", marginBottom: "0px" }}>
          Pet Type Distribution
        </h2>
      </div>
      <ResponsivePie
        data={speciesData}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ scheme: "pastel1" }}
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
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
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
  );

  return (
    <div>
      <h1 style={{ marginTop: "100px", textAlign: "center" }}>
        Admin Analytics
      </h1>

      {isMobile ? (
        <>
          <div
            className="chart-buttons-a"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gridTemplateRows: "repeat(2, auto)",
              gap: "10px",
              justifyContent: "center",
              margin: "20px 0",
            }}
          >
            <button
              className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200 ${
                activeChart === "services"
                  ? "bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => setActiveChart("services")}
            >
              Clinic Services
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200 ${
                activeChart === "age"
                  ? "bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => setActiveChart("age")}
            >
              Age Distribution
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200 ${
                activeChart === "gender"
                  ? "bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => setActiveChart("gender")}
            >
              Gender Distribution
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200 ${
                activeChart === "type"
                  ? "bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => setActiveChart("type")}
            >
              Pet Type Distribution
            </button>
          </div>

          <div className="chart-container-mobile">
            {activeChart === "services" && <ServicesChart />}
            {activeChart === "age" && <AgeChart />}
            {activeChart === "gender" && <GenderChart />}
            {activeChart === "type" && <TypeChart />}
            {activeChart === null && (
              <p style={{ textAlign: "center", marginTop: "20px" }}>
                Select a chart to view analytics.
              </p>
            )}
          </div>
        </>
      ) : (
        <div>
          <div
            className="chart-container"
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              marginTop: "90px",
            }}
          >
            <div
              className="first-row"
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <div style={{ width: "50%", padding: "10px" }}>
                <ServicesChart />
              </div>
              <div style={{ width: "50%", padding: "10px" }}>
                <AgeChart />
              </div>
            </div>
            <div
              className="second-row"
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <div style={{ width: "50%", padding: "10px" }}>
                <TypeChart />
              </div>
              <div style={{ width: "50%", padding: "10px" }}>
                <GenderChart />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const responsiveCSS = `
  @media (max-width: 768px) {
    .chart-buttons-a {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
      justify-content: center !important;
      margin: 20px 0 !important;
      padding: 0 16px !important;
      box-sizing: border-box !important;
      max-width: 100% !important;
    }

    .chart-buttons-a button {
      width: 100%;
      height: 45px;
      background-color: #166286;
      color: white;
      border-radius: 5px;
      border: 2px solid transparent;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .chart-buttons-a button:hover {
      background-color: transparent;
      border: 2px solid #166286;
      color: #166286;
    }

    .chart-buttons-a button:active {
      background-color: #0f4b67;
      border-color: #0f4b67;
      color: white;
    }

    .chart-container {
      display: none !important;
    }

    .chart-container-mobile {
      width: 100%;
      max-width: 100% !important;
      height: auto !important;
    }

    div[style*="height: 70vh"][style*="width: 90%"],
    div[style*="height: 70vh"][style*="width: 100%"] {
      height: clamp(50vh, 60vh, 70vh) !important;
      max-width: 100% !important;
      margin: 0 auto;
    }

    div[style*="height: 70vh"] .nivo-legend text {
      font-size: 10px !important;
      white-space: nowrap;
    }

    div[style*="height: 70vh"] .nivo-legend {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      max-width: 100% !important;
      padding: 0 10px !important;
      box-sizing: border-box !important;
    }

    div[style*="height: 450px"] .nivo-axis text {
      max-width: 80px !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      font-size: 10px !important;
      text-anchor: middle !important; /* Center-align wrapped text */
      dominant-baseline: central !important; /* Vertically center wrapped text */
    }

    div[style*="height: 450px"][style*="width: 100%"] {
      height: clamp(350px, 50vh, 500px) !important;
      max-width: 100% !important;
    }

    h1[style*="marginTop: 100px"][style*="textAlign: center"] {
      font-size: clamp(1.5rem, 4vw, 2rem) !important;
    }

    h2[style*="textAlign: center"][style*="marginBottom: 20px"],
    h2[style*="textAlign: center"][style*="marginBottom: 0px"] {
      font-size: clamp(1rem, 3vw, 1.5rem) !important;
    }
  }

  @media (min-width: 769px) {
    .chart-buttons-a {
      display: none !important;
    }

    .chart-container {
      flex-direction: column !important;
      width: 100% !important;
      margin-top: 90px !important;
    }

    .first-row,
    .second-row {
      flex-direction: row !important;
      width: 100% !important;
    }

    .first-row > div,
    .second-row > div {
      width: 50% !important;
      padding: 10px !important;
      box-sizing: border-box !important;
    }

    div[style*="height: 450px"][style*="width: 100%"] {
      height: 450px !important;
      max-width: 100% !important;
    }

    div[style*="height: 450px"] .nivo-axis text {
      max-width: 140px !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      font-size: 12px !important;
      text-anchor: middle !important; /* Center-align wrapped text */
      dominant-baseline: central !important; /* Vertically center wrapped text */
    }

    h1[style*="marginTop: 100px"][style*="textAlign: center"] {
      font-size: clamp(2rem, 4vw, 2.5rem) !important;
      margin-top: 90px !important;
    }

    h2[style*="textAlign: center"][style*="marginBottom: 20px"],
    h2[style*="textAlign: center"][style*="marginBottom: 0px"] {
      font-size: clamp(1.25rem, 3vw, 1.5rem) !important;
    }
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = responsiveCSS;
  document.head.appendChild(styleSheet);
}

export default AdminAnalytics;