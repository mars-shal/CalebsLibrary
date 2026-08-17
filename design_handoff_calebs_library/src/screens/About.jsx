function AboutScreen({ navigate }) {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "72px 32px 0" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="smallcaps" style={{ marginBottom: 16 }}>How it works</div>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 72,
          lineHeight: 1,
          margin: 0,
          letterSpacing: "-0.03em",
          color: "var(--ink-100)",
          fontWeight: 500,
          fontStyle: "italic",
          textWrap: "balance",
        }}>What Caleb's Library is.</h1>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 20,
          color: "var(--ink-70)",
          marginTop: 24,
          lineHeight: 1.5,
          maxWidth: 640,
          letterSpacing: "-0.01em",
        }}>
          An open, community-run collection of student notes, study guides, and papers.
          Free to read, free to contribute, run by whoever shows up.
        </div>
      </div>

      <Ornament style={{ marginBottom: 48 }} />

      <div style={{
        fontSize: 16,
        lineHeight: 1.75,
        color: "var(--ink-100)",
        letterSpacing: "-0.005em",
      }}>
        <p style={{ marginTop: 0 }}>
          It began, as most useful things do, as a shared folder.
          Caleb H. and three friends kept their notes in one place in 2019.
          That folder spread — first to their year, then to the years below them,
          then to departments they'd never taken.
        </p>
        <p>
          Today it holds three thousand documents.
          Every one of them was left behind by a student who wanted the next
          person to have a slightly easier time than they did.
        </p>

        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 28, marginTop: 56, marginBottom: 20,
          letterSpacing: "-0.025em",
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>Three rules.</h2>

        <ol style={{ paddingLeft: 0, listStyle: "none" }}>
          {[
            { t: "Attribution is not optional.", b: "Every paper carries the name of the person who contributed it. Take credit for your work; give credit to others'." },
            { t: "No commercial reuse.", b: "The library is a gift from the community to the community. It stays that way." },
            { t: "Moderators have the last word.", b: "A small rotating group of contributors reviews every submission. They approve, request changes, or reject. Their decisions are appealable, but final." },
          ].map((r, i) => (
            <li key={i} style={{
              display: "grid",
              gridTemplateColumns: "72px 1fr",
              gap: 20,
              marginBottom: 24,
              paddingTop: 20,
              borderTop: i > 0 ? "1px solid var(--rule)" : "none",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--ink-40)",
                letterSpacing: 0.04,
                paddingTop: 6,
              }}>
                {["RULE 01","RULE 02","RULE 03"][i]}
              </div>
              <div>
                <div style={{
                  fontSize: 20,
                  color: "var(--ink-100)",
                  marginBottom: 6,
                  fontWeight: 500,
                  letterSpacing: "-0.015em",
                }}>{r.t}</div>
                <div style={{ color: "var(--ink-70)", fontSize: 15, lineHeight: 1.65 }}>
                  {r.b}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 28, marginTop: 56, marginBottom: 20,
          letterSpacing: "-0.025em",
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>Who runs this.</h2>

        <p>
          Nobody, and everybody. Caleb started it; a rotating group of about a dozen
          contributors keeps it running. There's no university behind it,
          no company, no ads. If it stops working, whoever's around fixes it.
        </p>

        <p>
          Uploads ask for a name and email — the email stays private and is only
          used if a moderator needs to reach you.
          There are no accounts to create, nothing to log in to. Read, upload, or leave.
        </p>

        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 28, marginTop: 56, marginBottom: 20,
          letterSpacing: "-0.025em",
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>Want to help.</h2>

        <p>
          Upload something. Comment on something. Flag something that shouldn't be here.
          If you want to be a moderator, contribute a dozen papers first — we ask the
          top contributors when a moderator spot opens.
        </p>
      </div>

      {/* Contributors card */}
      <div style={{
        marginTop: 72,
        padding: 32,
        border: "1px solid var(--rule)",
        borderRadius: 6,
        background: "var(--bg-elevated)",
      }}>
        <div className="smallcaps" style={{ marginBottom: 20 }}>Current moderators</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {CONTRIBUTORS.slice(0, 8).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}
              onClick={() => navigate("profile", { id: c.id })}
            >
              <Avatar user={c} size={28} />
              <div style={{ minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: "var(--ink-100)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.name}
                </div>
                <div className="mono-meta" style={{ fontSize: 10 }}>{c.handle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 48, marginBottom: 96, display: "flex", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("upload")}>Contribute a paper</button>
        <button className="btn btn-secondary" onClick={() => navigate("browse")}>Browse the library</button>
      </div>
    </div>
  );
}
window.AboutScreen = AboutScreen;
