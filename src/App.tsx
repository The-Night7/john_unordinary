import React, { useState, useMemo } from 'react';
import { Shield, Zap, Swords, Brain, Heart, ChevronDown, Battery, BatteryWarning, Globe, Target } from 'lucide-react';

import capacitesData from './capacites.json';

// --- 0. DICTIONNAIRE DE TRADUCTION ---
const translations = {
  en: {
    title: "JOHN DOE",
    subtitle: "Simulator - Aura Manipulation & Capacity",
    currentLevel: "Current Level",
    auraReserves: "Aura Reserves",
    auraSubtitle: "High-level abilities drain more aura.",
    lowAuraWarning: '"I don\'t have much aura left..."',
    estimatedTime: "Estimated maintenance time:",
    infinite: "Infinite",
    min: "min",
    h: "h",
    copiedAuras: "Copied Auras (Max 4)",
    emptySlot: "-- Empty Slot --",
    uncopyable: "Uncopyable",
    insufficientAura: "Insufficient Aura",
    levelAbbr: "Lvl",
    unknown: "Unknown",
    estimatedLevel: "Estimated Effective Level"
  },
  fr: {
    title: "JOHN DOE",
    subtitle: "Simulateur - Aura Manipulation & Capacity",
    currentLevel: "Niveau Actuel",
    auraReserves: "Réserves d'Aura",
    auraSubtitle: "Les capacités haut-niveau drainent plus d'aura.",
    lowAuraWarning: '"Je n\'ai plus beaucoup d\'aura en réserve..."',
    estimatedTime: "Temps de maintien estimé :",
    infinite: "Infini",
    min: "min",
    h: "h",
    copiedAuras: "Auras Copiées (Max 4)",
    emptySlot: "-- Emplacement Vide --",
    uncopyable: "Non copiable",
    insufficientAura: "Aura Insuffisante",
    levelAbbr: "Niv",
    unknown: "Inconnu",
    estimatedLevel: "Niveau Effectif Estimé"
  }
};

// --- 1. CONFIGURATION DES STATS DE BASE DE JOHN ---
const REFERENCE_LEVEL = 7.6;
const JOHN_BASE_STATS = { power: 4, speed: 1, trick: 16, recovery: 1, defense: 1 };

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

// --- LOGIQUE : CALCUL DU DRAIN D'AURA ---
const getAuraCost = (niveau) => {
  return parseFloat((niveau * (niveau / 1.5)).toFixed(1));
};

