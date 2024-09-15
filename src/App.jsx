import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import ArticleEdit from './pages/ArticleEdit';
import Articles from './pages/Articles';
import Home from './pages/Home';
import Structure from './pages/Structure';
import ContentTypes from './pages/ContentTypes';
import Taxonomy from './pages/Taxonomy';
import Menus from './pages/Menus';
import Appearance from './pages/Appearance';
import Themes from './pages/Themes';
import Blocks from './pages/Blocks';
import CustomCSS from './pages/CustomCSS';
import People from './pages/People';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import Utilities from './pages/Utilities';
import Cache from './pages/Cache';
import Backup from './pages/Backup';
import Database from './pages/Database';
import Settings from './pages/Settings';
import SiteInfo from './pages/SiteInfo';
import Performance from './pages/Performance';
import FileSystem from './pages/FileSystem';
import Deployment from './pages/Deployment';
import PluginStore from './pages/PluginStore';
import Reports from './pages/Reports';
import SiteStatus from './pages/SiteStatus';
import Logs from './pages/Logs';
import Analytics from './pages/Analytics';
import Help from './pages/Help';
import NewContent from './pages/NewContent';
import { Menu } from 'lucide-react';
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
                <h1 className="text-lg font-semibold text-gray-900">Drupal.js</h1>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/Drupal.js" element={<Home />} />
                  <Route path="/Drupal.js/content" element={<Articles />} />
                  <Route path="/Drupal.js/content/new" element={<NewContent />} />
                  <Route path="/Drupal.js/content/edit/:id" element={<ArticleEdit />} />
                  <Route path="/Drupal.js/structure" element={<Structure />} />
                  <Route path="/Drupal.js/structure/content-types" element={<ContentTypes />} />
                  <Route path="/Drupal.js/structure/taxonomy" element={<Taxonomy />} />
                  <Route path="/Drupal.js/structure/menus" element={<Menus />} />
                  <Route path="/Drupal.js/appearance" element={<Appearance />} />
                  <Route path="/Drupal.js/appearance/themes" element={<Themes />} />
                  <Route path="/Drupal.js/appearance/blocks" element={<Blocks />} />
                  <Route path="/Drupal.js/appearance/custom-css" element={<CustomCSS />} />
                  <Route path="/Drupal.js/people" element={<People />} />
                  <Route path="/Drupal.js/people/users" element={<Users />} />
                  <Route path="/Drupal.js/people/roles" element={<Roles />} />
                  <Route path="/Drupal.js/people/permissions" element={<Permissions />} />
                  <Route path="/Drupal.js/utilities" element={<Utilities />} />
                  <Route path="/Drupal.js/utilities/cache" element={<Cache />} />
                  <Route path="/Drupal.js/utilities/backup" element={<Backup />} />
                  <Route path="/Drupal.js/utilities/database" element={<Database />} />
                  <Route path="/Drupal.js/settings" element={<Settings />} />
                  <Route path="/Drupal.js/settings/site-info" element={<SiteInfo />} />
                  <Route path="/Drupal.js/settings/performance" element={<Performance />} />
                  <Route path="/Drupal.js/settings/file-system" element={<FileSystem />} />
                  <Route path="/Drupal.js/settings/deployment" element={<Deployment />} />
                  <Route path="/Drupal.js/plugin-store" element={<PluginStore />} />
                  <Route path="/Drupal.js/reports" element={<Reports />} />
                  <Route path="/Drupal.js/reports/site-status" element={<SiteStatus />} />
                  <Route path="/Drupal.js/reports/logs" element={<Logs />} />
                  <Route path="/Drupal.js/reports/analytics" element={<Analytics />} />
                  <Route path="/Drupal.js/help" element={<Help />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
