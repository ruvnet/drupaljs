import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  const { id } = useParams();
  const [isPublished, setIsPublished] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [template, setTemplate] = useState('default');

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem(`article_${id}`)) || {};
    setIsPublished(storedData.isPublished || true);
    setTitle(storedData.title || '');
    setBody(storedData.body || '');
    setMetaTitle(storedData.metaTitle || '');
    setMetaDescription(storedData.metaDescription || '');
    setKeywords(storedData.keywords || '');
    setTemplate(storedData.template || 'default');
  }, [id]);

  const handleSave = () => {
    const articleData = {
      id,
      isPublished,
      title,
      body,
      metaTitle,
      metaDescription,
      keywords,
      template,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(`article_${id}`, JSON.stringify(articleData));
    navigate('/content');
  };

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
            <Button variant="outline" asChild>
              <Link to={`/view/${id}`} target="_blank">Preview</Link>
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>

        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <ReactQuill theme="snow" value={body} onChange={setBody} />
                </div>
              </TabsContent>

              <TabsContent value="content">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">SEO Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                        <Input 
                          placeholder="Enter meta title" 
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                        <Input 
                          placeholder="Enter meta description" 
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                        <Input 
                          placeholder="Enter keywords, separated by commas" 
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Layout Options</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                      <select 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                      >
                        <option value="default">Default</option>
                        <option value="full-width">Full Width</option>
                        <option value="sidebar-left">Sidebar Left</option>
                        <option value="sidebar-right">Sidebar Right</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArticleEdit;
