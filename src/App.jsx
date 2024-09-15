import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Articles from './pages/Articles';
import ArticleEdit from './pages/ArticleEdit';
import Appearance from './pages/Appearance';
import PluginStore from './pages/PluginStore';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/content/articles" element={<Articles />} />
            <Route path="/content/articles/:id" element={<ArticleEdit />} />
            <Route path="/appearance" element={<Appearance />} />
            <Route path="/plugins" element={<PluginStore />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/documentation" element={<Documentation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
