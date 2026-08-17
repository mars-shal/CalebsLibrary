function PaperDetailScreen({ navigate, route }) {
  const paper = getPaper(route.id) || PAPERS[0];
  const contributor = getContributor(paper.contributor);
  const subject = getSubject(paper.subject);
  const [tab, setTab] = React.useState("preview");
  const [voted, setVoted] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  const related = PAPERS.filter(p => p.subject === paper.subject && p.id !== paper.id).slice(0, 4);

  const citations = {
    APA:     `${contributor?.name}. (${paper.year}). ${paper.title}: ${paper.subtitle}. Caleb's Library.`,
    MLA:     `${contributor?.name}. "${paper.title}." ${paper.subtitle}, Caleb's Library, ${paper.year}.`,
    Chicago: `${contributor?.name}. "${paper.title}." ${paper.subtitle}. Caleb's Library, ${paper.year}.`,
    BibTeX:  `@misc{${paper.id},\n  author = {${contributor?.name}},\n  title  = {${paper.title}},\n  year   = {${paper.year}},\n  note   = {${paper.subtitle}},\n  url    = {calebslibrary.org/paper/${paper.id}}\n}`,
  };

  return (
    <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "40px 32px 0" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-40)", marginBottom: 24 }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate("browse")}>Library</span>
        <Icon.Chevron style={{ width: 10, height: 10 }} />
        <span style={{ cursor: "pointer" }} onClick={() => navigate("subject", { id: paper.subject })}>{subject?.name}</span>
        <Icon.Chevron style={{ width: 10, height: 10 }} />
        <span style={{ color: "var(--ink-100)" }}>{paper.type}</span>
      </div>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 40, marginBottom: 40 }}>
        <BookCover paper={paper} size="lg" />
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <span className="tag">{subject?.name}</span>
            <span className="tag tag-paper">{paper.type}</span>
            <span className="tag tag-paper">{paper.year}</span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: 44,
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "-0.03em",
            color: "var(--ink-100)",
            fontWeight: 500,
            textWrap: "balance",
          }}>{paper.title}</h1>
          <div style={{ fontSize: 17, color: "var(--ink-70)", marginTop: 8 }}>
            {paper.subtitle}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("profile", { id: contributor.id })}>
              <Avatar user={contributor} size={32} />
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-100)", fontWeight: 500 }}>{contributor?.name}</div>
                <div className="mono-meta">{contributor?.uploads} contributions</div>
              </div>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--rule)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-70)" }}>
              <Icon.File style={{ width: 14, height: 14 }} /> {paper.pages} pages · PDF
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-70)" }}>
              <Icon.Eye style={{ width: 14, height: 14 }} /> {paper.views.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-70)" }}>
              <Icon.Clock style={{ width: 14, height: 14 }} /> Uploaded 3 weeks ago
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
          <button className="btn btn-primary" style={{ padding: "12px 20px", justifyContent: "center" }}>
            <Icon.Download style={{ width: 16, height: 16 }} />
            Download PDF
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px" }} onClick={() => setSaved(!saved)}>
              <Icon.Bookmark style={{ width: 15, height: 15, fill: saved ? "var(--ink-100)" : "none" }} />
              {saved ? "Saved" : "Save"}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px" }}>
              <Icon.Share style={{ width: 15, height: 15 }} /> Share
            </button>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            border: "1px solid var(--rule-strong)",
            borderRadius: 4,
            padding: 4,
            marginTop: 4,
          }}>
            <button
              onClick={() => setVoted(voted === 1 ? 0 : 1)}
              style={{
                flex: 1, padding: 8,
                borderRadius: 3,
                background: voted === 1 ? "var(--ink-100)" : "transparent",
                color: voted === 1 ? "var(--paper)" : "var(--ink-70)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500,
              }}
            >
              <Icon.ArrowUp style={{ width: 14, height: 14 }} />
              {paper.upvotes + (voted === 1 ? 1 : 0)}
            </button>
            <div style={{ width: 1, height: 20, background: "var(--rule)" }} />
            <button
              onClick={() => setVoted(voted === -1 ? 0 : -1)}
              style={{
                padding: 8, width: 40,
                borderRadius: 3,
                background: voted === -1 ? "var(--ink-100)" : "transparent",
                color: voted === -1 ? "var(--paper)" : "var(--ink-70)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon.ArrowDown style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: "6px", justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.Flag style={{ width: 12, height: 12 }} /> Report an issue
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40 }}>
        <div>
          <div style={{
            display: "flex", gap: 4,
            borderBottom: "1px solid var(--rule)",
            marginBottom: 24,
          }}>
            {[
              { id: "preview",   label: "Preview" },
              { id: "citation",  label: "Citation" },
              { id: "comments",  label: "Discussion (14)" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: tab === t.id ? "var(--ink-100)" : "var(--ink-40)",
                  borderBottom: `2px solid ${tab === t.id ? "var(--ink-100)" : "transparent"}`,
                  marginBottom: -1,
                }}
              >{t.label}</button>
            ))}
          </div>

          {tab === "preview" && (
            <div>
              <div style={{
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
                borderRadius: 6,
                padding: 32,
                position: "relative",
              }}>
                <PDFPreview paper={paper} height={720} />
                <div style={{
                  position: "absolute", bottom: 32, left: 0, right: 0,
                  display: "flex", justifyContent: "center", gap: 12,
                }}>
                  <div style={{
                    background: "rgba(23,20,18,0.92)",
                    backdropFilter: "blur(6px)",
                    padding: "8px 14px",
                    borderRadius: 999,
                    display: "flex", alignItems: "center", gap: 14,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--paper)",
                  }}>
                    <button style={{ opacity: 0.5, color: "var(--paper)" }}><Icon.ArrowLeft style={{ width: 14, height: 14 }} /></button>
                    <span>Page 1 of {paper.pages}</span>
                    <button style={{ color: "var(--paper)" }}><Icon.ArrowRight style={{ width: 14, height: 14 }} /></button>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--ink-40)" }}>
                Scroll to preview more pages · Download for the full document
              </div>
            </div>
          )}

          {tab === "citation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(citations).map(([style, text]) => (
                <div key={style} style={{
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  padding: 20,
                  background: "var(--bg-elevated)",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 12,
                  }}>
                    <div className="smallcaps">{style}</div>
                    <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Copy</button>
                  </div>
                  <div style={{
                    fontFamily: style === "BibTeX" ? "var(--font-mono)" : "var(--font-sans)",
                    fontSize: style === "BibTeX" ? 12 : 14,
                    color: "var(--ink-100)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}>{text}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "comments" && (
            <div>
              <div style={{
                display: "flex", gap: 12, marginBottom: 24,
                padding: 16,
                border: "1px solid var(--rule)",
                borderRadius: 6,
                background: "var(--bg-elevated)",
              }}>
                <Avatar user={CONTRIBUTORS[0]} size={32} />
                <div style={{ flex: 1 }}>
                  <textarea
                    placeholder="Add to the discussion. Anyone can comment; a name is nice but not required."
                    style={{
                      width: "100%", background: "transparent",
                      border: "none", outline: "none",
                      color: "var(--ink-100)", fontFamily: "inherit",
                      fontSize: 14, lineHeight: 1.55, resize: "vertical", minHeight: 60,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <input placeholder="Your name (optional)" style={{
                      background: "transparent", border: "none", outline: "none",
                      fontFamily: "inherit", fontSize: 12, color: "var(--ink-70)", padding: 4,
                    }} />
                    <button className="btn btn-primary" style={{ fontSize: 13, padding: "6px 14px" }}>Post</button>
                  </div>
                </div>
              </div>

              {[
                { u: 1, t: "2 days ago", body: "This absolutely saved me for the midterm. The diagram on page 12 is worth the download alone." },
                { u: 5, t: "1 week ago", body: "Small correction — the enzyme name on page 8 should be RuBisCO (with a lowercase b). Otherwise, phenomenal work.", replies: 2 },
                { u: 3, t: "3 weeks ago", body: "Requested access for our class group. Prof. Halloway referenced these notes explicitly last lecture." },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "16px 4px", borderBottom: "1px solid var(--rule)" }}>
                  <Avatar user={CONTRIBUTORS[c.u]} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--ink-100)", fontWeight: 500 }}>{CONTRIBUTORS[c.u].name}</span>
                      <span className="mono-meta">{c.t}</span>
                    </div>
                    <div style={{ color: "var(--ink-70)", fontSize: 14, lineHeight: 1.55 }}>{c.body}</div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--ink-40)" }}>
                      <button style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.ArrowUp style={{ width: 11, height: 11 }} />{12 - i * 3}</button>
                      <button>Reply</button>
                      {c.replies && <span>{c.replies} replies</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div style={{
            border: "1px solid var(--rule)",
            borderRadius: 6,
            padding: 20,
            marginBottom: 24,
            background: "var(--bg-elevated)",
          }}>
            <div className="smallcaps" style={{ marginBottom: 14 }}>Details</div>
            {[
              ["Course", `${paper.subject.slice(0,3).toUpperCase()} 302`],
              ["Professor", paper.teacher],
              ["Semester", `Fall ${paper.year}`],
              ["Language", "English"],
              ["License", "CC BY-NC 4.0"],
              ["Size", `${(paper.pages * 0.08).toFixed(1)} MB`],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                fontSize: 13,
                borderBottom: "1px solid var(--rule)",
              }}>
                <span style={{ color: "var(--ink-40)" }}>{k}</span>
                <span style={{ color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="smallcaps" style={{ marginBottom: 14 }}>Related</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {related.map(p => (
              <div key={p.id} onClick={() => navigate("paper", { id: p.id })} style={{
                display: "flex", gap: 10,
                padding: 10,
                borderRadius: 4,
                cursor: "pointer",
                transition: "background var(--dur-fast)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}
              >
                <BookCover paper={p} size="xs" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    color: "var(--ink-100)",
                    fontWeight: 500,
                    lineHeight: 1.3,
                    letterSpacing: "-0.005em",
                    marginBottom: 4,
                  }}>{p.title}</div>
                  <div className="mono-meta">{p.type} · ▲{p.upvotes}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
window.PaperDetailScreen = PaperDetailScreen;
