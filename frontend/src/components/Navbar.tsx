import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Database, Eye, Target } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/data-analysis', label: 'Data Analysis', icon: Database },
    { path: '/preprocessing', label: 'Preprocessing Results', icon: BarChart3 },
    { path: '/visualization', label: 'Visualization', icon: Eye },
    { path: '/prediction', label: 'Prediction & Results', icon: Target },

  ];

  const isActive = (path: string) => location.pathname === path || (path === '/data-analysis' && location.pathname === '/');

  return (
    <nav className="bg-gray-900 text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-xl font-bold hover:text-blue-400 transition-colors duration-200">
              Insurance Claim Predictor
            </Link>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-700 ${
                  isActive(path) ? 'bg-blue-600 text-white' : 'text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;