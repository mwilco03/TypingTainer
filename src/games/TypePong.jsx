import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// WORD LISTS BY LENGTH
// ============================================================================

const WORDS = {
  3: ['cat', 'dog', 'run', 'fun', 'big', 'red', 'hat', 'sun', 'cup', 'map', 'bed', 'fix', 'log', 'pen', 'sit', 'top', 'win', 'job', 'kid', 'let', 'mix', 'now', 'old', 'pop', 'row'],
  4: ['fish', 'jump', 'play', 'tree', 'star', 'blue', 'cake', 'rain', 'bird', 'duck', 'frog', 'game', 'hand', 'joke', 'kite', 'lamp', 'moon', 'nest', 'open', 'park', 'rock', 'ship', 'turn', 'warm', 'yard'],
  5: ['happy', 'dance', 'smile', 'green', 'light', 'water', 'cloud', 'dream', 'fresh', 'globe', 'heart', 'juice', 'lemon', 'music', 'ocean', 'plant', 'quiet', 'river', 'storm', 'tiger'],
  6: ['garden', 'rabbit', 'purple', 'basket', 'window', 'flying', 'sunset', 'bridge', 'castle', 'dinner', 'energy', 'friend', 'gentle', 'island', 'jungle', 'kitten', 'laptop', 'market'],
};

