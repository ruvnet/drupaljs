import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
            <CardDescription>Configure basic site settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Edit Site Info</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Optimize site performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Performance Settings</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>File System</CardTitle>
            <CardDescription>Configure file storage settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">File System Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;