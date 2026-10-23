// Liturgical calendar helpers: season keys, vestment colors, rank labels, mysteries.
import { SAINT_FALLBACK } from './data/saints.js';

const SEASONS = {
  'advent': { key: 'ADVENT', label: 'Advent' },
  'christmas': { key: 'CHRISTMAS', label: 'Christmas' },
  'lent': { key: 'LENT', label: 'Lent' },
  'holy week': { key: 'HOLY_WEEK', label: 'Holy Week' },
  'eastertide': { key: 'EASTER', label: 'Eastertide' },
  'easter': { key: 'EASTER', label: 'Eastertide' },
  'ordinary time': { key: 'ORDINARY', label: 'Ordinary Time' },
};

export function season(name) {
  return SEASONS[String(name || '').toLowerCase()] || SEASONS['ordinary time'];
}

const RANKS = {
  SOLEMNITY: 'Solemnity', FEAST: 'Feast', MEMORIAL: 'Memorial',
  OPT_MEMORIAL: 'Optional Memorial', OPTIONAL_MEMORIAL: 'Optional Memorial',
  COMMEMORATION: 'Commemoration', TRIDUUM: 'Sacred Triduum', FERIA: '',
};
export function rank(type) { return RANKS[type] ?? ''; }

export function isFeria(day) { return !day?.name || !day.type || day.type === 'FERIA'; }

/** The vestment color of the day: green | violet | rose | white | red. */
export function litColor(day) {
  const s = season(day?.season).key;
  const name = String(day?.name || '');
  const feria = isFeria(day);

  if (/Palm Sunday|Good Friday|Pentecost|Holy Cross|Passion/i.test(name)) return 'red';
  if (/Holy Thursday|Easter|Holy Saturday/i.test(name)) return 'white';
  if (/3rd Sunday of Advent|Gaudete|4th Sunday of Lent|Laetare/i.test(name)) return 'rose';
  if (!feria) {
    if (/Martyr/i.test(name)) return 'red';
    if (/Apostle|Apostles|Evangelist/i.test(name) && !/John|Conversion|Chair/i.test(name)) return 'red';
    if (/Ash Wednesday|All Souls/i.test(name)) return 'violet';
    if (s === 'LENT' || s === 'HOLY_WEEK') {
      return ['SOLEMNITY', 'FEAST'].includes(day.type) ? 'white' : 'violet';
    }
    return 'white';
  }
  if (s === 'ADVENT' || s === 'LENT' || s === 'HOLY_WEEK') return 'violet';
  if (s === 'CHRISTMAS' || s === 'EASTER') return 'white';
  return 'green';
}

export const COLOR_NAMES = { green: 'Green', violet: 'Violet', rose: 'Rose', white: 'White & Gold', red: 'Red' };
export const COLOR_HEX = { green: '#3f7d4e', violet: '#6d4f9e', rose: '#c46b8d', white: '#c9a449', red: '#b03a43' };

/** True when the celebration is a person (vs. a feast of the Lord, a season day, etc). */
export function isSaint(name) {
  return /\b(Saint|Saints|St\.|Sts\.|Blessed|Bl\.|Pope|Martyr|Apostle|Our Lady|Virgin Mary|Mary,)/i.test(name || '');
}

export function saintFallback(date = new Date()) {
  const key = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  const entry = SAINT_FALLBACK[key];
  return entry ? { name: entry[0], title: entry[1] } : { name: 'All Holy Men and Women', title: 'Communion of Saints' };
}

/**
 * Traditional weekday mysteries, with the seasonal Sunday variation
 * (Joyful on Advent/Christmas Sundays, Sorrowful on Lent Sundays).
 */
export function mysterySet(date = new Date(), seasonName = '') {
  const d = date.getDay();
  const s = season(seasonName).key;
  if (d === 0) {
    if (s === 'ADVENT' || s === 'CHRISTMAS') return 'Joyful';
    if (s === 'LENT' || s === 'HOLY_WEEK') return 'Sorrowful';
    return 'Glorious';
  }
  if (d === 1 || d === 6) return 'Joyful';
  if (d === 2 || d === 5) return 'Sorrowful';
  if (d === 3) return 'Glorious';
  return 'Luminous';
}
