#!/usr/bin/env node
/**
 * Genera il calendario ufficiale LND Serie D 2026/27, Girone E.
 * Fonte: https://lnd.it/seried/calendari-campionato-2026-2027/
 * File LND: https://lnd.it/wp-content/uploads/2026/08/Girone-E.xls
 */

const firstLegRounds = [
  [
    [
      "Flaminia Civitacastellana",
      "GSD Ghiviborgo VDS"
    ],
    [
      "US Follonica Gavorrano",
      "Grassina"
    ],
    [
      "Lucchese Calcio",
      "Aquila Montevarchi"
    ],
    [
      "Mezzolara",
      "Rondinella Marzocco"
    ],
    [
      "AC Prato",
      "Nuova Ternana"
    ],
    [
      "San Donato Tavarnelle",
      "Seravezza Pozzi"
    ],
    [
      "FC Scandicci 1908",
      "Siena FC"
    ],
    [
      "Tau Calcio Altopascio",
      "Progresso"
    ],
    [
      "Terranuova Traiana",
      "Sasso Marconi"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Tau Calcio Altopascio"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Terranuova Traiana"
    ],
    [
      "Grassina",
      "Flaminia Civitacastellana"
    ],
    [
      "Nuova Ternana",
      "US Follonica Gavorrano"
    ],
    [
      "Progresso",
      "FC Scandicci 1908"
    ],
    [
      "Rondinella Marzocco",
      "AC Prato"
    ],
    [
      "Sasso Marconi",
      "San Donato Tavarnelle"
    ],
    [
      "Seravezza Pozzi",
      "Lucchese Calcio"
    ],
    [
      "Siena FC",
      "Mezzolara"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "Sasso Marconi"
    ],
    [
      "US Follonica Gavorrano",
      "GSD Ghiviborgo VDS"
    ],
    [
      "Lucchese Calcio",
      "Progresso"
    ],
    [
      "Mezzolara",
      "Nuova Ternana"
    ],
    [
      "AC Prato",
      "Grassina"
    ],
    [
      "FC Scandicci 1908",
      "Rondinella Marzocco"
    ],
    [
      "Seravezza Pozzi",
      "Aquila Montevarchi"
    ],
    [
      "Tau Calcio Altopascio",
      "Siena FC"
    ],
    [
      "Terranuova Traiana",
      "San Donato Tavarnelle"
    ]
  ],
  [
    [
      "GSD Ghiviborgo VDS",
      "Mezzolara"
    ],
    [
      "Grassina",
      "FC Scandicci 1908"
    ],
    [
      "Nuova Ternana",
      "Tau Calcio Altopascio"
    ],
    [
      "Progresso",
      "Seravezza Pozzi"
    ],
    [
      "Rondinella Marzocco",
      "Lucchese Calcio"
    ],
    [
      "San Donato Tavarnelle",
      "US Follonica Gavorrano"
    ],
    [
      "Sasso Marconi",
      "AC Prato"
    ],
    [
      "Siena FC",
      "Aquila Montevarchi"
    ],
    [
      "Terranuova Traiana",
      "Flaminia Civitacastellana"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Progresso"
    ],
    [
      "Flaminia Civitacastellana",
      "San Donato Tavarnelle"
    ],
    [
      "US Follonica Gavorrano",
      "Sasso Marconi"
    ],
    [
      "Lucchese Calcio",
      "Siena FC"
    ],
    [
      "Mezzolara",
      "Grassina"
    ],
    [
      "AC Prato",
      "GSD Ghiviborgo VDS"
    ],
    [
      "FC Scandicci 1908",
      "Nuova Ternana"
    ],
    [
      "Seravezza Pozzi",
      "Terranuova Traiana"
    ],
    [
      "Tau Calcio Altopascio",
      "Rondinella Marzocco"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "US Follonica Gavorrano"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Tau Calcio Altopascio"
    ],
    [
      "Grassina",
      "Lucchese Calcio"
    ],
    [
      "Nuova Ternana",
      "Aquila Montevarchi"
    ],
    [
      "Rondinella Marzocco",
      "Progresso"
    ],
    [
      "San Donato Tavarnelle",
      "Mezzolara"
    ],
    [
      "Sasso Marconi",
      "FC Scandicci 1908"
    ],
    [
      "Siena FC",
      "Seravezza Pozzi"
    ],
    [
      "Terranuova Traiana",
      "AC Prato"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Rondinella Marzocco"
    ],
    [
      "US Follonica Gavorrano",
      "Terranuova Traiana"
    ],
    [
      "Lucchese Calcio",
      "Nuova Ternana"
    ],
    [
      "Mezzolara",
      "Sasso Marconi"
    ],
    [
      "AC Prato",
      "San Donato Tavarnelle"
    ],
    [
      "Progresso",
      "Siena FC"
    ],
    [
      "FC Scandicci 1908",
      "GSD Ghiviborgo VDS"
    ],
    [
      "Seravezza Pozzi",
      "Flaminia Civitacastellana"
    ],
    [
      "Tau Calcio Altopascio",
      "Grassina"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "Mezzolara"
    ],
    [
      "US Follonica Gavorrano",
      "AC Prato"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Aquila Montevarchi"
    ],
    [
      "Grassina",
      "Progresso"
    ],
    [
      "Nuova Ternana",
      "Siena FC"
    ],
    [
      "Rondinella Marzocco",
      "Seravezza Pozzi"
    ],
    [
      "San Donato Tavarnelle",
      "Tau Calcio Altopascio"
    ],
    [
      "Sasso Marconi",
      "Lucchese Calcio"
    ],
    [
      "Terranuova Traiana",
      "FC Scandicci 1908"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Grassina"
    ],
    [
      "Lucchese Calcio",
      "GSD Ghiviborgo VDS"
    ],
    [
      "Mezzolara",
      "Terranuova Traiana"
    ],
    [
      "AC Prato",
      "Flaminia Civitacastellana"
    ],
    [
      "Progresso",
      "Nuova Ternana"
    ],
    [
      "FC Scandicci 1908",
      "San Donato Tavarnelle"
    ],
    [
      "Seravezza Pozzi",
      "US Follonica Gavorrano"
    ],
    [
      "Siena FC",
      "Rondinella Marzocco"
    ],
    [
      "Tau Calcio Altopascio",
      "Sasso Marconi"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "Tau Calcio Altopascio"
    ],
    [
      "US Follonica Gavorrano",
      "FC Scandicci 1908"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Siena FC"
    ],
    [
      "Grassina",
      "Rondinella Marzocco"
    ],
    [
      "Nuova Ternana",
      "Seravezza Pozzi"
    ],
    [
      "AC Prato",
      "Mezzolara"
    ],
    [
      "San Donato Tavarnelle",
      "Aquila Montevarchi"
    ],
    [
      "Sasso Marconi",
      "Progresso"
    ],
    [
      "Terranuova Traiana",
      "Lucchese Calcio"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Sasso Marconi"
    ],
    [
      "Lucchese Calcio",
      "San Donato Tavarnelle"
    ],
    [
      "Mezzolara",
      "US Follonica Gavorrano"
    ],
    [
      "Progresso",
      "GSD Ghiviborgo VDS"
    ],
    [
      "Rondinella Marzocco",
      "Nuova Ternana"
    ],
    [
      "FC Scandicci 1908",
      "Flaminia Civitacastellana"
    ],
    [
      "Seravezza Pozzi",
      "AC Prato"
    ],
    [
      "Siena FC",
      "Grassina"
    ],
    [
      "Tau Calcio Altopascio",
      "Terranuova Traiana"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "Aquila Montevarchi"
    ],
    [
      "US Follonica Gavorrano",
      "Lucchese Calcio"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Nuova Ternana"
    ],
    [
      "Grassina",
      "Seravezza Pozzi"
    ],
    [
      "Mezzolara",
      "FC Scandicci 1908"
    ],
    [
      "AC Prato",
      "Tau Calcio Altopascio"
    ],
    [
      "San Donato Tavarnelle",
      "Siena FC"
    ],
    [
      "Sasso Marconi",
      "Rondinella Marzocco"
    ],
    [
      "Terranuova Traiana",
      "Progresso"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Terranuova Traiana"
    ],
    [
      "Lucchese Calcio",
      "Flaminia Civitacastellana"
    ],
    [
      "Nuova Ternana",
      "Grassina"
    ],
    [
      "Progresso",
      "San Donato Tavarnelle"
    ],
    [
      "Rondinella Marzocco",
      "GSD Ghiviborgo VDS"
    ],
    [
      "FC Scandicci 1908",
      "AC Prato"
    ],
    [
      "Seravezza Pozzi",
      "Mezzolara"
    ],
    [
      "Siena FC",
      "Sasso Marconi"
    ],
    [
      "Tau Calcio Altopascio",
      "US Follonica Gavorrano"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "Siena FC"
    ],
    [
      "US Follonica Gavorrano",
      "Progresso"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Seravezza Pozzi"
    ],
    [
      "Mezzolara",
      "Lucchese Calcio"
    ],
    [
      "AC Prato",
      "Aquila Montevarchi"
    ],
    [
      "San Donato Tavarnelle",
      "Nuova Ternana"
    ],
    [
      "Sasso Marconi",
      "Grassina"
    ],
    [
      "FC Scandicci 1908",
      "Tau Calcio Altopascio"
    ],
    [
      "Terranuova Traiana",
      "Rondinella Marzocco"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "US Follonica Gavorrano"
    ],
    [
      "Grassina",
      "GSD Ghiviborgo VDS"
    ],
    [
      "Lucchese Calcio",
      "AC Prato"
    ],
    [
      "Nuova Ternana",
      "Sasso Marconi"
    ],
    [
      "Progresso",
      "Flaminia Civitacastellana"
    ],
    [
      "Rondinella Marzocco",
      "San Donato Tavarnelle"
    ],
    [
      "Seravezza Pozzi",
      "FC Scandicci 1908"
    ],
    [
      "Siena FC",
      "Terranuova Traiana"
    ],
    [
      "Tau Calcio Altopascio",
      "Mezzolara"
    ]
  ],
  [
    [
      "Flaminia Civitacastellana",
      "Nuova Ternana"
    ],
    [
      "US Follonica Gavorrano",
      "Rondinella Marzocco"
    ],
    [
      "Mezzolara",
      "Progresso"
    ],
    [
      "AC Prato",
      "Siena FC"
    ],
    [
      "San Donato Tavarnelle",
      "GSD Ghiviborgo VDS"
    ],
    [
      "Sasso Marconi",
      "Seravezza Pozzi"
    ],
    [
      "FC Scandicci 1908",
      "Aquila Montevarchi"
    ],
    [
      "Tau Calcio Altopascio",
      "Lucchese Calcio"
    ],
    [
      "Terranuova Traiana",
      "Grassina"
    ]
  ],
  [
    [
      "Aquila Montevarchi",
      "Mezzolara"
    ],
    [
      "GSD Ghiviborgo VDS",
      "Sasso Marconi"
    ],
    [
      "Grassina",
      "San Donato Tavarnelle"
    ],
    [
      "Lucchese Calcio",
      "FC Scandicci 1908"
    ],
    [
      "Nuova Ternana",
      "Terranuova Traiana"
    ],
    [
      "Progresso",
      "AC Prato"
    ],
    [
      "Rondinella Marzocco",
      "Flaminia Civitacastellana"
    ],
    [
      "Seravezza Pozzi",
      "Tau Calcio Altopascio"
    ],
    [
      "Siena FC",
      "US Follonica Gavorrano"
    ]
  ]
];

