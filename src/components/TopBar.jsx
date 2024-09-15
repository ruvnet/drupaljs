import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, FileText, User, Settings as SettingsIcon, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TopBar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-700 shadow-md z-10">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-white md:hidden ml-2">Drupal.js</h1>
        </div>
        <div className="flex items-center space-x-4">
          <TopBarLink to="/drupal-ai" icon={<Zap />} text="Drupal.AI" />
          <TopBarLink to="/content" icon={<FileText />} text="Articles" />
          <TopBarLink to="/settings" icon={<SettingsIcon />} text="Settings" />
          <TopBarLink to="/user" icon={<User />} text="User" />
        </div>
      </div>
    </header>
  );
};

const TopBarLink = ({ to, icon, text }) => (
  <Link to={to} className="text-white hover:text-gray-200 flex items-center">
    <span className="md:hidden">{icon}</span>
    <Button variant="ghost" className="hidden md:flex items-center text-white hover:text-gray-200">
      {icon}
      <span className="ml-2">{text}</span>
    </Button>
  </Link>
);

export default TopBar;