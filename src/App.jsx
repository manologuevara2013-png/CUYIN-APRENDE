import { useState, useEffect, useRef } from 'react';

// CUYÍN APRENDE · Alineado a "Hechos por la Palabra" (MDA) y "Expedición Matemática 1" (Santillana)
// Multi-perfil con progreso independiente

const MATH_NAMES = ['Alma','Luca','Amparo','Clara','Pedro','Pilar','Camila','Julia','Javi','Martín'];
const randomName = () => MATH_NAMES[Math.floor(Math.random() * MATH_NAMES.length)];

const audio = {
  ctx: null, muted: false, unlocked: false, voice: null,
  unlock() {
    if (this.unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(''); u.volume = 0;
        window.speechSynthesis.speak(u);
        const pick = () => {
          const vs = window.speechSynthesis.getVoices();
          this.voice = vs.find(v=>v.lang.startsWith('es-AR')) || vs.find(v=>v.lang.startsWith('es-MX')) || vs.find(v=>v.lang.startsWith('es-'));
        };
        pick(); window.speechSynthesis.addEventListener('voiceschanged', pick);
      }
    } catch(e) {}
    this.unlocked = true;
  },
  speak(t, o={}) {
    if (this.muted || !window.speechSynthesis || !t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    if (this.voice) u.voice = this.voice;
    u.lang = 'es-AR'; u.rate = o.rate || 0.75; u.pitch = o.pitch || 1.05;
    window.speechSynthesis.speak(u);
  },
  tone(f, d, dl=0) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + dl;
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type='sine'; o.frequency.value=f; o.connect(g); g.connect(this.ctx.destination);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.01, t+d);
      o.start(t); o.stop(t+d);
    } catch(e){}
  },
  correct() { this.tone(523.25,0.15); this.tone(659.25,0.15,0.1); this.tone(783.99,0.2,0.2); },
  wrong() { this.tone(200,0.25); },
  coin() { this.tone(1046.5,0.08); this.tone(1318.5,0.1,0.05); },
  tap() { this.tone(700,0.04); },
  levelUp() { this.tone(523.25,0.12); this.tone(659.25,0.12,0.1); this.tone(783.99,0.12,0.2); this.tone(1046.5,0.25,0.3); },
};

const letterSound = (l) => ({
  A:'Aaa. La A, como en anillo.',
  E:'Eee. La E, como en escarapela.',
  I:'Iii. La I, como en iguana.',
  O:'Ooo. La O, como en ojota.',
  U:'Uuu. La U, como en ukelele.',
  M:'Mmm, ma. La eme.',
  N:'Nnn, na. La ene.',
  S:'Sss, sa. La ese.',
  F:'Fff, fa. La efe.',
  L:'Lll, la. La ele.',
  R:'Rrr suave, ra. La ere.',
  P:'P, pa. La pe.',
  T:'T, ta. La te.',
  D:'D, da. La de.',
  B:'B, ba. La be.',
  V:'V, va. La uve.',
  Y:'Sh, ya. La ye.',
  RR:'Rrr fuerte, rra. La erre doble.',
})[l] || l;

const REF_WORD = { A:'ANILLO', E:'ESCARAPELA', I:'IGUANA', O:'OJOTA', U:'UKELELE' };

function extractText(n) {
  if (n==null || typeof n==='boolean') return '';
  if (typeof n==='string'||typeof n==='number') return String(n);
  if (Array.isArray(n)) return n.map(extractText).join(' ');
  if (n.props && n.props.children) return extractText(n.props.children);
  return '';
}

const GAME = {
  zones: [
    { id:'lujan', name:'Luján de Cuyo', subtitle:'Marzo · Las vocales', x:50, y:22, unlocked:true, lessons:[
      { id:'m1', name:'La A de ANILLO', activities:[
        { type:'letterIntro', letter:'A', hint:'como en ANILLO' },
        { type:'initialSoundMatch', letter:'A', ref:'anillo', options:[
          {word:'ANANÁ',starts:true},{word:'MESA',starts:false},
          {word:'ARAÑA',starts:true},{word:'PATO',starts:false},
        ]},
        { type:'findLetter', target:'A', grid:['A','O','E','A','I','U','A','E','O'] },
      ]},
      { id:'m2', name:'La E de ESCARAPELA', activities:[
        { type:'letterIntro', letter:'E', hint:'como en ESCARAPELA' },
        { type:'initialSoundMatch', letter:'E', ref:'escarapela', options:[
          {word:'ELEFANTE',starts:true},{word:'IGLÚ',starts:false},
          {word:'ESTRELLA',starts:true},{word:'AGUA',starts:false},
        ]},
        { type:'findLetter', target:'E', grid:['A','E','I','E','O','U','E','A','I'] },
      ]},
      { id:'m3', name:'La I de IGUANA', activities:[
        { type:'letterIntro', letter:'I', hint:'como en IGUANA' },
        { type:'initialSoundMatch', letter:'I', ref:'iguana', options:[
          {word:'IGLESIA',starts:true},{word:'OSO',starts:false},
          {word:'ISLA',starts:true},{word:'MESA',starts:false},
        ]},
      ]},
      { id:'m4', name:'La O de OJOTA', activities:[
        { type:'letterIntro', letter:'O', hint:'como en OJOTA' },
        { type:'initialSoundMatch', letter:'O', ref:'ojota', options:[
          {word:'OSO',starts:true},{word:'PATO',starts:false},
          {word:'OLA',starts:true},{word:'INDIO',starts:false},
        ]},
      ]},
      { id:'m5', name:'La U de UKELELE', activities:[
        { type:'letterIntro', letter:'U', hint:'como en UKELELE' },
        { type:'initialSoundMatch', letter:'U', ref:'ukelele', options:[
          {word:'UVA',starts:true},{word:'MESA',starts:false},
          {word:'UÑA',starts:true},{word:'ELEFANTE',starts:false},
        ]},
      ]},
      { id:'m6', name:'Números 1 al 5', activities:[
        { type:'numberIntro', number:1 },
        { type:'numberIntro', number:2 },
        { type:'numberIntro', number:3 },
        { type:'numberIntro', number:4 },
        { type:'numberIntro', number:5 },
        { type:'countObjects', object:'grape', answer:3 },
        { type:'countObjects', object:'sun', answer:5 },
        { type:'numberDictation', target:4, options:[2,4,5] },
      ]},
      { id:'m7', name:'Números 6 al 10', activities:[
        { type:'numberIntro', number:6 },
        { type:'numberIntro', number:7 },
        { type:'numberIntro', number:8 },
        { type:'numberIntro', number:9 },
        { type:'numberIntro', number:10 },
        { type:'countObjects', object:'grape', answer:7 },
        { type:'countObjects', object:'sun', answer:9 },
        { type:'numberDictation', target:8, options:[6,8,10] },
      ]},
      { id:'m8', name:'Del 11 al 20', activities:[
        { type:'numberIntro', number:11 },
        { type:'numberIntro', number:12 },
        { type:'numberIntro', number:15 },
        { type:'numberIntro', number:17 },
        { type:'numberIntro', number:20 },
        { type:'numberDictation', target:15, options:[12,15,17] },
      ]},
      { id:'m9', name:'Comparar y ordenar', activities:[
        { type:'compareNumbers', a:3, b:7 },
        { type:'compareNumbers', a:8, b:4 },
        { type:'compareNumbers', a:10, b:6 },
        { type:'compareNumbers', a:15, b:9 },
        { type:'compareNumbers', a:20, b:13 },
        { type:'orderNumbers', numbers:[3,7,1,5], direction:'asc' },
        { type:'orderNumbers', numbers:[9,2,6,4], direction:'asc' },
        { type:'orderNumbers', numbers:[10,3,8,5], direction:'desc' },
      ]},
    ]},
    { id:'uco', name:'Valle de Uco', subtitle:'Abril · Letras M P L S + suma', x:25, y:42, unlocked:false, lessons:[
      { id:'a1', name:'La letra M', activities:[
        { type:'letterIntro', letter:'M', hint:'con los labios cerrados' },
        { type:'findLetter', target:'M', grid:['A','M','O','M','P','M','E','M','U'] },
        { type:'wordMatch', word:'MAMÁ', image:'heart', options:['MAMÁ','PAPÁ','LOLA'] },
      ]},
      { id:'a1b', name:'Sílabas con M', activities:[
        { type:'syllableTable', letter:'M', syllables:['MA','ME','MI','MO','MU'] },
      ]},
      { id:'a2', name:'La letra P', activities:[
        { type:'letterIntro', letter:'P', hint:'como una explosioncita' },
        { type:'findLetter', target:'P', grid:['P','A','P','M','O','P','I','P','E'] },
        { type:'wordMatch', word:'PAPÁ', image:'gaucho', options:['PAPÁ','MAMÁ','PIPA'] },
      ]},
      { id:'a2b', name:'Sílabas con P', activities:[
        { type:'syllableTable', letter:'P', syllables:['PA','PE','PI','PO','PU'] },
      ]},
      { id:'a3', name:'Tirar el dado', activities:[
        { type:'diceRoll', target:3 },
        { type:'diceRoll', target:5 },
        { type:'diceRoll', target:6 },
        { type:'simpleAdd', a:1, b:2, object:'tapita', who:'Alma' },
        { type:'simpleAdd', a:2, b:2, object:'tapita', who:'Luca' },
      ]},
      { id:'a4', name:'La letra L', activities:[
        { type:'letterIntro', letter:'L', hint:'la lengua toca el paladar' },
        { type:'findLetter', target:'L', grid:['L','A','L','O','E','L','I','L','U'] },
        { type:'wordMatch', word:'LUNA', image:'luna', options:['LUNA','SOL','MESA'] },
      ]},
      { id:'a4b', name:'Sílabas con L', activities:[
        { type:'syllableTable', letter:'L', syllables:['LA','LE','LI','LO','LU'] },
      ]},
      { id:'a5', name:'La letra S', activities:[
        { type:'letterIntro', letter:'S', hint:'como una serpiente' },
        { type:'findLetter', target:'S', grid:['S','A','O','S','E','S','I','S','U'] },
        { type:'wordMatch', word:'SOL', image:'sun', options:['SOL','LUNA','PATO'] },
      ]},
      { id:'a5b', name:'Sílabas con S', activities:[
        { type:'syllableTable', letter:'S', syllables:['SA','SE','SI','SO','SU'] },
      ]},
      { id:'a6', name:'Cartas que suman 10', activities:[
        { type:'sumsToTen', a:7 },
        { type:'sumsToTen', a:4 },
        { type:'sumsToTen', a:2 },
        { type:'simpleAdd', a:6, b:3, object:'tapita', who:'Amparo' },
        { type:'simpleAdd', a:5, b:5, object:'tapita', who:'Clara' },
      ]},
    ]},
    { id:'maipu', name:'Maipú', subtitle:'Mayo · Letras T D N + resta', x:70, y:48, unlocked:false, lessons:[
      { id:'my1', name:'La letra T', activities:[
        { type:'letterIntro', letter:'T', hint:'la lengua toca los dientes' },
        { type:'findLetter', target:'T', grid:['T','A','T','M','T','O','T','E','U'] },
        { type:'wordMatch', word:'TOMATE', image:'tomate', options:['TOMATE','MAMÁ','SOL'] },
      ]},
      { id:'my1b', name:'Sílabas con T', activities:[
        { type:'syllableTable', letter:'T', syllables:['TA','TE','TI','TO','TU'] },
      ]},
      { id:'my2', name:'La letra D', activities:[
        { type:'letterIntro', letter:'D', hint:'la lengua atrás de los dientes' },
        { type:'findLetter', target:'D', grid:['D','A','O','D','E','D','I','D','U'] },
        { type:'wordMatch', word:'DEDO', image:'dedo', options:['DEDO','LUNA','SOL'] },
      ]},
      { id:'my2b', name:'Sílabas con D', activities:[
        { type:'syllableTable', letter:'D', syllables:['DA','DE','DI','DO','DU'] },
      ]},
      { id:'my3', name:'La letra N', activities:[
        { type:'letterIntro', letter:'N', hint:'sonido nasal' },
        { type:'findLetter', target:'N', grid:['N','A','N','O','E','N','I','N','U'] },
        { type:'wordMatch', word:'NIDO', image:'nido', options:['NIDO','MESA','FOCA'] },
      ]},
      { id:'my3b', name:'Sílabas con N', activities:[
        { type:'syllableTable', letter:'N', syllables:['NA','NE','NI','NO','NU'] },
      ]},
      { id:'my4', name:'Sumar con historia', activities:[
        { type:'simpleAdd', a:3, b:4, object:'tapita', who:'Pedro' },
        { type:'simpleAdd', a:5, b:3, object:'tapita', who:'Pilar' },
        { type:'simpleAdd', a:6, b:4, object:'tapita', who:'Julia' },
      ]},
      { id:'my5', name:'Restar con tapitas', activities:[
        { type:'simpleSub', a:5, b:2, object:'tapita', who:'Camila' },
        { type:'simpleSub', a:6, b:3, object:'tapita', who:'Martín' },
        { type:'simpleSub', a:8, b:3, object:'tapita', who:'Javi' },
      ]},
      { id:'my6', name:'Restar más grande', activities:[
        { type:'simpleSub', a:10, b:4, object:'tapita', who:'Alma' },
        { type:'simpleSub', a:9, b:5, object:'tapita', who:'Luca' },
        { type:'simpleSub', a:10, b:7, object:'sun' },
      ]},
    ]},
    { id:'tunuyan', name:'Tunuyán', subtitle:'Junio · Letras F B R + figuras', x:40, y:65, unlocked:false, lessons:[
      { id:'j1', name:'La letra F', activities:[
        { type:'letterIntro', letter:'F', hint:'como el viento zonda' },
        { type:'findLetter', target:'F', grid:['A','F','M','F','E','P','T','F','O','N','F','I'] },
        { type:'wordMatch', word:'FOCA', image:'foca', options:['FOCA','SOL','LUNA'] },
      ]},
      { id:'j2', name:'La letra B', activities:[
        { type:'letterIntro', letter:'B', hint:'labios que se abren' },
        { type:'findLetter', target:'B', grid:['B','A','O','B','P','B','I','B','E'] },
        { type:'wordMatch', word:'BOCA', image:'boca', options:['BOCA','FOCA','NIDO'] },
      ]},
      { id:'j3', name:'La R suave', activities:[
        { type:'letterIntro', letter:'R', hint:'suave, como en PERA' },
        { type:'wordMatch', word:'PERA', image:'pera', options:['PERA','LUNA','MESA'] },
        { type:'wordMatch', word:'TORO', image:'toro', options:['TORO','FOCA','SOL'] },
      ]},
      { id:'j4', name:'Sumar y restar', activities:[
        { type:'simpleAdd', a:4, b:5, object:'grape' },
        { type:'simpleSub', a:9, b:3, object:'grape' },
        { type:'simpleAdd', a:6, b:4, object:'sun' },
        { type:'simpleSub', a:10, b:6, object:'sun' },
      ]},
      { id:'j5', name:'Cuadrado y triángulo', activities:[
        { type:'shapeIntro', shape:'square', name:'cuadrado' },
        { type:'shapeIntro', shape:'triangle', name:'triángulo' },
        { type:'shapeSelect', target:'square', name:'cuadrado' },
        { type:'shapeSelect', target:'triangle', name:'triángulo' },
      ]},
      { id:'j6', name:'Rectángulo y círculo', activities:[
        { type:'shapeIntro', shape:'rectangle', name:'rectángulo' },
        { type:'shapeIntro', shape:'circle', name:'círculo' },
        { type:'shapeSelect', target:'rectangle', name:'rectángulo' },
        { type:'shapeSelect', target:'circle', name:'círculo' },
      ]},
    ]},
    { id:'sanrafael', name:'San Rafael', subtitle:'Julio · RR V Y + repaso', x:55, y:82, unlocked:false, lessons:[
      { id:'jl1', name:'La RR fuerte', activities:[
        { type:'letterIntro', letter:'RR', hint:'fuerte, como en PERRO' },
        { type:'wordMatch', word:'PERRO', image:'perro', options:['PERRO','PERA','FOCA'] },
        { type:'wordMatch', word:'CARRO', image:'carro', options:['CARRO','CARA','LUNA'] },
      ]},
      { id:'jl2', name:'La letra V', activities:[
        { type:'letterIntro', letter:'V', hint:'suave, como B' },
        { type:'findLetter', target:'V', grid:['V','A','O','V','E','V','I','V','U'] },
        { type:'wordMatch', word:'VACA', image:'vaca', options:['VACA','FOCA','LUNA'] },
      ]},
      { id:'jl3', name:'La letra Y', activities:[
        { type:'letterIntro', letter:'Y', hint:'como en YOYO' },
        { type:'wordMatch', word:'YOYO', image:'yoyo', options:['YOYO','LUNA','SOL'] },
        { type:'wordMatch', word:'RAYO', image:'rayo', options:['RAYO','PERRO','MESA'] },
      ]},
      { id:'jl4', name:'Repaso de sumas', activities:[
        { type:'simpleAdd', a:7, b:3, object:'grape' },
        { type:'simpleAdd', a:5, b:5, object:'sun' },
        { type:'simpleAdd', a:8, b:2, object:'grape' },
        { type:'simpleSub', a:10, b:4, object:'grape' },
      ]},
      { id:'jl5', name:'Repaso de figuras', activities:[
        { type:'shapeSelect', target:'square', name:'cuadrado' },
        { type:'shapeSelect', target:'triangle', name:'triángulo' },
        { type:'shapeSelect', target:'circle', name:'círculo' },
        { type:'shapeSelect', target:'rectangle', name:'rectángulo' },
      ]},
      { id:'jl6', name:'Prueba integradora', activities:[
        { type:'findLetter', target:'F', grid:['F','A','P','F','E','M','T','F','O'] },
        { type:'wordMatch', word:'FOCA', image:'foca', options:['FOCA','PERRO','SOL'] },
        { type:'compareNumbers', a:14, b:8 },
        { type:'simpleAdd', a:6, b:4, object:'grape' },
        { type:'simpleSub', a:9, b:3, object:'sun' },
        { type:'shapeSelect', target:'triangle', name:'triángulo' },
      ]},
    ]},
    { id:'aconcagua', name:'Aconcagua', subtitle:'¡La cima!', x:50, y:8, unlocked:false, lessons:[], goal:true },
  ],
};

