
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileUser, 
  Users2, 
  Trophy, 
  Search, 
  Bell, 
  Zap, 
  TrendingUp, 
  ShieldAlert,
  ChevronRight,
  Activity,
  Flame,
  ArrowUpRight,
  PlusCircle,
  Save,
  Clock,
  Navigation,
  CheckCircle2,
  ClipboardList,
  Target,
  Medal,
  Calendar,
  ArrowDownRight,
  Sparkles,
  Users,
  UserPlus,
  ArrowRight,
  Settings,
  Camera,
  Edit2,
  Trash2,
  X,
  MapPin,
  ExternalLink,
  Battery,
  HeartPulse,
  Dumbbell,
  Wind,
  Coffee,
  RefreshCcw,
  LineChart as LineChartIcon,
  RotateCcw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { MOCK_USER, INITIAL_STATS } from './constants';
import { compareWithPro, getProPlayerInfo, generateProgressInsight, getUpcomingGames, syncSquadAndPerformance } from './geminiService';
import { AthleteStats, Player, User, PerformanceHistory } from './types';

const NAUTICO_SHIELD_URL = 'https://upload.wikimedia.org/wikipedia/pt/d/d4/Clube_N%C3%A1utico_Capibaribe_logo.png';

// Components
const ThemedLoading = ({ message = "Sincronizando Ecossistema 4THLETIX..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6 animate-in fade-in duration-700">
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
      <img 
        src={NAUTICO_SHIELD_URL} 
        alt="Náutico Shield" 
        className="w-24 h-24 relative z-10 animate-bounce"
        style={{ animationDuration: '2s' }}
      />
      <div className="absolute -inset-2 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
    <div className="text-center px-6">
      <p className="font-oswald text-xl font-bold uppercase tracking-tighter text-zinc-200">{message}</p>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-black">Conectando ao Transfermarkt & Súmulas Oficiais</p>
    </div>
  </div>
);

const StatCard = ({ label, value, unit, icon: Icon, color = "blue", subValue, negative }: any) => (
  <div className="glass p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      {subValue && (
        <span className={`text-xs font-medium ${negative ? 'text-rose-400' : 'text-emerald-400'} flex items-center gap-1`}>
          {negative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />} {subValue}
        </span>
      )}
    </div>
    <div>
      <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-2xl font-bold font-oswald text-zinc-100">{value}</h3>
        <span className="text-zinc-500 text-sm">{unit}</span>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold font-oswald tracking-tight uppercase">{title}</h2>
    {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
  </div>
);

