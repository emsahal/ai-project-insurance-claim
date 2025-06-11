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
import { Download, Loader, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PreprocessingData {
  missing_before: { [key: string]: number };
  missing_after: { [key: string]: number };
  target_before: {
    class_0: number;
    class_1: number;
  };
  target_after: {
    class_0: number;
    class_1: number;
  };
}

const PreprocessingResults: React.FC = () => {
  const [data, setData] = useState<PreprocessingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/preprocessing_results');
        setData(response.data);
      } catch (err: any) {
        if (err.code === 'ERR_NETWORK') {
          setError('Unable to connect to the backend. Make sure the Flask server is running on http://localhost:5000');
        } else {
          setError('Failed to fetch preprocessing results');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await axios.get('http://localhost:5000/download_preprocessed', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'X_train_preprocessed.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download preprocessed data. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading preprocessing results...</span>
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

  // Get top features with missing values for visualization
  const topMissingBefore = Object.entries(data.missing_before)
    .filter(([key, value]) => value > 0)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const missingValuesBefore = {
    labels: topMissingBefore.map(([key]) => key),
    datasets: [{
      label: 'Missing Values Before',
      data: topMissingBefore.map(([, value]) => value),
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      borderWidth: 1
    }]
  };

  const missingValuesAfter = {
    labels: topMissingBefore.map(([key]) => key),
    datasets: [{
      label: 'Missing Values After',
      data: topMissingBefore.map(([key]) => data.missing_after[key] || 0),
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      borderWidth: 1
    }]
  };

  const targetDistributionBefore = {
    labels: ['Class 0', 'Class 1'],
    datasets: [{
      label: 'Before Preprocessing',
      data: [data.target_before.class_0, data.target_before.class_1],
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      borderWidth: 1
    }]
  };

  const targetDistributionAfter = {
    labels: ['Class 0', 'Class 1'],
    datasets: [{
      label: 'After Preprocessing',
      data: [data.target_after.class_0, data.target_after.class_1],
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Calculate statistics
  const totalMissingBefore = Object.values(data.missing_before).reduce((sum, val) => sum + val, 0);
  const totalMissingAfter = Object.values(data.missing_after).reduce((sum, val) => sum + val, 0);
  const featuresWithMissing = Object.values(data.missing_before).filter(val => val > 0).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Preprocessing Results</h1>
        <p className="text-gray-600 mb-8">
          Results of data preprocessing including missing value imputation, feature encoding, and scaling transformations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Values Before */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Missing Values Before Imputation</h2>
          <div className="w-full h-80">
            <Bar data={missingValuesBefore} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  display: true,
                  text: 'Features with Missing Values (-1)'
                }
              }
            }} />
          </div>
        </div>

        {/* Missing Values After */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Missing Values After Imputation</h2>
          <div className="w-full h-80">
            <Bar data={missingValuesAfter} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  display: true,
                  text: 'All Missing Values Resolved'
                }
              }
            }} />
          </div>
        </div>

        {/* Target Distribution Before */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Target Distribution Before</h2>
          <div className="w-full h-80">
            <Bar data={targetDistributionBefore} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  display: true,
                  text: 'Original Target Distribution'
                }
              }
            }} />
          </div>
        </div>

        {/* Target Distribution After */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Target Distribution After</h2>
          <div className="w-full h-80">
            <Bar data={targetDistributionAfter} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  display: true,
                  text: 'Target Distribution After Preprocessing'
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Preprocessing Summary */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Preprocessing Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {totalMissingAfter === 0 ? '100%' : `${((1 - totalMissingAfter / totalMissingBefore) * 100).toFixed(1)}%`}
            </div>
            <div className="text-gray-600">Missing Values Resolved</div>
            <div className="text-sm text-gray-500 mt-1">
              {totalMissingBefore.toLocaleString()} → {totalMissingAfter.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{featuresWithMissing}</div>
            <div className="text-gray-600">Features Had Missing Values</div>
            <div className="text-sm text-gray-500 mt-1">Now all imputed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {Object.keys(data.missing_before).length - 2}
            </div>
            <div className="text-gray-600">Features Processed</div>
            <div className="text-sm text-gray-500 mt-1">Encoded & Scaled</div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Download Preprocessed Data</h2>
        <p className="text-gray-600 mb-4">
          Download the preprocessed training dataset for further analysis or model training.
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 flex items-center space-x-2"
        >
          {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{downloading ? 'Downloading...' : 'Download Preprocessed Data'}</span>
        </button>
      </div>
    </div>
  );
};

export default PreprocessingResults;