const SHOP_ITEMS = {
  hat: [
    { id:'gauchoHat', name:'Sombrero gaucho', price:15, slot:'hat' },
    { id:'redBeret', name:'Boina roja', price:20, slot:'hat' },
    { id:'andeanCap', name:'Gorro andino', price:25, slot:'hat' },
    { id:'crown', name:'Corona dorada', price:50, slot:'hat' },
    { id:'wizardHat', name:'Gorro de mago', price:45, slot:'hat' },
    { id:'explorerHelmet', name:'Casco explorador', price:35, slot:'hat' },
  ],
  poncho: [
    { id:'redPoncho', name:'Poncho rojo', price:20, slot:'poncho' },
    { id:'pampaPoncho', name:'Poncho pampa', price:35, slot:'poncho' },
    { id:'blueVest', name:'Chaleco celeste', price:30, slot:'poncho' },
    { id:'heroCape', name:'Capa de superhéroe', price:60, slot:'poncho' },
  ],
  pet: [
    { id:'condor', name:'Cóndor', price:40, slot:'pet' },
    { id:'fox', name:'Zorro colorado', price:35, slot:'pet' },
    { id:'frog', name:'Ranita mendocina', price:30, slot:'pet' },
    { id:'owl', name:'Lechuza amiga', price:45, slot:'pet' },
    { id:'vizcacha', name:'Vizcacha dormilona', price:50, slot:'pet' },
  ],
  toy: [
    { id:'balloons', name:'Globos de fiesta', price:15, slot:'toy' },
    { id:'star', name:'Estrella brillante', price:20, slot:'toy' },
    { id:'chest', name:'Cofre del tesoro', price:70, slot:'toy' },
  ],
};

const PROFILE_COLORS = ['#FF9147','#4CAF50','#5D9EC7','#B8332F','#7D3D7D','#F4A62A'];

function newProfile(name, age, colorIdx) {
  return {
    id: `p-${Date.now()}-${Math.floor(Math.random()*10000)}`,
    name: name.trim(), age: age || null,
    color: PROFILE_COLORS[colorIdx % PROFILE_COLORS.length],
    uvitas:5, completed:{}, unlocked:{lujan:true},
    owned:[], equipped:{hat:null,poncho:null,pet:null,toy:null},
    visitedZones:{},
  };
}

export default function App() {
  // Cargar estado guardado en el mismo momento que se inicia (sincrónico)
  const loadInitial = () => {
    try {
      const saved = localStorage.getItem('cuyin_state');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {profiles:[], currentId:null};
  };
  const initialScreen = () => {
    try {
      const saved = localStorage.getItem('cuyin_state');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.currentId && p.profiles.some(x => x.id === p.currentId)) return 'map';
        if (p.profiles.length) return 'picker';
      }
    } catch(e) {}
    return 'setup';
  };
  const [appState, setAppState] = useState(loadInitial);
  const [screen, setScreen] = useState(initialScreen);
  const [showIntro, setShowIntro] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [activityIdx, setActivityIdx] = useState(0);
  const [lessonUvitas, setLessonUvitas] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('cuyin_state', JSON.stringify(appState)); } catch(e){}
  }, [appState]);

  useEffect(() => { audio.muted = muted; }, [muted]);
  useEffect(() => {
    const h = () => audio.unlock();
    document.addEventListener('click', h, {once:true});
    document.addEventListener('touchstart', h, {once:true});
    return () => { document.removeEventListener('click', h); document.removeEventListener('touchstart', h); };
  }, []);

  const currentProfile = appState.profiles.find(p => p.id === appState.currentId);
  const updateProfile = (u) => {
    setAppState(s => ({...s, profiles: s.profiles.map(p => p.id === s.currentId ? {...p, ...u} : p)}));
  };
  const addProfile = (name, age) => {
    const p = newProfile(name, age, appState.profiles.length);
    setAppState(s => ({profiles: [...s.profiles, p], currentId: p.id}));
    setShowIntro(true);
    setScreen('intro');
  };
  const selectProfile = (id) => {
    const p = appState.profiles.find(x => x.id === id);
    setAppState(s => ({...s, currentId: id}));
    setScreen('map');
    if (p) setTimeout(() => audio.speak(`¡Hola de nuevo ${p.name}!`), 400);
  };
  const deleteProfile = (id) => {
    setAppState(s => ({profiles: s.profiles.filter(p => p.id !== id), currentId: s.currentId === id ? null : s.currentId}));
  };
  const openZone = (z) => {
    if (!currentProfile.unlocked[z.id]) { audio.wrong(); return; }
    audio.tap(); setCurrentZone(z); setScreen('zone');
    if (!currentProfile.visitedZones || !currentProfile.visitedZones[z.id]) {
      updateProfile({visitedZones: {...(currentProfile.visitedZones||{}), [z.id]:true}});
    }
  };
  const openLesson = (l) => { audio.tap(); setCurrentLesson(l); setActivityIdx(0); setLessonUvitas(0); setScreen('lesson'); };
  const resetLesson = (lessonId) => {
    const nc = {...currentProfile.completed};
    delete nc[lessonId];
    updateProfile({completed:nc});
  };
  const resetZone = (zone) => {
    const nc = {...currentProfile.completed};
    zone.lessons.forEach(l => delete nc[l.id]);
    updateProfile({completed:nc});
  };
  const resetAll = () => {
    updateProfile({completed:{}, unlocked:{lujan:true}, uvitas:5, owned:[], equipped:{hat:null,poncho:null,pet:null,toy:null}, visitedZones:{}});
  };
  const completeActivity = (e) => {
    setLessonUvitas(u => u + e);
    if (activityIdx + 1 < currentLesson.activities.length) setActivityIdx(activityIdx + 1);
    else finishLesson();
  };
  const finishLesson = () => {
    const total = lessonUvitas + 3;
    const nc = {...currentProfile.completed, [currentLesson.id]: true};
    const zc = currentZone.lessons.every(l => nc[l.id]);
    let nu = {...currentProfile.unlocked};
    if (zc) {
      const i = GAME.zones.findIndex(z => z.id === currentZone.id);
      const nz = GAME.zones[i+1];
      if (nz) { nu = {...nu, [nz.id]:true}; setTimeout(() => audio.levelUp(), 800); }
    }
    updateProfile({uvitas: currentProfile.uvitas + total, completed: nc, unlocked: nu});
    setLessonUvitas(total); setScreen('victory');
  };
  const buyItem = (i) => {
    if (currentProfile.uvitas < i.price || currentProfile.owned.includes(i.id)) { audio.wrong(); return; }
    audio.coin();
    updateProfile({uvitas: currentProfile.uvitas - i.price, owned: [...currentProfile.owned, i.id], equipped: {...currentProfile.equipped, [i.slot]: i.id}});
  };
  const equipItem = (i) => {
    if (!currentProfile.owned.includes(i.id)) return;
    audio.tap();
    updateProfile({equipped: {...currentProfile.equipped, [i.slot]: currentProfile.equipped[i.slot] === i.id ? null : i.id}});
  };

  return (
    <div style={{minHeight:'100vh',width:'100%',fontFamily:'Fredoka, system-ui, sans-serif',background:'linear-gradient(180deg,#FDE8C9 0%,#FBD9A0 50%,#E8B87C 100%)',WebkitTapHighlightColor:'transparent',touchAction:'manipulation',padding:'12px',boxSizing:'border-box'}}>
      <GlobalStyles />
      <div style={{maxWidth:448,margin:'0 auto',background:'#FFF8ED',borderRadius:24,boxShadow:'0 20px 40px rgba(0,0,0,0.15)',overflow:'hidden'}}>
        {currentProfile && screen!=='setup' && screen!=='picker' && screen!=='addProfile' && screen!=='intro' && (
          <HUD profile={currentProfile} muted={muted}
            onToggleMute={() => { setMuted(!muted); if (!muted) audio.tap(); }}
            onShop={() => { audio.tap(); setScreen('shop'); }}
            onHome={() => { audio.tap(); setScreen('map'); }}
            onSwitchProfile={() => { audio.tap(); setScreen('picker'); }}
            onIndex={() => { audio.tap(); setScreen('index'); }}
            screen={screen} />
        )}
        <div style={{padding:16,minHeight:500}}>
          {screen==='setup' && <SetupScreen onCreate={addProfile} />}
          {screen==='intro' && currentProfile && <IntroScreen profile={currentProfile} onDone={() => { setShowIntro(false); setScreen('map'); }} />}
          {screen==='picker' && <ProfilePicker profiles={appState.profiles} onSelect={selectProfile} onAddNew={() => setScreen('addProfile')} onDelete={deleteProfile} />}
          {screen==='addProfile' && <SetupScreen onCreate={addProfile} isAdditional={true} onCancel={() => setScreen('picker')} />}
          {screen==='map' && currentProfile && <MapScreen profile={currentProfile} onSelectZone={openZone} onIndex={() => { audio.tap(); setScreen('index'); }} onResetAll={resetAll} />}
          {screen==='index' && currentProfile && <IndexScreen profile={currentProfile} onSelectLesson={(z,l) => { setCurrentZone(z); openLesson(l); }} onBack={() => { audio.tap(); setScreen('map'); }} />}
          {screen==='zone' && currentZone && currentProfile && <ZoneScreen zone={currentZone} completedLessons={currentProfile.completed} visitedBefore={currentProfile.visitedZones && currentProfile.visitedZones[currentZone.id]} onSelectLesson={openLesson} onResetLesson={resetLesson} onResetZone={() => resetZone(currentZone)} onBack={() => { audio.tap(); setScreen('map'); }} />}
          {screen==='lesson' && currentLesson && <LessonScreen lesson={currentLesson} activityIdx={activityIdx} playerName={currentProfile.name} onComplete={completeActivity} onExit={() => { audio.tap(); setScreen('zone'); }} />}
          {screen==='victory' && currentLesson && currentProfile && <VictoryScreen lesson={currentLesson} uvitasEarned={lessonUvitas} playerName={currentProfile.name} onContinue={() => { audio.tap(); setScreen('zone'); }} equipped={currentProfile.equipped} />}
          {screen==='shop' && currentProfile && <ShopScreen uvitas={currentProfile.uvitas} equipped={currentProfile.equipped} owned={currentProfile.owned} onBuy={buyItem} onEquip={equipItem} />}
        </div>
      </div>
    </div>
  );
}

