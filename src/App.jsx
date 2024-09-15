import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
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
import BlockLayout from './pages/BlockLayout';
import Views from './pages/Views';
import MediaTypes from './pages/MediaTypes';
import EntityTypes from './pages/EntityTypes';
import Workflows from './pages/Workflows';
import Webforms from './pages/Webforms';
import UrlAliases from './pages/UrlAliases';
import Languages from './pages/Languages';
import ConfigSync from './pages/ConfigSync';
import RestResources from './pages/RestResources';
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
import Documentation from './pages/Documentation';
import { Menu, FileText, User } from 'lucide-react';
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
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                  <h1 className="text-lg font-semibold text-gray-900 md:hidden ml-2">Drupal.js</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <Link to="/content" className="text-gray-700 hover:text-gray-900">
                    Articles
                  </Link>
                  <Link to="/settings" className="text-gray-700 hover:text-gray-900">
                    Settings
                  </Link>
                  <Link to="/documentation" className="text-gray-700 hover:text-gray-900">
                    <FileText className="h-6 w-6" />
                  </Link>
                  <Link to="/user" className="text-gray-700 hover:text-gray-900">
                    <User className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/content" element={<Articles />} />
                  <Route path="/content/new" element={<NewContent />} />
                  <Route path="/content/edit/:id" element={<ArticleEdit />} />
                  <Route path="/structure" element={<Structure />} />
                  <Route path="/structure/content-types" element={<ContentTypes />} />
                  <Route path="/structure/taxonomy" element={<Taxonomy />} />
                  <Route path="/structure/menus" element={<Menus />} />
                  <Route path="/structure/block-layout" element={<BlockLayout />} />
                  <Route path="/structure/views" element={<Views />} />
                  <Route path="/structure/media-types" element={<MediaTypes />} />
                  <Route path="/structure/entity-types" element={<EntityTypes />} />
                  <Route path="/structure/workflows" element={<Workflows />} />
                  <Route path="/structure/webforms" element={<Webforms />} />
                  <Route path="/structure/url-aliases" element={<UrlAliases />} />
                  <Route path="/structure/languages" element={<Languages />} />
                  <Route path="/structure/config-sync" element={<ConfigSync />} />
                  <Route path="/structure/rest-resources" element={<RestResources />} />
                  <Route path="/appearance" element={<Appearance />} />
                  <Route path="/appearance/themes" element={<Themes />} />
                  <Route path="/appearance/blocks" element={<Blocks />} />
                  <Route path="/appearance/custom-css" element={<CustomCSS />} />
                  <Route path="/people" element={<People />} />
                  <Route path="/people/users" element={<Users />} />
                  <Route path="/people/roles" element={<Roles />} />
                  <Route path="/people/permissions" element={<Permissions />} />
                  <Route path="/utilities" element={<Utilities />} />
                  <Route path="/utilities/cache" element={<Cache />} />
                  <Route path="/utilities/backup" element={<Backup />} />
                  <Route path="/utilities/database" element={<Database />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/site-info" element={<SiteInfo />} />
                  <Route path="/settings/performance" element={<Performance />} />
                  <Route path="/settings/file-system" element={<FileSystem />} />
                  <Route path="/settings/deployment" element={<Deployment />} />
                  <Route path="/plugin-store" element={<PluginStore />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/site-status" element={<SiteStatus />} />
                  <Route path="/reports/logs" element={<Logs />} />
                  <Route path="/reports/analytics" element={<Analytics />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/documentation" element={<Documentation />} />
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
