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
    bg: 'bg-[var(--charcoal)]', 
    border: 'border-[var(--steel-gray)]/20', 
    icon: 'text-[var(--cyber-blue)]'
  },
  message: { 
    bg: 'bg-[var(--charcoal)]', 
    border: 'border-[var(--steel-gray)]/20', 
    icon: 'text-[var(--neon-lime)]'
  },
  email: { 
    bg: 'bg-[var(--charcoal)]', 
    border: 'border-[var(--steel-gray)]/20', 
    icon: 'text-[var(--cyber-blue)]'
  },
  wait: { 
    bg: 'bg-[var(--charcoal)]', 
    border: 'border-[var(--steel-gray)]/20', 
    icon: 'text-[var(--steel-gray)]'
  },
  condition: { 
    bg: 'bg-[var(--charcoal)]', 
    border: 'border-[var(--steel-gray)]/20', 
    icon: 'text-[var(--neon-lime)]'
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
          <button className="flex items-center gap-1 text-sm text-[var(--steel-gray)] hover:text-[var(--neon-lime)] transition-colors">
            <Edit2 className="w-4 h-4" />
            Edit Workflow
          </button>
        </div>

        {/* Input Source Node */}
        <div className="relative">
          <div className="p-5 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-2xl hover:border-[var(--neon-lime)]/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--neon-lime)]/10 rounded-xl">
                <Target className="w-6 h-6 text-[var(--neon-lime)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Input Source</h3>
                  <button className="p-1.5 text-[var(--steel-gray)] hover:text-white hover:bg-[var(--steel-gray)]/20 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[var(--steel-gray)] mt-1">{inputDescription}</p>
                
                {/* Agent list if applicable */}
                {inputSource.type === 'agent' && inputSource.agent_ids && inputSource.agent_ids.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {inputSource.agent_ids.slice(0, 2).map((agentId, idx) => (
                      <div key={agentId} className="flex items-center justify-between p-2.5 bg-[var(--void-black)] rounded-lg">
                        <span className="text-sm text-white">Agent {idx + 1}</span>
                        <span className="flex items-center gap-1.5 text-xs text-[var(--neon-lime)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-lime)] animate-pulse" />
                          Running
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-xs text-[var(--steel-gray)]">
                  {campaign.stats.total_contacts} contact(s) in campaign
                </div>
              </div>
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex justify-center py-2">
            <div className="w-0.5 h-8 bg-[var(--steel-gray)]/30" />
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
            <button
              onClick={() => {
                setAddStepAfter(null);
                setShowAddStep(true);
              }}
              className="group flex items-center gap-2 px-4 py-3 bg-[var(--charcoal)] border border-dashed border-[var(--steel-gray)]/30 rounded-xl hover:border-[var(--neon-lime)]/50 hover:bg-[var(--neon-lime)]/10 transition-all"
            >
              <Plus className="w-5 h-5 text-[var(--steel-gray)] group-hover:text-[var(--neon-lime)]" />
              <span className="text-sm font-medium text-[var(--steel-gray)] group-hover:text-[var(--neon-lime)]">Add Step</span>
            </button>
          </div>
        )}

        {/* Completion Node */}
        <div className="flex justify-center py-4 mt-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-[var(--neon-lime)]/10 border border-[var(--neon-lime)]/30 rounded-xl">
            <div className="p-1.5 bg-[var(--neon-lime)]/20 rounded-lg">
              <Check className="w-4 h-4 text-[var(--neon-lime)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--neon-lime)]">Workflow Complete</p>
              <p className="text-xs text-[var(--steel-gray)]">{campaign.stats.completed} contacts finished</p>
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
          <span className="px-3 py-1.5 bg-[var(--charcoal)] text-[var(--steel-gray)] text-xs font-medium rounded-full border border-[var(--steel-gray)]/20">
            <Clock className="w-3 h-3 inline mr-1.5" />
            {waitText}
          </span>
        </div>
      )}

      {/* Step Card */}
      <div className={`group relative p-5 ${colors.bg} border ${colors.border} rounded-2xl hover:border-[var(--neon-lime)]/30 hover:ring-2 hover:ring-[var(--neon-lime)]/10 transition-all`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 bg-[var(--void-black)] border border-[var(--steel-gray)]/20 rounded-xl`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[var(--void-black)] rounded text-xs text-[var(--steel-gray)]">
                  Step {stepNumber}
                </span>
                <h3 className="font-semibold text-white">{step.name}</h3>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onEdit}
                  className="p-1.5 text-[var(--steel-gray)] hover:text-white hover:bg-[var(--steel-gray)]/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 text-[var(--steel-gray)] hover:text-white hover:bg-[var(--steel-gray)]/20 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-lg shadow-xl z-10">
                      <button
                        onClick={() => { onEdit(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-[var(--steel-gray)]/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Step
                      </button>
                      <button
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--hot-pink)] hover:bg-[var(--hot-pink)]/10 transition-colors"
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
              <p className="text-sm text-[var(--steel-gray)] mt-2">
                {step.config.include_note ? 'Invitation with personalized note' : 'Invitation without message'}
              </p>
            )}
            {step.type === 'message' && step.config.message_template && (
              <div className="mt-3 p-3 bg-[var(--void-black)] rounded-lg border border-[var(--steel-gray)]/10">
                {step.config.use_ai_personalization && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--neon-lime)] mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Personalized Message
                  </div>
                )}
                <p className="text-sm text-[var(--steel-gray)] line-clamp-2">
                  {step.config.message_template}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--steel-gray)]">
                <Users className="w-3.5 h-3.5" />
                {step.stats.sent} sent
              </div>
              {step.stats.replied !== undefined && step.stats.replied > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--neon-lime)]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {step.stats.replied} replied
                </div>
              )}
              {step.stats.accepted !== undefined && step.stats.accepted > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--cyber-blue)]">
                  <Check className="w-3.5 h-3.5" />
                  {step.stats.accepted} accepted
                </div>
              )}
            </div>

            {/* View Contacts Button */}
            <button className="mt-3 px-3 py-1.5 text-xs text-[var(--steel-gray)] bg-[var(--void-black)] hover:bg-[var(--steel-gray)]/10 rounded-lg transition-colors">
              View Contacts
            </button>
          </div>
        </div>
      </div>

      {/* Connector to next step */}
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <div className="w-0.5 h-4 bg-[var(--steel-gray)]/30" />
          <button
            onClick={onAddAfter}
            className="p-1 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-full hover:border-[var(--neon-lime)]/50 hover:bg-[var(--neon-lime)]/20 transition-all group"
          >
            <Plus className="w-3 h-3 text-[var(--steel-gray)] group-hover:text-[var(--neon-lime)]" />
          </button>
          <div className="w-0.5 h-4 bg-[var(--steel-gray)]/30" />
        </div>
      )}
    </div>
  );
};

export default CampaignWorkflowBuilder;
