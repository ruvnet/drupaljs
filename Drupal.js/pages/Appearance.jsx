import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Appearance() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Appearance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Themes</CardTitle>
            <CardDescription>Change the look and feel of your site</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/appearance/themes">Manage Themes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blocks</CardTitle>
            <CardDescription>Configure blocks for different regions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/appearance/blocks">Manage Blocks</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
            <CardDescription>Add custom CSS to your theme</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/appearance/custom-css">Edit Custom CSS</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Appearance;