const roundMeta = [
  [
    "06/09/2026",
    "15:00"
  ],
  [
    "13/09/2026",
    "15:00"
  ],
  [
    "16/09/2026",
    "15:00"
  ],
  [
    "20/09/2026",
    "15:00"
  ],
  [
    "27/09/2026",
    "15:00"
  ],
  [
    "04/10/2026",
    "15:00"
  ],
  [
    "11/10/2026",
    "15:00"
  ],
  [
    "18/10/2026",
    "15:00"
  ],
  [
    "25/10/2026",
    "14:30"
  ],
  [
    "01/11/2026",
    "14:30"
  ],
  [
    "08/11/2026",
    "14:30"
  ],
  [
    "15/11/2026",
    "14:30"
  ],
  [
    "22/11/2026",
    "14:30"
  ],
  [
    "29/11/2026",
    "14:30"
  ],
  [
    "06/12/2026",
    "14:30"
  ],
  [
    "13/12/2026",
    "14:30"
  ],
  [
    "20/12/2026",
    "14:30"
  ],
  [
    "06/01/2027",
    "14:30"
  ],
  [
    "10/01/2027",
    "14:30"
  ],
  [
    "17/01/2027",
    "14:30"
  ],
  [
    "24/01/2027",
    "14:30"
  ],
  [
    "31/01/2027",
    "14:30"
  ],
  [
    "07/02/2027",
    "14:30"
  ],
  [
    "14/02/2027",
    "14:30"
  ],
  [
    "21/02/2027",
    "14:30"
  ],
  [
    "28/02/2027",
    "14:30"
  ],
  [
    "14/03/2027",
    "14:30"
  ],
  [
    "21/03/2027",
    "14:30"
  ],
  [
    "25/03/2027",
    "14:30"
  ],
  [
    "04/04/2027",
    "15:00"
  ],
  [
    "11/04/2027",
    "15:00"
  ],
  [
    "18/04/2027",
    "15:00"
  ],
  [
    "25/04/2027",
    "15:00"
  ],
  [
    "02/05/2027",
    "15:00"
  ]
];

