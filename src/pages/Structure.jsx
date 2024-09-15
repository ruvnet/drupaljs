import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Structure() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Structure</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
            <CardDescription>Manage content types and their fields</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/structure/content-types">Manage Content Types</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Taxonomy</CardTitle>
            <CardDescription>Organize your content with categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/structure/taxonomy">Manage Taxonomy</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <CardDescription>Customize site navigation menus</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/structure/menus">Manage Menus</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Structure;
