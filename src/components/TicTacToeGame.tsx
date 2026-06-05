/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  User, 
  Cpu, 
  Lock, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { Subscription, GameStats } from '../types';
import { sound } from '../utils/sound';

interface TicTacToeGameProps {
  subscription: Subscription;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onOpenSubscribeTab: () => void;
}

type BoardState = (string | null)[];
type PlayerType = 'X' | 'O';
type ThemeType = 'classic' | 'cyber' | 'forest';

export default function TicTacToeGame({
  subscription,
  stats,
  setStats,
  onOpenSubscribeTab
}: TicTacToeGameProps) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null);
  const [theme, setTheme] = useState<ThemeType>('classic');
  const [freeRoundsLeft, setFreeRoundsLeft] = useState<number>(3);
  const [showPaywallAlert, setShowPaywallAlert] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<string>('');

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // Helper: check winner
  const checkWinner = (squares: BoardState): { winner: string | null; combo: number[] | null } => {
    for (let i = 0; i < winningCombinations.length; i++) {
      const [a, b, c] = winningCombinations[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], combo: winningCombinations[i] };
      }
    }
    return { winner: null, combo: null };
  };

  // Check draw
  const isDraw = (squares: BoardState) => {
    return squares.every(cell => cell !== null);
  };

  const showPremiumWarning = (reason: string) => {
    sound.playGameOver(false);
    setPaywallReason(reason);
    setShowPaywallAlert(true);
  };

  // Handling click on themes or difficulties
  const changeDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    sound.playClick();
    if (diff === 'hard' && !subscription.active) {
      showPremiumWarning('គម្រោង AI កម្រិតពិបាកផ្ដាច់មុខ (Hard AI) គឺសម្រាប់តែសមាជិកបង់ប្រាក់ប៉ុណ្ណោះ។');
      return;
    }
    setAiDifficulty(diff);
    resetBoard();
  };

  const changeTheme = (newTheme: ThemeType) => {
    sound.playClick();
    if (newTheme !== 'classic' && !subscription.active) {
      showPremiumWarning('ស្បែកក្តារពិសេសៗ (Premium Board Themes) ជាមុខងារផ្ដាច់មុខសម្រាប់សមាជិកបង់ប្រាក់ប៉ុណ្ណោះ។');
      return;
    }
    setTheme(newTheme);
  };

  const changeGameMode = (mode: 'pvp' | 'ai') => {
    sound.playClick();
    setGameMode(mode);
    resetBoard();
  };

  // Move handler
  const handleCellClick = (index: number) => {
    if (board[index] || winner || showPaywallAlert) return;

    // Check free trial count for non-subscribers
    if (!subscription.active && freeRoundsLeft <= 0) {
      showPremiumWarning('អ្នកបានប្រើប្រាស់ជុំសាកល្បងឥតគិតថ្លៃអស់ហើយ។ សូមភ្ជាប់គម្រោងដើម្បីបន្តលេងហ្គេមមិនកំណត់!');
      return;
    }

    sound.playMove();

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const winCheck = checkWinner(newBoard);
    if (winCheck.winner) {
      setWinner(winCheck.winner);
      setWinningCombo(winCheck.combo);
      sound.playGameOver(winCheck.winner === 'X');
      updateStats(winCheck.winner);
      consumeFreeRound();
      return;
    }

    if (isDraw(newBoard)) {
      setWinner('draw');
      sound.playClick();
      updateStats('draw');
      consumeFreeRound();
      return;
    }

    setIsXNext(!isXNext);
  };

  const consumeFreeRound = () => {
    if (!subscription.active) {
      setFreeRoundsLeft(prev => Math.max(0, prev - 1));
    }
  };

  const updateStats = (gameResult: string) => {
    setStats(prev => {
      const currentTTT = { ...prev.tictactoe };
      if (gameResult === 'X') {
        currentTTT.wins += 1;
      } else if (gameResult === 'O') {
        currentTTT.losses += 1;
      } else {
        currentTTT.draws += 1;
      }
      return {
        ...prev,
        tictactoe: currentTTT
      };
    });
  };

  // AI Logic - triggered only when gameMode is 'ai' and the next turn is AI's ('O')
  useEffect(() => {
    if (gameMode !== 'ai' || isXNext || winner) return;

    const timer = setTimeout(() => {
      const aiMoveIndex = getAiMove();
      if (aiMoveIndex !== -1) {
        sound.playMove();
        const newBoard = [...board];
        newBoard[aiMoveIndex] = 'O';
        setBoard(newBoard);

        const winCheck = checkWinner(newBoard);
        if (winCheck.winner) {
          setWinner(winCheck.winner);
          setWinningCombo(winCheck.combo);
          sound.playGameOver(false); // AI wins
          updateStats('O');
          consumeFreeRound();
          setIsXNext(true);
          return;
        }

        if (isDraw(newBoard)) {
          setWinner('draw');
          sound.playClick();
          updateStats('draw');
          consumeFreeRound();
          setIsXNext(true);
          return;
        }

        setIsXNext(true);
      }
    }, 600); // 600ms thought delay to look natural

    return () => clearTimeout(timer);
  }, [board, isXNext, gameMode]);

  const getAiMove = (): number => {
    // Collect empty tiles indices
    const availableMoves = board.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[];
    if (availableMoves.length === 0) return -1;

    // Difficulty: Easy
    if (aiDifficulty === 'easy') {
      return getRandomMove(availableMoves);
    }

    // Difficulty: Medium (70% best, 30% random)
    if (aiDifficulty === 'medium') {
      if (Math.random() < 0.3) return getRandomMove(availableMoves);
    }

    // Minimax best move for Hard / Smart medium behavior
    return getBestMove(board, 'O');
  };

  const getRandomMove = (moves: number[]) => {
    return moves[Math.floor(Math.random() * moves.length)];
  };

  // Simple Minimax search for unbeatable AI
  const getBestMove = (currentBoard: BoardState, player: 'O' | 'X'): number => {
    let bestScore = player === 'O' ? -Infinity : Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = player;
        const score = minimax(currentBoard, 0, player === 'O' ? false : true);
        currentBoard[i] = null;

        if (player === 'O') {
          if (score > bestScore) {
            bestScore = score;
            move = i;
          }
        } else {
          if (score < bestScore) {
            bestScore = score;
            move = i;
          }
        }
      }
    }
    return move !== -1 ? move : getRandomMove(currentBoard.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[]);
  };

  // Minimax algorithm helper
  const minimax = (grid: BoardState, depth: number, isMaximizing: boolean): number => {
    const checkState = checkWinner(grid);
    if (checkState.winner === 'O') return 10 - depth;
    if (checkState.winner === 'X') return depth - 10;
    if (isDraw(grid)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (grid[i] === null) {
          grid[i] = 'O';
          const score = minimax(grid, depth + 1, false);
          grid[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (grid[i] === null) {
          grid[i] = 'X';
          const score = minimax(grid, depth + 1, true);
          grid[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const resetBoard = () => {
    sound.playClick();
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningCombo(null);
  };

  // Styling helper for themes
  const getThemeClasses = () => {
    switch (theme) {
      case 'cyber':
        return {
          grid: 'bg-zinc-950 border-purple-500/20 shadow-purple-500/5',
          cell: 'bg-zinc-900/80 border-purple-500/25 hover:bg-zinc-800 text-cyan-400',
          xSign: 'text-rose-500 shadow-rose-500/20 font-bold drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]',
          oSign: 'text-cyan-400 shadow-cyan-400/20 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]',
          winningCell: 'bg-zinc-800 border-yellow-400 text-yellow-300 shadow-lg',
          boardTitle: 'from-pink-500 via-purple-500 to-indigo-500'
        };
      case 'forest':
        return {
          grid: 'bg-emerald-950/20 border-emerald-500/20 shadow-emerald-500/5',
          cell: 'bg-emerald-950/30 border-emerald-700/30 hover:bg-emerald-900/20 text-emerald-300',
          xSign: 'text-amber-500 font-extrabold',
          oSign: 'text-lime-400 font-extrabold',
          winningCell: 'bg-emerald-500/10 border-amber-400 text-amber-300',
          boardTitle: 'from-emerald-400 to-teal-500'
        };
      case 'classic':
      default:
        return {
          grid: 'bg-zinc-900/60 border-zinc-800 shadow-xl',
          cell: 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 text-emerald-400',
          xSign: 'text-amber-500 font-bold',
          oSign: 'text-emerald-400 font-bold',
          winningCell: 'bg-zinc-800 border-emerald-500 text-emerald-300',
          boardTitle: 'from-zinc-100 to-zinc-400'
        };
    }
  };

  const themeConfig = getThemeClasses();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ttt-container">
      
      {/* Dynamic Pop-up alert for locked premium features */}
      {showPaywallAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" id="paywall-alert">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/30">
              <Lock size={28} />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-md font-bold Khmer-font text-white">ចូលរួមជាសមាជិក VIP</h4>
              <p className="text-xs text-zinc-400 Khmer-font leading-relaxed">
                {paywallReason}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { sound.playClick(); setShowPaywallAlert(false); }}
                className="flex-1 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 rounded-xl transition-all Khmer-font"
              >
                លេងធម្មតាសិន
              </button>
              <button
                id="lock-subscribe-btn"
                onClick={() => {
                  sound.playClick();
                  setShowPaywallAlert(false);
                  onOpenSubscribeTab();
                }}
                className="flex-1 py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 Khmer-font shadow-lg shadow-emerald-500/15"
              >
                <Sparkles size={13} /> ភ្ជាប់គម្រោងឥឡូវនេះ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel Column */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Game Stats & Trials badge */}
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/10 border border-amber-500/25 p-2 rounded-xl text-amber-400">
              <Trophy size={18} />
            </div>
            <div>
              <h4 className="text-xs text-zinc-400 Khmer-font font-medium">លទ្ធផលហ្គេមបច្ចុប្បន្ន</h4>
              <div className="flex items-center space-x-1.5 font-mono text-[11px] text-zinc-200 mt-0.5">
                <span className="text-emerald-400">ឈ្នះ: {stats.tictactoe.wins}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-rose-500">ចាញ់: {stats.tictactoe.losses}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">ស្មើ: {stats.tictactoe.draws}</span>
              </div>
            </div>
          </div>

          {!subscription.active && (
            <div className="bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl text-right">
              <span className="block text-[8px] uppercase tracking-wider text-rose-400 font-bold font-sans">FREE TRIAL</span>
              <span className="text-[11px] font-bold text-rose-300 font-sans">{freeRoundsLeft} / 3 ជុំសល់</span>
            </div>
          )}
        </div>

        {/* Setup panel */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-5" id="ttt-settings">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 Khmer-font">ការកំណត់ការលេង (Settings)</h3>

          {/* Mode selector */}
          <div className="space-y-2">
            <span className="text-neutral-400 text-xs Khmer-font">ប្រភេទហ្គេម:</span>
            <div className="bg-zinc-950/80 p-1 border border-zinc-850 rounded-xl grid grid-cols-2 gap-1">
              <button
                id="btn-mode-ai"
                onClick={() => changeGameMode('ai')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 text-xs rounded-lg transition-all ${
                  gameMode === 'ai' 
                    ? 'bg-emerald-500 text-black font-semibold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Cpu size={13} />
                <span className="Khmer-font text-[11px]">លេងជាមួយម៉ាស៊ីន (AI)</span>
              </button>
              
              <button
                id="btn-mode-pvp"
                onClick={() => changeGameMode('pvp')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 text-xs rounded-lg transition-all ${
                  gameMode === 'pvp' 
                    ? 'bg-emerald-500 text-black font-semibold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <User size={13} />
                <span className="Khmer-font text-[11px]">លេង ២ នាក់ (2 Player)</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty Selector */}
          {gameMode === 'ai' && (
            <div className="space-y-2">
              <span className="text-neutral-400 text-xs Khmer-font">ជ្រើសរើស AI:</span>
              <div className="bg-zinc-950/80 p-1 border border-zinc-850 rounded-xl grid grid-cols-3 gap-1">
                <button
                  onClick={() => changeDifficulty('easy')}
                  className={`py-1.5 text-[10px] Khmer-font font-medium rounded-lg transition-all ${
                    aiDifficulty === 'easy' 
                      ? 'bg-zinc-800 text-emerald-400 font-semibold border border-emerald-500/10' 
                      : 'text-zinc-500'
                  }`}
                >
                  កម្រិតងាយ
                </button>
                <button
                  onClick={() => changeDifficulty('medium')}
                  className={`py-1.5 text-[10px] Khmer-font font-medium rounded-lg transition-all ${
                    aiDifficulty === 'medium' 
                      ? 'bg-zinc-800 text-emerald-400 font-semibold border border-emerald-500/10' 
                      : 'text-zinc-500'
                  }`}
                >
                  កម្រិតមធ្យម
                </button>
                <button
                  onClick={() => changeDifficulty('hard')}
                  className={`py-1.5 text-[10px] Khmer-font font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                    aiDifficulty === 'hard' 
                      ? 'bg-zinc-800 text-emerald-400 font-semibold border border-emerald-500/10' 
                      : 'text-zinc-500'
                  }`}
                >
                  {!subscription.active && <Lock size={10} className="text-amber-500 shrink-0" />}
                  <span>កម្រិតពិបាក</span>
                </button>
              </div>
            </div>
          )}

          {/* Theme Selector */}
          <div className="space-y-2">
            <span className="text-neutral-400 text-xs Khmer-font block">ជ្រើសរើសស្បែកក្តារ:</span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => changeTheme('classic')}
                className={`py-2 px-3 border rounded-xl flex items-center justify-between text-xs transition-all ${
                  theme === 'classic' 
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-semibold' 
                    : 'border-zinc-850 bg-zinc-950/40 text-zinc-400'
                }`}
              >
                <span className="Khmer-font text-[11px]">អង្គរវត្តបុរាណ (Classic Gold)</span>
                <span className="text-[10px] font-mono text-zinc-500">Free</span>
              </button>

              <button
                onClick={() => changeTheme('cyber')}
                className={`py-2 px-3 border rounded-xl flex items-center justify-between text-xs transition-all ${
                  theme === 'cyber' 
                    ? 'border-purple-500 bg-purple-500/5 text-cyan-400 font-semibold' 
                    : 'border-zinc-850 bg-zinc-950/40 text-zinc-400'
                }`}
              >
                <span className="Khmer-font text-[11px] flex items-center gap-1.5">
                  {!subscription.active && <Lock size={12} className="text-amber-500" />}
                  អនាគតកាល 2099 (Cyber Khmer)
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                  Pro <Sparkles size={10} className="text-amber-400" />
                </span>
              </button>

              <button
                onClick={() => changeTheme('forest')}
                className={`py-2 px-3 border rounded-xl flex items-center justify-between text-xs transition-all ${
                  theme === 'forest' 
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-semibold' 
                    : 'border-zinc-850 bg-zinc-950/40 text-zinc-400'
                }`}
              >
                <span className="Khmer-font text-[11px] flex items-center gap-1.5">
                  {!subscription.active && <Lock size={12} className="text-amber-500" />}
                  ព្រៃល្បាតធម្មជាតិ (Green Forest)
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                  Pro <Sparkles size={10} className="text-amber-400" />
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Small tips */}
        <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 flex gap-3 text-xs text-zinc-500">
          <Info size={16} className="text-zinc-600 shrink-0 mt-0.5" />
          <p className="Khmer-font text-[11px] leading-relaxed">
            <strong>របៀបលេង:</strong> ចុចលើប្រអប់ទទេនៅលើក្តារដើម្បីដាក់សញ្ញា X របស់លោកអ្នក។ ដើម្បីឈ្នះ លោកអ្នកត្រូវតម្រៀប X ចំនួន ៣ បញ្ឈរ ផ្តេក ឬទ្រេត មុនពេលម៉ាស៊ីនដាក់ O ពេញរួចរាល់។
          </p>
        </div>

      </div>

      {/* Main Tic Tac Toe Board Column */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center" id="ttt-board-section">
        
        {/* Turn Status Panel */}
        <div className="flex items-center justify-between w-full max-w-sm mb-4 px-2">
          <div className="text-xs Khmer-font">
            {winner ? (
              winner === 'draw' ? (
                <span className="bg-zinc-800/80 text-zinc-300 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-zinc-700">
                  <Zap size={13} className="text-zinc-400 animate-pulse" /> លទ្ធផល: ស្មើគ្នា (Draw)!
                </span>
              ) : (
                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" /> ជោគជ័យ: សញ្ញា <span className="font-sans font-bold text-md">{winner}</span> ឈ្នះ!
                </span>
              )
            ) : (
              <span className="bg-zinc-900 border border-zinc-850 text-zinc-400 text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5">
                <Play size={10} className="fill-emerald-500 text-emerald-500 shrink-0" />
                វគ្គលេងបច្ចុប្បន្ន: <strong>សញ្ញា {isXNext ? 'X' : 'O'}</strong>
              </span>
            )}
          </div>

          <button
            id="reset-ttt-board"
            onClick={resetBoard}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-850 hover:text-white text-zinc-400 transition-colors flex items-center gap-1.5 text-xs Khmer-font"
          >
            <RotateCcw size={12} />
            <span>លេងឡើងវិញ</span>
          </button>
        </div>

        {/* 3x3 Board Grid */}
        <div className={`grid grid-cols-3 gap-3 p-3 rounded-2xl w-full max-w-sm border transition-all ${themeConfig.grid}`} id="ttt-board">
          {board.map((cellValue, idx) => {
            const isWinningCell = winningCombo?.includes(idx);
            return (
              <button
                key={idx}
                id={`ttt-cell-${idx}`}
                disabled={cellValue !== null || winner !== null}
                onClick={() => handleCellClick(idx)}
                className={`aspect-square w-full rounded-xl border flex items-center justify-center font-sans text-4xl transform active:scale-95 transition-all outline-none ${
                  isWinningCell 
                    ? themeConfig.winningCell 
                    : themeConfig.cell
                }`}
              >
                {cellValue && (
                  <span className={`inline-block scale-110 font-bold ${
                    cellValue === 'X' ? themeConfig.xSign : themeConfig.oSign
                  }`}>
                    {cellValue}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}
