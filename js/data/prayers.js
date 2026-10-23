// Prayer texts. Stanzas are separated by blank lines.
export const PRAYERS = {
  'Morning Offering': `O Jesus, through the Immaculate Heart of Mary,\nI offer You my prayers, works, joys, and sufferings of this day\nfor all the intentions of Your Sacred Heart,\nin union with the Holy Sacrifice of the Mass throughout the world,\n\nfor the salvation of souls,\nthe reparation of sins,\nthe reunion of all Christians,\nand in particular for the intentions of the Holy Father this month.\n\nAmen.`,
  'Evening Prayer': `O Lord, my God, I thank You that in Your goodness and mercy\nYou have seen me safely through this day.\n\nI ask forgiveness for all my sins,\nfor every thought, word, and deed that has offended You.\nPlease forgive me and help me to do better tomorrow.\n\nProtect me through the night\nand keep me safe from all danger.\nMay I rest in Your peace\nand awaken to serve You with renewed strength.\n\nI entrust myself and all I love into Your care.\nThrough Christ our Lord.\n\nAmen.`,
  'Our Father': `Our Father, Who art in heaven,\nHallowed be Thy Name.\nThy Kingdom come.\nThy Will be done, on earth as it is in Heaven.\n\nGive us this day our daily bread.\nAnd forgive us our trespasses,\nas we forgive those who trespass against us.\nAnd lead us not into temptation,\nbut deliver us from evil.\n\nAmen.`,
  'Hail Mary': `Hail Mary, full of grace, the Lord is with thee;\nblessed art thou among women,\nand blessed is the fruit of thy womb, Jesus.\n\nHoly Mary, Mother of God,\npray for us sinners,\nnow and at the hour of our death.\n\nAmen.`,
  'Glory Be': `Glory Be to the Father, and to the Son, and to the Holy Spirit.\n\nAs it was in the beginning, is now, and ever shall be, world without end.\n\nAmen.`,
  'Act of Contrition': `O my God, I am heartily sorry for having offended Thee,\nand I detest all my sins because of Thy just punishments,\nbut most of all because they offend Thee, my God,\nWho art all good and deserving of all my love.\n\nI firmly resolve, with the help of Thy grace,\nto sin no more and to avoid the near occasions of sin.\n\nAmen.`,
  'Apostles Creed': `I believe in God, the Father Almighty, Creator of Heaven and earth;\nand in Jesus Christ, His only Son, Our Lord,\nWho was conceived by the Holy Spirit,\nborn of the Virgin Mary,\nsuffered under Pontius Pilate,\nwas crucified, died, and was buried.\n\nHe descended into Hell;\nthe third day He rose again from the dead;\nHe ascended into Heaven,\nand sitteth at the right hand of God, the Father Almighty;\nfrom thence He shall come to judge the living and the dead.\n\nI believe in the Holy Spirit, the holy Catholic Church,\nthe communion of Saints, the forgiveness of sins,\nthe resurrection of the body,\nand life everlasting.\n\nAmen.`,
  'Angelus': `V. The Angel of the Lord declared unto Mary.\nR. And she conceived of the Holy Spirit.\n\nHail Mary, full of grace, the Lord is with thee;\nblessed art thou among women, and blessed is the fruit of thy womb, Jesus.\nHoly Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.\n\nV. Behold the handmaid of the Lord.\nR. Be it done unto me according to Thy Word.\n\nHail Mary…\n\nV. And the Word was made Flesh.\nR. And dwelt among us.\n\nHail Mary…\n\nV. Pray for us, O Holy Mother of God.\nR. That we may be made worthy of the promises of Christ.\n\nLet us pray:\nPour forth, we beseech Thee, O Lord, Thy grace into our hearts; that we, to whom the Incarnation of Christ, Thy Son, was made known by the message of an angel, may by His Passion and Cross be brought to the glory of His Resurrection, through the same Christ Our Lord.\n\nAmen.`,

  'Divine Mercy Chaplet': `Begin with the Apostles' Creed, one Our Father, one Hail Mary, and the Act of Contrition.\n\nOn each Our Father bead, pray:\n"Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world."\n\nOn each Hail Mary bead (10 times per decade), pray:\n"For the sake of His sorrowful Passion, have mercy on us and on the whole world."\n\nRepeat for five decades. After each decade pray once:\n"Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world."\n\nClose by praying three times:\n"Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world."\n\nFinal prayer:\nEternal God, in whom mercy is endless and the treasury of compassion inexhaustible, look kindly upon us and increase Your mercy in us, that in difficult moments we might not despair nor become despondent, but with great confidence submit ourselves to Your holy will, which is Love and Mercy itself.\n\nAmen.`,

  'Memorare': `Remember, O most gracious Virgin Mary,\nthat never was it known that anyone who fled to thy protection,\nimplored thy help, or sought thy intercession\nwas left unaided.\n\nInspired with this confidence,\nI fly to thee, O Virgin of virgins, my Mother;\nto thee do I come, before thee I stand,\nsinful and sorrowful.\n\nO Mother of the Word Incarnate,\ndespise not my petitions,\nbut in thy mercy hear and answer me.\n\nAmen.`,

  'Prayer to St. Michael': `Saint Michael the Archangel,\ndefend us in battle.\nBe our protection against the wickedness\nand snares of the devil.\n\nMay God rebuke him, we humbly pray;\nand do thou, O Prince of the Heavenly Host,\nby the power of God,\ncast into hell Satan and all the evil spirits\nwho prowl about the world\nseeking the ruin of souls.\n\nAmen.`
};

