import React from 'react';
import { Button } from "@/components/ui/button";

function PluginHero() {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-20 px-6 rounded-lg mb-12">
      <h2 className="text-4xl font-bold mb-4">Enhance Your CMS with Powerful Plugins</h2>
      <p className="text-xl mb-8">Discover, install, and create custom plugins to extend your CMS functionality.</p>
      <div className="flex space-x-4">
        <Button variant="secondary" size="lg">Browse Plugins</Button>
        <Button variant="outline" size="lg">Create Your Own</Button>
      </div>
    </div>
  );
}

export default PluginHero;