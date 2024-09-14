import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

function PluginHero() {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-20 px-6 rounded-lg mb-12">
      <h2 className="text-4xl font-bold mb-4">Enhance Your CMS with Powerful Plugins</h2>
      <p className="text-xl mb-8">Discover, install, and create custom plugins to extend your CMS functionality.</p>
      <div className="flex space-x-4">
        <Button asChild variant="secondary" size="lg">
          <Link to="/plugin-store?tab=browse">Browse Plugins</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
          <Link to="/plugin-store?tab=create">Create Your Own</Link>
        </Button>
      </div>
    </div>
  );
}

export default PluginHero;