// Examination of Conscience (Confession preparation). Never persisted.
export const EXAMEN_CATEGORIES = [
  {
    title: '1st Commandment — Love of God',
    items: [
      'Have I neglected daily prayer or rushed through it without attention?',
      'Have I placed anything above God — possessions, status, or comfort?',
      'Have I doubted or despaired of God\'s mercy?',
      'Have I skipped Mass on a Sunday or Holy Day of Obligation without serious reason?',
      'Have I received the Eucharist unworthily or without preparation?',
    ]
  },
  {
    title: '2nd Commandment — Holy Name',
    items: [
      'Have I used the name of God, Jesus, or Mary carelessly or in anger?',
      'Have I made rash oaths or broken solemn promises?',
    ]
  },
  {
    title: '3rd Commandment — The Lord\'s Day',
    items: [
      'Have I failed to observe Sunday as a day of rest and worship?',
      'Have I caused others to work unnecessarily on Sunday?',
    ]
  },
  {
    title: '4th Commandment — Parents & Authority',
    items: [
      'Have I been disrespectful or disobedient to my parents or lawful superiors?',
      'Have I neglected my duties to my spouse, children, or dependents?',
    ]
  },
  {
    title: '5th Commandment — Life',
    items: [
      'Have I harmed another person physically or emotionally?',
      'Have I harbored hatred, anger, or desires for revenge?',
      'Have I been reckless with my own health — substance abuse or self-harm?',
      'Have I given scandal or led others into sin?',
    ]
  },
  {
    title: '6th & 9th Commandments — Chastity',
    items: [
      'Have I been impure in thought, word, or deed?',
      'Have I sought out impure content?',
      'Have I been immodest in speech or dress?',
      'Have I been faithful in mind and heart to my spouse?',
    ]
  },
  {
    title: '7th & 10th Commandments — Justice & Envy',
    items: [
      'Have I stolen, cheated, or failed to repay debts?',
      'Have I envied what belongs to others?',
      'Have I been fair in my business and work dealings?',
      'Have I been generous to the poor and those in need?',
    ]
  },
  {
    title: '8th Commandment — Truth',
    items: [
      'Have I lied, deceived, or damaged another\'s reputation?',
      'Have I gossiped or spread rumors about others?',
      'Have I been silent when truth required me to speak?',
    ]
  },
  {
    title: 'General Examination',
    items: [
      'Have I been proud, vain, or unwilling to accept correction?',
      'Have I been slothful in my spiritual or daily duties?',
      'Have I been grateful to God for His gifts and blessings?',
      'Is there any serious sin I have been avoiding confessing?',
    ]
  },
];

