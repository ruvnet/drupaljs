import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, Settings, Globe, Users, BarChart2, HelpCircle, Wrench, Package, Store } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="bg-white shadow-md w-full md:w-64 md:flex-shrink-0 md:flex md:flex-col">
      <div className="flex items-center justify-center h-16 bg-blue-600">
        <span className="text-2xl font-semibold text-white">Drupal.js</span>
      </div>
      <nav className="flex-grow md:block px-4 pb-4 md:pb-0 md:overflow-y-auto">
        <Link to="/" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Home className="h-5 w-5 mr-3" />
          <span>Home</span>
        </Link>
        <Link to="/content" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <FileText className="h-5 w-5 mr-3" />
          <span>Content</span>
        </Link>
        <Link to="/structure" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Settings className="h-5 w-5 mr-3" />
          <span>Structure</span>
        </Link>
        <Link to="/appearance" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Globe className="h-5 w-5 mr-3" />
          <span>Appearance</span>
        </Link>
        <Link to="/people" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Users className="h-5 w-5 mr-3" />
          <span>People</span>
        </Link>
        <Link to="/utilities" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Wrench className="h-5 w-5 mr-3" />
          <span>Utilities</span>
        </Link>
        <Link to="/settings" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Package className="h-5 w-5 mr-3" />
          <span>Settings</span>
        </Link>
        <Link to="/plugin-store" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <Store className="h-5 w-5 mr-3" />
          <span>Plugin Store</span>
        </Link>
        <Link to="/reports" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <BarChart2 className="h-5 w-5 mr-3" />
          <span>Reports</span>
        </Link>
        <Link to="/help" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-200">
          <HelpCircle className="h-5 w-5 mr-3" />
          <span>Help</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
