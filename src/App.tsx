import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection 
} from 'firebase/firestore';
import { 
  Trophy, Users, Play, Lock, Unlock, Volume2, VolumeX, 
  QrCode, Sparkles, CheckCircle2, XCircle, Clock, Award, 
  ArrowRight, RotateCcw, UserPlus, Shield, Zap, HelpCircle, 
  Mic, Crown, Medal, Bot, Smartphone, Monitor, RefreshCw,
  Delete, Send, Copy, Check
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION (SAFE & COMPLIANT)
// ==========================================
let app = null;
let auth = null;
let db = null;
const appId = 'dai-chien-kien-thuc-gia-dinh';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn('Firebase chưa được cấu hình: chỉ chơi thử trên thiết bị này.');
  }
} catch (err) {
  console.warn('Firebase initialization failed:', err);
}

// ==========================================
// WEB AUDIO API SOUND SYNTHESIZER
// ==========================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, delay = 0, vol = 0.25) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playCountdownTick(isGo = false) {
    if (isGo) {
      this.playTone(523.25, 'triangle', 0.15, 0, 0.35);
      this.playTone(659.25, 'triangle', 0.15, 0.1, 0.35);
      this.playTone(783.99, 'triangle', 0.35, 0.2, 0.4);
      this.playTone(1046.5, 'sine', 0.5, 0.3, 0.4);
    } else {
      this.playTone(440, 'sine', 0.18, 0, 0.3);
    }
  }

  playTick(urgent = false) {
    this.playTone(urgent ? 880 : 600, 'sine', 0.06, 0, urgent ? 0.15 : 0.08);
  }

  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0, 0.3);
    this.playTone(659.25, 'triangle', 0.12, 0.1, 0.3);
    this.playTone(783.99, 'triangle', 0.15, 0.2, 0.3);
    this.playTone(1046.5, 'triangle', 0.4, 0.3, 0.35);
  }

  playWrong() {
    this.playTone(300, 'sawtooth', 0.18, 0, 0.25);
    this.playTone(220, 'sawtooth', 0.35, 0.15, 0.25);
  }

  playClick() {
    this.playTone(700, 'sine', 0.05, 0, 0.12);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.12, 0.24, 0.36, 0.55, 0.72];
    const durs = [0.12, 0.12, 0.12, 0.2, 0.15, 0.6];
    notes.forEach((n, i) => this.playTone(n, 'triangle', durs[i], times[i], 0.35));
  }
}

const sfx = new SoundEffects();

// ==========================================
// 12 QUESTIONS DATA (EXACT SCRIPT)
// ==========================================
const QUESTIONS = [
  {
    id: 1,
    category: 'ĐIỀN TỪ CÒN THIẾU',
    time: 25,
    type: 'mcq',
    question: 'Theo Ph. Ăngghen, nhân tố quyết định trong lịch sử gồm sản xuất tư liệu sinh hoạt và sự sản xuất ra ........ (sự truyền nòi giống).',
    options: [
      { key: 'A', text: 'Tư liệu sản xuất' },
      { key: 'B', text: 'Bản thân con người' },
      { key: 'C', text: 'Của cải vật chất' },
      { key: 'D', text: 'Các quan hệ xã hội' }
    ],
    correct: 'B',
    explanation: 'Sản xuất và tái sản xuất ra con người là một trong hai phương diện cơ bản được Ph. Ăngghen đề cập khi bàn về nhân tố quyết định trong lịch sử.'
  },
  {
    id: 2,
    category: 'TRẮC NGHIỆM',
    time: 30,
    type: 'mcq',
    question: 'Vì sao việc thực hiện chức năng tái sản xuất ra con người không chỉ là việc riêng của gia đình?',
    options: [
      { key: 'A', text: 'Vì chức năng này chỉ nhằm đáp ứng mong muốn của cha mẹ.' },
      { key: 'B', text: 'Vì chức năng này quyết định mật độ dân cư, nguồn lực lao động và liên quan đến sự phát triển xã hội.' },
      { key: 'C', text: 'Vì mọi gia đình đều phải có số con giống nhau.' },
      { key: 'D', text: 'Vì chức năng này chỉ có ý nghĩa đối với gia đình, dòng họ.' }
    ],
    correct: 'B',
    explanation: 'Chức năng này có ảnh hưởng đến dân số, nguồn lao động và sự phát triển lâu dài của xã hội.'
  },
  {
    id: 3,
    category: 'NHẬN DIỆN CHỨC NĂNG GIA ĐÌNH',
    time: 20,
    type: 'mcq',
    question: 'Ông bà hướng dẫn con cháu thực hiện phong tục ngày Tết. Hoạt động này thể hiện rõ nhất vai trò nào của gia đình?',
    options: [
      { key: 'A', text: 'Vai trò kinh tế' },
      { key: 'B', text: 'Vai trò chính trị' },
      { key: 'C', text: 'Vai trò văn hóa' },
      { key: 'D', text: 'Vai trò sản xuất' }
    ],
    correct: 'C',
    explanation: 'Gia đình là nơi lưu giữ, truyền đạt các phong tục, tập quán và giá trị văn hóa giữa các thế hệ.'
  },
  {
    id: 4,
    category: 'NHẬN DIỆN CHỨC NĂNG GIA ĐÌNH',
    time: 20,
    type: 'mcq',
    question: 'Gia đình phổ biến, nhắc nhở các thành viên thực hiện chính sách, pháp luật của Nhà nước. Hoạt động này thể hiện rõ nhất vai trò nào?',
    options: [
      { key: 'A', text: 'Vai trò kinh tế' },
      { key: 'B', text: 'Vai trò chính trị' },
      { key: 'C', text: 'Vai trò sinh sản' },
      { key: 'D', text: 'Vai trò giải trí' }
    ],
    correct: 'B',
    explanation: 'Gia đình góp phần nâng cao ý thức chấp hành pháp luật và thực hiện các chủ trương, chính sách của Nhà nước.'
  },
  {
    id: 5,
    category: 'TRẮC NGHIỆM KIẾN THỨC',
    time: 30,
    type: 'mcq',
    question: 'Cơ sở văn hóa giữ vai trò gì trong việc xây dựng gia đình trong thời kỳ quá độ lên chủ nghĩa xã hội?',
    options: [
      { key: 'A', text: 'Điều chỉnh và hoàn thiện hệ thống pháp luật về hôn nhân và gia đình.' },
      { key: 'B', text: 'Củng cố, thay thế chế độ sở hữu tư nhân.' },
      { key: 'C', text: 'Loại bỏ phong tục, tập quán, lối sống lạc hậu do xã hội cũ để lại.' },
      { key: 'D', text: 'Xác lập quan hệ sản xuất mới nhằm xóa bỏ chế độ tư hữu về tư liệu sản xuất.' }
    ],
    correct: 'C',
    explanation: 'Cơ sở văn hóa góp phần loại bỏ những quan niệm, phong tục và lối sống lạc hậu, đồng thời phát huy các giá trị văn hóa tiến bộ.'
  },
  {
    id: 6,
    category: 'GIẢI MÃ CHỮ BÍ MẬT',
    time: 25,
    type: 'scramble',
    question: 'Cơ sở văn hóa góp phần xóa bỏ tư tưởng trọng nam khinh nữ. Trong chế độ hôn nhân tiến bộ, vợ và chồng có quyền lợi, nghĩa vụ ngang nhau. Đây là nguyên tắc gì?',
    scrambledLetters: [
      { id: 'l1', char: 'Ẳ' },
      { id: 'l2', char: 'N' },
      { id: 'l3', char: 'B' },
      { id: 'l4', char: 'H' },
      { id: 'l5', char: 'G' },
      { id: 'l6', char: 'N' },
      { id: 'l7', char: 'Ì' },
      { id: 'l8', char: 'Đ' }
    ],
    targetWord: 'BÌNHĐẲNG',
    displayAnswer: 'BÌNH ĐẲNG',
    correct: 'BÌNH ĐẲNG',
    successBanner: 'GIẢI MÃ THÀNH CÔNG!',
    explanation: 'Bình đẳng giữa vợ và chồng là một nguyên tắc của hôn nhân tiến bộ.'
  },
  {
    id: 7,
    category: 'LỰA CHỌN QUAN TRỌNG',
    time: 30,
    type: 'mcq',
    question: 'Theo các bạn, yếu tố nào quan trọng nhất giúp xây dựng một gia đình ấm no, tiến bộ và hạnh phúc trong xã hội hiện nay?',
    options: [
      { key: 'A', text: 'Điều kiện kinh tế ổn định.' },
      { key: 'B', text: 'Sự bình đẳng giữa các thành viên.' },
      { key: 'C', text: 'Tình yêu thương và sự chia sẻ.' },
      { key: 'D', text: 'Sự kết hợp của tất cả các yếu tố trên.' }
    ],
    correct: 'D',
    explanation: 'Gia đình hạnh phúc cần sự kết hợp giữa điều kiện vật chất, bình đẳng, yêu thương và trách nhiệm.'
  },
  {
    id: 8,
    category: 'THỬ THÁCH TƯ DUY',
    time: 35,
    type: 'mcq',
    question: 'Nhận định nào sau đây phản ánh CHƯA đầy đủ quan điểm xây dựng gia đình Việt Nam hiện đại?',
    options: [
      { key: 'A', text: 'Gia đình hiện đại cần kế thừa những giá trị tốt đẹp của truyền thống, đồng thời loại bỏ những tập quán không còn phù hợp.' },
      { key: 'B', text: 'Gia đình hạt nhân là xu hướng phát triển phổ biến, nhưng không đồng nghĩa với việc mô hình gia đình nhiều thế hệ mất đi giá trị.' },
      { key: 'C', text: 'Bình đẳng giới trong gia đình đòi hỏi vợ và chồng phải phân chia mọi công việc, trách nhiệm theo tỷ lệ ngang bằng tuyệt đối.' },
      { key: 'D', text: 'Sự thay đổi về quy mô và chức năng gia đình cần thích ứng với điều kiện kinh tế, văn hóa và xã hội trong từng giai đoạn.' }
    ],
    correct: 'C',
    explanation: 'Bình đẳng giới không có nghĩa là mọi công việc phải chia đều tuyệt đối, mà cần sự công bằng, tôn trọng và phân chia trách nhiệm phù hợp.'
  },
  {
    id: 9,
    category: 'GHÉP TÁC ĐỘNG: ĐÔ THỊ HÓA',
    time: 20,
    type: 'mcq',
    question: 'Đô thị hóa và di cư lao động có tác động nào nổi bật đối với gia đình?',
    options: [
      { key: 'A', text: 'Thúc đẩy chia sẻ trách nhiệm gia đình.' },
      { key: 'B', text: 'Thay đổi mô hình và không gian sinh sống.' },
      { key: 'C', text: 'Gia tăng nguy cơ so sánh, áp lực tâm lý.' }
    ],
    correct: 'B',
    explanation: 'Đô thị hóa và di cư lao động làm thay đổi nơi cư trú, quy mô và cách tổ chức đời sống gia đình.'
  },
  {
    id: 10,
    category: 'GHÉP TÁC ĐỘNG: MẠNG XÃ HỘI',
    time: 20,
    type: 'mcq',
    question: 'Sự phát triển của mạng xã hội có thể gây ra tác động tiêu cực nào đối với đời sống gia đình?',
    options: [
      { key: 'A', text: 'Thúc đẩy chia sẻ trách nhiệm gia đình.' },
      { key: 'B', text: 'Thay đổi mô hình và không gian sinh sống.' },
      { key: 'C', text: 'Gia tăng nguy cơ so sánh, áp lực tâm lý.' }
    ],
    correct: 'C',
    explanation: 'Việc thường xuyên so sánh cuộc sống của mình với người khác trên mạng xã hội có thể tạo ra áp lực và ảnh hưởng đến tâm lý các thành viên.'
  },
  {
    id: 11,
    category: 'GHÉP TÁC ĐỘNG: LAO ĐỘNG NỮ',
    time: 20,
    type: 'mcq',
    question: 'Phụ nữ tham gia thị trường lao động ngày càng nhiều góp phần tạo ra thay đổi nào trong gia đình?',
    options: [
      { key: 'A', text: 'Thúc đẩy chia sẻ trách nhiệm gia đình.' },
      { key: 'B', text: 'Thay đổi mô hình và không gian sinh sống.' },
      { key: 'C', text: 'Gia tăng nguy cơ so sánh, áp lực tâm lý.' }
    ],
    correct: 'A',
    explanation: 'Khi phụ nữ tham gia lao động xã hội, nhu cầu chia sẻ việc nhà, chăm sóc con cái và các trách nhiệm gia đình trở nên rõ rệt hơn.'
  },
  {
    id: 12,
    category: 'GIẢI MÃ TỪ KHÓA CUỐI CÙNG',
    time: 30,
    type: 'keyword',
    question: 'Tìm từ khóa gồm 5 chữ cái, thể hiện một tác động tiêu cực của mạng xã hội khi các thành viên thường xuyên so sánh cuộc sống gia đình mình với người khác.',
    acceptedAnswers: ['ÁPLỰC', 'APLUC', 'ÁP LỰC', 'AP LUC'],
    correct: 'ÁP LỰC',
    successBanner: 'HOÀN THÀNH THỬ THÁCH CUỐI CÙNG!',
    explanation: 'Những sự so sánh trên mạng xã hội có thể tạo áp lực tâm lý, kỳ vọng không thực tế và ảnh hưởng đến sự hài lòng trong cuộc sống gia đình.'
  }
];

