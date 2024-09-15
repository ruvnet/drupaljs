import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import { Button } from "@/components/ui/button";
import { Menu, FileText, User, Settings as SettingsIcon, Zap } from 'lucide-react';

// Import page components
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleEdit from './pages/ArticleEdit';
import DrupalAI from './pages/DrupalAI';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';
import UserProfile from './pages/UserProfile';

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
            <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-md z-10">
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
                  <Button variant="ghost" className="text-white" asChild>
                    <Link to="/drupal-ai">
                      <Zap className="h-5 w-5 md:mr-1" />
                      <span className="hidden md:inline">Drupal.AI</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="text-white" asChild>
                    <Link to="/content">
                      <FileText className="h-5 w-5 md:mr-1" />
                      <span className="hidden md:inline">Articles</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="text-white" asChild>
                    <Link to="/settings">
                      <SettingsIcon className="h-5 w-5 md:mr-1" />
                      <span className="hidden md:inline">Settings</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="text-white" asChild>
                    <Link to="/documentation">
                      <FileText className="h-5 w-5 md:mr-1" />
                      <span className="hidden md:inline">Docs</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className="text-white" asChild>
                    <Link to="/user-profile">
                      <User className="h-5 w-5 md:mr-1" />
                      <span className="hidden md:inline">Profile</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/content" element={<Articles />} />
                  <Route path="/content/edit/:id" element={<ArticleEdit />} />
                  <Route path="/drupal-ai" element={<DrupalAI />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/user-profile" element={<UserProfile />} />
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
