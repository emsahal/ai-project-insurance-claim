import React, { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

// Define interfaces for different feature types
interface SelectFeature {
  name: string;
  type: 'select';
  options: number[];
  category: string;
}

interface NumberFeature {
  name: string;
  type: 'number';
  min: number;
  max: number;
  step?: number;
  category: string;
}

// Union type for features
type Feature = SelectFeature | NumberFeature;

const PredictionPage: React.FC = () => {
  const [formData, setFormData] = useState<{ [key: string]: number }>({});
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Feature definitions with their types for form generation (57 features)
  const features: Feature[] = [
    // Individual features
    { name: 'ps_ind_01', type: 'number', min: 0, max: 7, category: 'Individual' },
    { name: 'ps_ind_02_cat', type: 'select', options: [1, 2, 3, 4], category: 'Individual' },
    { name: 'ps_ind_03', type: 'number', min: 0, max: 11, category: 'Individual' },
    { name: 'ps_ind_04_cat', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_05_cat', type: 'select', options: [0, 1, 2, 3, 4, 5, 6], category: 'Individual' },
    { name: 'ps_ind_06_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_07_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_08_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_09_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_10_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_11_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_12_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_13_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_14', type: 'number', min: 0, max: 4, category: 'Individual' },
    { name: 'ps_ind_15', type: 'number', min: 0, max: 13, category: 'Individual' },
    { name: 'ps_ind_16_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_17_bin', type: 'select', options: [0, 1], category: 'Individual' },
    { name: 'ps_ind_18_bin', type: 'select', options: [0, 1], category: 'Individual' },
    
    // Regional features
    { name: 'ps_reg_01', type: 'number', min: 0, max: 0.9, step: 0.1, category: 'Regional' },
    { name: 'ps_reg_02', type: 'number', min: 0, max: 1.8, step: 0.1, category: 'Regional' },
    { name: 'ps_reg_03', type: 'number', min: 0, max: 4.0, step: 0.1, category: 'Regional' },
    
    // Car features
    { name: 'ps_car_01_cat', type: 'select', options: Array.from({ length: 12 }, (_, i) => i), category: 'Car' },
    { name: 'ps_car_02_cat', type: 'select', options: [0, 1], category: 'Car' },
    { name: 'ps_car_03_cat', type: 'select', options: [-1, 0, 1], category: 'Car' },
    { name: 'ps_car_04_cat', type: 'select', options: Array.from({ length: 10 }, (_, i) => i), category: 'Car' },
    { name: 'ps_car_05_cat', type: 'select', options: [-1, 0, 1], category: 'Car' },
    { name: 'ps_car_06_cat', type: 'select', options: Array.from({ length: 18 }, (_, i) => i), category: 'Car' },
    { name: 'ps_car_07_cat', type: 'select', options: [-1, 0, 1], category: 'Car' },
    { name: 'ps_car_08_cat', type: 'select', options: [0, 1], category: 'Car' },
    { name: 'ps_car_09_cat', type: 'select', options: [0, 1, 2, 3, 4], category: 'Car' },
    { name: 'ps_car_10_cat', type: 'select', options: [0, 1, 2], category: 'Car' },
    { name: 'ps_car_11_cat', type: 'select', options: Array.from({ length: 104 }, (_, i) => i), category: 'Car' },
    { name: 'ps_car_11', type: 'number', min: -1, max: 3, category: 'Car' },
    { name: 'ps_car_12', type: 'number', min: 0, max: 1.0, step: 0.01, category: 'Car' },
    { name: 'ps_car_13', type: 'number', min: 0, max: 3.0, step: 0.01, category: 'Car' },
    { name: 'ps_car_14', type: 'number', min: 0, max: 1.0, step: 0.01, category: 'Car' },
    { name: 'ps_car_15', type: 'number', min: 0, max: 3.7, step: 0.01, category: 'Car' },
    
    // Calculated features
    { name: 'ps_calc_01', type: 'number', min: 0, max: 0.9, step: 0.1, category: 'Calculated' },
    { name: 'ps_calc_02', type: 'number', min: 0, max: 0.9, step: 0.1, category: 'Calculated' },
    { name: 'ps_calc_03', type: 'number', min: 0, max: 0.9, step: 0.1, category: 'Calculated' },
    { name: 'ps_calc_04', type: 'number', min: 0, max: 5, category: 'Calculated' },
    { name: 'ps_calc_05', type: 'number', min: 0, max: 6, category: 'Calculated' },
    { name: 'ps_calc_06', type: 'number', min: 0, max: 10, category: 'Calculated' },
    { name: 'ps_calc_07', type: 'number', min: 0, max: 9, category: 'Calculated' },
    { name: 'ps_calc_08', type: 'number', min: 0, max: 10, category: 'Calculated' },
    { name: 'ps_calc_09', type: 'number', min: 0, max: 7, category: 'Calculated' },
    { name: 'ps_calc_10', type: 'number', min: 0, max: 25, category: 'Calculated' },
    { name: 'ps_calc_11', type: 'number', min: 0, max: 19, category: 'Calculated' },
    { name: 'ps_calc_12', type: 'number', min: 0, max: 10, category: 'Calculated' },
    { name: 'ps_calc_13', type: 'number', min: 0, max: 13, category: 'Calculated' },
    { name: 'ps_calc_14', type: 'number', min: 0, max: 23, category: 'Calculated' },
    { name: 'ps_calc_15_bin', type: 'select', options: [0, 1], category: 'Calculated' },
    { name: 'ps_calc_16_bin', type: 'select', options: [0, 1], category: 'Calculated' },
    { name: 'ps_calc_17_bin', type: 'select', options: [0, 1], category: 'Calculated' },
    { name: 'ps_calc_18_bin', type: 'select', options: [0, 1], category: 'Calculated' },
    { name: 'ps_calc_19_bin', type: 'select', options: [0, 1], category: 'Calculated' },
    { name: 'ps_calc_20_bin', type: 'select', options: [0, 1], category: 'Calculated' },
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/model_metrics');
        setMetrics(response.data);
      } catch (err) {
        console.error('Failed to fetch model metrics:', err);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate that all required fields are filled
      if (Object.keys(formData).length < features.length) {
        throw new Error('Please fill in all fields before making a prediction');
      }

      const response = await axios.post('http://localhost:5000/predict', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setPrediction(response.data.Prediction);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the backend. Make sure the Flask server is running on http://localhost:5000');
      } else {
        setError(err.response?.data?.error || err.message || 'An error occurred while making the prediction');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    const sampleData: { [key: string]: number } = {};
    features.forEach(feature => {
      if (feature.type === 'select') {
        // TypeScript now knows `options` exists for `select` type
        sampleData[feature.name] = feature.options[Math.floor(Math.random() * feature.options.length)];
      } else {
        const min = feature.min || 0;
        const max = feature.max || 1;
        sampleData[feature.name] = parseFloat((Math.random() * (max - min) + min).toFixed(2));
      }
    });
    setFormData(sampleData);
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as { [key: string]: Feature[] });

  // Model performance chart
  const modelMetrics = metrics ? {
    labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
    datasets: [{
      label: 'Model Performance',
      data: [metrics.accuracy, metrics.precision, metrics.recall, metrics.f1_score],
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      borderWidth: 1
    }]
  } : null;

  const metricsTable = metrics ? [
    { metric: 'Accuracy', value: metrics.accuracy },
    { metric: 'Precision', value: metrics.precision },
    { metric: 'Recall', value: metrics.recall },
    { metric: 'F1-Score', value: metrics.f1_score }
  ] : [];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Random Forest Model Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Prediction & Results</h1>
        <p className="text-gray-600 mb-8">
          Enter customer information to predict insurance claim likelihood using our Random Forest model.
        </p>
      </div>

      {/* Sample Data Button */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Customer Information</h2>
          <button
            onClick={fillSampleData}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            Fill Sample Data
          </button>
        </div>

        {/* Feature Input Form */}
        <form className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category} className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">{category} Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categoryFeatures.map(feature => (
                  <div key={feature.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {feature.name}
                    </label>
                    {feature.type === 'select' ? (
                      <select
                        value={formData[feature.name] || ''}
                        onChange={(e) => handleInputChange(feature.name, e.target.value)}
                        className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        {/* TypeScript now knows `options` exists for `select` type */}
                        {feature.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min={feature.min}
                        max={feature.max}
                        step={feature.step || 1}
                        value={formData[feature.name] || ''}
                        onChange={(e) => handleInputChange(feature.name, e.target.value)}
                        className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder={`${feature.min || 0} - ${feature.max || 1}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </form>

        {/* Predict Button */}
        <div className="mt-6">
          <button
            onClick={handlePredict}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 flex items-center space-x-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>{loading ? 'Predicting...' : 'Predict Claim Risk'}</span>
          </button>
        </div>
      </div>

      {/* Prediction Result */}
      {(prediction || error) && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Prediction Result</h2>
          {error ? (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-lg font-semibold">{error}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {prediction === 'High Risk' ? (
                <AlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <span className={`text-lg font-semibold ${
                prediction === 'High Risk' ? 'text-red-600' : 'text-green-600'
              }`}>
                Prediction: {prediction}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Model Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Model Performance</h2>
          {metricsLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : modelMetrics ? (
            <div className="w-full h-80">
              <Bar data={modelMetrics} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              Unable to load model metrics
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Metrics</h2>
          {metricsLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-semibold text-gray-700">Metric</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsTable.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{row.metric}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                            {row.value.toFixed(4)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Model trained with Random Forest algorithm.</p>
                <p>Metrics calculated on training data.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;