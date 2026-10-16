export const DEFAULT_LANGUAGE = 'en';

export function getLanguage(pathname = window.location.pathname) {
  const [first] = pathname.split('/').filter(Boolean);
  return first && /^[a-z]{2}(-[a-z]{2})?$/.test(first) ? first : DEFAULT_LANGUAGE;
}

export function getLanguageRoot(pathname = window.location.pathname) {
  return `/${getLanguage(pathname)}`;
}
