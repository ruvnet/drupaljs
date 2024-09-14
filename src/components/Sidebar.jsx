import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, Settings, Globe, Users, BarChart2, HelpCircle, Wrench, Package, Store, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Sidebar = ({ open, setOpen }) => {
  return (
    <>
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity z-20 md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
      <div className={`fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-white shadow-xl transition-all transform z-30 md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-2xl font-semibold text-blue-600">Drupal.js</span>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <Link to="/" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Home className="h-5 w-5 mr-3" />
            <span>Home</span>
          </Link>
          <Link to="/content" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <FileText className="h-5 w-5 mr-3" />
            <span>Content</span>
          </Link>
          <Link to="/structure" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Settings className="h-5 w-5 mr-3" />
            <span>Structure</span>
          </Link>
          <Link to="/appearance" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Globe className="h-5 w-5 mr-3" />
            <span>Appearance</span>
          </Link>
          <Link to="/people" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Users className="h-5 w-5 mr-3" />
            <span>People</span>
          </Link>
          <Link to="/utilities" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Wrench className="h-5 w-5 mr-3" />
            <span>Utilities</span>
          </Link>
          <Link to="/settings" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Package className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </Link>
          <Link to="/plugin-store" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <Store className="h-5 w-5 mr-3" />
            <span>Plugin Store</span>
          </Link>
          <Link to="/reports" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <BarChart2 className="h-5 w-5 mr-3" />
            <span>Reports</span>
          </Link>
          <Link to="/help" className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}>
            <HelpCircle className="h-5 w-5 mr-3" />
            <span>Help</span>
          </Link>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
