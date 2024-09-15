import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { Brain, PenTool, Wand2, Zap, Settings, BarChart } from 'lucide-react';
import AIContentGenerator from '@/components/AIContentGenerator';
import AgentWorkflow from '@/components/AgentWorkflow';
import PromptManagement from '@/components/PromptManagement';
import ContentAnalytics from '@/components/ContentAnalytics';

function DrupalAI() {
  const [aiSettings, setAISettings] = useState({
    openaiApiKey: '',
    anthropicApiKey: '',
    googleAiApiKey: '',
  });

  const [contentGeneration, setContentGeneration] = useState({
    prompt: '',
    contentType: 'article',
    tone: 'neutral',
    length: 500,
  });

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('aiSettings')) || {};
    setAISettings(storedSettings);
  }, []);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setAISettings(prev => ({ ...prev, [name]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
    toast.success('AI settings saved successfully');
  };

  const handleContentGenerationChange = (name, value) => {
    setContentGeneration(prev => ({ ...prev, [name]: value }));
  };

  const generateContent = async () => {
    console.log('Generating content with:', contentGeneration);
    toast.success('Content generated successfully');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Drupal.AI</h1>
      
      <Tabs defaultValue="content-generation">
        <TabsList className="mb-4">
          <TabsTrigger value="content-generation"><PenTool className="w-4 h-4 mr-2" />Content Generation</TabsTrigger>
          <TabsTrigger value="agent-workflow"><Brain className="w-4 h-4 mr-2" />Agent Workflow</TabsTrigger>
          <TabsTrigger value="prompt-management"><Wand2 className="w-4 h-4 mr-2" />Prompt Management</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />AI Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content-generation">
          <AIContentGenerator
            contentGeneration={contentGeneration}
            handleContentGenerationChange={handleContentGenerationChange}
            generateContent={generateContent}
          />
        </TabsContent>
        
        <TabsContent value="agent-workflow">
          <AgentWorkflow />
        </TabsContent>
        
        <TabsContent value="prompt-management">
          <PromptManagement />
        </TabsContent>
        
        <TabsContent value="analytics">
          <ContentAnalytics />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Settings</CardTitle>
              <CardDescription>Configure your AI provider API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <Input
                    id="openaiApiKey"
                    name="openaiApiKey"
                    type="password"
                    value={aiSettings.openaiApiKey}
                    onChange={handleSettingsChange}
                    placeholder="Enter your OpenAI API key"
                  />
                </div>
                <div>
                  <Label htmlFor="anthropicApiKey">Anthropic API Key</Label>
                  <Input
                    id="anthropicApiKey"
                    name="anthropicApiKey"
                    type="password"
                    value={aiSettings.anthropicApiKey}
                    onChange={handleSettingsChange}
                    placeholder="Enter your Anthropic API key"
                  />
                </div>
                <div>
                  <Label htmlFor="googleAiApiKey">Google AI API Key</Label>
                  <Input
                    id="googleAiApiKey"
                    name="googleAiApiKey"
                    type="password"
                    value={aiSettings.googleAiApiKey}
                    onChange={handleSettingsChange}
                    placeholder="Enter your Google AI API key"
                  />
                </div>
                <Button onClick={saveSettings}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DrupalAI;
