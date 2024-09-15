import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

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
    length: 'medium',
  });

  const [savedPrompts, setSavedPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setAISettings(prev => ({ ...prev, [name]: value }));
  };

  const saveSettings = () => {
    // In a real app, you'd save these securely, not to localStorage
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
    toast.success('AI settings saved successfully');
  };

  const handleContentGenerationChange = (e) => {
    const { name, value } = e.target;
    setContentGeneration(prev => ({ ...prev, [name]: value }));
  };

  const generateContent = async () => {
    // This is where you'd integrate with your chosen AI API
    console.log('Generating content with:', contentGeneration);
    toast.success('Content generated successfully');
  };

  const savePrompt = () => {
    if (newPrompt.name && newPrompt.content) {
      setSavedPrompts(prev => [...prev, newPrompt]);
      setNewPrompt({ name: '', content: '' });
      toast.success('Prompt saved successfully');
    }
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Generate AI Content</CardTitle>
              <CardDescription>Use AI to generate content for your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    name="prompt"
                    value={contentGeneration.prompt}
                    onChange={handleContentGenerationChange}
                    placeholder="Enter your content generation prompt here"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select name="contentType" value={contentGeneration.contentType} onValueChange={(value) => handleContentGenerationChange({ target: { name: 'contentType', value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="blogPost">Blog Post</SelectItem>
                        <SelectItem value="productDescription">Product Description</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="tone">Tone</Label>
                    <Select name="tone" value={contentGeneration.tone} onValueChange={(value) => handleContentGenerationChange({ target: { name: 'tone', value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="length">Length</Label>
                    <Select name="length" value={contentGeneration.length} onValueChange={(value) => handleContentGenerationChange({ target: { name: 'length', value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={generateContent}>Generate Content</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="prompt-management">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Management</CardTitle>
              <CardDescription>Save and manage your AI prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="promptName">Prompt Name</Label>
                  <Input
                    id="promptName"
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter prompt name"
                  />
                </div>
                <div>
                  <Label htmlFor="promptContent">Prompt Content</Label>
                  <Textarea
                    id="promptContent"
                    value={newPrompt.content}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter prompt content"
                  />
                </div>
                <Button onClick={savePrompt}>Save Prompt</Button>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Saved Prompts</h3>
                  {savedPrompts.map((prompt, index) => (
                    <Card key={index} className="mb-2">
                      <CardHeader>
                        <CardTitle>{prompt.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{prompt.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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