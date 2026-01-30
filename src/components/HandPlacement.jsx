import React, { useState, useEffect } from 'react';

// --- Finger color scheme ---
const FINGER_COLORS = {
  leftPinky:   '#ef4444',
  leftRing:    '#f97316',
  leftMiddle:  '#eab308',
  leftIndex:   '#22c55e',
  rightIndex:  '#22c55e',
  rightMiddle: '#eab308',
  rightRing:   '#f97316',
  rightPinky:  '#ef4444',
  thumb:       '#8b5cf6',
};

// Map each key to its owning finger
const KEY_FINGER = {
  Q: 'leftPinky',  W: 'leftRing',  E: 'leftMiddle', R: 'leftIndex',  T: 'leftIndex',
  Y: 'rightIndex', U: 'rightIndex', I: 'rightMiddle', O: 'rightRing', P: 'rightPinky',
  A: 'leftPinky',  S: 'leftRing',  D: 'leftMiddle', F: 'leftIndex',  G: 'leftIndex',
  H: 'rightIndex', J: 'rightIndex', K: 'rightMiddle', L: 'rightRing', ';': 'rightPinky',
  Z: 'leftPinky',  X: 'leftRing',  C: 'leftMiddle', V: 'leftIndex',  B: 'leftIndex',
  N: 'rightIndex', M: 'rightIndex', ',': 'rightMiddle', '.': 'rightRing', '/': 'rightPinky',
  Space: 'thumb',
};

// Keyboard rows
const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
];

const HOME_ROW_KEYS = ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'];

// --- Step definitions ---
const STEPS = [
  {
    title: 'Find the F and J keys',
    description: 'Look at your keyboard. The F and J keys have small bumps on them. These bumps help your fingers find the right spot without looking!',
    highlightKeys: ['F', 'J'],
    colorKeys: [],
    showBumps: true,
    showThumbs: false,
    pulseAll: false,
  },
  {
    title: 'Place your index fingers on F and J',
    description: 'Put your left index finger on the F key and your right index finger on the J key. Feel the bumps? That means you\'re in the right place!',
    highlightKeys: ['F', 'J'],
    colorKeys: ['F', 'J'],
    showBumps: true,
    showThumbs: false,
    pulseAll: false,
  },
  {
    title: 'Let your other fingers rest naturally',
    description: 'Curl your fingers slightly and let each one rest on the key next to it. Your fingers should gently sit on the home row.',
    highlightKeys: HOME_ROW_KEYS,
    colorKeys: HOME_ROW_KEYS,
    showBumps: true,
    showThumbs: false,
    pulseAll: false,
  },
  {
    title: 'Thumbs hover over the space bar',
    description: 'Let both of your thumbs hang relaxed right above the big space bar at the bottom. You can use either thumb to press it!',
    highlightKeys: [...HOME_ROW_KEYS, 'Space'],
    colorKeys: [...HOME_ROW_KEYS, 'Space'],
    showBumps: true,
    showThumbs: true,
    pulseAll: false,
  },
  {
    title: 'Great! This is your home position',
    description: 'Always return your fingers here after pressing any key. This is your home base -- like a cozy nest for your fingers!',
    highlightKeys: [...HOME_ROW_KEYS, 'Space'],
    colorKeys: [...HOME_ROW_KEYS, 'Space'],
    showBumps: true,
    showThumbs: true,
    pulseAll: true,
  },
];

// Keys the student must press to advance each step
const STEP_REQUIRED_KEYS = [
  ['f', 'j'],                                    // Step 0: Find F and J
  ['f', 'j'],                                    // Step 1: Place index fingers
  ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],    // Step 2: All home row
  [' '],                                          // Step 3: Space bar
  null,                                           // Step 4: Any key to finish
];

// --- CSS keyframes injected once ---
const KEYFRAME_STYLES = `
@keyframes fingerLand {
  0%   { transform: scale(0.7) translateY(-12px); opacity: 0; }
  60%  { transform: scale(1.08) translateY(0); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes gentlePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  50%      { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.18); }
}
@keyframes bumpBounce {
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(1.6); }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes thumbFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
@keyframes confettiBurst {
  0%   { transform: scale(0); opacity: 1; }
  50%  { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
`;

// --- Sub-components ---

