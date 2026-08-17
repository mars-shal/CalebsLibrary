function ProfileScreen({ navigate, route }) {
  const user = getContributor(route.id) || CONTRIBUTORS[0];
  const papers = PAPERS.filter(p => p.contributor === user.id);
  const [tab, setTab] = React.useState("papers");

  return (
    <div>
      {/* Profile hero */}
      <div style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
        padding: "56px 32px 40px",
      }}>
        <div style={{
          maxWidth: "var(--max-content)", margin: "0 auto",
          display: "flex", gap: 32, alignItems: "flex-end", flexWrap: "wrap",
        }}>
          <div style={{ width: 96, height: 96, background: "var(--ink-100)", color: "var(--paper)", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 40, fontWeight: 500 }}>
            {user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="smallcaps" style={{ marginBottom: 8 }}>
              Contributor {user.founder && "· Founder"}
            </div>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 52,
              lineHeight: 1,
              margin: 0,
              color: "var(--ink-100)",
              letterSpacing: "-0.035em",
              fontWeight: 500,
            }}>{user.name}</h1>
            <div style={{ marginTop: 12, color: "var(--ink-70)", fontSize: 15, maxWidth: 520, lineHeight: 1.55 }}>
              {user.bio}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
              <span className="tag">{user.handle}</span>
              {user.founder && <span className="tag" style={{ background: "var(--ink-100)", color: "var(--paper)", borderColor: "var(--ink-100)" }}>Founder</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            <Stat value={user.uploads} label="Contributions" />
            <Stat value={(user.uploads * 187).toLocaleString()} label="Reads" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "40px 32px 0" }}>
        <div style={{
          display: "flex", gap: 4,
          borderBottom: "1px solid var(--rule)",
          marginBottom: 32,
        }}>
          {[
            { id: "papers",  label: `Papers (${papers.length})` },
            { id: "shelves", label: "Curated shelves" },
            { id: "about",   label: "About" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 14, fontWeight: 500,
                color: tab === t.id ? "var(--ink-100)" : "var(--ink-40)",
                borderBottom: `2px solid ${tab === t.id ? "var(--ink-100)" : "transparent"}`,
                marginBottom: -1,
              }}
            >{t.label}</button>
          ))}
        </div>

        {tab === "papers" && (
          <>
            <SectionHeader eyebrow="On the shelf" title="Contributed papers" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
              {papers.map(p => (
                <PaperCard key={p.id} paper={p} size="md" onClick={() => navigate("paper", { id: p.id })} />
              ))}
              {papers.length < 4 && [...Array(4 - papers.length)].map((_, i) => (
                <div key={i} style={{
                  aspectRatio: "2 / 3",
                  border: "1px dashed var(--rule-strong)",
                  borderRadius: 4,
                  display: "grid", placeItems: "center",
                  color: "var(--ink-30)",
                  fontSize: 12,
                }}>Empty slot</div>
              ))}
            </div>
          </>
        )}

        {tab === "shelves" && (
          <>
            <SectionHeader eyebrow="Personal collections" title="Curated shelves" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                { name: "Beowulf & Old English", count: 8 },
                { name: "Modernist essays",      count: 12 },
                { name: "First-year survival",   count: 6 },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: 24,
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  background: "var(--bg-elevated)",
                }}>
                  <Icon.Books style={{ width: 20, height: 20, color: "var(--ink-100)", marginBottom: 16 }} />
                  <div style={{ fontSize: 20, color: "var(--ink-100)", fontWeight: 500, letterSpacing: "-0.015em" }}>
                    {s.name}
                  </div>
                  <div className="mono-meta" style={{ marginTop: 6 }}>{s.count} papers</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "about" && (
          <div style={{ maxWidth: 640 }}>
            <SectionHeader eyebrow="Notes on a contributor" title={`About ${user.name.split(" ")[0]}`} />
            <div style={{
              padding: 32,
              background: "var(--bg-elevated)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--ink-100)",
            }}>
              {user.bio}
              <br /><br />
              Contributor since 2023. Uploads mostly at the end of each semester,
              when whatever carried them through gets passed forward.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
window.ProfileScreen = ProfileScreen;
