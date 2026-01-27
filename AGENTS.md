# Engage Package

Lead discovery & outreach feature package for Velocity.

## Overview

The Engage package provides all functionality related to:
- Lead discovery and management
- ICP (Ideal Customer Profile) management
- LinkedIn integration
- Outreach campaigns

## Structure

```
engage/
├── api/
│   ├── campaign-api.ts      # Campaign CRUD and actions
│   └── lead-watcher-api.ts  # Leads, ICP, LinkedIn API
├── components/
│   ├── campaigns/           # Campaign management UI
│   │   ├── CampaignsPage.tsx
│   │   ├── CampaignWorkflow.tsx
│   │   ├── CampaignContacts.tsx
│   │   ├── CampaignInsights.tsx
│   │   ├── CampaignSettings.tsx
│   │   └── ...
│   ├── LeadsList.tsx        # Lead management
│   ├── IcpProfilesList.tsx  # ICP management
│   ├── LeadCopilot.tsx      # AI-powered lead assistant
│   └── ...
├── types/
│   ├── campaign-types.ts
│   └── lead-watcher-types.ts
└── index.ts                 # Package exports
```

## Dependencies

This package depends on:
- `@workflows` - For the visual workflow builder
- `@/components/ui/*` - Shared UI components
- `@/lib/api/http-client` - HTTP client for API calls

## Usage

```tsx
import { 
  CampaignsPage,
  LeadsList,
  IcpProfilesList,
  campaignApi,
  leadWatcherApi,
} from '@engage';
```

## Key Components

### CampaignsPage
Main campaign management page with tabs:
- Workflow: Visual workflow builder (uses @workflows)
- Scheduled: Upcoming actions
- Contacts: Campaign contacts
- Launches: Campaign run history
- Insights: Performance analytics
- Settings: Campaign configuration

### LeadsList
Lead discovery and management with:
- Filtering by ICP, status, source
- Lead scoring visualization
- Signal badges
- Lead detail sidebar

### IcpProfilesList
Ideal Customer Profile management:
- Create/edit ICP profiles
- Define targeting criteria
- Link to LinkedIn searches
