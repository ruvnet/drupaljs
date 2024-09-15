import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleEdit from './pages/ArticleEdit';
import DrupalAI from './pages/DrupalAI';
import Settings from './pages/Settings';
import User from './pages/User';

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
            <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/content" element={<Articles />} />
                  <Route path="/content/edit/:id" element={<ArticleEdit />} />
                  <Route path="/drupal-ai" element={<DrupalAI />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/user" element={<User />} />
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
