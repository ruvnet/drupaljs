import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, HardDrive, Zap } from 'lucide-react';

function Utilities() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Utilities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Cache
            </CardTitle>
            <CardDescription>Manage site caching</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/utilities/cache">Manage Cache</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Backup
            </CardTitle>
            <CardDescription>Create and manage site backups</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/utilities/backup">Manage Backups</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>Perform database operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/utilities/database">Database Tools</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Utilities;