function SetupScreen({ onCreate, isAdditional=false, onCancel }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  return (
    <div style={{textAlign:'center',padding:20}}>
      <div style={{margin:'10px 0'}}><CuyinDressed size={120} /></div>
      <div style={{fontSize:22,fontWeight:700,color:'#B84A00',marginBottom:6}}>{isAdditional?'Agregar otro amigo':'¡Hola! Soy Cuyín'}</div>
      <div style={{fontSize:14,color:'#7B3F00',marginBottom:16,lineHeight:1.3}}>{isAdditional?'Contame el nombre y la edad':'Vamos a jugar juntos. Contame tu nombre'}</div>
      <input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nombre" maxLength={15}
        style={{width:'100%',padding:'12px',fontSize:17,textAlign:'center',borderRadius:16,border:'3px solid #FFB84D',background:'#FFF8ED',color:'#7B3F00',fontFamily:'Fredoka, sans-serif',outline:'none',marginBottom:10,boxSizing:'border-box'}} />
      <input type="number" value={age} onChange={(e)=>setAge(e.target.value)} placeholder="Edad (opcional)" min="3" max="12"
        style={{width:'100%',padding:'12px',fontSize:17,textAlign:'center',borderRadius:16,border:'3px solid #FFB84D',background:'#FFF8ED',color:'#7B3F00',fontFamily:'Fredoka, sans-serif',outline:'none',marginBottom:16,boxSizing:'border-box'}} />
      <button onClick={() => name.trim() && onCreate(name.trim(), age ? parseInt(age) : null)} disabled={!name.trim()} className="btn-primary">¡Empezar! →</button>
      {isAdditional && onCancel && <button onClick={onCancel} className="btn-secondary" style={{marginTop:10,width:'100%'}}>Cancelar</button>}
    </div>
  );
}

function ProfilePicker({ profiles, onSelect, onAddNew, onDelete }) {
  const [del, setDel] = useState(false);
  return (
    <div style={{padding:10}}>
      <div style={{textAlign:'center',marginBottom:16}}>
        <div style={{margin:'10px 0'}}><CuyinDressed size={90} /></div>
        <div style={{fontSize:20,fontWeight:700,color:'#B84A00'}}>¿Quién juega hoy?</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns: profiles.length > 2 ? 'repeat(2, 1fr)' : '1fr',gap:10}}>
        {profiles.map(p => {
          const tc = Object.keys(p.completed||{}).length;
          return (
            <button key={p.id} onClick={() => del ? onDelete(p.id) : onSelect(p.id)}
              style={{padding:14,borderRadius:20,background:'#FFE4B5',border:`4px solid ${del?'#CC0000':p.color}`,display:'flex',flexDirection:'column',alignItems:'center',gap:6,position:'relative'}}>
              {del && <div style={{position:'absolute',top:4,right:8,fontSize:20}}>🗑️</div>}
              <div style={{width:50,height:50,borderRadius:'50%',background:p.color,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700}}>{p.name.charAt(0).toUpperCase()}</div>
              <div style={{fontWeight:700,color:'#7B3F00',fontSize:15}}>{p.name}</div>
              {p.age && <div style={{fontSize:12,color:'#B84A00'}}>{p.age} años</div>}
              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#7B3F00'}}><Grape small /> {p.uvitas} · ⭐ {tc}</div>
            </button>
          );
        })}
        <button onClick={onAddNew} style={{padding:14,borderRadius:20,background:'#FFF8ED',border:'3px dashed #FFB84D',color:'#7B3F00',display:'flex',flexDirection:'column',alignItems:'center',gap:6,minHeight:130,justifyContent:'center'}}>
          <div style={{fontSize:36}}>+</div><div style={{fontWeight:700,fontSize:14}}>Agregar</div>
        </button>
      </div>
      {profiles.length > 0 && <button onClick={() => setDel(!del)} className="btn-secondary" style={{marginTop:14,width:'100%',fontSize:13}}>{del?'✓ Listo':'🗑️ Borrar un perfil'}</button>}
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      button { -webkit-appearance: none; appearance: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; cursor: pointer; }
      button:disabled { cursor: not-allowed; }
      input { -webkit-appearance: none; appearance: none; }
      @keyframes bob { 0%,100% { transform: translate(-50%,-85%); } 50% { transform: translate(-50%,-95%); } }
      @keyframes zonePulse { 0%,100% { box-shadow: 0 3px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,145,71,0.6); } 50% { box-shadow: 0 3px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(255,145,71,0); } }
      @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      @keyframes fall { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(600px) rotate(360deg); opacity: 0; } }
      @keyframes pop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
      .btn-primary { background: linear-gradient(135deg,#FF9147 0%,#E85D2F 100%); color:white; box-shadow: 0 4px 0 #B84A00; border:none; padding: 14px 20px; border-radius: 16px; font-size: 18px; font-weight: 700; width: 100%; }
      .btn-primary:disabled { background:#DDD; box-shadow:none; opacity:0.5; }
      .btn-secondary { background: #FFE4B5; color:#7B3F00; border:2px solid #FFB84D; padding: 10px 16px; border-radius: 12px; font-weight: 700; }
    `}</style>
  );
}

function HUD({ profile, muted, onToggleMute, onShop, onHome, onSwitchProfile, onIndex, screen }) {
  return (
    <div style={{display:'flex',alignItems:'center',padding:'10px 12px',background:'#FFF8ED',borderBottom:'2px solid #FFE4B5',gap:4}}>
      <button onClick={onHome} style={{background: screen==='map'?'#FF9147':'#FFE4B5',color: screen==='map'?'white':'#7B3F00',border:'none',padding:'7px 8px',borderRadius:10,fontSize:13}}>🗺️</button>
      <button onClick={onIndex} style={{background: screen==='index'?'#FF9147':'#FFE4B5',color: screen==='index'?'white':'#7B3F00',border:'none',padding:'7px 8px',borderRadius:10,fontSize:13}}>📋</button>
      <button onClick={onSwitchProfile} style={{flex:1,background:profile.color,color:'white',border:'none',padding:'6px 6px',borderRadius:10,fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>👤 {profile.name}</button>
      <div style={{background:'#FFE4B5',borderRadius:999,padding:'4px 7px',display:'flex',alignItems:'center',gap:3}}><Grape small /><span style={{fontWeight:700,color:'#7B3F00',fontSize:13}}>{profile.uvitas}</span></div>
      <button onClick={onToggleMute} style={{background:'#FFE4B5',color:'#7B3F00',border:'none',padding:'7px 7px',borderRadius:10,fontSize:13}}>{muted?'🔇':'🔊'}</button>
      <button onClick={onShop} style={{background: screen==='shop'?'#FF9147':'#FFE4B5',color: screen==='shop'?'white':'#7B3F00',border:'none',padding:'7px 8px',borderRadius:10,fontSize:13}}>🛍️</button>
    </div>
  );
}

function MapScreen({ profile, onSelectZone, onIndex, onResetAll }) {
  const tc = Object.keys(profile.completed).length;
  const tl = GAME.zones.reduce((s,z)=>s+z.lessons.length,0);
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div>
      <SpeechBubbleAuto delay={300}>¡Hola {profile.name}! Elegí una zona para jugar.</SpeechBubbleAuto>
      <div style={{textAlign:'center',margin:'12px 0'}}>
        <div style={{fontSize:20,fontWeight:700,color:'#B84A00'}}>Aventura por Mendoza</div>
        <div style={{fontSize:12,color:'#7B3F00'}}>{tc} de {tl} lecciones</div>
      </div>
      <div style={{position:'relative',height:360,borderRadius:24,overflow:'hidden',background:'linear-gradient(180deg,#B8D4E8 0%,#E8DAB8 60%,#C89568 100%)'}}>
        <MendozaMap />
        {GAME.zones.map(z => {
          const done = z.lessons.length>0 && z.lessons.every(l => profile.completed[l.id]);
          const un = profile.unlocked[z.id];
          const st = z.goal?'goal':done?'done':un?'current':'locked';
          return <ZoneMarker key={z.id} zone={z} status={st} onSelect={()=>onSelectZone(z)} />;
        })}
        {(() => {
          const cur = GAME.zones.find(z => profile.unlocked[z.id] && !(z.lessons.length>0 && z.lessons.every(l => profile.completed[l.id])));
          if (!cur) return null;
          return <div style={{position:'absolute',left:`${cur.x}%`,top:`${cur.y}%`,transform:'translate(-50%, -85%)',animation:'bob 2s ease-in-out infinite',pointerEvents:'none'}}><CuyinDressed equipped={profile.equipped} size={50} /></div>;
        })()}
      </div>
      <div style={{marginTop:12,padding:10,background:'#FFE4B5',borderRadius:16,border:'2px solid #FFB84D',display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#7B3F00',lineHeight:1.3}}>
        <span style={{fontSize:20}}>💡</span>Zonas <b>naranjas</b>: para jugar. <b>Verdes</b>: ya hechas. <b>Grises</b>: se abren completando la anterior.
      </div>
      <div style={{display:'flex',gap:6,marginTop:10}}>
        <button onClick={onIndex} className="btn-secondary" style={{flex:1,fontSize:13}}>📋 Índice</button>
        <button onClick={() => setConfirmReset(true)} style={{padding:'8px 12px',borderRadius:12,background:'#FFF0F0',border:'2px solid #FFAAAA',color:'#CC0000',fontSize:12,fontWeight:600}}>🔄 Reset todo</button>
      </div>
      {confirmReset && (
        <div style={{marginTop:8,padding:10,background:'#FFCCCC',borderRadius:12,border:'2px solid #CC0000',textAlign:'center'}}>
          <div style={{fontSize:13,color:'#CC0000',fontWeight:700,marginBottom:8}}>¿Seguro? Se borra todo el progreso de {profile.name}</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => { onResetAll(); setConfirmReset(false); }} style={{flex:1,padding:10,borderRadius:10,background:'#CC0000',color:'white',border:'none',fontWeight:700,fontSize:13}}>Sí, borrar</button>
            <button onClick={() => setConfirmReset(false)} style={{flex:1,padding:10,borderRadius:10,background:'#FFE4B5',color:'#7B3F00',border:'2px solid #FFB84D',fontWeight:700,fontSize:13}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneMarker({ zone, status, onSelect }) {
  const c = {done:{bg:'#4CAF50',icon:'⭐'},current:{bg:'#FF9147',icon:'',pulse:true},locked:{bg:'#999',icon:'🔒'},goal:{bg:'#B84A00',icon:'🏔️'}}[status];
  return (
    <button type="button" onClick={onSelect} disabled={status==='locked'||status==='goal'}
      style={{position:'absolute',left:`${zone.x}%`,top:`${zone.y}%`,transform:'translate(-50%, -50%)',width:44,height:44,borderRadius:'50%',background:c.bg,border:'3px solid white',color:'white',fontWeight:700,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 8px rgba(0,0,0,0.3)',animation:c.pulse?'zonePulse 1.5s ease-in-out infinite':'none',opacity:status==='locked'?0.7:1}}>{c.icon}</button>
  );
}

function MendozaMap() {
  return (
    <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M 0 100 L 0 10 L 8 5 L 15 15 L 22 8 L 30 18 L 25 30 L 30 45 L 20 60 L 15 80 L 5 95 Z" fill="#8B7BA8" opacity="0.7" />
      <path d="M 8 5 L 15 15 L 12 10 Z" fill="white" />
      <path d="M 22 8 L 30 18 L 26 12 Z" fill="white" />
      {[...Array(30)].map((_,i) => { const x=40+(i%6)*10, y=30+Math.floor(i/6)*12; return <circle key={i} cx={x} cy={y} r="1.5" fill="#7DA240" opacity="0.4" />; })}
      <path d="M 30 20 Q 45 40 55 60 Q 65 75 75 90" stroke="#5D9EC7" strokeWidth="1.2" fill="none" opacity="0.5" />
    </svg>
  );
}

function ZoneScreen({ zone, completedLessons, visitedBefore, onSelectLesson, onResetLesson, onResetZone, onBack }) {
  const [showReset, setShowReset] = useState(false);
  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:10}}>
        <button onClick={onBack} className="btn-secondary" style={{flex:1}}>← Mapa</button>
        <button onClick={() => setShowReset(!showReset)} style={{background:'#FFF8ED',border:'2px solid #CCC',borderRadius:12,padding:'8px 12px',fontSize:12,color:'#7B3F00',fontWeight:600}}>{showReset?'✓ Listo':'🔄 Reset'}</button>
      </div>
      {!visitedBefore && <SpeechBubbleAuto delay={200}>Llegamos a {zone.name}. {zone.subtitle}. Elegí una lección.</SpeechBubbleAuto>}
      <div style={{textAlign:'center',margin:'8px 0 12px'}}>
        <div style={{fontSize:20,fontWeight:700,color:'#B84A00'}}>{zone.name}</div>
        <div style={{fontSize:13,color:'#7B3F00'}}>{zone.subtitle}</div>
      </div>
      {showReset && <button onClick={() => { onResetZone(); setShowReset(false); audio.speak('Zona reseteada',{rate:0.7}); }} style={{width:'100%',padding:10,borderRadius:12,background:'#FFCCCC',border:'2px solid #CC0000',color:'#CC0000',fontWeight:700,fontSize:13,marginBottom:10}}>🗑️ Borrar progreso de {zone.name}</button>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {zone.lessons.map((l,i) => {
          const done = !!completedLessons[l.id];
          const prevDone = i===0 || !!completedLessons[zone.lessons[i-1].id];
          const canPlay = prevDone;
          return (
            <div key={l.id} style={{display:'flex',gap:6,alignItems:'stretch'}}>
              <button onClick={() => canPlay && onSelectLesson(l)} disabled={!canPlay}
                style={{flex:1,borderRadius:16,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,textAlign:'left',
                  background: done?'#E8F5E9':canPlay?'#FFF8ED':'#F5F5F5',
                  border: done?'3px solid #4CAF50':canPlay?'3px solid #FF9147':'2px solid #CCC',
                  color:'#7B3F00',opacity: !canPlay?0.5:1}}>
                <div style={{fontSize:22,width:28,textAlign:'center'}}>{done?'✅':canPlay?'▶️':'🔒'}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{l.name}</div>
                  <div style={{fontSize:11,color: done?'#2E7D32':'#999',marginTop:2}}>{done?'Completada ✓':canPlay?`${l.activities.length} actividades`:'Bloqueada'}</div>
                </div>
              </button>
              {done && showReset && <button onClick={() => onResetLesson(l.id)} style={{width:42,borderRadius:12,background:'#FFF0F0',border:'2px solid #FFAAAA',color:'#CC0000',fontSize:15,flexShrink:0}}>↺</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IndexScreen({ profile, onSelectLesson, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="btn-secondary" style={{marginBottom:10}}>← Volver al mapa</button>
      <div style={{textAlign:'center',margin:'0 0 14px'}}>
        <div style={{fontSize:20,fontWeight:700,color:'#B84A00'}}>📋 Índice de lecciones</div>
        <div style={{fontSize:12,color:'#7B3F00'}}>Tocá cualquiera para ir directamente</div>
      </div>
      {GAME.zones.filter(z => !z.goal).map(z => {
        const unlocked = profile.unlocked[z.id];
        return (
          <div key={z.id} style={{marginBottom:12}}>
            <div style={{padding:'8px 12px',background: unlocked?'#FFE4B5':'#F0F0F0',borderRadius:'12px 12px 0 0',border:'2px solid '+(unlocked?'#FFB84D':'#CCC'),borderBottom:'none',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:16}}>{unlocked?'📍':'🔒'}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:'#7B3F00'}}>{z.name}</div>
                <div style={{fontSize:11,color:'#999'}}>{z.subtitle}</div>
              </div>
            </div>
            <div style={{border:'2px solid '+(unlocked?'#FFB84D':'#CCC'),borderTop:'none',borderRadius:'0 0 12px 12px',overflow:'hidden'}}>
              {z.lessons.map((l,i) => {
                const done = !!profile.completed[l.id];
                const canPlay = unlocked && (i===0 || !!profile.completed[z.lessons[i-1].id]);
                return (
                  <button key={l.id} onClick={() => canPlay && onSelectLesson(z,l)} disabled={!canPlay}
                    style={{width:'100%',padding:'10px 12px',display:'flex',alignItems:'center',gap:8,
                      background: done?'#E8F5E9':canPlay?'#FFF8ED':'#FAFAFA',
                      borderBottom:'1px solid #EEE',border:'none',textAlign:'left',
                      opacity: canPlay?1:0.4,color:'#7B3F00'}}>
                    <span style={{fontSize:14,width:22,textAlign:'center'}}>{done?'✅':canPlay?'▶️':'🔒'}</span>
                    <span style={{fontSize:13,flex:1}}>{l.name}</span>
                    <span style={{fontSize:11,color:'#999'}}>{l.activities.length}🎯</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LessonScreen({ lesson, activityIdx, playerName, onComplete, onExit }) {
  const a = lesson.activities[activityIdx];
  const prog = (activityIdx/lesson.activities.length)*100;
  const [errors, setErrors] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => { setErrors(0); setShowHelp(false); }, [activityIdx]);

  const onWrong = () => {
    const e = errors + 1;
    setErrors(e);
    if (e >= 3 && !showHelp) {
      setShowHelp(true);
      const hints = {
        letterIntro: 'Tocá la letra grande para escucharla.',
        findLetter: 'Buscá y tocá solo las letras que dice arriba.',
        countObjects: 'Primero tocá cada uno para contar, después elegí el número.',
        simpleAdd: 'Contá los dos grupos juntos y elegí cuántos son en total.',
        simpleSub: 'Mirá cuántos quedan y elegí ese número.',
        wordMatch: 'Mirá la palabra de arriba y buscá la que es igual.',
        numberIntro: 'Tocá el número grande para escucharlo.',
        compareNumbers: 'Tocá el número que sea más grande.',
        shapeIntro: 'Tocá la figura para escuchar su nombre.',
        shapeSelect: 'Mirá bien las figuras y elegí la que dice arriba.',
        initialSoundMatch: 'Buscá las palabras que empiezan con el mismo sonido.',
        diceRoll: 'Contá los puntos del dado y elegí ese número.',
        sumsToTen: 'Pensá qué número le falta para llegar a diez.',
        syllableTable: 'Escuchá bien la sílaba y tocá la que suena igual.',
        numberDictation: 'Escuchá el número y tocá el que es.',
        orderNumbers: 'Tocá los números en orden, empezando por el más chiquito.',
      };
      const hint = hints[a.type] || 'Escuchá bien y elegí la opción correcta.';
      audio.speak(`No te preocupes. Te ayudo. ${hint}`, {rate:0.6});
    }
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <button onClick={onExit} style={{background:'transparent',border:'none',fontSize:20,color:'#7B3F00'}}>✕</button>
        <div style={{flex:1,height:10,background:'#FFE4B5',borderRadius:5,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${prog}%`,background:'#FF9147',transition:'width 0.3s'}} />
        </div>
        <div style={{fontSize:13,fontWeight:700,color:'#7B3F00'}}>{activityIdx+1}/{lesson.activities.length}</div>
      </div>
      {showHelp && (
        <div style={{background:'#FFF3CD',border:'2px solid #FFB84D',borderRadius:14,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:20}}>💡</span>
          <div style={{fontSize:13,color:'#7B3F00',lineHeight:1.3}}>
            No te preocupes, ¡así se aprende! Escuchá la ayuda.
            <button onClick={() => { const hints = {letterIntro:'Tocá la letra grande para escucharla.',findLetter:'Buscá las letras que dice arriba.',simpleAdd:'Contá los dos grupos juntos.',simpleSub:'Mirá cuántos quedan.',wordMatch:'Buscá la palabra igual a la de arriba.',compareNumbers:'Tocá el más grande.',sumsToTen:'¿Qué le falta para llegar a diez?',syllableTable:'Tocá la sílaba que suena igual.'}; audio.speak(hints[a.type]||'Escuchá bien y elegí.',{rate:0.55}); }} style={{marginLeft:6,background:'#FFE4B5',border:'2px solid #FFB84D',borderRadius:8,padding:'4px 8px',fontSize:11,color:'#7B3F00',fontWeight:700}}>🔊 Repetir ayuda</button>
          </div>
        </div>
      )}
      {a.type==='letterIntro' && <LetterIntro key={activityIdx} activity={a} onDone={()=>onComplete(2)} />}
      {a.type==='findLetter' && <FindLetter key={activityIdx} activity={a} onDone={()=>onComplete(3)} onWrong={onWrong} />}
      {a.type==='countObjects' && <CountObjects key={activityIdx} activity={a} onDone={()=>onComplete(3)} />}
      {a.type==='simpleAdd' && <SimpleAdd key={activityIdx} activity={a} onDone={()=>onComplete(4)} onWrong={onWrong} />}
      {a.type==='simpleSub' && <SimpleSub key={activityIdx} activity={a} onDone={()=>onComplete(4)} onWrong={onWrong} />}
      {a.type==='wordMatch' && <WordMatch key={activityIdx} activity={a} onDone={()=>onComplete(3)} onWrong={onWrong} />}
      {a.type==='numberIntro' && <NumberIntro key={activityIdx} activity={a} onDone={()=>onComplete(2)} />}
      {a.type==='compareNumbers' && <CompareNumbers key={activityIdx} activity={a} onDone={()=>onComplete(3)} onWrong={onWrong} />}
      {a.type==='shapeIntro' && <ShapeIntro key={activityIdx} activity={a} onDone={()=>onComplete(2)} />}
      {a.type==='shapeSelect' && <ShapeSelect key={activityIdx} activity={a} onDone={()=>onComplete(3)} onWrong={onWrong} />}
      {a.type==='initialSoundMatch' && <InitialSoundMatch key={activityIdx} activity={a} onDone={()=>onComplete(4)} onWrong={onWrong} />}
      {a.type==='diceRoll' && <DiceRoll key={activityIdx} activity={a} onDone={()=>onComplete(3)} onWrong={onWrong} />}
      {a.type==='sumsToTen' && <SumsToTen key={activityIdx} activity={a} onDone={()=>onComplete(4)} onWrong={onWrong} />}
      {a.type==='syllableTable' && <SyllableTable key={activityIdx} activity={a} onDone={()=>onComplete(4)} />}
      {a.type==='numberDictation' && <NumberDictation key={activityIdx} activity={a} onDone={()=>onComplete(3)} onWrong={onWrong} />}
      {a.type==='orderNumbers' && <OrderNumbers key={activityIdx} activity={a} onDone={()=>onComplete(4)} />}
    </div>
  );
}

