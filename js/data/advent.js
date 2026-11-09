// "Advent with Anchor": one short day of prayer for each day of Advent 2026 (Sun Nov 29 – Thu Dec 24).
// Verses are Douay-Rheims (the app's reading translation), trimmed of narrative lead-ins.
// `go` opens an existing practice or screen (see practices.launch / app.openTarget); omit it for practices done offline.

export const ADVENT_YEAR = 2026;
export const ADVENT_START = '2026-11-29';   // First Sunday of Advent
export const CHRISTMAS = '2026-12-25';

export const WEEKS = [
  { n: 1, name: 'Hope',  color: 'violet' },
  { n: 2, name: 'Peace', color: 'violet' },
  { n: 3, name: 'Joy',   color: 'rose' },   // Gaudete
  { n: 4, name: 'Love',  color: 'violet' },
];

export const DAYS = [
  // ---- Week 1: Hope ----
  { title: 'Stay awake', cite: 'Mark 13:33',
    verse: 'Take ye heed, watch and pray. For ye know not when the time is.',
    reflection: 'Advent begins with a wake-up call. It isn’t a warning to fear but an invitation: the Lord is coming, and He wants to find you awake, watching for Him in the ordinary hours of your day.',
    practice: 'Choose the time you’ll pray each day this Advent, and let Anchor remind you.', go: 'me', label: 'Set a reminder' },
  { title: 'Come, follow Me', cite: 'Matthew 4:19', feast: 'St. Andrew, Apostle',
    verse: 'Come ye after me, and I will make you to be fishers of men.',
    reflection: 'St. Andrew left his nets the moment Jesus called. Many Catholics begin the Christmas Novena on his feast, praying each day until Christmas. What could you set down this Advent to follow Him more freely?',
    practice: 'Offer this whole day to God with the Morning Offering.', go: 'morning', label: 'Pray the Morning Offering' },
  { title: 'A great light', cite: 'Isaiah 9:2',
    verse: 'The people that walked in darkness, have seen a great light: to them that dwelt in the region of the shadow of death, light is risen.',
    reflection: 'December nights are long, and some seasons of life feel the same. Isaiah promises that the light has already risen. Look for it today, even in small things.',
    practice: 'Tonight, look back on your day with God.', go: 'examen', label: 'Pray the Daily Examen' },
  { title: 'Strength renewed', cite: 'Isaiah 40:31',
    verse: 'But they that hope in the Lord shall renew their strength, they shall take wings as eagles, they shall run and not be weary, they shall walk and not faint.',
    reflection: 'Hope isn’t the same as optimism. It’s trust in Someone. When you’re tired, Advent hope says you don’t have to be strong on your own.',
    practice: 'Write down one intention you’ve been carrying alone, and give it to God.', go: 'journal', label: 'Open your journal' },
  { title: 'Waiting for God', cite: 'Micah 7:7', feast: 'St. Francis Xavier',
    verse: 'But I will look towards the Lord, I will wait for God my Saviour: my God will hear me.',
    reflection: 'We want answers now. Micah waits too, but he waits looking toward the Lord, sure that God will hear him. Bring Him whatever you’re waiting for today.',
    practice: 'Pray one decade of the Rosary for something you’re waiting on.', go: 'rosary', label: 'Pray the Rosary' },
  { title: 'Wait in silence', cite: 'Lamentations 3:25–26',
    verse: 'The Lord is good to them that hope in him, to the soul that seeketh him. It is good to wait with silence for the salvation of God.',
    reflection: 'Our days are full of noise, and silence can feel uncomfortable at first. But God often speaks most clearly in the quiet. Give Him a few minutes of it today.',
    practice: 'Sit with God in silence for ten minutes.', go: 'silence', label: 'Start the timer' },
  { title: 'From the root of Jesse', cite: 'Isaiah 11:1',
    verse: 'And there shall come forth a rod out of the root of Jesse, and a flower shall rise up out of his root.',
    reflection: 'Israel looked like a stump, cut down and finished, yet from it God brought forth the Messiah. Nothing in your life is too far gone for God to bring something new from it.',
    practice: 'Read today’s Gospel slowly, as if for the first time.', go: 'readings', label: 'Today’s readings' },

  // ---- Week 2: Peace ----
  { title: 'Prepare the way', cite: 'Mark 1:3',
    verse: 'A voice of one crying in the desert: Prepare ye the way of the Lord, make straight his paths.',
    reflection: 'John the Baptist calls us to clear a road for the Lord. Confession is the surest way to do it: whatever is blocking the path, Christ wants to take it away.',
    practice: 'Find a Confession time at a parish near you this week, and prepare for it.', go: 'confession', label: 'Prepare for Confession' },
  { title: 'Prince of Peace', cite: 'Isaiah 9:6', feast: 'St. Ambrose',
    verse: 'For a child is born to us, and a son is given to us, and the government is upon his shoulder: and his name shall be called, Wonderful, Counsellor, God the Mighty, the Father of the world to come, the Prince of Peace.',
    reflection: 'The peace Christ brings is more than the absence of conflict. It’s being reconciled with God and with one another. Is there someone you need to make peace with?',
    practice: 'Pray for someone you’ve drifted from, by name.', go: 'journal', label: 'Add an intention' },
  { title: 'Full of grace', cite: 'Luke 1:28', feast: 'The Immaculate Conception',
    verse: 'Hail, full of grace, the Lord is with thee: blessed art thou among women.',
    reflection: 'Today we celebrate Mary, preserved from all stain of sin from the first moment of her life to be the mother of God’s Son. It’s a holy day of obligation in the U.S. and many other countries, so go to Mass if you can.',
    practice: 'Pray the Angelus with Mary today.', go: 'angelus', label: 'Pray the Angelus' },
  { title: 'Come to Me', cite: 'Matthew 11:28', feast: 'St. Juan Diego',
    verse: 'Come to me, all you that labour, and are burdened, and I will refresh you.',
    reflection: 'Jesus doesn’t ask the weary to try harder. He says: come. Bring Him the burden you’re carrying, exactly as it is.',
    practice: 'Pray with today’s Gospel through Lectio Divina.', go: 'lectio', label: 'Begin Lectio Divina' },
  { title: 'My peace I give you', cite: 'John 14:27',
    verse: 'Peace I leave with you, my peace I give unto you: not as the world giveth, do I give unto you. Let not your heart be troubled, nor let it be afraid.',
    reflection: 'The world’s peace depends on things going well. Christ’s peace holds even when they don’t. “Let not your heart be troubled” is a promise, not a demand to feel calm.',
    practice: 'Pray a decade of the Rosary slowly, one bead at a time.', go: 'rosary', label: 'Pray the Rosary' },
  { title: 'Peace beyond understanding', cite: 'Philippians 4:6–7',
    verse: 'Be nothing solicitous; but in every thing, by prayer and supplication, with thanksgiving, let your petitions be made known to God. And the peace of God, which surpasseth all understanding, keep your hearts and minds in Christ Jesus.',
    reflection: 'St. Paul’s remedy for anxiety is prayer with thanksgiving. Gratitude reminds us that God has been faithful before, and will be again.',
    practice: 'Write down three gifts from today.', go: 'gratitude', label: 'Count your blessings' },
  { title: 'My soul magnifies the Lord', cite: 'Luke 1:46–47', feast: 'Our Lady of Guadalupe',
    verse: 'My soul doth magnify the Lord. And my spirit hath rejoiced in God my Saviour.',
    reflection: 'Our Lady of Guadalupe, patroness of the Americas, came to St. Juan Diego as a mother. Ask her to bring your needs to her Son.',
    practice: 'Pray the Joyful Mysteries of the Rosary.', go: 'rosary', label: 'Pray the Rosary' },

  // ---- Week 3: Joy ----
  { title: 'Rejoice', cite: 'Philippians 4:4–5', feast: 'Gaudete Sunday',
    verse: 'Rejoice in the Lord always; again, I say, rejoice. Let your modesty be known to all men. The Lord is nigh.',
    reflection: 'Today the rose candle is lit, and we’re past the halfway point. The Church calls this Gaudete Sunday, from the first word of today’s Mass: Rejoice! The Lord is near.',
    practice: 'Do one hidden act of kindness today, and tell no one.' },
  { title: 'The desert will bloom', cite: 'Isaiah 35:1', feast: 'St. John of the Cross',
    verse: 'The land that was desolate and impassable shall be glad, and the wilderness shall rejoice, and shall flourish like the lily.',
    reflection: 'St. John of the Cross knew long dry seasons in prayer, and found that God works most deeply when we feel it least. If prayer feels dry, keep going. The desert will bloom.',
    practice: 'Ten minutes of silence with God, even if it feels like nothing happens.', go: 'silence', label: 'Start the timer' },
  { title: 'He rejoices over you', cite: 'Zephaniah 3:17',
    verse: 'The Lord thy God in the midst of thee is mighty, he will save: he will rejoice over thee with gladness, he will be silent in his love, he will be joyful over thee in praise.',
    reflection: 'We often think about our joy in God. Zephaniah reveals something more surprising: God rejoices over you. Let that sink in today.',
    practice: 'Tonight, notice where God was with you today.', go: 'examen', label: 'Pray the Daily Examen' },
  { title: 'Be it done to me', cite: 'Luke 1:38',
    verse: 'Behold the handmaid of the Lord; be it done to me according to thy word.',
    reflection: 'Mary’s yes changed history. Most of our yeses are small: patience in traffic, a kind word, a task done well. Each one makes room for Christ.',
    practice: 'Pray the Angelus at noon, remembering Mary’s yes.', go: 'angelus', label: 'Pray the Angelus' },
  { title: 'God with us', cite: 'Isaiah 7:14',
    verse: 'Behold a virgin shall conceive, and bear a son, and his name shall be called Emmanuel.',
    reflection: 'Today the last days before Christmas begin, and the Church sings the ancient “O Antiphons,” calling on Christ by a new name each evening. Emmanuel means God with us: not distant, but here.',
    practice: 'Pray the Joyful Mysteries of the Rosary.', go: 'rosary', label: 'Pray the Rosary' },
  { title: 'Do not be afraid', cite: 'Matthew 1:20',
    verse: 'Joseph, son of David, fear not to take unto thee Mary thy wife, for that which is conceived in her, is of the Holy Ghost.',
    reflection: 'St. Joseph never speaks a word in the Gospels, but he listens and acts. Ask him to help you trust God’s plan when it isn’t the one you expected.',
    practice: 'Ask St. Joseph to pray for you and your family.', go: 'pray', label: 'Meet the saints' },
  { title: 'Nothing is impossible', cite: 'Luke 1:37',
    verse: 'Because no word shall be impossible with God.',
    reflection: 'The angel’s words to Mary are meant for you too. Bring God the prayer you’ve almost given up on.',
    practice: 'Add your hardest intention to your journal, and pray for it today.', go: 'journal', label: 'Open your journal' },

  // ---- Week 4: Love ----
  { title: 'Fear not, Mary', cite: 'Luke 1:30–31',
    verse: 'Fear not, Mary, for thou hast found grace with God. Behold thou shalt conceive in thy womb, and shalt bring forth a son; and thou shalt call his name Jesus.',
    reflection: 'The last candle is lit, and Christmas is almost here. If you haven’t been to Confession this Advent, this is the week. Many parishes add extra times before Christmas.',
    practice: 'Prepare for Confession, and go before Christmas.', go: 'confession', label: 'Prepare for Confession' },
  { title: 'Blessed is she who believed', cite: 'Luke 1:45',
    verse: 'And blessed art thou that hast believed, because those things shall be accomplished that were spoken to thee by the Lord.',
    reflection: 'Mary hurried to visit Elizabeth, and her visit brought joy. Love goes out to others. Who could use a visit or a call from you this week?',
    practice: 'Call or visit someone who might be lonely this Christmas.' },
  { title: 'He has done great things', cite: 'Luke 1:49–50',
    verse: 'Because he that is mighty, hath done great things to me; and holy is his name. And his mercy is from generation unto generations, to them that fear him.',
    reflection: 'Mary’s Magnificat is a song of gratitude. Look back over this Advent: what great things has God done for you, even small ones?',
    practice: 'Pray with today’s Gospel, Mary’s own song.', go: 'lectio', label: 'Begin Lectio Divina' },
  { title: 'He loved us first', cite: '1 John 4:10',
    verse: 'In this is charity: not as though we had loved God, but because he hath first loved us, and sent his Son to be a propitiation for our sins.',
    reflection: 'Everything about Christmas begins here: God loved us first. Not because we earned it, but because He is love.',
    practice: 'Thank God for three gifts from this Advent.', go: 'gratitude', label: 'Count your blessings' },
  { title: 'Born for you', cite: 'Luke 2:10–11', feast: 'Christmas Eve',
    verse: 'Fear not; for, behold, I bring you good tidings of great joy, that shall be to all the people: For, this day, is born to you a Saviour, who is Christ the Lord, in the city of David.',
    reflection: 'Tonight the waiting ends. The Savior is born, for you. Go to Mass, kneel at the manger, and welcome Him home.',
    practice: 'Go to Christmas Mass tonight or tomorrow, and bring someone with you.' },
];

const DAY_MS = 864e5;
const toUTC = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };

/** 1–26 during Advent, 0 before it starts, DAYS.length + 1 from Christmas on. */
export function adventDay(iso) {
  const n = Math.round((toUTC(iso) - toUTC(ADVENT_START)) / DAY_MS) + 1;
  return n < 1 ? 0 : Math.min(n, DAYS.length + 1);
}
/** The ISO date of day n (1-based). */
export function dayDate(n) { return new Date(toUTC(ADVENT_START) + (n - 1) * DAY_MS).toISOString().slice(0, 10); }
/** Week 1–4 for day n (Sundays start each week; the 4th week is short). */
export function weekOf(n) { return Math.min(4, Math.floor((n - 1) / 7) + 1); }
export const daysUntil = iso => Math.round((toUTC(ADVENT_START) - toUTC(iso)) / DAY_MS);
