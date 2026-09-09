import { icon } from './icons.js';

export function Accordion(items, limit = items.length) {
  const visibleItems = items.slice(0, limit);
  return `<div class="accordion">${visibleItems.map(([question, answer], index) => `<div><button type="button" data-action="faq-${index}" aria-expanded="false"><span>${question}</span>${icon('chevron')}</button><div class="accordion-panel" hidden>${answer}</div></div>`).join('')}</div>`;
}
