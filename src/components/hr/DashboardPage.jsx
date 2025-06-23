// DashboardPage.jsx

import React, { useState } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { CChart } from "@coreui/react-chartjs";
import Sidebar from "../merchandiser/Sidebar.jsx";

const DashboardPage = ({ isSidebarOpen }) => {
  const chartTitles = ["Buyer", "Trend", "Supplier"];
  const initialWidth = window.innerWidth / 3.2;
  const initialHeight = window.innerHeight / 2.2;

  const [sizes, setSizes] = useState([
    { width: initialWidth, height: initialHeight },
    { width: initialWidth, height: initialHeight },
    { width: initialWidth, height: initialHeight },
  ]);

  const handleResize = (index, newWidth, newHeight) => {
    const newSizes = [...sizes];
    newSizes[index] = { width: newWidth, height: newHeight };
    setSizes(newSizes);
  };

  const staticChartData = [
    {
      labels: ["Buyer A", "Buyer B", "Buyer C"],
      datasets: [
        {
          data: [300, 500, 700],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        },
      ],
    },
    {
      labels: ["Jan", "Feb", "Mar", "Apr"],
      datasets: [
        {
          data: [65, 59, 80, 81],
          label: "Sales",
          borderColor: "#36A2EB",
          fill: false,
        },
      ],
    },
    {
      labels: ["Supplier X", "Supplier Y", "Supplier Z"],
      datasets: [
        {
          data: [200, 450, 600],
          backgroundColor: ["#4BC0C0", "#FF9F40", "#9966FF"],
        },
      ],
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

        
      }}
    >
      <Sidebar />
      <div
        style={{
          
          
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          flex: 1,
          padding: "2rem",
          backgroundColor: '#A7D5E1',
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontSize: "28px",
            color: "#333",
          }}
        >
          Dashboard Overview
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          {sizes.map((size, index) => (
            <ResizableBox
              key={index}
              width={size.width}
              height={size.height}
              axis="both"
              resizeHandles={["se"]}
              minConstraints={[250, 250]}
              maxConstraints={[600, 600]}
              onResizeStop={(e, { size: { width, height } }) =>
                handleResize(index, width, height)
              }
              style={{
                background: "#A7D5E1",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)",
                flex: "1 1 30%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  marginBottom: "12px",
                  fontSize: "18px",
                  color: "#444",
                  textAlign: "center",
                }}
              >
                {chartTitles[index]}
              </h3>
              <div style={{ flexGrow: 1 }}>
                <CChart
                  type={index === 0 ? "doughnut" : index === 1 ? "line" : "bar"}
                  data={staticChartData[index]}
                  options={{
                    
                    maintainAspectRatio: true,
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </ResizableBox>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
