"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Save,
  Wand2,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Brain,
  Zap,
} from "lucide-react";

import { generateCaptionForPostAction } from "@/app/posts/actions";

// ── Types ──────────────────────────────────────────────────────────────────────
type TonePreset = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  prompt: string;
  color: string;
};

type HistoryItem = {
  id: string;
  caption: string;
  tone: string;
  prompt: string;
  createdAt: Date;
};

type RefinementOption = {
  label: string;
  instruction: string;
  icon: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const DEFAULT_TONES: TonePreset[] = [
  {
    id: "bold",
    name: "Bold & Direct",
    description: "Punchy, confident, no fluff",
    emoji: "⚡",
    prompt: "Write in a bold, direct, confident tone. Be punchy and impactful.",
    color: "#f59e0b",
  },
  {
    id: "witty",
    name: "Witty & Playful",
    description: "Clever, fun, a little edgy",
    emoji: "😏",
    prompt: "Write in a witty, playful tone. Be clever and a little cheeky.",
    color: "#f471b5",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Polished, authoritative, trustworthy",
    emoji: "💼",
    prompt:
      "Write in a professional, polished tone. Be authoritative and trustworthy.",
    color: "#60a5fa",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Narrative-driven, emotional, vivid",
    emoji: "📖",
    prompt:
      "Write in a storytelling tone. Be narrative-driven and emotionally engaging.",
    color: "#a78bfa",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, short, high-impact",
    emoji: "◻️",
    prompt: "Write in a minimalist tone. Be concise, clean, and high-impact.",
    color: "#6ee7b7",
  },
];

const REFINEMENTS: RefinementOption[] = [
  {
    label: "Make shorter",
    instruction:
      "Make this caption significantly shorter while keeping the core message.",
    icon: "↑",
  },
  {
    label: "Make longer",
    instruction:
      "Expand this caption with more detail, context, and engaging language.",
    icon: "↓",
  },
  {
    label: "Add emojis",
    instruction:
      "Add relevant emojis to make the caption more visually engaging.",
    icon: "😊",
  },
  {
    label: "More punchy",
    instruction:
      "Rewrite to be punchier, more impactful, cut any filler words.",
    icon: "⚡",
  },
  {
    label: "Add a CTA",
    instruction: "Add a clear call-to-action at the end of the caption.",
    icon: "→",
  },
  {
    label: "Hashtag optimized",
    instruction: "Add 5-8 relevant hashtags at the end optimized for reach.",
    icon: "#",
  },
];

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .ai-page * { box-sizing: border-box; }

  /* Textarea */
  .ai-textarea {
    width: 100%;
    background: #05050d;
    color: #eeeaf8;
    border: 1px solid rgba(124,92,252,0.22);
    border-radius: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    padding: 14px 16px;
    outline: none;
    resize: vertical;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
    -webkit-text-fill-color: #eeeaf8;
  }
  .ai-textarea:focus {
    border-color: rgba(124,92,252,0.6);
    box-shadow: 0 0 0 3px rgba(124,92,252,0.12);
  }
  .ai-textarea::placeholder { color: #3e3a5e; -webkit-text-fill-color: #3e3a5e; }

  /* Cards */
  .ai-card {
    border-radius: 18px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(124,92,252,0.35) 0%, rgba(244,113,181,0.12) 50%, rgba(124,92,252,0.08) 100%);
  }
  .ai-card-inner {
    border-radius: 17px;
    background: #0f0f1e;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .ai-card-inner::before {
    content: '';
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    height: 1px; width: 60%;
    background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5), transparent);
  }

  /* Section label */
  .ai-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: #7c5cfc;
    font-family: 'DM Sans', sans-serif; margin: 0 0 4px;
  }
  .ai-section-title {
    font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
    color: #eeeaf8; letter-spacing: -0.02em; margin: 0 0 6px;
  }
  .ai-section-desc {
    font-size: 12.5px; color: #7a7499; font-weight: 300;
    line-height: 1.5; margin: 0 0 20px;
  }

  /* Primary btn */
  .ai-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 11px;
    background: linear-gradient(135deg, #7c5cfc 0%, #6d4fe0 100%);
    color: #fff; font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; border: none; cursor: pointer;
    box-shadow: 0 4px 18px rgba(124,92,252,0.38);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    white-space: nowrap;
  }
  .ai-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 26px rgba(124,92,252,0.55); }
  .ai-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Ghost btn */
  .ai-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 9px;
    background: rgba(124,92,252,0.07);
    color: #a78bfa; font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    border: 1px solid rgba(124,92,252,0.18); cursor: pointer;
    transition: all 0.15s ease; white-space: nowrap;
  }
  .ai-btn-ghost:hover { background: rgba(124,92,252,0.14); color: #c4b5fd; border-color: rgba(124,92,252,0.35); }

  /* Tone card */
  .tone-card {
    border-radius: 12px; padding: 12px 14px; cursor: pointer;
    border: 1px solid rgba(124,92,252,0.12);
    background: rgba(255,255,255,0.02);
    transition: all 0.18s ease; position: relative;
    display: flex; align-items: flex-start; gap: 10;
  }
  .tone-card:hover { background: rgba(124,92,252,0.08); border-color: rgba(124,92,252,0.28); }
  .tone-card.active { background: rgba(124,92,252,0.12); border-color: rgba(124,92,252,0.45); }
  .tone-card.saved-tone { border-color: rgba(244,113,181,0.3); background: rgba(244,113,181,0.05); }
  .tone-card.saved-tone:hover { background: rgba(244,113,181,0.1); }
  .tone-card.saved-tone.active { background: rgba(244,113,181,0.12); border-color: rgba(244,113,181,0.5); }

  /* Refinement chip */
  .refine-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 13px; border-radius: 99px;
    background: rgba(124,92,252,0.06);
    border: 1px solid rgba(124,92,252,0.16);
    color: #8b85a8; font-size: 12px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.15s ease;
  }
  .refine-chip:hover { background: rgba(124,92,252,0.14); color: #c4b5fd; border-color: rgba(124,92,252,0.35); }

  /* History item */
  .history-item {
    border-radius: 12px; padding: 14px 16px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(124,92,252,0.1);
    transition: all 0.15s ease; cursor: pointer;
  }
  .history-item:hover { background: rgba(124,92,252,0.07); border-color: rgba(124,92,252,0.22); }

  /* Output area */
  .output-glow {
    position: absolute; inset: 0; border-radius: 17px; pointer-events: none;
    background: radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.08) 0%, transparent 60%);
  }

  /* Scrollbar */
  .ai-scroll::-webkit-scrollbar { width: 4px; }
  .ai-scroll::-webkit-scrollbar-track { background: transparent; }
  .ai-scroll::-webkit-scrollbar-thumb { background: rgba(124,92,252,0.3); border-radius: 99px; }

  /* Platform selector */
  .platform-chip {
    padding: 5px 13px; border-radius: 99px; cursor: pointer;
    font-size: 12px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    border: 1px solid rgba(124,92,252,0.15); color: #6b6890;
    background: transparent; transition: all 0.15s ease;
  }
  .platform-chip.active {
    background: rgba(124,92,252,0.15); color: #c4b5fd;
    border-color: rgba(124,92,252,0.4);
  }
  .platform-chip:hover:not(.active) { color: #a78bfa; border-color: rgba(124,92,252,0.28); }

  /* Spinning loader */
  @keyframes nexus-spin {
    to { transform: rotate(360deg); }
  }
  .ai-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    animation: nexus-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* Pulse dot */
  @keyframes nexus-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  .ai-pulse-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #7c5cfc;
    box-shadow: 0 0 6px rgba(124,92,252,0.9);
    animation: nexus-pulse 1.6s ease-in-out infinite;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,92,252,0.2), transparent);
    margin: 20px 0;
  }
