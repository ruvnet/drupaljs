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
import ArticleEditDetails from './ArticleEditDetails';
import ArticleEditContent from './ArticleEditContent';
import ArticleEditLayout from './ArticleEditLayout';
import ArticleEditParagraphs from './ArticleEditParagraphs';

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
    // Load data from local storage
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
              <Link to={`/content/view/${id}`} target="_blank">Preview</Link>
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
                <TabsTrigger value="paragraphs">Paragraphs</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <ArticleEditDetails
                  title={title}
                  setTitle={setTitle}
                  body={body}
                  setBody={setBody}
                />
              </TabsContent>

              <TabsContent value="content">
                <ArticleEditContent
                  metaTitle={metaTitle}
                  setMetaTitle={setMetaTitle}
                  metaDescription={metaDescription}
                  setMetaDescription={setMetaDescription}
                  keywords={keywords}
                  setKeywords={setKeywords}
                />
              </TabsContent>

              <TabsContent value="layout">
                <ArticleEditLayout
                  template={template}
                  setTemplate={setTemplate}
                />
              </TabsContent>

              <TabsContent value="paragraphs">
                <ArticleEditParagraphs />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArticleEdit;
