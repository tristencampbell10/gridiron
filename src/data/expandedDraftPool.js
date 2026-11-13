// Expanded 2026 NFL Draft Pool across all 32 franchises
// Ensures complete multi-round 8, 10, and 12-team snake drafts across Offensive Spread 11,
// 4-3 Defense, and Fantasy Superflex 11 formats with full K, DST, Defense, and Offense depth.

const TEAM_FULL_NAMES = {
  ARI: 'Arizona Cardinals',
  ATL: 'Atlanta Falcons',
  BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',
  CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals',
  CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos',
  DET: 'Detroit Lions',
  GB: 'Green Bay Packers',
  HOU: 'Houston Texans',
  IND: 'Indianapolis Colts',
  JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs',
  LAC: 'Los Angeles Chargers',
  LAR: 'Los Angeles Rams',
  LV: 'Las Vegas Raiders',
  MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings',
  NE: 'New England Patriots',
  NO: 'New Orleans Saints',
  NYG: 'New York Giants',
  NYJ: 'New York Jets',
  PHI: 'Philadelphia Eagles',
  PIT: 'Pittsburgh Steelers',
  SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers',
  TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans',
  WAS: 'Washington Commanders'
};

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeDefPlayer(name, pos, teamAbbr, jersey, rating, tackles, sacks, ints, bio) {
  const team = TEAM_FULL_NAMES[teamAbbr] || teamAbbr;
  const fpts = Number((rating * 16 + sacks * 2.5 + ints * 4 + tackles * 0.35).toFixed(1));
  return {
    id: slugify(name),
    name,
    number: `#${jersey}`,
    jersey_number: jersey,
    pos,
    position: pos,
    team,
    teamAbbr,
    status: 'ACTIVE',
    gamesPlayed: 9,
    player_performance_rating: rating,
    rating: (rating * 20).toFixed(1),
    salary: Math.round(5200 + rating * 580),
    tackles,
    sacks,
    interceptions: ints,
    tfl: Math.max(1, Math.round(tackles * 0.14 + sacks * 0.6)),
    passDefended: pos === 'CB' || pos === 'S' ? Math.max(3, Math.round(ints * 2.5 + 4)) : Math.round(ints * 2 + 1),
    forcedFumbles: sacks >= 6 ? 2 : 1,
    fantasyPts: fpts,
    bio: bio || `Active 2026 ${pos} starter for the ${team}.`
  };
}

function makeKicker(name, teamAbbr, jersey, rating, fgm, fga, xpm) {
  const team = TEAM_FULL_NAMES[teamAbbr] || teamAbbr;
  const fantasyPts = fgm * 3 + xpm;
  return {
    id: slugify(name),
    name,
    number: `#${jersey}`,
    jersey_number: jersey,
    pos: 'K',
    position: 'K',
    team,
    teamAbbr,
    status: 'ACTIVE',
    gamesPlayed: 9,
    player_performance_rating: rating,
    rating: (rating * 20).toFixed(1),
    salary: Math.round(4100 + rating * 180),
    fieldGoalsMade: fgm,
    fieldGoalsAttempted: fga,
    extraPointsMade: xpm,
    fantasyPts,
    bio: `Active 2026 placekicker for the ${team} (${fgm}/${fga} FG).`
  };
}

function makeDst(teamAbbr, rating, sacks, turnovers, defTd, papg) {
  const team = TEAM_FULL_NAMES[teamAbbr] || teamAbbr;
  const fantasyPts = Number((52 + sacks * 0.9 + turnovers * 1.4 + defTd * 4 - (papg - 17) * 1.1).toFixed(1));
  return {
    id: `${teamAbbr.toLowerCase()}-dst`,
    name: `${team} DST`,
    number: '--',
    jersey_number: 0,
    pos: 'DST',
    position: 'DST',
    team,
    teamAbbr,
    status: 'ACTIVE',
    gamesPlayed: 9,
    player_performance_rating: rating,
    rating: (rating * 20).toFixed(1),
    salary: Math.round(2800 + rating * 240),
    sacks,
    turnovers,
    defensiveTd: defTd,
    pointsAllowedPerGame: papg,
    fantasyPts,
    bio: `2026 Defense & Special Teams unit for the ${team}.`
  };
}

function makeOffPlayer(name, pos, teamAbbr, jersey, rating, stats = {}) {
  const team = TEAM_FULL_NAMES[teamAbbr] || teamAbbr;
  const passYds = stats.passYds || 0;
  const passTd = stats.passTd || 0;
  const rushYds = stats.rushYds || 0;
  const rushTd = stats.rushTd || 0;
  const rec = stats.rec || 0;
  const recYds = stats.recYds || 0;
  const recTd = stats.recTd || 0;
  const fantasyPts = Number(
    (
      passYds * 0.04 +
      passTd * 4 +
      rushYds * 0.1 +
      rushTd * 6 +
      rec * 0.5 +
      recYds * 0.1 +
      recTd * 6
    ).toFixed(1)
  );
  return {
    id: slugify(name),
    name,
    number: `#${jersey}`,
    jersey_number: jersey,
    pos,
    position: pos,
    team,
    teamAbbr,
    status: 'ACTIVE',
    gamesPlayed: 9,
    player_performance_rating: rating,
    rating: (rating * 20).toFixed(1),
    salary: Math.round(4800 + rating * 650),
    passYds,
    passTd,
    int: stats.int || 0,
    rushYds,
    rushTd,
    rec,
    recYds,
    recTd,
    targets: rec ? Math.round(rec * 1.45) : 0,
    fantasyPts: Math.max(45, fantasyPts),
    bio: `Active 2026 ${pos} contributor for the ${team}.`
  };
}

