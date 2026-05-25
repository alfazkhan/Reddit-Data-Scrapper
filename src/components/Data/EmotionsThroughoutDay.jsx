import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect } from "react";
import { Bar } from "react-chartjs-2";
// import faker from 'faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  plugins: {
    title: {
      display: true,
      text: "Chart.js Bar Chart - Stacked",
    },
  },
  responsive: true,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
};

export default function EmotionsThroughoutDay({ data: postsData }) {
  const sentimentCounts = {
    Positive: 0,
    Neutral: 0,
    Negative: 0,
  };

  if (postsData) {
    postsData.forEach((post) => {
      if (sentimentCounts[post.sentiment] !== undefined) {
        sentimentCounts[post.sentiment]++;
      }
    });
  }
  console.log(sentimentCounts);

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const labelsData = Object.values(sentimentCounts);
  const data = {
    labels,
    datasets: [
      {
        label: "Positive",
        data: labelsData,
        backgroundColor: "rgb(255, 99, 132)",
      },
      {
        label: "Neutral",
        data: labelsData,
        backgroundColor: "rgb(75, 192, 192)",
      },
      {
        label: "Negative",
        data: labelsData,
        backgroundColor: "rgb(53, 162, 235)",
      },
    ],
  };
  return <Bar options={options} data={data} />;
}
