import { useState, useEffect, useRef } from 'react';

// =============================================================================
// CUYÍN APRENDE · Con audio
// Usa Web Speech API (voz) + Web Audio API (efectos). Sin archivos externos.
// =============================================================================

// -----------------------------------------------------------------------------
// AUDIO — módulo global
// -----------------------------------------------------------------------------
const audio = {
  ctx: null,
  muted: false,
  unlocked: false,
  voice: null,

  unlock() {
    if (this.unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
        // Pick best Spanish voice (Argentine > Mexican > any es)
        const pickVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          this.voice =
            voices.find((v) => v.lang.startsWith('es-AR')) ||
            voices.find((v) => v.lang.startsWith('es-MX')) ||
            voices.find((v) => v.lang.startsWith('es-US')) ||
            voices.find((v) => v.lang.startsWith('es-'));
        };
        pickVoice();
        window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
      }
    } catch (e) {}
    this.unlocked = true;
  },

  speak(text, opts = {}) {
    if (this.muted || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.lang = 'es-AR';
    u.rate = opts.rate || 0.95;
    u.pitch = opts.pitch || 1.15;
    window.speechSynthesis.speak(u);
  },

  tone(freq, duration, delay = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  },

  correct() {
    this.tone(523.25, 0.15);
    this.tone(659.25, 0.15, 0.1);
    this.tone(783.99, 0.2, 0.2);
  },
  wrong() { this.tone(200, 0.25); },
  coin() { this.tone(1046.5, 0.08); this.tone(1318.5, 0.1, 0.05); },
  tap() { this.tone(700, 0.04); },
  levelUp() {
    this.tone(523.25, 0.12);
    this.tone(659.25, 0.12, 0.1);
    this.tone(783.99, 0.12, 0.2);
    this.tone(1046.5, 0.25, 0.3);
  },
};

// Sonido pedagógico de cada letra (para pronunciación)
const letterSound = (letter) => {
  const sounds = {
    A: 'aaaaa', E: 'eeeee', I: 'iiiii', O: 'ooooo', U: 'uuuuu',
    M: 'mmmmm', N: 'nnnnn', S: 'ssssss', F: 'fffffff', L: 'lllll', R: 'rrrrr',
    P: 'pa, pe, pi, po, pu', T: 'ta, te, ti, to, tu', D: 'da, de, di, do, du',
  };
  return sounds[letter] || letter;
};

// Extraer texto de children de React para leerlo
function extractText(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (node.props && node.props.children) return extractText(node.props.children);
  return '';
}

// -----------------------------------------------------------------------------
// CONTENIDO DEL JUEGO
// -----------------------------------------------------------------------------
const GAME = {
  zones: [
    {
      id: 'lujan', name: 'Luján de Cuyo', subtitle: 'Las vocales', x: 50, y: 25, unlocked: true,
      lessons: [
        { id: 'l1', name: 'La vocal A', activities: [
          { type: 'letterIntro', letter: 'A', hint: 'como en "abuelo"' },
          { type: 'findLetter', target: 'A', grid: ['A','O','A','E','A','I','U','O','A'] },
          { type: 'countObjects', object: 'grape', answer: 3 },
        ]},
        { id: 'l2', name: 'La E y la I', activities: [
          { type: 'letterIntro', letter: 'E', hint: 'como en "escuela"' },
          { type: 'letterIntro', letter: 'I', hint: 'como en "iglesia"' },
          { type: 'findLetter', target: 'E', grid: ['A','E','I','E','O','U','E','A','I'] },
          { type: 'countObjects', object: 'sun', answer: 4 },
        ]},
        { id: 'l3', name: 'La O y la U', activities: [
          { type: 'letterIntro', letter: 'O', hint: 'como en "oso"' },
          { type: 'letterIntro', letter: 'U', hint: 'como en "uva"' },
          { type: 'countObjects', object: 'grape', answer: 5 },
        ]},
      ],
    },
    {
      id: 'uco', name: 'Valle de Uco', subtitle: 'Letras M y P', x: 25, y: 45, unlocked: false,
      lessons: [
        { id: 'l4', name: 'La letra M', activities: [
          { type: 'letterIntro', letter: 'M', hint: 'con los labios cerrados' },
          { type: 'findLetter', target: 'M', grid: ['A','M','O','M','P','M','E','M','U'] },
          { type: 'wordMatch', word: 'MAMÁ', image: 'heart', options: ['MAMÁ','PAPÁ','LOLA'] },
        ]},
        { id: 'l5', name: 'La letra P', activities: [
          { type: 'letterIntro', letter: 'P', hint: 'como una explosioncita' },
          { type: 'wordMatch', word: 'PAPÁ', image: 'gaucho', options: ['MAMÁ','PAPÁ','PIPA'] },
          { type: 'simpleAdd', a: 2, b: 3, object: 'grape' },
        ]},
        { id: 'l6', name: 'Sumar más grande', activities: [
          { type: 'countObjects', object: 'sun', answer: 7 },
          { type: 'simpleAdd', a: 4, b: 3, object: 'grape' },
          { type: 'simpleAdd', a: 5, b: 5, object: 'grape' },
        ]},
      ],
    },
    {
      id: 'maipu', name: 'Maipú', subtitle: 'Letra F y sumas', x: 70, y: 55, unlocked: false,
      lessons: [
        { id: 'l7', name: 'La letra F', activities: [
          { type: 'letterIntro', letter: 'F', hint: 'como el viento zonda' },
          { type: 'findLetter', target: 'F', grid: ['A','F','M','F','E','P','T','F','O','N','F','I'] },
          { type: 'simpleAdd', a: 3, b: 4, object: 'grape' },
        ]},
        { id: 'l8', name: 'Palabras con F', activities: [
          { type: 'wordMatch', word: 'FOCA', image: 'foca', options: ['FOCA','MESA','SOL'] },
          { type: 'wordMatch', word: 'FLOR', image: 'flor', options: ['LUNA','FLOR','PATO'] },
          { type: 'simpleAdd', a: 6, b: 3, object: 'grape' },
        ]},
        { id: 'l9', name: 'Restar', activities: [
          { type: 'simpleSub', a: 7, b: 3, object: 'grape' },
          { type: 'simpleSub', a: 8, b: 5, object: 'grape' },
          { type: 'simpleAdd', a: 4, b: 6, object: 'grape' },
        ]},
      ],
    },
    { id: 'sanrafael', name: 'San Rafael', subtitle: 'Próximamente', x: 40, y: 75, unlocked: false, lessons: [] },
    { id: 'uspallata', name: 'Uspallata', subtitle: 'Próximamente', x: 20, y: 20, unlocked: false, lessons: [] },
    { id: 'aconcagua', name: 'Aconcagua', subtitle: '¡La cima!', x: 50, y: 8, unlocked: false, lessons: [], goal: true },
  ],
};