// 1. Remaining 29 NFL Kickers (BAL, KC, DAL already in defensivePlayers.js)
const EXTRA_KICKERS = [
  makeKicker('Chris Boswell', 'PIT', 9, 4.90, 25, 26, 20),
  makeKicker('Ka\'imi Fairbairn', 'HOU', 15, 4.86, 23, 25, 24),
  makeKicker('Jake Bates', 'DET', 39, 4.84, 21, 22, 34),
  makeKicker('Cameron Dicker', 'LAC', 11, 4.81, 22, 23, 25),
  makeKicker('Jake Elliott', 'PHI', 4, 4.76, 19, 21, 30),
  makeKicker('Tyler Bass', 'BUF', 2, 4.65, 18, 21, 31),
  makeKicker('Chase McLaughlin', 'TB', 4, 4.78, 21, 22, 27),
  makeKicker('Younghoe Koo', 'ATL', 7, 4.68, 19, 22, 23),
  makeKicker('Evan McPherson', 'CIN', 2, 4.69, 18, 21, 28),
  makeKicker('Will Reichard', 'MIN', 16, 4.75, 20, 21, 26),
  makeKicker('Wil Lutz', 'DEN', 3, 4.72, 21, 23, 22),
  makeKicker('Jason Myers', 'SEA', 5, 4.67, 19, 21, 24),
  makeKicker('Jason Sanders', 'MIA', 7, 4.71, 20, 22, 21),
  makeKicker('Daniel Carlson', 'LV', 2, 4.64, 18, 20, 20),
  makeKicker('Blake Grupe', 'NO', 19, 4.55, 17, 20, 22),
  makeKicker('Austin Seibert', 'WAS', 17, 4.70, 21, 23, 25),
  makeKicker('Matt Gay', 'IND', 7, 4.58, 17, 20, 21),
  makeKicker('Cairo Santos', 'CHI', 8, 4.62, 18, 20, 21),
  makeKicker('Brandon McManus', 'GB', 17, 4.66, 19, 21, 26),
  makeKicker('Chad Ryland', 'ARI', 38, 4.60, 18, 20, 22),
  makeKicker('Joshua Karty', 'LAR', 16, 4.57, 17, 20, 24),
  makeKicker('Jake Moody', 'SF', 4, 4.63, 18, 21, 26),
  makeKicker('Cam Little', 'JAX', 39, 4.59, 17, 19, 21),
  makeKicker('Nick Folk', 'TEN', 6, 4.61, 18, 19, 18),
  makeKicker('Dustin Hopkins', 'CLE', 7, 4.48, 15, 19, 17),
  makeKicker('Joey Slye', 'NE', 13, 4.52, 16, 19, 19),
  makeKicker('Eddy Pineiro', 'CAR', 4, 4.54, 16, 18, 18),
  makeKicker('Greg Zuerlein', 'NYJ', 9, 4.46, 15, 19, 20),
  makeKicker('Graham Gano', 'NYG', 9, 4.45, 14, 17, 18)
];

// 2. Remaining 28 NFL Team DSTs (PIT, BAL, KC, SF already in defensivePlayers.js)
const EXTRA_DSTS = [
  makeDst('DET', 4.85, 30, 18, 2, 16.8),
  makeDst('MIN', 4.83, 32, 19, 2, 17.2),
  makeDst('PHI', 4.81, 29, 15, 2, 17.8),
  makeDst('DEN', 4.80, 34, 15, 3, 17.4),
  makeDst('BUF', 4.78, 27, 17, 2, 18.1),
  makeDst('HOU', 4.76, 31, 16, 1, 18.4),
  makeDst('LAC', 4.74, 28, 14, 2, 16.5),
  makeDst('GB', 4.72, 26, 17, 1, 19.2),
  makeDst('SEA', 4.68, 27, 13, 2, 19.8),
  makeDst('CHI', 4.65, 25, 15, 1, 19.4),
  makeDst('NYJ', 4.63, 28, 11, 1, 20.1),
  makeDst('CLE', 4.61, 29, 12, 1, 20.5),
  makeDst('DAL', 4.58, 26, 13, 2, 21.4),
  makeDst('WAS', 4.59, 25, 13, 1, 20.8),
  makeDst('TB', 4.57, 24, 12, 1, 21.2),
  makeDst('ATL', 4.54, 22, 13, 1, 21.6),
  makeDst('ARI', 4.55, 24, 12, 1, 20.9),
  makeDst('LAR', 4.56, 25, 12, 2, 21.0),
  makeDst('MIA', 4.52, 23, 11, 1, 21.5),
  makeDst('IND', 4.49, 23, 12, 1, 22.0),
  makeDst('CIN', 4.47, 21, 11, 1, 22.8),
  makeDst('NO', 4.45, 22, 12, 1, 22.4),
  makeDst('LV', 4.44, 23, 10, 1, 23.0),
  makeDst('NYG', 4.48, 28, 10, 1, 22.2),
  makeDst('TEN', 4.42, 21, 10, 1, 23.1),
  makeDst('NE', 4.40, 20, 10, 1, 23.4),
  makeDst('JAX', 4.38, 19, 9, 1, 24.2),
  makeDst('CAR', 4.32, 17, 9, 0, 25.8)
];

