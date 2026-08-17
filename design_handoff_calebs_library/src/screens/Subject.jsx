function SubjectScreen({ navigate, route }) {
  const id = route.id || "biology";
  const subject = getSubject(id) || SUBJECTS[0];
  const papers = papersBySubject(subject.id);
  const contributors = [...new Set(papers.map(p => p.contributor))].map(getContributor);
  const featured = papers.slice(0, 4);
  const rest = papers.slice(4);

  return (
    <div>
      {/* Subject hero — monochromatic band */}
      <div style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
        padding: "64px 32px 48px",
      }}>
        <div style={{ maxWidth: "var(--max-content)", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-40)", marginBottom: 20 }}>
            <span style={{ cursor: "pointer" }} onClick={() => navigate("home")}>Library</span>
            <Icon.Chevron style={{ width: 10, height: 10 }} />
            <span style={{ cursor: "pointer" }} onClick={() => navigate("browse")}>All subjects</span>
            <Icon.Chevron style={{ width: 10, height: 10 }} />
            <span style={{ color: "var(--ink-100)" }}>{subject.name}</span>
          </div>

          <div className="smallcaps" style={{ marginBottom: 12 }}>Department</div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: 68,
            lineHeight: 1,
            margin: 0,
            color: "var(--ink-100)",
            letterSpacing: "-0.035em",
            fontWeight: 500,
          }}>{subject.name}</h1>
          <div style={{
            display: "flex", gap: 40, marginTop: 32,
            color: "var(--ink-70)",
            fontSize: 13,
          }}>
            <div>
              <span style={{ fontSize: 22, color: "var(--ink-100)", fontWeight: 500, marginRight: 8, letterSpacing: "-0.02em" }}>{subject.count}</span>
              <span className="smallcaps" style={{ fontSize: 10 }}>Papers</span>
            </div>
            <div>
              <span style={{ fontSize: 22, color: "var(--ink-100)", fontWeight: 500, marginRight: 8, letterSpacing: "-0.02em" }}>{contributors.length}</span>
              <span className="smallcaps" style={{ fontSize: 10 }}>Contributors</span>
            </div>
            <div>
              <span style={{ fontSize: 22, color: "var(--ink-100)", fontWeight: 500, marginRight: 8, letterSpacing: "-0.02em" }}>14</span>
              <span className="smallcaps" style={{ fontSize: 10 }}>Courses</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "48px 32px 0" }}>
        <SectionHeader eyebrow="Curated by moderators" title="This term's essentials" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginBottom: 64 }}>
          {featured.map(p => (
            <PaperCard key={p.id} paper={p} size="md" onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>

        <SectionHeader eyebrow="Browse by course" title="Every course, every paper" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 64 }}>
          {[
            `${subject.name.slice(0,3).toUpperCase()} 101 — Introduction`,
            `${subject.name.slice(0,3).toUpperCase()} 201 — Foundations`,
            `${subject.name.slice(0,3).toUpperCase()} 210 — Applied Studies`,
            `${subject.name.slice(0,3).toUpperCase()} 302 — Advanced Topics`,
            `${subject.name.slice(0,3).toUpperCase()} 340 — Seminar`,
            `${subject.name.slice(0,3).toUpperCase()} 401 — Independent Study`,
          ].map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "16px 20px",
              border: "1px solid var(--rule)",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all var(--dur-fast)",
              background: "var(--bg-elevated)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink-100)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
            >
              <div style={{
                width: 3, height: 20, background: "var(--ink-100)",
              }} />
              <div style={{ flex: 1, fontSize: 15, color: "var(--ink-100)", fontWeight: 500 }}>
                {c}
              </div>
              <div className="mono-meta">{20 + i * 7} papers</div>
              <Icon.ArrowRight style={{ width: 14, height: 14, color: "var(--ink-40)" }} />
            </div>
          ))}
        </div>

        <SectionHeader eyebrow={`${papers.length} in the collection`} title="All papers" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24 }}>
          {(rest.length > 0 ? rest : featured).map(p => (
            <PaperCard key={p.id} paper={p} size="sm" onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>

        <SectionHeader eyebrow="Top contributors" title="The people behind these papers" style={{ marginTop: 64 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {contributors.slice(0, 4).map(c => c && (
            <div key={c.id} onClick={() => navigate("profile", { id: c.id })}
              style={{
                padding: 20,
                border: "1px solid var(--rule)",
                borderRadius: 6,
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer",
                transition: "all var(--dur-fast)",
                background: "var(--bg-elevated)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--ink-100)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}
            >
              <Avatar user={c} size={44} />
              <div>
                <div style={{ color: "var(--ink-100)", fontWeight: 500, fontSize: 15 }}>{c.name}</div>
                <div className="mono-meta" style={{ marginTop: 2 }}>{c.uploads} contributions</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.SubjectScreen = SubjectScreen;
