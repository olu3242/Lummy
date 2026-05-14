export type CountryConfig = { countryCode: string; currency: string; vatRate?: number; payoutRestricted?: boolean; providerPriority: string[] };
export const regionalizationService = { resolve: (countryCode: string): CountryConfig => ({ countryCode, currency: 'USD', providerPriority: ['stripe'] }) };
