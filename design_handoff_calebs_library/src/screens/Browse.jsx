function BrowseScreen({ navigate }) {
  const [view, setView] = React.useState("shelf");
  const [activeSubject, setActiveSubject] = React.useState("all");
  const [activeType, setActiveType] = React.useState("all");

  const filtered = PAPERS.filter(p => {
    if (activeSubject !== "all" && p.subject !== activeSubject) return false;
    if (activeType !== "all" && p.type !== activeType) return false;
    return true;
  });

  const types = ["all", ...new Set(PAPERS.map(p => p.type))];

  return (
    <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "48px 32px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="smallcaps" style={{ marginBottom: 12 }}>The library</div>
        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 44,
          margin: 0,
          color: "var(--ink-100)",
          letterSpacing: "-0.03em",
          fontWeight: 500,
          lineHeight: 1.05,
        }}>Everything, sorted by subject.</h1>
        <p style={{
          color: "var(--ink-70)",
          fontSize: 15,
          marginTop: 12,
          maxWidth: 620,
        }}>
          Hover a book to lift it. Click to open. Every paper was uploaded by someone
          who wanted the next reader to have an easier time.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        marginBottom: 40,
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-40)", fontSize: 11 }}>
          <Icon.Filter style={{ width: 13, height: 13 }} />
          <span className="smallcaps" style={{ fontSize: 10 }}>Filter</span>
        </div>

        <FilterPills
          value={activeSubject}
          onChange={setActiveSubject}
          options={[{ id: "all", label: "All" }, ...SUBJECTS.slice(0, 8).map(s => ({ id: s.id, label: s.name }))]}
        />

        <div style={{ width: 1, height: 20, background: "var(--rule)" }} />

        <FilterPills
          value={activeType}
          onChange={setActiveType}
          options={types.map(t => ({ id: t, label: t === "all" ? "All types" : t }))}
        />

        <div style={{ flex: 1 }} />

        <div className="mono-meta">
          {filtered.length} paper{filtered.length !== 1 ? "s" : ""}
        </div>

        <div style={{
          display: "flex", gap: 2,
          background: "var(--paper-2)",
          padding: 3, borderRadius: 4,
        }}>
          <ViewToggleBtn active={view === "shelf"} onClick={() => setView("shelf")}>
            <Icon.Books style={{ width: 13, height: 13 }} /> Shelves
          </ViewToggleBtn>
          <ViewToggleBtn active={view === "grid"} onClick={() => setView("grid")}>
            <Icon.Grid style={{ width: 13, height: 13 }} /> Grid
          </ViewToggleBtn>
        </div>
      </div>

      {view === "shelf" ? (
        <ShelfView papers={filtered} navigate={navigate} />
      ) : (
        <GridView papers={filtered} navigate={navigate} />
      )}
    </div>
  );
}

function FilterPills({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              borderRadius: 3,
              background: active ? "var(--ink-100)" : "transparent",
              color: active ? "var(--paper)" : "var(--ink-70)",
              transition: "all var(--dur-fast)",
              whiteSpace: "nowrap",
            }}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}

function ViewToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 10px",
        borderRadius: 3,
        background: active ? "#ffffff" : "transparent",
        color: active ? "var(--ink-100)" : "var(--ink-40)",
        fontSize: 12,
        fontWeight: 500,
        boxShadow: active ? "0 1px 2px rgba(23,20,18,0.08)" : "none",
        transition: "all var(--dur-fast)",
      }}
    >{children}</button>
  );
}

/* Shelves — light theme. Ink-toned wooden band replaced with a thin dark rule. */
function ShelfView({ papers, navigate }) {
  const bySubject = {};
  papers.forEach(p => {
    (bySubject[p.subject] = bySubject[p.subject] || []).push(p);
  });
  const subjectIds = Object.keys(bySubject);

  if (subjectIds.length === 0) {
    return (
      <div style={{
        padding: "80px 20px", textAlign: "center",
        color: "var(--ink-40)",
        border: "1px dashed var(--rule-strong)",
        borderRadius: 6,
      }}>
        <div style={{ fontSize: 22, color: "var(--ink-100)", marginBottom: 8, fontWeight: 500 }}>
          These shelves are empty
        </div>
        <div>Try loosening your filters.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {subjectIds.map(sId => {
        const subj = getSubject(sId);
        const items = bySubject[sId];
        return (
          <div key={sId}>
            {/* Shelf label */}
            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "1px solid var(--rule)",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 24,
                  color: "var(--ink-100)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                }}>{subj.name}</div>
                <div className="mono-meta">{items.length} on the shelf</div>
              </div>
              <button className="btn-ghost" onClick={() => navigate("subject", { id: sId })} style={{ fontSize: 12 }}>
                Open department <Icon.ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </div>

            {/* Shelf */}
            <div style={{ position: "relative", padding: "16px 8px 0" }}>
              <div style={{
                display: "flex", gap: 20, flexWrap: "wrap",
                paddingBottom: 20,
                position: "relative", zIndex: 2,
              }}>
                {items.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8, width: 132 }}>
                    <BookCover paper={p} size="md" onClick={() => navigate("paper", { id: p.id })} />
                  </div>
                ))}
              </div>
              {/* Neutral ink shelf */}
              <div style={{
                height: 4,
                background: "var(--ink-100)",
                borderRadius: 1,
                boxShadow: "0 8px 20px rgba(23,20,18,0.14)",
                position: "relative",
              }} />
              <div style={{
                height: 24,
                background: "linear-gradient(180deg, rgba(23,20,18,0.10), transparent)",
                filter: "blur(4px)",
                marginTop: -2,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GridView({ papers, navigate }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 32,
    }}>
      {papers.map(p => (
        <PaperCard key={p.id} paper={p} size="sm" onClick={() => navigate("paper", { id: p.id })} />
      ))}
    </div>
  );
}

window.BrowseScreen = BrowseScreen;
