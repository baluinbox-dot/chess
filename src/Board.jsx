const GLYPH = { k: "♚︎", q: "♛︎", r: "♜︎", b: "♝︎", n: "♞︎", p: "♟︎" };
const FILES = "abcdefgh";

export default function Board({ board, flipped, selected, targets, lastMove, hint, checkSquare, onSquare }) {
  const ranks = flipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const files = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="grid grid-cols-8 w-full aspect-square rounded-lg overflow-hidden border-4 border-slate-700 select-none">
      {ranks.map((r) =>
        files.map((f) => {
          const sq = FILES[f] + (r + 1);
          const piece = board[7 - r][f];
          const dark = (r + f) % 2 === 0;
          let bg = dark ? "bg-[#b58863]" : "bg-[#f0d9b5]";
          if (lastMove && (lastMove.from === sq || lastMove.to === sq)) bg = dark ? "bg-[#aaa23a]" : "bg-[#cdd26a]";
          if (hint && (hint.from === sq || hint.to === sq)) bg = "bg-emerald-400";
          if (selected === sq) bg = "bg-sky-400";
          if (checkSquare === sq) bg = "bg-red-500";
          const showRank = f === files[0];
          const showFile = r === ranks[7];
          return (
            <button
              key={sq}
              onClick={() => onSquare(sq)}
              className={`relative flex items-center justify-center aspect-square ${bg}`}
            >
              {piece && (
                <span
                  className={`text-[9vw] sm:text-5xl leading-none ${
                    piece.color === "w" ? "text-white" : "text-slate-900"
                  }`}
                  style={{
                    fontFamily: '"Segoe UI Symbol", "DejaVu Sans", "Arial Unicode MS", sans-serif',
                    textShadow:
                      piece.color === "w"
                        ? "0 0 2px #000, 0 0 2px #000, 0 0 2px #000"
                        : "0 0 2px #fff, 0 0 1px #fff",
                  }}
                >
                  {GLYPH[piece.type]}
                </span>
              )}
              {targets.includes(sq) && (
                <span
                  className={`absolute rounded-full ${
                    piece ? "w-full h-full border-4 border-slate-800/40" : "w-1/3 h-1/3 bg-slate-800/40"
                  }`}
                />
              )}
              {showRank && (
                <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-slate-700/80">{r + 1}</span>
              )}
              {showFile && (
                <span className="absolute bottom-0 right-1 text-[10px] font-semibold text-slate-700/80">
                  {FILES[f]}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