// 3. Extra 30 Defensive Ends / Edge Rushers (35 DE total)
const EXTRA_DES = [
  makeDefPlayer('Maxx Crosby', 'DE', 'LV', 98, 4.90, 48, 10.0, 0),
  makeDefPlayer('Trey Hendrickson', 'DE', 'CIN', 91, 4.89, 36, 11.5, 0),
  makeDefPlayer('Danielle Hunter', 'DE', 'HOU', 55, 4.82, 39, 9.5, 0),
  makeDefPlayer('Will Anderson Jr.', 'DE', 'HOU', 51, 4.80, 37, 8.5, 0),
  makeDefPlayer('Brian Burns', 'DE', 'NYG', 0, 4.74, 43, 8.0, 0),
  makeDefPlayer('Jared Verse', 'DE', 'LAR', 8, 4.77, 41, 7.5, 0),
  makeDefPlayer('Jonathan Greenard', 'DE', 'MIN', 58, 4.78, 38, 8.5, 0),
  makeDefPlayer('Josh Hines-Allen', 'DE', 'JAX', 41, 4.75, 36, 7.5, 0),
  makeDefPlayer('Travon Walker', 'DE', 'JAX', 44, 4.71, 40, 7.5, 0),
  makeDefPlayer('Montez Sweat', 'DE', 'CHI', 98, 4.70, 35, 7.0, 0),
  makeDefPlayer('Rashan Gary', 'DE', 'GB', 52, 4.72, 34, 7.0, 0),
  makeDefPlayer('Greg Rousseau', 'DE', 'BUF', 50, 4.73, 39, 7.5, 0),
  makeDefPlayer('George Karlaftis', 'DE', 'KC', 56, 4.69, 35, 7.0, 0),
  makeDefPlayer('Nik Bonitto', 'DE', 'DEN', 15, 4.79, 36, 9.5, 1),
  makeDefPlayer('Khalil Mack', 'DE', 'LAC', 52, 4.76, 38, 7.5, 0),
  makeDefPlayer('Joey Bosa', 'DE', 'LAC', 97, 4.67, 30, 6.5, 0),
  makeDefPlayer('Kayvon Thibodeaux', 'DE', 'NYG', 5, 4.63, 33, 6.0, 0),
  makeDefPlayer('Alex Highsmith', 'DE', 'PIT', 56, 4.68, 36, 6.5, 0),
  makeDefPlayer('Kyle Van Noy', 'DE', 'BAL', 53, 4.66, 32, 8.0, 0),
  makeDefPlayer('Jaelan Phillips', 'DE', 'MIA', 15, 4.64, 34, 6.5, 0),
  makeDefPlayer('Chop Robinson', 'DE', 'MIA', 44, 4.60, 29, 6.0, 0),
  makeDefPlayer('Josh Sweat', 'DE', 'PHI', 19, 4.65, 33, 6.5, 0),
  makeDefPlayer('Nolan Smith', 'DE', 'PHI', 3, 4.58, 31, 5.5, 0),
  makeDefPlayer('Leonard Floyd', 'DE', 'SF', 56, 4.59, 32, 6.5, 0),
  makeDefPlayer('Boye Mafe', 'DE', 'SEA', 53, 4.61, 34, 6.0, 0),
  makeDefPlayer('Carl Granderson', 'DE', 'NO', 96, 4.57, 36, 5.5, 0),
  makeDefPlayer('Laiatu Latu', 'DE', 'IND', 97, 4.55, 29, 5.5, 0),
  makeDefPlayer('Harold Landry III', 'DE', 'TEN', 58, 4.56, 40, 6.0, 0),
  makeDefPlayer('Dante Fowler Jr.', 'DE', 'WAS', 6, 4.53, 28, 6.5, 1),
  makeDefPlayer('YaYa Diaby', 'DE', 'TB', 0, 4.54, 35, 5.5, 0)
];

// 4. Extra 28 Defensive Tackles (32 DT total)
const EXTRA_DTS = [
  makeDefPlayer('Jeffery Simmons', 'DT', 'TEN', 98, 4.82, 42, 6.0, 0),
  makeDefPlayer('Christian Wilkins', 'DT', 'LV', 94, 4.76, 39, 5.5, 0),
  makeDefPlayer('Nnamdi Madubuike', 'DT', 'BAL', 92, 4.79, 36, 6.5, 0),
  makeDefPlayer('Vita Vea', 'DT', 'TB', 50, 4.78, 38, 6.0, 0),
  makeDefPlayer('DeForest Buckner', 'DT', 'IND', 99, 4.77, 40, 6.0, 0),
  makeDefPlayer('Derrick Brown', 'DT', 'CAR', 95, 4.74, 48, 4.5, 0),
  makeDefPlayer('Cameron Heyward', 'DT', 'PIT', 97, 4.80, 44, 6.5, 0),
  makeDefPlayer('Zach Allen', 'DT', 'DEN', 99, 4.75, 41, 6.0, 0),
  makeDefPlayer('Daron Payne', 'DT', 'WAS', 94, 4.68, 36, 4.5, 0),
  makeDefPlayer('Jonathan Allen', 'DT', 'WAS', 93, 4.67, 34, 4.5, 0),
  makeDefPlayer('Alim McNeill', 'DT', 'DET', 54, 4.71, 33, 5.0, 0),
  makeDefPlayer('Ed Oliver', 'DT', 'BUF', 91, 4.69, 35, 5.0, 0),
  makeDefPlayer('Kenny Clark', 'DT', 'GB', 97, 4.66, 36, 4.0, 0),
  makeDefPlayer('Leonard Williams', 'DT', 'SEA', 99, 4.73, 40, 6.0, 1),
  makeDefPlayer('Kobie Turner', 'DT', 'LAR', 91, 4.70, 38, 6.0, 0),
  makeDefPlayer('Braden Fiske', 'DT', 'LAR', 55, 4.64, 32, 5.5, 0),
  makeDefPlayer('Milton Williams', 'DT', 'PHI', 93, 4.63, 30, 5.0, 0),
  makeDefPlayer('Grady Jarrett', 'DT', 'ATL', 97, 4.62, 34, 4.0, 0),
  makeDefPlayer('Zach Sieler', 'DT', 'MIA', 92, 4.69, 39, 6.0, 1),
  makeDefPlayer('Calais Campbell', 'DT', 'MIA', 93, 4.61, 35, 4.5, 0),
  makeDefPlayer('Gervon Dexter Sr.', 'DT', 'CHI', 99, 4.56, 31, 4.5, 0),
  makeDefPlayer('Osa Odighizuwa', 'DT', 'DAL', 97, 4.58, 33, 4.5, 0),
  makeDefPlayer('Bryan Bresee', 'DT', 'NO', 90, 4.57, 29, 5.5, 0),
  makeDefPlayer('T\'Vondre Sweat', 'DT', 'TEN', 93, 4.54, 34, 3.0, 0),
  makeDefPlayer('Javon Hargrave', 'DT', 'SF', 98, 4.60, 31, 4.5, 0),
  makeDefPlayer('Maliek Collins', 'DT', 'SF', 99, 4.52, 28, 4.0, 0),
  makeDefPlayer('Dalvin Tomlinson', 'DT', 'CLE', 94, 4.51, 29, 3.5, 0),
  makeDefPlayer('Christian Barmore', 'DT', 'NE', 90, 4.59, 32, 4.5, 0)
];

