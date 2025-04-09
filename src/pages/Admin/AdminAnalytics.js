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
  const [servAppData, setServAppData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [speciesData, setSpeciesData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const allServiceTypes = new Set();

      appointmentsSnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        const clinicId = appointmentData.clinic.id;
        const clinicName = appointmentData.clinicName || "Unknown Clinic";
        const serviceType = appointmentData.serviceType || "Unknown";

        allServiceTypes.add(serviceType);

        if (!serviceTypeCount[clinicId]) {
          serviceTypeCount[clinicId] = { clinicName, services: {} };
        }
        serviceTypeCount[clinicId].services[serviceType] =
          (serviceTypeCount[clinicId].services[serviceType] || 0) + 1;
      });

      const formattedServAppData = Object.entries(serviceTypeCount).map(
        ([clinicId, { clinicName, services }]) => ({
          clinicName,
          ...services,
        })
      );

      const formattedGenderData = Object.entries(genderCount).map(([key, value]) => ({
        id: key,
        label: key,
        value: value,
      }));

      const formattedSpeciesData = Object.entries(speciesCount).map(([key, value]) => ({
        id: key,
        label: key,
        count: value,
        value: (value / totalPets) * 100,
        formattedValue: `${((value / totalPets) * 100).toFixed(2)}%`,
      }));

      const formattedAgeData = Object.entries(ageCounts).map(([age, count]) => ({
        id: `${age} years`,
        label: `${age} years`,
        value: count,
      }));

      setServAppData(formattedServAppData);
      setGenderData(formattedGenderData);
      setSpeciesData(formattedSpeciesData);
      setAgeData(formattedAgeData);
      setKeys(Array.from(allServiceTypes));
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Analytics</h1>

      {/* Clinic Services Bar Chart */}
      <div style={styles.chartContainer}>
        <h2 style={styles.chartTitle}>Most Clinic Services Availed</h2>
        <div style={styles.chartWrapper}>
          <ResponsiveBar
            data={servAppData}
            keys={keys}
            indexBy="clinicName"
            margin={{ top: 50, right: 130, bottom: 70, left: 70 }} // Increased left margin for y-axis labels
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={{ scheme: "pastel2" }}
            borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: window.innerWidth < 600 ? 45 : 0,
              legend: "Clinics",
              legendPosition: "middle",
              legendOffset: 50,
              format: (value) => value,
              tickValues: servAppData.map(d => d.clinicName),
              renderTick: ({ x, y, value, textAnchor, textBaseline, textX, textY }) => (
                <g transform={`translate(${x}, ${y}) rotate(${window.innerWidth < 600 ? 45 : 0})`}>
                  <text
                    x={textX}
                    y={textY}
                    textAnchor={textAnchor}
                    dominantBaseline={textBaseline}
                    style={{
                      fontSize: window.innerWidth < 600 ? "10px" : "12px",
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
              tickPadding: 10, // Increased padding for better spacing
              tickValues: window.innerWidth < 600 ? 5 : 8, // Fewer ticks on smaller screens
              legend: "Services Availed",
              legendPosition: "middle",
              legendOffset: -50, // Adjusted for increased left margin
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
            labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemOpacity: 0.85,
                symbolSize: 20,
              },
            ]}
          />
        </div>
      </div>

      {/* Flex Container for Other Charts */}
      <div style={styles.flexContainer}>
        {/* Age Distribution Pie Chart */}
        <div style={styles.chartContainer}>
          <h2 style={styles.chartTitle}>Age Distribution of Pets</h2>
          <div style={styles.chartWrapper}>
            <ResponsivePie
              data={ageData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              activeOuterRadiusOffset={8}
              colors={{ scheme: "pastel1" }}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
              enableArcLinkLabels={window.innerWidth > 600}
              arcLabel="id"
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
            />
          </div>
        </div>

        {/* Gender Distribution Bar Chart */}
        <div style={styles.chartContainer}>
          <h2 style={styles.chartTitle}>Pet Gender Distribution</h2>
          <div style={styles.chartWrapper}>
            <ResponsiveBar
              data={genderData}
              indexBy="id"
              margin={{ top: 20, right: 50, bottom: 50, left: 60 }}
              padding={0.5}
              layout="horizontal"
              valueScale={{ type: "linear" }}
              indexScale={{ type: "band", round: true }}
              colors={{ scheme: "paired" }}
              borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
              axisBottom={null}
              axisTop={null}
              axisRight={null}
              enableTotals={true}
              labelSkipWidth={12}
              labelSkipHeight={12}
            />
          </div>
        </div>

        {/* Species Distribution Pie Chart */}
        <div style={styles.chartContainer}>
          <h2 style={styles.chartTitle}>Pet Type Distribution</h2>
          <div style={styles.chartWrapper}>
            <ResponsivePie
              data={speciesData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={10}
              activeOuterRadiusOffset={8}
              colors={{ scheme: "red_purple" }}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
              arcLabel={(d) => d.data.formattedValue}
              tooltip={({ datum }) => (
                <div style={styles.tooltip}>
                  <strong>{datum.id}</strong>: {datum.data.count}
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles (unchanged from previous adjustments)
const styles = {
  container: {
    padding: "20px",
    width: "100%",
    boxSizing: "border-box",
  },
  title: {
    textAlign: "center",
    marginTop: "50px",
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
  },
  chartContainer: {
    width: "100%",
    marginBottom: "20px",
  },
  chartTitle: {
    textAlign: "center",
    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
    marginBottom: "10px",
    fontWeight: "600",
    color: "#333",
  },
  chartWrapper: {
    height: "clamp(250px, 40vh, 500px)",
    width: "100%",
  },
  flexContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "space-between",
  },
  tooltip: {
    padding: "12px 16px",
    color: "#333",
    background: "#fff",
    borderRadius: "2px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
  },
};

// Media query adjustments (unchanged)
const responsiveCSS = `
  @media (max-width: 768px) {
    .chart-container {
      width: 100% !important;
    }
    .flex-container > div {
      flex: 1 1 100%;
    }
    .chart-title {
      font-size: clamp(1rem, 2.5vw, 1.5rem) !important;
      margin-bottom: 8px !important;
    }
    .chart-wrapper {
      height: clamp(200px, 35vh, 400px) !important;
    }
  }

  @media (min-width: 769px) {
    .flex-container > div {
      flex: 1 1 calc(33% - 20px);
    }
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = responsiveCSS;
  document.head.appendChild(styleSheet);
}

export default AdminAnalytics;