import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PluginStore() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Plugin Store</h1>
      <div className="mb-6">
        <Input type="text" placeholder="Search plugins..." className="w-full max-w-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SEO Toolkit</CardTitle>
            <CardDescription>Improve your site's search engine optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Install</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Social Media Integration</CardTitle>
            <CardDescription>Connect your site with social media platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Install</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>E-commerce Suite</CardTitle>
            <CardDescription>Add online store functionality to your site</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Install</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PluginStore;