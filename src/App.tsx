import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";

// ── Types ──
interface Mood {
  ko: string;
  en: string;
}

type QuadrantName = "red" | "yellow" | "blue" | "green";

interface CellColor {
  h: number;
  s: number;
  l: number;
  css: string;
}

// ── Mood Data ──
const QUADRANTS: Record<QuadrantName, Mood[][]> = {
  red: [
    [{ ko: "격분한", en: "Enraged" }, { ko: "공황에 빠진", en: "Panicked" }, { ko: "스트레스 받는", en: "Stressed" }, { ko: "초조한", en: "Jittery" }, { ko: "충격받은", en: "Shocked" }],
    [{ ko: "격노한", en: "Livid" }, { ko: "몹시 화가 난", en: "Furious" }, { ko: "좌절한", en: "Frustrated" }, { ko: "신경이 날카로운", en: "Tense" }, { ko: "망연자실한", en: "Stunned" }],
    [{ ko: "화가 치밀어 오른", en: "Fuming" }, { ko: "겁먹은", en: "Frightened" }, { ko: "화난", en: "Angry" }, { ko: "초조한", en: "Nervous" }, { ko: "안절부절못하는", en: "Restless" }],
    [{ ko: "불안한", en: "Anxious" }, { ko: "우려하는", en: "Apprehensive" }, { ko: "근심하는", en: "Worried" }, { ko: "짜증나는", en: "Irritated" }, { ko: "거슬리는", en: "Annoyed" }],
    [{ ko: "불쾌한", en: "Repulsed" }, { ko: "골치 아픈", en: "Troubled" }, { ko: "염려하는", en: "Concerned" }, { ko: "마음이 불편한", en: "Uneasy" }, { ko: "언짢은", en: "Peeved" }],
  ],
  yellow: [
    [{ ko: "놀란", en: "Surprised" }, { ko: "긍정적인", en: "Upbeat" }, { ko: "흥겨운", en: "Festive" }, { ko: "아주 신나는", en: "Exhilarated" }, { ko: "황홀한", en: "Ecstatic" }],
    [{ ko: "들뜬", en: "Hyper" }, { ko: "쾌활한", en: "Cheerful" }, { ko: "동기 부여된", en: "Motivated" }, { ko: "영감을 받은", en: "Inspired" }, { ko: "의기양양한", en: "Elated" }],
    [{ ko: "기운이 넘치는", en: "Energized" }, { ko: "활발한", en: "Lively" }, { ko: "흥분한", en: "Excited" }, { ko: "낙관적인", en: "Optimistic" }, { ko: "열광하는", en: "Enthusiastic" }],
    [{ ko: "만족스러운", en: "Pleased" }, { ko: "집중하는", en: "Focused" }, { ko: "행복한", en: "Happy" }, { ko: "자랑스러운", en: "Proud" }, { ko: "짜릿한", en: "Thrilled" }],
    [{ ko: "유쾌한", en: "Pleasant" }, { ko: "기쁜", en: "Joyful" }, { ko: "희망찬", en: "Hopeful" }, { ko: "재미있는", en: "Playful" }, { ko: "더없이 행복한", en: "Blissful" }],
  ],
  blue: [
    [{ ko: "역겨운", en: "Disgusted" }, { ko: "침울한", en: "Glum" }, { ko: "실망스러운", en: "Disappointed" }, { ko: "의욕 없는", en: "Down" }, { ko: "냉담한", en: "Apathetic" }],
    [{ ko: "비관적인", en: "Pessimistic" }, { ko: "시무룩한", en: "Morose" }, { ko: "낙담한", en: "Discouraged" }, { ko: "슬픈", en: "Sad" }, { ko: "지루한", en: "Bored" }],
    [{ ko: "소외된", en: "Alienated" }, { ko: "비참한", en: "Miserable" }, { ko: "쓸쓸한", en: "Lonely" }, { ko: "기죽은", en: "Disheartened" }, { ko: "피곤한", en: "Tired" }],
    [{ ko: "의기소침한", en: "Despondent" }, { ko: "우울한", en: "Depressed" }, { ko: "둔한", en: "Sullen" }, { ko: "기진맥진한", en: "Exhausted" }, { ko: "지친", en: "Fatigued" }],
    [{ ko: "절망한", en: "Despairing" }, { ko: "가망 없는", en: "Hopeless" }, { ko: "고독한", en: "Desolate" }, { ko: "소모된", en: "Spent" }, { ko: "진이 빠진", en: "Drained" }],
  ],
  green: [
    [{ ko: "속 편한", en: "At Ease" }, { ko: "태평한", en: "Easygoing" }, { ko: "자족하는", en: "Content" }, { ko: "다정한", en: "Loving" }, { ko: "충만한", en: "Fulfilled" }],
    [{ ko: "평온한", en: "Calm" }, { ko: "안전한", en: "Secure" }, { ko: "만족스러운", en: "Satisfied" }, { ko: "감사하는", en: "Grateful" }, { ko: "감동적인", en: "Touched" }],
    [{ ko: "여유로운", en: "Relaxed" }, { ko: "차분한", en: "Chill" }, { ko: "편안한", en: "Restful" }, { ko: "축복받은", en: "Blessed" }, { ko: "안정적인", en: "Balanced" }],
    [{ ko: "한가로운", en: "Mellow" }, { ko: "생각에 잠긴", en: "Thoughtful" }, { ko: "평화로운", en: "Peaceful" }, { ko: "편한", en: "Comfortable" }, { ko: "근심 걱정 없는", en: "Carefree" }],
    [{ ko: "나른한", en: "Sleepy" }, { ko: "흐뭇한", en: "Complacent" }, { ko: "고요한", en: "Tranquil" }, { ko: "안락한", en: "Cozy" }, { ko: "안온한", en: "Serene" }],
  ],
};

