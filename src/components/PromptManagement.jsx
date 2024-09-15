import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function PromptManagement() {
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });

  useEffect(() => {
    // Load prompts from localStorage
    const savedPrompts = JSON.parse(localStorage.getItem('savedPrompts')) || [];
    setPrompts(savedPrompts);
  }, []);

  const handleSavePrompt = () => {
    if (newPrompt.name && newPrompt.content) {
      const updatedPrompts = [...prompts, newPrompt];
      setPrompts(updatedPrompts);
      localStorage.setItem('savedPrompts', JSON.stringify(updatedPrompts));
      setNewPrompt({ name: '', content: '' });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Prompt Name"
        value={newPrompt.name}
        onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
      />
      <Textarea
        placeholder="Prompt Content"
        value={newPrompt.content}
        onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
      />
      <Button onClick={handleSavePrompt}>Save Prompt</Button>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Saved Prompts</h3>
        {prompts.map((prompt, index) => (
          <div key={index} className="bg-gray-100 p-2 rounded mb-2">
            <h4 className="font-medium">{prompt.name}</h4>
            <p className="text-sm">{prompt.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PromptManagement;