function SearchScreen({ navigate, route }) {
  const initialQ = route.query || "photosynthesis";
  const [q, setQ] = React.useState(initialQ);
  const [sort, setSort] = React.useState("relevant");
  const [selectedSubjects, setSelectedSubjects] = React.useState(new Set());
  const [selectedTypes, setSelectedTypes] = React.useState(new Set());
  const [yearRange, setYearRange] = React.useState([2024, 2026]);

  const filtered = PAPERS.filter(p => {
    if (selectedSubjects.size && !selectedSubjects.has(p.subject)) return false;
    if (selectedTypes.size && !selectedTypes.has(p.type)) return false;
    if (p.year < yearRange[0] || p.year > yearRange[1]) return false;
    return true;
  });
  const results = filtered.slice(0, 12);

  const toggleSet = (setter, val) => setter(prev => {
    const s = new Set(prev);
    s.has(val) ? s.delete(val) : s.add(val);
    return s;
  });

  return (
    <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "48px 32px 0" }}>
      {/* Big query header */}
      <div style={{ marginBottom: 32 }}>
        <div className="smallcaps" style={{ marginBottom: 12 }}>Search</div>
        <div style={{ position: "relative", maxWidth: 780 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              fontSize: 28,
              padding: "16px 20px 16px 56px",
              background: "#ffffff",
              borderColor: "var(--rule-strong)",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}
          />
          <Icon.Search style={{
            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
            width: 20, height: 20, color: "var(--ink-40)",
          }} />
        </div>
        <div style={{ marginTop: 14, color: "var(--ink-70)", fontSize: 14 }}>
          <span style={{ color: "var(--ink-100)", fontWeight: 500 }}>{results.length}</span> results for
          <span style={{ color: "var(--ink-100)", fontWeight: 500, marginLeft: 6 }}>"{q}"</span>
        </div>
      </div>

      {/* 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40 }}>
        {/* Facets */}
        <aside>
          <FacetGroup title="Subject">
            {SUBJECTS.slice(0, 8).map(s => (
              <FacetCheckbox
                key={s.id}
                checked={selectedSubjects.has(s.id)}
                onChange={() => toggleSet(setSelectedSubjects, s.id)}
                label={s.name}
                count={s.count}
              />
            ))}
          </FacetGroup>

          <FacetGroup title="Type">
            {["Study Guide", "Lecture Notes", "Past Exam", "Problem Set", "Essay", "Cheat Sheet"].map(t => (
              <FacetCheckbox
                key={t}
                checked={selectedTypes.has(t)}
                onChange={() => toggleSet(setSelectedTypes, t)}
                label={t}
                count={PAPERS.filter(p => p.type === t).length}
              />
            ))}
          </FacetGroup>

          <FacetGroup title="Year">
            <div style={{ padding: "8px 4px" }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "var(--font-mono)", fontSize: 12,
                color: "var(--ink-100)",
                marginBottom: 8,
              }}>
                <span>{yearRange[0]}</span>
                <span style={{ color: "var(--ink-30)" }}>→</span>
                <span>{yearRange[1]}</span>
              </div>
              <input type="range" min="2020" max="2026" value={yearRange[0]}
                onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
                style={{ width: "100%", accentColor: "var(--ink-100)" }} />
              <input type="range" min="2020" max="2026" value={yearRange[1]}
                onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
                style={{ width: "100%", accentColor: "var(--ink-100)" }} />
            </div>
          </FacetGroup>

          <button
            onClick={() => { setSelectedSubjects(new Set()); setSelectedTypes(new Set()); setYearRange([2020, 2026]); }}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px 12px",
              fontSize: 12,
              color: "var(--ink-70)",
              borderRadius: 4,
              border: "1px solid var(--rule)",
              background: "transparent",
              transition: "all var(--dur-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--ink-100)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}
          >
            Reset all filters
          </button>
        </aside>

        {/* Results */}
        <main>
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            paddingBottom: 16,
            borderBottom: "1px solid var(--rule)",
            marginBottom: 8,
          }}>
            <span className="smallcaps" style={{ fontSize: 10 }}>Sort by</span>
            {[
              { id: "relevant",  label: "Most relevant" },
              { id: "recent",    label: "Newest" },
              { id: "popular",   label: "Most upvoted" },
              { id: "downloads", label: "Most downloaded" },
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setSort(o.id)}
                style={{
                  fontSize: 12.5,
                  padding: "4px 0",
                  color: sort === o.id ? "var(--ink-100)" : "var(--ink-40)",
                  fontWeight: sort === o.id ? 600 : 500,
                  borderBottom: `1.5px solid ${sort === o.id ? "var(--ink-100)" : "transparent"}`,
                }}
              >{o.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {results.map(p => (
              <SearchResultRow key={p.id} paper={p} q={q} onClick={() => navigate("paper", { id: p.id })} />
            ))}
          </div>

          <div style={{
            display: "flex", justifyContent: "center", gap: 4,
            marginTop: 40, paddingTop: 24,
            borderTop: "1px solid var(--rule)",
          }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} style={{
                width: 32, height: 32, fontSize: 13,
                borderRadius: 3,
                background: n === 1 ? "var(--ink-100)" : "transparent",
                color: n === 1 ? "var(--paper)" : "var(--ink-40)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}>{n}</button>
            ))}
            <span style={{ padding: 6, color: "var(--ink-30)" }}>…</span>
            <button style={{
              width: 32, height: 32, fontSize: 13, borderRadius: 3,
              color: "var(--ink-40)", fontFamily: "var(--font-mono)",
            }}>27</button>
          </div>
        </main>
      </div>
    </div>
  );
}

function FacetGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="smallcaps" style={{
        color: "var(--ink-100)",
        marginBottom: 10,
        fontSize: 10.5,
        paddingBottom: 8,
        borderBottom: "1px solid var(--rule)",
      }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function FacetCheckbox({ label, count, checked, onChange }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "6px 2px",
      cursor: "pointer",
      color: "var(--ink-70)",
      fontSize: 13,
      transition: "color var(--dur-fast)",
    }}
    onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-100)"}
    onMouseLeave={(e) => e.currentTarget.style.color = ""}
    >
      <div style={{
        width: 14, height: 14,
        border: `1.5px solid ${checked ? "var(--ink-100)" : "var(--ink-30)"}`,
        borderRadius: 2,
        background: checked ? "var(--ink-100)" : "transparent",
        display: "grid", placeItems: "center",
        flexShrink: 0,
      }}>
        {checked && <Icon.Check style={{ width: 10, height: 10, color: "var(--paper)" }} />}
      </div>
      <input type="checkbox" checked={!!checked} onChange={onChange || (() => {})} style={{ display: "none" }} />
      <span style={{ flex: 1 }}>{label}</span>
      <span className="mono" style={{ color: "var(--ink-30)", fontSize: 10 }}>{count}</span>
    </label>
  );
}

function SearchResultRow({ paper, q, onClick }) {
  const subj = getSubject(paper.subject);
  const contributor = getContributor(paper.contributor);

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{ background: "var(--ink-100)", color: "var(--paper)", padding: "0 3px", borderRadius: 2 }}>{p}</mark>
    ) : p);
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr auto",
        gap: 24,
        padding: "24px 16px",
        borderBottom: "1px solid var(--rule)",
        cursor: "pointer",
        alignItems: "flex-start",
        transition: "background var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = ""}
    >
      <BookCover paper={paper} size="xs" />

      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <span className="tag">{subj?.name}</span>
          <span className="tag tag-paper">{paper.type}</span>
        </div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 20,
          color: "var(--ink-100)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          marginBottom: 4,
        }}>
          {highlightMatch(paper.title, q)}
        </div>
        <div style={{ color: "var(--ink-70)", fontSize: 13, marginBottom: 10 }}>
          {paper.subtitle} · {paper.teacher}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--ink-40)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar user={contributor} size={18} />
            <span>{contributor?.name}</span>
          </div>
          <span>·</span>
          <span>{paper.year}</span>
          <span>·</span>
          <span>{paper.pages} pages</span>
        </div>
      </div>

      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: 3,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>
          <Icon.ArrowUp style={{ width: 11, height: 11 }} />
          {paper.upvotes}
        </div>
        <div className="mono-meta">{paper.downloads.toLocaleString()} reads</div>
      </div>
    </div>
  );
}

window.SearchScreen = SearchScreen;
