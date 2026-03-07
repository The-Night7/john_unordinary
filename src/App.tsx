import React, { useState, useMemo } from 'react';
import { Shield, Zap, Swords, Brain, Heart, ChevronDown } from 'lucide-react';

import capacitesData from './capacites.json';

// --- 1. CONFIGURATION DES STATS DE BASE DE JOHN ---
const REFERENCE_LEVEL = 7.5;
const JOHN_BASE_STATS = { power: 1, speed: 1, trick: 16, recovery: 1, defense: 1 };

// Calcul automatique des rapports (stat / niveau) pour l'évolution de John
const JOHN_RATIOS = {
  power: JOHN_BASE_STATS.power / REFERENCE_LEVEL,
  speed: JOHN_BASE_STATS.speed / REFERENCE_LEVEL,
  trick: JOHN_BASE_STATS.trick / REFERENCE_LEVEL,
  recovery: JOHN_BASE_STATS.recovery / REFERENCE_LEVEL,
  defense: JOHN_BASE_STATS.defense / REFERENCE_LEVEL
};

const statConfig = [
  { key: 'power', label: 'Power', Icon: Swords, color: 'text-red-500' },
  { key: 'speed', label: 'Speed', Icon: Zap, color: 'text-blue-400' },
  { key: 'trick', label: 'Trick', Icon: Brain, color: 'text-purple-500' },
  { key: 'recovery', label: 'Recovery', Icon: Heart, color: 'text-green-400' },
  { key: 'defense', label: 'Defense', Icon: Shield, color: 'text-yellow-600' }
];

