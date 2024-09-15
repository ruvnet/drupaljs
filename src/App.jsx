import React from 'react';
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
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
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