function KeyboardKey({ label, isHighlighted, fingerColor, showBump, doPulse, animDelay, isPressed }) {
  const isSpace = label === 'Space';

  const baseClasses = [
    'flex items-center justify-center rounded-lg font-bold select-none relative',
    'border-2 transition-all duration-300',
    isSpace ? 'h-11' : 'w-11 h-11 sm:w-12 sm:h-12',
  ].join(' ');

  const bgColor = fingerColor
    ? fingerColor
    : isHighlighted
      ? '#e0e7ff'
      : '#f3f4f6';

  const borderColor = fingerColor
    ? fingerColor
    : isHighlighted
      ? '#818cf8'
      : '#d1d5db';

  const textColor = fingerColor ? '#fff' : isHighlighted ? '#312e81' : '#6b7280';

  const style = {
    backgroundColor: bgColor,
    borderColor: borderColor,
    color: textColor,
    fontSize: isSpace ? '0.75rem' : '0.85rem',
    width: isSpace ? '14rem' : undefined,
    animation: fingerColor
      ? `fingerLand 0.45s ${animDelay}s cubic-bezier(0.34, 1.56, 0.64, 1) both`
      : 'none',
    boxShadow: fingerColor
      ? `0 4px 12px ${fingerColor}44, inset 0 1px 0 rgba(255,255,255,0.25)`
      : isHighlighted
        ? '0 2px 8px rgba(129, 140, 248, 0.25)'
        : '0 1px 2px rgba(0,0,0,0.06)',
  };

  if (doPulse && fingerColor) {
    style.animation = `gentlePulse 2s ease-in-out infinite, fingerLand 0.45s ${animDelay}s cubic-bezier(0.34, 1.56, 0.64, 1) both`;
  }

  if (isPressed) {
    style.boxShadow = '0 0 0 3px #22c55e, 0 0 12px rgba(34, 197, 94, 0.4)';
    style.transform = 'scale(0.95)';
  }

  return (
    <div className={baseClasses} style={style}>
      {label === ';' ? '; ' : label === 'Space' ? 'SPACE' : label}
      {/* Pressed checkmark */}
      {isPressed && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
      {/* Bump indicator for F and J */}
      {showBump && (label === 'F' || label === 'J') && (
        <span
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '14px',
            height: '3px',
            borderRadius: '2px',
            backgroundColor: fingerColor ? 'rgba(255,255,255,0.7)' : '#818cf8',
            animation: !fingerColor ? 'bumpBounce 1.2s ease-in-out infinite' : 'none',
          }}
        />
      )}
    </div>
  );
}

