function HomeScreen({ navigate }) {
  const [q, setQ] = React.useState("");
  const recent = PAPERS.slice(0, 6);
  const loved = [...PAPERS].sort((a, b) => b.upvotes - a.upvotes).slice(0, 4);
  const founder = getContributor("caleb");

  return (
    <div>
      {/* Masthead */}
      <section style={{
        padding: "80px 32px 40px",
        textAlign: "center",
        maxWidth: 900,
        margin: "0 auto",
      }}>
        <div className="smallcaps" style={{ marginBottom: 24 }}>
          Est. 2019 · A community library
        </div>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 120,
          lineHeight: 0.9,
          margin: 0,
          color: "var(--ink-100)",
          letterSpacing: "-0.04em",
          fontWeight: 500,
          fontStyle: "italic",
        }}>
          Caleb's <span style={{ fontStyle: "normal" }}>Library.</span>
        </h1>
        <p style={{
          fontSize: 18,
          lineHeight: 1.55,
          color: "var(--ink-70)",
          marginTop: 24,
          maxWidth: 620,
          margin: "24px auto 0",
          textWrap: "balance",
          letterSpacing: "-0.005em",
        }}>
          A student-run library of notes, papers, and study guides.
          Open to anyone. Kept by whoever shows up.
        </p>

        {/* Big search */}
        <div style={{
          maxWidth: 640,
          margin: "48px auto 0",
          position: "relative",
        }}>
          <Icon.Search style={{
            position: "absolute", left: 22, top: "50%",
            transform: "translateY(-50%)",
            width: 20, height: 20, color: "var(--ink-40)",
          }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate("search", { query: q }); }}
            placeholder="Search for a class, subject, or paper title…"
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1px solid var(--rule-strong)",
              borderRadius: 8,
              padding: "18px 22px 18px 56px",
              fontSize: 16,
              fontFamily: "inherit",
              color: "var(--ink-100)",
              outline: "none",
              transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
              boxShadow: "0 1px 2px rgba(23,20,18,0.04)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--ink-100)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(23,20,18,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--rule-strong)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(23,20,18,0.04)";
            }}
          />
          <div style={{
            position: "absolute",
            right: 8, top: "50%",
            transform: "translateY(-50%)",
            display: "flex", gap: 4,
          }}>
            <span style={{
              padding: "3px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-40)",
              background: "var(--paper-2)",
              border: "1px solid var(--rule)",
              borderRadius: 3,
            }}>Enter ↵</span>
          </div>
        </div>

        {/* Quick browse tags */}
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink-40)", padding: "6px 0" }}>Or browse:</span>
          {SUBJECTS.slice(0, 8).map(s => (
            <button
              key={s.id}
              onClick={() => navigate("subject", { id: s.id })}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-70)",
                background: "transparent",
                border: "1px solid var(--rule-strong)",
                transition: "all var(--dur-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ink-100)"; e.currentTarget.style.color = "var(--paper)"; e.currentTarget.style.borderColor = "var(--ink-100)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-70)"; e.currentTarget.style.borderColor = "var(--rule-strong)"; }}
            >{s.name}</button>
          ))}
          <button
            onClick={() => navigate("browse")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-100)",
              background: "transparent",
              border: "1px dashed var(--rule-strong)",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
          >
            All 12 subjects <Icon.ArrowRight style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: "1px solid var(--rule)",
          display: "flex", justifyContent: "center", gap: 64,
        }}>
          <Stat value="3,247" label="Papers" />
          <Stat value="891" label="Contributors" />
          <Stat value="24.6k" label="Reads / month" />
          <Stat value="12" label="Subjects" />
        </div>
      </section>

      {/* Recent uploads */}
      <section style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "80px 32px 0" }}>
        <SectionHeader
          eyebrow="This week"
          title="Recently added"
          action={
            <button className="btn-ghost" onClick={() => navigate("browse")}>
              View all <Icon.ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 24,
        }}>
          {recent.map(p => (
            <PaperCard key={p.id} paper={p} size="sm" onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>
      </section>

      {/* Most loved */}
      <section style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "80px 32px 0" }}>
        <SectionHeader
          eyebrow="All-time"
          title="Most loved by readers"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          border: "1px solid var(--rule)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {loved.map((p, i) => (
            <LovedRow key={p.id} paper={p} rank={i + 1} onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>
      </section>

      {/* How to contribute — one-line pitch, minimal */}
      <section style={{ maxWidth: 900, margin: "96px auto 0", padding: "0 32px" }}>
        <div style={{
          padding: "48px 40px",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          background: "var(--bg-elevated)",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32,
          alignItems: "center",
        }}>
          <div>
            <div className="smallcaps" style={{ marginBottom: 12 }}>Have notes to share?</div>
            <div style={{
              fontFamily: "var(--font-sans)",
              fontSize: 30,
              color: "var(--ink-100)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              fontWeight: 500,
              marginBottom: 8,
              textWrap: "balance",
            }}>
              Pass along the notes that carried you through.
            </div>
            <div style={{ color: "var(--ink-70)", fontSize: 14, lineHeight: 1.55, maxWidth: 520 }}>
              Upload a PDF, add a title, and it goes on the shelves once a moderator confirms it. No account. No signup. Two minutes.
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("upload")} style={{ padding: "14px 24px", fontSize: 14 }}>
            Contribute a paper <Icon.ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </section>

      {/* Founder note */}
      <section style={{ maxWidth: 780, margin: "80px auto 0", padding: "0 32px" }}>
        <div style={{
          padding: "40px 8px",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
        }}>
          <Avatar user={founder} size={56} />
          <div>
            <div style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              fontStyle: "italic",
              color: "var(--ink-100)",
              lineHeight: 1.45,
              letterSpacing: "-0.005em",
              textWrap: "balance",
            }}>
              “I started this as a shared drive with three friends in 2019.
              It grew because people kept adding things. That's the whole model —
              add what you can, take what you need.”
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-40)" }}>
              <span style={{ color: "var(--ink-100)", fontWeight: 500 }}>Caleb H.</span> — founder, still uploading
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LovedRow({ paper, rank, onClick }) {
  const contributor = getContributor(paper.contributor);
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "48px 64px 1fr auto",
        gap: 20,
        padding: "24px 28px",
        cursor: "pointer",
        borderBottom: "1px solid var(--rule)",
        alignItems: "center",
        transition: "background var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 34,
        color: "var(--ink-30)",
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        {String(rank).padStart(2, "0")}
      </div>
      <BookCover paper={paper} size="xs" />
      <div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          color: "var(--ink-100)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          marginBottom: 4,
        }}>{paper.title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-40)" }}>
          {getSubject(paper.subject)?.name} · {paper.type} · {contributor?.name}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>▲ {paper.upvotes}</div>
        <div className="mono-meta" style={{ fontSize: 10, marginTop: 2 }}>
          {(paper.downloads / 1000).toFixed(1)}k reads
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
