import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Layout, PenTool, Users, BarChart2, HelpCircle, Settings, Package, Store, Wrench } from 'lucide-react';

function Home() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to Drupal.js</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your modern, React-based content management system. Manage your content, structure, and appearance with ease.
        </p>
      </div>
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/content">Go to Content</Link>
            </Button>
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/structure">Manage Structure</Link>
            </Button>
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/appearance">Customize Appearance</Link>
            </Button>
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/people">Manage People</Link>
            </Button>
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/reports">View Reports</Link>
            </Button>
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
            <Button variant="outline" className="w-full" asChild>
              <Link to="/help">Get Help</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-gray-500" />
              Settings
            </CardTitle>
            <CardDescription>Configure site-wide settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/settings">Manage Settings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-orange-500" />
              Plugin Store
            </CardTitle>
            <CardDescription>Browse and install plugins</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/plugin-store">Visit Plugin Store</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="mr-2 h-5 w-5 text-teal-500" />
              Utilities
            </CardTitle>
            <CardDescription>Access various site utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/utilities">Access Utilities</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Home;