// 5. Extra 40 Linebackers (44 LB total — covers full 12-team 4-3 Defense)
const EXTRA_LBS = [
  makeDefPlayer('Zack Baun', 'LB', 'PHI', 53, 4.89, 89, 3.0, 1),
  makeDefPlayer('Patrick Queen', 'LB', 'PIT', 6, 4.78, 82, 2.0, 0),
  makeDefPlayer('Lavonte David', 'LB', 'TB', 54, 4.81, 80, 3.5, 1),
  makeDefPlayer('Demario Davis', 'LB', 'NO', 56, 4.80, 85, 2.5, 1),
  makeDefPlayer('Nick Bolton', 'LB', 'KC', 32, 4.77, 79, 2.0, 1),
  makeDefPlayer('Terrel Bernard', 'LB', 'BUF', 43, 4.75, 76, 2.0, 2),
  makeDefPlayer('Matt Milano', 'LB', 'BUF', 58, 4.76, 72, 1.5, 2),
  makeDefPlayer('Quincy Williams', 'LB', 'NYJ', 56, 4.74, 78, 2.0, 0),
  makeDefPlayer('C.J. Mosley', 'LB', 'NYJ', 57, 4.68, 74, 1.0, 1),
  makeDefPlayer('Jordyn Brooks', 'LB', 'MIA', 20, 4.71, 83, 2.5, 0),
  makeDefPlayer('Tremaine Edmunds', 'LB', 'CHI', 49, 4.66, 77, 1.0, 1),
  makeDefPlayer('T.J. Edwards', 'LB', 'CHI', 53, 4.73, 84, 2.0, 1),
  makeDefPlayer('Jack Campbell', 'LB', 'DET', 46, 4.70, 81, 1.5, 0),
  makeDefPlayer('Alex Anzalone', 'LB', 'DET', 34, 4.67, 73, 1.5, 0),
  makeDefPlayer('Quay Walker', 'LB', 'GB', 7, 4.65, 79, 2.0, 0),
  makeDefPlayer('Edgerrin Cooper', 'LB', 'GB', 56, 4.72, 71, 3.0, 1),
  makeDefPlayer('Blake Cashman', 'LB', 'MIN', 51, 4.69, 76, 3.0, 1),
  makeDefPlayer('Ivan Pace Jr.', 'LB', 'MIN', 0, 4.64, 69, 2.5, 0),
  makeDefPlayer('Daiyan Henley', 'LB', 'LAC', 0, 4.71, 86, 1.5, 1),
  makeDefPlayer('Robert Spillane', 'LB', 'LV', 41, 4.74, 88, 2.0, 2),
  makeDefPlayer('Zaire Franklin', 'LB', 'IND', 44, 4.76, 94, 2.5, 2),
  makeDefPlayer('Azeez Al-Shaair', 'LB', 'HOU', 0, 4.63, 72, 2.0, 0),
  makeDefPlayer('Henry To\'oTo\'o', 'LB', 'HOU', 39, 4.58, 75, 1.5, 1),
  makeDefPlayer('Logan Wilson', 'LB', 'CIN', 55, 4.68, 82, 1.0, 1),
  makeDefPlayer('Germaine Pratt', 'LB', 'CIN', 57, 4.65, 84, 0.5, 2),
  makeDefPlayer('Jeremiah Owusu-Koramoah', 'LB', 'CLE', 6, 4.78, 74, 3.0, 1),
  makeDefPlayer('Payton Wilson', 'LB', 'PIT', 41, 4.60, 68, 1.0, 1),
  makeDefPlayer('Dre Greenlaw', 'LB', 'SF', 57, 4.70, 72, 1.5, 0),
  makeDefPlayer('Ernest Jones IV', 'LB', 'SEA', 13, 4.69, 85, 1.5, 1),
  makeDefPlayer('Kaden Elliss', 'LB', 'ATL', 55, 4.66, 80, 3.5, 1),
  makeDefPlayer('Frankie Luvu', 'LB', 'WAS', 4, 4.79, 76, 6.0, 1),
  makeDefPlayer('Nakobe Dean', 'LB', 'PHI', 17, 4.67, 78, 2.5, 1),
  makeDefPlayer('Micah McFadden', 'LB', 'NYG', 41, 4.59, 77, 2.5, 0),
  makeDefPlayer('Bobby Okereke', 'LB', 'NYG', 58, 4.64, 79, 2.0, 0),
  makeDefPlayer('Devin Lloyd', 'LB', 'JAX', 0, 4.61, 75, 1.5, 1),
  makeDefPlayer('Cody Barton', 'LB', 'DEN', 55, 4.57, 74, 1.5, 2),
  makeDefPlayer('Alex Singleton', 'LB', 'DEN', 49, 4.56, 76, 1.0, 0),
  makeDefPlayer('Kyzir White', 'LB', 'ARI', 7, 4.60, 81, 2.0, 1),
  makeDefPlayer('Mack Wilson Sr.', 'LB', 'ARI', 2, 4.54, 67, 2.5, 1),
  makeDefPlayer('Kenneth Murray Jr.', 'LB', 'TEN', 9, 4.52, 72, 2.5, 1)
];

