import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Edit, Eye, Save, Plus, Trash2, Settings, PenTool, Palette } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import EditableSection from '@/components/EditableSection';
import AIContentGenerator from '@/components/AIContentGenerator';
import ColorPicker from '@/components/ColorPicker';
import CSSEditor from '@/components/CSSEditor';

function PublishedPage() {
  const { id } = useParams();
  const [pageData, setPageData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem(`page_${id}`)) || {
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: true,
      sections: [],
      templateColor: '#ffffff',
      customCSS: '',
    };
    setPageData(storedData);
  }, [id]);

  const handleSave = () => {
    localStorage.setItem(`page_${id}`, JSON.stringify(pageData));
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSection = (type) => {
    const newSection = {
      id: Date.now(),
      type,
      content: type === 'text' ? 'New text section' : '/placeholder.svg',
    };
    setPageData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleUpdateSection = (id, content) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id ? { ...section, content } : section
      ),
    }));
  };

  const handleDeleteSection = (id) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id),
    }));
  };

  if (!pageData) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="fixed top-4 left-4 z-50">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Page Editor</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <div className="space-y-4">
                <Button onClick={() => handleAddSection('text')} className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" /> Add Text Section
                </Button>
                <Button onClick={() => handleAddSection('image')} className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" /> Add Image Section
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="meta">
              <div className="space-y-4">
                <Input
                  placeholder="Meta Title"
                  value={pageData.metaTitle}
                  onChange={(e) => handleChange('metaTitle', e.target.value)}
                />
                <Textarea
                  placeholder="Meta Description"
                  value={pageData.metaDescription}
                  onChange={(e) => handleChange('metaDescription', e.target.value)}
                />
              </div>
            </TabsContent>
            <TabsContent value="ai">
              <AIContentGenerator onGenerate={(field, content) => handleChange(field, content)} />
            </TabsContent>
            <TabsContent value="design">
              <div className="space-y-4">
                <ColorPicker
                  color={pageData.templateColor}
                  onChange={(color) => handleChange('templateColor', color)}
                  label="Template Color"
                />
                <CSSEditor
                  value={pageData.customCSS}
                  onChange={(css) => handleChange('customCSS', css)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: pageData.templateColor }}>
        <style>{pageData.customCSS}</style>
        <EditableSection
          isEditing={isEditing}
          content={pageData.title}
          onChange={(title) => handleChange('title', title)}
          type="title"
        />
        <EditableSection
          isEditing={isEditing}
          content={pageData.content}
          onChange={(content) => handleChange('content', content)}
        />
        {pageData.sections.map((section) => (
          <EditableSection
            key={section.id}
            isEditing={isEditing}
            content={section.content}
            onChange={(content) => handleUpdateSection(section.id, content)}
            type={section.type}
            onDelete={() => handleDeleteSection(section.id)}
          />
        ))}
      </div>

      <div className="fixed right-4 top-4 space-y-2">
        <Button asChild>
          <Link to={`/content/edit/${id}`}>
            <Settings className="mr-2 h-4 w-4" /> Advanced Edit
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <Eye className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
          {isEditing ? 'Preview' : 'Quick Edit'}
        </Button>
        {isEditing && (
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        )}
      </div>
    </div>
  );
}

export default PublishedPage;
