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
    length: 50,
  });

  const [savedPrompts, setSavedPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });
  const [agentWorkflow, setAgentWorkflow] = useState({
    researchAgent: true,
    writingAgent: true,
    editingAgent: true,
    seoAgent: true,
  });

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('aiSettings')) || {};
    const storedPrompts = JSON.parse(localStorage.getItem('savedPrompts')) || [];
    const storedWorkflow = JSON.parse(localStorage.getItem('agentWorkflow')) || {};
    setAISettings(storedSettings);
    setSavedPrompts(storedPrompts);
    setAgentWorkflow(storedWorkflow);
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

  const savePrompt = () => {
    if (newPrompt.name && newPrompt.content) {
      const updatedPrompts = [...savedPrompts, newPrompt];
      setSavedPrompts(updatedPrompts);
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      setNewPrompt({ name: '', content: '' });
      toast.success('Prompt saved successfully');
    }
  };

  const handleAgentWorkflowChange = (agent) => {
    const updatedWorkflow = { ...agentWorkflow, [agent]: !agentWorkflow[agent] };
    setAgentWorkflow(updatedWorkflow);
    localStorage.setItem('agentWorkflow', JSON.stringify(updatedWorkflow));
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
                    value={contentGeneration.prompt}
                    onChange={(e) => handleContentGenerationChange('prompt', e.target.value)}
                    placeholder="Enter your content generation prompt here"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select value={contentGeneration.contentType} onValueChange={(value) => handleContentGenerationChange('contentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="blogPost">Blog Post</SelectItem>
                        <SelectItem value="productDescription">Product Description</SelectItem>
                        <SelectItem value="socialMedia">Social Media Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={contentGeneration.tone} onValueChange={(value) => handleContentGenerationChange('tone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="length">Content Length (words)</Label>
                  <Slider
                    id="length"
                    min={50}
                    max={1000}
                    step={50}
                    value={[contentGeneration.length]}
                    onValueChange={(value) => handleContentGenerationChange('length', value[0])}
                  />
                  <div className="text-center mt-2">{contentGeneration.length} words</div>
                </div>
                <Button onClick={generateContent}><Zap className="w-4 h-4 mr-2" />Generate Content</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agent-workflow">
          <Card>
            <CardHeader>
              <CardTitle>Agent Workflow</CardTitle>
              <CardDescription>Customize your AI agent workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(agentWorkflow).map(([agent, isEnabled]) => (
                  <div key={agent} className="flex items-center justify-between">
                    <Label htmlFor={agent}>{agent.charAt(0).toUpperCase() + agent.slice(1)} Agent</Label>
                    <Switch
                      id={agent}
                      checked={isEnabled}
                      onCheckedChange={() => handleAgentWorkflowChange(agent)}
                    />
                  </div>
                ))}
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
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>View performance metrics for your AI-generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analytics dashboard coming soon...</p>
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
