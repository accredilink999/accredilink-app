import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CARE_LOG_FORM_CONFIG } from '@/constants/careLogFormDefaults';

/**
 * Fetch all care log form configs from the dedicated table.
 * Falls back to the legacy system_settings entry if no configs exist.
 */
export function useCareLogFormConfigs() {
  return useQuery({
    queryKey: ['careLogFormConfigs'],
    queryFn: async () => {
      try {
        const configs = await base44.entities.CareLogFormConfig.list('-created_at');
        if (configs && configs.length > 0) return configs;
      } catch (e) {
        console.warn('[useCareLogFormConfigs] New table not available, falling back to system_settings:', e);
      }
      // Fallback: legacy system_settings
      try {
        const settings = await base44.entities.SystemSettings.filter({
          setting_key: 'care_log_form_config',
        });
        if (settings[0]?.setting_value) {
          const val = typeof settings[0].setting_value === 'string'
            ? JSON.parse(settings[0].setting_value)
            : settings[0].setting_value;
          return [{ id: 'legacy', name: 'Default', scope: 'global', scope_ids: [], config: val, is_default: true }];
        }
      } catch (e) {
        console.warn('[useCareLogFormConfigs] Legacy fallback failed:', e);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Resolve which config applies for a given context.
 * Priority: client-specific > team-specific > global > defaults.
 */
export function resolveConfig(configs, { serviceUserId, teamId } = {}) {
  if (!configs || configs.length === 0) return null;

  // 1. Client-specific match
  if (serviceUserId) {
    const clientMatch = configs.find(
      c => c.scope === 'clients' && Array.isArray(c.scope_ids) && c.scope_ids.includes(serviceUserId)
    );
    if (clientMatch) return clientMatch.config;
  }

  // 2. Team-specific match
  if (teamId) {
    const teamMatch = configs.find(
      c => c.scope === 'team' && Array.isArray(c.scope_ids) && c.scope_ids.includes(teamId)
    );
    if (teamMatch) return teamMatch.config;
  }

  // 3. Global config (prefer is_default if multiple)
  const globals = configs.filter(c => c.scope === 'global');
  const defaultGlobal = globals.find(c => c.is_default);
  if (defaultGlobal) return defaultGlobal.config;
  if (globals.length > 0) return globals[0].config;

  return null;
}

/**
 * Main hook: fetches all configs and resolves the best one for context.
 * @param {{ serviceUserId?: string, teamId?: string }} context
 */
export function useCareLogFormConfig(context = {}) {
  const { data: allConfigs, ...rest } = useCareLogFormConfigs();
  const resolved = resolveConfig(allConfigs, context);
  return { data: resolved, allConfigs, ...rest };
}

export function getActiveConfig(config) {
  if (!config?.sections) return DEFAULT_CARE_LOG_FORM_CONFIG;
  return config;
}

export function getEnabledSections(config) {
  const active = getActiveConfig(config);
  return active.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);
}
