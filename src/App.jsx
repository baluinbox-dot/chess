import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Check, FlipVertical, Loader2, RotateCcw, Undo2 } from "lucide-react";
import Board from "./Board.jsx";
import useEngine, { LEVELS } from "./useEngine.js";

const NAMES = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" };

function describe(m) {
  if (m.flags.includes("k")) return "Castle king side: move the King two squares toward the right-hand Rook, then put the Rook on the other side of the King";
  if (m.flags.includes("q")) return "Castle queen side: move the King two squares toward the left-hand Rook, then put the Rook on the other side of the King";
  let t = `${NAMES[m.piece]} ${m.from} to ${m.to}`;
  if (m.captured) t += `, takes ${NAMES[m.captured].toLowerCase()}`;
  if (m.flags.includes("e")) t += " (en passant: also remove the pawn beside it)";
  if (m.promotion) t += `, becomes a ${NAMES[m.promotion]}`;
  if (m.san.includes("#")) t += ". Checkmate!";
  else if (m.san.includes("+")) t += ". Check!";
  return t;
}

export default function App() {
  const game = useRef(new Chess());
  const [fen, setFen] = useState(game.current.fen());
  const [aiColor, setAiColor] = useState("w");
  const [levelIdx, setLevelIdx] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const engine = useEngine();

  const g = game.current;
  const turn = g.turn();
  const over = g.isGameOver();
  const aiTurn = turn === aiColor && !over;
  const history = g.history({ verbose: true });
  const lastMove = history[history.length - 1] || null;

  const targets = useMemo(
    () => (selected ? g.moves({ square: selected, verbose: true }).map((m) => m.to) : []),
    [selected, fen]
  );

  useEffect(() => {
    setFlipped(aiColor === "b");
  }, [aiColor]);

  useEffect(() => {
    setSuggestion(null);
    if (!aiTurn || !engine.ready) return;
    let cancelled = false;
    engine.bestMove(fen, LEVELS[levelIdx]).then((uci) => {
      if (cancelled || !uci || uci === "(none)") return;
      const probe = new Chess(fen);
      const m = probe.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      setSuggestion(m);
    });
    return () => {
      cancelled = true;
    };
  }, [fen, aiTurn, engine.ready, levelIdx]);

  const sync = () => {
    setFen(g.fen());
    setSelected(null);
  };

  const onSquare = (sq) => {
    if (over || aiTurn) return;
    const piece = g.get(sq);
    if (selected && targets.includes(sq)) {
      g.move({ from: selected, to: sq, promotion: "q" });
      sync();
    } else if (piece && piece.color === turn) {
      setSelected(sq === selected ? null : sq);
    } else {
      setSelected(null);
    }
  };

  const playSuggestion = () => {
    g.move({ from: suggestion.from, to: suggestion.to, promotion: suggestion.promotion });
    sync();
  };

  const undo = () => {
    g.undo();
    sync();
  };

  const newGame = () => {
    g.reset();
    sync();
  };

  const checkSquare = g.inCheck()
    ? g.board().flat().find((p) => p && p.type === "k" && p.color === turn)?.square
    : null;

  let status;
  if (g.isCheckmate()) status = `Checkmate! ${turn === aiColor ? "Your son" : "The AI"} wins.`;
  else if (over) status = "Draw.";
  else if (aiTurn) status = "AI's turn";
  else status = "Your son's turn: enter his move on this board";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Chess Coach</h1>
          <div className="flex gap-2">
            <button onClick={() => setFlipped(!flipped)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700" title="Flip board">
              <FlipVertical size={18} />
            </button>
            <button onClick={undo} disabled={!history.length} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40" title="Undo">
              <Undo2 size={18} />
            </button>
            <button onClick={newGame} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700" title="New game">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 text-sm">
          <select
            value={aiColor}
            onChange={(e) => setAiColor(e.target.value)}
            className="flex-1 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          >
            <option value="w">AI plays White</option>
            <option value="b">AI plays Black</option>
          </select>
          <select
            value={levelIdx}
            onChange={(e) => setLevelIdx(Number(e.target.value))}
            className="flex-1 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          >
            {LEVELS.map((l, i) => (
              <option key={l.name} value={i}>
                Level: {l.name}
              </option>
            ))}
          </select>
        </div>

        <Board
          board={g.board()}
          flipped={flipped}
          selected={selected}
          targets={targets}
          lastMove={lastMove}
          hint={aiTurn ? suggestion : null}
          checkSquare={checkSquare}
          onSquare={onSquare}
        />

        <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 space-y-2">
          <p className="text-sm text-slate-400">{status}</p>
          {engine.failed && <p className="text-red-400 text-sm">Chess engine failed to load.</p>}
          {aiTurn && !suggestion && (
            <p className="flex items-center gap-2 text-slate-300">
              <Loader2 size={16} className="animate-spin" /> {engine.ready ? "Thinking..." : "Loading engine..."}
            </p>
          )}
          {aiTurn && suggestion && (
            <>
              <p className="text-lg font-semibold text-emerald-400">{describe(suggestion)}</p>
              <button
                onClick={playSuggestion}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium"
              >
                <Check size={18} /> I played it on the board
              </button>
            </>
          )}
        </div>

        {history.length > 0 && (
          <p className="text-xs text-slate-400 break-words">
            {history.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m.san}` : m.san)).join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}
