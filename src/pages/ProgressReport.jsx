import React, { useMemo } from 'react';
import ProgressionEngine from '../engine/ProgressionEngine';

function StatCard({ label, value, sub, color = 'text-blue-600' }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function KeyBadge({ k, strong }) {
  return (
    <span
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-bold text-sm
        ${strong
          ? 'bg-green-100 text-green-700 border border-green-300'
          : 'bg-red-100 text-red-700 border border-red-300'
        }
      `}
    >
      {k.toUpperCase()}
    </span>
  );
}

export default function ProgressReport({ progressData, onNavigate, onReset }) {
  const report = useMemo(
    () => ProgressionEngine.getReport(progressData),
    [progressData]
  );

  const norms = ProgressionEngine.getNorms(progressData);
  const challengeCode = ProgressionEngine.encodeChallenge(progressData);
  const challengeUrl = challengeCode
    ? `${window.location.origin}${window.location.pathname}#/challenge/${challengeCode}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('#/')}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">Progress Report</h1>
          <div className="w-12" />
        </div>

        {/* Player info */}
        {progressData.profile.name && (
          <div className="text-center mb-4">
            <div className="text-lg font-semibold text-gray-700">
              {progressData.profile.name}
            </div>
            {progressData.profile.ageGroup && (
              <div className="text-sm text-gray-400">Age group: {progressData.profile.ageGroup}</div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">{report.summary}</p>
          {report.comparedToNorm && (
            <div className="mt-2">
              <span
                className={`
                  inline-block px-3 py-1 rounded-full text-xs font-medium
                  ${report.comparedToNorm === 'above expectations'
                    ? 'bg-green-100 text-green-700'
                    : report.comparedToNorm === 'building up'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                  }
                `}
              >
                {report.comparedToNorm === 'above expectations' && 'Above expectations for age group'}
                {report.comparedToNorm === 'on track' && 'On track for age group'}
                {report.comparedToNorm === 'building up' && 'Building skills -- keep practicing!'}
              </span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard
            label="Avg WPM"
            value={report.avgWpm}
            sub={`Goal: ${norms.wpm}`}
            color="text-blue-600"
          />
          <StatCard
            label="Accuracy"
            value={`${report.avgAccuracy}%`}
            sub={`Goal: ${norms.accuracy}%`}
            color="text-green-600"
          />
          <StatCard
            label="Stars"
            value={report.totalStars}
            color="text-amber-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Sessions"
            value={report.sessionsThisWeek}
            sub="this week"
            color="text-purple-600"
          />
          <StatCard
            label="Streak"
            value={`${report.streak} day${report.streak !== 1 ? 's' : ''}`}
            color="text-orange-500"
          />
          <StatCard
            label="Keys Mastered"
            value={report.keysLearned}
            sub="of 26"
            color="text-indigo-600"
          />
        </div>

        {/* Fluency trend */}
        {report.fluencyChange !== 0 && (
          <div className={`rounded-xl p-4 mb-4 ${report.fluencyChange > 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{report.fluencyChange > 0 ? '\u2B06' : '\u2B07'}</span>
              <span className={`text-sm font-medium ${report.fluencyChange > 0 ? 'text-green-700' : 'text-amber-700'}`}>
                Fluency {report.fluencyChange > 0 ? 'improved' : 'dipped'} {Math.abs(report.fluencyChange)}% this week
              </span>
            </div>
          </div>
        )}

        {/* Strong keys */}
        {report.strongKeys.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Mastered Keys</h3>
            <div className="flex flex-wrap gap-2">
              {report.strongKeys.map(k => (
                <KeyBadge key={k} k={k} strong />
              ))}
            </div>
          </div>
        )}

        {/* Weak keys */}
        {report.weakKeys.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Needs Practice</h3>
            <div className="flex flex-wrap gap-2">
              {report.weakKeys.map(k => (
                <KeyBadge key={k} k={k} strong={false} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {report.suggestions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Suggestions</h3>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-400 mt-0.5">&#8226;</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* QR Parent Challenge */}
        {challengeUrl && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Parent Challenge</h3>
            <p className="text-xs text-gray-500 mb-3">
              Share this link with a parent or teacher. They can try a typing challenge
              built from the keys that need the most practice.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 break-all select-all">
              {challengeUrl}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(challengeUrl);
              }}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              Copy link
            </button>
          </div>
        )}

        {/* Reset */}
        <div className="text-center mt-8 mb-4">
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Reset all progress
          </button>
        </div>
      </div>
    </div>
  );
}
