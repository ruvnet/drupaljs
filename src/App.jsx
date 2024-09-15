import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Articles from './pages/Articles';
import ArticleEdit from './pages/ArticleEdit';
import Blocks from './pages/Blocks';
import Cache from './pages/Cache';
import ContentTypes from './pages/ContentTypes';
import CustomCSS from './pages/CustomCSS';
import Database from './pages/Database';
import Deployment from './pages/Deployment';
import FileSystem from './pages/FileSystem';
import Help from './pages/Help';
import Documentation from './pages/Documentation';
import Languages from './pages/Languages';
import Logs from './pages/Logs';
import Menus from './pages/Menus';
import NewContent from './pages/NewContent';
import People from './pages/People';
import Performance from './pages/Performance';
import Permissions from './pages/Permissions';
import PluginStore from './pages/PluginStore';
import Reports from './pages/Reports';
import Roles from './pages/Roles';
import Settings from './pages/Settings';
import Structure from './pages/Structure';
import Taxonomy from './pages/Taxonomy';
import Themes from './pages/Themes';
import Users from './pages/Users';
import Views from './pages/Views';
import Workflows from './pages/Workflows';
import { Menu, User, FileText as Document } from 'lucide-react';
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <div className="flex h-screen bg-gray-100">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white shadow-sm z-10">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900 md:hidden">Drupal.js</h1>
                <div className="flex items-center space-x-4">
                  <Link to="/content" className="text-gray-700 hover:text-gray-900">
                    Articles
                  </Link>
                  <Link to="/settings" className="text-gray-700 hover:text-gray-900">
                    Settings
                  </Link>
                  <Link to="/documentation" className="text-gray-700 hover:text-gray-900">
                    <Document className="h-6 w-6" />
                  </Link>
                  <Link to="/user" className="text-gray-700 hover:text-gray-900">
                    <User className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/content" element={<Articles />} />
                <Route path="/content/edit/:id" element={<ArticleEdit />} />
                <Route path="/structure" element={<Structure />} />
                <Route path="/appearance" element={<Themes />} />
                <Route path="/people" element={<People />} />
                <Route path="/modules" element={<PluginStore />} />
                <Route path="/configuration" element={<Settings />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/help" element={<Help />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/blocks" element={<Blocks />} />
                <Route path="/cache" element={<Cache />} />
                <Route path="/content-types" element={<ContentTypes />} />
                <Route path="/custom-css" element={<CustomCSS />} />
                <Route path="/database" element={<Database />} />
                <Route path="/deployment" element={<Deployment />} />
                <Route path="/file-system" element={<FileSystem />} />
                <Route path="/languages" element={<Languages />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/menus" element={<Menus />} />
                <Route path="/new-content" element={<NewContent />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/permissions" element={<Permissions />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/taxonomy" element={<Taxonomy />} />
                <Route path="/users" element={<Users />} />
                <Route path="/views" element={<Views />} />
                <Route path="/workflows" element={<Workflows />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
