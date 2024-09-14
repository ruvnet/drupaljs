import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ArticleEdit = () => {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(true);
  const [title, setTitle] = useState('The Swiss Alps');
  const [body, setBody] = useState('The Alpine region of Switzerland, conventionally referred to as the Swiss Alps...');

  const handleBack = () => {
    navigate('/content');
  };

  return (
    <div className="p-6">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Content
      </Button>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold">Edit Article</h1>
            <span className="text-2xl">{title}</span>
            <Star className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Published</span>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <Button variant="outline">Preview</Button>
            <Button>Save</Button>
          </div>
        </div>

        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
            <TabsTrigger value="revisions">Revisions</TabsTrigger>
            <TabsTrigger value="devel">Devel</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="paragraphs">Paragraphs</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <ReactQuill theme="snow" value={body} onChange={setBody} style={{height: '300px'}} />
                  <div style={{height: '250px'}}></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero</label>
                  <div className="border rounded-md p-4">
                    <div className="relative w-48 h-32 bg-gray-200 rounded-md overflow-hidden">
                      <img src="/placeholder.svg" alt="Hero" className="w-full h-full object-cover" />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">eberhard-grossgasteiger-542840-unsplash.jpg</p>
                    <p className="text-sm text-gray-500">The maximum number of media items have been selected.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">SEO Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                        <Input placeholder="Enter meta title" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                        <Input placeholder="Enter meta description" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                        <Input placeholder="Enter keywords, separated by commas" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Layout Options</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                          <option>Default</option>
                          <option>Full Width</option>
                          <option>Sidebar Left</option>
                          <option>Sidebar Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header Image</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                <span>Upload a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="paragraphs">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Paragraph Blocks</h3>
                    <div className="space-y-4">
                      <div className="border p-4 rounded-md">
                        <h4 className="font-medium mb-2">Text Block</h4>
                        <ReactQuill theme="snow" value="<p>This is a sample text block. You can edit this content.</p>" style={{height: '200px'}} />
                        <div style={{height: '150px'}}></div>
                      </div>
                      <div className="border p-4 rounded-md">
                        <h4 className="font-medium mb-2">Image Block</h4>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
                          <div>
                            <Input placeholder="Image caption" className="mb-2" />
                            <Button variant="outline" size="sm">Replace Image</Button>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Add New Block</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Published</h3>
            <p className="text-sm text-gray-600">Last saved: 11/03/2020 - 20:43</p>
            <p className="text-sm text-gray-600">Author: admin</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">Create new revision</h3>
            <Switch />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">Revision log message</h3>
            <Input placeholder="Briefly describe the changes you have made." />
          </div>
          <Button variant="outline" className="text-red-600 border-red-600">Delete</Button>
        </div>
      </div>
    </div>
  );
};

export default ArticleEdit;
