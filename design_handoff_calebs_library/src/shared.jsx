// Shared UI components — Caleb's Library, light editorial

const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   Book Cover — signature visual
   ============================================================ */
function BookCover({ paper, size = "md", style = {}, onClick }) {
  const cover = COVERS[paper.cover % COVERS.length];
  const sub = getSubject(paper.subject);

  const sizes = {
    xs:  { w: 68,  fs: 8,   sub: 6.5, pad: 6 },
    sm:  { w: 92,  fs: 11,  sub: 8,   pad: 8 },
    md:  { w: 132, fs: 15,  sub: 10,  pad: 12 },
    lg:  { w: 180, fs: 20,  sub: 12,  pad: 16 },
    xl:  { w: 240, fs: 26,  sub: 14,  pad: 20 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className="book-cover"
      onClick={onClick}
      style={{
        width: s.w,
        background: cover.bg,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        padding: `${s.pad}px ${s.pad}px ${s.pad}px ${s.pad + 8}px`,
        display: "flex", flexDirection: "column",
        color: cover.ink,
      }}>
        <div style={{
          height: 1, background: cover.accent, opacity: 0.5,
          marginBottom: s.pad * 0.6,
        }} />

        <div style={{
          fontSize: s.sub,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          color: cover.accent,
          opacity: 0.95,
        }}>
          {sub?.name || "Notes"}
        </div>

        <div style={{
          fontSize: s.fs,
          lineHeight: 1.15,
          fontWeight: 500,
          marginTop: s.pad * 0.5,
          fontFamily: "var(--font-sans)",
          letterSpacing: "-0.015em",
          textWrap: "balance",
          hyphens: "auto",
        }}>
          {paper.title}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          height: 1, background: cover.accent, opacity: 0.5,
          marginBottom: s.pad * 0.5,
        }} />
        <div style={{
          fontSize: s.sub,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          opacity: 0.8,
        }}>
          {paper.year} · {paper.pages}pp
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Paper card
   ============================================================ */
function PaperCard({ paper, onClick, size = "md" }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", gap: 12,
        cursor: "pointer",
        transition: "transform var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <BookCover paper={paper} size={size} />
      <div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14.5,
          color: "var(--ink-100)",
          lineHeight: 1.3,
          fontWeight: 500,
          marginBottom: 4,
          letterSpacing: "-0.01em",
          textWrap: "balance",
        }}>{paper.title}</div>
        <div className="mono-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{paper.type}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <Icon.ArrowUp style={{ width: 11, height: 11 }} />
            {paper.upvotes}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Avatar (data.color-agnostic — always monochromatic)
   ============================================================ */
function Avatar({ user, size = 32 }) {
  if (!user) return null;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {user.initials}
    </div>
  );
}

/* ============================================================
   Section header
   ============================================================ */
function SectionHeader({ eyebrow, title, action, style = {} }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      marginBottom: 24, gap: 16, ...style,
    }}>
      <div>
        {eyebrow && (
          <div className="smallcaps" style={{ marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 26,
          color: "var(--ink-100)",
          letterSpacing: "-0.02em",
          fontWeight: 500,
          lineHeight: 1.1,
        }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   PDF preview mock — light paper page
   ============================================================ */
function PDFPreview({ paper, height = 520 }) {
  return (
    <div style={{
      background: "#fdfaf3",
      borderRadius: 4,
      boxShadow: "0 20px 60px rgba(23,20,18,0.15), 0 4px 12px rgba(23,20,18,0.08)",
      border: "1px solid rgba(23,20,18,0.06)",
      overflow: "hidden",
      height,
      position: "relative",
    }}>
      <div style={{
        padding: "40px 44px",
        color: "var(--ink-100)",
        fontFamily: "var(--font-sans)",
        height: "100%",
        display: "flex", flexDirection: "column",
      }}>
        <div className="smallcaps" style={{ marginBottom: 32, fontSize: 10 }}>
          Caleb's Library · {getSubject(paper.subject)?.name}
        </div>
        <div style={{
          fontSize: 30, lineHeight: 1.1, marginBottom: 8, fontWeight: 500,
          letterSpacing: "-0.02em",
        }}>{paper.title}</div>
        <div style={{ fontSize: 14, color: "var(--ink-40)", marginBottom: 4 }}>
          {paper.subtitle}
        </div>
        <div className="mono" style={{ color: "var(--ink-30)", marginBottom: 24 }}>
          {paper.teacher} · {paper.year}
        </div>

        <div style={{ height: 1, background: "var(--rule-strong)", marginBottom: 24 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>1. Introduction</div>
          {[100, 92, 96, 88, 74].map((w, i) => (
            <div key={i} style={{
              height: 8, width: `${w}%`,
              background: "var(--ink-100)",
              opacity: 0.09, borderRadius: 2,
            }} />
          ))}
          <div style={{ height: 12 }} />
          {[95, 100, 91, 68].map((w, i) => (
            <div key={i} style={{
              height: 8, width: `${w}%`,
              background: "var(--ink-100)",
              opacity: 0.09, borderRadius: 2,
            }} />
          ))}
          <div style={{ height: 20 }} />
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>2. Core Concepts</div>
          {[100, 87, 93, 82, 96, 71].map((w, i) => (
            <div key={i} style={{
              height: 8, width: `${w}%`,
              background: "var(--ink-100)",
              opacity: 0.09, borderRadius: 2,
            }} />
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ink-40)",
          borderTop: "1px solid var(--rule)",
          paddingTop: 12,
        }}>— 1 —</div>
      </div>
    </div>
  );
}

/* ============================================================
   Ornament
   ============================================================ */
function Ornament({ style = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-30)", ...style }}>
      <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.4 }} />
      <div style={{ width: 4, height: 4, background: "currentColor", borderRadius: "50%" }} />
      <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.4 }} />
    </div>
  );
}

/* ============================================================
   Stat
   ============================================================ */
function Stat({ value, label }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-sans)",
        fontSize: 32,
        color: "var(--ink-100)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        fontWeight: 500,
      }}>{value}</div>
      <div className="smallcaps" style={{ marginTop: 6, fontSize: 10 }}>{label}</div>
    </div>
  );
}

Object.assign(window, {
  BookCover, PaperCard, Avatar, SectionHeader, PDFPreview, Ornament, Stat,
});