`;

function ToneBadge({
  color,
  emoji,
  name,
}: {
  color: string;
  emoji: string;
  name: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: 99,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {emoji} {name}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      className="ai-btn-ghost"
      onClick={handleCopy}
      style={{ padding: "7px 12px" }}
    >
      {copied ? (
        <Check style={{ width: 13, height: 13, color: "#6ee7b7" }} />
      ) : (
        <Copy style={{ width: 13, height: 13 }} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function AIPage() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [activeToneId, setActiveToneId] = useState("bold");
  const [customTones, setCustomTones] = useState<TonePreset[]>([]);
  const [savedToneId, setSavedToneId] = useState<string | null>(null);
  const [platform, setPlatform] = useState("instagram");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showNewToneForm, setShowNewToneForm] = useState(false);
  const [newToneName, setNewToneName] = useState("");
  const [newToneDesc, setNewToneDesc] = useState("");
  const [newTonePrompt, setNewTonePrompt] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const allTones = [...DEFAULT_TONES, ...customTones];
  const activeTone = allTones.find((t) => t.id === activeToneId) ?? allTones[0];

  const platformLimits: Record<string, number> = {
    instagram: 2200,
    linkedin: 3000,
    twitter: 280,
  };
  const charLimit = platformLimits[platform] ?? 2200;

  useEffect(() => {
    setCharCount(output.length);
  }, [output]);

  // ── Generate ─────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setOutput("");

    const fullPrompt = `${activeTone.prompt}\n\nPlatform: ${platform}\n\nContent brief: ${prompt}`;
    const fd = new FormData();
    fd.append("prompt", fullPrompt);

    try {
      const result = await generateCaptionForPostAction(
        { fieldErrors: {} },
        fd,
      );
      const caption = result?.generatedCaption ?? "";
      setOutput(caption);
      if (caption) {
        setHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              caption,
              tone: activeTone.name,
              prompt: prompt.slice(0, 60),
              createdAt: new Date(),
            },
            ...prev,
          ].slice(0, 20),
        );
      }
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Refine ───────────────────────────────────────────────────────────────────
  async function handleRefine(instruction: string) {
    if (!output.trim()) return;
    setIsRefining(true);

    const fullPrompt = `${instruction}\n\nOriginal caption:\n${output}`;
    const fd = new FormData();
    fd.append("prompt", fullPrompt);

    try {
      const result = await generateCaptionForPostAction(
        { fieldErrors: {} },
        fd,
      );
      const caption = result?.generatedCaption ?? "";
      if (caption) {
        setOutput(caption);
        setHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              caption,
              tone: `Refined: ${activeTone.name}`,
              prompt: instruction.slice(0, 60),
              createdAt: new Date(),
            },
            ...prev,
          ].slice(0, 20),
        );
      }
    } finally {
      setIsRefining(false);
    }
  }

  // ── Save tone ────────────────────────────────────────────────────────────────
  function handleSaveNewTone() {
    if (!newToneName.trim() || !newTonePrompt.trim()) return;
    const id = `custom-${Date.now()}`;
    const newTone: TonePreset = {
      id,
      name: newToneName,
      description: newToneDesc,
      emoji: "🎨",
      prompt: newTonePrompt,
      color: "#f471b5",
    };
    setCustomTones((prev) => [...prev, newTone]);
    setActiveToneId(id);
    setSavedToneId(id);
    setNewToneName("");
    setNewToneDesc("");
    setNewTonePrompt("");
    setShowNewToneForm(false);
  }

  function handleDeleteCustomTone(id: string) {
    setCustomTones((prev) => prev.filter((t) => t.id !== id));
    if (activeToneId === id) setActiveToneId("bold");
    if (savedToneId === id) setSavedToneId(null);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div
        className="ai-page"
        style={{
          padding: "32px 28px",
          minHeight: "100%",
          fontFamily: "'DM Sans', sans-serif",
          background: "#07070f",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* ── Page Header ── */}
        <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <p className="ai-section-label">Studio</p>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#eeeaf8",
                  letterSpacing: "-0.04em",
                }}
              >
                AI Writer
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "#7a7499",
                  fontWeight: 300,
                }}
              >
                Generate, refine, and perfect captions with your saved tone of
                voice.
              </p>
            </div>

            {/* Saved tone indicator */}
            {savedToneId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "rgba(244,113,181,0.08)",
                  border: "1px solid rgba(244,113,181,0.25)",
                }}
              >
                <div
                  className="ai-pulse-dot"
                  style={{
                    background: "#f471b5",
                    boxShadow: "0 0 6px rgba(244,113,181,0.9)",
                  }}
                />
                <span
                  style={{ fontSize: 12, color: "#f4a0cc", fontWeight: 500 }}
                >
                  Active tone:{" "}
                  {allTones.find((t) => t.id === savedToneId)?.name}
                </span>
              </motion.div>
            )}
          </div>
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, rgba(124,92,252,0.3), rgba(244,113,181,0.1), transparent)",
              marginTop: 8,
            }}
          />
        </header>

        {/* ── Main grid ── */}
        <div
          style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }}
          className="lg:grid-cols-[1fr_360px]"
        >
          {/* ── LEFT: Generator ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Platform selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "#4b4870",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginRight: 4,
                }}
              >
                Platform
              </span>
              {["instagram", "linkedin", "twitter"].map((p) => (
                <button
                  key={p}
                  className={`platform-chip${platform === p ? " active" : ""}`}
                  onClick={() => setPlatform(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Prompt input */}
            <div className="ai-card">
              <div className="ai-card-inner" style={{ padding: "20px 22px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Brain style={{ width: 15, height: 15, color: "#7c5cfc" }} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#d4cfee",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Content Brief
                  </span>
                  {activeTone && (
                    <ToneBadge
                      color={activeTone.color}
                      emoji={activeTone.emoji}
                      name={activeTone.name}
                    />
                  )}
                </div>

                <textarea
                  className="ai-textarea"
                  rows={5}
                  placeholder="Describe what you want to post about — product launch, behind the scenes, campaign idea, announcement..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#4b4870" }}>
                    {prompt.length} chars ·{" "}
                    <span style={{ color: "#7c5cfc" }}>
                      {activeTone.emoji} {activeTone.name}
                    </span>
                  </span>
                  <button
                    className="ai-btn-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <div className="ai-spinner" /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles style={{ width: 14, height: 14 }} /> Generate
                        Caption
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="ai-card">
              <div className="ai-card-inner" style={{ padding: "20px 22px" }}>
                <div className="output-glow" />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Zap style={{ width: 15, height: 15, color: "#a78bfa" }} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#d4cfee",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Output
                    </span>
                    {(isGenerating || isRefining) && (
                      <div className="ai-pulse-dot" />
                    )}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: charCount > charLimit ? "#f87171" : "#4b4870",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {charCount}/{charLimit}
                    </span>
                    {output && <CopyBtn text={output} />}
                    {output && (
                      <button
                        className="ai-btn-ghost"
                        style={{ padding: "7px 12px" }}
                        onClick={() => setOutput("")}
                      >
                        <RotateCcw style={{ width: 12, height: 12 }} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  ref={outputRef}
                  className="ai-textarea"
                  rows={9}
                  placeholder="Your generated caption will appear here. You can also edit it directly..."
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                />

                {/* Refinement chips */}
                {output && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: 14 }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 11,
                        color: "#4b4870",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      Refine
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {REFINEMENTS.map((r) => (
                        <button
                          key={r.label}
                          className="refine-chip"
                          onClick={() => handleRefine(r.instruction)}
                          disabled={isRefining}
                          style={{
                            opacity: isRefining ? 0.5 : 1,
                            cursor: isRefining ? "not-allowed" : "pointer",
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{r.icon}</span>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Tone panel + History ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Tone selector */}
            <div className="ai-card">
              <div
                className="ai-card-inner ai-scroll"
                style={{ padding: "20px", maxHeight: 480, overflowY: "auto" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <p className="ai-section-label" style={{ margin: 0 }}>
                      Tone of Voice
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 12,
                        color: "#4b4870",
                      }}
                    >
                      Select or create your brand tone
                    </p>
                  </div>
                  <button
                    className="ai-btn-ghost"
                    style={{ padding: "6px 10px" }}
                    onClick={() => setShowNewToneForm((v) => !v)}
                  >
                    <Plus style={{ width: 12, height: 12 }} />
                    New
                  </button>
                </div>

                {/* New tone form */}
                <AnimatePresence>
                  {showNewToneForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden", marginBottom: 14 }}
                    >
                      <div
                        style={{
                          borderRadius: 12,
                          padding: 14,
                          background: "rgba(244,113,181,0.06)",
                          border: "1px solid rgba(244,113,181,0.2)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#f4a0cc",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Custom Tone
                        </p>
                        {[
                          {
                            placeholder: "Tone name (e.g. Luxury Brand)",
                            value: newToneName,
                            set: setNewToneName,
                          },
                          {
                            placeholder: "Short description",
                            value: newToneDesc,
                            set: setNewToneDesc,
                          },
                        ].map((f, i) => (
                          <input
                            key={i}
                            value={f.value}
                            onChange={(e) => f.set(e.target.value)}
                            placeholder={f.placeholder}
                            style={{
                              background: "#05050d",
                              color: "#eeeaf8",
                              border: "1px solid rgba(244,113,181,0.22)",
                              borderRadius: 9,
                              padding: "8px 12px",
                              fontSize: 13,
                              fontFamily: "'DM Sans', sans-serif",
                              outline: "none",
                              width: "100%",
                            }}
                          />
                        ))}
                        <textarea
                          value={newTonePrompt}
                          onChange={(e) => setNewTonePrompt(e.target.value)}
                          placeholder="AI instruction: e.g. 'Write in an aspirational, luxury tone targeting high-net-worth individuals. Use sophisticated vocabulary...'"
                          rows={3}
                          style={{
                            background: "#05050d",
                            color: "#eeeaf8",
                            border: "1px solid rgba(244,113,181,0.22)",
                            borderRadius: 9,
                            padding: "8px 12px",
                            fontSize: 13,
                            resize: "vertical",
                            fontFamily: "'DM Sans', sans-serif",
                            outline: "none",
                            width: "100%",
                          }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="ai-btn-primary"
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              fontSize: 12,
                            }}
                            onClick={handleSaveNewTone}
                            disabled={
                              !newToneName.trim() || !newTonePrompt.trim()
                            }
                          >
                            <Save style={{ width: 12, height: 12 }} /> Save Tone
                          </button>
                          <button
                            className="ai-btn-ghost"
                            onClick={() => setShowNewToneForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tone list */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {/* Saved indicator */}
                  {savedToneId && (
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 10,
                        color: "#f471b5",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      ● Saved tone active
                    </p>
                  )}

                  {allTones.map((tone) => {
                    const isActive = activeToneId === tone.id;
                    const isSaved = savedToneId === tone.id;
                    const isCustom = customTones.some((t) => t.id === tone.id);

                    return (
                      <div
                        key={tone.id}
                        className={`tone-card${isActive ? " active" : ""}${isCustom ? " saved-tone" : ""}`}
                        onClick={() => setActiveToneId(tone.id)}
                      >
                        <span
                          style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                        >
                          {tone.emoji}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: isActive ? "#eeeaf8" : "#c4b5fd",
                              }}
                            >
                              {tone.name}
                            </span>
                            {isSaved && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: "#f471b5",
                                  background: "rgba(244,113,181,0.12)",
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                Saved
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "#4b4870",
                              lineHeight: 1.4,
                            }}
                          >
                            {tone.description}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            title="Save as active tone"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSavedToneId(isSaved ? null : tone.id);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 2,
                              cursor: "pointer",
                              color: isSaved ? "#f471b5" : "#3d3960",
                              transition: "color 0.15s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#f471b5")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = isSaved
                                ? "#f471b5"
                                : "#3d3960")
                            }
                          >
                            <Save style={{ width: 12, height: 12 }} />
                          </button>
                          {isCustom && (
                            <button
                              title="Delete tone"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomTone(tone.id);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 2,
                                cursor: "pointer",
                                color: "#3d3960",
                                transition: "color 0.15s ease",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "#f87171")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "#3d3960")
                              }
                            >
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* History */}
            <div className="ai-card">
              <div className="ai-card-inner" style={{ padding: "18px 20px" }}>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  onClick={() => setShowHistory((v) => !v)}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#d4cfee",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Generation History
                    </span>
                    {history.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#7c5cfc",
                          background: "rgba(124,92,252,0.15)",
                          padding: "1px 7px",
                          borderRadius: 99,
                        }}
                      >
                        {history.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    style={{
                      width: 14,
                      height: 14,
                      color: "#6b6890",
                      transform: showHistory ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          marginTop: 14,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          maxHeight: 300,
                          overflowY: "auto",
                        }}
                        className="ai-scroll"
                      >
                        {history.length === 0 ? (
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: "#3d3960",
                              textAlign: "center",
                              padding: "12px 0",
                            }}
                          >
                            No generations yet
                          </p>
                        ) : (
                          history.map((item) => (
                            <div
                              key={item.id}
                              className="history-item"
                              onClick={() => setOutput(item.caption)}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#7c5cfc",
                                    fontWeight: 600,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {item.tone}
                                </span>
                                <span
                                  style={{ fontSize: 10, color: "#3d3960" }}
                                >
                                  {item.createdAt.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: "#8b85a8",
                                  lineHeight: 1.5,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {item.caption}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
