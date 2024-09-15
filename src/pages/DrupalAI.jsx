import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentGeneration from '../components/DrupalAI/ContentGeneration';
import PromptManagement from '../components/DrupalAI/PromptManagement';
import AISettings from '../components/DrupalAI/AISettings';

function DrupalAI() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Drupal.AI</h1>
      
      <Tabs defaultValue="content-generation">
        <TabsList className="mb-4">
          <TabsTrigger value="content-generation">Content Generation</TabsTrigger>
          <TabsTrigger value="prompt-management">Prompt Management</TabsTrigger>
          <TabsTrigger value="settings">AI Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content-generation">
          <ContentGeneration />
        </TabsContent>
        
        <TabsContent value="prompt-management">
          <PromptManagement />
        </TabsContent>
        
        <TabsContent value="settings">
          <AISettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DrupalAI;
