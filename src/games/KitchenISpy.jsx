import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// KITCHEN ITEMS BY TIER
// ============================================================================

const TIERS = [
  {
    id: 1,
    name: 'Easy Kitchen',
    items: [
      { word: 'cup', emoji: '\u2615', clue: 'Something you drink from' },
      { word: 'pan', emoji: '\uD83C\uDF73', clue: 'Something flat you cook in' },
      { word: 'pot', emoji: '\uD83C\uDF72', clue: 'You boil water in this' },
      { word: 'lid', emoji: '\uD83E\uDD58', clue: 'It covers a pot' },
      { word: 'mug', emoji: '\uD83C\uDF75', clue: 'A bigger cup with a handle' },
      { word: 'bowl', emoji: '\uD83E\uDD63', clue: 'You eat cereal from this' },
      { word: 'fork', emoji: '\uD83C\uDF74', clue: 'It has pointy ends for picking up food' },
      { word: 'dish', emoji: '\uD83C\uDF7D\uFE0F', clue: 'Another word for a plate' },
      { word: 'sink', emoji: '\uD83D\uDEB0', clue: 'Where you wash your hands' },
      { word: 'oven', emoji: '\u2668\uFE0F', clue: 'You bake cookies inside this' },
    ]
  },
  {
    id: 2,
    name: 'Medium Kitchen',
    items: [
      { word: 'spoon', emoji: '\uD83E\uDD44', clue: 'You stir soup with this' },
      { word: 'plate', emoji: '\uD83C\uDF7D\uFE0F', clue: 'A flat circle you put food on' },
      { word: 'knife', emoji: '\uD83D\uDD2A', clue: 'Be careful! It cuts food' },
      { word: 'stove', emoji: '\uD83D\uDD25', clue: 'It gets hot on top for cooking' },
      { word: 'glass', emoji: '\uD83E\uDD5B', clue: 'You can see through this drink holder' },
      { word: 'towel', emoji: '\uD83E\uDDF4', clue: 'You dry your hands with this' },
      { word: 'apron', emoji: '\uD83E\uDDD1\u200D\uD83C\uDF73', clue: 'Cooks wear this to stay clean' },
      { word: 'timer', emoji: '\u23F0', clue: 'It beeps when food is ready' },
      { word: 'whisk', emoji: '\uD83E\uDD62', clue: 'You mix eggs with this wire tool' },
      { word: 'ladle', emoji: '\uD83E\uDD44', clue: 'A big deep spoon for serving soup' },
    ]
  },
  {
    id: 3,
    name: 'Chef Kitchen',
    items: [
      { word: 'blender', emoji: '\uD83E\uDDCA', clue: 'This makes smoothies' },
      { word: 'toaster', emoji: '\uD83C\uDF5E', clue: 'Makes bread crispy and warm' },
      { word: 'spatula', emoji: '\uD83E\uDD44', clue: 'You flip pancakes with this' },
      { word: 'cabinet', emoji: '\uD83D\uDDC4\uFE0F', clue: 'Doors that hide dishes on the wall' },
      { word: 'counter', emoji: '\uD83E\uDDF1', clue: 'The flat surface you prepare food on' },
      { word: 'freezer', emoji: '\u2744\uFE0F', clue: 'Colder than a fridge, keeps ice cream' },
      { word: 'teapot', emoji: '\uD83E\uDED6', clue: 'You brew tea inside this' },
      { word: 'sponge', emoji: '\uD83E\uDDFD', clue: 'Squishy thing for washing dishes' },
      { word: 'pepper', emoji: '\uD83C\uDF36\uFE0F', clue: 'Spicy seasoning, often next to salt' },
      { word: 'recipe', emoji: '\uD83D\uDCD6', clue: 'Instructions for making a meal' },
    ]
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function KitchenISpy({ progressData, onEndSession, onUpdateGameProgress, onNavigate }) {
  const gameData = progressData.gameProgress?.kitchen || {};
  const completedTiers = gameData.completedTiers || [];

  // Pick the first tier not yet completed, or tier 1
  const initialTier = TIERS.find(t => !completedTiers.includes(t.id)) || TIERS[0];

  const [currentTier, setCurrentTier] = useState(initialTier);
  const [foundItems, setFoundItems] = useState(new Set());
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'close' | 'wrong', message }
  const [showHint, setShowHint] = useState(false);
  const [gameState, setGameState] = useState('playing'); // playing | complete
  const [sessionStart] = useState(Date.now());
  const [stars, setStars] = useState(0);

  const inputRef = useRef(null);

  const items = currentTier.items;
  const unfoundItems = items.filter((_, i) => !foundItems.has(i));
  const currentItem = unfoundItems.length > 0 ? items[currentClueIndex] : null;

  // Advance to next unfound clue
  const advanceClue = useCallback(() => {
    setShowHint(false);
    setInputValue('');
    setFeedback(null);

    // Find next unfound index
    const nextUnfound = items.findIndex((_, i) => i > currentClueIndex && !foundItems.has(i));
    if (nextUnfound >= 0) {
      setCurrentClueIndex(nextUnfound);
    } else {
      // Wrap around
      const wrapped = items.findIndex((_, i) => !foundItems.has(i));
      if (wrapped >= 0) {
        setCurrentClueIndex(wrapped);
      }
    }
  }, [items, currentClueIndex, foundItems]);

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentItem || !inputValue.trim()) return;

    const answer = inputValue.trim().toLowerCase();
    const correct = currentItem.word.toLowerCase();

    if (answer === correct) {
      // Correct!
      const newFound = new Set([...foundItems, currentClueIndex]);
      setFoundItems(newFound);
      setStars(prev => prev + 1);
      setFeedback({ type: 'correct', message: 'You found it!' });

      if (newFound.size >= items.length) {
        // All found -- complete!
        setStars(prev => prev + 3); // bonus stars
        setTimeout(() => setGameState('complete'), 1000);
      } else {
        setTimeout(() => advanceClue(), 1200);
      }
    } else {
      // Check for close match
      const dist = levenshtein(answer, correct);
      if (dist <= 2 && answer.length >= 3) {
        setFeedback({ type: 'close', message: 'Almost! Check your spelling.' });
      } else if (correct.startsWith(answer)) {
        setFeedback({ type: 'close', message: 'Keep going...' });
      } else {
        setFeedback({ type: 'wrong', message: 'Not quite. Try again!' });
      }
    }

    setInputValue('');
  };

  // Handle game completion
  const handleFinish = () => {
    onUpdateGameProgress('kitchen', (prev) => ({
      ...prev,
      completedTiers: [...new Set([...(prev.completedTiers || []), currentTier.id])],
      totalSessions: (prev.totalSessions || 0) + 1,
    }));

    onEndSession({
      game: 'kitchen',
      durationMs: Date.now() - sessionStart,
      wpm: 0,
      accuracy: 100,
      exerciseCount: foundItems.size,
      keysUsed: [],
    });

    onNavigate('#/');
  };

  // Focus input
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentClueIndex]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (gameState === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">{'\uD83C\uDF1F'}</div>
          <h1 className="text-3xl font-bold text-amber-700 mb-2">Kitchen Clear!</h1>
          <p className="text-gray-500 mb-4">You found all {items.length} items in {currentTier.name}</p>
          <div className="bg-amber-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-amber-500">{stars} stars</div>
          </div>

          {/* Show all found items */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1 bg-green-50 rounded-lg px-3 py-1.5">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-medium text-green-700">{item.word}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {TIERS.find(t => t.id > currentTier.id) && (
              <button
                onClick={() => {
                  const next = TIERS.find(t => t.id > currentTier.id);
                  if (next) {
                    setCurrentTier(next);
                    setFoundItems(new Set());
                    setCurrentClueIndex(0);
                    setFeedback(null);
                    setShowHint(false);
                    setGameState('playing');
                  }
                }}
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600"
              >
                Next Kitchen &rarr;
              </button>
            )}
            <button onClick={handleFinish} className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-200">
              Back to menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onNavigate('#/')} className="text-gray-400 hover:text-gray-600 text-sm">
          &larr; Home
        </button>
        <div className="text-center">
          <div className="font-bold text-amber-700">{currentTier.name}</div>
          <div className="text-xs text-gray-400">Found {foundItems.size} of {items.length}</div>
        </div>
        <div className="text-amber-500 font-bold">{stars} {'\u2B50'}</div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(foundItems.size / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Clue card */}
      {currentItem && (
        <div className="mx-4 mb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <div className="text-center mb-2">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">I Spy...</span>
            </div>
            <p className="text-lg text-gray-800 text-center font-medium leading-relaxed">
              {currentItem.clue}
            </p>
            {showHint && (
              <div className="mt-3 text-center">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                  Starts with "{currentItem.word[0].toUpperCase()}"
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kitchen scene - grid of items */}
      <div className="mx-4 mb-4">
        <div className="bg-amber-100/50 rounded-2xl p-3">
          <div className="grid grid-cols-5 gap-2">
            {items.map((item, i) => {
              const isFound = foundItems.has(i);
              const isCurrent = i === currentClueIndex;
              return (
                <div
                  key={i}
                  className={`
                    relative flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all
                    ${isFound ? 'bg-green-100 border-2 border-green-300' : 'bg-white border-2 border-amber-200'}
                    ${isCurrent && !isFound ? 'animate-pulse border-amber-400 shadow-md' : ''}
                  `}
                >
                  <span className="text-2xl mb-1">{item.emoji}</span>
                  <span className={`text-xs font-medium ${isFound ? 'text-green-700' : 'text-gray-300'}`}>
                    {isFound ? item.word : '???'}
                  </span>
                  {isFound && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">{'\u2713'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="mx-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setFeedback(null);
            }}
            placeholder="Type the item name..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none text-gray-800 bg-white"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600"
          >
            Check
          </button>
        </form>

        {/* Feedback */}
        {feedback && (
          <div className={`mt-2 text-center text-sm font-medium rounded-lg py-2 ${
            feedback.type === 'correct' ? 'text-green-700 bg-green-50' :
            feedback.type === 'close' ? 'text-amber-700 bg-amber-50' :
            'text-gray-500 bg-gray-50'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Hint and skip buttons */}
        <div className="flex justify-center gap-4 mt-3">
          {!showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-amber-500 hover:text-amber-700"
            >
              Show hint
            </button>
          )}
          <button
            onClick={advanceClue}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Skip this one
          </button>
        </div>
      </div>
    </div>
  );
}
