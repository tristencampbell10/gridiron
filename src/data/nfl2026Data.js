// Official 2026 NFL Season Complete Starting Database
// Sourced from 2026 Active Starting Offensive Rosters across all 32 NFL Teams (160 Players)
// Synchronized with public.players and public.player_season_stats
import { ALL_32_TEAMS_PLAYERS } from './all32TeamsRoster';
import espnMaster from './espnMasterData.json';

export const CURRENT_SEASON_INFO = {
  year: 2026,
  seasonName: '2026 NFL Season',
  currentWeek: 'Week 10',
  currentDate: 'Tuesday, November 10, 2026',
  nextGame: 'Washington Commanders @ New York Giants (Thursday, Nov 12 • 8:15 PM EST on Prime Video)',
  seasonHeadline: 'Official 32-Team Starting Offensive Rosters & Live ESPN Ticker'
};

export const TICKER_GAMES_2026 = espnMaster.tickerGames;

export const NFL_PLAYERS_2026 = ALL_32_TEAMS_PLAYERS;

export const HEADLINES_2026 = espnMaster.breakingNews;