function IntroScreen({ profile, onDone }) {
  const [step, setStep] = useState(0);
  const slides = [
    { title: `¡Hola ${profile.name}!`, text: `Soy Cuyín, un guanaco de los Andes. Voy a ser tu amigo en esta aventura.`, emoji: '👋' },
    { title: 'Vamos a viajar por Mendoza', text: 'De Luján de Cuyo hasta la cima del Aconcagua. Van a ser cinco zonas llenas de juegos.', emoji: '🗺️' },
    { title: 'Vas a conocer a mis amigos', text: 'En el camino te esperan José y María, y muchos personajes más.', emoji: '👦👧' },
    { title: 'Vas a aprender jugando', text: 'Letras, números, figuras. Todo lo que estás viendo en la escuela.', emoji: '📚' },
    { title: 'Ganás uvitas', text: 'Cada vez que terminás una lección, ganás uvitas. Con las uvitas comprás sombreros, ponchos y amigos en la tienda.', emoji: '🍇' },
    { title: '¿Estás listo?', text: '¡Vamos a jugar!', emoji: '🎉' },
  ];
  const s = slides[step];
  useEffect(() => {
    const t = setTimeout(() => audio.speak(s.title + '. ' + s.text, {rate:0.7}), 400);
    return () => clearTimeout(t);
  }, [step]);
  const next = () => {
    audio.tap();
    if (step + 1 < slides.length) setStep(step + 1);
    else { audio.levelUp(); onDone(); }
  };
  return (
    <div style={{textAlign:'center',padding:20}}>
      <div style={{fontSize:56,margin:'10px 0'}}>{s.emoji}</div>
      <div style={{margin:'6px 0 12px'}}><CuyinDressed size={100} /></div>
      <div style={{fontSize:22,fontWeight:700,color:'#B84A00',marginBottom:10}}>{s.title}</div>
      <div style={{fontSize:15,color:'#7B3F00',marginBottom:20,lineHeight:1.4,minHeight:60,padding:'0 8px'}}>{s.text}</div>
      <div style={{display:'flex',justifyContent:'center',gap:4,marginBottom:14}}>
        {slides.map((_,i) => (
          <div key={i} style={{width:8,height:8,borderRadius:'50%',background: i===step?'#B84A00':'#FFB84D',opacity: i<=step?1:0.4}} />
        ))}
      </div>
      <button className="btn-primary" onClick={next}>{step+1<slides.length ? 'Seguir →' : '¡Empezar!'}</button>
    </div>
  );
}

