import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

function AISettings() {
  const [aiSettings, setAISettings] = useState({
    openaiApiKey: '',
    anthropicApiKey: '',
    googleAiApiKey: '',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider Settings</CardTitle>
        <CardDescription>Configure your AI provider API keys</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <APIKeyInput
            label="OpenAI API Key"
            name="openaiApiKey"
            value={aiSettings.openaiApiKey}
            onChange={handleSettingsChange}
          />
          <APIKeyInput
            label="Anthropic API Key"
            name="anthropicApiKey"
            value={aiSettings.anthropicApiKey}
            onChange={handleSettingsChange}
          />
          <APIKeyInput
            label="Google AI API Key"
            name="googleAiApiKey"
            value={aiSettings.googleAiApiKey}
            onChange={handleSettingsChange}
          />
          <Button onClick={saveSettings}>Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function APIKeyInput({ label, name, value, onChange }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="password"
        value={value}
        onChange={onChange}
        placeholder={`Enter your ${label}`}
      />
    </div>
  );
}

export default AISettings;