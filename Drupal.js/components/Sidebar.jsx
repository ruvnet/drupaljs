import React from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, Settings, Globe, Users, BarChart2, HelpCircle, Wrench, Package, Store, X, Database, Bot, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const menuItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: FileText, label: 'Content', path: '/content' },
  { icon: Settings, label: 'Structure', path: '/structure' },
  { icon: Globe, label: 'Appearance', path: '/appearance' },
  { icon: Users, label: 'People', path: '/people' },
  { icon: Wrench, label: 'Utilities', path: '/utilities' },
  { icon: Package, label: 'Settings', path: '/settings' },
  { icon: Store, label: 'Plugin Store', path: '/plugin-store' },
  { icon: BarChart2, label: 'Reports', path: '/reports' },
  { icon: HelpCircle, label: 'Help', path: '/help' },
];

const advancedItems = [
  { icon: Database, label: 'Metadata', path: '/metadata' },
  { icon: Bot, label: 'AI Content Generation', path: '/ai-content' },
  { icon: Palette, label: 'Template & CSS Editor', path: '/template-editor' },
];

const MenuItem = ({ icon: Icon, label, path, onClick }) => (
  <Link to={path} className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100" onClick={onClick}>
    <Icon className="h-5 w-5 mr-3" />
    <span>{label}</span>
  </Link>
);

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
          {menuItems.map((item, index) => (
            <MenuItem key={index} {...item} onClick={() => setOpen(false)} />
          ))}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger className="px-6 py-2 text-gray-700 hover:bg-gray-100">Advanced Options</AccordionTrigger>
              <AccordionContent>
                {advancedItems.map((item, index) => (
                  <MenuItem key={index} {...item} onClick={() => setOpen(false)} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
