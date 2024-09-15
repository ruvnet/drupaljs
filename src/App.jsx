import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ArticleEdit from './pages/ArticleEdit';
import Articles from './pages/Articles';
import Home from './pages/Home';
import Structure from './pages/Structure';
import Appearance from './pages/Appearance';
import People from './pages/People';
import Utilities from './pages/Utilities';
import Settings from './pages/Settings';
import PluginStore from './pages/PluginStore';
import Reports from './pages/Reports';
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
                  <Route path="/" element={<Home />} />
                  <Route path="/articles" element={<Articles />} />
                  <Route path="/articles/edit/:id" element={<ArticleEdit />} />
                  <Route path="/structure" element={<Structure />} />
                  <Route path="/appearance" element={<Appearance />} />
                  <Route path="/people" element={<People />} />
                  <Route path="/utilities" element={<Utilities />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/plugin-store" element={<PluginStore />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/new-content" element={<NewContent />} />
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