const QUAD_ORDER: QuadrantName[] = ["red", "yellow", "blue", "green"];

// ── Color Utilities ──
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const f = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = f(p, q, h + 1 / 3);
    g = f(p, q, h);
    b = f(p, q, h - 1 / 3);
  }
  return [r, g, b];
}

function getTextColor(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return r * 0.299 + g * 0.587 + b * 0.114 > 0.52 ? "#2a2a2a" : "#ffffff";
}

function getCellColor(quad: QuadrantName, qRow: number, qCol: number): CellColor {
  let nr = 0,
    nc = 0;
  switch (quad) {
    case "red":
      nr = (4 - qRow) / 4;
      nc = (4 - qCol) / 4;
      break;
    case "yellow":
      nr = (4 - qRow) / 4;
      nc = qCol / 4;
      break;
    case "blue":
      nr = qRow / 4;
      nc = (4 - qCol) / 4;
      break;
    case "green":
      nr = qRow / 4;
      nc = qCol / 4;
      break;
  }
  const t = (nr + nc) / 2;
  let h = 0,
    s = 0,
    l = 0;
  switch (quad) {
    case "red":
      h = 0 + t * 5;
      s = 62 + t * 18;
      l = 58 - t * 26;
      break;
    case "yellow":
      h = 42 + t * 10;
      s = 68 + t * 24;
      l = 70 - t * 26;
      break;
    case "blue":
      h = 212 + t * 10;
      s = 50 + t * 22;
      l = 58 - t * 26;
      break;
    case "green":
      h = 138 + t * 14;
      s = 40 + t * 22;
      l = 56 - t * 22;
      break;
  }
  return {
    h,
    s,
    l,
    css: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

// ── Canvas Card Generator ──
function generateCardBlobPromise(mood: Mood, color: CellColor, note: string): Promise<Blob> {
  const W = 480,
    H = note ? 280 : 200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const R = 20;
  ctx.fillStyle = color.css;
  ctx.beginPath();
  ctx.moveTo(R, 0);
  ctx.lineTo(W - R, 0);
  ctx.quadraticCurveTo(W, 0, W, R);
  ctx.lineTo(W, H - R);
  ctx.quadraticCurveTo(W, H, W - R, H);
  ctx.lineTo(R, H);
  ctx.quadraticCurveTo(0, H, 0, H - R);
  ctx.lineTo(0, R);
  ctx.quadraticCurveTo(0, 0, R, 0);
  ctx.closePath();
  ctx.fill();

  const textCol = getTextColor(color.h, color.s, color.l);
  const subCol = textCol === "#ffffff" ? "rgba(255,255,255,0.65)" : "rgba(42,42,42,0.55)";

  const baseY = note ? 90 : 85;
  ctx.fillStyle = textCol;
  ctx.textAlign = "center";
  ctx.font = 'bold 38px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillText(mood.ko, W / 2, baseY);

  ctx.font = '20px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillStyle = subCol;
  ctx.fillText(mood.en, W / 2, baseY + 36);

  if (note) {
    ctx.fillStyle = textCol;
    ctx.font = '18px "Pretendard Variable", Pretendard, sans-serif';
    const maxW = W - 80;
    const lines: string[] = [];
    let line = "";
    for (const char of note) {
      const test = line + char;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const startY = baseY + 76;
    lines.slice(0, 3).forEach((l, i) => {
      ctx.fillText(l, W / 2, startY + i * 26);
    });
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob returned null"));
      }, "image/png");
    } catch {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const byteString = atob(dataUrl.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        resolve(new Blob([ab], { type: "image/png" }));
      } catch (e2) {
        reject(e2);
      }
    }
  });
}

