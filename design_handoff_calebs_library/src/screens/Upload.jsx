function UploadScreen({ navigate }) {
  const [step, setStep] = React.useState(1);
  const [file, setFile] = React.useState(null);
  const [dragging, setDragging] = React.useState(false);
  const [form, setForm] = React.useState({
    contributorName: "",
    contributorEmail: "",
    title: "",
    subject: "",
    type: "Study Guide",
    course: "",
    professor: "",
    year: 2026,
    description: "",
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 32px 0" }}>
      <div style={{ marginBottom: 40 }}>
        <div className="smallcaps" style={{ marginBottom: 12 }}>Contribute</div>
        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 44,
          margin: 0,
          color: "var(--ink-100)",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          fontWeight: 500,
        }}>Add to the library.</h1>
        <p style={{ color: "var(--ink-70)", fontSize: 15, marginTop: 12, maxWidth: 560, lineHeight: 1.55 }}>
          Your notes carried you through the semester. Pass them along.
          <span style={{ color: "var(--ink-100)" }}> No account required</span> — just tell us who you are so we can credit you, and a moderator will review before it goes live.
        </p>
      </div>

      {/* Stepper */}
      <div style={{
        display: "flex", alignItems: "center",
        marginBottom: 40,
        padding: "20px 24px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
      }}>
        {[
          { n: 1, t: "Upload file" },
          { n: 2, t: "Your details" },
          { n: 3, t: "Review & submit" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 26, height: 26,
                borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: step >= s.n ? "var(--ink-100)" : "transparent",
                border: `1.5px solid ${step >= s.n ? "var(--ink-100)" : "var(--ink-30)"}`,
                color: step >= s.n ? "var(--paper)" : "var(--ink-40)",
                fontSize: 13, fontWeight: 600,
              }}>
                {step > s.n ? <Icon.Check style={{ width: 12, height: 12 }} /> : s.n}
              </div>
              <div>
                <div className="smallcaps" style={{ fontSize: 9 }}>Step {s.n}</div>
                <div style={{
                  fontSize: 13.5,
                  color: step >= s.n ? "var(--ink-100)" : "var(--ink-40)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}>{s.t}</div>
              </div>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? "var(--ink-100)" : "var(--rule)", margin: "0 20px", transition: "background var(--dur-med)" }} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) setFile({ name: f.name, size: f.size });
            }}
            onClick={() => setFile({ name: "photosynthesis-c4-notes.pdf", size: 1_240_000 })}
            style={{
              border: `2px dashed ${dragging ? "var(--ink-100)" : "var(--rule-strong)"}`,
              borderRadius: 8,
              padding: "72px 32px",
              textAlign: "center",
              background: dragging ? "var(--paper-2)" : "var(--bg-elevated)",
              transition: "all var(--dur-fast)",
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 56, height: 56,
              margin: "0 auto 20px",
              display: "grid", placeItems: "center",
              background: "var(--paper-2)",
              borderRadius: "50%",
              color: "var(--ink-100)",
            }}>
              <Icon.Upload style={{ width: 22, height: 22 }} />
            </div>
            <div style={{
              fontSize: 26,
              color: "var(--ink-100)",
              fontWeight: 500,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>
              {file ? "One file, ready to catalog." : "Drop a file to begin."}
            </div>
            <div style={{ color: "var(--ink-70)", marginBottom: 20, fontSize: 14 }}>
              {file
                ? "Continue below to add details, or drop another file."
                : "PDF, DOCX, PPTX, or images. Up to 25 MB per file."}
            </div>
            {!file && (
              <button className="btn btn-primary" style={{ padding: "12px 24px" }}>
                Choose a file
              </button>
            )}
          </div>

          {file && (
            <div style={{
              marginTop: 20,
              padding: 16,
              border: "1px solid var(--rule)",
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 16,
              background: "var(--bg-elevated)",
            }}>
              <div style={{
                width: 44, height: 56,
                background: "var(--ink-100)",
                color: "var(--paper)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 2,
              }}>PDF</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--ink-100)", fontWeight: 500 }}>{file.name}</div>
                <div className="mono-meta" style={{ marginTop: 2 }}>{(file.size / 1_000_000).toFixed(2)} MB · Uploaded</div>
              </div>
              <div style={{
                width: 20, height: 20,
                borderRadius: "50%",
                background: "var(--ink-100)",
                color: "var(--paper)",
                display: "grid", placeItems: "center",
              }}>
                <Icon.Check style={{ width: 12, height: 12 }} />
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setFile(null)}>
                <Icon.X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => navigate("home")}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ opacity: file ? 1 : 0.4, pointerEvents: file ? "auto" : "none" }}
              onClick={() => setStep(2)}
            >
              Continue <Icon.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          {/* CONTRIBUTOR SECTION — new for no-auth */}
          <div style={{
            padding: 24,
            border: "1px solid var(--ink-100)",
            borderRadius: 6,
            marginBottom: 32,
            background: "var(--bg-elevated)",
          }}>
            <div className="smallcaps" style={{ color: "var(--ink-100)", marginBottom: 6 }}>Who's contributing?</div>
            <div style={{ fontSize: 15, color: "var(--ink-100)", fontWeight: 500, marginBottom: 4 }}>
              Since there's no account, we ask each time.
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-70)", marginBottom: 20, lineHeight: 1.55 }}>
              Your name will appear as the contributor. Your email is used only to reach you
              if a moderator has a question — it stays private.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Your name" required>
                <input className="input" placeholder="First name, or a handle"
                  value={form.contributorName}
                  onChange={(e) => setForm({ ...form, contributorName: e.target.value })} />
              </FormField>
              <FormField label="Email" required hint="Never shown publicly">
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.contributorEmail}
                  onChange={(e) => setForm({ ...form, contributorEmail: e.target.value })} />
              </FormField>
            </div>
          </div>

          {/* Paper details */}
          <div style={{ display: "grid", gap: 20 }}>
            <FormField label="Title" required>
              <input className="input" placeholder="e.g. Photosynthesis in C4 Plants"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Subject" required>
                <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Choose a subject…</option>
                  {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Type" required>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {["Study Guide", "Lecture Notes", "Past Exam", "Problem Set", "Essay", "Cheat Sheet", "Slides", "Project"].map(t =>
                    <option key={t}>{t}</option>
                  )}
                </select>
              </FormField>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16 }}>
              <FormField label="Course code">
                <input className="input" placeholder="e.g. BIO 302" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
              </FormField>
              <FormField label="Professor">
                <input className="input" placeholder="e.g. Prof. Halloway" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} />
              </FormField>
              <FormField label="Year">
                <input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} />
              </FormField>
            </div>

            <FormField label="Description" hint="One paragraph. What's in here, and who does it help?">
              <textarea className="input" rows={4}
                style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.55 }}
                placeholder="A quick note about what these cover…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>

            <FormField label="License">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { id: "cc-by-nc", title: "CC BY-NC 4.0 — Attribution, non-commercial", rec: true },
                  { id: "cc-by",    title: "CC BY 4.0 — Attribution required", rec: false },
                  { id: "public",   title: "Public Domain (CC0)", rec: false },
                ].map(l => (
                  <label key={l.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px",
                    border: `1px solid ${l.rec ? "var(--ink-100)" : "var(--rule)"}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    background: l.rec ? "var(--paper-2)" : "transparent",
                  }}>
                    <input type="radio" name="license" defaultChecked={l.rec} style={{ accentColor: "var(--ink-100)" }} />
                    <span style={{ fontSize: 13, color: "var(--ink-100)", flex: 1 }}>{l.title}</span>
                    {l.rec && <span className="tag" style={{ fontSize: 9 }}>RECOMMENDED</span>}
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <Icon.ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Review <Icon.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            gap: 32,
            padding: 32,
            border: "1px solid var(--rule)",
            borderRadius: 6,
            background: "var(--bg-elevated)",
          }}>
            <div style={{
              aspectRatio: "2 / 3",
              background: "var(--ink-100)",
              color: "var(--paper)",
              display: "flex", flexDirection: "column",
              padding: 16,
              borderRadius: "2px 6px 6px 2px",
              boxShadow: "var(--shadow-book)",
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--paper-3)", fontWeight: 600 }}>
                {form.subject ? getSubject(form.subject)?.name : "Subject"}
              </div>
              <div style={{ fontSize: 15, marginTop: 12, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.015em" }}>
                {form.title || "Your paper title"}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                {form.year} · {file ? Math.round(file.size / 40000) : 24}pp
              </div>
            </div>

            <div>
              <div className="smallcaps" style={{ marginBottom: 6 }}>Preview</div>
              <div style={{
                fontSize: 28,
                color: "var(--ink-100)",
                fontWeight: 500,
                lineHeight: 1.1,
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}>{form.title || "Untitled paper"}</div>
              <div style={{ color: "var(--ink-70)", marginBottom: 20 }}>
                {form.course && `${form.course} · `}{form.professor || "—"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  ["Contributor", form.contributorName || "—"],
                  ["Subject", getSubject(form.subject)?.name || "—"],
                  ["Type", form.type],
                  ["Year", form.year],
                ].map(([k,v]) => (
                  <div key={k}>
                    <div className="mono-meta" style={{ fontSize: 10 }}>{k}</div>
                    <div style={{ color: "var(--ink-100)", fontSize: 13, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: 14,
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
                borderRadius: 4,
                display: "flex", gap: 10,
                fontSize: 13, lineHeight: 1.5,
                color: "var(--ink-70)",
              }}>
                <Icon.Info style={{ width: 15, height: 15, color: "var(--ink-100)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  A moderator will review within 24–48 hours. If they need to reach you,
                  they'll email <span style={{ color: "var(--ink-100)" }}>{form.contributorEmail || "your address"}</span>.
                  Your name will appear as the contributor once it's live.
                </div>
              </div>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 24, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ accentColor: "var(--ink-100)", marginTop: 3 }} />
            <span style={{ fontSize: 13, color: "var(--ink-70)", lineHeight: 1.55 }}>
              I confirm this is my own work (or I have permission to share it),
              and I understand it will be publicly readable once approved.
            </span>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <Icon.ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => navigate("home")}>
              Submit for review <Icon.Check style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, hint, required, children }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, color: "var(--ink-100)",
        marginBottom: 8, fontWeight: 500, letterSpacing: "0.01em",
      }}>
        {label}
        {required && <span style={{ color: "var(--ink-100)" }}>*</span>}
        {hint && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-40)", fontWeight: 400 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

window.UploadScreen = UploadScreen;