// --- 2. COMPOSANT GRAPHIQUE RADAR SVG SUR-MESURE ---
const RadarChart = ({ stats }) => {
  const maxStat = 16;
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const keys = ['power', 'speed', 'trick', 'recovery', 'defense'];
  const labels = ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'];

  // Calcule les coordonnées X,Y pour un groupe de statistiques
  const getPoints = (statObj) => {
    return keys.map((key, i) => {
      const val = Math.min(statObj[key] || 1, maxStat);
      const r = (val / maxStat) * radius;
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const levels = [4, 8, 12, 16]; // Cercles de niveau du radar

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 rounded-full p-4 shadow-2xl border border-neutral-800">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Toile d'araignée (Grille) */}
        {levels.map(l => (
          <polygon 
            key={l}
            points={getPoints({power:l, speed:l, trick:l, recovery:l, defense:l})}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1.5"
          />
        ))}
        {/* Lignes d'axes */}
        {keys.map((key, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <line 
              key={`axis-${key}`}
              x1={cx} y1={cy} 
              x2={cx + radius * Math.cos(angle)} 
              y2={cy + radius * Math.sin(angle)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.5"
            />
          )
        })}
        
        {/* L'Aura de John (La forme colorée) */}
        <polygon 
          points={getPoints(stats)}
          fill="rgba(255, 215, 0, 0.3)"
          stroke="#ffd700"
          strokeWidth="3"
          className="transition-all duration-500 ease-in-out"
        />
        
        {/* Les points sur les sommets */}
        {keys.map((key, i) => {
          const val = Math.min(stats[key] || 1, maxStat);
          const r = (val / maxStat) * radius;
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <circle 
              key={`pt-${key}`}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r="5"
              fill="#121212"
              stroke="#ffd700"
              strokeWidth="2.5"
              className="transition-all duration-500 ease-in-out"
            />
          )
        })}
        
        {/* Textes des statistiques */}
        {keys.map((key, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const r = radius + 30; // Décale le texte au bout de l'axe
          return (
            <text 
              key={`lbl-${key}`}
              x={cx + r * Math.cos(angle)}
              y={cy + r * Math.sin(angle)}
              fill="#ffd700"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              className="tracking-wider uppercase opacity-90"
            >
              {labels[i]}
            </text>
          )
        })}
      </svg>
    </div>
  );
};

// --- 3. APPLICATION PRINCIPALE ---
export default function App() {
  const [johnLevel, setJohnLevel] = useState(7.5);
  const [slots, setSlots] = useState(["", "", "", ""]);

  // --- MOTEUR DE FUSION (Recalculé automatiquement si niveau ou slots changent) ---
  const statsFinales = useMemo(() => {
    // Les stats de base de John évoluent maintenant dynamiquement grâce aux ratios !
    let stats = { 
      power: JOHN_RATIOS.power * johnLevel, 
      speed: JOHN_RATIOS.speed * johnLevel, 
      trick: JOHN_RATIOS.trick * johnLevel, 
      recovery: JOHN_RATIOS.recovery * johnLevel, 
      defense: JOHN_RATIOS.defense * johnLevel 
    };
    
    slots.forEach(slotId => {
      if (!slotId) return;
      
      const cap = capacitesData.find(c => c.id === parseInt(slotId));
      if (!cap) return;
      
      let statsCalculees = {};
      
      // Adaptation du niveau
      if (johnLevel >= cap.niveau) {
        // John est plus fort : Stats brutes copiées
        for (let key in cap.stats_de_base) {
          statsCalculees[key] = cap.stats_de_base[key];
        }
      } else {
        // John est plus faible : Ratio appliqué à son propre niveau
        for (let key in cap.ratios_stats) {
          statsCalculees[key] = cap.ratios_stats[key] * johnLevel;
        }
      }

      // Amplification et Fusion
      for (let key in statsCalculees) {
        let valeur = statsCalculees[key];
        
        // x1.5 sur la stat principale !
        if (key === cap.stat_principale) {
          valeur *= 1.5;
        }

        // FUSION : On garde le meilleur uniquement
        stats[key] = Math.max(stats[key], valeur);
      }
    });

    return stats;
  }, [johnLevel, slots]);

  // Fonction pour modifier un slot spécifique
  const updateSlot = (index, value) => {
    const newSlots = [...slots];
    newSlots[index] = value;
    setSlots(newSlots);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-4 md:p-8 selection:bg-yellow-500/30">
      
      {/* En-tête */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 tracking-tight mb-2">
          JOHN DOE
        </h1>
        <p className="text-neutral-400 font-medium uppercase tracking-widest text-sm md:text-base">
          Simulateur - Aura Manipulation
        </p>
      </div>

      {/* Grille Principale */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* PANNEAU GAUCHE : CONTRÔLES */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Niveau de John */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl flex items-center justify-between border-l-4 border-l-yellow-500">
            <label className="text-lg font-bold text-neutral-200">
              Niveau Actuel
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={johnLevel}
                onChange={(e) => setJohnLevel(parseFloat(e.target.value) || 1)}
                step="0.1" 
                min="1.0" 
                max="10.0"
                className="w-24 bg-neutral-950 text-yellow-500 text-xl font-black text-center py-2 px-3 rounded-lg border border-neutral-700 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
          </div>

          {/* Emplacements de copie */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-neutral-400 font-semibold mb-4 text-sm uppercase tracking-wider">Auras Copiées (Max 4)</h2>
            
            {slots.map((slot, index) => (
              <div key={index} className="relative">
                <select
                  value={slot}
                  onChange={(e) => updateSlot(index, e.target.value)}
                  className="w-full appearance-none bg-neutral-950 border border-neutral-800 text-neutral-200 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Emplacement Vide --</option>
                  {capacitesData.map(cap => (
                    <option key={cap.id} value={cap.id}>
                      {cap.nom_capacite} ({cap.nom_personnage}) - Niv {cap.niveau}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" size={20} />
              </div>
            ))}
          </div>
        </div>

        {/* PANNEAU DROIT : VISUALISATION */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          
          {/* Graphique Radar */}
          <div className="w-full mb-8">
            <RadarChart stats={statsFinales} />
          </div>

          {/* Affichage exact des statistiques */}
          <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3">
            {statConfig.map(({ key, label, Icon, color }) => (
              <div key={key} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-current ${color}`}></div>
                <Icon size={20} className={`mb-2 ${color} opacity-80`} />
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-1">{label}</span>
                <span className="text-xl font-black text-neutral-100">
                  {statsFinales[key].toFixed(1)}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}