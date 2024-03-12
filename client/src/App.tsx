import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TemperatureRecord {
  timestamp: string;
  temperature: number;
  average: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

function App() {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [
      {
        label: 'Temperature',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Average',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  });

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const fetchTemperatureData = async () => {
    try {
      const response = await fetch('http://localhost:3000/temperature');
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const records: TemperatureRecord[] = await response.json();

      const newLabels = records.map((record) => formatDate(record.timestamp));
      const newTemperatureData = records.map((record) => record.temperature);
      const newAverageData = records.map((record) => record.average);

      setChartData({
        labels: newLabels,
        datasets: [
          { ...chartData.datasets[0], data: newTemperatureData },
          { ...chartData.datasets[1], data: newAverageData },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch temperature data:', error);
    }
  };

  useEffect(() => {
    fetchTemperatureData();
    const interval = setInterval(fetchTemperatureData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1 className="text-center text-3xl font-semibold text-gray-800 my-8">
        Temperature and Average Chart
      </h1>
      <Line data={chartData} />
    </>
  );
}

export default App;
