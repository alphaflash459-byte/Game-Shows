/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { 
  Play, 
  RotateCcw, 
  User, 
  Cpu, 
  Lock, 
  Trophy, 
  Info,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Subscription, GameStats } from '../types';
import { sound } from '../utils/sound';

interface ChessGameProps {
  subscription: Subscription;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onOpenSubscribeTab: () => void;
}

// Map piece types & colors to beautiful high-contrast unicode symbols
const pieceUnicodeMap: { [key: string]: { [color: string]: string } } = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' }
};

export default function ChessGame({
  subscription,
  stats,
  setStats,
  onOpenSubscribeTab
}: ChessGameProps) {
  const chessRef = useRef<Chess | null>(null);
  const [board, setBoard] = useState<any[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [isAiTurn, setIsAiTurn] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameStatus, setGameStatus] = useState<string>('START'); // START, PLAYING, CHECK, CHECKMATE, DRAW
  const [statusMessage, setStatusMessage] = useState<string>('ដល់វេនកូនពណ៌ស (White to move)');
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] });
  const [moveCount, setMoveCount] = useState<number>(0);
  const [chessTheme, setChessTheme] = useState<'classic' | 'cyber' | 'royal'>('classic');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [showPaywallAlert, setShowPaywallAlert] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<string>('');

  // Initialization
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const freshChess = new Chess();
    chessRef.current = freshChess;
    setBoard(freshChess.board());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameStatus('PLAYING');
    setMoveCount(0);
    setCapturedPieces({ white: [], black: [] });
    setIsAiTurn(false);
    setStatusMessage('ដល់វេនកូនពណ៌ស (White to move) — សូមចាប់ផ្តើម!');
  };

  const showPremiumWarning = (reason: string) => {
    sound.playGameOver(false);
    setPaywallReason(reason);
    setShowPaywallAlert(true);
  };

  const changeDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    sound.playClick();
    if (diff === 'hard' && !subscription.active) {
      showPremiumWarning('គម្រោង AI ប្រកួតប្រជែងកម្រិតខ្ពស់ (Expert AI) គឺសម្រាប់តែសមាជិកបង់ប្រាក់ VIP ប៉ុណ្ណោះ។');
      return;
    }
    setAiDifficulty(diff);
    initGame();
  };

  const changeTheme = (newTheme: 'classic' | 'cyber' | 'royal') => {
    sound.playClick();
    if (newTheme !== 'classic' && !subscription.active) {
      showPremiumWarning('ស្បែកក្តារអុកប្រណីត (Angkor Gold / Cyber Neon Chess) សម្រាប់តែសមាជិកបង់ប្រាក់សកម្មប៉ុណ្ណោះ។');
      return;
    }
    setChessTheme(newTheme);
  };

  const changeGameMode = (mode: 'pvp' | 'ai') => {
    sound.playClick();
    setGameMode(mode);
    initGame();
  };

  // Human Cell Click Handler
  const handleCellClick = (squareRepresentation: Square) => {
    if (!chessRef.current || gameStatus === 'CHECKMATE' || gameStatus === 'DRAW' || isAiTurn || showPaywallAlert) return;

    // Premium Check: limits on total moves for free users (e.g. 10 moves max)
    if (!subscription.active && moveCount >= 10) {
      showPremiumWarning('អ្នកបានប្រើប្រាស់ការលេងសាកល្បងហ្គេមអុកឥតគិតថ្លៃគ្រប់ ១០ ផ្លូវដើរហើយ។ សូមភ្ជាប់គម្រោងដើម្បីបន្តលេងលំដាប់ខ្ពស់!');
      return;
    }

    const chess = chessRef.current;
    
    // Check if square is already selected
    if (selectedSquare === squareRepresentation) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // Try to perform a move if click target is a possible move legal option
    if (possibleMoves.includes(squareRepresentation)) {
      performMove(selectedSquare!, squareRepresentation);
      return;
    }

    const piece = chess.get(squareRepresentation);
    // Standard validation: prevent selecting opponent's piece if not your move
    if (piece && piece.color === chess.turn()) {
      // Find legal moves for this piece
      const moves = chess.moves({ square: squareRepresentation, verbose: true }) as any[];
      const legalTargetSquares = moves.map(m => m.to as Square);
      setSelectedSquare(squareRepresentation);
      setPossibleMoves(legalTargetSquares);
      sound.playClick();
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Perform Move Logic (updates state and handles captures)
  const performMove = (from: Square, to: Square) => {
    const chess = chessRef.current;
    if (!chess) return;

    try {
      const pieceToMove = chess.get(from);
      const targetPiece = chess.get(to);

      // Perform standard chess move
      const move = chess.move({ from, to, promotion: 'q' }); // Auto promoting to Queen for simplification
      if (!move) return;

      sound.playMove();

      // Process captured pieces logs
      if (targetPiece) {
        if (targetPiece.color === 'w') {
          setCapturedPieces(prev => ({ ...prev, white: [...prev.white, targetPiece.type] }));
        } else {
          setCapturedPieces(prev => ({ ...prev, black: [...prev.black, targetPiece.type] }));
        }
      }

      // Sync React state
      setBoard(chess.board());
      setSelectedSquare(null);
      setPossibleMoves([]);
      setMoveCount(prev => prev + 1);

      // Analyze game state flags
      updateGameStateFlags();

    } catch (e) {
      console.error(e);
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const updateGameStateFlags = () => {
    const chess = chessRef.current;
    if (!chess) return;

    if (chess.isCheckmate()) {
      setGameStatus('CHECKMATE');
      const winningColor = chess.turn() === 'w' ? 'Black (ខ្មៅ)' : 'White (ស)';
      setStatusMessage(`🔴 CHECKMATE! ខាងកូន ${winningColor} ឈ្នះការប្រកួតយ៉ាងអស្ចារ្យ!`);
      sound.playGameOver(chess.turn() === 'b'); // Win if we are White and black just played (turn is white now)
      updateStats(chess.turn() === 'b' ? 'w' : 'b');
    } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
      setGameStatus('DRAW');
      setStatusMessage('🤝 ស្មើគ្នា (Draw / Stalemate)! គ្មានអ្នកឈ្នះឡើយ។');
      sound.playClick();
      updateStats('draw');
    } else if (chess.inCheck()) {
      setGameStatus('PLAYING');
      const criticalTeam = chess.turn() === 'w' ? 'White (ស)' : 'Black (ខ្មៅ)';
      setStatusMessage(`⚠️ CHECK! ស្តេចរបស់កូន ${criticalTeam} កំពុងរងការគំរាមកំហែង!`);
      sound.playGameOver(false);
      triggerAiIfApplicable();
    } else {
      setGameStatus('PLAYING');
      const nextTurnStr = chess.turn() === 'w' ? 'ស (White)' : 'ខ្មៅ (Black)';
      setStatusMessage(`ដល់វេនកូន ${nextTurnStr} ដើរ។`);
      triggerAiIfApplicable();
    }
  };

  const triggerAiIfApplicable = () => {
    const chess = chessRef.current;
    if (!chess) return;

    if (gameMode === 'ai' && chess.turn() === 'b') {
      setIsAiTurn(true);
    }
  };

  const updateStats = (winnerColor: 'w' | 'b' | 'draw') => {
    setStats(prev => {
      const currentChess = { ...prev.chess };
      if (winnerColor === 'w') currentChess.wins += 1;
      else if (winnerColor === 'b') currentChess.losses += 1;
      else currentChess.draws += 1;
      return { ...prev, chess: currentChess };
    });
  };

  // AI Thinker Effect Loop
  useEffect(() => {
    if (!isAiTurn || gameStatus === 'CHECKMATE' || gameStatus === 'DRAW' || !chessRef.current) return;

    const aiDelay = setTimeout(() => {
      processAiTurn();
    }, 800); // Natural visual delay

    return () => clearTimeout(aiDelay);
  }, [isAiTurn]);

  const processAiTurn = () => {
    const chess = chessRef.current;
    if (!chess) return;

    const possibleMovesList = chess.moves({ verbose: true });
    if (possibleMovesList.length === 0) {
      setIsAiTurn(false);
      return;
    }

    let chosenMove: any = null;

    if (aiDifficulty === 'easy') {
      // Pick random
      chosenMove = possibleMovesList[Math.floor(Math.random() * possibleMovesList.length)];
    } else if (aiDifficulty === 'medium') {
      // 70% heuristics capture, 30% random
      const captures = possibleMovesList.filter(m => m.captured);
      if (captures.length > 0 && Math.random() < 0.70) {
        chosenMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        chosenMove = possibleMovesList[Math.floor(Math.random() * possibleMovesList.length)];
      }
    } else {
      // Smart: prioritize high value captures or safe moves
      const checkmateMoves = possibleMovesList.filter(m => m.san.includes('#'));
      const checkMoves = possibleMovesList.filter(m => m.san.includes('+'));
      const captures = possibleMovesList.filter(m => m.captured);

      if (checkmateMoves.length > 0) {
        chosenMove = checkmateMoves[0];
      } else if (captures.length > 0) {
        // Sort captures by piece value
        const pieceValues: { [key: string]: number } = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 999 };
        captures.sort((a, b) => (pieceValues[b.captured!] || 0) - (pieceValues[a.captured!] || 0));
        chosenMove = captures[0];
      } else if (checkMoves.length > 0) {
        chosenMove = checkMoves[0];
      } else {
        // Safe standard minimax heuristic (prevent walking into open attacks if possible)
        chosenMove = possibleMovesList[Math.floor(Math.random() * possibleMovesList.length)];
      }
    }

    if (chosenMove) {
      const pieceToMove = chess.get(chosenMove.from);
      const targetPiece = chess.get(chosenMove.to);

      chess.move({ from: chosenMove.from, to: chosenMove.to, promotion: 'q' });
      sound.playMove();

      if (targetPiece) {
        setCapturedPieces(prev => ({ ...prev, white: [...prev.white, targetPiece.type] }));
      }

      setBoard(chess.board());
      setMoveCount(prev => prev + 1);
    }

    setIsAiTurn(false);
    updateGameStateFlags();
  };

  // Styled Board theme mapper
  const getThemeColors = () => {
    switch (chessTheme) {
      case 'cyber':
        return {
          lightSq: 'bg-zinc-900 border border-purple-500/10 text-cyan-400',
          darkSq: 'bg-purple-950/20 text-indigo-300',
          boardBorder: 'border-2 border-purple-500/20 shadow-purple-550/10',
          selectedSq: 'ring-4 ring-cyan-500 bg-cyan-500/20',
          possMoveSq: 'after:content-[""] after:w-3.5 after:h-3.5 after:bg-rose-500/50 after:rounded-full flex items-center justify-center',
          cellText: 'font-mono text-zinc-650'
        };
      case 'royal':
        return {
          lightSq: 'bg-amber-50/90 text-amber-900 border border-amber-900/5',
          darkSq: 'bg-yellow-700/80 text-amber-50',
          boardBorder: 'border-4 border-yellow-800 shadow-amber-950/25',
          selectedSq: 'ring-4 ring-yellow-400 bg-yellow-400/20',
          possMoveSq: 'after:content-[""] after:w-3.5 after:h-3.5 after:bg-emerald-400/60 after:rounded-full flex items-center justify-center',
          cellText: 'font-sans text-amber-950/40'
        };
      case 'classic':
      default:
        return {
          lightSq: 'bg-[#eeeed2] text-[#769656] font-semibold',
          darkSq: 'bg-[#769656] text-[#eeeed2]',
          boardBorder: 'border-4 border-zinc-850 shadow-2xl',
          selectedSq: 'ring-4 ring-amber-400 bg-amber-400/25',
          possMoveSq: 'after:content-[""] after:w-4 after:h-4 after:bg-emerald-500/40 after:rounded-full flex items-center justify-center',
          cellText: 'font-sans opacity-30 text-xs'
        };
    }
  };

  const boardTheme = getThemeColors();

  // Helper to get alphanumeric coords
  const getSquareName = (rowIndex: number, colIndex: number): Square => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return (files[colIndex] + ranks[rowIndex]) as Square;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="chess-main-view">
      
      {/* Paywall popup overlay */}
      {showPaywallAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" id="chess-paywall">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">
              <Lock size={28} />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-md font-bold Khmer-font text-white">ភ្ជាប់គម្រោង VIP ដើម្បីលេងអុកគ្មានដែនកំណត់</h4>
              <p className="text-xs text-zinc-400 Khmer-font leading-relaxed">
                {paywallReason}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { sound.playClick(); setShowPaywallAlert(false); }}
                className="flex-1 py-12 px-3 text-xs text-zinc-400 hover:text-white bg-zinc-900 rounded-xl transition-all Khmer-font"
              >
                លេងធម្មតាសិន
              </button>
              <button
                id="lock-subscribe-chess"
                onClick={() => {
                  sound.playClick();
                  setShowPaywallAlert(false);
                  onOpenSubscribeTab();
                }}
                className="flex-1 py-12 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 Khmer-font shadow-lg shadow-emerald-500/10"
              >
                <Sparkles size={13} /> ភ្ជាប់គម្រោងឥឡូវនេះ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chess Configurations Panel */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Game Stats & Trials badge */}
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/10 border border-amber-500/25 p-2 rounded-xl text-amber-400">
              <Trophy size={18} />
            </div>
            <div>
              <h4 className="text-xs text-zinc-400 Khmer-font font-medium">លទ្ធផលហ្គេមអុកប្រកួត</h4>
              <div className="flex items-center space-x-1.5 font-mono text-[11px] text-zinc-200 mt-0.5">
                <span className="text-emerald-400">ឈ្នះ: {stats.chess.wins}</span>
                <span className="text-zinc-650">•</span>
                <span className="text-rose-500">ចាញ់: {stats.chess.losses}</span>
                <span className="text-zinc-650">•</span>
                <span className="text-zinc-400">ស្មើ: {stats.chess.draws}</span>
              </div>
            </div>
          </div>

          {!subscription.active && (
            <div className="bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl text-right">
              <span className="block text-[8px] uppercase tracking-wider text-rose-400 font-bold font-sans">LIMIT</span>
              <span className="text-[11px] font-bold text-rose-300 font-sans">{moveCount} / 10 ផ្លូវ</span>
            </div>
          )}
        </div>

        {/* Configurations Box */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-5" id="chess-side-panel">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 Khmer-font">ការកំណត់ហ្គេមអុក (Chess Settings)</h3>

          {/* Mode Selector */}
          <div className="space-y-2">
            <span className="text-neutral-400 text-xs Khmer-font">របៀបលេង:</span>
            <div className="bg-zinc-950 p-1 border border-zinc-850 rounded-xl grid grid-cols-2 gap-1">
              <button
                id="chess-mode-ai"
                onClick={() => changeGameMode('ai')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 text-xs rounded-lg transition-all ${
                  gameMode === 'ai' 
                    ? 'bg-emerald-500 text-black font-semibold' 
                    : 'text-zinc-400'
                }`}
              >
                <Cpu size={13} />
                <span className="Khmer-font text-[11px]">លេងទល់ម៉ាស៊ីន (AI)</span>
              </button>
              
              <button
                id="chess-mode-pvp"
                onClick={() => changeGameMode('pvp')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 text-xs rounded-lg transition-all ${
                  gameMode === 'pvp' 
                    ? 'bg-emerald-500 text-black font-semibold' 
                    : 'text-zinc-400'
                }`}
              >
                <User size={13} />
                <span className="Khmer-font text-[11px]">លេង ២ នាក់ (2 Player)</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty */}
          {gameMode === 'ai' && (
            <div className="space-y-2">
              <span className="text-neutral-400 text-xs Khmer-font">កម្រិតវៃឆ្លាតរបស់ AI:</span>
              <div className="bg-zinc-950 p-1 border border-zinc-850 rounded-xl grid grid-cols-3 gap-1">
                <button
                  onClick={() => changeDifficulty('easy')}
                  className={`py-1.5 text-[10px] Khmer-font font-semibold rounded-lg transition-all ${
                    aiDifficulty === 'easy' 
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/10' 
                      : 'text-zinc-500'
                  }`}
                >
                  កម្រិតទាប
                </button>
                <button
                  onClick={() => changeDifficulty('medium')}
                  className={`py-1.5 text-[10px] Khmer-font font-semibold rounded-lg transition-all ${
                    aiDifficulty === 'medium' 
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/10' 
                      : 'text-zinc-500'
                  }`}
                >
                  កម្រិតមធ្យម
                </button>
                <button
                  onClick={() => changeDifficulty('hard')}
                  className={`py-1.5 text-[10px] Khmer-font font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    aiDifficulty === 'hard' 
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/10' 
                      : 'text-zinc-500'
                  }`}
                >
                  {!subscription.active && <Lock size={10} className="text-amber-500 shrink-0" />}
                  <span>កម្រិតខ្ពស់</span>
                </button>
              </div>
            </div>
          )}

          {/* Theme Selection */}
          <div className="space-y-2">
            <span className="text-neutral-400 text-xs Khmer-font">ស្បែកក្តារអុក:</span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => changeTheme('classic')}
                className={`py-2 px-3 border rounded-xl flex items-center justify-between text-xs transition-all ${
                  chessTheme === 'classic' 
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-semibold' 
                    : 'border-zinc-850 bg-zinc-950/40 text-zinc-400'
                }`}
              >
                <span className="Khmer-font text-[11px]">ស្តង់ដារបៃតងគោក</span>
                <span className="text-[10px] font-mono text-zinc-500">Free</span>
              </button>

              <button
                onClick={() => changeTheme('cyber')}
                className={`py-2 px-3 border rounded-xl flex items-center justify-between text-xs transition-all ${
                  chessTheme === 'cyber' 
                    ? 'border-purple-500 bg-purple-500/5 text-cyan-400 font-semibold' 
                    : 'border-zinc-850 bg-zinc-950/40 text-zinc-400'
                }`}
              >
                <span className="Khmer-font text-[11px] flex items-center gap-1.5">
                  {!subscription.active && <Lock size={12} className="text-amber-500" />}
                  អុកយុទ្ធសាស្ត្រ Cyber Neon
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                  Pro <Sparkles size={10} className="text-amber-400" />
                </span>
              </button>

              <button
                onClick={() => changeTheme('royal')}
                className={`py-2 px-3 border rounded-xl flex items-center justify-between text-xs transition-all ${
                  chessTheme === 'royal' 
                    ? 'border-yellow-500 bg-yellow-500/5 text-amber-500 font-semibold' 
                    : 'border-zinc-850 bg-zinc-950/40 text-zinc-400'
                }`}
              >
                <span className="Khmer-font text-[11px] flex items-center gap-1.5">
                  {!subscription.active && <Lock size={12} className="text-amber-500" />}
                  ព្រៃឥន្ទ្រទេវី (Angkor Gold)
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
          <Info size={16} className="text-zinc-650 shrink-0 mt-0.5" />
          <p className="Khmer-font text-[11px] leading-relaxed">
            <strong>ចំណាំ:</strong> ចុចលើកូនអុករបស់អ្នកដើម្បីមើលផ្លូវដើរស្របច្បាប់ (ចំណុចពណ៌បៃតង) រួចចុចលើប្រអប់ទិសដៅដើម្បីដើរ។ ការលេងសាកល្បងឥតគិតថ្លៃមានអតិបរមា ១០ ផ្លូវដើរក្នុងមួយហ្គេម។
          </p>
        </div>

      </div>

      {/* Main Interactive Board and Captures list */}
      <div className="lg:col-span-8 flex flex-col items-center" id="chess-board-col">
        
        {/* Turn & Status Header */}
        <div className="flex items-center justify-between w-full max-w-lg mb-4 px-2">
          <div className="text-xs Khmer-font flex items-center gap-2">
            {gameStatus === 'CHECKMATE' ? (
              <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <AlertTriangle size={14} /> {statusMessage}
              </span>
            ) : chessRef.current?.inCheck() ? (
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-bounce">
                <AlertTriangle size={14} /> {statusMessage}
              </span>
            ) : (
              <span className="bg-zinc-900 border border-zinc-850 text-zinc-400 text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5">
                <Play size={10} className="fill-emerald-500 text-emerald-500 shrink-0" />
                {statusMessage}
              </span>
            )}
          </div>

          <button
            id="reset-chess-board"
            onClick={initGame}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-850 hover:text-white text-zinc-400 transition-all flex items-center gap-1 text-xs Khmer-font"
          >
            <RotateCcw size={12} />
            <span>លេងឡើងវិញ</span>
          </button>
        </div>

        {/* Captured Black Pieces list */}
        <div className="flex items-center space-x-1 mb-2 px-3 py-1 bg-zinc-900/60 border border-zinc-850 rounded-xl w-full max-w-lg select-none">
          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mr-2 font-semibold">Captured Black:</span>
          {capturedPieces.black.length === 0 ? (
            <span className="text-[11px] text-zinc-600 italic">None</span>
          ) : (
            <div className="flex items-center space-x-0.5 text-md text-zinc-300">
              {capturedPieces.black.map((type, idx) => (
                <span key={idx} title={type} className="hover:scale-125 transition-transform">
                  {pieceUnicodeMap[type]?.b || type.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 8x8 Chessboard Grid */}
        <div className={`p-2.5 rounded-2xl w-full max-w-lg transition-all ${boardTheme.boardBorder}`} id="chessboard-container">
          <div className="grid grid-cols-8 gap-0 border border-zinc-950 overflow-hidden rounded-xl">
            {board.map((rowArr, rowIndex) => {
              return rowArr.map((cellState, colIndex) => {
                const squareName = getSquareName(rowIndex, colIndex);
                const isSelected = selectedSquare === squareName;
                const isPossibleTarget = possibleMoves.includes(squareName);
                
                // Color mapping: light vs dark
                const isLight = (rowIndex + colIndex) % 2 === 0;
                
                // Content of cell
                let pieceUnicode = '';
                if (cellState) {
                  pieceUnicode = pieceUnicodeMap[cellState.type]?.[cellState.color] || '';
                }

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    id={`chess-sq-${squareName}`}
                    onClick={() => handleCellClick(squareName)}
                    className={`aspect-square w-full flex flex-col justify-between p-0.5 relative active:scale-95 transition-all outline-none ${
                      isSelected 
                        ? boardTheme.selectedSq 
                        : isLight ? boardTheme.lightSq : boardTheme.darkSq
                    }`}
                  >
                    {/* Alphanumeric Coordinates label details on corner boxes for elegant looks */}
                    {colIndex === 0 && (
                      <span className={`absolute top-0.5 left-0.5 text-[8px] font-bold select-none ${boardTheme.cellText}`}>
                        {8 - rowIndex}
                      </span>
                    )}
                    {rowIndex === 7 && (
                      <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-bold select-none ${boardTheme.cellText}`}>
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][colIndex]}
                      </span>
                    )}

                    {/* Central Piece Symbol or Possible Moves indicator */}
                    <div className="flex-1 flex items-center justify-center p-1 font-semibold text-3xl sm:text-4xl select-none leading-none">
                      {pieceUnicode ? (
                        <span className={`transform transition-transform hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${
                          cellState.color === 'w' ? 'text-amber-500 font-bold' : 'text-zinc-950 font-bold'
                        }`}>
                          {pieceUnicode}
                        </span>
                      ) : isPossibleTarget ? (
                        <div className={boardTheme.possMoveSq}></div>
                      ) : null}
                    </div>

                  </button>
                );
              });
            })}
          </div>
        </div>

        {/* Captured White Pieces list */}
        <div className="flex items-center space-x-1 mt-3 px-3 py-1 bg-zinc-900/60 border border-zinc-850 rounded-xl w-full max-w-lg select-none">
          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mr-2 font-semibold">Captured White:</span>
          {capturedPieces.white.length === 0 ? (
            <span className="text-[11px] text-zinc-600 italic">None</span>
          ) : (
            <div className="flex items-center space-x-0.5 text-md text-zinc-300">
              {capturedPieces.white.map((type, idx) => (
                <span key={idx} title={type} className="hover:scale-125 transition-transform">
                  {pieceUnicodeMap[type]?.w || type.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
