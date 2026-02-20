import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CARE_LOG_FORM_CONFIG } from '@/constants/careLogFormDefaults';

export function useCareLogFormConfig() {
  return useQuery({
    queryKey: ['careLogFormConfig'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.filter({
        setting_key: 'care_log_form_config',
      });
      if (settings[0]?.setting_value) {
        const val = typeof settings[0].setting_value === 'string'
          ? JSON.parse(settings[0].setting_value)
          : settings[0].setting_value;
        return val;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
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