const InputField = ({ label, icon: Icon, type = "text", name, value, onChange, placeholder, min, max, step }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2 tracking-widest">
      {Icon && <Icon size={12} className="text-zinc-400" />}
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={type === 'number' && value === 0 ? '' : value}
        onChange={onChange}
        placeholder={placeholder || (type === 'number' ? "0" : "")}
        min={min}
        max={max}
        step={step}
        className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl px-4 py-4 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-oswald text-xl text-zinc-100 placeholder:text-zinc-700"
      />
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [user, setUser] = useState<User>(MOCK_USER);
  const [searchQuery, setSearchQuery] = useState(user.organization);
  const [upcomingGamesData, setUpcomingGamesData] = useState<any[]>([]);
  const [clubLogo, setClubLogo] = useState<string>("");
  const [isFetchingGames, setIsFetchingGames] = useState(false);
  const [isSyncingSquad, setIsSyncingSquad] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [saveMessageText, setSaveMessageText] = useState('Dados registrados com sucesso!');
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(user.managedPlayers[0]?.id || '');
  const [formData, setFormData] = useState<AthleteStats>(user.managedPlayers[0]?.stats || INITIAL_STATS);
  
  // New state for reports
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceHistory>('velocidadeMaxima');

  // States for Modals/Forms
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerForm, setPlayerForm] = useState({ name: '', position: '', avatar: '' });
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, organization: user.organization, avatar: user.avatar });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const player = user.managedPlayers.find(p => p.id === selectedPlayerId);
    if (player) {
      setFormData(player.stats);
    }
  }, [selectedPlayerId, user.managedPlayers]);

  useEffect(() => {
    if (activeTab === 'Relatórios') {
      fetchInsight();
    }
    if (activeTab === 'Próximos Jogos' && upcomingGamesData.length === 0) {
      handleFetchGames();
    }
  }, [activeTab, selectedPlayerId]);

  const selectedPlayer = user.managedPlayers.find(p => p.id === selectedPlayerId) || user.managedPlayers[0];

  const fetchInsight = async () => {
    if (!selectedPlayer || selectedPlayer.history.length === 0) {
      setAiInsight(`Selecione um jogador e registre atividades para gerar insights do ${user.role}.`);
      return;
    }
    setLoadingInsight(true);
    const insight = await generateProgressInsight(selectedPlayer.history, selectedPlayer.stats);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? (value === "" ? 0 : parseFloat(value)) : value
    }));
  };

  const triggerSaveMessage = (text: string) => {
    setSaveMessageText(text);
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  const handleSaveStats = () => {
    const newScore = Math.min(100, Math.round((formData.velocidadeMaximaJogo / 35 * 100 + formData.distanciaJogo / 12 * 100) / 2));
    
    const newHistoryEntry: PerformanceHistory = {
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: newScore || 0,
      sprints: formData.sprints || 0,
      distance: formData.distanciaJogo || 0,
      velocidadeMaxima: formData.velocidadeMaximaJogo || 0,
      percepcaoEsforco: formData.percepcaoEsforco || 0,
      fadiga: formData.controleFadiga || 0
    };

    const updatedPlayers = user.managedPlayers.map(p => {
      if (p.id === selectedPlayerId) {
        return {
          ...p,
          stats: formData,
          history: [...p.history, newHistoryEntry]
        };
      }
      return p;
    });

    setUser(prev => ({
      ...prev,
      managedPlayers: updatedPlayers,
      xp: prev.xp + 100,
      level: Math.floor((prev.xp + 100) / 1000) + 12
    }));

    triggerSaveMessage('Métricas registradas com sucesso!');
    setActiveTab('Dashboard');
  };

  const handleSyncSquad = async () => {
    setIsSyncingSquad(true);
    try {
      const result = await syncSquadAndPerformance(user.organization);
      const newPlayers: Player[] = result.players.map((p: any, idx: number) => ({
        id: `sp-${Date.now()}-${idx}`,
        name: p.name,
        position: p.position,
        avatar: p.avatar || `https://picsum.photos/seed/${p.name}/200/200`,
        stats: {
          ...INITIAL_STATS,
          ...p.stats
        },
        history: p.history
      }));

      setUser(prev => ({
        ...prev,
        managedPlayers: newPlayers
      }));

      if (newPlayers.length > 0) {
        setSelectedPlayerId(newPlayers[0].id);
      }
      
      triggerSaveMessage('Elenco e estatísticas oficiais sincronizados!');
    } catch (e) {
      console.error(e);
      triggerSaveMessage('Falha ao sincronizar. Tente novamente.');
    } finally {
      setIsSyncingSquad(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfile: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isProfile) {
          setProfileForm(prev => ({ ...prev, avatar: base64String }));
        } else {
          setPlayerForm(prev => ({ ...prev, avatar: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePlayer = () => {
    if (!playerForm.name || !playerForm.position) return;

    if (editingPlayer) {
      const updatedPlayers = user.managedPlayers.map(p => 
        p.id === editingPlayer.id ? { ...p, ...playerForm } : p
      );
      setUser(prev => ({ ...prev, managedPlayers: updatedPlayers }));
      triggerSaveMessage('Atleta atualizado com sucesso!');
    } else {
      const newPlayer: Player = {
        id: `p-${Date.now()}`,
        name: playerForm.name,
        position: playerForm.position,
        avatar: playerForm.avatar || `https://picsum.photos/seed/${playerForm.name}/200/200`,
        stats: INITIAL_STATS,
        history: []
      };
      setUser(prev => ({ ...prev, managedPlayers: [...prev.managedPlayers, newPlayer] }));
      triggerSaveMessage('Novo atleta adicionado ao squad!');
    }
    setIsPlayerModalOpen(false);
    setEditingPlayer(null);
    setPlayerForm({ name: '', position: '', avatar: '' });
  };

  const handleSaveProfile = () => {
    setUser(prev => ({
      ...prev,
      name: profileForm.name,
      organization: profileForm.organization,
      avatar: profileForm.avatar
    }));
    setIsProfileModalOpen(false);
    triggerSaveMessage('Perfil atualizado com sucesso!');
  };

  const openAddPlayer = () => {
    setEditingPlayer(null);
    setPlayerForm({ name: '', position: '', avatar: '' });
    setIsPlayerModalOpen(true);
  };

  const openEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({ name: player.name, position: player.position, avatar: player.avatar });
    setIsPlayerModalOpen(true);
  };

  const handleFetchGames = async () => {
    if (!searchQuery) return;
    setIsFetchingGames(true);
    setUpcomingGamesData([]);
    setClubLogo("");
    try {
      const result = await getUpcomingGames(searchQuery);
      setUpcomingGamesData(result.games);
      setClubLogo(result.clubLogo);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingGames(false);
    }
  };

  const currentEntry = selectedPlayer.history.length > 0 
    ? selectedPlayer.history[selectedPlayer.history.length - 1] 
    : { score: 0, sprints: 0, distance: 0 };
    
  const prevEntry = selectedPlayer.history.length > 1 
    ? selectedPlayer.history[selectedPlayer.history.length - 2] 
    : { score: 0, sprints: 0, distance: 0 };

  const METRICS_OPTIONS = [
    { value: 'velocidadeMaxima', label: 'Velocidade Máxima (km/h)', color: '#10b981' },
    { value: 'distance', label: 'Distância Percorrida (km)', color: '#3b82f6' },
    { value: 'sprints', label: 'Quantidade de Sprints', color: '#f59e0b' },
    { value: 'percepcaoEsforco', label: 'Percepção de Esforço (RPE)', color: '#ef4444' },
    { value: 'fadiga', label: 'Controle de Fadiga', color: '#a855f7' },
  ];

  if (isSyncingSquad) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0b] items-center justify-center">
        <ThemedLoading message={`Sincronizando dados reais do ${user.organization} via Transfermarkt...`} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0b] text-zinc-100 selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800/50 bg-[#0a0a0b] sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center italic text-black font-black text-xl">4</div>
            4THLETIX
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'Dashboard', icon: LayoutDashboard },
            { id: 'Registrar', icon: PlusCircle },
            { id: 'Relatórios', icon: ClipboardList },
            { id: 'Próximos Jogos', icon: Calendar },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <item.icon size={20} />
              <span>{item.id}</span>
            </button>
          ))}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all duration-200"
          >
            <Settings size={20} />
            <span>Meu Perfil</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button 
            onClick={handleSyncSquad}
            className="w-full mb-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Sincronizar Dados
          </button>
          <div className="glass p-4 rounded-xl cursor-pointer hover:bg-zinc-800/20 transition-all" onClick={() => setIsProfileModalOpen(true)}>
            <div className="flex items-center gap-3 mb-3">
              <img src={user.avatar} className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest truncate">{user.organization}</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(user.xp % 1000) / 10}%` }}></div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-6 sticky top-0 glass z-50">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center italic text-black font-black text-xl">4</div>
             <span className="text-xs font-bold text-zinc-500 ml-2 hidden md:inline uppercase tracking-widest">{user.organization}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={handleSyncSquad}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-full border-zinc-800 text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              <RotateCcw size={14} />
              <span className="text-xs font-bold">Sync Squad</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-full border-zinc-800">
              <Users size={14} className="text-emerald-400" />
              <span className="text-xs font-bold">{user.managedPlayers.length} Atletas</span>
            </div>
            <button className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
            <div className="h-8 w-[1px] bg-zinc-800"></div>
            <img 
              src={user.avatar} 
              className="w-8 h-8 rounded-full border border-emerald-500/50 object-cover cursor-pointer hover:scale-110 transition-transform" 
              onClick={() => setIsProfileModalOpen(true)}
            />
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
          
          {activeTab === 'Dashboard' && (
            <>
              <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent"></div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                    <img src={user.avatar} className="w-32 h-32 rounded-3xl border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                      <Edit2 size={24} className="text-white" />
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-black font-black p-2 rounded-lg text-[10px] italic">
                      TRAINER
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-black font-oswald uppercase tracking-tight">{user.name}</h1>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold border border-zinc-700 text-zinc-300">{user.organization}</span>
                      <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-xs font-bold border border-emerald-500/30 text-emerald-400">Preparação Física</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleSyncSquad}
                    className="flex items-center gap-2 px-6 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-black uppercase rounded-2xl hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-xs tracking-tighter"
                  >
                    <RotateCcw size={16} /> Sincronizar Dados Reais
                  </button>
                  <button 
                    onClick={openAddPlayer}
                    className="flex items-center gap-2 px-6 py-4 bg-emerald-500 text-black font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all text-xs tracking-tighter"
                  >
                    <UserPlus size={16} /> Adicionar Atleta
                  </button>
                </div>
              </div>

              <SectionHeader title="Gestão do Elenco" subtitle="Monitore métricas, edite perfis ou selecione jogadores para relatórios." />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.managedPlayers.map(player => (
                  <div 
                    key={player.id}
                    className={`group relative glass p-6 rounded-3xl border transition-all ${selectedPlayerId === player.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800/50 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative group/avatar cursor-pointer" onClick={() => openEditPlayer(player)}>
                        <img src={player.avatar} className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 group-hover:border-emerald-500/50 transition-colors" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                          <Edit2 size={14} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold font-oswald text-lg leading-tight truncate">{player.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{player.position}</p>
                      </div>
                      <button 
                        onClick={() => openEditPlayer(player)}
                        className="p-2 text-zinc-600 hover:text-emerald-400 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-zinc-900/50 p-3 rounded-xl">
                        <p className="text-[8px] text-zinc-500 uppercase font-black mb-1">Velocidade Máx.</p>
                        <p className="font-oswald text-emerald-400">{player.stats.velocidadeMaximaJogo} km/h</p>
                      </div>
                      <div className="bg-zinc-900/50 p-3 rounded-xl">
                        <p className="text-[8px] text-zinc-500 uppercase font-black mb-1">Carga (RPE)</p>
                        <p className="font-oswald text-amber-400">{player.stats.percepcaoEsforco}/10</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedPlayerId(player.id); setActiveTab('Relatórios'); }}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-[10px] font-black uppercase tracking-tighter hover:bg-zinc-700 transition-all flex items-center justify-center gap-1"
                      >
                        <BarChart3 size={12} /> Relatório
                      </button>
                      <button 
                        onClick={() => { setSelectedPlayerId(player.id); setActiveTab('Registrar'); }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-tighter hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1 border border-emerald-500/20"
                      >
                        <PlusCircle size={12} /> Lançar
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={openAddPlayer}
                  className="glass p-6 rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/30 transition-all flex flex-col items-center justify-center gap-3 group min-h-[220px]"
                >
                  <div className="p-4 bg-zinc-900 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                    <UserPlus className="text-zinc-600 group-hover:text-emerald-400" size={32} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-emerald-400">Novo Atleta</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'Relatórios' && (
            <div className="animate-in fade-in duration-500 space-y-8 pb-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                    <ClipboardList size={28} />
                   </div>
                   <div>
                    <h1 className="text-3xl font-black font-oswald uppercase tracking-tighter">Relatórios de Atleta</h1>
                    <p className="text-zinc-500">Métricas fundamentais de <span className="text-emerald-400 font-bold">{selectedPlayer.name}</span></p>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] font-black uppercase text-zinc-500 ml-2">Atleta:</span>
                  <select 
                    value={selectedPlayerId} 
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-0 cursor-pointer"
                  >
                    {user.managedPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingInsight ? (
                <ThemedLoading message={`Gerando análise tática para ${selectedPlayer.name}...`} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                      label="Score Performance" 
                      value={currentEntry.score} 
                      unit="pts" 
                      icon={Target} 
                      color="emerald" 
                      subValue={selectedPlayer.history.length > 1 ? (Math.abs(currentEntry.score - prevEntry.score)).toFixed(1) + " pts" : null} 
                      negative={(currentEntry.score - prevEntry.score) < 0}
                    />
                    <StatCard 
                      label="RPE (Esforço)" 
                      value={selectedPlayer.stats.percepcaoEsforco} 
                      unit="/ 10" 
                      icon={ShieldAlert} 
                      color="amber" 
                    />
                    <StatCard 
                      label="Volume Total" 
                      value={selectedPlayer.stats.distanciaJogo} 
                      unit="km" 
                      icon={Navigation} 
                      color="blue" 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass p-8 rounded-3xl">
                      <SectionHeader title="Score Geral" subtitle="Tendência de rendimento técnico nos últimos registros." />
                      <div className="h-[300px] w-full mt-6">
                        {selectedPlayer.history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedPlayer.history}>
                              <defs>
                                <linearGradient id="colorScoreP" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                              <XAxis dataKey="date" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
                              <YAxis hide />
                              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }} />
                              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScoreP)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-zinc-600 italic">Nenhum histórico disponível.</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="glass p-8 rounded-3xl border border-emerald-500/10 relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <img src={NAUTICO_SHIELD_URL} className="w-40 h-40 opacity-20" alt="" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-oswald uppercase mb-4 flex items-center gap-2">
                          <Zap className="text-yellow-400" size={20} />
                          Feedback IA 4THLETIX
                        </h3>
                        <p className="text-zinc-300 leading-relaxed italic whitespace-pre-line">"{aiInsight || "Dados insuficientes para gerar insights detalhados."}"</p>
                      </div>
                      <button onClick={fetchInsight} className="mt-8 text-xs font-bold uppercase tracking-widest text-emerald-400 hover:underline flex items-center gap-2">
                        <Sparkles size={14} /> Atualizar Análise do Preparador
                      </button>
                    </div>
                  </div>

                  {/* New detailed metric chart */}
                  <div className="glass p-8 rounded-3xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div>
                        <h3 className="text-xl font-bold font-oswald uppercase flex items-center gap-2">
                          <LineChartIcon className="text-blue-400" size={20} />
                          Evolução Técnica Detalhada
                        </h3>
                        <p className="text-zinc-500 text-sm">Acompanhe o progresso específico de cada atributo ao longo do tempo.</p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800 w-full md:w-auto overflow-x-auto">
                        <span className="text-[10px] font-black uppercase text-zinc-500 ml-2 whitespace-nowrap">Exibir:</span>
                        <div className="flex gap-2">
                          {METRICS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setSelectedMetric(opt.value as keyof PerformanceHistory)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${selectedMetric === opt.value ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              {opt.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="h-[350px] w-full">
                      {selectedPlayer.history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedPlayer.history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#71717a" 
                              fontSize={10} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis 
                              stroke="#71717a" 
                              fontSize={10} 
                              axisLine={false} 
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#18181b', 
                                border: '1px solid #27272a', 
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                              }} 
                              itemStyle={{ color: METRICS_OPTIONS.find(o => o.value === selectedMetric)?.color || '#10b981' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey={selectedMetric} 
                              stroke={METRICS_OPTIONS.find(o => o.value === selectedMetric)?.color || '#10b981'} 
                              strokeWidth={4} 
                              dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0b' }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                              animationDuration={1500}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-600 italic">Nenhum histórico disponível para este atleta.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Registrar' && (
            <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-8">
                <h1 className="text-4xl font-black font-oswald uppercase italic tracking-tighter mb-2">Entrada de Performance</h1>
                <p className="text-zinc-500 text-sm">Registre as métricas coletadas para os atletas do {user.organization}.</p>
               </div>
               
               <div className="glass p-8 rounded-3xl space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Atleta Selecionado</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {user.managedPlayers.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${selectedPlayerId === p.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <img src={p.avatar} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-[10px] font-bold truncate">{p.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-zinc-800/50 w-full"></div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Métricas de Campo */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest border-l-2 border-emerald-500 pl-3">Métricas de Campo</h3>
                    <InputField label="Velocidade Máxima (km/h)" icon={Zap} name="velocidadeMaximaJogo" value={formData.velocidadeMaximaJogo} onChange={handleInputChange} type="number" step="0.1" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField label="Distância Treino (km)" icon={Activity} name="distanciaTreino" value={formData.distanciaTreino} onChange={handleInputChange} type="number" step="0.1" />
                      <InputField label="Distância Jogo (km)" icon={Navigation} name="distanciaJogo" value={formData.distanciaJogo} onChange={handleInputChange} type="number" step="0.1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField label="Tempo de Treino (min)" icon={Clock} name="tempoTreino" value={formData.tempoTreino} onChange={handleInputChange} type="number" />
                      <InputField label="Tempo em Campo (min)" icon={Clock} name="tempoCampo" value={formData.tempoCampo} onChange={handleInputChange} type="number" />
                    </div>
                    <InputField label="Acelerações" icon={ArrowUpRight} name="aceleracoes" value={formData.aceleracoes} onChange={handleInputChange} type="number" />
                    <InputField label="Sprints" icon={Flame} name="sprints" value={formData.sprints} onChange={handleInputChange} type="number" />
                  </div>

                  {/* Capacidades Físicas */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest border-l-2 border-blue-500 pl-3">Capacidades Físicas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField label="Resistência Cardiorrespiratória" icon={HeartPulse} name="resistenciaCardiorrespiratoria" value={formData.resistenciaCardiorrespiratoria} onChange={handleInputChange} type="number" placeholder="Score 0-100" />
                      <InputField label="Força Máxima" icon={Dumbbell} name="forcaMaxima" value={formData.forcaMaxima} onChange={handleInputChange} type="number" placeholder="kg ou Score" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField label="Potência Muscular" icon={Zap} name="potenciaMuscular" value={formData.potenciaMuscular} onChange={handleInputChange} type="number" placeholder="Score" />
                      <InputField label="Resistência Aeróbica" icon={Wind} name="resistenciaAerobica" value={formData.resistenciaAerobica} onChange={handleInputChange} type="number" placeholder="VO2 ou Score" />
                    </div>
                  </div>

                  {/* Preparação e Recuperação */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest border-l-2 border-amber-500 pl-3">Rotina e Recuperação</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField label="Ativação Pré-Treino (min)" icon={Coffee} name="trabalhoAtivacaoPreTreino" value={formData.trabalhoAtivacaoPreTreino} onChange={handleInputChange} type="number" />
                      <InputField label="Regeneração Pós-Treino (min)" icon={RefreshCcw} name="regeneracaoPosTreino" value={formData.regeneracaoPosTreino} onChange={handleInputChange} type="number" />
                    </div>
                  </div>
                  
                  {/* Controle de Saúde e Carga */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest border-l-2 border-rose-500 pl-3">Saúde e Carga</h3>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2 tracking-widest">
                        <ShieldAlert size={12} className="text-zinc-400" />
                        Risco de Lesão
                      </label>
                      <select 
                        name="riscoLesao" 
                        value={formData.riscoLesao} 
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-oswald text-xl text-zinc-100"
                      >
                        <option value="Baixo">Baixo</option>
                        <option value="Médio">Médio</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Battery size={12} className="text-zinc-400" />
                          Controle de Fadiga ({formData.controleFadiga}/10)
                        </label>
                      </div>
                      <input type="range" min="0" max="10" name="controleFadiga" value={formData.controleFadiga} onChange={handleInputChange} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Intensidade do Treino ({formData.intensidadeTreino}/10)</label>
                      </div>
                      <input type="range" min="0" max="10" name="intensidadeTreino" value={formData.intensidadeTreino} onChange={handleInputChange} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Percepção do Esforço ({formData.percepcaoEsforco}/10)</label>
                      </div>
                      <input type="range" min="0" max="10" name="percepcaoEsforco" value={formData.percepcaoEsforco} onChange={handleInputChange} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-4">
                  <button onClick={handleSaveStats} className="w-full py-5 bg-emerald-500 text-black font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Save size={20} /> Salvar Métricas para {selectedPlayer.name}
                  </button>
                  <button onClick={() => setActiveTab('Dashboard')} className="w-full py-5 bg-transparent text-zinc-500 font-bold uppercase rounded-2xl hover:text-zinc-300 transition-all text-xs tracking-widest">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Próximos Jogos' && (
            <div className="space-y-8 pb-20 animate-in fade-in duration-500">
              <div className="glass p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-black font-oswald uppercase mb-2 italic tracking-tighter">Calendário Profissional</h2>
                    <p className="text-zinc-500">Mantenha-se informado sobre a agenda oficial do seu clube.</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar Clube..." 
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 rounded-2xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button onClick={handleFetchGames} disabled={isFetchingGames || !searchQuery} className="px-6 py-3 bg-emerald-500 text-black font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all text-xs tracking-widest flex items-center justify-center gap-2">
                      <Trophy size={16} /> Buscar Jogos
                    </button>
                  </div>
                </div>

                {isFetchingGames ? (
                  <ThemedLoading message={`Consultando calendários para ${searchQuery}...`} />
                ) : upcomingGamesData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingGamesData.map((game, idx) => (
                      <div key={idx} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                            {game.competition}
                          </span>
                          <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                            <Calendar size={12} /> {game.date}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 my-6">
                          <div className="flex flex-col items-center flex-1 text-center min-w-0">
                            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-zinc-700/50 group-hover:scale-110 transition-transform relative">
                               <span className="absolute z-0 opacity-20 font-black italic text-xl">
                                {game.home ? (searchQuery?.charAt(0) || 'H') : (game.opponent?.charAt(0) || 'A')}
                               </span>
                               <img 
                                src={game.home ? (clubLogo || NAUTICO_SHIELD_URL) : game.opponentLogo} 
                                className="w-full h-full object-contain p-2 relative z-10" 
                                alt=""
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                               />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-tighter truncate w-full">
                              {game.home ? searchQuery : game.opponent}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-black italic text-emerald-500">VS</span>
                            <span className="text-[10px] font-black uppercase text-zinc-500 mt-1">{game.time}</span>
                          </div>

                          <div className="flex flex-col items-center flex-1 text-center min-w-0">
                            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-zinc-700/50 group-hover:scale-110 transition-transform relative">
                               <span className="absolute z-0 opacity-20 font-black italic text-xl">
                                {!game.home ? (searchQuery?.charAt(0) || 'H') : (game.opponent?.charAt(0) || 'A')}
                               </span>
                               <img 
                                src={!game.home ? (clubLogo || NAUTICO_SHIELD_URL) : game.opponentLogo} 
                                className="w-full h-full object-contain p-2 relative z-10" 
                                alt=""
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                               />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-tighter truncate w-full">
                              {!game.home ? searchQuery : game.opponent}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase truncate max-w-[120px]">
                            <MapPin size={10} /> {game.location}
                          </span>
                          <button className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1 hover:underline">
                            Detalhes <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center text-center opacity-40">
                    <Trophy size={48} className="mb-4" />
                    <p className="font-oswald text-xl uppercase italic">Selecione um clube para ver a agenda</p>
                    <p className="text-sm">Os dados serão buscados em tempo real na internet.</p>
                  </div>
                )}
              </div>

              {upcomingGamesData.length > 0 && (
                <div className="glass p-6 rounded-3xl border border-emerald-500/10">
                  <h3 className="text-lg font-black font-oswald uppercase italic mb-4 flex items-center gap-2">
                    <TrendingUp className="text-emerald-400" size={18} /> 
                    Dica do Ecossistema
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Com base nos próximos confrontos do <span className="text-emerald-400 font-bold">{searchQuery}</span>, recomendamos intensificar os treinos de transição defensiva e explosão muscular para estar alinhado com o ritmo competitivo do elenco principal.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal: Adicionar/Editar Atleta */}
        {isPlayerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPlayerModalOpen(false)}></div>
            <div className="glass w-full max-w-xl rounded-3xl overflow-hidden relative animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black font-oswald uppercase italic tracking-tighter">
                    {editingPlayer ? 'Editar Atleta' : 'Novo Atleta'}
                  </h2>
                  <button onClick={() => setIsPlayerModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4">
                   <div className="relative group">
                    <img 
                      src={playerForm.avatar || `https://picsum.photos/seed/default/200/200`} 
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-zinc-800 group-hover:border-emerald-500/50 transition-all" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"
                    >
                      <Camera className="text-white" size={24} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, false)} 
                    />
                   </div>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Foto de Perfil do Atleta</p>
                </div>

                <div className="space-y-4">
                  <InputField 
                    label="Nome Completo" 
                    placeholder="Ex: Paulo Sérgio" 
                    value={playerForm.name} 
                    onChange={(e: any) => setPlayerForm(p => ({ ...p, name: e.target.value }))} 
                  />
                  <InputField 
                    label="Posição Principal" 
                    placeholder="Ex: Atacante, Goleiro..." 
                    value={playerForm.position} 
                    onChange={(e: any) => setPlayerForm(p => ({ ...p, position: e.target.value }))} 
                  />
                </div>

                <button 
                  onClick={handleSavePlayer}
                  className="w-full py-5 bg-emerald-500 text-black font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <Save size={20} /> {editingPlayer ? 'Salvar Alterações' : 'Adicionar ao Squad'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Editar Perfil do Treinador */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsProfileModalOpen(false)}></div>
            <div className="glass w-full max-w-xl rounded-3xl overflow-hidden relative animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black font-oswald uppercase italic tracking-tighter">Meu Perfil</h2>
                  <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4">
                   <div className="relative group">
                    <img 
                      src={profileForm.avatar} 
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:brightness-75 transition-all" 
                    />
                    <button 
                      onClick={() => profileFileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"
                    >
                      <Camera className="text-white" size={24} />
                    </button>
                    <input 
                      type="file" 
                      ref={profileFileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, true)} 
                    />
                   </div>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Foto do Treinador</p>
                </div>

                <div className="space-y-4">
                  <InputField 
                    label="Nome do Treinador" 
                    value={profileForm.name} 
                    onChange={(e: any) => setProfileForm(p => ({ ...p, name: e.target.value }))} 
                  />
                  <InputField 
                    label="Organização / Clube" 
                    value={profileForm.organization} 
                    onChange={(e: any) => setProfileForm(p => ({ ...p, organization: e.target.value }))} 
                  />
                </div>

                <button 
                  onClick={handleSaveProfile}
                  className="w-full py-5 bg-emerald-500 text-black font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <Save size={20} /> Salvar Perfil
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="lg:hidden h-16 border-t border-zinc-800 bg-[#0a0a0b]/90 backdrop-blur-xl flex items-center justify-between px-2 sticky bottom-0 z-50">
          {[
            { id: 'Dashboard', label: 'Início', icon: LayoutDashboard },
            { id: 'Registrar', label: 'Lançar', icon: PlusCircle },
            { id: 'Relatórios', label: 'Relatos', icon: ClipboardList },
            { id: 'Próximos Jogos', label: 'Jogos', icon: Calendar },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 py-2 ${
                activeTab === item.id ? 'text-emerald-400 bg-emerald-500/5' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-black uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
          <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 py-2 text-zinc-500 hover:text-zinc-300`}
            >
              <Settings size={20} />
              <span className="text-[8px] font-black uppercase tracking-tight">Perfil</span>
            </button>
        </nav>

        {showSaveMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-full border-emerald-500/50 flex items-center gap-3 animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.2)] z-[200]">
            <CheckCircle2 className="text-emerald-500" />
            <span className="font-bold text-emerald-400">{saveMessageText}</span>
          </div>
        )}
      </main>
    </div>
  );
}