function getWord(level) {
  let pool;
  if (level <= 1) pool = WORDS[3];
  else if (level <= 2) pool = [...WORDS[3], ...WORDS[4]];
  else if (level <= 3) pool = WORDS[4];
  else if (level <= 4) pool = [...WORDS[4], ...WORDS[5]];
  else pool = [...WORDS[5], ...WORDS[6]];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getCrossTime(level) {
  // Seconds for ball to cross the field
  return Math.max(3, 8 - level * 0.8);
}

// ============================================================================
// SOUND
// ============================================================================

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const configs = {
      correct: { freq: 880, dur: 0.03, vol: 0.06 },
      wrong: { freq: 220, dur: 0.1, vol: 0.08 },
      score: { freq: 660, dur: 0.15, vol: 0.1 },
      lose: { freq: 180, dur: 0.3, vol: 0.08 },
      levelUp: { freq: 1040, dur: 0.2, vol: 0.1 },
    };
    const c = configs[type] || configs.correct;
    osc.frequency.value = c.freq;
    gain.gain.value = c.vol;
    osc.start();
    osc.stop(ctx.currentTime + c.dur);
  } catch (e) {}
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TypePong({ progressData, onRecordKeystroke, onEndSession, onUpdateGameProgress, onNavigate }) {
  const [gameState, setGameState] = useState('ready'); // ready | playing | levelComplete | gameOver
  const [level, setLevel] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [word, setWord] = useState('');
  const [typedIndex, setTypedIndex] = useState(0);
  const [ballPosition, setBallPosition] = useState(100); // 0 = player side, 100 = opponent side
  const [ballDirection, setBallDirection] = useState('left'); // left = toward player
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [lastKeyTime, setLastKeyTime] = useState(null);
  const [flash, setFlash] = useState(null); // 'green' | 'red' | null
  const [sessionStart] = useState(Date.now());

  const inputRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const crossTimeRef = useRef(null);

  const targetScore = 5;

  // Start a new rally
  const startRally = useCallback((lvl) => {
    const w = getWord(lvl || level);
    setWord(w);
    setTypedIndex(0);
    setBallPosition(100);
    setBallDirection('left');
    startTimeRef.current = Date.now();
    crossTimeRef.current = getCrossTime(lvl || level) * 1000;
  }, [level]);

  // Ball animation
  useEffect(() => {
    if (gameState !== 'playing' || !word) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / crossTimeRef.current);

      if (ballDirection === 'left') {
        // Moving toward player (100 -> 0)
        setBallPosition(100 - progress * 100);

        if (progress >= 1) {
          // Player missed -- opponent scores
          playSound('lose');
          setOpponentScore(prev => {
            const next = prev + 1;
            if (next >= targetScore) {
              setGameState('gameOver');
            }
            return next;
          });
          // Reset for next rally
          setTimeout(() => {
            if (gameState === 'playing') startRally();
          }, 800);
          return;
        }
      } else {
        // Ball going back to opponent (0 -> 100) -- visual only
        setBallPosition(progress * 100);
        if (progress >= 1) {
          // Start new rally
          startRally();
          return;
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, word, ballDirection, startRally]);

  // Handle keystrokes
  const handleKeyDown = useCallback((e) => {
    if (gameState === 'ready') {
      setGameState('playing');
      startRally();
      return;
    }

    if (gameState === 'levelComplete') {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setPlayerScore(0);
      setOpponentScore(0);
      setGameState('playing');
      startRally(nextLevel);
      return;
    }

    if (gameState !== 'playing' || !word || ballDirection !== 'left') return;

    const typed = e.key;
    if (typed.length !== 1) return;

    e.preventDefault();
    const now = Date.now();
    const iki = lastKeyTime ? now - lastKeyTime : 150;
    setLastKeyTime(now);
    setTotalKeystrokes(prev => prev + 1);

    const expected = word[typedIndex];
    const isCorrect = typed.toLowerCase() === expected.toLowerCase();

    // Report to progression engine
    const prevKey = typedIndex > 0 ? word[typedIndex - 1] : null;
    onRecordKeystroke(expected, isCorrect, iki, prevKey);

    if (isCorrect) {
      playSound('correct');
      setTotalCorrect(prev => prev + 1);
      setFlash('green');
      setTimeout(() => setFlash(null), 100);

      const nextIndex = typedIndex + 1;
      setTypedIndex(nextIndex);

      if (nextIndex >= word.length) {
        // Word completed! Ball bounces back
        playSound('score');
        setWordsCompleted(prev => prev + 1);
        setBallDirection('right');
        startTimeRef.current = Date.now();
        crossTimeRef.current = 600; // Quick bounce back

        setPlayerScore(prev => {
          const next = prev + 1;
          if (next >= targetScore) {
            // Level complete
            playSound('levelUp');
            setTimeout(() => setGameState('levelComplete'), 500);
          }
          return next;
        });
      }
    } else {
      playSound('wrong');
      setFlash('red');
      setTimeout(() => setFlash(null), 200);
    }
  }, [gameState, word, typedIndex, ballDirection, level, lastKeyTime, onRecordKeystroke, startRally]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [gameState]);

  // End game handler
  const handleEndGame = () => {
    const accuracy = totalKeystrokes > 0 ? Math.round((totalCorrect / totalKeystrokes) * 100) : 0;
    const durationMs = Date.now() - sessionStart;
    const wpm = durationMs > 0 ? Math.round((wordsCompleted * 5) / (durationMs / 60000)) : 0;

    onUpdateGameProgress('pong', (prev) => ({
      ...prev,
      highScore: Math.max(prev.highScore || 0, wordsCompleted),
      levelsCleared: Math.max(prev.levelsCleared || 0, level - 1),
      totalSessions: (prev.totalSessions || 0) + 1,
    }));

    onEndSession({
      game: 'pong',
      durationMs,
      wpm,
      accuracy,
      exerciseCount: wordsCompleted,
      keysUsed: [],
    });

    onNavigate('#/');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Ready screen
  if (gameState === 'ready') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <input ref={inputRef} className="opacity-0 absolute pointer-events-none" autoFocus onBlur={(e) => setTimeout(() => e.target?.focus(), 10)} />
        <div className="text-center">
          <div className="text-6xl mb-4">{'\uD83C\uDFD3'}</div>
          <h1 className="text-4xl font-bold text-white mb-4">Type Pong</h1>
          <p className="text-gray-400 mb-2">A word is heading your way!</p>
          <p className="text-gray-400 mb-8">Type it before it reaches your paddle.</p>
          <div className="bg-gray-800 rounded-xl p-6 mb-8 max-w-sm mx-auto">
            <div className="text-left text-gray-300 text-sm space-y-2">
              <p>&#8226; Words bounce toward you</p>
              <p>&#8226; Type the word to bounce it back</p>
              <p>&#8226; Score {targetScore} to advance</p>
              <p>&#8226; Miss and opponent scores</p>
            </div>
          </div>
          <p className="text-green-400 animate-pulse text-lg">Press any key to start</p>
          <button onClick={() => onNavigate('#/')} className="mt-6 text-gray-500 hover:text-gray-300 text-sm">
            &larr; Back to menu
          </button>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameState === 'gameOver') {
    const accuracy = totalKeystrokes > 0 ? Math.round((totalCorrect / totalKeystrokes) * 100) : 0;
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">{level > 1 ? '\uD83C\uDFC6' : '\uD83D\uDCAA'}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Game Over</h1>
          <p className="text-gray-400 mb-6">Level {level} reached</p>
          <div className="bg-gray-800 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{wordsCompleted}</div>
              <div className="text-xs text-gray-500">Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                setLevel(1);
                setPlayerScore(0);
                setOpponentScore(0);
                setTotalCorrect(0);
                setTotalKeystrokes(0);
                setWordsCompleted(0);
                setGameState('ready');
              }}
              className="w-48 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600"
            >
              Play Again
            </button>
            <br />
            <button onClick={handleEndGame} className="text-gray-400 hover:text-white text-sm mt-4">
              Back to menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Level complete screen
  if (gameState === 'levelComplete') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <input ref={inputRef} className="opacity-0 absolute pointer-events-none" autoFocus onBlur={(e) => setTimeout(() => e.target?.focus(), 10)} />
        <div className="text-center">
          <div className="text-6xl mb-4">{'\u2B50'}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Level {level} Complete!</h1>
          <p className="text-gray-400 mb-8">Get ready for faster words...</p>
          <p className="text-green-400 animate-pulse">Press any key to continue</p>
        </div>
      </div>
    );
  }

  // Playing screen
  const ballLeft = `${ballPosition}%`;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col select-none">
      <input ref={inputRef} className="opacity-0 absolute pointer-events-none" autoFocus onBlur={(e) => setTimeout(() => e.target?.focus(), 10)} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={handleEndGame} className="text-gray-500 hover:text-gray-300 text-sm">
          &larr; Quit
        </button>
        <div className="text-gray-500 text-sm font-medium">Level {level}</div>
        <div className="w-12" />
      </div>

      {/* Score */}
      <div className="flex justify-center gap-8 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400">{playerScore}</div>
          <div className="text-xs text-gray-500">You</div>
        </div>
        <div className="text-gray-600 text-2xl font-light self-center">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-400">{opponentScore}</div>
          <div className="text-xs text-gray-500">CPU</div>
        </div>
      </div>

      {/* Court */}
      <div className="flex-1 relative mx-4 mb-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-700" />

        {/* Player paddle (left) */}
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/30"
          style={{ height: '80px' }}
        />

        {/* Opponent paddle (right) */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 rounded-full bg-red-400 shadow-lg shadow-red-400/30"
          style={{ height: '80px' }}
        />

        {/* Ball / Word */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-none"
          style={{ left: ballLeft }}
        >
          <div
            className={`
              px-4 py-2 rounded-full font-mono text-xl font-bold
              shadow-lg
              ${flash === 'green' ? 'bg-green-500 shadow-green-400/50' : flash === 'red' ? 'bg-red-500 shadow-red-400/50' : 'bg-white shadow-white/20'}
            `}
          >
            {word.split('').map((char, i) => (
              <span
                key={i}
                className={
                  i < typedIndex
                    ? 'text-green-600'
                    : i === typedIndex
                    ? 'text-gray-900 underline decoration-2 decoration-blue-400'
                    : 'text-gray-400'
                }
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar showing ball travel */}
      <div className="mx-4 mb-4">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-none ${ballDirection === 'left' ? 'bg-red-400' : 'bg-green-400'}`}
            style={{ width: `${100 - ballPosition}%` }}
          />
        </div>
      </div>
    </div>
  );
}
