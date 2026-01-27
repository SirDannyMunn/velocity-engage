/**
 * IcpProfileEditor Component
 * Form for creating/editing ICP profiles with Apify lead scraper options
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  Briefcase,
  MapPin,
  Building2,
  Users,
  Tag,
  Trash2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Filter,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import { IcpProfile, IcpProfileFormData, IcpDefinition } from '../types/lead-watcher-types';
import {
  BUSINESS_MODEL_OPTIONS,
  COMPANY_EMPLOYEE_SIZE_OPTIONS,
  SENIORITY_OPTIONS,
  FUNCTIONAL_OPTIONS,
  REVENUE_OPTIONS,
  FUNDING_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  COUNTRY_OPTIONS,
  US_STATE_OPTIONS,
  CANADA_PROVINCE_OPTIONS,
} from '../types/lead-form-options';
import CompetitorManager from './CompetitorManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/components/ui/utils';
import {
  pageHeaderVariants,
  headerIconVariants,
  emptyStateVariants,
} from '../styles/variants';

interface IcpProfileEditorProps {
  profileId?: string;
  onNavigate?: (page: string) => void;
  onSave?: (profile: IcpProfile) => void;
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/80 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-medium">{title}</span>
              {badge !== undefined && badge > 0 && (
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {badge} selected
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-5 bg-background/50">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Searchable multi-select component
function SearchableMultiSelect({
  options,
  selected,
  onToggle,
  placeholder = 'Search...',
  maxHeight = '200px',
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
  placeholder?: string;
  maxHeight?: string;
}) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lower = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lower));
  }, [options, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm text-left transition-colors truncate border',
              selected.includes(option)
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
            )}
            title={option}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="bg-primary/10 text-primary gap-1.5"
            >
              {item}
              <button
                type="button"
                onClick={() => onToggle(item)}
                className="hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple option grid for smaller lists
function OptionGrid({
  options,
  selected,
  onToggle,
  columns = 3,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={cn(
            'px-3 py-2 rounded-lg text-sm text-left transition-colors border',
            selected.includes(option)
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Tag input with suggestions
function TagInputField({
  label,
  value,
  tags,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
}: {
  label: string;
  value: string;
  tags: string[];
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  suggestions?: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdd();
              }
            }}
            placeholder={placeholder}
            list={`${label}-suggestions`}
          />
          {suggestions && (
            <datalist id={`${label}-suggestions`}>
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-primary/10 text-primary gap-1.5"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function IcpProfileEditor({ profileId, onNavigate, onSave }: IcpProfileEditorProps) {
  const isNew = !profileId || profileId === 'new';

  const [formData, setFormData] = useState<IcpProfileFormData>({
    name: '',
    definition: {
      personTitle: [],
      seniority: [],
      functional: [],
      personCountry: [],
      personState: [],
      industry: [],
      industryKeywords: [],
      companyEmployeeSize: [],
      companyCountry: [],
      companyState: [],
      companyDomain: [],
      businessModel: [],
      revenue: [],
      fundingType: [],
      includeEmails: true,
      totalResults: 100,
      excluded_domains: [],
      excluded_keywords: [],
    },
    is_active: true,
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tag input states
  const [titleInput, setTitleInput] = useState('');
  const [industryKeywordInput, setIndustryKeywordInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [excludedDomainInput, setExcludedDomainInput] = useState('');
  const [excludedKeywordInput, setExcludedKeywordInput] = useState('');

  useEffect(() => {
    if (!isNew && profileId) {
      loadProfile(profileId);
    }
  }, [profileId, isNew]);

  const loadProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await leadWatcherApi.getIcpProfile(id);
      const profile = response.data;
      setFormData({
        name: profile.name,
        definition: {
          // Map from API response, handling both old and new field names
          personTitle: profile.definition.personTitle || profile.definition.titles || [],
          seniority: profile.definition.seniority || [],
          functional: profile.definition.functional || [],
          personCountry: profile.definition.personCountry || profile.definition.geography || [],
          personState: profile.definition.personState || [],
          industry: profile.definition.industry || profile.definition.industries || [],
          industryKeywords: profile.definition.industryKeywords || profile.definition.keywords || [],
          companyEmployeeSize: profile.definition.companyEmployeeSize || profile.definition.company_sizes || [],
          companyCountry: profile.definition.companyCountry || profile.definition.locations || [],
          companyState: profile.definition.companyState || [],
          companyDomain: profile.definition.companyDomain || [],
          businessModel: profile.definition.businessModel || [],
          revenue: profile.definition.revenue || [],
          fundingType: profile.definition.fundingType || [],
          fundingFromDate: profile.definition.fundingFromDate,
          fundingToDate: profile.definition.fundingToDate,
          includeEmails: profile.definition.includeEmails ?? true,
          totalResults: profile.definition.totalResults || 100,
          excluded_domains: profile.definition.excluded_domains || [],
          excluded_keywords: profile.definition.excluded_keywords || [],
        },
        is_active: profile.is_active,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a profile name');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let response;
      if (isNew) {
        response = await leadWatcherApi.createIcpProfile(formData);
      } else {
        response = await leadWatcherApi.updateIcpProfile(profileId!, formData);
      }
      onSave?.(response.data);
      onNavigate?.('engage-icp');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateDefinition = (key: keyof IcpDefinition, value: any) => {
    setFormData((prev) => ({
      ...prev,
      definition: {
        ...prev.definition,
        [key]: value,
      },
    }));
  };

  const addTag = (key: keyof IcpDefinition, value: string) => {
    if (!value.trim()) return;
    const current = (formData.definition[key] as string[]) || [];
    if (!current.includes(value.trim())) {
      updateDefinition(key, [...current, value.trim()]);
    }
  };

  const removeTag = (key: keyof IcpDefinition, value: string) => {
    const current = (formData.definition[key] as string[]) || [];
    updateDefinition(key, current.filter((v) => v !== value));
  };

  const toggleOption = (key: keyof IcpDefinition, value: string) => {
    const current = (formData.definition[key] as string[]) || [];
    if (current.includes(value)) {
      updateDefinition(key, current.filter((v) => v !== value));
    } else {
      updateDefinition(key, [...current, value]);
    }
  };

  // Count selected items for badges
  const countSelected = (keys: (keyof IcpDefinition)[]) => {
    return keys.reduce((sum, key) => {
      const val = formData.definition[key];
      return sum + (Array.isArray(val) ? val.length : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className={emptyStateVariants({ className: 'flex-1' })}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate?.('engage-icp')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {isNew ? 'Create ICP Profile' : 'Edit ICP Profile'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure lead search criteria for Apify scraper
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Profile Name */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile Name *</Label>
                <Input
                  id="profile-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SaaS Founders, Enterprise IT Directors"
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Active Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Status</p>
                  <p className="text-sm text-muted-foreground">
                    Active profiles will be used for lead searches
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Person Criteria */}
          <CollapsibleSection
            title="Person Criteria"
            icon={Briefcase}
            defaultOpen={true}
            badge={countSelected(['personTitle', 'seniority', 'functional'])}
          >
            <div className="space-y-6">
              {/* Job Titles */}
              <TagInputField
                label="Job Titles (free text)"
                value={titleInput}
                tags={formData.definition.personTitle || []}
                onChange={setTitleInput}
                onAdd={() => {
                  addTag('personTitle', titleInput);
                  setTitleInput('');
                }}
                onRemove={(tag) => removeTag('personTitle', tag)}
                placeholder="e.g., CEO, VP of Engineering, Head of Marketing..."
              />

              {/* Seniority */}
              <div className="space-y-3">
                <Label>Seniority Level</Label>
                <OptionGrid
                  options={SENIORITY_OPTIONS}
                  selected={formData.definition.seniority || []}
                  onToggle={(opt) => toggleOption('seniority', opt)}
                  columns={4}
                />
              </div>

              {/* Functional Area */}
              <div className="space-y-3">
                <Label>Functional Area / Department</Label>
                <SearchableMultiSelect
                  options={FUNCTIONAL_OPTIONS}
                  selected={formData.definition.functional || []}
                  onToggle={(opt) => toggleOption('functional', opt)}
                  placeholder="Search departments..."
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Person Location */}
          <CollapsibleSection
            title="Person Location"
            icon={MapPin}
            badge={countSelected(['personCountry', 'personState'])}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Country</Label>
                <SearchableMultiSelect
                  options={COUNTRY_OPTIONS}
                  selected={formData.definition.personCountry || []}
                  onToggle={(opt) => toggleOption('personCountry', opt)}
                  placeholder="Search countries..."
                  maxHeight="250px"
                />
              </div>

              <div className="space-y-3">
                <Label>State / Region (US & Canada)</Label>
                <SearchableMultiSelect
                  options={[...US_STATE_OPTIONS, ...CANADA_PROVINCE_OPTIONS]}
                  selected={formData.definition.personState || []}
                  onToggle={(opt) => toggleOption('personState', opt)}
                  placeholder="Search states/provinces..."
                  maxHeight="200px"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Company Criteria */}
          <CollapsibleSection
            title="Company Criteria"
            icon={Building2}
            badge={countSelected(['industry', 'companyEmployeeSize', 'businessModel', 'revenue'])}
          >
            <div className="space-y-6">
              {/* Industry */}
              <div className="space-y-3">
                <Label>Industry</Label>
                <SearchableMultiSelect
                  options={INDUSTRY_OPTIONS}
                  selected={formData.definition.industry || []}
                  onToggle={(opt) => toggleOption('industry', opt)}
                  placeholder="Search industries..."
                  maxHeight="200px"
                />
              </div>

              {/* Industry Keywords */}
              <TagInputField
                label="Industry Keywords (free text)"
                value={industryKeywordInput}
                tags={formData.definition.industryKeywords || []}
                onChange={setIndustryKeywordInput}
                onAdd={() => {
                  addTag('industryKeywords', industryKeywordInput);
                  setIndustryKeywordInput('');
                }}
                onRemove={(tag) => removeTag('industryKeywords', tag)}
                placeholder="e.g., SaaS, fintech, healthtech..."
              />

              {/* Employee Size */}
              <div className="space-y-3">
                <Label>Employee Count</Label>
                <OptionGrid
                  options={COMPANY_EMPLOYEE_SIZE_OPTIONS}
                  selected={formData.definition.companyEmployeeSize || []}
                  onToggle={(opt) => toggleOption('companyEmployeeSize', opt)}
                  columns={3}
                />
              </div>

              {/* Business Model */}
              <div className="space-y-3">
                <Label>Business Model</Label>
                <OptionGrid
                  options={BUSINESS_MODEL_OPTIONS}
                  selected={formData.definition.businessModel || []}
                  onToggle={(opt) => toggleOption('businessModel', opt)}
                  columns={3}
                />
              </div>

              {/* Revenue */}
              <div className="space-y-3">
                <Label>Revenue Range</Label>
                <OptionGrid
                  options={REVENUE_OPTIONS}
                  selected={formData.definition.revenue || []}
                  onToggle={(opt) => toggleOption('revenue', opt)}
                  columns={3}
                />
              </div>

              {/* Company Domains */}
              <TagInputField
                label="Specific Company Domains (optional)"
                value={domainInput}
                tags={formData.definition.companyDomain || []}
                onChange={setDomainInput}
                onAdd={() => {
                  addTag('companyDomain', domainInput);
                  setDomainInput('');
                }}
                onRemove={(tag) => removeTag('companyDomain', tag)}
                placeholder="e.g., salesforce.com, hubspot.com..."
              />
            </div>
          </CollapsibleSection>

          {/* Company Location */}
          <CollapsibleSection
            title="Company Location"
            icon={Globe}
            badge={countSelected(['companyCountry', 'companyState'])}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Company HQ Country</Label>
                <SearchableMultiSelect
                  options={COUNTRY_OPTIONS}
                  selected={formData.definition.companyCountry || []}
                  onToggle={(opt) => toggleOption('companyCountry', opt)}
                  placeholder="Search countries..."
                  maxHeight="250px"
                />
              </div>

              <div className="space-y-3">
                <Label>Company HQ State / Region (US & Canada)</Label>
                <SearchableMultiSelect
                  options={[...US_STATE_OPTIONS, ...CANADA_PROVINCE_OPTIONS]}
                  selected={formData.definition.companyState || []}
                  onToggle={(opt) => toggleOption('companyState', opt)}
                  placeholder="Search states/provinces..."
                  maxHeight="200px"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Funding Criteria */}
          <CollapsibleSection
            title="Funding Criteria"
            icon={TrendingUp}
            badge={countSelected(['fundingType'])}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Funding Type</Label>
                <SearchableMultiSelect
                  options={FUNDING_TYPE_OPTIONS}
                  selected={formData.definition.fundingType || []}
                  onToggle={(opt) => toggleOption('fundingType', opt)}
                  placeholder="Search funding types..."
                  maxHeight="200px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="funding-from">Funding From Date</Label>
                  <Input
                    id="funding-from"
                    type="date"
                    value={formData.definition.fundingFromDate || ''}
                    onChange={(e) => updateDefinition('fundingFromDate', e.target.value || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="funding-to">Funding To Date</Label>
                  <Input
                    id="funding-to"
                    type="date"
                    value={formData.definition.fundingToDate || ''}
                    onChange={(e) => updateDefinition('fundingToDate', e.target.value || undefined)}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Search Options */}
          <CollapsibleSection title="Search Options" icon={Filter}>
            <div className="space-y-6">
              {/* Include Emails */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Include Email Addresses</p>
                        <p className="text-sm text-muted-foreground">
                          Fetch verified email addresses for leads
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.definition.includeEmails || false}
                      onCheckedChange={(checked) => updateDefinition('includeEmails', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Total Results */}
              <div className="space-y-3">
                <Label>Maximum Results per Search</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    min={10}
                    max={500}
                    step={10}
                    value={[formData.definition.totalResults || 100]}
                    onValueChange={(value) => updateDefinition('totalResults', value[0])}
                    className="flex-1"
                  />
                  <span className="w-16 text-center font-medium">
                    {formData.definition.totalResults || 100}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher values will consume more Apify credits per search
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Exclusions */}
          <CollapsibleSection
            title="Exclusions"
            icon={Trash2}
            badge={countSelected(['excluded_domains', 'excluded_keywords'])}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Domains to Exclude</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={excludedDomainInput}
                    onChange={(e) => setExcludedDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('excluded_domains', excludedDomainInput);
                        setExcludedDomainInput('');
                      }
                    }}
                    placeholder="e.g., competitor.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      addTag('excluded_domains', excludedDomainInput);
                      setExcludedDomainInput('');
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {(formData.definition.excluded_domains || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.definition.excluded_domains || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-destructive/10 text-destructive gap-1.5"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag('excluded_domains', tag)}
                          className="hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Keywords to Exclude</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={excludedKeywordInput}
                    onChange={(e) => setExcludedKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('excluded_keywords', excludedKeywordInput);
                        setExcludedKeywordInput('');
                      }
                    }}
                    placeholder="e.g., freelancer, student"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      addTag('excluded_keywords', excludedKeywordInput);
                      setExcludedKeywordInput('');
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {(formData.definition.excluded_keywords || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.definition.excluded_keywords || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-destructive/10 text-destructive gap-1.5"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag('excluded_keywords', tag)}
                          className="hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Competitors Section - Only show for existing profiles */}
          {!isNew && profileId && (
            <CollapsibleSection
              title="Competitors"
              icon={Building2}
              defaultOpen={false}
              badge={undefined}
            >
              <CompetitorManager
                icpProfileId={profileId}
                icpProfileName={formData.name}
              />
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}

export default IcpProfileEditor;
