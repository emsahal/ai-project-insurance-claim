import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Loader, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface VisualizationData {
  target_distribution: {
    class_0: number;
    class_1: number;
  };
  feature_importance: { [key: string]: number };
  continuous_distribution: {
    ps_reg_03: number[];
  };
}

const VisualizationPage: React.FC = () => {
  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/visualizations');
        setData(response.data);
      } catch (err: any) {
        if (err.code === 'ERR_NETWORK') {
          setError('Unable to connect to the backend. Make sure the Flask server is running on http://localhost:5000');
        } else {
          setError('Failed to fetch visualization data');
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
          <span className="text-gray-600">Loading visualizations...</span>
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
      label: 'Count',
      data: [data.target_distribution.class_0, data.target_distribution.class_1],
      backgroundColor: ['#3B82F6', '#EF4444'],
      borderColor: ['#3B82F6', '#EF4444'],
      borderWidth: 1
    }]
  };

  const featureImportance = {
    labels: Object.keys(data.feature_importance),
    datasets: [{
      label: 'Feature Importance',
      data: Object.values(data.feature_importance),
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      borderWidth: 1
    }]
  };

  const createHistogram = (values: number[], bins: number = 20) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    const binCounts = new Array(bins).fill(0);
    const binLabels = [];

    for (let i = 0; i < bins; i++) {
      binLabels.push((min + i * binWidth).toFixed(2));
    }

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      binCounts[binIndex]++;
    });

    return { labels: binLabels, counts: binCounts };
  };

  const histogramData = createHistogram(data.continuous_distribution.ps_reg_03);

  const featureDistribution = {
    labels: histogramData.labels,
    datasets: [{
      label: 'ps_reg_03 Distribution',
      data: histogramData.counts,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true
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

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Feature Value Distribution'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const totalSamples = data.target_distribution.class_0 + data.target_distribution.class_1;
  const class0Percentage = ((data.target_distribution.class_0 / totalSamples) * 100).toFixed(1);
  const class1Percentage = ((data.target_distribution.class_1 / totalSamples) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Visualizations</h1>
        <p className="text-gray-600 mb-8">
          Comprehensive visualizations of dataset characteristics, feature importance, and distribution patterns.
        </p>
      </div>

    
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Target Distribution</h2>
        <div className="w-full h-96">
          <Bar data={targetDistribution} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                display: true,
                text: 'Distribution of Insurance Claims'
              }
            }
          }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{class0Percentage}%</div>
            <div className="text-gray-600">No Claims (Class 0)</div>
            <div className="text-sm text-gray-500">{data.target_distribution.class_0.toLocaleString()} samples</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{class1Percentage}%</div>
            <div className="text-gray-600">Claims (Class 1)</div>
            <div className="text-sm text-gray-500">{data.target_distribution.class_1.toLocaleString()} samples</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Feature Importance (Top 5)</h2>
          <div className="w-full h-80">
            <Bar data={featureImportance} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  display: true,
                  text: 'Random Forest Feature Importance'
                }
              }
            }} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Top features contributing to claim prediction based on Random Forest model analysis.
            </p>
            <div className="mt-2 space-y-1">
              {Object.entries(data.feature_importance).map(([feature, importance]) => (
                <div key={feature} className="flex justify-between text-xs">
                  <span className="font-mono text-gray-600">{feature}</span>
                  <span className="font-semibold text-blue-600">{(importance * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Feature Distribution</h2>
          <div className="w-full h-80">
            <Line data={featureDistribution} options={lineChartOptions} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Distribution of ps_reg_03 feature values across the dataset showing typical insurance customer patterns.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Sample size: {data.continuous_distribution.ps_reg_03.length.toLocaleString()} values
            </div>
          </div>
        </div>
      </div>


      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">{totalSamples.toLocaleString()}</div>
            <div className="text-gray-700 font-medium">Total Records</div>
            <div className="text-sm text-gray-600 mt-1">Large dataset for training</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">{Object.keys(data.feature_importance).length}</div>
            <div className="text-gray-700 font-medium">Top Features</div>
            <div className="text-sm text-gray-600 mt-1">High predictive power</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-2">{class1Percentage}%</div>
            <div className="text-gray-700 font-medium">Positive Rate</div>
            <div className="text-sm text-gray-600 mt-1">Imbalanced classes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {(Math.max(...Object.values(data.feature_importance)) * 100).toFixed(1)}%
            </div>
            <div className="text-gray-700 font-medium">Max Importance</div>
            <div className="text-sm text-gray-600 mt-1">Most predictive feature</div>
          </div>
        </div>
      </div>


      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Feature Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-800">Individual Features (ind)</h3>
            <p className="text-gray-600 text-sm mt-1">Personal characteristics and demographics</p>
            <div className="text-sm text-blue-600 mt-2">
              {Object.keys(data.feature_importance).filter(f => f.includes('_ind_')).length} in top features
            </div>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-800">Car Features (car)</h3>
            <p className="text-gray-600 text-sm mt-1">Vehicle-related information</p>
            <div className="text-sm text-green-600 mt-2">
              {Object.keys(data.feature_importance).filter(f => f.includes('_car_')).length} in top features
            </div>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-gray-800">Regional Features (reg)</h3>
            <p className="text-gray-600 text-sm mt-1">Geographic and regional data</p>
            <div className="text-sm text-yellow-600 mt-2">
              {Object.keys(data.feature_importance).filter(f => f.includes('_reg_')).length} in top features
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;