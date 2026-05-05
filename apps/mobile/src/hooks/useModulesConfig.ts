/**
 * useModulesConfig — Hook to read and parse modules_config defensively.
 * 
 * Parses the JSON modules_config from tenant data with try/catch fallback.
 */
import { useMemo } from 'react';
import { useTenant } from './useTenant';

export interface ModulesConfig {
  has_inventory: boolean;
  has_tables: boolean;
  has_appointments: boolean;
}

const DEFAULT_CONFIG: ModulesConfig = {
  has_inventory: false,
  has_tables: false,
  has_appointments: false,
};

export const useModulesConfig = (): ModulesConfig => {
  const tenant = useTenant('');
  
  const config = useMemo(() => {
    if (!tenant?.modules_config) {
      return DEFAULT_CONFIG;
    }
    
    try {
      // modules_config can be string or object
      const raw = typeof tenant.modules_config === 'string' 
        ? JSON.parse(tenant.modules_config)
        : tenant.modules_config;
      
      return {
        has_inventory: raw?.has_inventory ?? false,
        has_tables: raw?.has_tables ?? false,
        has_appointments: raw?.has_appointments ?? false,
      };
    } catch {
      console.warn('[useModulesConfig] Failed to parse modules_config:', tenant.modules_config);
      return DEFAULT_CONFIG;
    }
  }, [tenant?.modules_config]);
  
  return config;
};