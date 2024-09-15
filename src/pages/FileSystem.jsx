import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

function FileSystem() {
  const [fileSystemSettings, setFileSystemSettings] = useState({
    publicFilesPath: 'sites/default/files',
    privateFilesPath: 'sites/default/private',
    temporaryFilesPath: 'sites/default/files/tmp',
    defaultScheme: 'public',
    filePermissions: '0644',
    directoryPermissions: '0755',
    s3Integration: {
      enabled: false,
      bucket: '',
      accessKey: '',
      secretKey: '',
      region: ''
    },
    imageToolkit: 'GD',
    maxFileSize: 32,
    allowedExtensions: 'jpg jpeg gif png txt doc docx xls xlsx pdf ppt pptx pps ppsx odt ods odp mp3 mov mp4 m4a m4v mpeg avi ogg oga ogv weba webp webm',
    publicDownloadMethod: 'X-Sendfile',
    transliteration: true
  });

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('fileSystemSettings'));
    if (storedSettings) {
      setFileSystemSettings(storedSettings);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFileSystemSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  const handleS3Change = (e) => {
    const { name, value } = e.target;
    setFileSystemSettings(prevSettings => ({
      ...prevSettings,
      s3Integration: {
        ...prevSettings.s3Integration,
        [name]: value
      }
    }));
  };

  const handleToggle = (key) => {
    setFileSystemSettings(prevSettings => ({
      ...prevSettings,
      [key]: !prevSettings[key]
    }));
  };

  const handleS3Toggle = () => {
    setFileSystemSettings(prevSettings => ({
      ...prevSettings,
      s3Integration: {
        ...prevSettings.s3Integration,
        enabled: !prevSettings.s3Integration.enabled
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real scenario, this would be a POST request to /Drupal.js/api/settings/file-system
    localStorage.setItem('fileSystemSettings', JSON.stringify(fileSystemSettings));
    toast.success('File system settings updated successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">File System Settings</h1>
        <Button asChild>
          <Link to="/settings">Back to Settings</Link>
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>File Paths</CardTitle>
            <CardDescription>Configure paths for different types of files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="publicFilesPath">Public Files Path</Label>
              <Input
                id="publicFilesPath"
                name="publicFilesPath"
                value={fileSystemSettings.publicFilesPath}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="privateFilesPath">Private Files Path</Label>
              <Input
                id="privateFilesPath"
                name="privateFilesPath"
                value={fileSystemSettings.privateFilesPath}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="temporaryFilesPath">Temporary Files Path</Label>
              <Input
                id="temporaryFilesPath"
                name="temporaryFilesPath"
                value={fileSystemSettings.temporaryFilesPath}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>File System Configuration</CardTitle>
            <CardDescription>General file system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultScheme">Default Download Method</Label>
              <Select
                value={fileSystemSettings.defaultScheme}
                onValueChange={(value) => setFileSystemSettings(prev => ({ ...prev, defaultScheme: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select download method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filePermissions">File Permissions</Label>
              <Input
                id="filePermissions"
                name="filePermissions"
                value={fileSystemSettings.filePermissions}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="directoryPermissions">Directory Permissions</Label>
              <Input
                id="directoryPermissions"
                name="directoryPermissions"
                value={fileSystemSettings.directoryPermissions}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>S3 Integration</CardTitle>
            <CardDescription>Configure Amazon S3 for file storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="s3Enabled">Enable S3 Integration</Label>
              <Switch
                id="s3Enabled"
                checked={fileSystemSettings.s3Integration.enabled}
                onCheckedChange={handleS3Toggle}
              />
            </div>
            {fileSystemSettings.s3Integration.enabled && (
              <>
                <div>
                  <Label htmlFor="s3Bucket">S3 Bucket Name</Label>
                  <Input
                    id="s3Bucket"
                    name="bucket"
                    value={fileSystemSettings.s3Integration.bucket}
                    onChange={handleS3Change}
                  />
                </div>
                <div>
                  <Label htmlFor="s3AccessKey">Access Key</Label>
                  <Input
                    id="s3AccessKey"
                    name="accessKey"
                    value={fileSystemSettings.s3Integration.accessKey}
                    onChange={handleS3Change}
                  />
                </div>
                <div>
                  <Label htmlFor="s3SecretKey">Secret Key</Label>
                  <Input
                    id="s3SecretKey"
                    name="secretKey"
                    type="password"
                    value={fileSystemSettings.s3Integration.secretKey}
                    onChange={handleS3Change}
                  />
                </div>
                <div>
                  <Label htmlFor="s3Region">Region</Label>
                  <Input
                    id="s3Region"
                    name="region"
                    value={fileSystemSettings.s3Integration.region}
                    onChange={handleS3Change}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Image Processing</CardTitle>
            <CardDescription>Configure image processing settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="imageToolkit">Image Processing Toolkit</Label>
              <Select
                value={fileSystemSettings.imageToolkit}
                onValueChange={(value) => setFileSystemSettings(prev => ({ ...prev, imageToolkit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select image toolkit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GD">GD</SelectItem>
                  <SelectItem value="ImageMagick">ImageMagick</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>File Upload Settings</CardTitle>
            <CardDescription>Configure file upload limitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
              <Input
                id="maxFileSize"
                name="maxFileSize"
                type="number"
                value={fileSystemSettings.maxFileSize}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="allowedExtensions">Allowed File Extensions</Label>
              <Input
                id="allowedExtensions"
                name="allowedExtensions"
                value={fileSystemSettings.allowedExtensions}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Configure advanced file system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="publicDownloadMethod">Public Files Download Method</Label>
              <Select
                value={fileSystemSettings.publicDownloadMethod}
                onValueChange={(value) => setFileSystemSettings(prev => ({ ...prev, publicDownloadMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select download method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="X-Sendfile">X-Sendfile</SelectItem>
                  <SelectItem value="X-Accel-Redirect">X-Accel-Redirect</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="transliteration">Transliterate File Names</Label>
              <Switch
                id="transliteration"
                checked={fileSystemSettings.transliteration}
                onCheckedChange={() => handleToggle('transliteration')}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit">Save File System Settings</Button>
      </form>
    </div>
  );
}

export default FileSystem;