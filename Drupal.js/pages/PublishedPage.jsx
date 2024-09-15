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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EditableSection from '@/components/EditableSection';
import AIContentGenerator from '@/components/AIContentGenerator';
import ColorPicker from '@/components/ColorPicker';
import CSSEditor from '@/components/CSSEditor';
import TinyMCEEditor from '@/components/TinyMCEEditor';

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
      layout: 'default',
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
      <EditorSidebar
        pageData={pageData}
        handleChange={handleChange}
        handleAddSection={handleAddSection}
      />
      <MainContent
        pageData={pageData}
        isEditing={isEditing}
        handleChange={handleChange}
        handleUpdateSection={handleUpdateSection}
        handleDeleteSection={handleDeleteSection}
      />
      <ActionButtons
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleSave={handleSave}
        id={id}
      />
    </div>
  );
}

function EditorSidebar({ pageData, handleChange, handleAddSection }) {
  return (
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
            <TabsTrigger value="layout">Layout</TabsTrigger>
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
            <MetaEditor pageData={pageData} handleChange={handleChange} />
          </TabsContent>
          <TabsContent value="ai">
            <AIContentGenerator onGenerate={(field, content) => handleChange(field, content)} />
          </TabsContent>
          <TabsContent value="design">
            <DesignEditor pageData={pageData} handleChange={handleChange} />
          </TabsContent>
          <TabsContent value="layout">
            <LayoutEditor pageData={pageData} handleChange={handleChange} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function MetaEditor({ pageData, handleChange }) {
  return (
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
  );
}

function DesignEditor({ pageData, handleChange }) {
  return (
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
  );
}

function LayoutEditor({ pageData, handleChange }) {
  return (
    <div className="space-y-4">
      <Select
        value={pageData.layout}
        onValueChange={(value) => handleChange('layout', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose layout" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="sidebar-left">Left Sidebar</SelectItem>
          <SelectItem value="sidebar-right">Right Sidebar</SelectItem>
          <SelectItem value="two-column">Two Column</SelectItem>
          <SelectItem value="three-column">Three Column</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function MainContent({ pageData, isEditing, handleChange, handleUpdateSection, handleDeleteSection }) {
  return (
    <div className={`flex-1 overflow-auto p-8 ${pageData.layout}`} style={{ backgroundColor: pageData.templateColor }}>
      <style>{pageData.customCSS}</style>
      <EditableSection
        isEditing={isEditing}
        content={pageData.title}
        onChange={(title) => handleChange('title', title)}
        type="title"
      />
      {isEditing ? (
        <TinyMCEEditor
          content={pageData.content}
          onChange={(content) => handleChange('content', content)}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
      )}
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
  );
}

function ActionButtons({ isEditing, setIsEditing, handleSave, id }) {
  return (
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
  );
}

export default PublishedPage;
