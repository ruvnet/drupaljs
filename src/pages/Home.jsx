import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to Drupal.js</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Content</CardTitle>
            <CardDescription>Add, edit, and organize your website's content</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Go to Content</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Structure</CardTitle>
            <CardDescription>Organize your content structure and taxonomy</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Manage Structure</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize your website's look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Customize Appearance</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Home;