// ── Components ──

function MoodCell({
  mood,
  color,
  globalRow,
  globalCol,
  isSelected,
  onSelect,
}: {
  mood: Mood;
  color: CellColor;
  globalRow: number;
  globalCol: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const delay = (globalRow + globalCol) * 0.025;
  const [shimmer, setShimmer] = useState(false);
  const swayControls = useAnimationControls();
  const swaying = useRef(false);

  const triggerSway = () => {
    if (swaying.current) return;
    swaying.current = true;
    setShimmer(true);
    swayControls.set({ rotate: -1.8 });
    swayControls.start({
      rotate: 0,
      transition: { type: "spring", stiffness: 120, damping: 8, mass: 0.6 },
    }).then(() => {
      swaying.current = false;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <motion.div
      style={{ transformOrigin: "top center" }}
      animate={swayControls}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`${mood.ko} (${mood.en})`}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        onMouseEnter={triggerSway}
        onFocus={triggerSway}
        className={`mood-cell${isSelected ? " selected" : ""}${shimmer ? " shimmer" : ""}`}
        onAnimationEnd={() => setShimmer(false)}
        style={{
          background: color.css,
          ...(isSelected
            ? {
                boxShadow: "0 0 0 2px #fff, 0 4px 20px rgba(0,0,0,0.3)",
                zIndex: 11,
              }
            : {}),
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: isSelected ? 1.04 : 1 }}
        transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.97, transition: { duration: 0.1, delay: 0 } }}
      >
        <span className="cell-ko">{mood.ko}</span>
        <span className="cell-en">{mood.en}</span>
      </motion.div>
    </motion.div>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {message}
    </motion.div>
  );
}