// --- 2. COMPOSANT GRAPHIQUE RADAR SVG SUR-MESURE ---
const RadarChart = ({ stats }) => {
  const maxStat = 10; // Max visualisé par défaut
  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;
  const keys = ['power', 'speed', 'trick', 'recovery', 'defense'];
  const labels = ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'];

  const getPoints = (statObj, clamp = false) => {
    return keys.map((key, i) => {
      // Pour éviter de dépasser visuellement du SVG, on cap à 16. 
      // Si clamp est activé (pour le fond radar), on bloque au maxStat
      let val = statObj[key] || 1;
      if (clamp) val = Math.min(val, maxStat);
      
      const r = (val / maxStat) * radius;
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const levels = [2, 4, 6, 8, 10];

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 rounded-full p-4 shadow-2xl border border-neutral-800">
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
            <text key={`lbl-${key}`} x={cx + rText * Math.cos(angle)} y={cy + rText * Math.sin(angle)} fill="#ffd700" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" className="tracking-wider uppercase opacity-90 transition-all duration-500 ease-in-out">
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
  const [lang, setLang] = useState('en');
  const txt = translations[lang];

  const [johnLevel, setJohnLevel] = useState(7.6);
  const [slots, setSlots] = useState(["", "", "", ""]);

  // --- LOGIQUE DE RÉSERVE D'AURA ---
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

  // --- LOGIQUE : ESTIMATION DU TEMPS DE MAINTIEN ---
  const estimatedTimeMinutes = useMemo(() => {
    if (currentAuraDrain === 0) return Infinity;
    const refDrain = getAuraCost(johnLevel); 
    return Math.round(120 * (refDrain / currentAuraDrain));
  }, [currentAuraDrain, johnLevel]);

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
      
      let statsCalculees = {};
      
      if (johnLevel >= cap.niveau) {
        for (let key in cap.stats_de_base) statsCalculees[key] = cap.stats_de_base[key];
      } else {
        for (let key in cap.ratios_stats) statsCalculees[key] = cap.ratios_stats[key] * johnLevel;
      }

      let maxStatKey = cap.stat_principale;

      for (let key in statsCalculees) {
        let valeur = statsCalculees[key];
        if (key === maxStatKey) valeur *= 1.5;
        stats[key] = Math.max(stats[key], valeur);
      }
    });

    return stats;
  }, [johnLevel, slots]);

  // --- ALGORITHME DU NIVEAU EFFECTIF ESTIMÉ ---
  const estimatedEffectiveLevel = useMemo(() => {
    // 1. Somme de toutes les stats SAUF le Trick
    const sumStatsWithoutTrick = statsFinales.power + statsFinales.speed + statsFinales.recovery + statsFinales.defense;
    
    // 2. Première moyenne (divisée par 4) pour pouvoir déduire le Tier actuel
    const firstAvg = sumStatsWithoutTrick / 10;

    // Pourcentages fixes
    const CRIPPLE_PERCENTAGE = 1.0;
    const LOW_PERCENTAGE = 0.7222;
    const MID_PERCENTAGE = 0.6631;
    const ELITE_PERCENTAGE = 0.6117;
    const HIGH_PERCENTAGE = 0.5323;
    const GOD_PERCENTAGE = 0.4527;

    let tierPercentage;
    let tierDividend;

    // 3. Déduction du Tier basée sur la première moyenne (les seuils correspondent aux moyennes pour atteindre chaque tier)
    if (firstAvg >= 5.34) {
      // God Tier
      tierPercentage = GOD_PERCENTAGE;
      tierDividend = 3.07;
    } else if (firstAvg >= 4.51) {
      // High Tier
      tierPercentage = HIGH_PERCENTAGE;
      tierDividend = 3.45;
    } else if (firstAvg >= 2.84) {
      // Elite Tier
      tierPercentage = ELITE_PERCENTAGE;
      tierDividend = 3.09;
    } else if (firstAvg >= 1.40) {
      // Mid Tier
      tierPercentage = MID_PERCENTAGE;
      tierDividend = 2.73;
    } else if (firstAvg >= 0.90) {
      // Low Tier
      tierPercentage = LOW_PERCENTAGE;
      tierDividend = 2.46;
    } else {
      // Cripple
      tierPercentage = CRIPPLE_PERCENTAGE;
      tierDividend = 4.0;
    }

    // 4. Calcul de la vraie moyenne finale en utilisant le dividende spécifique au Tier
    const finalStatAverage = sumStatsWithoutTrick / tierDividend;

    // 5. Calcul final : Moyenne Finale / Pourcentage de Prestige
    const calculatedLevel = finalStatAverage * tierPercentage;

    return Math.min(10, calculatedLevel).toFixed(1);
  }, [statsFinales]);


  const formatTime = (mins) => {
    if (mins === Infinity) return txt.infinite;
    if (mins < 60) return `${mins} ${txt.min}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}${txt.h} ${m}${txt.min}` : `${h}${txt.h}`;
  };

  const updateSlot = (index, value) => {
    if (!value) {
      const newSlots = [...slots];
      newSlots[index] = "";
      setSlots(newSlots);
      return;
    }

    const cap = capacitesData.find(c => c.id === parseInt(value));
    if (!cap) return; 

    const currentSlotVal = slots[index];
    const currentCap = currentSlotVal ? capacitesData.find(c => c.id === parseInt(currentSlotVal)) : null;

    const currentDrainInThisSlot = currentCap ? getAuraCost(currentCap.niveau) : 0;
    const newDrain = getAuraCost(cap.niveau);
    
    const projectedAuraDrain = currentAuraDrain - currentDrainInThisSlot + newDrain;

    if (projectedAuraDrain > maxAura) return; 

    const newSlots = [...slots];
    newSlots[index] = value;
    setSlots(newSlots);
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 font-sans p-4 md:p-8 selection:bg-yellow-500/30">
      
      {/* Sélecteur de Langue */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg z-10">
        <Globe size={16} className="text-neutral-400 ml-1" />
        <div className="flex bg-neutral-950 rounded p-0.5 border border-neutral-800">
          <button 
            onClick={() => setLang('en')} 
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${lang === 'en' ? 'bg-yellow-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang('fr')} 
            className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${lang === 'fr' ? 'bg-yellow-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            FR
          </button>
        </div>
      </div>

      {/* En-tête */}
      <div className="max-w-6xl mx-auto mb-10 text-center pt-8 md:pt-0">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 tracking-tight mb-2">
          {txt.title}
        </h1>
        <p className="text-neutral-400 font-medium uppercase tracking-widest text-sm md:text-base">
          {txt.subtitle}
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* PANNEAU GAUCHE : CONTRÔLES */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Niveau de John */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl flex items-center justify-between border-l-4 border-l-yellow-500">
            <label className="text-lg font-bold text-neutral-200">
              {txt.currentLevel}
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

          {/* RESERVES D'AURA */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-end mb-3">
              <div>
                <h2 className="text-neutral-200 font-bold text-lg flex items-center gap-2">
                  <Battery size={20} className={auraPercentage > 90 ? "text-red-500" : "text-yellow-500"} /> 
                  {txt.auraReserves}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">{txt.auraSubtitle}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-yellow-500">{auraRemaining}</span>
                <span className="text-neutral-500 text-sm ml-1">/ {maxAura}</span>
              </div>
            </div>
            
            <div className="h-4 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 relative">
              <div 
                className={`h-full transition-all duration-500 ease-out ${auraPercentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`}
                style={{ width: `${auraPercentage}%` }}
              ></div>
            </div>
            
            {auraRemaining <= 5 && (
              <p className="text-red-400 text-xs font-bold mt-3 flex items-center gap-1">
                <BatteryWarning size={14} /> {txt.lowAuraWarning}
              </p>
            )}

            <div className="flex justify-between items-center mt-4 border-t border-neutral-800 pt-3">
              <span className="text-sm font-semibold text-neutral-400">{txt.estimatedTime}</span>
              <span className={`text-sm font-black tracking-wider ${currentAuraDrain === 0 ? 'text-neutral-500' : auraPercentage > 80 ? 'text-red-400' : 'text-yellow-500'}`}>
                {formatTime(estimatedTimeMinutes)}
              </span>
            </div>
          </div>

          {/* Emplacements de copie */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-neutral-400 font-semibold mb-4 text-sm uppercase tracking-wider">{txt.copiedAuras}</h2>
            
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
                    <option value="">{txt.emptySlot}</option>
                    {capacitesData.map(cap => {
                      const cost = getAuraCost(cap.niveau);
                      const isTooExpensive = (currentAuraDrain - currentSlotDrain + cost) > maxAura;
                      const isUncopyable = cap.copiable === false;
                      
                      let disabledReason = "";
                      if (isUncopyable) {
                        disabledReason = ` [${cap.type || txt.unknown} - ${txt.uncopyable}]`;
                      } else if (isTooExpensive && cap.id !== parseInt(slot)) {
                        disabledReason = ` [${txt.insufficientAura}]`;
                      }

                      const isDisabled = isUncopyable || (isTooExpensive && cap.id !== parseInt(slot));

                      return (
                        <option key={cap.id} value={cap.id} disabled={isDisabled}>
                          {cap.nom_capacite} ({cap.nom_personnage}) - {txt.levelAbbr} {cap.niveau} {disabledReason}
                        </option>
                      )
                    })}
                  </select>
                  
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
        <div className="lg:col-span-7 flex flex-col items-center justify-start bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl h-full">
          
          <div className="w-full mb-8">
            <RadarChart stats={statsFinales} />
          </div>

          {/* Affichage du Niveau Effectif Estimé (Rendu plus discret) */}
          <div className="w-full flex justify-end mb-3 pr-1">
            <div className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
              <Target size={14} className="text-neutral-500" />
              <span className="text-neutral-400">{txt.estimatedLevel} :</span>
              <span className="font-bold text-yellow-500">{estimatedEffectiveLevel}</span>
            </div>
          </div>

          {/* Grille de stats */}
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