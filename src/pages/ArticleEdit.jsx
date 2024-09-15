import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Star, ChevronDown, Bold, Italic, Underline, List, AlignLeft, Quote } from 'lucide-react';

const ArticleEdit = () => {
  const [isPublished, setIsPublished] = useState(true);
  const [title, setTitle] = useState('The Swiss Alps');
  const [body, setBody] = useState('The Alpine region of Switzerland, conventionally referred to as the Swiss Alps (German: Schweizer Alpen, French: Alpes suisses, Italian: Alpi svizzere, Romansh: Alps svizras), represents a major natural feature of the country and is, along with the Swiss Plateau and the Swiss portion of the Jura Mountains, one of its three main physiographic regions. The Swiss Alps extend over both the Western Alps and the Eastern Alps, encompassing an area sometimes called Central Alps.[1] While the northern ranges from the Bernese Alps to the Appenzell Alps are entirely in Switzerland, the southern ranges from the Mont Blanc massif to the Bernina massif are shared with other countries such as France, Italy, Austria and Liechtenstein.');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body (Edit summary)</label>
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
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Text format</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-40">
                              Basic HTML <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Basic HTML</DropdownMenuItem>
                            <DropdownMenuItem>Full HTML</DropdownMenuItem>
                            <DropdownMenuItem>Plain text</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <a href="#" className="text-sm text-blue-600">About text formats</a>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ArticleEdit;