import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

function PromptManagement() {
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });

  useEffect(() => {
    const storedPrompts = JSON.parse(localStorage.getItem('savedPrompts')) || [];
    setSavedPrompts(storedPrompts);
  }, []);

  const savePrompt = () => {
    if (newPrompt.name && newPrompt.content) {
      const updatedPrompts = [...savedPrompts, newPrompt];
      setSavedPrompts(updatedPrompts);
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      setNewPrompt({ name: '', content: '' });
      toast.success('Prompt saved successfully');
    }
  };

  return (
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
  );
}

export default PromptManagement;