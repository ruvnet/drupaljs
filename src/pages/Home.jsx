import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Layout, PenTool, Users, BarChart2, HelpCircle } from 'lucide-react';

function Home() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Welcome to Drupal.js</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-500" />
              Manage Content
            </CardTitle>
            <CardDescription>Add, edit, and organize your website's content</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Go to Content</Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="mr-2 h-5 w-5 text-green-500" />
              Structure
            </CardTitle>
            <CardDescription>Organize your content structure and taxonomy</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Manage Structure</Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="mr-2 h-5 w-5 text-purple-500" />
              Appearance
            </CardTitle>
            <CardDescription>Customize your website's look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Customize Appearance</Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-yellow-500" />
              People
            </CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Manage People</Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-red-500" />
              Reports
            </CardTitle>
            <CardDescription>View site statistics and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">View Reports</Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-indigo-500" />
              Help
            </CardTitle>
            <CardDescription>Access documentation and support resources</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Get Help</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Home;
