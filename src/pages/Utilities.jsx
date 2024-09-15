import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Utilities() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Utilities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache</CardTitle>
            <CardDescription>Manage site caching</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Clear Cache</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Backup</CardTitle>
            <CardDescription>Create and manage site backups</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Manage Backups</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>Perform database operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Database Tools</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Utilities;