import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AgentWorkflow = () => {
  const [agentWorkflow, setAgentWorkflow] = useState({
    researchAgent: true,
    writingAgent: true,
    editingAgent: true,
    seoAgent: true,
  });

  useEffect(() => {
    const storedWorkflow = JSON.parse(localStorage.getItem('agentWorkflow')) || {};
    setAgentWorkflow(storedWorkflow);
  }, []);

  const handleAgentWorkflowChange = (agent) => {
    const updatedWorkflow = { ...agentWorkflow, [agent]: !agentWorkflow[agent] };
    setAgentWorkflow(updatedWorkflow);
    localStorage.setItem('agentWorkflow', JSON.stringify(updatedWorkflow));
  };

  return (
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
  );
};

export default AgentWorkflow;