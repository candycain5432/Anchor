// Support the maker: one link, shared by onboarding, the Today banner and Me → About.
import { icon } from './icons.js';

// TODO: replace with your real donation page (Ko-fi, Buy Me a Coffee, PayPal, Stripe link…).
export const DONATE_URL = 'https://williamcain.net/donate';

/** A tappable banner card that opens the donation page in a new tab. */
export function donateBanner({ title = 'Keep Anchor free & ad-free', sub = 'Running Anchor costs money every month. A donation keeps it free for everyone, and it’s very appreciated.' } = {}) {
  return `<a class="card donate-card" href="${DONATE_URL}" target="_blank" rel="noopener">
    <span class="donate-icon" aria-hidden="true">${icon('heart')}</span>
    <span class="donate-body"><b>${title}</b><span>${sub}</span></span>
    <span class="donate-go" aria-hidden="true">${icon('external')}</span>
  </a>`;
}
