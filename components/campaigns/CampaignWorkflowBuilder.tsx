/**
 * CampaignWorkflowBuilder - Vertical workflow builder like Zapier
 * Displays campaign steps in a vertical flow with connections
 */

import React, { useState } from 'react';
import {
  Plus,
  UserPlus,
  MessageSquare,
  Mail,
  Clock,
  GitBranch,
  MoreVertical,
  Edit2,
  Trash2,
  GripVertical,
  ChevronDown,
  Sparkles,
  Users,
  AlertCircle,
  Check,
  ArrowDown,
  Zap,
  Target,
} from 'lucide-react';
import type { Campaign, CampaignStep, StepType, StepFormData } from '@engage/types/campaign-types';
import { campaignApi } from '@engage/api/campaign-api';
import { StepEditor } from './StepEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';

interface CampaignWorkflowBuilderProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
}

const STEP_ICONS: Record<StepType, React.ElementType> = {
  invitation: UserPlus,
  message: MessageSquare,
  email: Mail,
  wait: Clock,
  condition: GitBranch,
};

const STEP_COLORS: Record<StepType, { bg: string; border: string; icon: string }> = {
  invitation: { 
    bg: 'bg-card', 
    border: 'border-border', 
    icon: 'text-blue-400'
  },
  message: { 
    bg: 'bg-card', 
    border: 'border-border', 
    icon: 'text-primary'
  },
  email: { 
    bg: 'bg-card', 
    border: 'border-border', 
    icon: 'text-blue-400'
  },
  wait: { 
    bg: 'bg-card', 
    border: 'border-border', 
    icon: 'text-muted-foreground'
  },
  condition: { 
    bg: 'bg-card', 
    border: 'border-border', 
    icon: 'text-primary'
  },
};

export const CampaignWorkflowBuilder: React.FC<CampaignWorkflowBuilderProps> = ({
  campaign,
  onUpdate,
}) => {
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [showAddStep, setShowAddStep] = useState(false);
  const [addStepAfter, setAddStepAfter] = useState<string | null>(null);

  const handleAddStep = async (data: StepFormData) => {
    try {
      await campaignApi.addStep(campaign.id, data);
      const response = await campaignApi.getCampaign(campaign.id);
      onUpdate(response.data);
      setShowAddStep(false);
      setAddStepAfter(null);
    } catch (err) {
      console.error('Failed to add step:', err);
    }
  };

  const handleUpdateStep = async (stepId: string, data: Partial<StepFormData>) => {
    try {
      await campaignApi.updateStep(campaign.id, stepId, data);
      const response = await campaignApi.getCampaign(campaign.id);
      onUpdate(response.data);
      setEditingStep(null);
    } catch (err) {
      console.error('Failed to update step:', err);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step?')) return;
    try {
      await campaignApi.deleteStep(campaign.id, stepId);
      const response = await campaignApi.getCampaign(campaign.id);
      onUpdate(response.data);
    } catch (err) {
      console.error('Failed to delete step:', err);
    }
  };

  const inputSource = campaign.input_source || { type: 'manual' as const };
  const inputDescription = inputSource.type === 'agent' 
    ? `${inputSource.agent_ids?.length || 0} agent(s)`
    : inputSource.type === 'icp_profile'
    ? `${inputSource.icp_profile_ids?.length || 0} ICP profile(s)`
    : inputSource.type === 'lead_list'
    ? 'Lead list'
    : 'Manual selection';

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Edit Link */}
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm">
            <Edit2 className="w-4 h-4 mr-1" />
            Edit Workflow
          </Button>
        </div>

        {/* Input Source Node */}
        <div className="relative">
          <Card className="hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Input Source</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{inputDescription}</p>
                  
                  {/* Agent list if applicable */}
                  {inputSource.type === 'agent' && inputSource.agent_ids && inputSource.agent_ids.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {inputSource.agent_ids.slice(0, 2).map((agentId, idx) => (
                        <div key={agentId} className="flex items-center justify-between p-2.5 bg-background rounded-lg">
                          <span className="text-sm text-foreground">Agent {idx + 1}</span>
                          <span className="flex items-center gap-1.5 text-xs text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Running
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    {campaign.stats.total_contacts} contact(s) in campaign
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connector Line */}
          <div className="flex justify-center py-2">
            <div className="w-0.5 h-8 bg-border" />
          </div>
        </div>

        {/* Workflow Steps */}
        {(campaign.steps || []).map((step, index) => (
          <WorkflowStep
            key={step.id}
            step={step}
            stepNumber={index + 1}
            isLast={index === (campaign.steps || []).length - 1}
            onEdit={() => setEditingStep(step)}
            onDelete={() => handleDeleteStep(step.id)}
            onAddAfter={() => {
              setAddStepAfter(step.id);
              setShowAddStep(true);
            }}
          />
        ))}

        {/* Add Step Button */}
        {!showAddStep && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddStepAfter(null);
                setShowAddStep(true);
              }}
              className="border-dashed hover:border-primary/50 hover:bg-primary/10"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Step
            </Button>
          </div>
        )}

        {/* Completion Node */}
        <div className="flex justify-center py-4 mt-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-primary/10 border border-primary/30 rounded-xl">
            <div className="p-1.5 bg-primary/20 rounded-lg">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Workflow Complete</p>
              <p className="text-xs text-muted-foreground">{campaign.stats.completed} contacts finished</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Editor Modal */}
      {(showAddStep || editingStep) && (
        <StepEditor
          step={editingStep}
          onSave={(data: StepFormData) => {
            if (editingStep) {
              handleUpdateStep(editingStep.id, data);
            } else {
              handleAddStep(data);
            }
          }}
          onClose={() => {
            setShowAddStep(false);
            setEditingStep(null);
            setAddStepAfter(null);
          }}
        />
      )}
    </div>
  );
};

