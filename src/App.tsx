import React, { useState, useMemo } from 'react';
import { Shield, Zap, Swords, Brain, Heart, ChevronDown, Battery, BatteryWarning } from 'lucide-react';
import capacitesData from './capacites.json';

// --- 1. CONFIGURATION DES STATS DE BASE DE JOHN ---
const REFERENCE_LEVEL = 7.5;
const JOHN_BASE_STATS = { power: 1, speed: 1, trick: 16, recovery: 1, defense: 1 };

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

// --- NOUVELLE LOGIQUE : CALCUL DU DRAIN D'AURA ---
// Plus le niveau d'une capacité est élevé, plus le drain est exponentiel (complexité de l'aura)
const getAuraCost = (niveau) => {
  return parseFloat((niveau * (niveau / 1.5)).toFixed(1));
};

// --- 2. COMPOSANT GRAPHIQUE RADAR SVG SUR-MESURE ---
const RadarChart = ({ stats }) => {
  const maxStat = 10;
  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;
  const keys = ['power', 'speed', 'trick', 'recovery', 'defense'];
  const labels = ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'];

  const getPoints = (statObj, clamp = false) => {
    return keys.map((key, i) => {
      const val = clamp ? Math.min(statObj[key] || 1, maxStat) : (statObj[key] || 1);
      const r = (val / maxStat) * radius;
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const levels = [2, 4, 6, 8, 10];

  return (
    <div className="relative w-full aspect-square max-w-[450px] mx-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 rounded-full p-4 shadow-2xl border border-neutral-800">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {levels.map(l => (
          <polygon key={l} points={getPoints({power:l, speed:l, trick:l, recovery:l, defense:l}, true)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
        ))}
        {keys.map((key, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <line key={`axis-${key}`} x1={cx} y1={cy} x2={cx + radius * Math.cos(angle)} y2={cy + radius * Math.sin(angle)} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          )
        })}
        
        {/* Aura Shape */}
        <polygon points={getPoints(stats, false)} fill="rgba(255, 215, 0, 0.3)" stroke="#ffd700" strokeWidth="3" className="transition-all duration-500 ease-in-out" />
        
        {/* Nodes */}
        {keys.map((key, i) => {
          const val = stats[key] || 1;
          const r = (val / maxStat) * radius;
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <circle key={`pt-${key}`} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r="5" fill="#121212" stroke="#ffd700" strokeWidth="2.5" className="transition-all duration-500 ease-in-out" />
          )
        })}
        
        {/* Labels */}
        {keys.map((key, i) => {
          const val = stats[key] || 1;
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const currentRadius = (val / maxStat) * radius;
          const rText = Math.max(radius, currentRadius) + 35; 
          
          return (
            <text key={`lbl-${key}`} x={cx + rText * Math.cos(angle)} y={cy + rText * Math.sin(angle)} fill="#ffd700" fontSize="12" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" className="tracking-wider uppercase opacity-90 transition-all duration-500 ease-in-out">
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

  // --- LOGIQUE DE RÉSERVE D'AURA (Aura Capacity Logic) ---
  const maxAura = useMemo(() => johnLevel * 10, [johnLevel]);
  
  const currentAuraDrain = useMemo(() => {
    return slots.reduce((total, slotId) => {
      if (!slotId) return total;
      const cap = capacitesData.find(c => c.id === parseInt(slotId));
      return total + (cap ? getAuraCost(cap.niveau) : 0);
    }, 0);
  }, [slots]);

  const auraRemaining = parseFloat((maxAura - currentAuraDrain).toFixed(1));
  const auraPercentage = Math.min(100, (currentAuraDrain / maxAura) * 100);

  // --- MOTEUR DE FUSION ---
  const statsFinales = useMemo(() => {
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
      
      let statsCalculees: Record<string, number> = {};
      
      if (johnLevel >= cap.niveau) {
        for (let key in cap.stats_de_base) statsCalculees[key] = cap.stats_de_base[key];
      } else {
        for (let key in cap.ratios_stats) statsCalculees[key] = cap.ratios_stats[key] * johnLevel;
      }

      // Trouver la statistique la plus élevée de cette capacité (EN IGNORANT LE TRICK)
      let maxStatKey: string | null = null; 
      let maxStatValue = -1;
      for (let key in statsCalculees) {
        if (key !== 'trick' && statsCalculees[key] > maxStatValue) {
          maxStatValue = statsCalculees[key];
          maxStatKey = key;
        }
      }

      // Appliquer le bonus de 1.5 uniquement à la meilleure statistique (hors trick)
      for (let key in statsCalculees) {
        let valeur = statsCalculees[key];
        if (key === maxStatKey) valeur *= 1.5;
        stats[key] = Math.max(stats[key], valeur);
      }
    });

    // --- APPLICATION DE L'ARRONDI ICI ---
    for (let key in stats) {
      // Option 1 : Arrondi à 1 décimale (ex: 7.5)
      // stats[key] = Math.round(stats[key] * 10) / 10;
      
      // Option 2 : Pour arrondir à l'entier, utilise plutôt la ligne ci-dessous
      stats[key] = Math.round(stats[key]);
    }

    return stats;
  }, [johnLevel, slots]);

  const updateSlot = (index: number, value: string) => {
    // If the user is removing an ability (emptying the slot), always allow it
    if (!value) {
      const newSlots = [...slots];
      newSlots[index] = "";
      setSlots(newSlots);
      return;
    }

    // Checking if the new ability fits into John's Aura Reserves
    const cap = capacitesData.find(c => c.id === parseInt(value));
    
    // <-- AJOUTER CETTE LIGNE POUR RASSURER TYPESCRIPT -->
    if (!cap) return; 

    const currentSlotVal = slots[index];
    const currentCap = currentSlotVal ? capacitesData.find(c => c.id === parseInt(currentSlotVal)) : null;

    const currentDrainInThisSlot = currentCap ? getAuraCost(currentCap.niveau) : 0;
    const newDrain = getAuraCost(cap.niveau); // TypeScript ne râlera plus ici
    
    const projectedAuraDrain = currentAuraDrain - currentDrainInThisSlot + newDrain;

    if (projectedAuraDrain > maxAura) {
      // Simulate John's restriction: "I don't have that much aura left"
      return; 
    }

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
          Simulateur - Aura Manipulation & Capacity
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* PANNEAU GAUCHE : CONTRÔLES */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Niveau de John */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl flex items-center justify-between border-l-4 border-l-yellow-500">
            <label className="text-lg font-bold text-neutral-200">
              Niveau Actuel
            </label>
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

          {/* RESERVES D'AURA (Nouvelle section logiciel limitant les capacités) */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-end mb-3">
              <div>
                <h2 className="text-neutral-200 font-bold text-lg flex items-center gap-2">
                  <Battery size={20} className={auraPercentage > 90 ? "text-red-500" : "text-yellow-500"} /> 
                  Réserves d'Aura
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Les capacités haut-niveau drainent plus d'aura.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-yellow-500">{auraRemaining}</span>
                <span className="text-neutral-500 text-sm ml-1">/ {maxAura}</span>
              </div>
            </div>
            
            {/* Barre de progression d'Aura */}
            <div className="h-4 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 relative">
              <div 
                className={`h-full transition-all duration-500 ease-out ${auraPercentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`}
                style={{ width: `${auraPercentage}%` }}
              ></div>
            </div>
            {auraRemaining <= 5 && (
              <p className="text-red-400 text-xs font-bold mt-3 flex items-center gap-1">
                <BatteryWarning size={14} /> "Je n'ai plus beaucoup d'aura en réserve..."
              </p>
            )}
          </div>

          {/* Emplacements de copie */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-neutral-400 font-semibold mb-4 text-sm uppercase tracking-wider">Auras Copiées (Max 4)</h2>
            
            {slots.map((slot, index) => {
              const currentCap = slot ? capacitesData.find(c => c.id === parseInt(slot)) : null;
              const currentSlotDrain = currentCap ? getAuraCost(currentCap.niveau) : 0;

              return (
                <div key={index} className="relative group">
                  <select
                    value={slot}
                    onChange={(e) => updateSlot(index, e.target.value)}
                    className="w-full appearance-none bg-neutral-950 border border-neutral-800 text-neutral-200 py-3 pl-4 pr-16 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="">-- Emplacement Vide --</option>
                    {capacitesData.map(cap => {
                      const cost = getAuraCost(cap.niveau);
                      // On grise/désactive l'option si elle dépasse l'aura dispo (sauf si c'est la capacité déjà équipée)
                      const isTooExpensive = (currentAuraDrain - currentSlotDrain + cost) > maxAura;
                      return (
                        <option key={cap.id} value={cap.id} disabled={isTooExpensive && cap.id !== parseInt(slot)}>
                          {cap.nom_capacite} ({cap.nom_personnage}) - Niv {cap.niveau} {isTooExpensive && cap.id !== parseInt(slot) ? " [Aura Insuffisante]" : ""}
                        </option>
                      )
                    })}
                  </select>
                  
                  {/* Indicateur de coût d'aura dans le select */}
                  {slot && currentCap && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold text-yellow-500/70 bg-yellow-500/10 px-2 py-1 rounded-md">
                      -{getAuraCost(currentCap.niveau)}
                    </div>
                  )}

                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" size={20} />
                </div>
              );
            })}
          </div>
        </div>

        {/* PANNEAU DROIT : VISUALISATION */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
          
          <div className="w-full mb-8">
            <RadarChart stats={statsFinales} />
          </div>

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