function NotePanel({ mood, color, onClose }: { mood: Mood; color: CellColor; onClose: () => void }) {
  const [note, setNote] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done" | "fail">("idle");
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    setCopyState("copying");
    const trimmedNote = note.trim();
    const textFallback = trimmedNote ? `${mood.ko} (${mood.en}) \u2014 ${trimmedNote}` : `${mood.ko} (${mood.en})`;

    try {
      const blobPromise = generateCardBlobPromise(mood, color, trimmedNote);
      const item = new ClipboardItem({ "image/png": blobPromise });
      await navigator.clipboard.write([item]);
      setCopyState("idle");
      setToast("\uBCF5\uC0AC \uC644\uB8CC");
    } catch {
      try {
        const blob = await generateCardBlobPromise(mood, color, trimmedNote);
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopyState("idle");
        setToast("\uBCF5\uC0AC \uC644\uB8CC");
      } catch {
        try {
          await navigator.clipboard.writeText(textFallback);
          setCopyState("idle");
          setToast("\uD14D\uC2A4\uD2B8\uB85C \uBCF5\uC0AC\uB428");
        } catch {
          setCopyState("fail");
        }
      }
    }
  }, [mood, color, note]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await generateCardBlobPromise(mood, color, note.trim());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mood-${mood.en.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast("\uC800\uC7A5 \uC644\uB8CC");
    } catch {
      /* silently fail */
    }
  }, [mood, color, note]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCopy();
    }
  };

  const textCol = getTextColor(color.h, color.s, color.l);
  const isDark = textCol === "#ffffff";

  const stagger = 0.06;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${mood.ko} 감정 카드`}
      className="note-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="note-panel"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="note-card-preview"
          style={{ background: color.css, color: textCol }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stagger, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="preview-mood-ko">{mood.ko}</div>
          <div className="preview-mood-en" style={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(42,42,42,0.55)" }}>
            {mood.en}
          </div>
          {note.trim() && (
            <div className="preview-note" style={{ opacity: 0.9, marginTop: "14px" }}>
              &ldquo;{note.trim()}&rdquo;
            </div>
          )}
        </motion.div>

        <motion.div
          className="note-input-area"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stagger * 2, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <label className="note-label">한마디</label>
          <textarea
            ref={inputRef}
            className="note-textarea"
            placeholder="지금 느낌을 적어보세요"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 80))}
            onKeyDown={handleKeyDown}
            maxLength={80}
            rows={2}
          />
          <div className="note-char-count">{note.length}/80</div>
        </motion.div>

        <motion.div
          className="note-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stagger * 3, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className="note-btn-secondary" onClick={onClose}>
            닫기
          </button>
          {copyState === "fail" ? (
            <button className="note-btn-primary" onClick={handleDownload}>
              저장하기
            </button>
          ) : (
            <button
              className="note-btn-primary"
              onClick={handleCopy}
              disabled={copyState === "copying"}
            >
              {copyState === "copying" ? "\uBCF5\uC0AC \uC911..." : "\uBCF5\uC0AC\uD558\uAE30"}
            </button>
          )}
        </motion.div>

        <motion.p
          className="note-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: stagger * 4, duration: 0.3 }}
        >
          {copyState === "fail" ? "\uD074\uB9BD\uBCF4\uB4DC \uC811\uADFC\uC774 \uC81C\uD55C\uB418\uC5B4 \uC774\uBBF8\uC9C0\uB97C \uC800\uC7A5\uD569\uB2C8\uB2E4" : "\uC774\uBBF8\uC9C0\uAC00 \uBCF5\uC0AC\uB3FC\uC694"}
        </motion.p>
      </motion.div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main App ──
export default function MoodMeter() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<{ mood: Mood; color: CellColor } | null>(null);

  const cellColors = useMemo(() => {
    const map: Record<string, CellColor> = {};
    QUAD_ORDER.forEach((quad) => {
      QUADRANTS[quad].forEach((row, r) => {
        row.forEach((_, c) => {
          map[`${quad}-${r}-${c}`] = getCellColor(quad, r, c);
        });
      });
    });
    return map;
  }, []);

  const handleSelect = (quad: QuadrantName, r: number, c: number, mood: Mood) => {
    const key = `${quad}-${r}-${c}`;
    setSelectedKey(key);
    setPanelData({ mood, color: cellColors[key] });
  };

  const handleClosePanel = () => {
    setSelectedKey(null);
    setPanelData(null);
  };

  return (
    <>
      <style>{`
        :root {
          --bg-primary: #17171c;
          --bg-card: #212126;
          --bg-card-hover: #2c2c33;
          --text-primary: #f2f4f6;
          --text-secondary: #8b95a1;
          --text-tertiary: #6b7684;
          --accent-blue: #3182f6;
          --border-subtle: rgba(255, 255, 255, 0.06);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: var(--bg-primary);
        }

        .mood-app {
          background: var(--bg-primary);
          font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
          padding: 32px 16px 56px;
        }

        .mood-container {
          max-width: 1080px;
          margin: 0 auto;
        }

        .mood-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .mood-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.2;
          color: var(--text-primary);
        }

        .mood-subtitle {
          color: var(--text-tertiary);
          font-size: 0.95rem;
          font-weight: 400;
          margin-top: 8px;
        }

        /* Grid */
        .grid-wrapper {
          display: flex;
          gap: 0;
          justify-content: center;
        }

        .y-axis {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 28px;
          flex-shrink: 0;
        }

        .y-axis-half {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .y-label {
          transform: rotate(-90deg);
          white-space: nowrap;
          font-size: 0.8rem;
          color: var(--text-tertiary);
          font-weight: 400;
        }

        .grid-scroll {
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          padding: 8px;
        }

        .grid-main {
          min-width: 880px;
        }

        .quadrants-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 4px;
        }

        .quadrant {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 4px;
        }

        .mood-cell {
          padding: 8px 4px;
          text-align: center;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 62px;
          word-break: keep-all;
          position: relative;
          user-select: none;
          color: var(--text-primary);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .mood-cell::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 70%
          );
          transition: none;
          pointer-events: none;
        }

        .mood-cell.shimmer::after {
          animation: shimmer 1.5s ease forwards;
        }

        .mood-cell:focus-visible {
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 0 2px var(--accent-blue);
        }

        @keyframes shimmer {
          from { left: -60%; }
          to { left: 120%; }
        }

        .cell-ko {
          font-size: 12.5px;
          font-weight: 500;
          line-height: 1.25;
        }

        .cell-en {
          font-size: 10px;
          font-weight: 300;
          opacity: 0.55;
          margin-top: 2px;
          line-height: 1.2;
        }

        .x-axis-labels {
          display: flex;
          padding: 14px 0 0;
          font-size: 0.8rem;
          color: var(--text-tertiary);
          font-weight: 400;
        }

        .x-axis-labels span {
          flex: 1;
          text-align: center;
        }

        /* Note Panel Overlay */
        .note-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .note-panel {
          background: rgba(33, 33, 38, 0.75);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .note-card-preview {
          border-radius: 16px;
          padding: 28px 24px 20px;
          text-align: center;
          margin-bottom: 20px;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.2);
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .preview-mood-ko {
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .preview-mood-en {
          font-size: 0.95rem;
          font-weight: 300;
          margin-top: 4px;
        }

        .preview-note {
          font-size: 0.9rem;
          font-weight: 400;
          line-height: 1.5;
          max-width: 280px;
          word-break: keep-all;
        }

        .note-input-area {
          margin-bottom: 18px;
        }

        .note-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .note-textarea {
          width: 100%;
          border: 1.5px solid var(--border-subtle);
          border-radius: 10px;
          padding: 12px 14px;
          font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          font-size: 0.95rem;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .note-textarea:focus {
          border-color: var(--accent-blue);
        }

        .note-textarea::placeholder {
          color: var(--text-tertiary);
        }

        .note-char-count {
          text-align: right;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 4px;
        }

        .note-actions {
          display: flex;
          gap: 10px;
        }

        .note-btn-secondary {
          flex: 0 0 auto;
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: transparent;
          font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .note-btn-secondary:hover {
          background: var(--bg-card-hover);
        }

        .note-btn-primary {
          flex: 1;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: var(--accent-blue);
          color: #fff;
          font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .note-btn-primary:hover {
          filter: brightness(1.1);
        }

        .note-btn-primary:active {
          transform: scale(0.98);
        }

        .note-btn-primary.done {
          background: #22c55e;
          pointer-events: none;
        }

        .note-btn-primary:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .note-hint {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 14px;
          font-weight: 300;
        }

        .toast {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: rgba(33, 33, 38, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--text-primary);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          z-index: 1100;
        }

        @media (max-width: 640px) {
          .toast {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
            bottom: 24px;
          }
        }

        @media (max-width: 960px) {
          .mood-title { font-size: 1.6rem; }
          .cell-ko { font-size: 11.5px; }
          .cell-en { font-size: 9.5px; }
          .mood-cell { min-height: 56px; padding: 6px 3px; }
        }

        @media (max-width: 640px) {
          .mood-app { padding: 20px 8px 40px; }
          .mood-title { font-size: 1.4rem; }
          .cell-ko { font-size: 10.5px; }
          .cell-en { font-size: 9px; }
          .mood-cell { min-height: 48px; padding: 5px 2px; }
          .mood-cell:hover::after { animation: none; }
          .note-panel { padding: 20px; }
        }
      `}</style>

      <div className="mood-app">
        <div className="mood-container">
          <header className="mood-header">
            <h1 className="mood-title">무드미터</h1>
            <p className="mood-subtitle">지금 내 기분은?</p>
          </header>

          <div className="grid-wrapper">
            <div className="y-axis">
              <div className="y-axis-half">
                <span className="y-label">에너지 높음</span>
              </div>
              <div className="y-axis-half">
                <span className="y-label">에너지 낮음</span>
              </div>
            </div>
            <div className="grid-scroll">
              <div className="grid-main">
                <div className="quadrants-grid">
                  {QUAD_ORDER.map((quad) => (
                    <div className="quadrant" key={quad}>
                      {QUADRANTS[quad].map((row, r) =>
                        row.map((mood, c) => {
                          const key = `${quad}-${r}-${c}`;
                          let gRow = 0,
                            gCol = 0;
                          if (quad === "red") {
                            gRow = r;
                            gCol = c;
                          }
                          if (quad === "yellow") {
                            gRow = r;
                            gCol = c + 5;
                          }
                          if (quad === "blue") {
                            gRow = r + 5;
                            gCol = c;
                          }
                          if (quad === "green") {
                            gRow = r + 5;
                            gCol = c + 5;
                          }
                          return (
                            <MoodCell
                              key={key}
                              mood={mood}
                              color={cellColors[key]}
                              globalRow={gRow}
                              globalCol={gCol}
                              isSelected={selectedKey === key}
                              onSelect={() => handleSelect(quad, r, c, mood)}
                            />
                          );
                        }),
                      )}
                    </div>
                  ))}
                </div>
                <div className="x-axis-labels">
                  <span>불쾌</span>
                  <span>쾌적</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {panelData && <NotePanel key="note-panel" mood={panelData.mood} color={panelData.color} onClose={handleClosePanel} />}
        </AnimatePresence>
      </div>
    </>
  );
}
