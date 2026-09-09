import { icon } from './icons.js';

export const routeLink = (route, label, className = '') => `<a href="#/${route}" class="${className}" data-route="${route}">${label}</a>`;
export const iconLink = (route, name, label, className = '') => routeLink(route, `${icon(name)}<span class="sr-only">${label}</span>`, `icon-button ${className}`);
export const button = (action, label, className = '', iconName = '') => `<button type="button" class="button ${className}" data-action="${action}">${iconName ? icon(iconName) : ''}<span>${label}</span></button>`;
export const image = (src, alt, className = '') => `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" />`;

export function brand() {
  return routeLink('home', '<img class="brand-logo" src="assets/aura-whey-logo.jpeg" alt="Aura Whey — Fuel Your Aura" width="1254" height="1254" />', 'brand');
}
