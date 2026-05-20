const isProd = import.meta.env.PROD;
const parseFlag = (value: string | undefined, defaultValue = false) => (value ?? '').toLowerCase() === 'true' ? true : defaultValue;

export const raceTokensEnabled = parseFlag(import.meta.env.RACE_TOKENS_ENABLED, !isProd);
export const tokenPurchasesEnabled = raceTokensEnabled && (isProd ? parseFlag(import.meta.env.RACE_TOKEN_PURCHASES_ENABLED, false) : parseFlag(import.meta.env.RACE_TOKEN_PURCHASES_ENABLED, false));
export const legalApprovedTokenPots = parseFlag(import.meta.env.LEGAL_APPROVED_TOKEN_POTS, false);
export const tokenPotRewardsEnabled = raceTokensEnabled && (!isProd || (parseFlag(import.meta.env.RACE_TOKEN_POT_REWARDS_ENABLED, false) && legalApprovedTokenPots));

export const tokenPotDuelsCreationEnabled = raceTokensEnabled && (!isProd || legalApprovedTokenPots);
