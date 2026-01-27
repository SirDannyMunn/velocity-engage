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
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#10b981]" />
          <span className="font-medium text-white">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-xs rounded-full">
              {badge} selected
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-5 bg-black/20">{children}</div>}
    </div>
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981]/50"
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
            className={`px-3 py-2 rounded-lg text-sm text-left transition-colors truncate ${
              selected.includes(option)
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
            title={option}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#10b981]/10 text-[#10b981] rounded-lg text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => onToggle(item)}
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
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
          className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
            selected.includes(option)
              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
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
      <label className="block text-sm font-medium text-gray-400">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
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
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981]/50"
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
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#10b981]/10 text-[#10b981] rounded-lg text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
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
              <button
                onClick={() => onNavigate?.('engage-icp')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {isNew ? 'Create ICP Profile' : 'Edit ICP Profile'}
                </h1>
                <p className="text-sm text-gray-400">
                  Configure lead search criteria for Apify scraper
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Profile
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Profile Name */}
          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., SaaS Founders, Enterprise IT Directors"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981]/50 text-lg"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-medium text-white">Active Status</p>
              <p className="text-sm text-gray-400">
                Active profiles will be used for lead searches
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.is_active ? 'bg-[#10b981]' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Seniority Level
                </label>
                <OptionGrid
                  options={SENIORITY_OPTIONS}
                  selected={formData.definition.seniority || []}
                  onToggle={(opt) => toggleOption('seniority', opt)}
                  columns={4}
                />
              </div>

              {/* Functional Area */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Functional Area / Department
                </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Country
                </label>
                <SearchableMultiSelect
                  options={COUNTRY_OPTIONS}
                  selected={formData.definition.personCountry || []}
                  onToggle={(opt) => toggleOption('personCountry', opt)}
                  placeholder="Search countries..."
                  maxHeight="250px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  State / Region (US & Canada)
                </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Industry
                </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Employee Count
                </label>
                <OptionGrid
                  options={COMPANY_EMPLOYEE_SIZE_OPTIONS}
                  selected={formData.definition.companyEmployeeSize || []}
                  onToggle={(opt) => toggleOption('companyEmployeeSize', opt)}
                  columns={3}
                />
              </div>

              {/* Business Model */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Business Model
                </label>
                <OptionGrid
                  options={BUSINESS_MODEL_OPTIONS}
                  selected={formData.definition.businessModel || []}
                  onToggle={(opt) => toggleOption('businessModel', opt)}
                  columns={3}
                />
              </div>

              {/* Revenue */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Revenue Range
                </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Company HQ Country
                </label>
                <SearchableMultiSelect
                  options={COUNTRY_OPTIONS}
                  selected={formData.definition.companyCountry || []}
                  onToggle={(opt) => toggleOption('companyCountry', opt)}
                  placeholder="Search countries..."
                  maxHeight="250px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Company HQ State / Region (US & Canada)
                </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Funding Type
                </label>
                <SearchableMultiSelect
                  options={FUNDING_TYPE_OPTIONS}
                  selected={formData.definition.fundingType || []}
                  onToggle={(opt) => toggleOption('fundingType', opt)}
                  placeholder="Search funding types..."
                  maxHeight="200px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Funding From Date
                  </label>
                  <input
                    type="date"
                    value={formData.definition.fundingFromDate || ''}
                    onChange={(e) => updateDefinition('fundingFromDate', e.target.value || undefined)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10b981]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Funding To Date
                  </label>
                  <input
                    type="date"
                    value={formData.definition.fundingToDate || ''}
                    onChange={(e) => updateDefinition('fundingToDate', e.target.value || undefined)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10b981]/50"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Search Options */}
          <CollapsibleSection title="Search Options" icon={Filter}>
            <div className="space-y-6">
              {/* Include Emails */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">Include Email Addresses</p>
                    <p className="text-sm text-gray-400">
                      Fetch verified email addresses for leads
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateDefinition('includeEmails', !formData.definition.includeEmails)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.definition.includeEmails ? 'bg-[#10b981]' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      formData.definition.includeEmails ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Total Results */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Maximum Results per Search
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    value={formData.definition.totalResults || 100}
                    onChange={(e) => updateDefinition('totalResults', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#10b981]"
                  />
                  <span className="w-16 text-center text-white font-medium">
                    {formData.definition.totalResults || 100}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
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
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Domains to Exclude
                </label>
                <div className="flex gap-2">
                  <input
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
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addTag('excluded_domains', excludedDomainInput);
                      setExcludedDomainInput('');
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {(formData.definition.excluded_domains || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.definition.excluded_domains || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag('excluded_domains', tag)}
                          className="hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Keywords to Exclude
                </label>
                <div className="flex gap-2">
                  <input
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
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addTag('excluded_keywords', excludedKeywordInput);
                      setExcludedKeywordInput('');
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {(formData.definition.excluded_keywords || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.definition.excluded_keywords || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag('excluded_keywords', tag)}
                          className="hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
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