const SHOP_ITEMS = {
  hat: [
    { id: 'gauchoHat', name: 'Sombrero gaucho', price: 15, slot: 'hat' },
    { id: 'andeanCap', name: 'Gorro andino', price: 25, slot: 'hat' },
    { id: 'redBeret', name: 'Boina roja', price: 20, slot: 'hat' },
  ],
  poncho: [
    { id: 'redPoncho', name: 'Poncho rojo', price: 20, slot: 'poncho' },
    { id: 'pampaPoncho', name: 'Poncho pampa', price: 35, slot: 'poncho' },
  ],
  pet: [
    { id: 'condor', name: 'Cóndor', price: 40, slot: 'pet' },
    { id: 'fox', name: 'Zorro colorado', price: 35, slot: 'pet' },
  ],
};

// =============================================================================
// APP
// =============================================================================
export default function App() {
  const [screen, setScreen] = useState('map');
  const [currentZone, setCurrentZone] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [activityIdx, setActivityIdx] = useState(0);
  const [lessonUvitas, setLessonUvitas] = useState(0);
  const [uvitas, setUvitas] = useState(5);
  const [completedLessons, setCompletedLessons] = useState({});
  const [unlockedZones, setUnlockedZones] = useState({ lujan: true });
  const [equipped, setEquipped] = useState({ hat: null, poncho: null, pet: null });
  const [owned, setOwned] = useState([]);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => { audio.muted = muted; }, [muted]);

  // Unlock audio on first user interaction (needed for iOS)
  useEffect(() => {
    const handler = () => audio.unlock();
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const openZone = (zone) => {
    if (!unlockedZones[zone.id]) { audio.wrong(); return; }
    audio.tap();
    setCurrentZone(zone);
    setScreen('zone');
  };

  const openLesson = (lesson) => {
    audio.tap();
    setCurrentLesson(lesson);
    setActivityIdx(0);
    setLessonUvitas(0);
    setScreen('lesson');
  };

  const completeActivity = (earned) => {
    setLessonUvitas((u) => u + earned);
    if (activityIdx + 1 < currentLesson.activities.length) {
      setActivityIdx(activityIdx + 1);
    } else {
      finishLesson();
    }
  };

  const finishLesson = () => {
    const bonus = 3;
    const total = lessonUvitas + bonus;
    setUvitas((u) => u + total);
    setCompletedLessons({ ...completedLessons, [currentLesson.id]: true });
    const zoneCompleted = currentZone.lessons.every(
      (l) => l.id === currentLesson.id || completedLessons[l.id]
    );
    if (zoneCompleted) {
      const idx = GAME.zones.findIndex((z) => z.id === currentZone.id);
      const nextZone = GAME.zones[idx + 1];
      if (nextZone) {
        setUnlockedZones({ ...unlockedZones, [nextZone.id]: true });
        setTimeout(() => audio.levelUp(), 800);
      }
    }
    setLessonUvitas(total);
    setScreen('victory');
  };

  const buyItem = (item) => {
    if (uvitas < item.price || owned.includes(item.id)) { audio.wrong(); return; }
    audio.coin();
    setUvitas(uvitas - item.price);
    setOwned([...owned, item.id]);
    setEquipped({ ...equipped, [item.slot]: item.id });
  };

  const equipItem = (item) => {
    if (!owned.includes(item.id)) return;
    audio.tap();
    setEquipped({ ...equipped, [item.slot]: equipped[item.slot] === item.id ? null : item.id });
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      fontFamily: 'Fredoka, system-ui, sans-serif',
      background: 'linear-gradient(180deg, #FDE8C9 0%, #FBD9A0 50%, #E8B87C 100%)',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
      padding: '12px', boxSizing: 'border-box',
    }}>
      <GlobalStyles />
      <div style={{
        maxWidth: 448, margin: '0 auto', background: '#FFF8ED',
        borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
      }}>
        <HUD
          uvitas={uvitas}
          muted={muted}
          onToggleMute={() => { setMuted(!muted); if (!muted) audio.tap(); }}
          onShop={() => { audio.tap(); setScreen('shop'); }}
          onHome={() => { audio.tap(); setScreen('map'); }}
          screen={screen}
        />
        <div style={{ padding: 16, minHeight: 500 }}>
          {screen === 'map' && (
            <MapScreen
              unlockedZones={unlockedZones}
              completedLessons={completedLessons}
              equipped={equipped}
              onSelectZone={openZone}
            />
          )}
          {screen === 'zone' && currentZone && (
            <ZoneScreen
              zone={currentZone}
              completedLessons={completedLessons}
              onSelectLesson={openLesson}
              onBack={() => { audio.tap(); setScreen('map'); }}
            />
          )}
          {screen === 'lesson' && currentLesson && (
            <LessonScreen
              lesson={currentLesson}
              activityIdx={activityIdx}
              onComplete={completeActivity}
              onExit={() => { audio.tap(); setScreen('zone'); }}
            />
          )}
          {screen === 'victory' && currentLesson && (
            <VictoryScreen
              lesson={currentLesson}
              uvitasEarned={lessonUvitas}
              onContinue={() => { audio.tap(); setScreen('zone'); }}
              equipped={equipped}
            />
          )}
          {screen === 'shop' && (
            <ShopScreen
              uvitas={uvitas}
              equipped={equipped}
              owned={owned}
              onBuy={buyItem}
              onEquip={equipItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// GLOBAL STYLES
// =============================================================================
function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      button {
        -webkit-appearance: none;
        appearance: none;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        cursor: pointer;
      }
      button:disabled { cursor: not-allowed; }
      @keyframes bob { 0%,100% { transform: translate(-50%,-85%); } 50% { transform: translate(-50%,-95%); } }
      @keyframes zonePulse {
        0%,100% { box-shadow: 0 3px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,145,71,0.6); }
        50% { box-shadow: 0 3px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(255,145,71,0); }
      }
      @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      @keyframes fall { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(600px) rotate(360deg); opacity: 0; } }
      @keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
      .btn-primary { background: linear-gradient(135deg,#FF9147 0%,#E85D2F 100%); color:white; box-shadow: 0 4px 0 #B84A00; border:none; padding: 14px 20px; border-radius: 16px; font-size: 18px; font-weight: 700; width: 100%; }
      .btn-primary:disabled { background:#DDD; box-shadow:none; opacity:0.5; }
      .btn-secondary { background: #FFE4B5; color:#7B3F00; border:2px solid #FFB84D; padding: 10px 16px; border-radius: 12px; font-weight: 700; }
    `}</style>
  );
}

// =============================================================================
// HUD (con botón mute)
// =============================================================================
function HUD({ uvitas, muted, onToggleMute, onShop, onHome, screen }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#FFF8ED', borderBottom: '2px solid #FFE4B5', gap: 8 }}>
      <button onClick={onHome} style={{ background: screen === 'map' ? '#FF9147' : '#FFE4B5', color: screen === 'map' ? 'white' : '#7B3F00', border: 'none', padding: '8px 12px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
        🗺️
      </button>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: '#FFE4B5', borderRadius: 999, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Grape small />
          <span style={{ fontWeight: 700, color: '#7B3F00', fontSize: 16 }}>{uvitas}</span>
        </div>
      </div>
      <button onClick={onToggleMute} style={{ background: '#FFE4B5', color: '#7B3F00', border: 'none', padding: '8px 12px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
        {muted ? '🔇' : '🔊'}
      </button>
      <button onClick={onShop} style={{ background: screen === 'shop' ? '#FF9147' : '#FFE4B5', color: screen === 'shop' ? 'white' : '#7B3F00', border: 'none', padding: '8px 12px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
        🛍️
      </button>
    </div>
  );
}

// =============================================================================
// MAP SCREEN
// =============================================================================
function MapScreen({ unlockedZones, completedLessons, equipped, onSelectZone }) {
  const totalCompleted = Object.keys(completedLessons).length;
  const totalLessons = GAME.zones.reduce((s, z) => s + z.lessons.length, 0);

  return (
    <div>
      <SpeechBubbleAuto delay={300}>¡Bienvenido! Elegí una zona para jugar.</SpeechBubbleAuto>
      <div style={{ textAlign: 'center', margin: '12px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#B84A00' }}>Aventura por Mendoza</div>
        <div style={{ fontSize: 12, color: '#7B3F00' }}>
          {totalCompleted} de {totalLessons} lecciones
        </div>
      </div>

      <div style={{ position: 'relative', height: 340, borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(180deg,#B8D4E8 0%,#E8DAB8 60%,#C89568 100%)' }}>
        <MendozaMap />
        {GAME.zones.map((z) => {
          const done = z.lessons.length > 0 && z.lessons.every((l) => completedLessons[l.id]);
          const unlocked = unlockedZones[z.id];
          const status = z.goal ? 'goal' : done ? 'done' : unlocked ? 'current' : 'locked';
          return <ZoneMarker key={z.id} zone={z} status={status} onSelect={() => onSelectZone(z)} />;
        })}
        {(() => {
          const current = GAME.zones.find((z) => unlockedZones[z.id] && !(z.lessons.length > 0 && z.lessons.every((l) => completedLessons[l.id])));
          if (!current) return null;
          return (
            <div style={{ position: 'absolute', left: `${current.x}%`, top: `${current.y}%`, transform: 'translate(-50%, -85%)', animation: 'bob 2s ease-in-out infinite', pointerEvents: 'none' }}>
              <CuyinDressed equipped={equipped} size={50} />
            </div>
          );
        })()}
      </div>

      <div style={{ marginTop: 12, padding: 10, background: '#FFE4B5', borderRadius: 16, border: '2px solid #FFB84D', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#7B3F00', lineHeight: 1.3 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        Tocá una zona <b>naranja</b> para jugar. Las <b>verdes</b> ya las hiciste.
      </div>
    </div>
  );
}

function ZoneMarker({ zone, status, onSelect }) {
  const cfg = {
    done: { bg: '#4CAF50', icon: '⭐' },
    current: { bg: '#FF9147', icon: '', pulse: true },
    locked: { bg: '#999', icon: '🔒' },
    goal: { bg: '#B84A00', icon: '🏔️' },
  }[status];

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={status === 'locked' || status === 'goal'}
      style={{
        position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)',
        width: 44, height: 44, borderRadius: '50%', background: cfg.bg, border: '3px solid white',
        color: 'white', fontWeight: 700, fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
        animation: cfg.pulse ? 'zonePulse 1.5s ease-in-out infinite' : 'none',
        opacity: status === 'locked' ? 0.7 : 1,
      }}
    >
      {cfg.icon}
    </button>
  );
}

function MendozaMap() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M 0 100 L 0 10 L 8 5 L 15 15 L 22 8 L 30 18 L 25 30 L 30 45 L 20 60 L 15 80 L 5 95 Z" fill="#8B7BA8" opacity="0.7" />
      <path d="M 8 5 L 15 15 L 12 10 Z" fill="white" />
      <path d="M 22 8 L 30 18 L 26 12 Z" fill="white" />
      {[...Array(30)].map((_, i) => {
        const x = 40 + (i % 6) * 10;
        const y = 30 + Math.floor(i / 6) * 12;
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#7DA240" opacity="0.4" />;
      })}
      <path d="M 30 20 Q 45 40 55 60 Q 65 75 75 90" stroke="#5D9EC7" strokeWidth="1.2" fill="none" opacity="0.5" />
    </svg>
  );
}

// =============================================================================
// ZONE SCREEN
// =============================================================================
function ZoneScreen({ zone, completedLessons, onSelectLesson, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: 10 }}>← Volver al mapa</button>
      <SpeechBubbleAuto delay={200}>Zona {zone.name}. {zone.subtitle}. Elegí una lección.</SpeechBubbleAuto>
      <div style={{ textAlign: 'center', margin: '10px 0 14px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#B84A00' }}>{zone.name}</div>
        <div style={{ fontSize: 13, color: '#7B3F00' }}>{zone.subtitle}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {zone.lessons.map((l, i) => {
          const done = completedLessons[l.id];
          const prevDone = i === 0 || completedLessons[zone.lessons[i - 1].id];
          const available = prevDone;
          return (
            <button
              key={l.id}
              onClick={() => available && onSelectLesson(l)}
              disabled={!available}
              style={{
                background: done ? '#4CAF50' : available ? '#FFE4B5' : '#F0F0F0',
                border: available ? '3px solid #FFB84D' : '2px solid #CCC',
                borderRadius: 16, padding: 14,
                display: 'flex', alignItems: 'center', gap: 12,
                color: done ? 'white' : '#7B3F00',
                textAlign: 'left', opacity: available ? 1 : 0.6,
              }}
            >
              <div style={{ fontSize: 24 }}>{done ? '⭐' : available ? '▶️' : '🔒'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Lección {i + 1}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{l.name}</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{l.activities.length} 🎯</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// LESSON SCREEN
// =============================================================================
function LessonScreen({ lesson, activityIdx, onComplete, onExit }) {
  const activity = lesson.activities[activityIdx];
  const progress = ((activityIdx) / lesson.activities.length) * 100;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button onClick={onExit} style={{ background: 'transparent', border: 'none', fontSize: 20, color: '#7B3F00' }}>✕</button>
        <div style={{ flex: 1, height: 10, background: '#FFE4B5', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#FF9147', transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7B3F00' }}>
          {activityIdx + 1}/{lesson.activities.length}
        </div>
      </div>

      {activity.type === 'letterIntro' && <LetterIntro key={activityIdx} activity={activity} onDone={() => onComplete(2)} />}
      {activity.type === 'findLetter' && <FindLetter key={activityIdx} activity={activity} onDone={() => onComplete(3)} />}
      {activity.type === 'countObjects' && <CountObjects key={activityIdx} activity={activity} onDone={() => onComplete(3)} />}
      {activity.type === 'simpleAdd' && <SimpleAdd key={activityIdx} activity={activity} onDone={() => onComplete(4)} />}
      {activity.type === 'simpleSub' && <SimpleSub key={activityIdx} activity={activity} onDone={() => onComplete(4)} />}
      {activity.type === 'wordMatch' && <WordMatch key={activityIdx} activity={activity} onDone={() => onComplete(3)} />}
    </div>
  );
}

// =============================================================================
// ACTIVIDADES (con audio integrado)
// =============================================================================
function LetterIntro({ activity, onDone }) {
  const [tapped, setTapped] = useState(false);

  return (
    <div style={{ textAlign: 'center', padding: 10 }}>
      <SpeechBubbleAuto>Esta es la letra <b>{activity.letter}</b>, {activity.hint}. ¡Tocala!</SpeechBubbleAuto>
      <button
        onClick={() => {
          setTapped(true);
          audio.speak(`Letra ${activity.letter}. ${letterSound(activity.letter)}`, { rate: 0.85 });
        }}
        style={{ background: 'transparent', border: 'none', margin: '20px 0' }}
      >
        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: tapped ? 'radial-gradient(circle,#FFE4B5 0%,#FFB84D 100%)' : 'radial-gradient(circle,#FFF8ED 0%,#FFE4B5 100%)',
          boxShadow: tapped ? '0 0 40px #FFB84D' : '0 4px 20px rgba(0,0,0,0.1)',
          transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: tapped ? 'pop 0.4s' : 'none',
        }}>
          <span style={{ fontSize: 120, fontWeight: 700, color: '#B84A00', lineHeight: 1 }}>{activity.letter}</span>
        </div>
      </button>
      <div style={{ margin: '10px 0 20px' }}><CuyinDressed size={80} /></div>
      <button
        className="btn-primary"
        onClick={() => { audio.correct(); onDone(); }}
        disabled={!tapped}
      >
        {tapped ? '¡Muy bien! Seguir →' : '👆 Tocá la letra'}
      </button>
    </div>
  );
}

function FindLetter({ activity, onDone }) {
  const { target, grid } = activity;
  const targetCount = grid.filter((l) => l === target).length;
  const [found, setFound] = useState([]);
  const [wrong, setWrong] = useState(null);

  const handleTap = (idx) => {
    if (found.includes(idx)) return;
    if (grid[idx] === target) {
      audio.tap();
      const nf = [...found, idx];
      setFound(nf);
      if (nf.length === targetCount) {
        setTimeout(() => { audio.correct(); audio.speak('¡Muy bien!'); onDone(); }, 500);
      }
    } else {
      audio.wrong();
      setWrong(idx);
      setTimeout(() => setWrong(null), 400);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <SpeechBubbleAuto>Encontrá las <b>{targetCount} letras {target}</b></SpeechBubbleAuto>
      <div style={{ margin: '12px 0', fontSize: 20, fontWeight: 700, color: '#B84A00' }}>
        {found.length} / {targetCount}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {grid.map((letter, i) => {
          const isFound = found.includes(i);
          const isWrong = wrong === i;
          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              style={{
                aspectRatio: '1', borderRadius: 16,
                background: isFound ? 'linear-gradient(135deg,#FFD700,#FFA500)' : isWrong ? '#FFCCCC' : '#FFE4B5',
                color: isFound ? 'white' : '#7B3F00',
                border: isFound ? '3px solid #B84A00' : '2px solid transparent',
                fontSize: 26, fontWeight: 700,
                animation: isWrong ? 'shake 0.4s' : 'none',
                boxShadow: isFound ? '0 0 15px #FFD700' : 'none',
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CountObjects({ activity, onDone }) {
  const { object, answer } = activity;
  const [tappedCount, setTappedCount] = useState(0);
  const [answered, setAnswered] = useState(null);
  const options = [answer - 1, answer, answer + 1, answer + 2].filter((n) => n > 0).slice(0, 4);
  const shuffled = useRef([...options].sort(() => 0.5 - Math.random())).current;

  return (
    <div style={{ textAlign: 'center' }}>
      <SpeechBubbleAuto>¿Cuántos hay? Tocá cada uno para contar.</SpeechBubbleAuto>
      <div style={{ margin: '20px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, minHeight: 100 }}>
        {[...Array(answer)].map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const next = Math.max(tappedCount, i + 1);
              if (next > tappedCount) { audio.tap(); audio.speak(String(next), { rate: 1.1 }); }
              setTappedCount(next);
            }}
            style={{
              background: 'transparent', border: 'none',
              transform: i < tappedCount ? 'scale(1.1)' : 'scale(1)',
              filter: i < tappedCount ? 'drop-shadow(0 0 8px #FFD700)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <ObjectIcon type={object} size={50} />
          </button>
        ))}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#7B3F00', marginBottom: 10 }}>
        Contaste: {tappedCount}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {shuffled.map((n) => {
          const isRight = answered === n && n === answer;
          const isWrong = answered === n && n !== answer;
          return (
            <button
              key={n}
              onClick={() => {
                if (tappedCount < answer) return;
                setAnswered(n);
                if (n === answer) { audio.correct(); audio.speak('¡Muy bien!'); setTimeout(onDone, 900); }
                else { audio.wrong(); setTimeout(() => setAnswered(null), 700); }
              }}
              disabled={tappedCount < answer}
              style={{
                padding: '14px 0', borderRadius: 14, fontSize: 22, fontWeight: 700,
                background: isRight ? 'linear-gradient(135deg,#7FD858,#4CAF50)' : isWrong ? '#FFCCCC' : '#FFE4B5',
                color: isRight ? 'white' : '#7B3F00', border: 'none',
                opacity: tappedCount < answer ? 0.5 : 1,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SimpleAdd({ activity, onDone }) {
  const { a, b, object } = activity;
  const total = a + b;
  const [answered, setAnswered] = useState(null);
  const options = useRef([total - 1, total, total + 1, total + 2].filter((n) => n > 0).sort(() => 0.5 - Math.random()).slice(0, 4)).current;

  return (
    <div style={{ textAlign: 'center' }}>
      <SpeechBubbleAuto>¿Cuánto es {a} más {b}?</SpeechBubbleAuto>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, margin: '16px 0', flexWrap: 'wrap' }}>
        <Basket count={a} object={object} />
        <div style={{ fontSize: 32, color: '#B84A00', fontWeight: 700 }}>+</div>
        <Basket count={b} object={object} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#7B3F00', margin: '10px 0' }}>
        {a} + {b} = ?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {options.map((n) => {
          const isRight = answered === n && n === total;
          const isWrong = answered === n && n !== total;
          return (
            <button
              key={n}
              onClick={() => {
                setAnswered(n);
                if (n === total) { audio.correct(); audio.speak(`¡Correcto! ${a} más ${b} son ${total}`); setTimeout(onDone, 1500); }
                else { audio.wrong(); setTimeout(() => setAnswered(null), 700); }
              }}
              style={{
                padding: '14px 0', borderRadius: 14, fontSize: 22, fontWeight: 700,
                background: isRight ? 'linear-gradient(135deg,#7FD858,#4CAF50)' : isWrong ? '#FFCCCC' : '#FFE4B5',
                color: isRight ? 'white' : '#7B3F00', border: 'none',
                animation: isWrong ? 'shake 0.4s' : 'none',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SimpleSub({ activity, onDone }) {
  const { a, b, object } = activity;
  const total = a - b;
  const [answered, setAnswered] = useState(null);
  const options = useRef([total - 1, total, total + 1, total + 2].filter((n) => n >= 0).sort(() => 0.5 - Math.random()).slice(0, 4)).current;

  return (
    <div style={{ textAlign: 'center' }}>
      <SpeechBubbleAuto>Cuyín tenía {a} y se fueron {b}. ¿Cuántos quedan?</SpeechBubbleAuto>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, margin: '16px 0', flexWrap: 'wrap' }}>
        {[...Array(a)].map((_, i) => (
          <div key={i} style={{ opacity: i < b ? 0.2 : 1, transform: i < b ? 'scale(0.7) rotate(-20deg)' : 'scale(1)', transition: 'all 0.3s' }}>
            <ObjectIcon type={object} size={32} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#7B3F00', margin: '10px 0' }}>
        {a} - {b} = ?
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {options.map((n) => {
          const isRight = answered === n && n === total;
          const isWrong = answered === n && n !== total;
          return (
            <button
              key={n}
              onClick={() => {
                setAnswered(n);
                if (n === total) { audio.correct(); audio.speak(`¡Bien! Quedan ${total}`); setTimeout(onDone, 1300); }
                else { audio.wrong(); setTimeout(() => setAnswered(null), 700); }
              }}
              style={{
                padding: '14px 0', borderRadius: 14, fontSize: 22, fontWeight: 700,
                background: isRight ? 'linear-gradient(135deg,#7FD858,#4CAF50)' : isWrong ? '#FFCCCC' : '#FFE4B5',
                color: isRight ? 'white' : '#7B3F00', border: 'none',
                animation: isWrong ? 'shake 0.4s' : 'none',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WordMatch({ activity, onDone }) {
  const [answered, setAnswered] = useState(null);
  return (
    <div style={{ textAlign: 'center' }}>
      <SpeechBubbleAuto>¿Cuál es la palabra correcta?</SpeechBubbleAuto>
      <div style={{ margin: '20px auto', width: 140, height: 140, background: '#FFE4B5', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #FFB84D' }}>
        <MatchImage type={activity.image} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activity.options.map((opt) => {
          const isRight = answered === opt && opt === activity.word;
          const isWrong = answered === opt && opt !== activity.word;
          return (
            <button
              key={opt}
              onClick={() => {
                setAnswered(opt);
                audio.speak(opt, { rate: 0.9 });
                if (opt === activity.word) { setTimeout(() => { audio.correct(); audio.speak(`¡Muy bien! Es ${activity.word}`); }, 400); setTimeout(onDone, 1600); }
                else { setTimeout(() => { audio.wrong(); setAnswered(null); }, 600); }
              }}
              style={{
                padding: '16px', borderRadius: 14, fontSize: 22, fontWeight: 700, letterSpacing: 2,
                background: isRight ? 'linear-gradient(135deg,#7FD858,#4CAF50)' : isWrong ? '#FFCCCC' : '#FFE4B5',
                color: isRight ? 'white' : '#7B3F00', border: 'none',
                animation: isWrong ? 'shake 0.4s' : 'none',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// VICTORY SCREEN
// =============================================================================
function VictoryScreen({ lesson, uvitasEarned, onContinue, equipped }) {
  useEffect(() => {
    audio.coin();
    setTimeout(() => audio.coin(), 200);
    setTimeout(() => audio.coin(), 400);
    setTimeout(() => audio.speak(`¡Terminaste! Ganaste ${uvitasEarned} uvitas`), 700);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: 10, position: 'relative' }}>
      <Confetti />
      <div style={{ fontSize: 24, fontWeight: 700, color: '#B84A00', marginTop: 10 }}>¡Terminaste!</div>
      <div style={{ fontSize: 15, color: '#7B3F00', marginTop: 4 }}>{lesson.name}</div>
      <div style={{ margin: '16px 0' }}><CuyinDressed equipped={equipped} size={140} /></div>
      <div style={{ background: '#FFE4B5', border: '3px solid #FFB84D', borderRadius: 20, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: '#7B3F00' }}>Uvitas ganadas</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Grape small />
            <span style={{ fontSize: 24, fontWeight: 700, color: '#B84A00' }}>+{uvitasEarned}</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#7B3F00' }}>Podés gastarlas en la tienda 🛍️</div>
      </div>
      <button className="btn-primary" onClick={onContinue}>Seguir →</button>
    </div>
  );
}

function Confetti() {
  const pieces = [...Array(15)].map((_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 2, color: ['#FFD700', '#B84A00', '#7B3F00', '#FFB84D', '#4CAF50'][i % 5] }));
  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} style={{ position: 'absolute', width: 8, height: 8, background: p.color, top: -10, left: `${p.left}%`, animation: `fall 3s linear ${p.delay}s infinite` }} />
      ))}
    </>
  );
}

// =============================================================================
// SHOP
// =============================================================================
function ShopScreen({ uvitas, equipped, owned, onBuy, onEquip }) {
  const [category, setCategory] = useState('hat');
  const items = SHOP_ITEMS[category];

  return (
    <div>
      <SpeechBubbleAuto delay={200}>¡Mirá qué lindas cosas! Compralas con tus uvitas.</SpeechBubbleAuto>
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#B84A00' }}>Tienda de Cuyín</div>
      </div>

      <div style={{ background: 'linear-gradient(180deg,#FDE8C9 0%,#FBD9A0 100%)', borderRadius: 20, marginBottom: 12, position: 'relative', overflow: 'hidden', height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 25, background: '#C89568' }} />
        <CuyinDressed equipped={equipped} size={160} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['hat', 'poncho', 'pet'].map((c) => (
          <button
            key={c}
            onClick={() => { audio.tap(); setCategory(c); }}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: 12, fontSize: 12, fontWeight: 700,
              background: category === c ? '#7B3F00' : '#FFE4B5',
              color: category === c ? 'white' : '#7B3F00', border: 'none',
            }}
          >
            {c === 'hat' ? 'Sombreros' : c === 'poncho' ? 'Ponchos' : 'Amigos'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => {
          const isOwned = owned.includes(item.id);
          const isEquipped = equipped[item.slot] === item.id;
          const canAfford = uvitas >= item.price;
          return (
            <div key={item.id} style={{
              background: isEquipped ? '#FFD700' : isOwned ? '#FFE4B5' : '#FFF8ED',
              border: isEquipped ? '3px solid #B84A00' : isOwned ? '2px solid #FFB84D' : '2px solid #E0D5C0',
              borderRadius: 16, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ItemPreview item={item} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#7B3F00' }}>{item.name}</div>
                {!isOwned && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Grape small />
                    <span style={{ fontSize: 14, fontWeight: 700, color: canAfford ? '#B84A00' : '#CC0000' }}>{item.price}</span>
                  </div>
                )}
                {isOwned && !isEquipped && <div style={{ fontSize: 11, color: '#4CAF50', marginTop: 4 }}>✓ Ya lo tenés</div>}
                {isEquipped && <div style={{ fontSize: 11, fontWeight: 700, color: '#B84A00', marginTop: 4 }}>⭐ En uso</div>}
              </div>
              {!isOwned ? (
                <button onClick={() => onBuy(item)} disabled={!canAfford} style={{ padding: '10px 14px', borderRadius: 12, fontWeight: 700, fontSize: 13, color: 'white', background: canAfford ? '#FF9147' : '#CCC', border: 'none', boxShadow: canAfford ? '0 3px 0 #B84A00' : 'none', opacity: canAfford ? 1 : 0.5 }}>Comprar</button>
              ) : (
                <button onClick={() => onEquip(item)} style={{ padding: '10px 14px', borderRadius: 12, fontWeight: 700, fontSize: 13, color: 'white', background: isEquipped ? '#B84A00' : '#4CAF50', border: 'none' }}>{isEquipped ? 'Sacar' : 'Poner'}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTES REUTILIZABLES
// =============================================================================

// Speech bubble que se lee sola al aparecer
function SpeechBubbleAuto({ children, delay = 400 }) {
  useEffect(() => {
    const text = extractText(children);
    if (text) {
      const t = setTimeout(() => audio.speak(text), delay);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div style={{ position: 'relative', background: '#FFFFFF', border: '3px solid #FFB84D', borderRadius: 20, padding: '12px 16px', color: '#7B3F00', fontSize: 15, textAlign: 'center', lineHeight: 1.3 }}>
      {children}
      <div style={{ position: 'absolute', width: 14, height: 14, background: '#FFFFFF', border: '3px solid #FFB84D', borderTop: 'none', borderLeft: 'none', bottom: -9, left: '50%', marginLeft: -7, transform: 'rotate(45deg)' }} />
    </div>
  );
}

function Basket({ count, object }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, padding: 6, background: '#C68B5B', borderRadius: '12px 12px 4px 4px', minWidth: 70, minHeight: 60 }}>
        {[...Array(count)].map((_, i) => <ObjectIcon key={i} type={object} size={22} />)}
      </div>
      <div style={{ width: 82, height: 8, background: '#8B5A2B', borderRadius: '0 0 6px 6px' }} />
    </div>
  );
}

function ObjectIcon({ type, size = 30 }) {
  if (type === 'grape') return <Grape size={size} />;
  if (type === 'sun') return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="10" fill="#FFB84D" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={20 + 14 * Math.cos(a * Math.PI / 180)} y1={20 + 14 * Math.sin(a * Math.PI / 180)} x2={20 + 18 * Math.cos(a * Math.PI / 180)} y2={20 + 18 * Math.sin(a * Math.PI / 180)} stroke="#FFB84D" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
  return null;
}

function MatchImage({ type }) {
  if (type === 'heart') return <svg width="80" height="80" viewBox="0 0 100 100"><path d="M 50 85 Q 15 55 15 35 A 20 20 0 0 1 50 25 A 20 20 0 0 1 85 35 Q 85 55 50 85 Z" fill="#E85D8F" /></svg>;
  if (type === 'gaucho') return <svg width="80" height="80" viewBox="0 0 100 100"><ellipse cx="50" cy="45" rx="22" ry="20" fill="#E8BC8A" /><ellipse cx="50" cy="26" rx="30" ry="6" fill="#2D2620" /><ellipse cx="50" cy="20" rx="20" ry="10" fill="#2D2620" /><path d="M 40 55 Q 50 60 60 55" stroke="#8B7355" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M 30 65 L 70 65 L 75 90 L 25 90 Z" fill="#B8332F" /></svg>;
  if (type === 'foca') return <svg width="90" height="70" viewBox="0 0 100 80"><ellipse cx="50" cy="50" rx="35" ry="20" fill="#666" /><ellipse cx="75" cy="35" rx="18" ry="15" fill="#666" /><circle cx="82" cy="32" r="2" fill="#000" /><ellipse cx="87" cy="38" rx="3" ry="2" fill="#333" /><path d="M 15 55 Q 5 60 10 65" stroke="#666" strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M 40 65 L 30 78 L 50 72 Z" fill="#666" /></svg>;
  if (type === 'flor') return <svg width="80" height="80" viewBox="0 0 100 100"><line x1="50" y1="55" x2="50" y2="90" stroke="#4A7A2A" strokeWidth="4" /><ellipse cx="42" cy="75" rx="8" ry="4" fill="#4A7A2A" transform="rotate(-30 42 75)" /><circle cx="50" cy="30" r="12" fill="#FFB84D" /><circle cx="30" cy="45" r="12" fill="#E85D8F" /><circle cx="70" cy="45" r="12" fill="#E85D8F" /><circle cx="38" cy="20" r="12" fill="#E85D8F" /><circle cx="62" cy="20" r="12" fill="#E85D8F" /><circle cx="50" cy="30" r="6" fill="#B84A00" /></svg>;
  return null;
}

// =============================================================================
// PERSONAJES
// =============================================================================
function CuyinDressed({ equipped = {}, size = 160 }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 200 220">
      {equipped.pet === 'condor' && <Condor x={155} y={45} />}
      {equipped.pet === 'fox' && <Fox x={155} y={165} />}
      <path d="M 145 150 Q 158 138 152 158" stroke="#C89568" strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="160" rx="48" ry="36" fill="#D4A574" />
      <rect x="72" y="185" width="14" height="28" fill="#C89568" rx="5" />
      <rect x="114" y="185" width="14" height="28" fill="#C89568" rx="5" />
      <ellipse cx="79" cy="213" rx="9" ry="4" fill="#2D2620" />
      <ellipse cx="121" cy="213" rx="9" ry="4" fill="#2D2620" />
      {equipped.poncho === 'redPoncho' && (<>
        <path d="M 60 130 L 140 130 L 150 180 L 50 180 Z" fill="#B8332F" />
        <line x1="55" y1="155" x2="145" y2="155" stroke="#F4CBA5" strokeWidth="2" />
      </>)}
      {equipped.poncho === 'pampaPoncho' && (<>
        <path d="M 60 130 L 140 130 L 150 180 L 50 180 Z" fill="#8B7355" />
        <line x1="55" y1="145" x2="145" y2="145" stroke="#B8332F" strokeWidth="3" />
        <line x1="53" y1="160" x2="147" y2="160" stroke="#2D2620" strokeWidth="2" />
      </>)}
      <ellipse cx="100" cy="115" rx="20" ry="36" fill="#D4A574" />
      <ellipse cx="100" cy="78" rx="32" ry="30" fill="#D4A574" />
      <ellipse cx="80" cy="50" rx="8" ry="17" fill="#D4A574" transform="rotate(-15 80 50)" />
      <ellipse cx="120" cy="50" rx="8" ry="17" fill="#D4A574" transform="rotate(15 120 50)" />
      <ellipse cx="100" cy="92" rx="18" ry="14" fill="#F4CBA5" />
      <circle cx="88" cy="75" r="6" fill="#2D2620" />
      <circle cx="112" cy="75" r="6" fill="#2D2620" />
      <circle cx="90" cy="73" r="2" fill="white" />
      <circle cx="114" cy="73" r="2" fill="white" />
      <ellipse cx="76" cy="90" rx="7" ry="4" fill="#E89B9B" opacity="0.7" />
      <ellipse cx="124" cy="90" rx="7" ry="4" fill="#E89B9B" opacity="0.7" />
      <ellipse cx="100" cy="90" rx="4" ry="3" fill="#2D2620" />
      <path d="M 92 98 Q 100 103 108 98" stroke="#2D2620" strokeWidth="2" fill="none" strokeLinecap="round" />
      {equipped.hat === 'gauchoHat' && (<>
        <ellipse cx="100" cy="42" rx="50" ry="8" fill="#2D2620" />
        <ellipse cx="100" cy="35" rx="28" ry="15" fill="#2D2620" />
      </>)}
      {equipped.hat === 'redBeret' && (<>
        <ellipse cx="100" cy="42" rx="35" ry="12" fill="#B8332F" />
        <ellipse cx="100" cy="39" rx="30" ry="8" fill="#D64A47" />
        <circle cx="100" cy="34" r="4" fill="#2D2620" />
      </>)}
      {equipped.hat === 'andeanCap' && (<>
        <ellipse cx="100" cy="42" rx="33" ry="12" fill="#B8332F" />
        <path d="M 67 42 Q 62 55 65 68 L 75 65 Q 72 55 75 45 Z" fill="#B8332F" />
        <path d="M 133 42 Q 138 55 135 68 L 125 65 Q 128 55 125 45 Z" fill="#B8332F" />
        <ellipse cx="100" cy="35" rx="28" ry="8" fill="#F4A62A" />
      </>)}
    </svg>
  );
}

function Condor({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="0" rx="18" ry="10" fill="#2D2620" />
      <path d="M -22 -4 Q -14 -18 -4 -4" fill="#2D2620" />
      <path d="M 4 -4 Q 14 -18 22 -4" fill="#2D2620" />
      <circle cx="-6" cy="-3" r="5" fill="#F4CBA5" />
      <circle cx="-7" cy="-3" r="1.5" fill="#2D2620" />
    </g>
  );
}

function Fox({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="6" rx="16" ry="9" fill="#D4693A" />
      <path d="M -10 -4 L -5 -15 L 0 0 Z" fill="#D4693A" />
      <path d="M 10 -4 L 5 -15 L 0 0 Z" fill="#D4693A" />
      <circle cx="-4" cy="0" r="1.5" fill="#2D2620" />
      <circle cx="4" cy="0" r="1.5" fill="#2D2620" />
    </g>
  );
}

function Grape({ small = false, size }) {
  const s = size || (small ? 18 : 30);
  return (
    <svg width={s} height={s} viewBox="0 0 32 32">
      <path d="M 16 4 L 16 8" stroke="#4A5D23" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="19" cy="7" rx="4" ry="2" fill="#5D8233" transform="rotate(30 19 7)" />
      <circle cx="12" cy="14" r="4" fill="#6B2C6B" />
      <circle cx="20" cy="14" r="4" fill="#6B2C6B" />
      <circle cx="16" cy="18" r="4" fill="#7D3D7D" />
      <circle cx="10" cy="20" r="4" fill="#6B2C6B" />
      <circle cx="22" cy="20" r="4" fill="#6B2C6B" />
      <circle cx="16" cy="24" r="4" fill="#7D3D7D" />
    </svg>
  );
}

function ItemPreview({ item }) {
  const s = 40;
  const svgs = {
    gauchoHat: <><ellipse cx="20" cy="26" rx="18" ry="4" fill="#2D2620" /><ellipse cx="20" cy="20" rx="10" ry="8" fill="#2D2620" /></>,
    redBeret: <><ellipse cx="20" cy="24" rx="15" ry="7" fill="#B8332F" /><ellipse cx="20" cy="20" rx="13" ry="5" fill="#D64A47" /><circle cx="20" cy="15" r="2" fill="#2D2620" /></>,
    andeanCap: <><ellipse cx="20" cy="24" rx="15" ry="7" fill="#B8332F" /><ellipse cx="20" cy="18" rx="12" ry="4" fill="#F4A62A" /><path d="M 8 24 L 6 34 L 12 32 Z" fill="#B8332F" /><path d="M 32 24 L 34 34 L 28 32 Z" fill="#B8332F" /></>,
    redPoncho: <><path d="M 10 12 L 30 12 L 34 32 L 6 32 Z" fill="#B8332F" /><line x1="7" y1="22" x2="33" y2="22" stroke="#F4CBA5" strokeWidth="1.5" /></>,
    pampaPoncho: <><path d="M 10 12 L 30 12 L 34 32 L 6 32 Z" fill="#8B7355" /><line x1="7" y1="18" x2="33" y2="18" stroke="#B8332F" strokeWidth="2" /></>,
    condor: <><ellipse cx="20" cy="22" rx="10" ry="6" fill="#2D2620" /><path d="M 6 20 Q 12 12 18 20" fill="#2D2620" /><path d="M 22 20 Q 28 12 34 20" fill="#2D2620" /><circle cx="16" cy="18" r="4" fill="#F4CBA5" /></>,
    fox: <><ellipse cx="20" cy="24" rx="12" ry="8" fill="#D4693A" /><path d="M 10 20 L 14 12 L 16 22 Z" fill="#D4693A" /><path d="M 30 20 L 26 12 L 24 22 Z" fill="#D4693A" /><circle cx="16" cy="22" r="1.5" fill="#2D2620" /><circle cx="24" cy="22" r="1.5" fill="#2D2620" /></>,
  };
  return <svg width={s} height={s} viewBox="0 0 40 40">{svgs[item.id]}</svg>;
}
