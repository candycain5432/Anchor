// Nine-day novenas. `daily(day)` returns { intro?, prayer, then? } for day 1–9.
const SACRED_HEART_ASK = (n, quote, lead) =>
  `${n}. O my Jesus, You have said: “${quote}”\n${lead} the grace of… (name your request)\n\nOur Father… Hail Mary… Glory Be…\nSacred Heart of Jesus, I place all my trust in You.`;

const MERCY_DAYS = [
  ['All mankind, especially sinners', 'Today bring to Me all mankind, especially all sinners, and immerse them in the ocean of My mercy.'],
  ['Priests and religious', 'Today bring to Me the souls of priests and religious, and immerse them in My unfathomable mercy.'],
  ['All devout and faithful souls', 'Today bring to Me all devout and faithful souls, and immerse them in the ocean of My mercy.'],
  ['Those who do not believe in God, and those who do not yet know Him', 'Today bring to Me those who do not believe in God and those who do not yet know Me.'],
  ['Our separated brethren', 'Today bring to Me the souls of those who have separated themselves from My Church, and immerse them in the ocean of My mercy.'],
  ['The meek and humble, and the souls of little children', 'Today bring to Me the meek and humble souls and the souls of little children, and immerse them in My mercy.'],
  ['Those who especially venerate and glorify God’s mercy', 'Today bring to Me the souls who especially venerate and glorify My mercy, and immerse them in My mercy.'],
  ['The souls in Purgatory', 'Today bring to Me the souls who are in the prison of Purgatory, and immerse them in the abyss of My mercy.'],
  ['Souls who have become lukewarm', 'Today bring to Me souls who have become lukewarm, and immerse them in the abyss of My mercy.'],
];

export const NOVENAS = [
  {
    id: 'jude',
    name: 'Novena to St. Jude',
    sub: 'Patron of difficult and desperate cases',
    icon: '🔥',
    daily: () => ({
      prayer: `Most holy Apostle, St. Jude,\nfaithful servant and friend of Jesus,\nthe Church honors and invokes you universally\nas the patron of difficult cases,\nof things almost despaired of.\n\nPray for me, I am so helpless and alone.\nIntercede with God for me\nthat He bring visible and speedy help\nwhere help is almost despaired of.\n\nCome to my assistance in this great need,\nthat I may receive the consolation and help of heaven\nin all my necessities, tribulations, and sufferings,\nparticularly… (make your request)\nand that I may praise God with you and all the saints forever.\n\nI promise, O blessed St. Jude,\nto be ever mindful of this great favor granted me by God,\nto always honor you as my special and powerful patron,\nand to gratefully encourage devotion to you.\n\nAmen.`,
      then: 'Our Father… Hail Mary… Glory Be…',
    }),
  },
  {
    id: 'sacred-heart',
    name: 'Efficacious Novena to the Sacred Heart',
    sub: 'Prayed daily by St. Padre Pio',
    icon: '❤️',
    daily: () => ({
      prayer: [
        SACRED_HEART_ASK('I', 'Truly I say to you, ask and it will be given you; seek and you will find; knock and it will be opened to you.', 'Behold, I knock, I seek, and I ask for'),
        SACRED_HEART_ASK('II', 'Truly I say to you, if you ask anything of the Father in My name, He will give it to you.', 'Behold, in Your name, I ask the Father for'),
        SACRED_HEART_ASK('III', 'Truly I say to you, heaven and earth will pass away, but My words will not pass away.', 'Encouraged by Your infallible words, I now ask for'),
        `O Sacred Heart of Jesus,\nfor whom it is impossible not to have compassion on the afflicted,\nhave pity on us miserable sinners,\nand grant us the grace which we ask of You,\nthrough the Sorrowful and Immaculate Heart of Mary,\nYour tender Mother and ours.`,
      ].join('\n\n'),
      then: 'Pray the Hail, Holy Queen, and add: St. Joseph, foster father of Jesus, pray for us.',
    }),
  },
  {
    id: 'divine-mercy',
    name: 'Divine Mercy Novena',
    sub: 'Good Friday to Divine Mercy Sunday — or any time',
    icon: '🌊',
    daily: day => {
      const [who, words] = MERCY_DAYS[day - 1];
      return {
        intro: `Day ${day} — for ${who.charAt(0).toLowerCase() + who.slice(1)}`,
        prayer: `Jesus said to St. Faustina:\n“${words}”\n\nToday, offer the Chaplet of Divine Mercy\nfor ${who.charAt(0).toLowerCase() + who.slice(1)}.`,
        then: 'Pray the Divine Mercy Chaplet now.',
        chaplet: true,
      };
    },
  },
];
