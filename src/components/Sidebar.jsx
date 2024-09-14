import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, Settings, Globe, Users, BarChart2, HelpCircle, Wrench, Package, Store } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="bg-white w-64 h-full shadow-lg">
      <div className="flex items-center justify-center h-16 border-b">
        <span className="text-2xl font-semibold text-blue-600">Drupal.js</span>
      </div>
      <nav className="mt-4">
        <Link to="/" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Home className="h-5 w-5 mr-3" />
          <span>Home</span>
        </Link>
        <Link to="/articles" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <FileText className="h-5 w-5 mr-3" />
          <span>Content</span>
        </Link>
        <Link to="/structure" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Settings className="h-5 w-5 mr-3" />
          <span>Structure</span>
        </Link>
        <Link to="/appearance" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Globe className="h-5 w-5 mr-3" />
          <span>Appearance</span>
        </Link>
        <Link to="/people" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Users className="h-5 w-5 mr-3" />
          <span>People</span>
        </Link>
        <Link to="/utilities" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Wrench className="h-5 w-5 mr-3" />
          <span>Utilities</span>
        </Link>
        <Link to="/settings" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Package className="h-5 w-5 mr-3" />
          <span>Settings</span>
        </Link>
        <Link to="/plugin-store" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <Store className="h-5 w-5 mr-3" />
          <span>Plugin Store</span>
        </Link>
        <Link to="/reports" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <BarChart2 className="h-5 w-5 mr-3" />
          <span>Reports</span>
        </Link>
        <Link to="/help" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100">
          <HelpCircle className="h-5 w-5 mr-3" />
          <span>Help</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