// [title, meditation] for each decade.
export const ROSARY_MYSTERIES = {
  Joyful: [
    ['The Annunciation', 'The Angel Gabriel announces to Mary that she is to be the Mother of the Son of God. She responds with complete trust: "Behold the handmaid of the Lord; be it done to me according to thy word."\n\n✦ Fruit of the mystery: Humility\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Visitation', "Mary hastens to help her cousin Elizabeth, who is with child in her old age. At Mary's greeting, John the Baptist leaps in his mother's womb and Elizabeth cries: \"Blessed art thou among women!\"\n\n✦ Fruit of the mystery: Love of Neighbor\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer"],
    ['The Nativity', 'Jesus, the eternal Son of God, is born in a stable in Bethlehem. Angels proclaim the Good News to shepherds, and wise men come from the East to adore the newborn King.\n\n✦ Fruit of the mystery: Detachment from the World\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Presentation', 'Mary and Joseph bring the infant Jesus to the Temple. The holy elder Simeon takes the Child in his arms and prophesies: "This child is destined for the fall and rise of many in Israel."\n\n✦ Fruit of the mystery: Obedience\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Finding in the Temple', "After three days of searching, Mary and Joseph find the twelve-year-old Jesus in the Temple, sitting among the teachers. He says: \"Did you not know that I must be in my Father's house?\"\n\n✦ Fruit of the mystery: Piety\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer"],
  ],
  Sorrowful: [
    ['The Agony in the Garden', 'Jesus prays in the Garden of Gethsemane, knowing His passion is at hand. He sweats blood in agony and prays: "Father, if thou art willing, remove this cup from me; nevertheless not my will, but thine, be done."\n\n✦ Fruit of the mystery: Sorrow for Sin\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Scourging at the Pillar', 'Jesus is bound to a pillar and beaten mercilessly by Roman soldiers, fulfilling the prophecy of Isaiah: "By His stripes we are healed."\n\n✦ Fruit of the mystery: Purity\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Crowning with Thorns', 'Soldiers weave a crown of thorns and press it onto the head of Jesus. They mock Him as "King of the Jews," striking and spitting on Him. He accepts this suffering in silence.\n\n✦ Fruit of the mystery: Moral Courage\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Carrying of the Cross', 'Jesus carries His heavy cross through the streets of Jerusalem toward Golgotha. He falls three times under its weight. Simon of Cyrene is compelled to help. Veronica wipes His face.\n\n✦ Fruit of the mystery: Patience\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Crucifixion', 'Jesus is nailed to the cross between two thieves and dies after three hours of agony. His last words include forgiveness for His executioners, a promise of paradise to the repentant thief, and entrusting Mary to John.\n\n✦ Fruit of the mystery: Perseverance\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
  ],
  Glorious: [
    ['The Resurrection', 'On the third day, Jesus rises gloriously from the dead, appearing first to Mary Magdalene, then to the Apostles. He says: "I am the resurrection and the life." Death is conquered and eternal life is won.\n\n✦ Fruit of the mystery: Faith\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Ascension', 'Forty days after His Resurrection, Jesus ascends bodily into Heaven from the Mount of Olives. Angels announce He will come again in the same manner.\n\n✦ Fruit of the mystery: Hope\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Descent of the Holy Spirit', 'Ten days after the Ascension, the Holy Spirit descends upon Mary and the Apostles in the Upper Room as tongues of fire. The Church is born at Pentecost.\n\n✦ Fruit of the mystery: Love of God\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Assumption', 'At the end of her earthly life, the Virgin Mary is assumed body and soul into heavenly glory — a foretaste and sign of our own resurrection.\n\n✦ Fruit of the mystery: Grace of a Happy Death\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Coronation of Mary', "The Blessed Virgin Mary is crowned Queen of Heaven and Earth by her Divine Son. She reigns as our intercessor before the throne of God, and the angels and saints rejoice.\n\n✦ Fruit of the mystery: Trust in Mary's Intercession\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer"],
  ],
  Luminous: [
    ['The Baptism in the Jordan', 'Jesus is baptized by John in the River Jordan. The heavens open, the Holy Spirit descends like a dove, and the Father proclaims: "This is my beloved Son, with whom I am well pleased."\n\n✦ Fruit of the mystery: Openness to the Holy Spirit\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['The Wedding at Cana', "At Mary's intercession, Jesus performs His first public miracle — turning water into wine at a wedding in Cana — and manifests His glory for the first time.\n\n✦ Fruit of the mystery: To Jesus through Mary\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer"],
    ['Proclamation of the Kingdom', "Jesus proclaims the Kingdom of God, calls sinners to conversion, and forgives sins. He heals the sick and feeds the multitudes, showing that God's kingdom is one of mercy.\n\n✦ Fruit of the mystery: Repentance and Trust in God\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer"],
    ['The Transfiguration', 'Jesus is transfigured in glory before Peter, James, and John on Mount Tabor. His face shines like the sun; His garments become dazzling white. Moses and Elijah appear with Him.\n\n✦ Fruit of the mystery: Desire for Holiness\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
    ['Institution of the Eucharist', 'At the Last Supper, Jesus takes bread and wine and says: "This is my Body… This is my Blood." He institutes the Most Holy Eucharist, the source and summit of Christian life.\n\n✦ Fruit of the mystery: Eucharistic Adoration\n\nPray: Our Father · 10 Hail Marys · Glory Be · Fatima Prayer'],
  ],
};

Object.assign(PRAYERS, {
  'Sign of the Cross': `In the name of the Father,\nand of the Son,\nand of the Holy Spirit.\n\nAmen.`,

  'Fatima Prayer': `O my Jesus, forgive us our sins,\nsave us from the fires of hell;\nlead all souls to Heaven,\nespecially those in most need of Thy mercy.\n\nAmen.`,

  'Hail Holy Queen': `Hail, Holy Queen, Mother of Mercy,\nour life, our sweetness and our hope!\n\nTo thee do we cry,\npoor banished children of Eve.\nTo thee do we send up our sighs,\nmourning and weeping in this valley of tears.\n\nTurn then, most gracious advocate,\nthine eyes of mercy towards us;\nand after this our exile,\nshow unto us the blessed fruit of thy womb, Jesus.\n\nO clement, O loving, O sweet Virgin Mary!\n\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.\n\nAmen.`,

  'Come Holy Spirit': `Come, Holy Spirit, fill the hearts of Thy faithful\nand kindle in them the fire of Thy love.\n\nV. Send forth Thy Spirit, and they shall be created.\nR. And Thou shalt renew the face of the earth.\n\nLet us pray:\nO God, who by the light of the Holy Spirit\ndid instruct the hearts of the faithful,\ngrant that by the same Holy Spirit\nwe may be truly wise and ever enjoy His consolations,\nthrough Christ our Lord.\n\nAmen.`,

  'Guardian Angel Prayer': `Angel of God, my guardian dear,\nto whom God's love commits me here,\never this day be at my side,\nto light and guard, to rule and guide.\n\nAmen.`,

  'Anima Christi': `Soul of Christ, sanctify me.\nBody of Christ, save me.\nBlood of Christ, inebriate me.\nWater from the side of Christ, wash me.\nPassion of Christ, strengthen me.\n\nO good Jesus, hear me.\nWithin Thy wounds hide me.\nSuffer me not to be separated from Thee.\nFrom the malicious enemy defend me.\n\nIn the hour of my death call me,\nand bid me come unto Thee,\nthat with Thy saints I may praise Thee\nforever and ever.\n\nAmen.`,

  'Act of Faith': `O my God, I firmly believe\nthat Thou art one God in three Divine Persons,\nFather, Son, and Holy Spirit.\n\nI believe that Thy Divine Son became man and died for our sins,\nand that He will come to judge the living and the dead.\n\nI believe these and all the truths\nwhich the holy Catholic Church teaches,\nbecause Thou hast revealed them,\nwho can neither deceive nor be deceived.\n\nAmen.`,

  'Act of Hope': `O my God, relying on Thy infinite goodness and promises,\nI hope to obtain pardon of my sins,\nthe help of Thy grace, and life everlasting,\nthrough the merits of Jesus Christ,\nmy Lord and Redeemer.\n\nAmen.`,

  'Act of Love': `O my God, I love Thee above all things,\nwith my whole heart and soul,\nbecause Thou art all-good and worthy of all love.\n\nI love my neighbor as myself for the love of Thee.\nI forgive all who have injured me,\nand ask pardon of all whom I have injured.\n\nAmen.`,

  'Grace Before Meals': `Bless us, O Lord, and these Thy gifts,\nwhich we are about to receive from Thy bounty,\nthrough Christ our Lord.\n\nAmen.`,

  'Grace After Meals': `We give Thee thanks, Almighty God,\nfor all Thy benefits,\nwho livest and reignest forever and ever.\n\nMay the souls of the faithful departed,\nthrough the mercy of God, rest in peace.\n\nAmen.`,

  'Spiritual Communion': `My Jesus,\nI believe that You are present in the Most Holy Sacrament.\nI love You above all things,\nand I desire to receive You into my soul.\n\nSince I cannot at this moment receive You sacramentally,\ncome at least spiritually into my heart.\n\nI embrace You as if You were already there\nand unite myself wholly to You.\nNever permit me to be separated from You.\n\nAmen.`,

  'Prayer for Peace': `Lord, make me an instrument of Your peace:\nwhere there is hatred, let me sow love;\nwhere there is injury, pardon;\nwhere there is doubt, faith;\nwhere there is despair, hope;\nwhere there is darkness, light;\nwhere there is sadness, joy.\n\nO Divine Master,\ngrant that I may not so much seek\nto be consoled as to console,\nto be understood as to understand,\nto be loved as to love.\n\nFor it is in giving that we receive,\nit is in pardoning that we are pardoned,\nand it is in dying that we are born to eternal life.\n\nAmen.`,

  'Prayer to the Sacred Heart': `O Most Sacred Heart of Jesus,\nfountain of every blessing,\nI adore You, I love You,\nand with lively sorrow for my sins\nI offer You this poor heart of mine.\n\nMake me humble, patient, pure,\nand wholly obedient to Your will.\nGrant, good Jesus, that I may live in You and for You.\n\nProtect me in the midst of danger,\ncomfort me in my afflictions,\ngive me health of body, assistance in my temporal needs,\nYour blessing on all that I do,\nand the grace of a holy death.\n\nAmen.`,
});

// How each prayer appears in the library. `cat` groups the list.
export const PRAYER_LIBRARY = [
  { name: 'Sign of the Cross',        cat: 'Essentials', sub: 'Begin every prayer' },
  { name: 'Our Father',               cat: 'Essentials', sub: "The Lord's Prayer" },
  { name: 'Hail Mary',                cat: 'Essentials', sub: 'Ave Maria' },
  { name: 'Glory Be',                 cat: 'Essentials', sub: 'Doxology' },
  { name: 'Apostles Creed',           cat: 'Essentials', sub: 'Profession of faith', title: "Apostles' Creed" },
  { name: 'Act of Contrition',        cat: 'Essentials', sub: 'For reconciliation' },
  { name: 'Morning Offering',         cat: 'Daily',      sub: 'Start your day' },
  { name: 'Angelus',                  cat: 'Daily',      sub: 'Noon devotion' },
  { name: 'Grace Before Meals',       cat: 'Daily',      sub: 'Bless us, O Lord' },
  { name: 'Grace After Meals',        cat: 'Daily',      sub: 'We give Thee thanks' },
  { name: 'Evening Prayer',           cat: 'Daily',      sub: 'End your day' },
  { name: 'Guardian Angel Prayer',    cat: 'Daily',      sub: 'Angel of God' },
  { name: 'Hail Holy Queen',          cat: 'Marian',     sub: 'Salve Regina' },
  { name: 'Memorare',                 cat: 'Marian',     sub: 'Marian intercession' },
  { name: 'Fatima Prayer',            cat: 'Marian',     sub: 'O my Jesus' },
  { name: 'Come Holy Spirit',         cat: 'Devotions',  sub: 'Veni Sancte Spiritus' },
  { name: 'Prayer to the Sacred Heart', cat: 'Devotions', sub: 'Fountain of every blessing' },
  { name: 'Anima Christi',            cat: 'Devotions',  sub: 'Soul of Christ' },
  { name: 'Spiritual Communion',      cat: 'Devotions',  sub: 'When you cannot receive' },
  { name: 'Divine Mercy Chaplet',     cat: 'Devotions',  sub: 'Overview of the chaplet' },
  { name: 'Prayer to St. Michael',    cat: 'Devotions',  sub: 'Defense against evil' },
  { name: 'Prayer for Peace',         cat: 'Devotions',  sub: 'Make me an instrument' },
  { name: 'Act of Faith',             cat: 'Theological Virtues', sub: 'I firmly believe' },
  { name: 'Act of Hope',              cat: 'Theological Virtues', sub: 'Relying on Thy goodness' },
  { name: 'Act of Love',              cat: 'Theological Virtues', sub: 'I love Thee above all' },
];

export const ROSARY_CLOSING =
  `Let us pray.\n\nO God, whose only begotten Son,\nby His life, death, and resurrection,\nhas purchased for us the rewards of eternal life,\ngrant, we beseech Thee,\nthat meditating upon these mysteries\nof the Most Holy Rosary of the Blessed Virgin Mary,\nwe may imitate what they contain\nand obtain what they promise,\nthrough the same Christ our Lord.\n\nAmen.`;

export const CHAPLET = {
  opening: `You expired, Jesus, but the source of life gushed forth for souls,\nand the ocean of mercy opened up for the whole world.\nO Fount of Life, unfathomable Divine Mercy,\nenvelop the whole world and empty Yourself out upon us.\n\nO Blood and Water, which gushed forth from the Heart of Jesus\nas a fountain of mercy for us, I trust in You!`,
  eternalFather: `Eternal Father,\nI offer You the Body and Blood, Soul and Divinity\nof Your dearly beloved Son, our Lord Jesus Christ,\nin atonement for our sins\nand those of the whole world.`,
  passion: `For the sake of His sorrowful Passion,\nhave mercy on us and on the whole world.`,
  holyGod: `Holy God, Holy Mighty One, Holy Immortal One,\nhave mercy on us and on the whole world.`,
  closing: `Eternal God, in whom mercy is endless\nand the treasury of compassion inexhaustible,\nlook kindly upon us and increase Your mercy in us,\nthat in difficult moments we might not despair\nnor become despondent,\nbut with great confidence submit ourselves to Your holy will,\nwhich is Love and Mercy itself.\n\nAmen.`,
  trust: `Jesus, I trust in You.`,
};

// The five steps of St. Ignatius' Daily Examen.
export const DAILY_EXAMEN = [
  { title: 'Become aware of God’s presence', body: 'Be still. Recall that God is here with you now, looking on you with love. Ask the Holy Spirit for light to see your day as He sees it.' },
  { title: 'Review the day with gratitude', body: 'Walk back through your day, hour by hour. Notice the gifts — people, moments, small graces. Thank God for each one.', gratitude: true },
  { title: 'Pay attention to your emotions', body: 'Where did you feel peace, joy, or closeness to God? Where did you feel restless, anxious, or far from Him? What might God be saying through these?' },
  { title: 'Choose one moment and pray from it', body: 'Pick one moment of the day — a joy to give thanks for, or a failing to bring to Him. Speak to God about it honestly. Ask forgiveness where you fell short.' },
  { title: 'Look toward tomorrow', body: 'Ask God for the grace you will need tomorrow. Make one small, concrete resolution. Close with an Our Father.', prayer: 'Our Father' },
];

export const CONFESSION_STEPS = [
  'Examine your conscience prayerfully before you go.',
  'Greet the priest. Make the Sign of the Cross and say: “Bless me, Father, for I have sinned. It has been [time] since my last confession.”',
  'Confess your sins simply and honestly — mortal sins in kind and number, and any venial sins you wish.',
  'Listen to the priest’s counsel and accept your penance.',
  'Pray the Act of Contrition when asked.',
  'Receive absolution. The priest may say “Give thanks to the Lord, for He is good” — answer “For His mercy endures forever.”',
  'Go in peace, and complete your penance soon.',
];
