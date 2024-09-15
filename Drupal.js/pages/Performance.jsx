import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

function Performance() {
  const [performanceSettings, setPerformanceSettings] = useState({
    caching: {
      pageCache: true,
      blockCache: true,
      entityCache: true
    },
    cssAggregation: true,
    jsAggregation: true,
    jsMinification: true,
    cssMinification: true,
    gzip: true,
    cacheLifetime: 3600,
    preprocess: {
      css: true,
      js: true
    },
    lazyLoading: {
      images: true,
      iframes: true
    },
    cdnIntegration: {
      enabled: false,
      url: ''
    },
    databaseOptimization: {
      queryCache: true,
      indexing: true
    }
  });

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('performanceSettings'));
    if (storedSettings) {
      setPerformanceSettings(storedSettings);
    }
  }, []);

  const handleToggle = (section, key) => {
    setPerformanceSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section],
        [key]: !prevSettings[section][key]
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPerformanceSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  const handleCDNChange = (e) => {
    const { name, value } = e.target;
    setPerformanceSettings(prevSettings => ({
      ...prevSettings,
      cdnIntegration: {
        ...prevSettings.cdnIntegration,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real scenario, this would be a POST request to /Drupal.js/api/settings/performance
    localStorage.setItem('performanceSettings', JSON.stringify(performanceSettings));
    toast.success('Performance settings updated successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Performance Settings</h1>
        <Button asChild>
          <Link to="/settings">Back to Settings</Link>
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Caching</CardTitle>
            <CardDescription>Configure caching options for better performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pageCache">Page Cache</Label>
              <Switch
                id="pageCache"
                checked={performanceSettings.caching.pageCache}
                onCheckedChange={() => handleToggle('caching', 'pageCache')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="blockCache">Block Cache</Label>
              <Switch
                id="blockCache"
                checked={performanceSettings.caching.blockCache}
                onCheckedChange={() => handleToggle('caching', 'blockCache')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="entityCache">Entity Cache</Label>
              <Switch
                id="entityCache"
                checked={performanceSettings.caching.entityCache}
                onCheckedChange={() => handleToggle('caching', 'entityCache')}
              />
            </div>
            <div>
              <Label htmlFor="cacheLifetime">Cache Lifetime (seconds)</Label>
              <Input
                id="cacheLifetime"
                name="cacheLifetime"
                type="number"
                value={performanceSettings.cacheLifetime}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Asset Optimization</CardTitle>
            <CardDescription>Optimize CSS and JavaScript for faster loading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cssAggregation">CSS Aggregation</Label>
              <Switch
                id="cssAggregation"
                checked={performanceSettings.cssAggregation}
                onCheckedChange={() => setPerformanceSettings(prev => ({ ...prev, cssAggregation: !prev.cssAggregation }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="jsAggregation">JavaScript Aggregation</Label>
              <Switch
                id="jsAggregation"
                checked={performanceSettings.jsAggregation}
                onCheckedChange={() => setPerformanceSettings(prev => ({ ...prev, jsAggregation: !prev.jsAggregation }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cssMinification">CSS Minification</Label>
              <Switch
                id="cssMinification"
                checked={performanceSettings.cssMinification}
                onCheckedChange={() => setPerformanceSettings(prev => ({ ...prev, cssMinification: !prev.cssMinification }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="jsMinification">JavaScript Minification</Label>
              <Switch
                id="jsMinification"
                checked={performanceSettings.jsMinification}
                onCheckedChange={() => setPerformanceSettings(prev => ({ ...prev, jsMinification: !prev.jsMinification }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compression</CardTitle>
            <CardDescription>Enable compression for faster data transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="gzip">Gzip Compression</Label>
              <Switch
                id="gzip"
                checked={performanceSettings.gzip}
                onCheckedChange={() => setPerformanceSettings(prev => ({ ...prev, gzip: !prev.gzip }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preprocessing</CardTitle>
            <CardDescription>Configure preprocessing for CSS and JavaScript</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="preprocessCss">Preprocess CSS</Label>
              <Switch
                id="preprocessCss"
                checked={performanceSettings.preprocess.css}
                onCheckedChange={() => handleToggle('preprocess', 'css')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="preprocessJs">Preprocess JavaScript</Label>
              <Switch
                id="preprocessJs"
                checked={performanceSettings.preprocess.js}
                onCheckedChange={() => handleToggle('preprocess', 'js')}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lazy Loading</CardTitle>
            <CardDescription>Enable lazy loading for images and iframes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="lazyLoadImages">Lazy Load Images</Label>
              <Switch
                id="lazyLoadImages"
                checked={performanceSettings.lazyLoading.images}
                onCheckedChange={() => handleToggle('lazyLoading', 'images')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lazyLoadIframes">Lazy Load Iframes</Label>
              <Switch
                id="lazyLoadIframes"
                checked={performanceSettings.lazyLoading.iframes}
                onCheckedChange={() => handleToggle('lazyLoading', 'iframes')}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>CDN Integration</CardTitle>
            <CardDescription>Configure Content Delivery Network settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cdnEnabled">Enable CDN</Label>
              <Switch
                id="cdnEnabled"
                checked={performanceSettings.cdnIntegration.enabled}
                onCheckedChange={() => handleToggle('cdnIntegration', 'enabled')}
              />
            </div>
            {performanceSettings.cdnIntegration.enabled && (
              <div>
                <Label htmlFor="cdnUrl">CDN URL</Label>
                <Input
                  id="cdnUrl"
                  name="url"
                  value={performanceSettings.cdnIntegration.url}
                  onChange={handleCDNChange}
                  placeholder="https://your-cdn-url.com"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Database Optimization</CardTitle>
            <CardDescription>Configure database performance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="queryCache">Query Cache</Label>
              <Switch
                id="queryCache"
                checked={performanceSettings.databaseOptimization.queryCache}
                onCheckedChange={() => handleToggle('databaseOptimization', 'queryCache')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="indexing">Database Indexing</Label>
              <Switch
                id="indexing"
                checked={performanceSettings.databaseOptimization.indexing}
                onCheckedChange={() => handleToggle('databaseOptimization', 'indexing')}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit">Save Performance Settings</Button>
      </form>
    </div>
  );
}

export default Performance;