const venues = {
  "AC Prato": "Stadio Lungobisenzio",
  "Aquila Montevarchi": "Stadio G. Brilli Peri",
  "FC Scandicci 1908": "Campo Comunale",
  "Flaminia Civitacastellana": "Stadio Turiddo Madami",
  "GSD Ghiviborgo VDS": "Stadio Carraia",
  "Grassina": "Stadio Pazzagli",
  "Lucchese Calcio": "Stadio Porta Elisa",
  "Mezzolara": "Stadio P. Zucchini",
  "Nuova Ternana": "Stadio Libero Liberati",
  "Progresso": "Stadio C. Weisz",
  "Rondinella Marzocco": "Stadio Gino Bozzi",
  "San Donato Tavarnelle": "Stadio Leonardo Pianigiani",
  "Sasso Marconi": "Campo Carbonchi",
  "Seravezza Pozzi": "Stadio Buon Riposo",
  "Siena FC": "Stadio Artemio Franchi",
  "Tau Calcio Altopascio": "Campo Comunale",
  "Terranuova Traiana": "Stadio M. Matteini",
  "US Follonica Gavorrano": "Stadio Malservisi-Matteini"
};

const matches = [];
for (let matchday = 1; matchday <= 34; matchday += 1) {
  const returnLeg = matchday > 17;
  const sourceRound = returnLeg ? matchday - 18 : matchday - 1;
  const pairings = firstLegRounds[sourceRound];
  const [dateLabel, time] = roundMeta[matchday - 1];
  pairings.forEach(([firstHome, firstAway], index) => {
    const home = returnLeg ? firstAway : firstHome;
    const away = returnLeg ? firstHome : firstAway;
    matches.push({
      id: `lnd-serie-d-e-2026-27-md${matchday}-${index + 1}`,
      matchday,
      leg: returnLeg ? 'Ritorno' : 'Andata',
      competition: 'Campionato',
      roundLabel: `${matchday}ª giornata`,
      home,
      away,
      dateLabel,
      time,
      venue: venues[home],
      status: 'scheduled',
      sortOrder: matches.length,
    });
  });
}

const output = `// FILE GENERATO - non modificare a mano.
// Generato da scripts/generate-full-season.cjs dal calendario ufficiale LND.
// Serie D 2026/27 - Girone E - 18 squadre, 34 giornate, 306 partite.

import { SeasonMatch } from '../types';

export const OFFICIAL_CALENDAR_SOURCE = 'https://lnd.it/seried/calendari-campionato-2026-2027/';
export const FULL_SEASON_NOTICE = 'Calendario ufficiale LND Serie D 2026/27 - Girone E';

export const fullSeasonMatches: SeasonMatch[] = ${JSON.stringify(matches, null, 2)};
`;

process.stdout.write(output);
