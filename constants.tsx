
import { User, AthleteStats, Player } from './types';

export const INITIAL_STATS: AthleteStats = {
  velocidadeMaximaJogo: 0,
  distanciaTreino: 0,
  distanciaJogo: 0,
  distanciaMinutoTreino: 0,
  distanciaMinutoJogo: 0,
  tempoTreino: 0,
  tempoCampo: 0,
  sprints: 0,
  corridaAltaIntensidade: 0,
  aceleracoes: 0,
  intensidadeTreino: 0,
  corridaCaminhadaTreino: "0/0",
  riscoLesao: 'Baixo',
  percepcaoEsforco: 0,
  controleFadiga: 0,
  resistenciaCardiorrespiratoria: 0,
  forcaMaxima: 0,
  potenciaMuscular: 0,
  resistenciaAerobica: 0,
  trabalhoAtivacaoPreTreino: 0,
  regeneracaoPosTreino: 0
};

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Vágner',
    position: 'Goleiro',
    avatar: 'https://picsum.photos/seed/vagner/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 22.4, riscoLesao: 'Baixo', distanciaJogo: 4.2 },
    history: [
      { date: '01/05', score: 65, sprints: 12, distance: 3.8, velocidadeMaxima: 20.1, percepcaoEsforco: 6, fadiga: 4 },
      { date: '08/05', score: 72, sprints: 15, distance: 4.0, velocidadeMaxima: 21.5, percepcaoEsforco: 7, fadiga: 5 },
      { date: '15/05', score: 68, sprints: 10, distance: 3.9, velocidadeMaxima: 20.8, percepcaoEsforco: 5, fadiga: 3 },
      { date: '22/05', score: 81, sprints: 18, distance: 4.2, velocidadeMaxima: 22.4, percepcaoEsforco: 8, fadiga: 6 },
    ]
  },
  {
    id: 'p2',
    name: 'Robson Reis',
    position: 'Zagueiro',
    avatar: 'https://picsum.photos/seed/robson/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 29.8, riscoLesao: 'Baixo' },
    history: []
  },
  {
    id: 'p3',
    name: 'Sousa',
    position: 'Volante',
    avatar: 'https://picsum.photos/seed/sousa/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 30.5, riscoLesao: 'Baixo' },
    history: []
  },
  {
    id: 'p4',
    name: 'Patrick Allan',
    position: 'Meio-Campista',
    avatar: 'https://picsum.photos/seed/patrick/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 31.2, riscoLesao: 'Baixo' },
    history: []
  },
  {
    id: 'p5',
    name: 'Paulo Sérgio',
    position: 'Atacante',
    avatar: 'https://picsum.photos/seed/paulosergio/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 33.1, riscoLesao: 'Médio' },
    history: []
  },
  {
    id: 'p6',
    name: 'Bruno Mezenga',
    position: 'Atacante',
    avatar: 'https://picsum.photos/seed/mezenga/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 28.5, riscoLesao: 'Baixo' },
    history: []
  },
  {
    id: 'p7',
    name: 'Arnaldo',
    position: 'Lateral-Direito',
    avatar: 'https://picsum.photos/seed/arnaldo/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 32.7, riscoLesao: 'Baixo' },
    history: []
  },
  {
    id: 'p8',
    name: 'Marco Antônio',
    position: 'Meio-Campista',
    avatar: 'https://picsum.photos/seed/marco/200/200',
    stats: { ...INITIAL_STATS, velocidadeMaximaJogo: 30.2, riscoLesao: 'Baixo' },
    history: []
  }
];

export const MOCK_USER: User = {
  id: 't1',
  name: 'Prof. Jeferson Ribeiro',
  role: 'Physical Trainer',
  level: 18,
  xp: 2850,
  avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=400&auto=format&fit=crop',
  organization: 'Clube Náutico Capibaribe',
  managedPlayers: MOCK_PLAYERS
};

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'LayoutDashboard' },
  { label: 'Registrar', icon: 'PlusCircle' },
  { label: 'Relatórios', icon: 'ClipboardList' },
  { label: 'Estatísticas', icon: 'BarChart3' },
  { label: 'Currículo', icon: 'FileUser' },
  { label: 'Comparar', icon: 'Users2' },
  { label: 'Rankings', icon: 'Trophy' },
];