function NumberDictation({ activity, onDone, onWrong }) {
  const { target } = activity;
  const [ans, setAns] = useState(null);
  const shuf = useRef([...activity.options].sort(()=>0.5-Math.random())).current;
  useEffect(() => {
    const t = setTimeout(() => audio.speak(`Tocá el número ${target}`, {rate:0.6}), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Escuchá y tocá el número que digo</SpeechBubbleAuto>
      <button onClick={() => audio.speak(String(target), {rate:0.5})} style={{margin:'16px 0',background:'#FFE4B5',border:'3px solid #FFB84D',borderRadius:20,padding:'12px 20px',fontSize:16,color:'#7B3F00',fontWeight:700,fontFamily:'Fredoka, sans-serif'}}>
        🔊 Escuchar de nuevo
      </button>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,margin:'20px 0'}}>
        {shuf.map(n => {
          const r = ans===n && n===target, w = ans===n && n!==target;
          return (
            <button key={n} onClick={() => {
              setAns(n);
              audio.speak(String(n), {rate:0.6});
              if (n===target) { setTimeout(() => { audio.correct(); audio.speak(`¡Sí! Es el ${target}`, {rate:0.65}); }, 500); setTimeout(onDone, 1600); }
              else { setTimeout(() => { audio.wrong(); setAns(null); }, 800); }
            }} style={{aspectRatio:'1',borderRadius:20,fontSize:40,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#1F4E7B',border:'3px solid '+(r?'#2E7D32':'#5D9EC7'),animation: w?'shake 0.4s':'none'}}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

function SyllableTable({ activity, onDone }) {
  const { letter, syllables } = activity;
  const [phase, setPhase] = useState('listen'); // listen, quiz
  const [listenIdx, setListenIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState(null);
  const [quizAns, setQuizAns] = useState(null);
  const [quizCount, setQuizCount] = useState(0);
  const quizTotal = 3;

  // Fase 1: escuchar las 5 sílabas una por una
  useEffect(() => {
    if (phase === 'listen' && listenIdx < syllables.length) {
      const t = setTimeout(() => {
        audio.speak(syllables[listenIdx], {rate:0.55});
      }, listenIdx === 0 ? 800 : 400);
      return () => clearTimeout(t);
    }
  }, [phase, listenIdx]);

  const nextListen = () => {
    audio.tap();
    if (listenIdx + 1 < syllables.length) {
      setListenIdx(listenIdx + 1);
    } else {
      setPhase('quiz');
      const t = syllables[Math.floor(Math.random() * syllables.length)];
      setQuizTarget(t);
      setTimeout(() => audio.speak(`Ahora tocá la que digo. ${t}`, {rate:0.6}), 500);
    }
  };

  const handleQuizTap = (syl) => {
    setQuizAns(syl);
    audio.speak(syl, {rate:0.55});
    if (syl === quizTarget) {
      audio.correct();
      const next = quizCount + 1;
      setQuizCount(next);
      if (next >= quizTotal) {
        setTimeout(() => { audio.speak('¡Excelente! Sabés las sílabas.', {rate:0.65}); onDone(); }, 800);
      } else {
        setTimeout(() => {
          setQuizAns(null);
          const remaining = syllables.filter(s => s !== quizTarget);
          const newTarget = remaining[Math.floor(Math.random() * remaining.length)];
          setQuizTarget(newTarget);
          audio.speak(`Muy bien. Ahora tocá... ${newTarget}`, {rate:0.6});
        }, 900);
      }
    } else {
      audio.wrong();
      setTimeout(() => { setQuizAns(null); audio.speak(quizTarget, {rate:0.5}); }, 700);
    }
  };

  return (
    <div style={{textAlign:'center'}}>
      {phase === 'listen' ? (
        <>
          <SpeechBubbleAuto>Escuchá las sílabas con la <b>{letter}</b>. Tocá cada una.</SpeechBubbleAuto>
          <div style={{display:'flex',justifyContent:'center',gap:8,margin:'20px 0',flexWrap:'wrap'}}>
            {syllables.map((syl, i) => (
              <button key={syl}
                onClick={() => { if (i === listenIdx) { audio.speak(syl, {rate:0.55}); } }}
                style={{
                  width:72,height:72,borderRadius:18,fontSize:26,fontWeight:700,
                  background: i < listenIdx ? '#4CAF50' : i === listenIdx ? '#FFD700' : '#FFE4B5',
                  color: i < listenIdx ? 'white' : '#7B3F00',
                  border: i === listenIdx ? '4px solid #B84A00' : '2px solid #FFB84D',
                  boxShadow: i === listenIdx ? '0 0 20px #FFD700' : 'none',
                  opacity: i > listenIdx ? 0.4 : 1,
                }}>{syl}</button>
            ))}
          </div>
          <div style={{fontSize:16,fontWeight:700,color:'#B84A00',marginBottom:12}}>
            {syllables[listenIdx]}
          </div>
          <button className="btn-primary" onClick={nextListen}>
            {listenIdx + 1 < syllables.length ? `Siguiente → ${syllables[listenIdx + 1]}` : '¡Ahora a jugar!'}
          </button>
        </>
      ) : (
        <>
          <SpeechBubbleAuto>Tocá la sílaba que digo</SpeechBubbleAuto>
          <button onClick={() => audio.speak(quizTarget, {rate:0.5})} style={{margin:'14px 0',background:'#FFE4B5',border:'3px solid #FFB84D',borderRadius:20,padding:'12px 20px',fontSize:16,color:'#7B3F00',fontWeight:700,fontFamily:'Fredoka, sans-serif'}}>
            🔊 Escuchar de nuevo
          </button>
          <div style={{fontSize:13,color:'#7B3F00',marginBottom:8}}>{quizCount} de {quizTotal}</div>
          <div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap'}}>
            {syllables.map(syl => {
              const r = quizAns === syl && syl === quizTarget;
              const w = quizAns === syl && syl !== quizTarget;
              return (
                <button key={syl} onClick={() => handleQuizTap(syl)}
                  style={{
                    width:80,height:80,borderRadius:20,fontSize:28,fontWeight:700,
                    background: r ? 'linear-gradient(135deg,#7FD858,#4CAF50)' : w ? '#FFCCCC' : '#FFE4B5',
                    color: r ? 'white' : '#7B3F00',
                    border: r ? '3px solid #2E7D32' : '3px solid #FFB84D',
                    animation: w ? 'shake 0.4s' : 'none',
                  }}>{syl}</button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function OrderNumbers({ activity, onDone }) {
  const { numbers, direction } = activity;
  const sorted = [...numbers].sort((a,b) => direction==='asc' ? a-b : b-a);
  const [scrambled] = useState(() => [...numbers].sort(()=>0.5-Math.random()));
  const [picked, setPicked] = useState([]);
  const nextExpected = sorted[picked.length];
  const done = picked.length === sorted.length;
  useEffect(() => { if (done) { audio.correct(); audio.speak('¡Muy bien!', {rate:0.7}); setTimeout(onDone, 1200); } }, [done]);
  const handleTap = (n) => {
    if (picked.includes(n)) return;
    if (n === nextExpected) { audio.tap(); audio.speak(String(n), {rate:0.65}); setPicked([...picked, n]); }
    else { audio.wrong(); }
  };
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Tocá los números del <b>{direction==='asc'?'más chico al más grande':'más grande al más chico'}</b></SpeechBubbleAuto>
      <div style={{margin:'20px 0',padding:14,background:'#FFF8ED',border:'2px dashed #FFB84D',borderRadius:16,minHeight:60,display:'flex',justifyContent:'center',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        {picked.length === 0 ? <span style={{color:'#7B3F00',fontSize:14}}>Elegí uno...</span> :
          picked.map((n,i) => <span key={i} style={{fontSize:28,fontWeight:700,color:'#4CAF50'}}>{n}{i<picked.length-1?' →':''}</span>)
        }
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {scrambled.map(n => {
          const used = picked.includes(n);
          return (
            <button key={n} onClick={() => handleTap(n)} disabled={used}
              style={{aspectRatio:'1',borderRadius:16,fontSize:28,fontWeight:700,background: used?'#DDD':'#FFE4B5',color: used?'#999':'#1F4E7B',border:'3px solid '+(used?'#BBB':'#5D9EC7'),opacity: used?0.4:1}}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

function LetterIntro({ activity, onDone }) {
  const [t, setT] = useState(false);
  const isV = ['A','E','I','O','U'].includes(activity.letter);
  return (
    <div style={{textAlign:'center',padding:10}}>
      <SpeechBubbleAuto>Esta es la letra <b>{activity.letter}</b>, {activity.hint}. ¡Tocala!</SpeechBubbleAuto>
      <button onClick={() => { setT(true); audio.speak(letterSound(activity.letter), {rate:0.6}); }}
        style={{background:'transparent',border:'none',margin:'20px 0'}}>
        <div style={{width:180,height:180,borderRadius:'50%',background: t?'radial-gradient(circle,#FFE4B5 0%,#FFB84D 100%)':'radial-gradient(circle,#FFF8ED 0%,#FFE4B5 100%)',boxShadow: t?'0 0 40px #FFB84D':'0 4px 20px rgba(0,0,0,0.1)',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',animation: t?'pop 0.4s':'none'}}>
          <span style={{fontSize: activity.letter.length>1?90:120,fontWeight:700,color:'#B84A00',lineHeight:1}}>{activity.letter}</span>
        </div>
      </button>
      {isV && t && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,margin:'4px 0'}}>
          <RefObject type={REF_WORD[activity.letter].toLowerCase()} size={70} />
          <div style={{fontSize:14,fontWeight:700,color:'#B84A00'}}>{REF_WORD[activity.letter]}</div>
        </div>
      )}
      <div style={{margin:'10px 0 20px'}}><CuyinDressed size={70} /></div>
      <button className="btn-primary" onClick={() => { audio.correct(); onDone(); }} disabled={!t}>{t?'¡Muy bien! Seguir →':'👆 Tocá la letra'}</button>
    </div>
  );
}

function InitialSoundMatch({ activity, onDone, onWrong }) {
  const [sel, setSel] = useState({});
  const [wrong, setWrong] = useState(null);
  const shuffledOpts = useRef([...activity.options].sort(()=>0.5-Math.random())).current;
  const total = shuffledOpts.filter(o => o.starts).length;
  const foundCount = Object.values(sel).filter(Boolean).length;
  const handleTap = (idx) => {
    const opt = shuffledOpts[idx];
    if (sel[idx]) return;
    if (opt.starts) {
      audio.tap(); audio.speak(opt.word, {rate:0.65});
      const ns = {...sel, [idx]:true};
      setSel(ns);
      if (Object.values(ns).filter(Boolean).length === total) {
        setTimeout(() => { audio.correct(); audio.speak('¡Excelente! Encontraste todas.', {rate:0.7}); onDone(); }, 900);
      }
    } else {
      audio.wrong(); if(onWrong) onWrong(); audio.speak(opt.word, {rate:0.65});
      setWrong(idx); setTimeout(() => setWrong(null), 500);
    }
  };
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Buscá las palabras que empiezan como <b>{activity.ref.toUpperCase()}</b></SpeechBubbleAuto>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',margin:'14px 0'}}>
        <RefObject type={activity.ref} size={70} />
        <div style={{fontSize:15,fontWeight:700,color:'#B84A00',marginTop:4}}>{activity.ref.toUpperCase()}</div>
        <div style={{fontSize:13,color:'#7B3F00',marginTop:4}}>{foundCount} / {total}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:8}}>
        {shuffledOpts.map((opt,i) => {
          const s = sel[i], w = wrong===i;
          return (
            <button key={i} onClick={() => handleTap(i)}
              style={{padding:'18px 10px',borderRadius:16,fontSize:18,fontWeight:700,letterSpacing:1,background: s?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: s?'white':'#7B3F00',border: s?'3px solid #2E7D32':'2px solid #FFB84D',animation: w?'shake 0.4s':'none'}}>{opt.word}</button>
          );
        })}
      </div>
    </div>
  );
}

function NumberIntro({ activity, onDone }) {
  const [t, setT] = useState(false);
  return (
    <div style={{textAlign:'center',padding:10}}>
      <SpeechBubbleAuto>Este es el número <b>{activity.number}</b>. ¡Tocalo!</SpeechBubbleAuto>
      <button onClick={() => { setT(true); audio.speak(String(activity.number), {rate:0.9}); }} style={{background:'transparent',border:'none',margin:'20px 0'}}>
        <div style={{width:180,height:180,borderRadius:'50%',background: t?'radial-gradient(circle,#B8E4F5 0%,#5D9EC7 100%)':'radial-gradient(circle,#F0F8FE 0%,#B8E4F5 100%)',boxShadow: t?'0 0 40px #5D9EC7':'0 4px 20px rgba(0,0,0,0.1)',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',animation: t?'pop 0.4s':'none'}}>
          <span style={{fontSize:120,fontWeight:700,color:'#1F4E7B',lineHeight:1}}>{activity.number}</span>
        </div>
      </button>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:6,margin:'10px 0 20px',maxWidth:300,marginLeft:'auto',marginRight:'auto'}}>
        {[...Array(activity.number)].map((_,i) => <Grape key={i} size={22} />)}
      </div>
      <button className="btn-primary" onClick={() => { audio.correct(); onDone(); }} disabled={!t}>{t?'¡Muy bien! Seguir →':'👆 Tocá el número'}</button>
    </div>
  );
}

function CompareNumbers({ activity, onDone, onWrong }) {
  const { a, b } = activity;
  const big = a > b ? 'a' : 'b';
  const [ans, setAns] = useState(null);
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>¿Cuál es más grande?</SpeechBubbleAuto>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:20,margin:'30px 0'}}>
        {['a','b'].map(k => {
          const v = k==='a'?a:b, r = ans===k && k===big, w = ans===k && k!==big;
          return (
            <button key={k} onClick={() => {
              setAns(k);
              if (k===big) { audio.correct(); audio.speak(`${v} es más grande`); setTimeout(onDone, 1200); }
              else { audio.wrong(); if(onWrong) onWrong(); setTimeout(() => setAns(null), 700); }
            }} style={{width:100,height:130,borderRadius:20,fontSize:56,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'3px solid '+(r?'#2E7D32':'#FFB84D'),animation: w?'shake 0.4s':'none'}}>{v}</button>
          );
        })}
      </div>
      <div style={{fontSize:15,color:'#7B3F00'}}>Tocá el número más grande</div>
    </div>
  );
}

function ShapeIntro({ activity, onDone }) {
  const [t, setT] = useState(false);
  return (
    <div style={{textAlign:'center',padding:10}}>
      <SpeechBubbleAuto>Esta figura es un <b>{activity.name}</b>. ¡Tocala!</SpeechBubbleAuto>
      <button onClick={() => { setT(true); audio.speak(activity.name, {rate:0.9}); }} style={{background:'transparent',border:'none',margin:'20px 0'}}>
        <div style={{width:180,height:180,borderRadius:20,background: t?'radial-gradient(circle,#E4F5B8 0%,#7DA240 100%)':'radial-gradient(circle,#F8FEF0 0%,#E4F5B8 100%)',boxShadow: t?'0 0 40px #7DA240':'0 4px 20px rgba(0,0,0,0.1)',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',animation: t?'pop 0.4s':'none'}}>
          <Shape type={activity.shape} size={110} />
        </div>
      </button>
      <div style={{margin:'10px 0 20px'}}><CuyinDressed size={70} /></div>
      <button className="btn-primary" onClick={() => { audio.correct(); onDone(); }} disabled={!t}>{t?'¡Muy bien! Seguir →':'👆 Tocá la figura'}</button>
    </div>
  );
}

function ShapeSelect({ activity, onDone, onWrong }) {
  const all = ['square','triangle','circle','rectangle'];
  const opts = useRef([...all].sort(()=>0.5-Math.random())).current;
  const [ans, setAns] = useState(null);
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>¿Cuál es el <b>{activity.name}</b>?</SpeechBubbleAuto>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:10,margin:'20px 0'}}>
        {opts.map(s => {
          const r = ans===s && s===activity.target, w = ans===s && s!==activity.target;
          return (
            <button key={s} onClick={() => {
              setAns(s);
              if (s===activity.target) { audio.correct(); audio.speak(`¡Muy bien! Es el ${activity.name}`); setTimeout(onDone, 1300); }
              else { audio.wrong(); if(onWrong) onWrong(); setTimeout(() => setAns(null), 700); }
            }} style={{aspectRatio:'1',borderRadius:20,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',border: r?'3px solid #2E7D32':'2px solid #FFB84D',display:'flex',alignItems:'center',justifyContent:'center',animation: w?'shake 0.4s':'none'}}>
              <Shape type={s} size={80} color={r?'white':'#7B3F00'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Shape({ type, size=80, color='#B84A00' }) {
  const s = size;
  if (type==='square') return <svg width={s} height={s} viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill={color} rx="4" /></svg>;
  if (type==='rectangle') return <svg width={s} height={s*0.6} viewBox="0 0 100 60"><rect x="10" y="10" width="80" height="40" fill={color} rx="4" /></svg>;
  if (type==='triangle') return <svg width={s} height={s} viewBox="0 0 100 100"><polygon points="50,15 85,80 15,80" fill={color} /></svg>;
  if (type==='circle') return <svg width={s} height={s} viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill={color} /></svg>;
  return null;
}

function FindLetter({ activity, onDone, onWrong }) {
  const { target, grid } = activity;
  const tc = grid.filter(l => l===target).length;
  const [found, setFound] = useState([]);
  const [wrong, setWrong] = useState(null);
  const handleTap = (idx) => {
    if (found.includes(idx)) return;
    if (grid[idx]===target) {
      audio.tap();
      const nf = [...found, idx];
      setFound(nf);
      if (nf.length===tc) setTimeout(() => { audio.correct(); audio.speak('¡Muy bien!'); onDone(); }, 500);
    } else {
      audio.wrong(); if(onWrong) onWrong(); setWrong(idx); setTimeout(() => setWrong(null), 400);
    }
  };
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Encontrá las <b>{tc} letras {target}</b></SpeechBubbleAuto>
      <div style={{margin:'12px 0',fontSize:20,fontWeight:700,color:'#B84A00'}}>{found.length} / {tc}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8}}>
        {grid.map((l,i) => {
          const f = found.includes(i), w = wrong===i;
          return (
            <button key={i} onClick={() => handleTap(i)}
              style={{aspectRatio:'1',borderRadius:16,background: f?'linear-gradient(135deg,#FFD700,#FFA500)':w?'#FFCCCC':'#FFE4B5',color: f?'white':'#7B3F00',border: f?'3px solid #B84A00':'2px solid transparent',fontSize:26,fontWeight:700,animation: w?'shake 0.4s':'none',boxShadow: f?'0 0 15px #FFD700':'none'}}>{l}</button>
          );
        })}
      </div>
    </div>
  );
}

function CountObjects({ activity, onDone }) {
  const { object, answer } = activity;
  const [tc, setTc] = useState(0);
  const [ans, setAns] = useState(null);
  const opts = [answer-1, answer, answer+1, answer+2].filter(n => n>0).slice(0,4);
  const shuf = useRef([...opts].sort(()=>0.5-Math.random())).current;
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>¿Cuántos hay? Tocá cada uno para contar.</SpeechBubbleAuto>
      <div style={{margin:'20px 0',display:'flex',flexWrap:'wrap',justifyContent:'center',gap:10,minHeight:100}}>
        {[...Array(answer)].map((_,i) => (
          <button key={i} onClick={() => {
            const next = Math.max(tc, i+1);
            if (next>tc) { audio.tap(); audio.speak(String(next), {rate:1.1}); }
            setTc(next);
          }} style={{background:'transparent',border:'none',transform: i<tc?'scale(1.1)':'scale(1)',filter: i<tc?'drop-shadow(0 0 8px #FFD700)':'none',transition:'all 0.2s'}}>
            <ObjectIcon type={object} size={50} />
          </button>
        ))}
      </div>
      <div style={{fontSize:24,fontWeight:700,color:'#7B3F00',marginBottom:10}}>Contaste: {tc}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {shuf.map(n => {
          const r = ans===n && n===answer, w = ans===n && n!==answer;
          return (
            <button key={n} onClick={() => {
              if (tc<answer) return;
              setAns(n);
              if (n===answer) { audio.correct(); audio.speak('¡Muy bien!'); setTimeout(onDone, 900); }
              else { audio.wrong(); setTimeout(() => setAns(null), 700); }
            }} disabled={tc<answer} style={{padding:'14px 0',borderRadius:14,fontSize:22,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'none',opacity: tc<answer?0.5:1}}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

function SimpleAdd({ activity, onDone, onWrong }) {
  const { a, b, object, who } = activity;
  const tot = a + b;
  const [ans, setAns] = useState(null);
  const opts = useRef([tot-1, tot, tot+1, tot+2].filter(n => n>0).sort(()=>0.5-Math.random()).slice(0,4)).current;
  const objName = object==='tapita' ? 'tapitas' : object==='grape' ? 'uvas' : 'soles';
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>{who ? `${who} tenía ${a} ${objName} y le regalaron ${b} más. ¿Cuántas tiene ahora?` : `¿Cuánto es ${a} más ${b}?`}</SpeechBubbleAuto>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:6,margin:'16px 0',flexWrap:'wrap'}}>
        <Basket count={a} object={object} />
        <div style={{fontSize:32,color:'#B84A00',fontWeight:700}}>+</div>
        <Basket count={b} object={object} />
      </div>
      <div style={{fontSize:28,fontWeight:700,color:'#7B3F00',margin:'10px 0'}}>{a} + {b} = ?</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {opts.map(n => {
          const r = ans===n && n===tot, w = ans===n && n!==tot;
          return (
            <button key={n} onClick={() => {
              setAns(n);
              if (n===tot) { audio.correct(); audio.speak(`¡Correcto! ${a} más ${b} son ${tot}`); setTimeout(onDone, 1500); }
              else { audio.wrong(); if(onWrong) onWrong(); setTimeout(() => setAns(null), 700); }
            }} style={{padding:'14px 0',borderRadius:14,fontSize:22,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'none',animation: w?'shake 0.4s':'none'}}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

function SimpleSub({ activity, onDone, onWrong }) {
  const { a, b, object, who } = activity;
  const tot = a - b;
  const [ans, setAns] = useState(null);
  const opts = useRef([tot-1, tot, tot+1, tot+2].filter(n => n>=0).sort(()=>0.5-Math.random()).slice(0,4)).current;
  const objName = object==='tapita' ? 'tapitas' : object==='grape' ? 'uvas' : 'soles';
  const subject = who || 'Cuyín';
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>{subject} tenía {a} {objName} y se fueron {b}. ¿Cuántas quedan?</SpeechBubbleAuto>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:4,margin:'16px 0',flexWrap:'wrap'}}>
        {[...Array(a)].map((_,i) => (
          <div key={i} style={{opacity: i<b?0.2:1,transform: i<b?'scale(0.7) rotate(-20deg)':'scale(1)',transition:'all 0.3s'}}>
            <ObjectIcon type={object} size={32} />
          </div>
        ))}
      </div>
      <div style={{fontSize:28,fontWeight:700,color:'#7B3F00',margin:'10px 0'}}>{a} - {b} = ?</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {opts.map(n => {
          const r = ans===n && n===tot, w = ans===n && n!==tot;
          return (
            <button key={n} onClick={() => {
              setAns(n);
              if (n===tot) { audio.correct(); audio.speak(`¡Bien! Quedan ${tot}`); setTimeout(onDone, 1300); }
              else { audio.wrong(); if(onWrong) onWrong(); setTimeout(() => setAns(null), 700); }
            }} style={{padding:'14px 0',borderRadius:14,fontSize:22,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'none',animation: w?'shake 0.4s':'none'}}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

function WordMatch({ activity, onDone, onWrong }) {
  const [ans, setAns] = useState(null);
  const shuffled = useRef([...activity.options].sort(()=>0.5-Math.random())).current;
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Mirá el dibujo y buscá la palabra <b>{activity.word}</b></SpeechBubbleAuto>
      <div style={{margin:'20px auto',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <button onClick={() => audio.speak(activity.word, {rate:0.6})} style={{background:'#FFE4B5',border:'3px solid #FFB84D',borderRadius:24,padding:14,cursor:'pointer'}}>
          <MatchImage type={activity.image} />
        </button>
        <div style={{marginTop:8,fontSize:22,fontWeight:700,color:'#B84A00',letterSpacing:3}}>{activity.word}</div>
        <div style={{fontSize:11,color:'#7B3F00',marginTop:2}}>🔊 tocá el dibujo para escuchar</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {shuffled.map(opt => {
          const r = ans===opt && opt===activity.word, w = ans===opt && opt!==activity.word;
          return (
            <button key={opt} onClick={() => {
              setAns(opt); audio.speak(opt, {rate:0.65});
              if (opt===activity.word) { setTimeout(() => { audio.correct(); audio.speak(`¡Muy bien! Es ${activity.word}`, {rate:0.7}); }, 600); setTimeout(onDone, 1900); }
              else { setTimeout(() => { audio.wrong(); if(onWrong) onWrong(); setAns(null); }, 700); }
            }} style={{padding:'16px',borderRadius:14,fontSize:22,fontWeight:700,letterSpacing:2,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'none',animation: w?'shake 0.4s':'none'}}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

function VictoryScreen({ lesson, uvitasEarned, playerName, onContinue, equipped }) {
  useEffect(() => {
    audio.coin(); setTimeout(() => audio.coin(), 200); setTimeout(() => audio.coin(), 400);
    setTimeout(() => audio.speak(`¡Terminaste ${playerName}! Ganaste ${uvitasEarned} uvitas`), 700);
  }, []);
  return (
    <div style={{textAlign:'center',padding:10,position:'relative'}}>
      <Confetti />
      <div style={{fontSize:24,fontWeight:700,color:'#B84A00',marginTop:10}}>¡Terminaste, {playerName}!</div>
      <div style={{fontSize:15,color:'#7B3F00',marginTop:4}}>{lesson.name}</div>
      <div style={{margin:'16px 0'}}><CuyinDressed equipped={equipped} size={140} /></div>
      <div style={{background:'#FFE4B5',border:'3px solid #FFB84D',borderRadius:20,padding:14,marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontWeight:700,color:'#7B3F00'}}>Uvitas ganadas</span>
          <div style={{display:'flex',alignItems:'center',gap:4}}><Grape small /><span style={{fontSize:24,fontWeight:700,color:'#B84A00'}}>+{uvitasEarned}</span></div>
        </div>
        <div style={{fontSize:13,color:'#7B3F00'}}>Podés gastarlas en la tienda 🛍️</div>
      </div>
      <button className="btn-primary" onClick={onContinue}>Seguir →</button>
    </div>
  );
}

function Confetti() {
  const ps = [...Array(15)].map((_,i) => ({id:i,left:Math.random()*100,delay:Math.random()*2,color:['#FFD700','#B84A00','#7B3F00','#FFB84D','#4CAF50'][i%5]}));
  return <>{ps.map(p => <div key={p.id} style={{position:'absolute',width:8,height:8,background:p.color,top:-10,left:`${p.left}%`,animation:`fall 3s linear ${p.delay}s infinite`}} />)}</>;
}

function ShopScreen({ uvitas, equipped, owned, onBuy, onEquip }) {
  const [cat, setCat] = useState('hat');
  const items = SHOP_ITEMS[cat];
  return (
    <div>
      <SpeechBubbleAuto delay={200}>¡Mirá qué lindas cosas! Compralas con tus uvitas.</SpeechBubbleAuto>
      <div style={{textAlign:'center',margin:'10px 0'}}><div style={{fontSize:22,fontWeight:700,color:'#B84A00'}}>Tienda de Cuyín</div></div>
      <div style={{background:'linear-gradient(180deg,#FDE8C9 0%,#FBD9A0 100%)',borderRadius:20,marginBottom:12,position:'relative',overflow:'hidden',height:190,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:25,background:'#C89568'}} />
        <CuyinDressed equipped={equipped} size={160} />
      </div>
      <div style={{display:'flex',gap:4,marginBottom:10}}>
        {['hat','poncho','pet','toy'].map(c => (
          <button key={c} onClick={() => { audio.tap(); setCat(c); }} style={{flex:1,padding:'9px 2px',borderRadius:12,fontSize:11,fontWeight:700,background: cat===c?'#7B3F00':'#FFE4B5',color: cat===c?'white':'#7B3F00',border:'none'}}>{c==='hat'?'Sombreros':c==='poncho'?'Ropa':c==='pet'?'Amigos':'Juguetes'}</button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {items.map(item => {
          const o = owned.includes(item.id), e = equipped[item.slot]===item.id, af = uvitas>=item.price;
          return (
            <div key={item.id} style={{background: e?'#FFD700':o?'#FFE4B5':'#FFF8ED',border: e?'3px solid #B84A00':o?'2px solid #FFB84D':'2px solid #E0D5C0',borderRadius:16,padding:12,display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:52,height:52,borderRadius:12,background:'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <ItemPreview item={item} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:'#7B3F00'}}>{item.name}</div>
                {!o && <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4}}><Grape small /><span style={{fontSize:14,fontWeight:700,color: af?'#B84A00':'#CC0000'}}>{item.price}</span></div>}
                {o && !e && <div style={{fontSize:11,color:'#4CAF50',marginTop:4}}>✓ Ya lo tenés</div>}
                {e && <div style={{fontSize:11,fontWeight:700,color:'#B84A00',marginTop:4}}>⭐ En uso</div>}
              </div>
              {!o ? (
                <button onClick={() => onBuy(item)} disabled={!af} style={{padding:'10px 14px',borderRadius:12,fontWeight:700,fontSize:13,color:'white',background: af?'#FF9147':'#CCC',border:'none',boxShadow: af?'0 3px 0 #B84A00':'none',opacity: af?1:0.5}}>Comprar</button>
              ) : (
                <button onClick={() => onEquip(item)} style={{padding:'10px 14px',borderRadius:12,fontWeight:700,fontSize:13,color:'white',background: e?'#B84A00':'#4CAF50',border:'none'}}>{e?'Sacar':'Poner'}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpeechBubbleAuto({ children, delay=400 }) {
  useEffect(() => {
    const text = extractText(children);
    if (text) {
      const t = setTimeout(() => audio.speak(text), delay);
      return () => clearTimeout(t);
    }
  }, []);
  return (
    <div style={{position:'relative',background:'#FFFFFF',border:'3px solid #FFB84D',borderRadius:20,padding:'12px 16px',color:'#7B3F00',fontSize:15,textAlign:'center',lineHeight:1.3}}>
      {children}
      <div style={{position:'absolute',width:14,height:14,background:'#FFFFFF',border:'3px solid #FFB84D',borderTop:'none',borderLeft:'none',bottom:-9,left:'50%',marginLeft:-7,transform:'rotate(45deg)'}} />
    </div>
  );
}

function Basket({ count, object }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:2,padding:6,background:'#C68B5B',borderRadius:'12px 12px 4px 4px',minWidth:70,minHeight:60}}>
        {[...Array(count)].map((_,i) => <ObjectIcon key={i} type={object} size={22} />)}
      </div>
      <div style={{width:82,height:8,background:'#8B5A2B',borderRadius:'0 0 6px 6px'}} />
    </div>
  );
}

function ObjectIcon({ type, size=30 }) {
  if (type==='grape') return <Grape size={size} />;
  if (type==='sun') return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="10" fill="#FFB84D" />
      {[0,45,90,135,180,225,270,315].map(a => (
        <line key={a} x1={20+14*Math.cos(a*Math.PI/180)} y1={20+14*Math.sin(a*Math.PI/180)} x2={20+18*Math.cos(a*Math.PI/180)} y2={20+18*Math.sin(a*Math.PI/180)} stroke="#FFB84D" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
  if (type==='tapita') return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="14" fill="#D64A2C" stroke="#8B2015" strokeWidth="2" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#F08060" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="20" cy="20" r="4" fill="#8B2015" />
    </svg>
  );
  return null;
}

function Die({ number, size=100 }) {
  const dots = {
    1: [[50,50]],
    2: [[30,30],[70,70]],
    3: [[30,30],[50,50],[70,70]],
    4: [[30,30],[70,30],[30,70],[70,70]],
    5: [[30,30],[70,30],[50,50],[30,70],[70,70]],
    6: [[30,25],[70,25],[30,50],[70,50],[30,75],[70,75]],
  }[number] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="8" y="8" width="84" height="84" rx="14" fill="white" stroke="#2D2620" strokeWidth="3" />
      {dots.map((d,i) => <circle key={i} cx={d[0]} cy={d[1]} r="8" fill="#2D2620" />)}
    </svg>
  );
}

function DiceRoll({ activity, onDone, onWrong }) {
  const { target } = activity;
  const [rolling, setRolling] = useState(false);
  const [shown, setShown] = useState(null);
  const [ans, setAns] = useState(null);
  const opts = useRef([target-1, target, target+1, target+2].filter(n => n>=1 && n<=6).sort(()=>0.5-Math.random()).slice(0,4)).current;

  const roll = () => {
    if (rolling || shown) return;
    setRolling(true);
    audio.tap();
    let count = 0;
    const iv = setInterval(() => {
      setShown(Math.floor(Math.random()*6)+1);
      count++;
      if (count > 8) {
        clearInterval(iv);
        setShown(target);
        setRolling(false);
        audio.speak(`Salió ${target}`, {rate:0.9});
      }
    }, 80);
  };

  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Cuyín tira el dado. ¡Tocá el dado!</SpeechBubbleAuto>
      <div style={{margin:'20px 0'}}>
        <button onClick={roll} disabled={rolling || shown!==null} style={{background:'transparent',border:'none',cursor: (rolling||shown!==null)?'default':'pointer'}}>
          {shown === null ? <Die number={1} size={140} /> : <Die number={shown} size={140} />}
        </button>
      </div>
      {shown !== null && !rolling && (
        <>
          <div style={{fontSize:16,fontWeight:700,color:'#7B3F00',marginBottom:8}}>¿Qué número salió?</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {opts.map(n => {
              const r = ans===n && n===target, w = ans===n && n!==target;
              return (
                <button key={n} onClick={() => {
                  setAns(n);
                  if (n===target) { audio.correct(); audio.speak('¡Muy bien!'); setTimeout(onDone, 1000); }
                  else { audio.wrong(); if(onWrong) onWrong(); setTimeout(() => setAns(null), 700); }
                }} style={{padding:'16px 0',borderRadius:14,fontSize:26,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'none',animation: w?'shake 0.4s':'none'}}>{n}</button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SumsToTen({ activity, onDone, onWrong }) {
  const { a } = activity;
  const missing = 10 - a;
  const [ans, setAns] = useState(null);
  const opts = useRef([missing-1, missing, missing+1, missing+2].filter(n => n>0 && n<=10).sort(()=>0.5-Math.random()).slice(0,4)).current;
  return (
    <div style={{textAlign:'center'}}>
      <SpeechBubbleAuto>Pedro tiene un <b>{a}</b>. ¿Qué carta le falta para que su suma dé <b>10</b>?</SpeechBubbleAuto>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12,margin:'20px 0'}}>
        <div style={{width:80,height:110,borderRadius:14,background:'#FFF8ED',border:'3px solid #B84A00',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,fontWeight:700,color:'#B84A00',boxShadow:'0 4px 8px rgba(0,0,0,0.15)'}}>{a}</div>
        <div style={{fontSize:32,color:'#B84A00',fontWeight:700}}>+</div>
        <div style={{width:80,height:110,borderRadius:14,background:'#FFE4B5',border:'3px dashed #FFB84D',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'#7B3F00'}}>?</div>
        <div style={{fontSize:32,color:'#B84A00',fontWeight:700}}>= 10</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {opts.map(n => {
          const r = ans===n && n===missing, w = ans===n && n!==missing;
          return (
            <button key={n} onClick={() => {
              setAns(n);
              if (n===missing) { audio.correct(); audio.speak(`¡Muy bien! ${a} más ${missing} son 10`); setTimeout(onDone, 1500); }
              else { audio.wrong(); if(onWrong) onWrong(); setTimeout(() => setAns(null), 700); }
            }} style={{padding:'14px 0',borderRadius:14,fontSize:22,fontWeight:700,background: r?'linear-gradient(135deg,#7FD858,#4CAF50)':w?'#FFCCCC':'#FFE4B5',color: r?'white':'#7B3F00',border:'none',animation: w?'shake 0.4s':'none'}}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

// NUEVOS: los 5 objetos de referencia del libro
function RefObject({ type, size=80 }) {
  const s = size;
  if (type==='anillo') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <ellipse cx="50" cy="70" rx="28" ry="12" fill="none" stroke="#FFD700" strokeWidth="8" />
      <polygon points="50,25 42,45 58,45" fill="#B8E4F5" stroke="#5D9EC7" strokeWidth="2" />
      <polygon points="50,25 42,45 50,42" fill="#DDF2FA" />
    </svg>
  );
  if (type==='escarapela') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <circle cx="50" cy="45" r="28" fill="#B8D4E8" stroke="#5D9EC7" strokeWidth="2" />
      <circle cx="50" cy="45" r="20" fill="white" />
      <circle cx="50" cy="45" r="12" fill="#B8D4E8" />
      <path d="M 35 65 L 30 90 L 50 78 L 70 90 L 65 65 Z" fill="#5D9EC7" />
      <path d="M 45 65 L 40 88 L 50 82 Z" fill="white" />
      <path d="M 55 65 L 60 88 L 50 82 Z" fill="white" />
    </svg>
  );
  if (type==='iguana') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <ellipse cx="55" cy="60" rx="30" ry="12" fill="#5D8233" />
      <ellipse cx="80" cy="50" rx="14" ry="10" fill="#7DA240" />
      <circle cx="85" cy="47" r="2" fill="#000" />
      <path d="M 45 50 L 30 30 L 40 55" fill="#5D8233" />
      <path d="M 25 60 L 10 55 L 25 68" fill="#5D8233" />
      <ellipse cx="45" cy="72" rx="5" ry="3" fill="#4A6D28" />
      <ellipse cx="65" cy="72" rx="5" ry="3" fill="#4A6D28" />
    </svg>
  );
  if (type==='ojota') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <ellipse cx="50" cy="65" rx="30" ry="18" fill="#D64A2C" />
      <ellipse cx="50" cy="65" rx="24" ry="12" fill="#F08060" />
      <path d="M 50 30 L 40 55" stroke="#7B3F00" strokeWidth="4" strokeLinecap="round" />
      <path d="M 50 30 L 60 55" stroke="#7B3F00" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="65" r="4" fill="#7B3F00" />
    </svg>
  );
  if (type==='ukelele') return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <ellipse cx="50" cy="65" rx="22" ry="25" fill="#D8A870" stroke="#8B5A2B" strokeWidth="2" />
      <circle cx="50" cy="65" r="6" fill="#5D4030" />
      <rect x="46" y="25" width="8" height="35" fill="#8B5A2B" />
      <rect x="42" y="15" width="16" height="12" fill="#5D4030" rx="2" />
      <line x1="47" y1="30" x2="47" y2="85" stroke="#2D2620" strokeWidth="0.8" />
      <line x1="49" y1="30" x2="49" y2="85" stroke="#2D2620" strokeWidth="0.8" />
      <line x1="51" y1="30" x2="51" y2="85" stroke="#2D2620" strokeWidth="0.8" />
      <line x1="53" y1="30" x2="53" y2="85" stroke="#2D2620" strokeWidth="0.8" />
    </svg>
  );
  return null;
}

function MatchImage({ type }) {
  if (type==='heart') return <svg width="80" height="80" viewBox="0 0 100 100"><path d="M 50 85 Q 15 55 15 35 A 20 20 0 0 1 50 25 A 20 20 0 0 1 85 35 Q 85 55 50 85 Z" fill="#E85D8F" /></svg>;
  if (type==='gaucho') return <svg width="80" height="80" viewBox="0 0 100 100"><ellipse cx="50" cy="45" rx="22" ry="20" fill="#E8BC8A" /><ellipse cx="50" cy="26" rx="30" ry="6" fill="#2D2620" /><ellipse cx="50" cy="20" rx="20" ry="10" fill="#2D2620" /><path d="M 40 55 Q 50 60 60 55" stroke="#8B7355" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M 30 65 L 70 65 L 75 90 L 25 90 Z" fill="#B8332F" /></svg>;
  if (type==='foca') return <svg width="90" height="70" viewBox="0 0 100 80"><ellipse cx="50" cy="50" rx="35" ry="20" fill="#666" /><ellipse cx="75" cy="35" rx="18" ry="15" fill="#666" /><circle cx="82" cy="32" r="2" fill="#000" /><ellipse cx="87" cy="38" rx="3" ry="2" fill="#333" /><path d="M 15 55 Q 5 60 10 65" stroke="#666" strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M 40 65 L 30 78 L 50 72 Z" fill="#666" /></svg>;
  if (type==='sun') return <svg width="80" height="80" viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="#FFB84D" />{[0,45,90,135,180,225,270,315].map(a=>(<line key={a} x1={50+34*Math.cos(a*Math.PI/180)} y1={50+34*Math.sin(a*Math.PI/180)} x2={50+45*Math.cos(a*Math.PI/180)} y2={50+45*Math.sin(a*Math.PI/180)} stroke="#FFB84D" strokeWidth="5" strokeLinecap="round"/>))}</svg>;
  if (type==='luna') return <svg width="80" height="80" viewBox="0 0 100 100"><path d="M 55 15 A 35 35 0 1 0 55 85 A 25 25 0 1 1 55 15 Z" fill="#F5E6A8" /></svg>;
  if (type==='tomate') return <svg width="80" height="80" viewBox="0 0 100 100"><circle cx="50" cy="55" r="30" fill="#D64A2C" /><path d="M 42 25 L 50 30 L 58 25 L 55 32 L 50 30 L 45 32 Z" fill="#5D8233" /></svg>;
  if (type==='dedo') return <svg width="80" height="80" viewBox="0 0 100 100"><rect x="40" y="20" width="20" height="55" rx="10" fill="#E8BC8A" /><ellipse cx="50" cy="25" rx="10" ry="6" fill="#F4CBA5" /></svg>;
  if (type==='nido') return <svg width="90" height="70" viewBox="0 0 100 80"><ellipse cx="50" cy="55" rx="40" ry="15" fill="#8B6F47" /><ellipse cx="50" cy="50" rx="30" ry="10" fill="#6B4F27" /><circle cx="42" cy="45" r="6" fill="#F4CBA5" /><circle cx="52" cy="43" r="6" fill="#F4CBA5" /><circle cx="60" cy="46" r="6" fill="#F4CBA5" /></svg>;
  if (type==='boca') return <svg width="80" height="80" viewBox="0 0 100 100"><path d="M 20 50 Q 50 75 80 50 Q 50 60 20 50 Z" fill="#D64A6B" /><path d="M 20 50 Q 50 30 80 50" stroke="#B8332F" strokeWidth="2" fill="none" /></svg>;
  if (type==='pera') return <svg width="60" height="80" viewBox="0 0 60 90"><path d="M 30 15 L 30 25" stroke="#5D4030" strokeWidth="3" /><path d="M 30 25 Q 45 30 45 55 A 15 25 0 1 1 15 55 Q 15 30 30 25 Z" fill="#C4D858" /></svg>;
  if (type==='toro') return <svg width="90" height="80" viewBox="0 0 100 90"><ellipse cx="50" cy="55" rx="35" ry="22" fill="#6B4423" /><ellipse cx="50" cy="35" rx="20" ry="18" fill="#8B5A33" /><path d="M 32 25 L 25 15 L 35 22 Z" fill="#5D4030" /><path d="M 68 25 L 75 15 L 65 22 Z" fill="#5D4030" /><circle cx="42" cy="35" r="2" fill="#000" /><circle cx="58" cy="35" r="2" fill="#000" /></svg>;
  if (type==='perro') return <svg width="90" height="80" viewBox="0 0 100 90"><ellipse cx="50" cy="55" rx="30" ry="20" fill="#B8823C" /><ellipse cx="70" cy="45" rx="18" ry="15" fill="#B8823C" /><ellipse cx="63" cy="35" rx="6" ry="10" fill="#8B5A2B" /><circle cx="75" cy="42" r="2" fill="#000" /><ellipse cx="82" cy="47" rx="3" ry="2" fill="#000" /></svg>;
  if (type==='carro') return <svg width="90" height="70" viewBox="0 0 100 70"><rect x="10" y="25" width="80" height="25" fill="#D64A2C" rx="4" /><path d="M 20 25 L 30 10 L 65 10 L 75 25" fill="#B8332F" /><rect x="32" y="13" width="15" height="10" fill="#B8E4F5" /><rect x="50" y="13" width="15" height="10" fill="#B8E4F5" /><circle cx="25" cy="55" r="10" fill="#2D2620" /><circle cx="75" cy="55" r="10" fill="#2D2620" /></svg>;
  if (type==='vaca') return <svg width="90" height="80" viewBox="0 0 100 90"><ellipse cx="50" cy="55" rx="35" ry="22" fill="white" stroke="#000" strokeWidth="1.5" /><ellipse cx="35" cy="50" rx="8" ry="6" fill="#000" /><ellipse cx="65" cy="60" rx="6" ry="5" fill="#000" /><ellipse cx="50" cy="30" rx="18" ry="15" fill="white" stroke="#000" strokeWidth="1.5" /><path d="M 34 20 L 30 10 L 38 18 Z" fill="#D8A87A" /><path d="M 66 20 L 70 10 L 62 18 Z" fill="#D8A87A" /><circle cx="43" cy="32" r="2" fill="#000" /><circle cx="57" cy="32" r="2" fill="#000" /></svg>;
  if (type==='yoyo') return <svg width="80" height="80" viewBox="0 0 100 100"><line x1="50" y1="10" x2="50" y2="35" stroke="#5D4030" strokeWidth="2" /><circle cx="50" cy="55" r="35" fill="#D64A2C" /><circle cx="50" cy="55" r="25" fill="#B8332F" /><circle cx="50" cy="55" r="8" fill="#5D4030" /></svg>;
  if (type==='rayo') return <svg width="60" height="90" viewBox="0 0 60 90"><path d="M 30 5 L 15 45 L 30 45 L 20 85 L 45 40 L 30 40 L 40 5 Z" fill="#FFD700" stroke="#B87F00" strokeWidth="2" /></svg>;
  return null;
}

function CuyinDressed({ equipped={}, size=160, mood='happy' }) {
  return (
    <svg width={size} height={size*1.05} viewBox="0 0 200 220" style={{filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'}}>
      {equipped.pet==='condor' && <Condor x={155} y={45} />}
      {equipped.pet==='fox' && <Fox x={155} y={165} />}
      {equipped.pet==='frog' && <Frog x={160} y={170} />}
      {equipped.pet==='owl' && <Owl x={155} y={50} />}
      {equipped.pet==='vizcacha' && <Vizcacha x={155} y={160} />}

      <ellipse cx="55" cy="145" rx="12" ry="8" fill="#D4A574" transform="rotate(-20 55 145)"/>
      <ellipse cx="42" cy="135" rx="8" ry="6" fill="#D4A574"/>
      <path d="M 42 132 Q 30 118 22 128" stroke="#D4A574" fill="none" strokeWidth="7" strokeLinecap="round"/>
      <ellipse cx="20" cy="126" rx="6" ry="5" fill="#C89568"/>

      <path d="M 145 150 Q 158 138 152 158" stroke="#C89568" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <ellipse cx="100" cy="160" rx="48" ry="36" fill="#D4A574"/>
      <ellipse cx="100" cy="155" rx="20" ry="12" fill="#F4CBA5" opacity="0.4"/>
      <rect x="72" y="185" width="14" height="28" fill="#C89568" rx="5"/>
      <rect x="114" y="185" width="14" height="28" fill="#C89568" rx="5"/>
      <ellipse cx="79" cy="213" rx="9" ry="4" fill="#8B5A2B"/>
      <ellipse cx="121" cy="213" rx="9" ry="4" fill="#8B5A2B"/>

      {equipped.poncho==='redPoncho' && (<><path d="M 60 130 L 140 130 L 150 180 L 50 180 Z" fill="#B8332F"/><line x1="55" y1="155" x2="145" y2="155" stroke="#F4CBA5" strokeWidth="2"/></>)}
      {equipped.poncho==='pampaPoncho' && (<><path d="M 60 130 L 140 130 L 150 180 L 50 180 Z" fill="#8B7355"/><line x1="55" y1="145" x2="145" y2="145" stroke="#B8332F" strokeWidth="3"/></>)}
      {equipped.poncho==='blueVest' && (<><path d="M 70 128 L 130 128 L 135 175 L 65 175 Z" fill="#5D9EC7"/><line x1="100" y1="128" x2="100" y2="175" stroke="#B8E4F5" strokeWidth="2"/></>)}
      {equipped.poncho==='heroCape' && (<><path d="M 70 125 L 130 125 L 145 195 L 55 195 Z" fill="#FFD700" opacity="0.85"/><circle cx="100" cy="150" r="8" fill="#B84A00"/></>)}

      <ellipse cx="100" cy="115" rx="22" ry="38" fill="#D4A574"/>
      <ellipse cx="100" cy="78" rx="34" ry="32" fill="#D4A574"/>

      <ellipse cx="78" cy="48" rx="9" ry="18" fill="#D4A574" transform="rotate(-15 78 48)"/>
      <ellipse cx="78" cy="40" rx="6" ry="8" fill="#E8BC8A" transform="rotate(-15 78 40)"/>
      <ellipse cx="122" cy="48" rx="9" ry="18" fill="#D4A574" transform="rotate(15 122 48)"/>
      <ellipse cx="122" cy="40" rx="6" ry="8" fill="#E8BC8A" transform="rotate(15 122 40)"/>

      <ellipse cx="100" cy="92" rx="20" ry="16" fill="#F4CBA5"/>

      <ellipse cx="86" cy="74" rx="9" ry="10" fill="white"/>
      <circle cx="88" cy="74" r="6.5" fill="#2D2620"/>
      <circle cx="90" cy="72" r="2.5" fill="white"/>
      <circle cx="86" cy="76" r="1" fill="white" opacity="0.5"/>
      <ellipse cx="114" cy="74" rx="9" ry="10" fill="white"/>
      <circle cx="112" cy="74" r="6.5" fill="#2D2620"/>
      <circle cx="114" cy="72" r="2.5" fill="white"/>
      <circle cx="110" cy="76" r="1" fill="white" opacity="0.5"/>

      <ellipse cx="74" cy="90" rx="10" ry="6" fill="#E89B9B" opacity="0.6"/>
      <ellipse cx="126" cy="90" rx="10" ry="6" fill="#E89B9B" opacity="0.6"/>

      <ellipse cx="100" cy="88" rx="5" ry="3.5" fill="#C89568"/>
      <ellipse cx="100" cy="87" rx="3" ry="2" fill="#2D2620"/>

      {mood==='happy' && <><path d="M 88 98 Q 100 110 112 98" stroke="#2D2620" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 92 100 Q 100 107 108 100" fill="#E85D8F" opacity="0.4"/></>}
      {mood==='celebrate' && <><path d="M 86 96 Q 100 112 114 96" stroke="#2D2620" strokeWidth="2.5" fill="#E85D8F" opacity="0.6" strokeLinecap="round"/></>}
      {mood==='think' && <><path d="M 92 102 Q 100 98 108 102" stroke="#2D2620" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 82 66 L 86 70 M 114 66 L 118 70" stroke="#2D2620" strokeWidth="1.5" strokeLinecap="round"/></>}
      {mood==='sad' && <><path d="M 92 104 Q 100 98 108 104" stroke="#2D2620" strokeWidth="2" fill="none" strokeLinecap="round"/></>}
      {mood==='surprise' && <><ellipse cx="100" cy="102" rx="6" ry="5" fill="#2D2620"/><ellipse cx="100" cy="101" rx="4" ry="3" fill="#E85D8F" opacity="0.5"/></>}

      {equipped.hat==='gauchoHat' && (<><ellipse cx="100" cy="42" rx="50" ry="8" fill="#2D2620"/><ellipse cx="100" cy="35" rx="28" ry="15" fill="#2D2620"/></>)}
      {equipped.hat==='redBeret' && (<><ellipse cx="100" cy="42" rx="35" ry="12" fill="#B8332F"/><ellipse cx="100" cy="39" rx="30" ry="8" fill="#D64A47"/><circle cx="100" cy="34" r="4" fill="#2D2620"/></>)}
      {equipped.hat==='andeanCap' && (<><ellipse cx="100" cy="42" rx="33" ry="12" fill="#B8332F"/><path d="M 67 42 Q 62 55 65 68 L 75 65 Q 72 55 75 45 Z" fill="#B8332F"/><path d="M 133 42 Q 138 55 135 68 L 125 65 Q 128 55 125 45 Z" fill="#B8332F"/><ellipse cx="100" cy="35" rx="28" ry="8" fill="#F4A62A"/></>)}
      {equipped.hat==='crown' && (<><rect x="75" y="30" width="50" height="18" rx="2" fill="#FFD700" stroke="#B87F00" strokeWidth="1"/><polygon points="80,30 85,20 90,30" fill="#FFD700" stroke="#B87F00" strokeWidth="1"/><polygon points="95,30 100,18 105,30" fill="#FFD700" stroke="#B87F00" strokeWidth="1"/><polygon points="110,30 115,20 120,30" fill="#FFD700" stroke="#B87F00" strokeWidth="1"/><circle cx="100" cy="36" r="3" fill="#E85D8F"/></>)}
      {equipped.hat==='wizardHat' && (<><path d="M 70 48 Q 100 -10 130 48" fill="#5D9EC7"/><circle cx="100" cy="8" r="5" fill="white"/><ellipse cx="100" cy="48" rx="35" ry="6" fill="#5D9EC7"/></>)}
      {equipped.hat==='explorerHelmet' && (<><ellipse cx="100" cy="42" rx="36" ry="14" fill="#7DA240"/><ellipse cx="100" cy="36" rx="30" ry="10" fill="#5D8233"/><rect x="90" y="28" width="20" height="10" fill="#7DA240" rx="2"/></>)}

      {equipped.toy==='balloons' && (<><circle cx="155" cy="30" r="10" fill="#E85D8F" opacity="0.8"/><circle cx="170" cy="25" r="10" fill="#FFD700" opacity="0.8"/><circle cx="162" cy="15" r="10" fill="#5D9EC7" opacity="0.8"/><line x1="160" y1="35" x2="155" y2="60" stroke="#999" strokeWidth="0.8"/></>)}
      {equipped.toy==='star' && (<><polygon points="35,30 38,22 44,22 39,17 41,10 35,14 29,10 31,17 26,22 32,22" fill="#FFD700" stroke="#B87F00" strokeWidth="0.5"><animateTransform attributeName="transform" type="rotate" values="0 35 20;15 35 20;0 35 20;-15 35 20;0 35 20" dur="3s" repeatCount="indefinite"/></polygon></>)}
      {equipped.toy==='chest' && (<><rect x="145" y="185" width="22" height="16" rx="2" fill="#D64A2C"/><rect x="148" y="189" width="16" height="8" rx="1" fill="#F08060"/><circle cx="156" cy="183" r="3" fill="#FFD700"/></>)}
    </svg>
  );
}

function Condor({ x, y }) {
  return (<g transform={`translate(${x}, ${y})`}><ellipse cx="0" cy="0" rx="18" ry="10" fill="#2D2620"/><path d="M -22 -4 Q -14 -18 -4 -4" fill="#2D2620"/><path d="M 4 -4 Q 14 -18 22 -4" fill="#2D2620"/><circle cx="-6" cy="-3" r="5" fill="#F4CBA5"/><circle cx="-7" cy="-3" r="1.5" fill="#2D2620"/></g>);
}
function Fox({ x, y }) {
  return (<g transform={`translate(${x}, ${y})`}><ellipse cx="0" cy="6" rx="16" ry="9" fill="#D4693A"/><path d="M -10 -4 L -5 -15 L 0 0 Z" fill="#D4693A"/><path d="M 10 -4 L 5 -15 L 0 0 Z" fill="#D4693A"/><circle cx="-4" cy="0" r="1.5" fill="#2D2620"/><circle cx="4" cy="0" r="1.5" fill="#2D2620"/><path d="M -2 4 Q 0 6 2 4" stroke="#2D2620" strokeWidth="0.8" fill="none"/></g>);
}
function Frog({ x, y }) {
  return (<g transform={`translate(${x}, ${y})`}><circle cx="0" cy="0" rx="12" ry="10" fill="#7DA240"/><circle cx="-5" cy="-5" r="3" fill="#2D2620"/><circle cx="5" cy="-5" r="3" fill="#2D2620"/><circle cx="-4" cy="-6" r="1" fill="white"/><circle cx="6" cy="-6" r="1" fill="white"/><path d="M -3 3 Q 0 6 3 3" stroke="#2D2620" strokeWidth="1" fill="none"/></g>);
}
function Owl({ x, y }) {
  return (<g transform={`translate(${x}, ${y})`}><ellipse cx="0" cy="5" rx="14" ry="10" fill="#8B5A2B"/><ellipse cx="0" cy="-2" rx="11" ry="9" fill="#A0724A"/><circle cx="-5" cy="-3" r="4" fill="white"/><circle cx="5" cy="-3" r="4" fill="white"/><circle cx="-5" cy="-3" r="2" fill="#2D2620"/><circle cx="5" cy="-3" r="2" fill="#2D2620"/><polygon points="0,1 -2,4 2,4" fill="#D4693A"/><path d="M -8 -8 L -5 -4 M 8 -8 L 5 -4" stroke="#A0724A" strokeWidth="2"/></g>);
}
function Vizcacha({ x, y }) {
  return (<g transform={`translate(${x}, ${y})`}><ellipse cx="0" cy="5" rx="12" ry="8" fill="#D4A574"/><ellipse cx="0" cy="-3" rx="9" ry="8" fill="#E8BC8A"/><circle cx="-4" cy="-4" r="2" fill="#2D2620"/><circle cx="4" cy="-4" r="2" fill="#2D2620"/><ellipse cx="0" cy="0" rx="2.5" ry="1.5" fill="#C89568"/><path d="M -6 -10 Q -8 -18 -4 -15 M 6 -10 Q 8 -18 4 -15" stroke="#E8BC8A" strokeWidth="2" fill="none"/></g>);
}

function Grape({ small=false, size }) {
  const s = size || (small?18:30);
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
  const svgs = {
    gauchoHat: <><ellipse cx="20" cy="26" rx="18" ry="4" fill="#2D2620"/><ellipse cx="20" cy="20" rx="10" ry="8" fill="#2D2620"/></>,
    redBeret: <><ellipse cx="20" cy="24" rx="15" ry="7" fill="#B8332F"/><ellipse cx="20" cy="20" rx="13" ry="5" fill="#D64A47"/><circle cx="20" cy="15" r="2" fill="#2D2620"/></>,
    andeanCap: <><ellipse cx="20" cy="24" rx="15" ry="7" fill="#B8332F"/><ellipse cx="20" cy="18" rx="12" ry="4" fill="#F4A62A"/></>,
    crown: <><rect x="8" y="18" width="24" height="12" rx="2" fill="#FFD700" stroke="#B87F00" strokeWidth="0.8"/><polygon points="12,18 15,10 18,18" fill="#FFD700"/><polygon points="18,18 20,8 22,18" fill="#FFD700"/><polygon points="24,18 27,10 30,18" fill="#FFD700"/><circle cx="20" cy="22" r="2" fill="#E85D8F"/></>,
    wizardHat: <><path d="M8 30 Q20 2 32 30" fill="#5D9EC7"/><circle cx="20" cy="8" r="3" fill="white"/><ellipse cx="20" cy="30" rx="14" ry="4" fill="#5D9EC7"/></>,
    explorerHelmet: <><ellipse cx="20" cy="24" rx="16" ry="8" fill="#7DA240"/><ellipse cx="20" cy="20" rx="14" ry="6" fill="#5D8233"/></>,
    redPoncho: <><path d="M10 12 L30 12 L34 32 L6 32 Z" fill="#B8332F"/><line x1="7" y1="22" x2="33" y2="22" stroke="#F4CBA5" strokeWidth="1.5"/></>,
    pampaPoncho: <><path d="M10 12 L30 12 L34 32 L6 32 Z" fill="#8B7355"/><line x1="7" y1="18" x2="33" y2="18" stroke="#B8332F" strokeWidth="2"/></>,
    blueVest: <><rect x="10" y="12" width="20" height="18" rx="2" fill="#5D9EC7"/><line x1="20" y1="12" x2="20" y2="30" stroke="#B8E4F5" strokeWidth="1.5"/></>,
    heroCape: <><path d="M12 14 L28 14 L32 34 L8 34 Z" fill="#FFD700" opacity="0.9"/><circle cx="20" cy="22" r="4" fill="#B84A00"/></>,
    condor: <><ellipse cx="20" cy="22" rx="10" ry="6" fill="#2D2620"/><path d="M6 20 Q12 12 18 20" fill="#2D2620"/><path d="M22 20 Q28 12 34 20" fill="#2D2620"/><circle cx="16" cy="18" r="4" fill="#F4CBA5"/></>,
    fox: <><ellipse cx="20" cy="24" rx="12" ry="8" fill="#D4693A"/><path d="M10 20 L14 12 L16 22 Z" fill="#D4693A"/><path d="M30 20 L26 12 L24 22 Z" fill="#D4693A"/><circle cx="16" cy="22" r="1.5" fill="#2D2620"/><circle cx="24" cy="22" r="1.5" fill="#2D2620"/></>,
    frog: <><circle cx="20" cy="22" r="10" fill="#7DA240"/><circle cx="16" cy="18" r="2.5" fill="#2D2620"/><circle cx="24" cy="18" r="2.5" fill="#2D2620"/><path d="M17 26 Q20 29 23 26" stroke="#2D2620" strokeWidth="1" fill="none"/></>,
    owl: <><ellipse cx="20" cy="24" rx="12" ry="9" fill="#8B5A2B"/><circle cx="16" cy="20" r="4" fill="white"/><circle cx="24" cy="20" r="4" fill="white"/><circle cx="16" cy="20" r="2" fill="#2D2620"/><circle cx="24" cy="20" r="2" fill="#2D2620"/><polygon points="20,23 18,26 22,26" fill="#D4693A"/></>,
    vizcacha: <><ellipse cx="20" cy="24" rx="10" ry="7" fill="#D4A574"/><ellipse cx="20" cy="18" rx="8" ry="7" fill="#E8BC8A"/><circle cx="17" cy="17" r="1.5" fill="#2D2620"/><circle cx="23" cy="17" r="1.5" fill="#2D2620"/></>,
    balloons: <><circle cx="14" cy="16" r="7" fill="#E85D8F" opacity="0.8"/><circle cx="26" cy="14" r="7" fill="#FFD700" opacity="0.8"/><circle cx="20" cy="10" r="7" fill="#5D9EC7" opacity="0.8"/><line x1="18" y1="22" x2="16" y2="34" stroke="#999" strokeWidth="0.5"/></>,
    star: <><polygon points="20,6 23,16 34,16 25,22 28,32 20,26 12,32 15,22 6,16 17,16" fill="#FFD700" stroke="#B87F00" strokeWidth="0.8"/></>,
    chest: <><rect x="8" y="16" width="24" height="16" rx="3" fill="#D64A2C"/><rect x="11" y="20" width="18" height="8" rx="1" fill="#F08060"/><circle cx="20" cy="14" r="3" fill="#FFD700"/></>,
  };
  return <svg width={40} height={40} viewBox="0 0 40 40">{svgs[item.id]}</svg>;
}
