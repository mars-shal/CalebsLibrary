function AdminScreen({ navigate }) {
  const [unlocked, setUnlocked] = React.useState(() => localStorage.getItem("calebs_admin") === "1");
  const [passphrase, setPassphrase] = React.useState("");
  const [wrongTry, setWrongTry] = React.useState(false);
  const [selected, setSelected] = React.useState(0);
  const [filter, setFilter] = React.useState("pending");

  // Passphrase gate
  if (!unlocked) {
    const submit = (e) => {
      e && e.preventDefault && e.preventDefault();
      // any non-empty passphrase works in this demo
      if (passphrase.trim().length > 0) {
        localStorage.setItem("calebs_admin", "1");
        setUnlocked(true);
      } else {
        setWrongTry(true);
      }
    };
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "96px 32px 0" }}>
        <div style={{
          padding: "40px 32px",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          background: "var(--bg-elevated)",
        }}>
          <div style={{
            width: 44, height: 44,
            background: "var(--ink-100)", color: "var(--paper)",
            borderRadius: "50%",
            display: "grid", placeItems: "center",
            marginBottom: 20,
          }}>
            <Icon.Shield style={{ width: 20, height: 20 }} />
          </div>
          <div className="smallcaps" style={{ marginBottom: 8 }}>Moderators only</div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: 32, margin: 0, marginBottom: 8,
            color: "var(--ink-100)",
            letterSpacing: "-0.025em",
            fontWeight: 500,
          }}>Enter passphrase</h1>
          <p style={{ color: "var(--ink-70)", fontSize: 13.5, lineHeight: 1.55, marginTop: 0, marginBottom: 24 }}>
            The moderation queue is behind a shared passphrase. Ask an existing moderator
            for the current one — it rotates each semester.
          </p>
          <form onSubmit={submit}>
            <input
              className="input"
              type="password"
              placeholder="passphrase"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); setWrongTry(false); }}
              autoFocus
              style={{ fontSize: 15, padding: "12px 14px", background: "var(--paper)" }}
            />
            {wrongTry && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-100)" }}>
                That's not the passphrase.
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{
              width: "100%", justifyContent: "center", marginTop: 16, padding: "12px",
            }}>
              Unlock <Icon.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </form>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--rule)", fontSize: 12, color: "var(--ink-40)" }}>
            Not a moderator? <span onClick={() => navigate("about")} style={{ color: "var(--ink-100)", cursor: "pointer", textDecoration: "underline" }}>Read about how moderation works.</span>
          </div>
        </div>
      </div>
    );
  }

  const queue = [
    { id: "q01", paper: PAPERS[7],  status: "pending", flags: 0, submitted: "6 hours ago",   ai: 0.02 },
    { id: "q02", paper: PAPERS[10], status: "pending", flags: 0, submitted: "9 hours ago",   ai: 0.04 },
    { id: "q03", paper: PAPERS[12], status: "pending", flags: 1, submitted: "yesterday",     ai: 0.11, note: "Contains full solutions to a currently-assigned problem set." },
    { id: "q04", paper: PAPERS[5],  status: "pending", flags: 0, submitted: "yesterday",     ai: 0.03 },
    { id: "q05", paper: PAPERS[9],  status: "pending", flags: 2, submitted: "2 days ago",    ai: 0.42, note: "Multiple pages appear generated. Flagged by 2 moderators." },
    { id: "q06", paper: PAPERS[14], status: "pending", flags: 0, submitted: "2 days ago",    ai: 0.06 },
  ];
  const current = queue[selected];

  return (
    <div>
      <div style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
        padding: "24px 32px",
      }}>
        <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="smallcaps" style={{ marginBottom: 6 }}>Moderators · You're signed in</div>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 32, margin: 0,
              color: "var(--ink-100)",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}>Moderation queue</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "pending",  label: "Pending",   count: 12 },
              { id: "flagged",  label: "Flagged",   count: 3 },
              { id: "approved", label: "Approved",  count: 218 },
              { id: "rejected", label: "Rejected",  count: 7 },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{
                  padding: "8px 14px", fontSize: 13, fontWeight: 500,
                  borderRadius: 4,
                  background: filter === f.id ? "var(--ink-100)" : "transparent",
                  color: filter === f.id ? "var(--paper)" : "var(--ink-70)",
                  border: `1px solid ${filter === f.id ? "var(--ink-100)" : "var(--rule-strong)"}`,
                  display: "flex", gap: 8, alignItems: "center",
                }}
              >
                {f.label}
                <span style={{
                  padding: "1px 6px", fontSize: 10, fontFamily: "var(--font-mono)",
                  borderRadius: 2,
                  background: filter === f.id ? "rgba(255,255,255,0.15)" : "var(--paper-2)",
                }}>{f.count}</span>
              </button>
            ))}
            <button
              onClick={() => { localStorage.removeItem("calebs_admin"); setUnlocked(false); }}
              className="btn-ghost"
              style={{ fontSize: 12 }}
            >Sign out</button>
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        maxWidth: "var(--max-content)",
        margin: "0 auto",
        borderLeft: "1px solid var(--rule)",
        borderRight: "1px solid var(--rule)",
      }}>
        <div style={{ borderRight: "1px solid var(--rule)", background: "var(--bg-elevated)" }}>
          {queue.map((q, i) => {
            const contributor = getContributor(q.paper.contributor);
            const isActive = selected === i;
            return (
              <div key={q.id} onClick={() => setSelected(i)}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--rule)",
                  borderLeft: `3px solid ${isActive ? "var(--ink-100)" : "transparent"}`,
                  background: isActive ? "var(--paper-2)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ color: "var(--ink-40)", fontSize: 10 }}>#{q.id.toUpperCase()}</span>
                  {q.flags > 0 && (
                    <span style={{
                      padding: "1px 6px", fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: "var(--ink-100)", color: "var(--paper)",
                      borderRadius: 2,
                    }}>{q.flags} FLAG{q.flags > 1 ? "S" : ""}</span>
                  )}
                  {q.ai > 0.3 && (
                    <span style={{
                      padding: "1px 6px", fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: "var(--paper-3)",
                      color: "var(--ink-100)",
                      borderRadius: 2,
                    }}>AI: {(q.ai * 100).toFixed(0)}%</span>
                  )}
                </div>
                <div style={{ fontSize: 15, color: "var(--ink-100)", fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.005em" }}>
                  {q.paper.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <Avatar user={contributor} size={16} />
                  <span style={{ fontSize: 11, color: "var(--ink-70)" }}>{contributor?.name}</span>
                  <span style={{ marginLeft: "auto" }} className="mono-meta">{q.submitted}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 32 }}>
          {current && <AdminReviewPanel item={current} />}
        </div>
      </div>
    </div>
  );
}

function AdminReviewPanel({ item }) {
  const contributor = getContributor(item.paper.contributor);
  const subject = getSubject(item.paper.subject);

  return (
    <div>
      {item.note && (
        <div style={{
          padding: "14px 18px",
          background: "var(--ink-100)",
          color: "var(--paper)",
          borderRadius: 4,
          display: "flex", gap: 12,
          marginBottom: 24,
        }}>
          <Icon.Flag style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Requires attention</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>{item.note}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 24, marginBottom: 32 }}>
        <BookCover paper={item.paper} size="md" />
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <span className="tag">{subject?.name}</span>
            <span className="tag tag-paper">{item.paper.type}</span>
          </div>
          <div style={{
            fontSize: 28,
            color: "var(--ink-100)",
            lineHeight: 1.1,
            marginBottom: 8,
            fontWeight: 500,
            letterSpacing: "-0.025em",
          }}>{item.paper.title}</div>
          <div style={{ color: "var(--ink-70)", marginBottom: 16 }}>{item.paper.subtitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ink-70)" }}>
            <Avatar user={contributor} size={22} />
            <span>{contributor?.name}</span>
            <span>·</span>
            <span className="mono" style={{ color: "var(--ink-100)" }}>{contributor?.uploads} contribs</span>
          </div>
        </div>
      </div>

      <div className="smallcaps" style={{ marginBottom: 14 }}>Automated checks</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Plagiarism",       value: "0.4%",       ok: true },
          { label: "AI-generated",     value: `${(item.ai * 100).toFixed(0)}%`, ok: item.ai < 0.15 },
          { label: "Duplicate check",  value: "None",       ok: true },
          { label: "Sensitive",        value: "Clean",      ok: true },
        ].map((c, i) => (
          <div key={i} style={{
            padding: 14,
            border: `1px solid ${c.ok ? "var(--rule)" : "var(--ink-100)"}`,
            borderRadius: 4,
            background: c.ok ? "var(--bg-elevated)" : "var(--paper-2)",
          }}>
            <div className="smallcaps" style={{ fontSize: 9, marginBottom: 6 }}>{c.label}</div>
            <div style={{
              fontSize: 15,
              fontFamily: "var(--font-mono)",
              color: "var(--ink-100)",
              fontWeight: 500,
            }}>
              {c.ok ? "✓ " : "⚠ "}{c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="smallcaps" style={{ marginBottom: 14 }}>Document preview</div>
      <div style={{ marginBottom: 32, maxWidth: 500 }}>
        <PDFPreview paper={item.paper} height={420} />
      </div>

      <div style={{
        padding: 20,
        background: "var(--bg-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
      }}>
        <div className="smallcaps" style={{ marginBottom: 14 }}>Decision</div>
        <textarea
          placeholder="Add a note to the contributor (optional)…"
          style={{
            width: "100%",
            background: "var(--paper)",
            border: "1px solid var(--rule-strong)",
            color: "var(--ink-100)",
            padding: 12, borderRadius: 4,
            fontFamily: "inherit",
            fontSize: 13,
            resize: "vertical", minHeight: 60,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>Request changes</button>
          <button className="btn btn-secondary" style={{ padding: "10px 18px" }}>
            <Icon.X style={{ width: 14, height: 14 }} /> Reject
          </button>
          <button className="btn btn-primary" style={{ padding: "10px 18px" }}>
            <Icon.Check style={{ width: 14, height: 14 }} /> Approve & publish
          </button>
        </div>
      </div>
    </div>
  );
}

window.AdminScreen = AdminScreen;