// 6. Extra 30 Cornerbacks (34 CB total)
const EXTRA_CBS = [
  makeDefPlayer('Derek Stingley Jr.', 'CB', 'HOU', 24, 4.90, 38, 0.0, 4),
  makeDefPlayer('Jaylon Johnson', 'CB', 'CHI', 1, 4.86, 36, 0.0, 3),
  makeDefPlayer('Denzel Ward', 'CB', 'CLE', 21, 4.84, 34, 0.0, 3),
  makeDefPlayer('Jalen Ramsey', 'CB', 'MIA', 5, 4.82, 41, 1.0, 2),
  makeDefPlayer('Christian Gonzalez', 'CB', 'NE', 0, 4.83, 39, 0.0, 3),
  makeDefPlayer('Quinyon Mitchell', 'CB', 'PHI', 27, 4.81, 35, 0.0, 2),
  makeDefPlayer('Cooper DeJean', 'CB', 'PHI', 33, 4.77, 40, 0.5, 2),
  makeDefPlayer('Marlon Humphrey', 'CB', 'BAL', 44, 4.80, 44, 0.5, 4),
  makeDefPlayer('Joey Porter Jr.', 'CB', 'PIT', 24, 4.76, 38, 0.0, 2),
  makeDefPlayer('Jaire Alexander', 'CB', 'GB', 23, 4.79, 30, 0.0, 3),
  makeDefPlayer('Xavier McKinney', 'CB', 'GB', 29, 4.75, 45, 1.0, 5),
  makeDefPlayer('A.J. Terrell', 'CB', 'ATL', 24, 4.74, 41, 0.0, 2),
  makeDefPlayer('D.J. Reed', 'CB', 'NYJ', 4, 4.72, 39, 1.0, 2),
  makeDefPlayer('Tariq Woolen', 'CB', 'SEA', 27, 4.71, 34, 0.0, 3),
  makeDefPlayer('Charvarius Ward', 'CB', 'SF', 7, 4.73, 37, 0.0, 2),
  makeDefPlayer('Deommodore Lenoir', 'CB', 'SF', 2, 4.70, 46, 0.0, 2),
  makeDefPlayer('Byron Murphy Jr.', 'CB', 'MIN', 7, 4.76, 44, 0.0, 4),
  makeDefPlayer('Taron Johnson', 'CB', 'BUF', 7, 4.74, 48, 1.0, 2),
  makeDefPlayer('Christian Benford', 'CB', 'BUF', 47, 4.75, 39, 1.0, 2),
  makeDefPlayer('Marshon Lattimore', 'CB', 'WAS', 23, 4.69, 32, 0.0, 2),
  makeDefPlayer('Mike Sainristil', 'CB', 'WAS', 0, 4.64, 43, 0.0, 2),
  makeDefPlayer('Terrion Arnold', 'CB', 'DET', 0, 4.65, 41, 0.0, 1),
  makeDefPlayer('Carlton Davis III', 'CB', 'DET', 23, 4.68, 40, 0.0, 2),
  makeDefPlayer('L\'Jarius Sneed', 'CB', 'TEN', 38, 4.67, 36, 0.0, 2),
  makeDefPlayer('Trevon Diggs', 'CB', 'DAL', 7, 4.71, 33, 0.0, 3),
  makeDefPlayer('DaRon Bland', 'CB', 'DAL', 26, 4.66, 37, 0.0, 3),
  makeDefPlayer('Kader Kohou', 'CB', 'MIA', 4, 4.59, 42, 0.5, 2),
  makeDefPlayer('Cam Taylor-Britt', 'CB', 'CIN', 29, 4.60, 45, 0.0, 3),
  makeDefPlayer('Kenny Moore II', 'CB', 'IND', 23, 4.63, 47, 0.5, 2),
  makeDefPlayer('Jaycee Horn', 'CB', 'CAR', 8, 4.68, 38, 0.0, 2)
];

// 7. Extra 29 Safeties (32 S total)
const EXTRA_SAFETIES = [
  makeDefPlayer('Brian Branch', 'S', 'DET', 32, 4.91, 62, 1.0, 4),
  makeDefPlayer('Kerby Joseph', 'S', 'DET', 31, 4.86, 51, 0.0, 6),
  makeDefPlayer('Derwin James Jr.', 'S', 'LAC', 3, 4.88, 69, 3.5, 2),
  makeDefPlayer('Minkah Fitzpatrick', 'S', 'PIT', 39, 4.84, 58, 0.0, 2),
  makeDefPlayer('Budda Baker', 'S', 'ARI', 3, 4.85, 84, 2.0, 1),
  makeDefPlayer('Jalen Pitre', 'S', 'HOU', 5, 4.72, 60, 0.0, 2),
  makeDefPlayer('Calen Bullock', 'S', 'HOU', 2, 4.69, 42, 0.0, 4),
  makeDefPlayer('Harrison Smith', 'S', 'MIN', 22, 4.71, 56, 1.0, 3),
  makeDefPlayer('Camryn Bynum', 'S', 'MIN', 24, 4.70, 59, 0.0, 3),
  makeDefPlayer('Kevin Byard III', 'S', 'CHI', 31, 4.68, 64, 1.0, 2),
  makeDefPlayer('Jaquan Brisker', 'S', 'CHI', 9, 4.66, 54, 1.0, 2),
  makeDefPlayer('Reed Blankenship', 'S', 'PHI', 32, 4.73, 57, 0.0, 3),
  makeDefPlayer('C.J. Gardner-Johnson', 'S', 'PHI', 8, 4.71, 48, 0.0, 3),
  makeDefPlayer('Brandon Jones', 'S', 'DEN', 22, 4.67, 63, 0.0, 2),
  makeDefPlayer('Jevon Holland', 'S', 'MIA', 8, 4.75, 52, 1.0, 2),
  makeDefPlayer('Jordan Poyer', 'S', 'MIA', 21, 4.59, 55, 0.0, 1),
  makeDefPlayer('Damar Hamlin', 'S', 'BUF', 3, 4.62, 58, 0.0, 2),
  makeDefPlayer('Taylor Rapp', 'S', 'BUF', 9, 4.64, 53, 0.0, 2),
  makeDefPlayer('Justin Reid', 'S', 'KC', 20, 4.74, 57, 0.0, 2),
  makeDefPlayer('Bryan Cook', 'S', 'KC', 6, 4.61, 49, 0.0, 2),
  makeDefPlayer('Talanoa Hufanga', 'S', 'SF', 29, 4.68, 51, 0.5, 2),
  makeDefPlayer('Julian Love', 'S', 'SEA', 20, 4.72, 65, 0.0, 2),
  makeDefPlayer('Tyrann Mathieu', 'S', 'NO', 32, 4.65, 49, 0.0, 3),
  makeDefPlayer('Jeremy Chinn', 'S', 'WAS', 11, 4.63, 62, 1.0, 2),
  makeDefPlayer('Kamren Curl', 'S', 'LAR', 3, 4.60, 56, 1.0, 1),
  makeDefPlayer('Grant Delpit', 'S', 'CLE', 9, 4.62, 61, 1.0, 1),
  makeDefPlayer('Nick Cross', 'S', 'IND', 20, 4.64, 76, 1.0, 2),
  makeDefPlayer('Tre\'von Moehrig', 'S', 'LV', 7, 4.65, 59, 1.0, 2),
  makeDefPlayer('Xavier Woods', 'S', 'CAR', 25, 4.58, 63, 0.0, 2)
];

