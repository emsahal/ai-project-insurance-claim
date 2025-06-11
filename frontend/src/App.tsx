import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DataAnalysis from './components/DataAnalysis';
import PreprocessingResults from './components/PreprocessingResults';
import VisualizationPage from './components/VisualizationPage';
import PredictionPage from './components/PredictionPage';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DataAnalysis />} />
            <Route path="/data-analysis" element={<DataAnalysis />} />
            <Route path="/preprocessing" element={<PreprocessingResults />} />
            <Route path="/visualization" element={<VisualizationPage />} />
            <Route path="/prediction" element={<PredictionPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;