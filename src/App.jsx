import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Appearance from './pages/Appearance';
import ArticleEdit from './pages/ArticleEdit';
import Articles from './pages/Articles';
import Backup from './pages/Backup';
import Blocks from './pages/Blocks';
import Cache from './pages/Cache';
import ContentTypes from './pages/ContentTypes';
import CustomCSS from './pages/CustomCSS';
import Database from './pages/Database';
import Deployment from './pages/Deployment';
import FileSystem from './pages/FileSystem';
import Help from './pages/Help';
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
import SiteInfo from './pages/SiteInfo';
import SiteStatus from './pages/SiteStatus';
import Structure from './pages/Structure';
import Taxonomy from './pages/Taxonomy';
import Themes from './pages/Themes';
import Users from './pages/Users';
import Utilities from './pages/Utilities';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/appearance" element={<Appearance />} />
              <Route path="/article-edit" element={<ArticleEdit />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/backup" element={<Backup />} />
              <Route path="/blocks" element={<Blocks />} />
              <Route path="/cache" element={<Cache />} />
              <Route path="/content-types" element={<ContentTypes />} />
              <Route path="/custom-css" element={<CustomCSS />} />
              <Route path="/database" element={<Database />} />
              <Route path="/deployment" element={<Deployment />} />
              <Route path="/file-system" element={<FileSystem />} />
              <Route path="/help" element={<Help />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/menus" element={<Menus />} />
              <Route path="/new-content" element={<NewContent />} />
              <Route path="/people" element={<People />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/plugin-store" element={<PluginStore />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/site-info" element={<SiteInfo />} />
              <Route path="/site-status" element={<SiteStatus />} />
              <Route path="/structure" element={<Structure />} />
              <Route path="/taxonomy" element={<Taxonomy />} />
              <Route path="/themes" element={<Themes />} />
              <Route path="/users" element={<Users />} />
              <Route path="/utilities" element={<Utilities />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
