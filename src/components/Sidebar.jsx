import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Settings, PenTool, Users, Wrench, Package, Store, BarChart2, HelpCircle, Brain, FileEdit, Cog, FileQuestion, UserCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const handleSetOpen = typeof setOpen === 'function' ? setOpen : () => {};

  const menuItems = [
    { icon: Home, text: 'Home', link: '/' },
    { icon: FileText, text: 'Content', link: '/content' },
    { icon: Settings, text: 'Structure', link: '/structure' },
    { icon: PenTool, text: 'Appearance', link: '/appearance' },
    { icon: Users, text: 'People', link: '/people' },
    { icon: Wrench, text: 'Utilities', link: '/utilities' },
    { icon: Package, text: 'Settings', link: '/settings' },
    { icon: Store, text: 'Plugin Store', link: '/plugin-store' },
    { icon: BarChart2, text: 'Reports', link: '/reports' },
    { icon: HelpCircle, text: 'Help', link: '/help' },
    { icon: Brain, text: 'Drupal.AI', link: '/drupal-ai' },
    { icon: FileEdit, text: 'Articles', link: '/articles' },
    { icon: FileQuestion, text: 'Docs', link: '/documentation' },
    { icon: UserCircle, text: 'Profile', link: '/profile' },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity z-20 md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => handleSetOpen(false)}
      ></div>
      <div className={`fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-white shadow-xl transition-all transform z-30 md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-2xl font-semibold text-blue-600">Drupal.js</span>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => handleSetOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className={`flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 ${location.pathname === item.link ? 'bg-gray-100' : ''}`}
              onClick={() => handleSetOpen(false)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.text}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
