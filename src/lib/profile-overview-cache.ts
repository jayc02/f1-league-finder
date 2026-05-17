export const PROFILE_OVERVIEW_CACHE_KEY = 'racehub.profileOverview.v1';

export const clearProfileOverviewCache = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PROFILE_OVERVIEW_CACHE_KEY);
};
