
export interface AthleteStats {
  velocidadeMaximaJogo: number; // km/h
  distanciaTreino: number; // km
  distanciaJogo: number; // km
  distanciaMinutoTreino: number; // m/min
  distanciaMinutoJogo: number; // m/min
  tempoTreino: number; // min
  tempoCampo: number; // min
  sprints: number;
  corridaAltaIntensidade: number; // m
  aceleracoes: number;
  intensidadeTreino: number; // 0-10
  corridaCaminhadaTreino: string; // Ratio or summary
  riscoLesao: 'Baixo' | 'Médio' | 'Alto';
  percepcaoEsforco: number; // 0-10
  // Novas métricas
  controleFadiga: number; // 0-10
  resistenciaCardiorrespiratoria: number; // 0-100 ou métrica específica
  forcaMaxima: number; // kg ou score
  potenciaMuscular: number; // watts ou score
  resistenciaAerobica: number; // VO2 max ou score
  trabalhoAtivacaoPreTreino: number; // min
  regeneracaoPosTreino: number; // min
}

export interface PerformanceHistory {
  date: string;
  score: number;
  sprints: number;
  distance: number;
  velocidadeMaxima: number;
  percepcaoEsforco: number;
  fadiga: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  avatar: string;
  stats: AthleteStats;
  history: PerformanceHistory[];
}

export interface User {
  id: string;
  name: string;
  role: 'Physical Trainer' | 'Athlete' | 'Scout' | 'Organization';
  level: number;
  xp: number;
  avatar: string;
  organization: string;
  managedPlayers: Player[];
}

export interface ProPlayer {
  name: string;
  photo: string;
  team: string;
  position: string;
  stats_summary: string;
}
