/**
 * StepEditor - Modal for editing campaign steps with AI messaging
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  MessageSquare,
  Mail,
  Clock,
  GitBranch,
  Sparkles,
  Loader2,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import type { CampaignStep, StepFormData, StepType, StepConfig } from '@engage/types/campaign-types';
import { campaignApi } from '@engage/api/campaign-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/components/ui/utils';

interface StepEditorProps {
  step?: CampaignStep | null;
  onSave: (data: StepFormData) => void;
  onClose: () => void;
}

const STEP_OPTIONS: { type: StepType; label: string; description: string; icon: React.ElementType; variant: string }[] = [
  { 
    type: 'invitation', 
    label: 'Send Invitation', 
    description: 'Send a LinkedIn connection request',
    icon: UserPlus,
    variant: 'bg-primary/20 border-primary/40 text-primary'
  },
  { 
    type: 'message', 
    label: 'Send Message', 
    description: 'Send a direct message to connected contacts',
    icon: MessageSquare,
    variant: 'bg-secondary border-secondary-foreground/40 text-secondary-foreground'
  },
  { 
    type: 'email', 
    label: 'Send Email', 
    description: 'Send an email (if email available)',
    icon: Mail,
    variant: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
  },
  { 
    type: 'wait', 
    label: 'Wait', 
    description: 'Wait before the next action',
    icon: Clock,
    variant: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
  },
];

const AI_TEMPLATES = {
  invitation: [
    "Generate a brief, friendly connection request",
    "Write a warm intro mentioning their recent activity",
    "Create a professional connection note under 30 words",
  ],
  initial_dm: [
    "Write an opening message that starts a conversation",
    "Create a value-first message with no sales pitch",
    "Draft a curiosity-driven message about their work",
  ],
  followup: [
    "Write a gentle follow-up without being pushy",
    "Create a value-add follow-up with relevant insight",
    "Draft a conversation-starter follow-up",
  ],
};

export const StepEditor: React.FC<StepEditorProps> = ({
  step,
  onSave,
  onClose,
}) => {
  const isEditing = !!step;
  const [stepType, setStepType] = useState<StepType>(step?.type || 'invitation');
  const [name, setName] = useState(step?.name || '');
  const [config, setConfig] = useState<StepConfig>(step?.config || {});
  const [waitDays, setWaitDays] = useState(step?.wait_days || 1);
  const [waitHours, setWaitHours] = useState(step?.wait_hours || 0);
  
  // AI Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiVariations, setAiVariations] = useState<string[]>([]);
  const [selectedAiPrompt, setSelectedAiPrompt] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set default name based on type
  useEffect(() => {
    if (!isEditing && !name) {
      const option = STEP_OPTIONS.find(o => o.type === stepType);
      if (option) {
        setName(option.label);
      }
    }
  }, [stepType, isEditing]);

  const handleSave = () => {
    onSave({
      type: stepType,
      name: name || STEP_OPTIONS.find(o => o.type === stepType)?.label || 'Step',
      config,
      wait_days: waitDays,
      wait_hours: waitHours,
    });
  };

  const handleGenerateAI = async (prompt?: string) => {
    setIsGenerating(true);
    try {
      const response = await campaignApi.generateMessage({
        lead_id: 'preview', // Will be replaced with actual lead
        step_type: stepType === 'invitation' ? 'invitation' : 'initial_dm',
        context: {
          custom_instructions: prompt || selectedAiPrompt,
        },
      });
      
      // Update the message template
      setConfig(prev => ({ ...prev, message_template: response.message }));
      
      // Store variations if available
      if (response.alternatives) {
        setAiVariations(response.alternatives);
      }
    } catch (err) {
      console.error('Failed to generate message:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = () => {
    if (config.message_template) {
      navigator.clipboard.writeText(config.message_template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderStepConfig = () => {
    switch (stepType) {
      case 'invitation':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_note"
                checked={config.include_note || false}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, include_note: checked as boolean }))}
              />
              <Label htmlFor="include_note">Include personalized note</Label>
            </div>

            {config.include_note && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Connection Note</Label>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAiPanel(!showAiPanel)}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Assist
                  </Button>
                </div>
                
                <textarea
                  value={config.note_template || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, note_template: e.target.value }))}
                  placeholder="Hi {{first_name}}, I noticed we're both interested in..."
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Use variables: {"{{first_name}}, {{company}}, {{title}}"}
                  </span>
                  <span className={cn(
                    (config.note_template?.length || 0) > 280 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {config.note_template?.length || 0}/300
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            {/* AI Personalization Toggle */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">AI Personalization</p>
                  <p className="text-xs text-muted-foreground">Customize each message using AI</p>
                </div>
              </div>
              <Switch
                checked={config.use_ai_personalization || false}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_ai_personalization: checked }))}
              />
            </div>

            {/* Message Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyMessage}
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGenerateAI()}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-1" />
                    )}
                    Generate
                  </Button>
                </div>
              </div>

              <textarea
                value={config.message_template || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, message_template: e.target.value }))}
                placeholder="Hi {{first_name}}, I came across your profile and..."
                className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={5}
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Keep it under 300 characters • Be conversational • No sales pitch
                </span>
                <span className={cn(
                  (config.message_template?.length || 0) > 300 ? 'text-amber-400' : 'text-muted-foreground'
                )}>
                  {config.message_template?.length || 0} chars
                </span>
              </div>
            </div>

            {/* AI Prompt Suggestions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3.5 h-3.5" />
                Quick AI prompts
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_TEMPLATES.initial_dm.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAI(prompt)}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Variations */}
            {aiVariations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Alternative versions:</p>
                <div className="space-y-2">
                  {aiVariations.map((variation, idx) => (
                    <button
                      key={idx}
                      onClick={() => setConfig(prev => ({ ...prev, message_template: variation }))}
                      className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted border border-border hover:border-primary/50 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    >
                      {variation}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'wait':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wait before executing the next step
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Days</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={waitDays}
                  onChange={(e) => setWaitDays(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={waitHours}
                  onChange={(e) => setWaitHours(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Wait 1-3 days between messages for best results
            </p>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                type="text"
                value={config.subject_template || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, subject_template: e.target.value }))}
                placeholder="Quick question about {{company}}"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body</Label>
              <textarea
                value={config.body_template || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, body_template: e.target.value }))}
                placeholder="Hi {{first_name}},&#10;&#10;I noticed..."
                className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={8}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle>
            {isEditing ? 'Edit Step' : 'Add Step'}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {/* Step Type Selection (only for new steps) */}
          {!isEditing && (
            <div className="space-y-3">
              <Label>Step Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {STEP_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = stepType === option.type;
                  return (
                    <button
                      key={option.type}
                      onClick={() => setStepType(option.type)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? option.variant
                          : 'border-border hover:border-muted-foreground bg-muted/50'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 mb-2', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step Name */}
          <div className="space-y-2">
            <Label>Step Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Initial Connection"
            />
          </div>

          {/* Wait Time (for non-first steps) */}
          {stepType !== 'wait' && (
            <div className="space-y-3">
              <Label>Wait before this step</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={waitDays}
                    onChange={(e) => setWaitDays(parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={waitHours}
                    onChange={(e) => setWaitHours(parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>
            </div>
          )}

          {/* Step-specific configuration */}
          {renderStepConfig()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-muted/50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Add Step'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StepEditor;
