// Live ESPN NFL API Service
// Connects to official ESPN endpoints:
// - Scoreboard: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
// - News: https://site.api.espn.com/apis/site/v2/sports/football/nfl/news
import espnMasterFallback from '../data/espnMasterData.json';

export async function fetchLiveEspnData() {
  try {
    // 1. Fetch live news from ESPN
    const newsRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news');
    let breakingNews = espnMasterFallback.breakingNews;
    if (newsRes.ok) {
      const newsJson = await newsRes.json();
      if (newsJson.articles && newsJson.articles.length > 0) {
        breakingNews = newsJson.articles.slice(0, 6).map((art, idx) => ({
          id: `live-espn-${idx}`,
          tag: 'ESPN LIVE WIRE',
          title: art.headline,
          desc: art.description,
          author: 'ESPN NFL Nation Desk',
          timestamp: art.published ? new Date(art.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live Just Now',
          link: art.links?.web?.href || 'https://www.espn.com/nfl/'
        }));
      }
    }

    // 2. Fetch live scoreboard from ESPN (Week 9 final & Week 10 upcoming)
    let tickerGames = espnMasterFallback.tickerGames;
    let nextUpcomingGame = espnMasterFallback.nextUpcomingGame;

    try {
      const sbRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
      if (sbRes.ok) {
        const sbJson = await sbRes.json();
        if (sbJson.events && sbJson.events.length > 0) {
          const parsed = sbJson.events.map((e) => {
            const comp = e.competitions?.[0] || {};
            const away = comp.competitors?.find((c) => c.homeAway === 'away') || {};
            const home = comp.competitors?.find((c) => c.homeAway === 'home') || {};
            const isLive = e.status?.type?.state === 'in';
            const isFinal = e.status?.type?.state === 'post';
            const detail = e.status?.type?.detail || e.status?.type?.description;

            const passLead = comp.leaders?.find((l) => l.name === 'passingYards')?.leaders?.[0];
            const rushLead = comp.leaders?.find((l) => l.name === 'rushingYards')?.leaders?.[0];
            const recLead = comp.leaders?.find((l) => l.name === 'receivingYards')?.leaders?.[0];

            return {
              id: e.id,
              name: e.name,
              shortName: e.shortName,
              status: isLive ? 'LIVE' : (isFinal ? 'FINAL' : 'SCHEDULED'),
              statusType: isLive ? 'live' : (isFinal ? 'final' : 'scheduled'),
              detail: detail,
              clock: isFinal ? 'FINAL' : (isLive ? `${e.status?.displayClock} Q${e.status?.period}` : detail),
              away: away.team?.abbreviation || 'AWAY',
              awayScore: away.score !== undefined ? away.score : '-',
              home: home.team?.abbreviation || 'HOME',
              homeScore: home.score !== undefined ? home.score : '-',
              network: comp.broadcasts?.[0]?.names?.[0] || 'ESPN',
              passLeader: passLead ? `${passLead.athlete?.displayName}: ${passLead.displayValue}` : null,
              rushLeader: rushLead ? `${rushLead.athlete?.displayName}: ${rushLead.displayValue}` : null,
              recLeader: recLead ? `${recLead.athlete?.displayName}: ${recLead.displayValue}` : null
            };
          });
          if (parsed.length > 0) {
            tickerGames = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Live scoreboard fetch warning:', e);
    }

    return {
      connected: true,
      lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      breakingNews,
      tickerGames,
      nextUpcomingGame,
      statLeaders: espnMasterFallback.statLeaders
    };
  } catch (err) {
    console.warn('ESPN Live API fetch fallback:', err);
    return {
      connected: false,
      lastSync: 'Cached',
      breakingNews: espnMasterFallback.breakingNews,
      tickerGames: espnMasterFallback.tickerGames,
      nextUpcomingGame: espnMasterFallback.nextUpcomingGame,
      statLeaders: espnMasterFallback.statLeaders
    };
  }
}
