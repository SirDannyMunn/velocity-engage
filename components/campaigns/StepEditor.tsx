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

interface StepEditorProps {
  step?: CampaignStep | null;
  onSave: (data: StepFormData) => void;
  onClose: () => void;
}

const STEP_OPTIONS: { type: StepType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { 
    type: 'invitation', 
    label: 'Send Invitation', 
    description: 'Send a LinkedIn connection request',
    icon: UserPlus,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/40'
  },
  { 
    type: 'message', 
    label: 'Send Message', 
    description: 'Send a direct message to connected contacts',
    icon: MessageSquare,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/40'
  },
  { 
    type: 'email', 
    label: 'Send Email', 
    description: 'Send an email (if email available)',
    icon: Mail,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40'
  },
  { 
    type: 'wait', 
    label: 'Wait', 
    description: 'Wait before the next action',
    icon: Clock,
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/40'
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
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.include_note || false}
                  onChange={(e) => setConfig(prev => ({ ...prev, include_note: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-white">Include personalized note</span>
              </label>
            </div>

            {config.include_note && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-400">Connection Note</label>
                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Assist
                  </button>
                </div>
                
                <textarea
                  value={config.note_template || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, note_template: e.target.value }))}
                  placeholder="Hi {{first_name}}, I noticed we're both interested in..."
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    Use variables: {"{{first_name}}, {{company}}, {{title}}"}
                  </span>
                  <span className={`${(config.note_template?.length || 0) > 280 ? 'text-red-400' : 'text-zinc-500'}`}>
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
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AI Personalization</p>
                  <p className="text-xs text-zinc-400">Customize each message using AI</p>
                </div>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, use_ai_personalization: !prev.use_ai_personalization }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  config.use_ai_personalization ? 'bg-purple-500' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    config.use_ai_personalization ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Message Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-400">Message</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMessage}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleGenerateAI()}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                </div>
              </div>

              <textarea
                value={config.message_template || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, message_template: e.target.value }))}
                placeholder="Hi {{first_name}}, I came across your profile and..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                rows={5}
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Keep it under 300 characters • Be conversational • No sales pitch
                </span>
                <span className={`${(config.message_template?.length || 0) > 300 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {config.message_template?.length || 0} chars
                </span>
              </div>
            </div>

            {/* AI Prompt Suggestions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Lightbulb className="w-3.5 h-3.5" />
                Quick AI prompts
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_TEMPLATES.initial_dm.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenerateAI(prompt)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Variations */}
            {aiVariations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-400">Alternative versions:</p>
                <div className="space-y-2">
                  {aiVariations.map((variation, idx) => (
                    <button
                      key={idx}
                      onClick={() => setConfig(prev => ({ ...prev, message_template: variation }))}
                      className="w-full p-3 text-left text-sm bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-lg text-zinc-300 transition-all"
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
            <p className="text-sm text-zinc-400">
              Wait before executing the next step
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Days</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={waitDays}
                  onChange={(e) => setWaitDays(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={waitHours}
                  onChange={(e) => setWaitHours(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Tip: Wait 1-3 days between messages for best results
            </p>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Subject Line</label>
              <input
                type="text"
                value={config.subject_template || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, subject_template: e.target.value }))}
                placeholder="Quick question about {{company}}"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email Body</label>
              <textarea
                value={config.body_template || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, body_template: e.target.value }))}
                placeholder="Hi {{first_name}},&#10;&#10;I noticed..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit Step' : 'Add Step'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-6">
          {/* Step Type Selection (only for new steps) */}
          {!isEditing && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400">Step Type</label>
              <div className="grid grid-cols-2 gap-3">
                {STEP_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = stepType === option.type;
                  return (
                    <button
                      key={option.type}
                      onClick={() => setStepType(option.type)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${option.color}`
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? option.color.split(' ')[0] : 'text-zinc-400'}`} />
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Step Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Initial Connection"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Wait Time (for non-first steps) */}
          {stepType !== 'wait' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400">Wait before this step</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={waitDays}
                    onChange={(e) => setWaitDays(parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-center"
                  />
                  <span className="text-sm text-zinc-400">days</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={waitHours}
                    onChange={(e) => setWaitHours(parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-center"
                  />
                  <span className="text-sm text-zinc-400">hours</span>
                </div>
              </div>
            </div>
          )}

          {/* Step-specific configuration */}
          {renderStepConfig()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            {isEditing ? 'Save Changes' : 'Add Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepEditor;
