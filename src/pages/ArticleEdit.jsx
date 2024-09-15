import React, { useState } from 'react';
import { Star, Bold, Italic, Underline, List, AlignLeft, Quote, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ArticleEdit = () => {
  const [isPublished, setIsPublished] = useState(true);
  const [title, setTitle] = useState('The Swiss Alps');
  const [body, setBody] = useState('The Alpine region of Switzerland, conventionally referred to as the Swiss Alps...');

  return (
    <div className="p-6">
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
                  <div className="border rounded-md p-2 mb-2">
                    <div className="flex space-x-2 mb-2">
                      <Button variant="outline" size="icon"><Bold className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon"><Italic className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon"><Underline className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon"><List className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon"><AlignLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon"><Quote className="h-4 w-4" /></Button>
                      <Button variant="outline">Format</Button>
                      <Button variant="outline">Source</Button>
                    </div>
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero</label>
                  <div className="border rounded-md p-4">
                    <div className="relative w-48 h-32 bg-gray-200 rounded-md overflow-hidden">
                      <img src="/placeholder.svg" alt="Hero" className="w-full h-full object-cover" />
                      <button className="absolute top-2 right-2 bg-white rounded-full p-1">
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">eberhard-grossgasteiger-542840-unsplash.jpg</p>
                    <p className="text-sm text-gray-500">The maximum number of media items have been selected.</p>
                  </div>
                </div>
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
            <Textarea placeholder="Briefly describe the changes you have made." rows={3} />
          </div>
          <Button variant="outline" className="text-red-600 border-red-600">Delete</Button>
        </div>
      </div>
    </div>
  );
};

export default ArticleEdit;
