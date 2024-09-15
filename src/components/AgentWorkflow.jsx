import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function AgentWorkflow() {
  const [agents, setAgents] = useState({
    researcher: false,
    writer: false,
    editor: false,
    publisher: false,
  });

  const handleAgentToggle = (agent) => {
    setAgents(prev => ({ ...prev, [agent]: !prev[agent] }));
  };

  return (
    <div className="space-y-4">
      {Object.entries(agents).map(([agent, isActive]) => (
        <div key={agent} className="flex items-center space-x-2">
          <Switch
            id={agent}
            checked={isActive}
            onCheckedChange={() => handleAgentToggle(agent)}
          />
          <Label htmlFor={agent} className="capitalize">{agent}</Label>
        </div>
      ))}
    </div>
  );
}

export default AgentWorkflow;