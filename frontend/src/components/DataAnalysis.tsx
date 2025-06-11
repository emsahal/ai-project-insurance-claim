import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Loader, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DataSummary {
  rows: number;
  columns: number;
  target_distribution: {
    class_0: number;
    class_1: number;
  };
  missing_values: { [key: string]: number };
  sample_rows: Array<{ [key: string]: any }>;
}

const DataAnalysis: React.FC = () => {
  const [data, setData] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/data_summary');
        setData(response.data);
      } catch (err: any) {
        if (err.code === 'ERR_NETWORK') {
          setError('Unable to connect to the backend. Make sure the Flask server is running on http://localhost:5000');
        } else {
          setError('Failed to fetch data summary');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading data analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const targetDistribution = {
    labels: ['Class 0 (No Claim)', 'Class 1 (Claim)'],
    datasets: [{
      label: 'Target Distribution',
      data: [data.target_distribution.class_0, data.target_distribution.class_1],
      backgroundColor: ['#3B82F6', '#EF4444'],
      borderColor: ['#3B82F6', '#EF4444'],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Target Distribution (Claims vs No Claims)'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Get features with missing values (excluding 'id' and 'target')
  const missingValuesFiltered = Object.entries(data.missing_values)
    .filter(([key, value]) => key !== 'id' && key !== 'target' && value > 0)
    .slice(0, 10); // Show top 10 for display

  // Calculate feature type breakdown
  const binaryFeatures = Object.keys(data.missing_values).filter(key => key.includes('_bin')).length;
  const categoricalFeatures = Object.keys(data.missing_values).filter(key => key.includes('_cat')).length;
  const continuousFeatures = data.columns - binaryFeatures - categoricalFeatures - 2; // -2 for id and target

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Data Analysis</h1>
        <p className="text-gray-600 mb-8">
          Comprehensive analysis of the Porto Seguro dataset used for insurance claim prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Statistics */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dataset Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Rows:</span>
              <span className="font-semibold text-blue-600">{data.rows.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Columns:</span>
              <span className="font-semibold text-blue-600">{data.columns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Binary Features:</span>
              <span className="font-semibold text-green-600">{binaryFeatures}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Categorical Features:</span>
              <span className="font-semibold text-yellow-600">{categoricalFeatures}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Continuous Features:</span>
              <span className="font-semibold text-purple-600">{continuousFeatures}</span>
            </div>
          </div>
        </div>

        {/* Missing Values */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Missing Values (-1 counts)</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {missingValuesFiltered.length > 0 ? (
              missingValuesFiltered.map(([feature, count]) => (
                <div key={feature} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-mono">{feature}:</span>
                  <span className="font-semibold text-red-600">{count.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No missing values found</div>
            )}
          </div>
        </div>
      </div>

      {/* Target Distribution Chart */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Target Distribution</h2>
        <div className="w-full h-96">
          <Bar data={targetDistribution} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {((data.target_distribution.class_0 / (data.target_distribution.class_0 + data.target_distribution.class_1)) * 100).toFixed(1)}%
            </div>
            <div className="text-gray-600">No Claims (Class 0)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {((data.target_distribution.class_1 / (data.target_distribution.class_0 + data.target_distribution.class_1)) * 100).toFixed(1)}%
            </div>
            <div className="text-gray-600">Claims (Class 1)</div>
          </div>
        </div>
      </div>

      {/* Sample Data Table */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sample Data (First 5 Rows)</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {data.sample_rows.length > 0 && Object.keys(data.sample_rows[0]).slice(0, 9).map((key) => (
                  <th key={key} className="text-left p-3 font-semibold text-gray-700">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sample_rows.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  {Object.entries(row).slice(0, 9).map(([key, value], cellIndex) => (
                    <td key={cellIndex} className={`p-3 ${key === 'target' ? 
                      'text-center' : value === -1 ? 'text-red-600' : ''}`}>
                      {key === 'target' ? (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          value ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {value}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;