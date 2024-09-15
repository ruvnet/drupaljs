import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Help() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Help</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Access comprehensive guides and tutorials</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/documentation">View Documentation</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Community Forums</CardTitle>
            <CardDescription>Connect with other users and get support</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => window.open('https://community.drupaljs.org', '_blank')}>Visit Forums</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Video Tutorials</CardTitle>
            <CardDescription>Watch step-by-step video guides</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => window.open('https://tutorials.drupaljs.org', '_blank')}>Watch Tutorials</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Help;