const AVATARS = ['🦁', '🐼', '🦊', '🐯', '🐸', '🐙', '🦄', '🐝', '🐬', '🦉', '🦋', '🦖'];
const BOT_NAMES = [
  'Minh Anh 🌟', 'Hoàng Nam 🚀', 'Thu Thảo 🌸', 'Đức Huy ⚡', 
  'Ngọc Lan 🍀', 'Tuấn Kiệt 🔥', 'Bảo Châu 💎', 'Gia Hưng 🎯'
];

const OPTION_STYLES = {
  A: { bg: 'from-rose-500 to-red-600', border: 'border-rose-400', badge: 'bg-rose-700', shape: '▲' },
  B: { bg: 'from-blue-500 to-indigo-600', border: 'border-blue-400', badge: 'bg-blue-700', shape: '◆' },
  C: { bg: 'from-amber-500 to-orange-600', border: 'border-amber-400', badge: 'bg-amber-700', shape: '●' },
  D: { bg: 'from-emerald-500 to-teal-600', border: 'border-emerald-400', badge: 'bg-emerald-700', shape: '■' }
};

// Helper to normalize Vietnamese keyword
function normalizeKeyword(str) {
  return (str || '').trim().toUpperCase().replace(/\s+/g, '');
}

// ==========================================
// CONFETTI COMPONENT
// ==========================================
function ConfettiExplosion({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 48 });
  const colors = ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#fde047'];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((_, idx) => {
        const left = (idx * 2.1) % 100;
        const delay = (idx % 10) * 0.12;
        const duration = 2.2 + (idx % 5) * 0.4;
        const bg = colors[idx % colors.length];
        const size = 8 + (idx % 6) * 2;
        return (
          <div
            key={idx}
            style={{
              left: `${left}%`,
              top: '-20px',
              width: `${size}px`,
              height: `${size * 1.4}px`,
              backgroundColor: bg,
              animation: `fallConfetti ${duration}s ease-in ${delay}s forwards`
            }}
            className="absolute rounded-sm opacity-90 shadow-sm"
          />
        );
      })}
    </div>
  );
}

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Auth & Firebase User
  const [user, setUser] = useState(null);
  const [muted, setMuted] = useState(false);

  // Navigation / Mode state: 'home' | 'join' | 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished'
  const [screen, setScreen] = useState('home');
  const [role, setRole] = useState('host'); // 'host' | 'player' | 'solo'
  const [roomPin, setRoomPin] = useState('');
  const [joinPinInput, setJoinPinInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);

  // Host also participates toggle
  const [hostAlsoPlays, setHostAlsoPlays] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Room State (synced via Firestore or local for Solo/Fallback)
  const [roomData, setRoomData] = useState(null);

  // Local gameplay timers & answers
  const [countdownNum, setCountdownNum] = useState(3);
  const [timeLeft, setTimeLeft] = useState(25);
  const [mySubmittedAnswer, setMySubmittedAnswer] = useState(null);
  const [myPointsEarned, setMyPointsEarned] = useState(0);
  const [myIsCorrect, setMyIsCorrect] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Question 6 Scramble State
  const [scrambleSlots, setScrambleSlots] = useState([]); // Array of letter objects {id, char}
  // Question 12 Keyword State
  const [keywordChars, setKeywordChars] = useState(['', '', '', '', '']);
  const keywordRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // Refs for timers
  const timerRef = useRef(null);
  const botTimeoutsRef = useRef([]);

  // ------------------------------------------
  // 1. FIREBASE AUTHENTICATION
  // ------------------------------------------
  useEffect(() => {
    if (!auth) {
      setUser({ uid: 'local-' + Math.random().toString(36).substring(2, 9) });
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn('Auth fallback:', e);
        setUser({ uid: 'local-' + Math.random().toString(36).substring(2, 9) });
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsub();
  }, []);

  // Check URL parameters for quick QR join
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pinParam = params.get('pin');
      if (pinParam && pinParam.length === 6) {
        setJoinPinInput(pinParam);
        setScreen('join');
      }
    }
  }, []);

  // ------------------------------------------
  // 2. FIRESTORE REALTIME SYNC
  // ------------------------------------------
  useEffect(() => {
    if (!user || !roomPin || !db) return;

    const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'quiz_rooms', roomPin);
    const unsub = onSnapshot(
      roomDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRoomData(data);
        }
      },
      (err) => {
        console.warn('Firestore snapshot error:', err);
      }
    );

    return () => unsub();
  }, [user, roomPin]);

  // Sync local screen with roomData.status
  useEffect(() => {
    if (!roomData) return;
    if (roomData.status === 'lobby' && screen !== 'lobby') {
      setScreen('lobby');
    } else if (roomData.status === 'countdown' && screen !== 'countdown') {
      setScreen('countdown');
    } else if (roomData.status === 'question' && screen !== 'question') {
      setScreen('question');
    } else if (roomData.status === 'reveal' && screen !== 'reveal') {
      setScreen('reveal');
    } else if (roomData.status === 'finished' && screen !== 'finished') {
      setScreen('finished');
      sfx.playVictory();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [roomData?.status]);

  // Reset question local states when questionIndex changes
  const currentQuestionIndex = roomData?.currentQuestionIndex ?? 0;
  const currentQuestion = QUESTIONS[currentQuestionIndex] || QUESTIONS[0];

  useEffect(() => {
    if (roomData?.status === 'question') {
      setMySubmittedAnswer(null);
      setMyPointsEarned(0);
      setMyIsCorrect(null);
      setScrambleSlots([]);
      setKeywordChars(['', '', '', '', '']);
      setShowConfetti(false);
      setTimeLeft(currentQuestion.time);
    }
  }, [currentQuestionIndex, roomData?.status]);

  // ------------------------------------------
  // 3. COUNTDOWN 3 - 2 - 1 - GO EFFECT
  // ------------------------------------------
  useEffect(() => {
    if (screen !== 'countdown') return;
    setCountdownNum(3);
    sfx.playCountdownTick(false);

    const t1 = setTimeout(() => {
      setCountdownNum(2);
      sfx.playCountdownTick(false);
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdownNum(1);
      sfx.playCountdownTick(false);
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdownNum('GO!');
      sfx.playCountdownTick(true);
    }, 3000);

    const t4 = setTimeout(() => {
      if (role === 'host' || role === 'solo') {
        startQuestionPhase(0);
      }
    }, 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [screen]);

  // ------------------------------------------
  // 4. QUESTION TIMER & AI BOTS SIMULATION
  // ------------------------------------------
  useEffect(() => {
    if (screen !== 'question' || !roomData) return;

    const totalDuration = currentQuestion.time;
    const startTime = roomData.questionStartTime || Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, Math.ceil(totalDuration - elapsed));
      setTimeLeft(remaining);

      if (remaining <= 5 && remaining > 0) {
        sfx.playTick(true);
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (role === 'host' || role === 'solo') {
          triggerRevealPhase();
        }
      }
    }, 250);

    // Schedule AI Bot answers if host/solo
    if (role === 'host' || role === 'solo') {
      botTimeoutsRef.current.forEach(clearTimeout);
      botTimeoutsRef.current = [];

      const playersMap = roomData.players || {};
      Object.values(playersMap).forEach((p) => {
        if (p.isBot) {
          // Bot responds between 2.5s and 75% of question time
          const delaySec = 2 + Math.random() * (totalDuration * 0.65);
          const timeoutId = setTimeout(() => {
            simulateBotAnswer(p.uid, currentQuestionIndex, delaySec, totalDuration);
          }, delaySec * 1000);
          botTimeoutsRef.current.push(timeoutId);
        }
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      botTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [screen, currentQuestionIndex, roomData?.questionStartTime]);

  // Check if all players have answered to auto-reveal
  useEffect(() => {
    if (screen !== 'question' || !roomData) return;
    if (role !== 'host' && role !== 'solo') return;

    const playersList = Object.values(roomData.players || {});
    if (playersList.length === 0) return;

    const allAnswered = playersList.every(
      (p) => p.lastAnsweredQ === currentQuestionIndex
    );

    if (allAnswered) {
      const t = setTimeout(() => {
        triggerRevealPhase();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [roomData?.players, screen, currentQuestionIndex]);

  // Auto-advance from reveal if toggled
  useEffect(() => {
    if (screen !== 'reveal' || !autoAdvance) return;
    if (role !== 'host' && role !== 'solo') return;

    const t = setTimeout(() => {
      handleNextQuestion();
    }, 5500);
    return () => clearTimeout(t);
  }, [screen, autoAdvance, currentQuestionIndex]);

  // ------------------------------------------
  // HELPER: UPDATE ROOM DATA (FIRESTORE + LOCAL)
  // ------------------------------------------
  const updateRoomState = async (updater) => {
    setRoomData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (db && roomPin && user) {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'quiz_rooms', roomPin);
        setDoc(roomDocRef, next, { merge: true }).catch((e) => console.warn('Sync err:', e));
      }
      return next;
    });
  };

  // ------------------------------------------
  // ROOM CREATION & JOIN ACTIONS
  // ------------------------------------------
  const createRoom = async (isSoloDemo = false) => {
    sfx.playClick();
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const myUid = user?.uid || 'host-uid';
    const hostName = nickname.trim() || (isSoloDemo ? 'Bạn (Người chơi)' : 'Người Tổ Chức (MC)');

    const initialPlayers = {};

    if (isSoloDemo || hostAlsoPlays) {
      initialPlayers[myUid] = {
        uid: myUid,
        name: hostName,
        avatar: selectedAvatar,
        score: 0,
        correctCount: 0,
        lastAnsweredQ: -1,
        lastPoints: 0,
        lastCorrect: false,
        lastChoice: '',
        isBot: false,
        isHost: true
      };
    }

    if (isSoloDemo) {
      // Add 4 smart bots immediately for solo demo
      for (let i = 0; i < 4; i++) {
        const botId = `bot-${i + 1}`;
        initialPlayers[botId] = {
          uid: botId,
          name: BOT_NAMES[i],
          avatar: AVATARS[(i + 2) % AVATARS.length],
          score: 0,
          correctCount: 0,
          lastAnsweredQ: -1,
          lastPoints: 0,
          lastCorrect: false,
          lastChoice: '',
          isBot: true
        };
      }
    }

    const newRoom = {
      pin,
      hostId: myUid,
      status: isSoloDemo ? 'countdown' : 'lobby',
      locked: false,
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      players: initialPlayers,
      totalCorrectAnswersInRoom: 0,
      totalSubmissionsInRoom: 0,
      createdAt: Date.now()
    };

    setRoomPin(pin);
    setRole(isSoloDemo ? 'solo' : 'host');
    setRoomData(newRoom);
    setScreen(isSoloDemo ? 'countdown' : 'lobby');

    if (db && user) {
      try {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'quiz_rooms', pin);
        await setDoc(roomDocRef, newRoom);
      } catch (e) {
        console.warn('Could not save room to Firestore, continuing locally:', e);
      }
    }
  };

  const handleJoinRoom = async (e) => {
    if (e) e.preventDefault();
    sfx.playClick();
    setErrorMsg('');

    const cleanPin = joinPinInput.trim();
    const cleanName = nickname.trim();

    if (cleanPin.length !== 6) {
      setErrorMsg('Vui lòng nhập mã phòng gồm đúng 6 chữ số!');
      return;
    }
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập biệt danh của bạn!');
      return;
    }

    const myUid = user?.uid || 'player-' + Math.random().toString(36).substring(2, 7);

    if (db && user) {
      try {
        const roomDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'quiz_rooms', cleanPin);
        const snap = await getDoc(roomDocRef);

        if (!snap.exists()) {
          setErrorMsg('Không tìm thấy phòng với mã ' + cleanPin + '. Hãy kiểm tra lại hoặc tạo phòng mới!');
          return;
        }

        const data = snap.data();
        if (data.locked && (!data.players || !data.players[myUid])) {
          setErrorMsg('Phòng này đã bị khóa bởi người tổ chức!');
          return;
        }

        const newPlayerObj = {
          uid: myUid,
          name: cleanName,
          avatar: selectedAvatar,
          score: data.players?.[myUid]?.score || 0,
          correctCount: data.players?.[myUid]?.correctCount || 0,
          lastAnsweredQ: data.players?.[myUid]?.lastAnsweredQ ?? -1,
          lastPoints: 0,
          lastCorrect: false,
          lastChoice: '',
          isBot: false
        };

        const updatedPlayers = { ...(data.players || {}), [myUid]: newPlayerObj };
        await updateDoc(roomDocRef, { players: updatedPlayers });

        setRoomPin(cleanPin);
        setRole('player');
        setRoomData({ ...data, players: updatedPlayers });
        setScreen(data.status || 'lobby');
        return;
      } catch (err) {
        console.warn('Join error:', err);
        setErrorMsg('Lỗi kết nối phòng trực tuyến. Vui lòng thử lại!');
      }
    } else {
      setErrorMsg('Chế độ ngoại tuyến: Hãy chọn Tạo Phòng hoặc Chơi Thử Ngay trên thiết bị này.');
    }
  };

  const addAiBotsToLobby = () => {
    sfx.playClick();
    updateRoomState((prev) => {
      if (!prev) return prev;
      const existingPlayers = { ...(prev.players || {}) };
      const currentBotCount = Object.values(existingPlayers).filter((p) => p.isBot).length;
      if (currentBotCount >= 8) return prev;

      const nextIndex = currentBotCount;
      const botId = `bot-${Date.now()}-${nextIndex}`;
      existingPlayers[botId] = {
        uid: botId,
        name: BOT_NAMES[nextIndex % BOT_NAMES.length],
        avatar: AVATARS[(nextIndex + 3) % AVATARS.length],
        score: 0,
        correctCount: 0,
        lastAnsweredQ: -1,
        lastPoints: 0,
        lastCorrect: false,
        lastChoice: '',
        isBot: true
      };
      return { ...prev, players: existingPlayers };
    });
  };

  const toggleHostParticipates = () => {
    sfx.playClick();
    const myUid = user?.uid || 'host-uid';
    const nextVal = !hostAlsoPlays;
    setHostAlsoPlays(nextVal);

    updateRoomState((prev) => {
      if (!prev) return prev;
      const updatedPlayers = { ...(prev.players || {}) };
      if (nextVal) {
        updatedPlayers[myUid] = {
          uid: myUid,
          name: nickname.trim() || 'Người Tổ Chức (MC)',
          avatar: selectedAvatar,
          score: 0,
          correctCount: 0,
          lastAnsweredQ: -1,
          lastPoints: 0,
          lastCorrect: false,
          lastChoice: '',
          isBot: false,
          isHost: true
        };
      } else {
        delete updatedPlayers[myUid];
      }
      return { ...prev, players: updatedPlayers };
    });
  };

  const toggleLockRoom = () => {
    sfx.playClick();
    updateRoomState((prev) => ({ ...prev, locked: !prev.locked }));
  };

  // ------------------------------------------
  // GAME FLOW CONTROLS (HOST / SOLO)
  // ------------------------------------------
  const handleStartGame = () => {
    sfx.playClick();
    updateRoomState((prev) => ({
      ...prev,
      status: 'countdown',
      currentQuestionIndex: 0
    }));
    setScreen('countdown');
  };

  const startQuestionPhase = (qIndex) => {
    updateRoomState((prev) => ({
      ...prev,
      status: 'question',
      currentQuestionIndex: qIndex,
      questionStartTime: Date.now()
    }));
    setScreen('question');
  };

  const triggerRevealPhase = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    botTimeoutsRef.current.forEach(clearTimeout);
    updateRoomState((prev) => {
      if (!prev || prev.status === 'reveal') return prev;
      return { ...prev, status: 'reveal' };
    });
    setScreen('reveal');
  };

  const handleNextQuestion = () => {
    sfx.playClick();
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= QUESTIONS.length) {
      updateRoomState((prev) => ({ ...prev, status: 'finished' }));
      setScreen('finished');
      sfx.playVictory();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5500);
    } else {
      startQuestionPhase(nextIdx);
    }
  };

  const handleEndGameEarly = () => {
    sfx.playClick();
    if (timerRef.current) clearInterval(timerRef.current);
    botTimeoutsRef.current.forEach(clearTimeout);
    updateRoomState((prev) => ({ ...prev, status: 'finished' }));
    setScreen('finished');
    sfx.playVictory();
  };

  const handlePlayAgain = () => {
    sfx.playClick();
    updateRoomState((prev) => {
      if (!prev) return prev;
      const resetPlayers = {};
      Object.entries(prev.players || {}).forEach(([k, p]) => {
        resetPlayers[k] = {
          ...p,
          score: 0,
          correctCount: 0,
          lastAnsweredQ: -1,
          lastPoints: 0,
          lastCorrect: false,
          lastChoice: ''
        };
      });
      return {
        ...prev,
        status: 'lobby',
        currentQuestionIndex: 0,
        players: resetPlayers,
        totalCorrectAnswersInRoom: 0,
        totalSubmissionsInRoom: 0
      };
    });
    setScreen('lobby');
  };

  // ------------------------------------------
  // SCORING & SUBMISSION MECHANICS
  // ------------------------------------------
  const calculateScore = (timeRemainingSec, totalTimeSec) => {
    const ratio = Math.max(0, Math.min(1, timeRemainingSec / totalTimeSec));
    // Up to 1,000 points for instant answer, minimum 500 for correct at last second
    return Math.round(500 + 500 * ratio);
  };

  const submitPlayerAnswer = (rawChoice) => {
    if (mySubmittedAnswer !== null || screen !== 'question') return;

    const myUid = user?.uid || 'host-uid';
    const q = currentQuestion;
    let isRight = false;

    if (q.type === 'mcq') {
      isRight = rawChoice === q.correct;
    } else if (q.type === 'scramble') {
      isRight = normalizeKeyword(rawChoice) === normalizeKeyword(q.targetWord);
    } else if (q.type === 'keyword') {
      const cleaned = normalizeKeyword(rawChoice);
      isRight = q.acceptedAnswers.some((ans) => normalizeKeyword(ans) === cleaned);
    }

    const startTime = roomData?.questionStartTime || Date.now();
    const elapsed = (Date.now() - startTime) / 1000;
    const exactRemaining = Math.max(0, q.time - elapsed);
    const points = isRight ? calculateScore(exactRemaining, q.time) : 0;

    setMySubmittedAnswer(rawChoice);
    setMyIsCorrect(isRight);
    setMyPointsEarned(points);

    if (isRight) {
      sfx.playCorrect();
      if (q.type === 'scramble' || q.type === 'keyword') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }
    } else {
      sfx.playWrong();
    }

    updateRoomState((prev) => {
      if (!prev) return prev;
      const existingPlayer = prev.players?.[myUid] || {
        uid: myUid,
        name: nickname.trim() || 'Người chơi',
        avatar: selectedAvatar,
        score: 0,
        correctCount: 0
      };

      if (existingPlayer.lastAnsweredQ === currentQuestionIndex) {
        return prev; // Already answered this question
      }

      const updatedPlayer = {
        ...existingPlayer,
        score: (existingPlayer.score || 0) + points,
        correctCount: (existingPlayer.correctCount || 0) + (isRight ? 1 : 0),
        lastAnsweredQ: currentQuestionIndex,
        lastPoints: points,
        lastCorrect: isRight,
        lastChoice: rawChoice
      };

      return {
        ...prev,
        players: {
          ...(prev.players || {}),
          [myUid]: updatedPlayer
        },
        totalCorrectAnswersInRoom: (prev.totalCorrectAnswersInRoom || 0) + (isRight ? 1 : 0),
        totalSubmissionsInRoom: (prev.totalSubmissionsInRoom || 0) + 1
      };
    });
  };

  const simulateBotAnswer = (botUid, qIdx, delaySec, totalTime) => {
    const q = QUESTIONS[qIdx];
    if (!q) return;

    // Bots have ~78% accuracy
    const isRight = Math.random() < 0.78;
    const remaining = Math.max(1, totalTime - delaySec);
    const points = isRight ? calculateScore(remaining, totalTime) : 0;

    let botChoice = q.correct;
    if (!isRight && q.type === 'mcq') {
      const wrongOpts = q.options.map((o) => o.key).filter((k) => k !== q.correct);
      botChoice = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
    } else if (!isRight) {
      botChoice = 'SAI';
    }

    updateRoomState((prev) => {
      if (!prev || prev.status !== 'question' || prev.currentQuestionIndex !== qIdx) return prev;
      const bot = prev.players?.[botUid];
      if (!bot || bot.lastAnsweredQ === qIdx) return prev;

      const updatedBot = {
        ...bot,
        score: (bot.score || 0) + points,
        correctCount: (bot.correctCount || 0) + (isRight ? 1 : 0),
        lastAnsweredQ: qIdx,
        lastPoints: points,
        lastCorrect: isRight,
        lastChoice: botChoice
      };

      return {
        ...prev,
        players: {
          ...prev.players,
          [botUid]: updatedBot
        },
        totalCorrectAnswersInRoom: (prev.totalCorrectAnswersInRoom || 0) + (isRight ? 1 : 0),
        totalSubmissionsInRoom: (prev.totalSubmissionsInRoom || 0) + 1
      };
    });
  };

  // ------------------------------------------
  // QUESTION 6 (SCRAMBLE) HANDLERS
  // ------------------------------------------
  const handleSelectScrambleTile = (tile) => {
    if (mySubmittedAnswer !== null) return;
    sfx.playClick();
    if (scrambleSlots.find((t) => t.id === tile.id)) return;
    const nextSlots = [...scrambleSlots, tile];
    setScrambleSlots(nextSlots);

    if (nextSlots.length === 8) {
      const wordFormed = nextSlots.map((t) => t.char).join('');
      submitPlayerAnswer(wordFormed);
    }
  };

  const handleRemoveScrambleSlot = (tileId) => {
    if (mySubmittedAnswer !== null) return;
    sfx.playClick();
    setScrambleSlots(scrambleSlots.filter((t) => t.id !== tileId));
  };

  // ------------------------------------------
  // QUESTION 12 (KEYWORD 5 BOXES) HANDLERS
  // ------------------------------------------
  const handleKeywordCharChange = (index, val) => {
    if (mySubmittedAnswer !== null) return;
    const char = val.slice(-1).toUpperCase();
    const next = [...keywordChars];
    next[index] = char;
    setKeywordChars(next);

    if (char && index < 4) {
      keywordRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeywordKeyDown = (index, e) => {
    if (mySubmittedAnswer !== null) return;
    if (e.key === 'Backspace' && !keywordChars[index] && index > 0) {
      keywordRefs[index - 1]?.current?.focus();
    } else if (e.key === 'Enter') {
      const word = keywordChars.join('');
      if (word.length === 5) {
        submitPlayerAnswer(word);
      }
    }
  };

  const handleVirtualKeyTap = (char) => {
    if (mySubmittedAnswer !== null) return;
    sfx.playClick();
    const emptyIdx = keywordChars.findIndex((c) => c === '');
    if (emptyIdx !== -1) {
      const next = [...keywordChars];
      next[emptyIdx] = char;
      setKeywordChars(next);
    }
  };

  const handleVirtualBackspace = () => {
    if (mySubmittedAnswer !== null) return;
    sfx.playClick();
    const lastFilledIdx = [...keywordChars].reverse().findIndex((c) => c !== '');
    if (lastFilledIdx !== -1) {
      const realIdx = 4 - lastFilledIdx;
      const next = [...keywordChars];
      next[realIdx] = '';
      setKeywordChars(next);
    }
  };

  // ------------------------------------------
  // DERIVED LEADERBOARD & STATS
  // ------------------------------------------
  const sortedPlayers = useMemo(() => {
    const list = Object.values(roomData?.players || {});
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [roomData?.players]);

  const answeredCount = useMemo(() => {
    const list = Object.values(roomData?.players || {});
    return list.filter((p) => p.lastAnsweredQ === currentQuestionIndex).length;
  }, [roomData?.players, currentQuestionIndex]);

  const roomAccuracyPercent = useMemo(() => {
    if (!roomData) return 0;
    const players = Object.values(roomData.players || {});
    if (players.length === 0) return 0;
    const totalCorrect = players.reduce((acc, p) => acc + (p.correctCount || 0), 0);
    const totalPossible = players.length * QUESTIONS.length;
    return Math.round((totalCorrect / totalPossible) * 100);
  }, [roomData]);

  const shareUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://daichienkienthuc.vn';
    return `${base}?pin=${roomPin || '123456'}`;
  }, [roomPin]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(shareUrl)}`;
  }, [shareUrl]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sfx.muted = next;
  };

  const copyPinToClipboard = () => {
    if (!roomPin) return;
    navigator.clipboard?.writeText(roomPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-950 text-white font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col justify-between overflow-x-hidden">
      <style>{`
        @keyframes fallConfetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.5); }
          50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.9); }
        }
        .glow-gold { animation: pulseGlow 2s infinite; }
      `}</style>

      <ConfettiExplosion active={showConfetti} />

      {/* TOP NAVIGATION BAR */}
      <header className="w-full px-4 py-3 bg-slate-950/50 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-2 z-30">
        <div 
          onClick={() => {
            if (screen !== 'home') {
              if (timerRef.current) clearInterval(timerRef.current);
              setScreen('home');
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
              ĐẠI CHIẾN KIẾN THỨC GIA ĐÌNH
            </h1>
            <p className="text-[11px] text-purple-200/80 hidden sm:block">
              Chủ đề: Xây dựng gia đình trong thời kỳ quá độ lên chủ nghĩa xã hội
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {roomPin && screen !== 'home' && screen !== 'join' && (
            <div 
              onClick={copyPinToClipboard}
              title="Nhấn để sao chép Mã Phòng"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-white/20 cursor-pointer transition"
            >
              <span className="text-purple-200">MÃ PHÒNG:</span>
              <span className="text-amber-300 tracking-widest font-mono text-sm sm:text-base">{roomPin}</span>
              {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-300" />}
            </div>
          )}

          <button
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition"
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-300" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-6xl w-full mx-auto">
        
        {/* ==========================================
            1. HOME SCREEN (MÀN HÌNH CHÍNH)
           ========================================== */}
        {screen === 'home' && (
          <div className="w-full max-w-4xl flex flex-col items-center text-center my-auto space-y-8 animate-fadeIn">
            {/* Hero Badge & Title */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-semibold shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>TRÒ CHƠI TƯƠNG TÁC TRỰC TUYẾN • 12 THỬ THÁCH LIÊN TỤC</span>
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight drop-shadow-md">
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent">
                  ĐẠI CHIẾN KIẾN THỨC
                </span>
                <br />
                <span className="text-white">GIA ĐÌNH VIỆT NAM</span>
              </h2>

              <p className="text-sm sm:text-lg text-purple-200 max-w-2xl mx-auto font-medium">
                Chủ đề: <span className="text-amber-300 font-semibold">Xây dựng gia đình trong thời kỳ quá độ lên chủ nghĩa xã hội</span>
              </p>
            </div>

            {/* Nickname & Avatar Quick Customization */}
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/15 shadow-2xl space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                  Biệt danh của bạn (Tùy chọn)
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/20 text-white placeholder-purple-300/40 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1.5">
                  Chọn biểu tượng đại diện
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setSelectedAvatar(av);
                      }}
                      className={`text-2xl p-2 rounded-xl flex items-center justify-center transition transform ${
                        selectedAvatar === av
                          ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg ring-2 ring-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
              <button
                onClick={() => createRoom(false)}
                className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-slate-950 font-black shadow-xl shadow-orange-600/30 hover:scale-[1.03] active:scale-95 transition cursor-pointer border-2 border-amber-200"
              >
                <Monitor className="w-10 h-10 mb-2 text-slate-950 group-hover:rotate-6 transition" />
                <span className="text-lg sm:text-xl">TẠO PHÒNG</span>
                <span className="text-xs font-bold opacity-80 mt-1">Người tổ chức / Máy chiếu</span>
              </button>

              <button
                onClick={() => {
                  sfx.playClick();
                  setErrorMsg('');
                  setScreen('join');
                }}
                className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white font-black shadow-xl shadow-blue-600/30 hover:scale-[1.03] active:scale-95 transition cursor-pointer border-2 border-cyan-300/50"
              >
                <Smartphone className="w-10 h-10 mb-2 text-white group-hover:-rotate-6 transition" />
                <span className="text-lg sm:text-xl">THAM GIA</span>
                <span className="text-xs font-medium text-cyan-100 mt-1">Nhập mã 6 số / Quét QR</span>
              </button>

              <button
                onClick={() => createRoom(true)}
                className="group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 text-white font-black shadow-xl shadow-emerald-600/30 hover:scale-[1.03] active:scale-95 transition cursor-pointer border-2 border-emerald-300/50"
              >
                <Zap className="w-10 h-10 mb-2 text-amber-300 group-hover:scale-110 transition" />
                <span className="text-lg sm:text-xl">CHƠI THỬ NGAY</span>
                <span className="text-xs font-medium text-emerald-100 mt-1">Đấu trực tiếp cùng 4 AI</span>
              </button>
            </div>

            {/* Game Overview Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-purple-200/90 pt-2">
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Thời lượng: 10–12 phút
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Điểm tối đa: 12.000 điểm
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" /> Không cần tạo tài khoản
              </span>
            </div>
          </div>
        )}

        {/* ==========================================
            2. PLAYER JOIN SCREEN (THAM GIA PHÒNG)
           ========================================== */}
        {screen === 'join' && (
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6 my-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-cyan-300" />
              </div>
              <h2 className="text-2xl font-black">THAM GIA TRÒ CHƠI</h2>
              <p className="text-xs sm:text-sm text-purple-200">
                Nhập mã phòng 6 chữ số hiển thị trên màn hình người tổ chức
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                  Mã Phòng (6 chữ số)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={joinPinInput}
                  onChange={(e) => setJoinPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ví dụ: 849201"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border-2 border-cyan-400/50 text-center text-2xl font-mono font-black tracking-[0.35em] text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                  Biệt danh của bạn
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập biệt danh..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/20 text-white font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen('home')}
                  className="w-1/3 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-base shadow-lg hover:brightness-110 transition"
                >
                  VÀO PHÒNG NGAY
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==========================================
            3. LOBBY SCREEN (PHÒNG CHỜ & MÃ QR)
           ========================================== */}
        {screen === 'lobby' && roomData && (
          <div className="w-full space-y-6 my-auto">
            {/* Top Row: QR Code + PIN + MC Script */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left 5 cols: PIN & QR Code */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 flex flex-col sm:flex-row lg:flex-col items-center justify-between gap-5 shadow-2xl">
                <div className="text-center space-y-2 w-full">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-300/30">
                    QUÉT QR HOẶC NHẬP MÃ PHÒNG
                  </span>
                  <div 
                    onClick={copyPinToClipboard}
                    className="mt-2 py-3 px-6 rounded-2xl bg-slate-950/80 border-2 border-amber-400/60 cursor-pointer hover:border-amber-300 transition"
                  >
                    <p className="text-xs text-purple-300 uppercase">Mã Phòng (6 chữ số)</p>
                    <p className="text-4xl sm:text-5xl font-mono font-black tracking-[0.2em] text-amber-300">
                      {roomPin}
                    </p>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col items-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code tham gia phòng"
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-slate-700 mt-1.5 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Quét bằng Camera Điện Thoại
                  </span>
                </div>
              </div>

              {/* Right 7 cols: MC Script & Host Controls */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-5 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="space-y-4">
                  {/* MC Intro Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border border-amber-300/40 shadow-inner space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm uppercase tracking-wider">
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>Lời dẫn MC mở đầu</span>
                    </div>
                    <p className="text-sm sm:text-base text-white/95 italic leading-relaxed">
                      “Chào mừng các bạn đến với <strong className="text-amber-300 not-italic">Đại chiến kiến thức gia đình!</strong> Các bạn sẽ trải qua 12 thử thách xoay quanh chức năng, vai trò và sự biến đổi của gia đình Việt Nam. Ai trả lời chính xác và nhanh nhất sẽ giành chiến thắng. Các bạn đã sẵn sàng chưa?”
                    </p>
                  </div>

                  {/* Host Options Bar */}
                  {(role === 'host' || role === 'solo') && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        onClick={addAiBotsToLobby}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs sm:text-sm font-bold transition cursor-pointer"
                      >
                        <Bot className="w-4 h-4" /> + Thêm người chơi AI (Bot)
                      </button>

                      <button
                        onClick={toggleLockRoom}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
                          roomData.locked
                            ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                            : 'bg-white/10 hover:bg-white/20 border-white/20 text-purple-100'
                        }`}
                      >
                        {roomData.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {roomData.locked ? 'Đã khóa phòng' : 'Khóa phòng'}
                      </button>

                      <button
                        onClick={toggleHostParticipates}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
                          hostAlsoPlays
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-white/10 border-white/20 text-purple-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {hostAlsoPlays ? 'MC cùng trả lời: BẬT' : 'MC cùng trả lời: TẮT'}
                      </button>
                    </div>
                  )}

                  {/* Player List Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-400" />
                        Danh sách người tham gia ({sortedPlayers.length})
                      </span>
                    </div>

                    {sortedPlayers.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-white/20 text-center text-purple-300 text-sm">
                        Đang chờ người chơi quét mã QR hoặc nhấn "+ Thêm người chơi AI"...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {sortedPlayers.map((p) => (
                          <div
                            key={p.uid}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/75 border border-white/15 shadow-sm"
                          >
                            <span className="text-2xl">{p.avatar || '🦁'}</span>
                            <div className="truncate">
                              <p className="font-bold text-xs sm:text-sm truncate text-white">{p.name}</p>
                              <p className="text-[10px] text-purple-300">
                                {p.isBot ? '🤖 AI Đối thủ' : p.isHost ? '👑 Chủ phòng' : '📱 Người chơi'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* START BUTTON */}
                {(role === 'host' || role === 'solo') ? (
                  <button
                    onClick={handleStartGame}
                    disabled={sortedPlayers.length === 0}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950 font-black text-xl tracking-wide shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-slate-950" />
                    BẮT ĐẦU TRÒ CHƠI (12 CÂU HỎI)
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-2xl bg-indigo-950/80 border border-indigo-400/40 text-center font-bold text-amber-300 animate-pulse">
                    Đã vào phòng! Hãy nhìn lên màn hình chính và chờ Người tổ chức nhấn BẮT ĐẦU...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            4. COUNTDOWN SCREEN (3 - 2 - 1 - GO!)
           ========================================== */}
        {screen === 'countdown' && (
          <div className="flex flex-col items-center justify-center my-auto text-center space-y-6">
            <p className="text-lg sm:text-2xl font-bold text-amber-300 uppercase tracking-widest">
              CHUẨN BỊ BƯỚC VÀO THỬ THÁCH!
            </p>
            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-2xl glow-gold border-4 border-white">
              <span className="text-7xl sm:text-8xl font-black text-white drop-shadow-lg animate-bounce">
                {countdownNum}
              </span>
            </div>
            <p className="text-sm sm:text-base text-purple-200">
              Trả lời càng nhanh, điểm thưởng càng cao (Tối đa 1.000 điểm/câu)
            </p>
          </div>
        )}

        {/* ==========================================
            5. QUESTION & REVEAL SCREEN (12 CÂU LIÊN TỤC)
           ========================================== */}
        {(screen === 'question' || screen === 'reveal') && roomData && (
          <div className="w-full max-w-5xl space-y-5 my-auto">
            
            {/* Question Progress & Timer Bar */}
            <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm sm:text-base">
                  CÂU {currentQuestion.id} / {QUESTIONS.length}
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-300/30">
                  {currentQuestion.category}
                </span>
              </div>

              {/* Center Timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-200">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Đã trả lời: {answeredCount}/{sortedPlayers.length}</span>
                </div>

                <div
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-black text-lg sm:text-xl border ${
                    screen === 'reveal'
                      ? 'bg-slate-800 border-slate-600 text-slate-300'
                      : timeLeft <= 5
                      ? 'bg-rose-600 border-rose-300 text-white animate-pulse'
                      : 'bg-indigo-900/90 border-amber-400/60 text-amber-300'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span>{screen === 'reveal' ? 'HẾT GIỜ' : `${timeLeft}s`}</span>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            {screen === 'question' && (
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-500'
                  }`}
                  style={{ width: `${(timeLeft / currentQuestion.time) * 100}%` }}
                />
              </div>
            )}

            {/* Question Prompt Card */}
            <div className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl text-center space-y-3">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug text-white">
                {currentQuestion.question}
              </h3>
            </div>

            {/* ==========================================
                TYPE 1: MULTIPLE CHOICE (CÂU 1-5, 7-11)
               ========================================== */}
            {currentQuestion.type === 'mcq' && (
              <div className={`grid grid-cols-1 ${currentQuestion.options.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                {currentQuestion.options.map((opt) => {
                  const style = OPTION_STYLES[opt.key] || OPTION_STYLES.A;
                  const isMyPick = mySubmittedAnswer === opt.key;
                  const isRightOption = opt.key === currentQuestion.correct;
                  const showFeedback = mySubmittedAnswer !== null || screen === 'reveal';

                  let cardClasses = `bg-gradient-to-br ${style.bg} ${style.border}`;
                  if (showFeedback) {
                    if (isRightOption) {
                      cardClasses = 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-200 ring-4 ring-emerald-300/80 shadow-2xl shadow-emerald-500/40 scale-[1.01]';
                    } else if (isMyPick && !isRightOption) {
                      cardClasses = 'bg-gradient-to-br from-rose-700 to-red-900 border-rose-400 ring-4 ring-rose-400/70 opacity-90';
                    } else {
                      cardClasses = 'bg-slate-800/70 border-slate-700 opacity-45';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      disabled={mySubmittedAnswer !== null || screen === 'reveal'}
                      onClick={() => submitPlayerAnswer(opt.key)}
                      className={`group relative flex items-center gap-4 p-5 sm:p-6 rounded-2xl border-2 text-left transition transform ${
                        !showFeedback ? 'hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl' : 'cursor-default'
                      } ${cardClasses}`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${style.badge} bg-black/25 flex items-center justify-center font-black text-xl shrink-0 border border-white/20`}>
                        {opt.key}
                      </div>
                      <span className="font-bold text-base sm:text-lg text-white leading-snug flex-1">
                        {opt.text}
                      </span>

                      {showFeedback && isRightOption && (
                        <CheckCircle2 className="w-8 h-8 text-white shrink-0 animate-bounce" />
                      )}
                      {showFeedback && isMyPick && !isRightOption && (
                        <XCircle className="w-8 h-8 text-rose-200 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ==========================================
                TYPE 2: SCRAMBLE LETTERS (CÂU 6: BÌNH ĐẲNG)
               ========================================== */}
            {currentQuestion.type === 'scramble' && (
              <div className="bg-slate-950/60 backdrop-blur-lg p-6 rounded-3xl border border-white/15 space-y-6 text-center">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  Chạm vào các chữ cái bên dưới theo đúng thứ tự để tạo thành từ có nghĩa (8 chữ cái):
                </p>

                {/* 8 Target Slots: 4 letters (BÌNH) + space + 4 letters (ĐẲNG) */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {Array.from({ length: 8 }).map((_, idx) => {
                    const placed = scrambleSlots[idx];
                    const isSolved = (mySubmittedAnswer !== null && myIsCorrect) || screen === 'reveal';
                    const revealChars = ['B', 'Ì', 'N', 'H', 'Đ', 'Ẳ', 'N', 'G'];

                    return (
                      <React.Fragment key={idx}>
                        {idx === 4 && <div className="w-3 sm:w-6" />}
                        <button
                          type="button"
                          disabled={!placed || mySubmittedAnswer !== null || screen === 'reveal'}
                          onClick={() => placed && handleRemoveScrambleSlot(placed.id)}
                          className={`w-11 h-14 sm:w-14 sm:h-16 rounded-xl font-black text-2xl sm:text-3xl flex items-center justify-center border-2 transition transform ${
                            isSolved
                              ? 'bg-emerald-500 border-emerald-200 text-slate-950 glow-gold scale-105'
                              : placed
                              ? 'bg-amber-400 border-white text-slate-950 shadow-lg hover:bg-rose-400'
                              : 'bg-slate-900/90 border-dashed border-purple-400/50 text-white'
                          }`}
                        >
                          {screen === 'reveal' && !myIsCorrect ? revealChars[idx] : placed ? placed.char : ''}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Success Banner for Q6 */}
                {(myIsCorrect || screen === 'reveal') && (
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-base sm:text-lg shadow-xl animate-bounce">
                    <Sparkles className="w-5 h-5" />
                    <span>{currentQuestion.successBanner} — ĐÁP ÁN: {currentQuestion.displayAnswer}</span>
                  </div>
                )}

                {/* Scrambled Source Tiles */}
                {mySubmittedAnswer === null && screen === 'question' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                      {currentQuestion.scrambledLetters.map((tile) => {
                        const used = scrambleSlots.some((t) => t.id === tile.id);
                        return (
                          <button
                            key={tile.id}
                            disabled={used}
                            onClick={() => handleSelectScrambleTile(tile)}
                            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-black text-2xl transition transform ${
                              used
                                ? 'bg-slate-800/40 text-slate-600 border border-slate-700 scale-90 cursor-not-allowed'
                                : 'bg-gradient-to-b from-indigo-500 to-purple-700 hover:from-amber-400 hover:to-orange-500 hover:text-slate-950 text-white border-2 border-indigo-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
                            }`}
                          >
                            {tile.char}
                          </button>
                        );
                      })}
                    </div>

                    {scrambleSlots.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setScrambleSlots([])}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-purple-200 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Xóa xếp lại
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                TYPE 3: FINAL 5-LETTER KEYWORD (CÂU 12: ÁP LỰC)
               ========================================== */}
            {currentQuestion.type === 'keyword' && (
              <div className="bg-slate-950/60 backdrop-blur-lg p-6 rounded-3xl border border-white/15 space-y-6 text-center">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  Nhập 5 chữ cái vào các ô trống (Chấp nhận "ÁP LỰC" hoặc "AP LUC"):
                </p>

                {/* 5 Large Letter Boxes: □ □   □ □ □ */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const isSolved = (mySubmittedAnswer !== null && myIsCorrect) || screen === 'reveal';
                    const revealChars = ['Á', 'P', 'L', 'Ự', 'C'];
                    return (
                      <React.Fragment key={idx}>
                        {idx === 2 && <div className="w-3 sm:w-6" />}
                        <input
                          ref={keywordRefs[idx]}
                          type="text"
                          maxLength={1}
                          disabled={mySubmittedAnswer !== null || screen === 'reveal'}
                          value={screen === 'reveal' && !myIsCorrect ? revealChars[idx] : keywordChars[idx]}
                          onChange={(e) => handleKeywordCharChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeywordKeyDown(idx, e)}
                          className={`w-12 h-16 sm:w-16 sm:h-20 rounded-2xl text-center font-black text-2xl sm:text-4xl border-2 focus:outline-none transition ${
                            isSolved
                              ? 'bg-emerald-500 border-emerald-200 text-slate-950 glow-gold'
                              : mySubmittedAnswer !== null && !myIsCorrect
                              ? 'bg-rose-600 border-rose-300 text-white'
                              : 'bg-slate-900 border-amber-400 text-amber-300 focus:ring-4 focus:ring-amber-400/40'
                          }`}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Quick Virtual Letter Pad + Submit */}
                {mySubmittedAnswer === null && screen === 'question' && (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Á', 'A', 'P', 'L', 'Ự', 'U', 'C', 'T', 'M', 'N'].map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => handleVirtualKeyTap(ch)}
                          className="w-10 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 font-black text-lg border border-white/20 transition cursor-pointer"
                        >
                          {ch}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleVirtualBackspace}
                        className="px-3 h-11 sm:h-12 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Delete className="w-4 h-4" /> Xóa
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={keywordChars.join('').length < 5}
                      onClick={() => submitPlayerAnswer(keywordChars.join(''))}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-base shadow-xl disabled:opacity-40 hover:brightness-110 transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-5 h-5" /> GỬI ĐÁP ÁN GIẢI MÃ
                    </button>
                  </div>
                )}

                {(myIsCorrect || screen === 'reveal') && (
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-base sm:text-lg shadow-2xl animate-bounce">
                    <Sparkles className="w-6 h-6" />
                    <span>{currentQuestion.successBanner} — ĐÁP ÁN: ÁP LỰC</span>
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                FEEDBACK, EXPLANATION & LIVE MINI-LEADERBOARD
               ========================================== */}
            {(mySubmittedAnswer !== null || screen === 'reveal') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-fadeIn">
                
                {/* Left 7 cols: Explanation & Player Result */}
                <div className="lg:col-span-7 bg-slate-950/75 backdrop-blur-xl p-5 rounded-3xl border border-white/20 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    {mySubmittedAnswer !== null && (
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm ${
                          myIsCorrect
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                            : 'bg-rose-500/20 border border-rose-400 text-rose-300'
                        }`}
                      >
                        {myIsCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> CHÍNH XÁC! +{myPointsEarned} ĐIỂM
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> CHƯA CHÍNH XÁC (+0 ĐIỂM) — Đáp án đúng: {currentQuestion.correct}
                          </>
                        )}
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-400/30 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> Giải thích kiến thức:
                      </p>
                      <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Host Controls to Advance */}
                  {(role === 'host' || role === 'solo') && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                      <label className="flex items-center gap-2 text-xs font-semibold text-purple-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAdvance}
                          onChange={(e) => setAutoAdvance(e.target.checked)}
                          className="rounded accent-amber-400 w-4 h-4"
                        />
                        Tự động chuyển câu sau 5 giây
                      </label>

                      <div className="flex items-center gap-2">
                        {screen === 'question' && (
                          <button
                            onClick={triggerRevealPhase}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold transition cursor-pointer"
                          >
                            Hiện đáp án ngay
                          </button>
                        )}
                        <button
                          onClick={handleNextQuestion}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm sm:text-base shadow-lg hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{currentQuestionIndex + 1 >= QUESTIONS.length ? 'XEM BẢNG XẾP HẠNG CUỐI' : 'CÂU TIẾP THEO'}</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 5 cols: Live Top 5 Ranking */}
                <div className="lg:col-span-5 bg-slate-950/75 backdrop-blur-xl p-5 rounded-3xl border border-white/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" /> Bảng xếp hạng tạm thời
                    </span>
                    <span className="text-[11px] text-purple-300">Tối đa 12.000đ</span>
                  </div>

                  <div className="space-y-2">
                    {sortedPlayers.slice(0, 5).map((p, idx) => (
                      <div
                        key={p.uid}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          idx === 0
                            ? 'bg-amber-400/20 border-amber-400/50'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-6 h-6 rounded-full bg-slate-900 font-black text-xs flex items-center justify-center text-amber-300">
                            {idx + 1}
                          </span>
                          <span className="text-xl">{p.avatar}</span>
                          <span className="font-bold text-xs sm:text-sm truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.lastAnsweredQ === currentQuestionIndex && p.lastPoints > 0 && (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              +{p.lastPoints}
                            </span>
                          )}
                          <span className="font-mono font-black text-sm text-amber-300">
                            {(p.score || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            6. FINISHED SCREEN (BẢNG XẾP HẠNG CUỐI CÙNG)
           ========================================== */}
        {screen === 'finished' && roomData && (
          <div className="w-full max-w-5xl space-y-8 my-auto py-4 animate-fadeIn">
            
            {/* Header Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-widest">
                <Crown className="w-4 h-4" /> TỔNG KẾT ĐẠI CHIẾN KIẾN THỨC GIA ĐÌNH
              </div>
              <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                TOP 3 NGƯỜI CHIẾN THẮNG
              </h2>
            </div>

            {/* TOP 3 PODIUM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4">
              {/* 🥈 Hạng 2 */}
              {sortedPlayers[1] && (
                <div className="order-2 md:order-1 bg-gradient-to-b from-slate-700/80 to-slate-900/90 border-2 border-slate-300/50 rounded-3xl p-5 text-center flex flex-col items-center shadow-xl">
                  <div className="text-4xl mb-1">🥈</div>
                  <span className="text-3xl mb-2">{sortedPlayers[1].avatar}</span>
                  <span className="px-3 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black text-xs uppercase">
                    HẠNG 2
                  </span>
                  <h3 className="font-black text-lg text-white mt-2 truncate max-w-full">
                    {sortedPlayers[1].name}
                  </h3>
                  <p className="text-2xl font-mono font-black text-slate-200 mt-1">
                    {(sortedPlayers[1].score || 0).toLocaleString()} đ
                  </p>
                  <p className="text-xs text-purple-300 mt-1">
                    Đúng {sortedPlayers[1].correctCount || 0}/12 câu
                  </p>
                </div>
              )}

              {/* 🥇 Hạng 1 */}
              {sortedPlayers[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/30 via-amber-600/20 to-slate-900/95 border-2 border-amber-300 rounded-3xl p-6 text-center flex flex-col items-center shadow-2xl glow-gold md:-translate-y-4">
                  <div className="text-5xl mb-1 animate-bounce">🥇</div>
                  <span className="text-4xl mb-2">{sortedPlayers[0].avatar}</span>
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 font-black text-xs uppercase shadow">
                    QUÁN QUÂN • HẠNG 1
                  </span>
                  <h3 className="font-black text-xl sm:text-2xl text-amber-200 mt-2 truncate max-w-full">
                    {sortedPlayers[0].name}
                  </h3>
                  <p className="text-3xl font-mono font-black text-amber-300 mt-1">
                    {(sortedPlayers[0].score || 0).toLocaleString()} đ
                  </p>
                  <p className="text-xs text-amber-200/90 mt-1 font-semibold">
                    Đúng {sortedPlayers[0].correctCount || 0}/12 câu
                  </p>
                </div>
              )}

              {/* 🥉 Hạng 3 */}
              {sortedPlayers[2] && (
                <div className="order-3 bg-gradient-to-b from-amber-800/60 to-slate-900/90 border-2 border-amber-500/50 rounded-3xl p-5 text-center flex flex-col items-center shadow-xl">
                  <div className="text-4xl mb-1">🥉</div>
                  <span className="text-3xl mb-2">{sortedPlayers[2].avatar}</span>
                  <span className="px-3 py-0.5 rounded-full bg-amber-600 text-white font-black text-xs uppercase">
                    HẠNG 3
                  </span>
                  <h3 className="font-black text-lg text-white mt-2 truncate max-w-full">
                    {sortedPlayers[2].name}
                  </h3>
                  <p className="text-2xl font-mono font-black text-amber-300 mt-1">
                    {(sortedPlayers[2].score || 0).toLocaleString()} đ
                  </p>
                  <p className="text-xs text-purple-300 mt-1">
                    Đúng {sortedPlayers[2].correctCount || 0}/12 câu
                  </p>
                </div>
              )}
            </div>

            {/* Room Stats & MC Closing Script */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 5 cols: Room Accuracy + MC Outro */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/20 space-y-4">
                  <h4 className="font-black text-sm uppercase tracking-wider text-amber-300">
                    Thống kê toàn phòng ({sortedPlayers.length} người chơi)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
                      <p className="text-xs text-purple-300">Tỷ lệ trả lời đúng</p>
                      <p className="text-3xl font-black text-emerald-400 mt-1">{roomAccuracyPercent}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-center">
                      <p className="text-xs text-purple-300">Tổng điểm tối đa</p>
                      <p className="text-2xl font-black text-amber-300 mt-1">12.000</p>
                    </div>
                  </div>
                </div>

                {/* MC Closing Box */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/90 to-purple-900/90 border border-amber-300/40 space-y-2 shadow-xl">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Mic className="w-4 h-4" />
                    <span>Lời kết MC</span>
                  </div>
                  <p className="text-sm sm:text-base text-white/95 italic leading-relaxed">
                    “Chúc mừng những người chiến thắng! Qua 12 câu hỏi, chúng ta đã cùng ôn tập những kiến thức về chức năng gia đình, bình đẳng giới và những thay đổi trong gia đình Việt Nam hiện đại. Cảm ơn tất cả các bạn đã tham gia!”
                  </p>
                </div>

                {/* Play Again Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-base shadow-xl hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" /> CHƠI LẠI
                  </button>
                  <button
                    onClick={() => setScreen('home')}
                    className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-sm transition cursor-pointer"
                  >
                    Trang chủ
                  </button>
                </div>
              </div>

              {/* Right 7 cols: Full Leaderboard Table */}
              <div className="lg:col-span-7 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 space-y-4">
                <h4 className="font-black text-base uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Award className="w-5 h-5" /> BẢNG XẾP HẠNG CHI TIẾT
                </h4>

                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/15 text-xs uppercase text-purple-300">
                        <th className="py-2.5 px-3">Hạng</th>
                        <th className="py-2.5 px-3">Người chơi</th>
                        <th className="py-2.5 px-3 text-center">Số câu đúng</th>
                        <th className="py-2.5 px-3 text-right">Tổng điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-sm">
                      {sortedPlayers.map((p, idx) => (
                        <tr key={p.uid} className="hover:bg-white/5">
                          <td className="py-3 px-3 font-black">
                            {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                          </td>
                          <td className="py-3 px-3 font-bold flex items-center gap-2">
                            <span>{p.avatar}</span>
                            <span>{p.name}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-emerald-300">
                            {p.correctCount || 0} / 12
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-amber-300">
                            {(p.score || 0).toLocaleString()} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full py-3 px-4 text-center text-xs text-purple-300/60 border-t border-white/5">
        Đại Chiến Kiến Thức Gia Đình • Chủ đề: Xây dựng gia đình trong thời kỳ quá độ lên chủ nghĩa xã hội
      </footer>
    </div>
  );
}