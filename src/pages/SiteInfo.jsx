import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

function SiteInfo() {
  const [siteInfo, setSiteInfo] = useState({
    siteName: '',
    siteSlogan: '',
    siteEmail: '',
    frontPage: '/',
    errorPages: {
      403: '',
      404: '',
      500: ''
    }
  });

  useEffect(() => {
    const storedSiteInfo = JSON.parse(localStorage.getItem('siteInfo'));
    if (storedSiteInfo) {
      setSiteInfo(storedSiteInfo);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSiteInfo(prevInfo => ({
      ...prevInfo,
      [name]: value
    }));
  };

  const handleErrorPageChange = (e) => {
    const { name, value } = e.target;
    setSiteInfo(prevInfo => ({
      ...prevInfo,
      errorPages: {
        ...prevInfo.errorPages,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real scenario, this would be a POST request to /Drupal.js/api/settings/site-info
    localStorage.setItem('siteInfo', JSON.stringify(siteInfo));
    toast.success('Site information updated successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Site Information</h1>
        <Button asChild>
          <Link to="/settings">Back to Settings</Link>
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure the core details of your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                name="siteName"
                value={siteInfo.siteName}
                onChange={handleInputChange}
                placeholder="My Drupal.js Site"
              />
            </div>
            <div>
              <Label htmlFor="siteSlogan">Site Slogan</Label>
              <Input
                id="siteSlogan"
                name="siteSlogan"
                value={siteInfo.siteSlogan}
                onChange={handleInputChange}
                placeholder="An amazing Drupal.js powered website"
              />
            </div>
            <div>
              <Label htmlFor="siteEmail">Site Email Address</Label>
              <Input
                id="siteEmail"
                name="siteEmail"
                type="email"
                value={siteInfo.siteEmail}
                onChange={handleInputChange}
                placeholder="admin@example.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Front Page</CardTitle>
            <CardDescription>Set the default front page for your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="frontPage">Front Page Path</Label>
              <Input
                id="frontPage"
                name="frontPage"
                value={siteInfo.frontPage}
                onChange={handleInputChange}
                placeholder="/"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Error Pages</CardTitle>
            <CardDescription>Customize content for error pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="403">403 Access Denied Page</Label>
              <Textarea
                id="403"
                name="403"
                value={siteInfo.errorPages['403']}
                onChange={handleErrorPageChange}
                placeholder="Custom 403 error message"
              />
            </div>
            <div>
              <Label htmlFor="404">404 Not Found Page</Label>
              <Textarea
                id="404"
                name="404"
                value={siteInfo.errorPages['404']}
                onChange={handleErrorPageChange}
                placeholder="Custom 404 error message"
              />
            </div>
            <div>
              <Label htmlFor="500">500 Server Error Page</Label>
              <Textarea
                id="500"
                name="500"
                value={siteInfo.errorPages['500']}
                onChange={handleErrorPageChange}
                placeholder="Custom 500 error message"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit">Save Configuration</Button>
      </form>
    </div>
  );
}

export default SiteInfo;