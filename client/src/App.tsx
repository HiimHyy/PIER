import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
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
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
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

  // New state for maximum y-axis value
  const [maxYAxisValue, setMaxYAxisValue] = useState(50);
  const [maxXAxisValue, setMaxXAxisValue] = useState(20);

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
      <h1 className="text-center text-4xl font-bold text-gray-800 my-10">
        Temperature and Average Chart
      </h1>

      <div className="flex justify-center items-center space-x-4 mb-8">
        <label htmlFor="chartType" className="font-medium text-gray-700">
          Chart Type:{' '}
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger className="px-4 py-2 bg-blue-400 text-white rounded-md">
            Open
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mt-2 bg-white shadow-lg rounded-md">
            <DropdownMenuLabel className="font-medium text-gray-700 mb-2">
              Chart Type
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setChartType('line')}
              className="hover:bg-blue-100"
            >
              Line
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setChartType('bar')}
              className="hover:bg-blue-100"
            >
              Bar
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
          </DropdownMenuContent>
        </DropdownMenu>
        <label htmlFor="maxYAxisValue" className="font-medium text-gray-700">
          Max Y-Axis Value:{' '}
        </label>
        <input
          type="number"
          id="maxYAxisValue"
          value={maxYAxisValue}
          onChange={(e) => setMaxYAxisValue(Number(e.target.value))}
          className="border p-2 rounded-md"
        />

        <label htmlFor="maxYAxisValue" className="font-medium text-gray-700">
          Max X-Axis Value:{' '}
        </label>
        <input
          type="number"
          id="maxXAxisValue"
          value={maxXAxisValue}
          onChange={(e) => setMaxXAxisValue(Number(e.target.value))}
          className="border p-2 rounded-md"
        />
      </div>

      {chartType === 'line' ? (
        <Line
          data={chartData}
          options={{
            scales: {
              y: {
                max: maxYAxisValue,
              },
              x: {
                max: maxXAxisValue,
              },
            },
          }}
        />
      ) : (
        <Bar
          data={chartData}
          options={{
            scales: {
              y: {
                max: maxYAxisValue,
              },
              x: {
                max: maxXAxisValue,
              },
            },
          }}
        />
      )}
    </>
  );
}

export default App;
