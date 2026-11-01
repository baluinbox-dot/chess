import { useEffect, useRef, useState } from "react";

const WORKER_URL = "/stockfish/stockfish-nnue-16-single.js#/stockfish/stockfish-nnue-16-single.wasm";

export const LEVELS = [
  { name: "Beginner", skill: 0, movetime: 100 },
  { name: "Easy", skill: 3, movetime: 200 },
  { name: "Medium", skill: 8, movetime: 400 },
  { name: "Hard", skill: 14, movetime: 800 },
  { name: "Strong", skill: 20, movetime: 1500 },
];

export default function useEngine() {
  const worker = useRef(null);
  const pending = useRef(null);
  const skip = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let w;
    try {
      w = new Worker(WORKER_URL);
    } catch {
      setFailed(true);
      return;
    }
    worker.current = w;
    w.onerror = () => setFailed(true);
    w.onmessage = (e) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line === "uciok") w.postMessage("isready");
      else if (line === "readyok") setReady(true);
      else if (line.startsWith("bestmove")) {
        if (skip.current > 0) {
          skip.current--;
          return;
        }
        const move = line.split(" ")[1];
        const p = pending.current;
        pending.current = null;
        if (p) p(move);
      }
    };
    w.postMessage("uci");
    return () => w.terminate();
  }, []);

  const bestMove = (fen, level) =>
    new Promise((resolve) => {
      const w = worker.current;
      if (pending.current) {
        skip.current++;
        w.postMessage("stop");
      }
      pending.current = resolve;
      w.postMessage(`setoption name Skill Level value ${level.skill}`);
      w.postMessage(`position fen ${fen}`);
      w.postMessage(`go movetime ${level.movetime}`);
    });

  return { ready, failed, bestMove };
}
