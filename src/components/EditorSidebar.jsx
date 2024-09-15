import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentTab from './ContentTab';
import MetaTab from './MetaTab';
import AIContentGenerator from './AIContentGenerator';
import DesignTab from './DesignTab';
import LayoutTab from './LayoutTab';

const EditorSidebar = ({ pageData, handleChange, handleAddSection }) => {
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
            <ContentTab handleAddSection={handleAddSection} />
          </TabsContent>
          <TabsContent value="meta">
            <MetaTab pageData={pageData} handleChange={handleChange} />
          </TabsContent>
          <TabsContent value="ai">
            <AIContentGenerator onGenerate={(field, content) => handleChange(field, content)} />
          </TabsContent>
          <TabsContent value="design">
            <DesignTab pageData={pageData} handleChange={handleChange} />
          </TabsContent>
          <TabsContent value="layout">
            <LayoutTab pageData={pageData} handleChange={handleChange} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default EditorSidebar;
