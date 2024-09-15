import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIContentGenerator from '@/components/AIContentGenerator';
import AgentWorkflow from '@/components/AgentWorkflow';
import PromptManagement from '@/components/PromptManagement';
import ContentAnalytics from '@/components/ContentAnalytics';
import AISettings from '@/components/AISettings';

function DrupalAI() {
  const [aiSettings, setAISettings] = useState({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 150,
  });

  const handleSettingsChange = (newSettings) => {
    setAISettings(newSettings);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Drupal AI</h1>
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="workflow">Agent Workflow</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Management</TabsTrigger>
          <TabsTrigger value="analytics">Content Analytics</TabsTrigger>
          <TabsTrigger value="settings">AI Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <AIContentGenerator settings={aiSettings} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Agent Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentWorkflow />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Management</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptManagement />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ContentAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <AISettings settings={aiSettings} onSettingsChange={handleSettingsChange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DrupalAI;