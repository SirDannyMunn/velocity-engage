/**
 * CampaignWorkflow - Workflow builder for campaigns using @workflows package
 * Wraps the generic workflow builder with campaign-specific logic
 */

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  WorkflowCanvas,
  WorkflowToolbar,
  StepConfigSheet,
  useWorkflowState,
  useTaskSchemas,
  schemasToApps,
  type WorkflowStepData,
  type App,
} from '@workflows';
import type { Campaign } from '@engage/types/campaign-types';
import { campaignApi } from '@engage/api/campaign-api';
import { Toaster } from '@/components/ui/sonner';

interface CampaignWorkflowProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
}

/**
 * Convert campaign steps to workflow step format
 */
function campaignStepsToWorkflowSteps(campaign: Campaign): WorkflowStepData[] {
  if (!campaign.steps || campaign.steps.length === 0) {
    // Return default trigger step
    return [{
      id: 'trigger',
      type: 'trigger',
      stepNumber: 1,
      configured: false,
    }];
  }

  return campaign.steps.map((step, index) => ({
    id: step.id,
    type: index === 0 ? 'trigger' : 'action',
    stepNumber: index + 1,
    configured: true,
    app: {
      id: step.type,
      name: getStepTypeName(step.type),
      icon: getStepTypeIcon(step.type),
      category: 'Campaign',
    },
    event: step.config?.template_type || step.type,
    config: step.config,
  }));
}

function getStepTypeName(type: string): string {
  const names: Record<string, string> = {
    invitation: 'Send Connection Request',
    message: 'Send Message',
    email: 'Send Email',
    wait: 'Wait',
    condition: 'Condition',
  };
  return names[type] || type;
}

function getStepTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    invitation: '👤',
    message: '💬',
    email: '📧',
    wait: '⏳',
    condition: '🔀',
  };
  return icons[type] || '⚡';
}

export function CampaignWorkflow({ campaign, onUpdate }: CampaignWorkflowProps) {
  const { schemas, loading: schemasLoading, error: schemasError } = useTaskSchemas();
  const workflow = useWorkflowState();
  const [saving, setSaving] = useState(false);

  // Initialize workflow steps from campaign
  useEffect(() => {
    const workflowSteps = campaignStepsToWorkflowSteps(campaign);
    // We would set workflow.steps here if the hook supported it
    // For now, the workflow state is independent
  }, [campaign]);

  // Get available apps from task schemas
  const apps = schemas ? schemasToApps(schemas) : [];
  
  // Debug logging
  console.log('[CampaignWorkflow] schemas:', Object.keys(schemas || {}));
  console.log('[CampaignWorkflow] apps:', apps.length);
  console.log('[CampaignWorkflow] configSheetOpen:', workflow.configSheetOpen);
  console.log('[CampaignWorkflow] currentStep:', workflow.currentStep);

  const handleSelectApp = async (app: App, event: string) => {
    if (!workflow.currentStepId) return;
    
    // Update the workflow state
    workflow.handleSelectApp(app, event);

    // Save to backend
    try {
      setSaving(true);
      // Convert app selection to campaign step
      const stepData = {
        type: app.id as 'invitation' | 'message' | 'email' | 'wait' | 'condition',
        config: {
          template_type: event,
        },
        position: workflow.steps.findIndex(s => s.id === workflow.currentStepId),
      };

      await campaignApi.addStep(campaign.id, stepData);
      const response = await campaignApi.getCampaign(campaign.id);
      onUpdate(response.data);
    } catch (err) {
      console.error('Failed to save step:', err);
    } finally {
      setSaving(false);
    }
  };

  if (schemasLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--neon-lime)]" />
      </div>
    );
  }

  if (schemasError) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--hot-pink)]">
        <AlertCircle className="w-5 h-5 mr-2" />
        Failed to load workflow configuration
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <WorkflowToolbar
        onUndo={workflow.handleUndo}
        onTestRun={workflow.handleTestRun}
        onPublish={workflow.handlePublish}
      />

      <WorkflowCanvas
        steps={workflow.steps}
        onStepClick={workflow.handleStepClick}
        onAddStep={workflow.handleAddStep}
      />

      <StepConfigSheet
        open={workflow.configSheetOpen}
        onOpenChange={workflow.setConfigSheetOpen}
        stepType={workflow.currentStep?.type || null}
        onSelectApp={handleSelectApp}
        apps={apps}
      />

      <Toaster />
    </div>
  );
}
