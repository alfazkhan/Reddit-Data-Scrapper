// src/components/KeywordPieChart.jsx
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

// Register the specific Chart.js components needed for a Pie chart
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ keywordData, minCount, maxCount }) {
  const labelsData = [];
  const mapData = [];

  for (let i = 0; i < keywordData.length; i++) {
    if (keywordData[i].count <= maxCount && keywordData[i].count >= minCount) {
      labelsData.push(keywordData[i].word);
      mapData.push(keywordData[i].count);
    }
  }

  const chartData = {
    labels: labelsData,
    datasets: [
      {
        label: "Keyword Frequency",
        data: mapData,
        backgroundColor: [
          "#ff4500", // Reddit Orange
          "#ff5722",
          "#00d1b2", // Success Green
          "#3273dc", // Info Blue
          "#f5f5f5",
          "#71767b",
          "#9b59b6",
          "#f1c40f",
          "#e67e22",
          "#1abc9c",
        ],
        borderColor: "#1a1d23", // Matches your card-bg
        borderWidth: 2,
      },
    ],
  };

  // 2. Chart Options (Styling the Legend and Tooltips)
  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#e4e6eb", // Matches your text-main
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "#24282e",
        titleColor: "#ff4500",
        bodyColor: "#e4e6eb",
        borderColor: "#2c313c",
        borderWidth: 1,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: "400px", position: "relative" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