// 8. Offensive Depth: QB2s (16), RB2s (32), WR3s (32), TE2s (16)
const EXTRA_OFFENSE = [
  // 16 Additional QBs (48 QB total)
  makeOffPlayer('Justin Fields', 'QB', 'PIT', 2, 4.18, { passYds: 1380, passTd: 9, int: 2, rushYds: 310, rushTd: 5 }),
  makeOffPlayer('Jameis Winston', 'QB', 'CLE', 5, 4.05, { passYds: 1510, passTd: 11, int: 6, rushYds: 68, rushTd: 1 }),
  makeOffPlayer('Joe Flacco', 'QB', 'IND', 15, 4.02, { passYds: 1290, passTd: 9, int: 4, rushYds: 18, rushTd: 0 }),
  makeOffPlayer('Malik Willis', 'QB', 'GB', 2, 4.08, { passYds: 980, passTd: 7, int: 1, rushYds: 215, rushTd: 2 }),
  makeOffPlayer('Cooper Rush', 'QB', 'DAL', 10, 3.88, { passYds: 1120, passTd: 7, int: 3, rushYds: 22, rushTd: 0 }),
  makeOffPlayer('Mason Rudolph', 'QB', 'TEN', 11, 3.85, { passYds: 1090, passTd: 6, int: 4, rushYds: 45, rushTd: 1 }),
  makeOffPlayer('Mac Jones', 'QB', 'JAX', 10, 3.82, { passYds: 1040, passTd: 6, int: 4, rushYds: 52, rushTd: 1 }),
  makeOffPlayer('Andy Dalton', 'QB', 'CAR', 14, 3.92, { passYds: 1180, passTd: 8, int: 4, rushYds: 26, rushTd: 0 }),
  makeOffPlayer('Marcus Mariota', 'QB', 'WAS', 18, 3.95, { passYds: 960, passTd: 7, int: 2, rushYds: 145, rushTd: 1 }),
  makeOffPlayer('Jimmy Garoppolo', 'QB', 'LAR', 11, 3.89, { passYds: 1060, passTd: 7, int: 3, rushYds: 15, rushTd: 0 }),
  makeOffPlayer('Jacoby Brissett', 'QB', 'NE', 7, 3.86, { passYds: 1080, passTd: 5, int: 2, rushYds: 64, rushTd: 0 }),
  makeOffPlayer('Gardner Minshew', 'QB', 'LV', 15, 3.90, { passYds: 1310, passTd: 7, int: 5, rushYds: 48, rushTd: 0 }),
  makeOffPlayer('Aidan O\'Connell', 'QB', 'LV', 12, 3.84, { passYds: 1140, passTd: 6, int: 3, rushYds: 18, rushTd: 0 }),
  makeOffPlayer('Spencer Rattler', 'QB', 'NO', 18, 3.80, { passYds: 1020, passTd: 5, int: 4, rushYds: 84, rushTd: 1 }),
  makeOffPlayer('Tyrod Taylor', 'QB', 'NYJ', 2, 3.83, { passYds: 940, passTd: 6, int: 2, rushYds: 95, rushTd: 1 }),
  makeOffPlayer('Jake Browning', 'QB', 'CIN', 6, 3.91, { passYds: 1110, passTd: 7, int: 3, rushYds: 42, rushTd: 1 }),

  // 32 Additional RBs (64 RB total)
  makeOffPlayer('David Montgomery', 'RB', 'DET', 5, 4.62, { rushYds: 615, rushTd: 9, rec: 22, recYds: 198, recTd: 0 }),
  makeOffPlayer('Isaac Guerendo', 'RB', 'SF', 31, 4.18, { rushYds: 412, rushTd: 4, rec: 14, recYds: 102, recTd: 0 }),
  makeOffPlayer('Jordan Mason', 'RB', 'SF', 24, 4.44, { rushYds: 668, rushTd: 4, rec: 11, recYds: 91, recTd: 0 }),
  makeOffPlayer('Rachaad White', 'RB', 'TB', 1, 4.35, { rushYds: 445, rushTd: 3, rec: 34, recYds: 285, recTd: 4 }),
  makeOffPlayer('Jaylen Warren', 'RB', 'PIT', 30, 4.28, { rushYds: 428, rushTd: 2, rec: 27, recYds: 210, recTd: 0 }),
  makeOffPlayer('Tyler Allgeier', 'RB', 'ATL', 25, 4.24, { rushYds: 465, rushTd: 3, rec: 9, recYds: 68, recTd: 0 }),
  makeOffPlayer('Tank Bigsby', 'RB', 'JAX', 4, 4.36, { rushYds: 540, rushTd: 5, rec: 6, recYds: 44, recTd: 0 }),
  makeOffPlayer('Tyrone Tracy Jr.', 'RB', 'NYG', 29, 4.38, { rushYds: 562, rushTd: 4, rec: 22, recYds: 165, recTd: 0 }),
  makeOffPlayer('Austin Ekeler', 'RB', 'WAS', 30, 4.31, { rushYds: 335, rushTd: 4, rec: 28, recYds: 278, recTd: 1 }),
  makeOffPlayer('Kareem Hunt', 'RB', 'KC', 29, 4.33, { rushYds: 510, rushTd: 5, rec: 16, recYds: 132, recTd: 0 }),
  makeOffPlayer('Raheem Mostert', 'RB', 'MIA', 31, 4.20, { rushYds: 365, rushTd: 4, rec: 12, recYds: 98, recTd: 0 }),
  makeOffPlayer('Ray Davis', 'RB', 'BUF', 22, 4.25, { rushYds: 390, rushTd: 3, rec: 14, recYds: 148, recTd: 2 }),
  makeOffPlayer('Braelon Allen', 'RB', 'NYJ', 0, 4.19, { rushYds: 350, rushTd: 3, rec: 13, recYds: 112, recTd: 1 }),
  makeOffPlayer('Antonio Gibson', 'RB', 'NE', 4, 4.14, { rushYds: 380, rushTd: 2, rec: 18, recYds: 156, recTd: 0 }),
  makeOffPlayer('Justice Hill', 'RB', 'BAL', 43, 4.22, { rushYds: 245, rushTd: 1, rec: 31, recYds: 274, recTd: 3 }),
  makeOffPlayer('Zack Moss', 'RB', 'CIN', 31, 4.15, { rushYds: 342, rushTd: 3, rec: 21, recYds: 165, recTd: 1 }),
  makeOffPlayer('Nick Chubb', 'RB', 'CLE', 24, 4.29, { rushYds: 440, rushTd: 4, rec: 7, recYds: 48, recTd: 0 }),
  makeOffPlayer('Dameon Pierce', 'RB', 'HOU', 31, 4.10, { rushYds: 315, rushTd: 3, rec: 8, recYds: 64, recTd: 0 }),
  makeOffPlayer('Trey Sermon', 'RB', 'IND', 27, 4.04, { rushYds: 280, rushTd: 2, rec: 12, recYds: 86, recTd: 0 }),
  makeOffPlayer('Tyjae Spears', 'RB', 'TEN', 2, 4.21, { rushYds: 330, rushTd: 3, rec: 24, recYds: 192, recTd: 1 }),
  makeOffPlayer('Jaleel McLaughlin', 'RB', 'DEN', 38, 4.16, { rushYds: 345, rushTd: 2, rec: 20, recYds: 125, recTd: 1 }),
  makeOffPlayer('Alexander Mattison', 'RB', 'LV', 22, 4.12, { rushYds: 360, rushTd: 3, rec: 22, recYds: 175, recTd: 1 }),
  makeOffPlayer('Gus Edwards', 'RB', 'LAC', 4, 4.17, { rushYds: 390, rushTd: 4, rec: 4, recYds: 25, recTd: 0 }),
  makeOffPlayer('Ezekiel Elliott', 'RB', 'DAL', 15, 3.98, { rushYds: 265, rushTd: 3, rec: 11, recYds: 72, recTd: 0 }),
  makeOffPlayer('Kenneth Gainwell', 'RB', 'PHI', 14, 4.13, { rushYds: 295, rushTd: 2, rec: 15, recYds: 110, recTd: 0 }),
  makeOffPlayer('Roschon Johnson', 'RB', 'CHI', 23, 4.11, { rushYds: 260, rushTd: 5, rec: 13, recYds: 92, recTd: 0 }),
  makeOffPlayer('Emanuel Wilson', 'RB', 'GB', 31, 4.15, { rushYds: 335, rushTd: 3, rec: 9, recYds: 74, recTd: 1 }),
  makeOffPlayer('Ty Chandler', 'RB', 'MIN', 32, 4.06, { rushYds: 270, rushTd: 1, rec: 10, recYds: 78, recTd: 0 }),
  makeOffPlayer('Jonathon Brooks', 'RB', 'CAR', 24, 4.18, { rushYds: 315, rushTd: 3, rec: 14, recYds: 115, recTd: 0 }),
  makeOffPlayer('Kendre Miller', 'RB', 'NO', 25, 4.08, { rushYds: 285, rushTd: 2, rec: 9, recYds: 66, recTd: 0 }),
  makeOffPlayer('Trey Benson', 'RB', 'ARI', 33, 4.23, { rushYds: 368, rushTd: 3, rec: 11, recYds: 84, recTd: 0 }),
  makeOffPlayer('Blake Corum', 'RB', 'LAR', 22, 4.20, { rushYds: 330, rushTd: 3, rec: 10, recYds: 72, recTd: 0 }),

  // 32 Additional WRs (96 WR total)
  makeOffPlayer('Keon Coleman', 'WR', 'BUF', 0, 4.34, { rec: 28, recYds: 448, recTd: 4 }),
  makeOffPlayer('Malik Washington', 'WR', 'MIA', 83, 4.08, { rec: 24, recYds: 275, recTd: 2 }),
  makeOffPlayer('Kayshon Boutte', 'WR', 'NE', 9, 4.12, { rec: 26, recYds: 350, recTd: 2 }),
  makeOffPlayer('Allen Lazard', 'WR', 'NYJ', 10, 4.25, { rec: 32, recYds: 440, recTd: 5 }),
  makeOffPlayer('Nelson Agholor', 'WR', 'BAL', 15, 4.05, { rec: 21, recYds: 295, recTd: 2 }),
  makeOffPlayer('Andrei Iosivas', 'WR', 'CIN', 80, 4.16, { rec: 24, recYds: 315, recTd: 5 }),
  makeOffPlayer('Elijah Moore', 'WR', 'CLE', 8, 4.14, { rec: 34, recYds: 360, recTd: 1 }),
  makeOffPlayer('Calvin Austin III', 'WR', 'PIT', 19, 4.17, { rec: 23, recYds: 375, recTd: 3 }),
  makeOffPlayer('Tank Dell', 'WR', 'HOU', 3, 4.42, { rec: 38, recYds: 495, recTd: 4 }),
  makeOffPlayer('Alec Pierce', 'WR', 'IND', 14, 4.30, { rec: 26, recYds: 525, recTd: 5 }),
  makeOffPlayer('Parker Washington', 'WR', 'JAX', 11, 4.09, { rec: 25, recYds: 310, recTd: 3 }),
  makeOffPlayer('Tyler Boyd', 'WR', 'TEN', 83, 4.06, { rec: 29, recYds: 305, recTd: 1 }),
  makeOffPlayer('Devaughn Vele', 'WR', 'DEN', 81, 4.18, { rec: 30, recYds: 365, recTd: 2 }),
  makeOffPlayer('Hollywood Brown', 'WR', 'KC', 5, 4.35, { rec: 31, recYds: 410, recTd: 3 }),
  makeOffPlayer('Dont\'e Thornton Jr.', 'WR', 'LV', 84, 4.07, { rec: 22, recYds: 330, recTd: 2 }),
  makeOffPlayer('Joshua Palmer', 'WR', 'LAC', 5, 4.21, { rec: 28, recYds: 415, recTd: 2 }),
  makeOffPlayer('Jalen Tolbert', 'WR', 'DAL', 1, 4.24, { rec: 34, recYds: 425, recTd: 4 }),
  makeOffPlayer('Darius Slayton', 'WR', 'NYG', 86, 4.22, { rec: 29, recYds: 445, recTd: 2 }),
  makeOffPlayer('Jahan Dotson', 'WR', 'PHI', 83, 4.11, { rec: 22, recYds: 285, recTd: 2 }),
  makeOffPlayer('Luke McCaffrey', 'WR', 'WAS', 12, 4.10, { rec: 23, recYds: 270, recTd: 2 }),
  makeOffPlayer('Olamide Zaccheaus', 'WR', 'CHI', 13, 4.18, { rec: 34, recYds: 390, recTd: 3 }),
  makeOffPlayer('Tim Patrick', 'WR', 'DET', 12, 4.19, { rec: 25, recYds: 345, recTd: 3 }),
  makeOffPlayer('Romeo Doubs', 'WR', 'GB', 87, 4.38, { rec: 36, recYds: 485, recTd: 4 }),
  makeOffPlayer('Jalen Nailor', 'WR', 'MIN', 83, 4.20, { rec: 22, recYds: 340, recTd: 4 }),
  makeOffPlayer('Ray-Ray McCloud III', 'WR', 'ATL', 34, 4.23, { rec: 39, recYds: 435, recTd: 1 }),
  makeOffPlayer('Xavier Legette', 'WR', 'CAR', 17, 4.26, { rec: 31, recYds: 395, recTd: 4 }),
  makeOffPlayer('Cedrick Wilson Jr.', 'WR', 'NO', 11, 4.04, { rec: 21, recYds: 265, recTd: 2 }),
  makeOffPlayer('Jalen McMillan', 'WR', 'TB', 15, 4.27, { rec: 28, recYds: 380, recTd: 4 }),
  makeOffPlayer('Greg Dortch', 'WR', 'ARI', 4, 4.13, { rec: 27, recYds: 280, recTd: 2 }),
  makeOffPlayer('Demarcus Robinson', 'WR', 'LAR', 15, 4.29, { rec: 26, recYds: 395, recTd: 6 }),
  makeOffPlayer('Jauan Jennings', 'WR', 'SF', 15, 4.49, { rec: 45, recYds: 615, recTd: 5 }),
  makeOffPlayer('Tyler Lockett', 'WR', 'SEA', 16, 4.36, { rec: 37, recYds: 480, recTd: 2 }),

  // 16 Additional TEs (48 TE total)
  makeOffPlayer('Isaiah Likely', 'TE', 'BAL', 80, 4.39, { rec: 29, recYds: 365, recTd: 5 }),
  makeOffPlayer('Cole Kmet', 'TE', 'CHI', 85, 4.34, { rec: 35, recYds: 388, recTd: 4 }),
  makeOffPlayer('Taysom Hill', 'TE', 'NO', 7, 4.41, { rec: 18, recYds: 165, recTd: 1, rushYds: 225, rushTd: 5 }),
  makeOffPlayer('Harold Fannin Jr.', 'TE', 'CLE', 44, 4.36, { rec: 36, recYds: 390, recTd: 4 }),
  makeOffPlayer('Mason Taylor', 'TE', 'NYJ', 84, 4.28, { rec: 31, recYds: 340, recTd: 3 }),
  makeOffPlayer('Tyler Warren', 'TE', 'IND', 84, 4.44, { rec: 38, recYds: 460, recTd: 4 }),
  makeOffPlayer('Dawson Knox', 'TE', 'BUF', 88, 4.08, { rec: 19, recYds: 245, recTd: 2 }),
  makeOffPlayer('Noah Gray', 'TE', 'KC', 83, 4.19, { rec: 27, recYds: 310, recTd: 4 }),
  makeOffPlayer('Gunnar Helm', 'TE', 'TEN', 85, 4.14, { rec: 28, recYds: 315, recTd: 2 }),
  makeOffPlayer('Luke Musgrave', 'TE', 'GB', 88, 4.10, { rec: 22, recYds: 255, recTd: 2 }),
  makeOffPlayer('Ja\'Tavion Sanders', 'TE', 'CAR', 85, 4.17, { rec: 26, recYds: 295, recTd: 2 }),
  makeOffPlayer('Brenton Strange', 'TE', 'JAX', 85, 4.16, { rec: 27, recYds: 305, recTd: 2 }),
  makeOffPlayer('Ben Sinnott', 'TE', 'WAS', 82, 4.05, { rec: 18, recYds: 215, recTd: 2 }),
  makeOffPlayer('Austin Hooper', 'TE', 'NE', 81, 4.11, { rec: 26, recYds: 285, recTd: 3 }),
  makeOffPlayer('Foster Moreau', 'TE', 'NO', 87, 4.09, { rec: 21, recYds: 260, recTd: 3 }),
  makeOffPlayer('Darnell Washington', 'TE', 'PIT', 80, 4.06, { rec: 17, recYds: 210, recTd: 2 })
];

export const EXPANDED_DEFENSE_AND_ST = [
  ...EXTRA_DES,
  ...EXTRA_DTS,
  ...EXTRA_LBS,
  ...EXTRA_CBS,
  ...EXTRA_SAFETIES,
  ...EXTRA_KICKERS,
  ...EXTRA_DSTS
];

export const EXPANDED_OFFENSE_DEPTH = EXTRA_OFFENSE;