function FingerLabel({ name, color }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className="inline-block w-3 h-3 rounded-full border border-white/50"
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}66` }}
      />
      <span className="text-gray-600 whitespace-nowrap">{name}</span>
    </div>
  );
}

function FingerLegend() {
  const entries = [
    ['Pinky', FINGER_COLORS.leftPinky],
    ['Ring', FINGER_COLORS.leftRing],
    ['Middle', FINGER_COLORS.leftMiddle],
    ['Index', FINGER_COLORS.leftIndex],
    ['Thumb', FINGER_COLORS.thumb],
  ];
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
      {entries.map(([name, color]) => (
        <FingerLabel key={name} name={name} color={color} />
      ))}
    </div>
  );
}

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-500"
          style={{
            width: i === currentStep ? '2rem' : '0.5rem',
            height: '0.5rem',
            backgroundColor: i <= currentStep ? '#6366f1' : '#d1d5db',
          }}
        />
      ))}
    </div>
  );
}

// Hand silhouette SVG shown beside the keyboard during thumb step
function ThumbIndicator({ side }) {
  const isLeft = side === 'left';
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        bottom: '-2px',
        [isLeft ? 'left' : 'right']: isLeft ? '25%' : '25%',
        transform: `translateX(${isLeft ? '-50%' : '50%'})`,
        animation: 'thumbFloat 2s ease-in-out infinite',
        animationDelay: isLeft ? '0s' : '0.3s',
      }}
    >
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
        <ellipse
          cx="14" cy="10" rx="12" ry="7"
          fill={FINGER_COLORS.thumb}
          opacity="0.85"
        />
        <ellipse
          cx="14" cy="10" rx="12" ry="7"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
      </svg>
      <span className="text-xs mt-0.5 font-medium" style={{ color: FINGER_COLORS.thumb }}>
        {isLeft ? 'L' : 'R'}
      </span>
    </div>
  );
}

// --- Main component ---

export default function HandPlacement({ onComplete }) {
  const [step, setStep] = useState(0);
  const [pressedKeys, setPressedKeys] = useState(new Set());

  const isLastStep = step === STEPS.length - 1;
  const isFinalReady = step === STEPS.length; // past the last instructional step
  const current = isFinalReady ? STEPS[STEPS.length - 1] : STEPS[step];

  const goNext = () => {
    if (isLastStep) {
      setStep(STEPS.length); // move to "Ready" screen
    } else if (isFinalReady) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (isFinalReady) {
      setStep(STEPS.length - 1);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  // Reset pressed keys when step changes
  useEffect(() => {
    setPressedKeys(new Set());
  }, [step]);

  // Keyboard: space to skip, required keys to advance
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.length !== 1) return; // ignore modifiers
      e.preventDefault();
      const key = e.key.toLowerCase();

      // Space skips onboarding on early steps (before space is taught)
      if (key === ' ' && step < 3) {
        onComplete();
        return;
      }

      // Final ready screen — any key completes
      if (step === STEPS.length) {
        onComplete();
        return;
      }

      // Last instructional step — any key advances to ready screen
      if (step === STEPS.length - 1) {
        setStep(STEPS.length);
        return;
      }

      // Track key press for step advancement
      setPressedKeys(prev => new Set([...prev, key]));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, onComplete]);

  // Advance when all required keys for the current step are pressed
  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const required = STEP_REQUIRED_KEYS[step];
    if (!required) return;
    if (required.every(k => pressedKeys.has(k))) {
      setStep(s => s + 1);
    }
  }, [pressedKeys, step]);

  // Determine which keys get colored for current step
  const colorSet = new Set(current.colorKeys);
  const highlightSet = new Set(current.highlightKeys);

  // Compute animation delay stagger for colored keys
  const colorKeyOrder = current.colorKeys;
  const getDelay = (key) => {
    const idx = colorKeyOrder.indexOf(key);
    return idx >= 0 ? idx * 0.08 : 0;
  };

  // Which required keys has the student pressed so far?
  const requiredSet = step < STEPS.length && STEP_REQUIRED_KEYS[step]
    ? new Set(STEP_REQUIRED_KEYS[step])
    : null;

  return (
    <>
      {/* Inject keyframes */}
      <style>{KEYFRAME_STYLES}</style>

      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl"
          key={step} // re-mount on step change so animations replay
          style={{ animation: 'fadeSlideIn 0.5s ease-out both' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <span>Hand Placement Guide</span>
            </div>

            {!isFinalReady && (
              <StepIndicator currentStep={step} totalSteps={STEPS.length} />
            )}

            {isFinalReady ? (
              <>
                <h1
                  className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2"
                  style={{ animation: 'confettiBurst 0.6s ease-out both' }}
                >
                  You're all set!
                </h1>
                <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto">
                  Your fingers know where to go. Time to start typing!
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">
                  {current.title}
                </h1>
                <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  {current.description}
                </p>
              </>
            )}
          </div>

          {/* Keyboard visualization */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col items-center gap-1.5">
              {ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1.5" style={{ marginLeft: ri === 1 ? '12px' : ri === 2 ? '24px' : '0' }}>
                  {row.map((key) => {
                    const isColored = colorSet.has(key);
                    const isHL = highlightSet.has(key);
                    const finger = KEY_FINGER[key];
                    return (
                      <KeyboardKey
                        key={`${step}-${key}`}
                        label={key}
                        isHighlighted={isHL}
                        fingerColor={isColored ? FINGER_COLORS[finger] : null}
                        showBump={current.showBumps}
                        doPulse={current.pulseAll}
                        animDelay={getDelay(key)}
                        isPressed={requiredSet && requiredSet.has(key.toLowerCase()) && pressedKeys.has(key.toLowerCase())}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Space bar row */}
              <div className="flex justify-center mt-1 relative" style={{ width: '100%' }}>
                {current.showThumbs && (
                  <>
                    <ThumbIndicator side="left" />
                    <ThumbIndicator side="right" />
                  </>
                )}
                <KeyboardKey
                  key={`${step}-Space`}
                  label="Space"
                  isHighlighted={highlightSet.has('Space')}
                  fingerColor={colorSet.has('Space') ? FINGER_COLORS.thumb : null}
                  showBump={false}
                  doPulse={current.pulseAll}
                  animDelay={getDelay('Space')}
                  isPressed={requiredSet && requiredSet.has(' ') && pressedKeys.has(' ')}
                />
              </div>
            </div>

            {/* Finger legend -- show when colors are visible */}
            {current.colorKeys.length > 0 && <FingerLegend />}
          </div>

          {/* Keyboard hint */}
          {!isFinalReady && (
            <p className="text-center text-xs text-gray-400 mb-4">
              {step < 3
                ? 'Press the highlighted keys to continue \u00B7 space to skip'
                : step === 3
                ? 'Press the space bar'
                : 'Press any key to continue'}
            </p>
          )}
          {isFinalReady && (
            <p className="text-center text-xs text-gray-400 mb-4">
              Press any key to start typing!
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Back button */}
            {step > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-px">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
            ) : (
              <div /> // spacer
            )}

            {/* Step counter */}
            {!isFinalReady && (
              <span className="text-xs text-gray-400 font-medium">
                {step + 1} / {STEPS.length}
              </span>
            )}

            {/* Next / Ready button */}
            {isFinalReady ? (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl text-base font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  animation: 'gentlePulse 2s ease-in-out infinite',
                }}
              >
                Ready to type!
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
              >
                {isLastStep ? 'Finish' : 'Next'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-px">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
