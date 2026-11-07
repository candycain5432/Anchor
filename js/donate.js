// Support the maker: one link, shared by onboarding, the Today banner and Me → About.
import { icon } from './icons.js';

// Donations go through Ko-fi: one-off or monthly, card or PayPal, no account needed.
export const DONATE_URL = 'https://ko-fi.com/williamcain';

/** A tappable banner card that opens the donation page in a new tab. */
export function donateBanner({ title = 'Buy me a coffee on Ko-fi', sub = 'Running Anchor costs money every month. A coffee on Ko-fi keeps it free and ad-free for everyone.' } = {}) {
  return `<a class="card donate-card" href="${DONATE_URL}" target="_blank" rel="noopener">
    <span class="donate-icon" aria-hidden="true">${icon('coffee')}</span>
    <span class="donate-body"><b>${title}</b><span>${sub}</span><em class="donate-kofi">ko-fi.com/williamcain</em></span>
    <span class="donate-go" aria-hidden="true">${icon('external')}</span>
  </a>`;
}