// Individual Workflow Step Component
interface WorkflowStepProps {
  step: CampaignStep;
  stepNumber: number;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({
  step,
  stepNumber,
  isLast,
  onEdit,
  onDelete,
  onAddAfter,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = STEP_ICONS[step.type];
  const colors = STEP_COLORS[step.type];

  const getWaitText = () => {
    if (step.wait_days && step.wait_days > 0) {
      return `+${step.wait_days} day${step.wait_days > 1 ? 's' : ''}`;
    }
    if (step.wait_hours && step.wait_hours > 0) {
      return `+${step.wait_hours} hour${step.wait_hours > 1 ? 's' : ''}`;
    }
    return null;
  };

  const waitText = getWaitText();

  return (
    <div className="relative">
      {/* Wait indicator */}
      {waitText && (
        <div className="flex justify-center -mt-2 mb-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            {waitText}
          </Badge>
        </div>
      )}

      {/* Step Card */}
      <Card className={cn('group', colors.bg, colors.border, 'hover:border-primary/30 hover:ring-2 hover:ring-primary/10 transition-all')}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="p-3 bg-background border border-border rounded-xl">
              <Icon className={cn('w-6 h-6', colors.icon)} />
            </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Step {stepNumber}
                </Badge>
                <h3 className="font-semibold text-foreground">{step.name}</h3>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-8 w-8"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-xl z-10">
                      <button
                        onClick={() => { onEdit(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Step
                      </button>
                      <button
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Step
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step Details */}
            {step.type === 'invitation' && (
              <p className="text-sm text-muted-foreground mt-2">
                {step.config.include_note ? 'Invitation with personalized note' : 'Invitation without message'}
              </p>
            )}
            {step.type === 'message' && step.config.message_template && (
              <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                {step.config.use_ai_personalization && (
                  <div className="flex items-center gap-1.5 text-xs text-primary mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Personalized Message
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {step.config.message_template}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {step.stats.sent} sent
              </div>
              {step.stats.replied !== undefined && step.stats.replied > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {step.stats.replied} replied
                </div>
              )}
              {step.stats.accepted !== undefined && step.stats.accepted > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <Check className="w-3.5 h-3.5" />
                  {step.stats.accepted} accepted
                </div>
              )}
            </div>

            {/* View Contacts Button */}
            <Button variant="secondary" size="sm" className="mt-3">
              View Contacts
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Connector to next step */}
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <div className="w-0.5 h-4 bg-border" />
          <button
            onClick={onAddAfter}
            className="p-1 bg-card border border-border rounded-full hover:border-primary/50 hover:bg-primary/20 transition-all group"
          >
            <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
          </button>
          <div className="w-0.5 h-4 bg-border" />
        </div>
      )}
    </div>
  );
};

export default CampaignWorkflowBuilder;
