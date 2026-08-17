// Caleb's Library — App shell (v3, light editorial)

function App() {
  const [route, setRoute] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("calebs_route") || "null") || { screen: "home" }; }
    catch { return { screen: "home" }; }
  });
  const [bannerOpen, setBannerOpen] = React.useState(() => {
    return localStorage.getItem("calebs_banner_dismissed") !== "1";
  });

  React.useEffect(() => {
    localStorage.setItem("calebs_route", JSON.stringify(route));
  }, [route]);

  const navigate = (screen, params = {}) => {
    if (screen === "back") { window.history.back(); return; }
    setRoute({ screen, ...params });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const SCREENS = {
    home:     window.HomeScreen,
    browse:   window.BrowseScreen,
    search:   window.SearchScreen,
    subject:  window.SubjectScreen,
    paper:    window.PaperDetailScreen,
    upload:   window.UploadScreen,
    profile:  window.ProfileScreen,
    admin:    window.AdminScreen,
    about:    window.AboutScreen,
    notfound: window.NotFoundScreen,
  };
  const ScreenComponent = SCREENS[route.screen] || SCREENS.notfound;

  const dismissBanner = () => {
    setBannerOpen(false);
    localStorage.setItem("calebs_banner_dismissed", "1");
  };

  return (
    <div>
      {bannerOpen && <OpenBanner onDismiss={dismissBanner} onLearnMore={() => navigate("about")} />}
      <TopStrip navigate={navigate} route={route} />
      <main data-screen-label={route.screen} key={route.screen} className="screen-wrap">
        <ScreenComponent navigate={navigate} route={route} />
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

/* ============================================================
   Open banner — top of page, dismissible
   ============================================================ */
function OpenBanner({ onDismiss, onLearnMore }) {
  return (
    <div style={{
      height: "var(--banner-h)",
      background: "var(--ink-100)",
      color: "var(--paper)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      fontSize: 12,
      letterSpacing: "-0.005em",
      position: "relative",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          display: "inline-block",
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--paper)",
          opacity: 0.7,
        }} />
        <span>
          <strong style={{ fontWeight: 600 }}>Free. Open. No account needed.</strong>
          <span style={{ opacity: 0.7, marginLeft: 10 }}>
            Anyone can read. Anyone can contribute.
          </span>
        </span>
        <button
          onClick={onLearnMore}
          style={{
            color: "var(--paper)",
            opacity: 0.8,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            fontSize: 12,
            padding: 0,
          }}
        >How it works →</button>
      </span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss banner"
        style={{
          position: "absolute", right: 12, top: "50%",
          transform: "translateY(-50%)",
          color: "var(--paper)",
          opacity: 0.5,
          padding: 6,
          borderRadius: 3,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
      >
        <Icon.X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

/* ============================================================
   Top strip — logo, search, contribute
   ============================================================ */
function TopStrip({ navigate, route }) {
  const [q, setQ] = React.useState("");
  return (
    <header style={{
      height: "var(--top-h)",
      borderBottom: "1px solid var(--rule)",
      background: "rgba(245, 242, 234, 0.92)",
      backdropFilter: "blur(8px)",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{
        maxWidth: "var(--max-content)",
        margin: "0 auto",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 32px",
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate("home")}
          style={{ display: "flex", alignItems: "baseline", gap: 6, cursor: "pointer" }}
        >
          <span style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--ink-100)",
            letterSpacing: "-0.02em",
            fontStyle: "italic",
          }}>Caleb's</span>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-40)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}>Library</span>
        </div>

        {/* Mini search — hidden on home (home has big one), shown elsewhere */}
        {route.screen !== "home" && (
          <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            <Icon.Search style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)",
              width: 14, height: 14, color: "var(--ink-40)",
            }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate("search", { query: q }); }}
              placeholder="Search the library…"
              style={{
                width: "100%",
                background: "var(--paper-2)",
                border: "1px solid transparent",
                borderRadius: 4,
                padding: "8px 12px 8px 34px",
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--ink-100)",
                outline: "none",
                transition: "border-color var(--dur-fast), background var(--dur-fast)",
              }}
              onFocus={(e) => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.borderColor = "var(--rule-strong)"; }}
              onBlur={(e) => { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>
        )}

        <div style={{ flex: route.screen === "home" ? 1 : 0 }} />

        {/* Right nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="btn-ghost" onClick={() => navigate("browse")}>Browse</button>
          <button className="btn-ghost" onClick={() => navigate("about")}>About</button>
          <button className="btn btn-primary" onClick={() => navigate("upload")} style={{ padding: "8px 14px" }}>
            <Icon.Plus style={{ width: 13, height: 13 }} /> Contribute
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ============================================================
   Footer — thin, community credit
   ============================================================ */
function Footer({ navigate }) {
  return (
    <footer style={{
      marginTop: 96,
      borderTop: "1px solid var(--rule)",
      padding: "40px 32px 48px",
      background: "var(--paper-2)",
    }}>
      <div style={{
        maxWidth: "var(--max-content)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 40,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20, fontStyle: "italic",
              color: "var(--ink-100)",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}>Caleb's</span>
            <span className="smallcaps" style={{ fontSize: 10 }}>Library</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-40)", lineHeight: 1.6, maxWidth: 360 }}>
            An open, community-run library of student notes and study material.
            Started by Caleb H. in 2019 from a shared drive. Kept going by whoever shows up.
          </div>
        </div>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 12 }}>Library</div>
          <FooterLink onClick={() => navigate("browse")}>Browse</FooterLink>
          <FooterLink onClick={() => navigate("search")}>Search</FooterLink>
          <FooterLink onClick={() => navigate("upload")}>Contribute</FooterLink>
        </div>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 12 }}>Community</div>
          <FooterLink onClick={() => navigate("about")}>How it works</FooterLink>
          <FooterLink onClick={() => navigate("admin")}>Moderation</FooterLink>
          <FooterLink onClick={() => window.open("mailto:hi@calebslibrary.org", "_blank")}>Get in touch</FooterLink>
        </div>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 12 }}>Legal</div>
          <FooterLink>Code of Conduct</FooterLink>
          <FooterLink>Copyright</FooterLink>
          <FooterLink>Privacy</FooterLink>
        </div>
      </div>
      <div style={{
        maxWidth: "var(--max-content)",
        margin: "40px auto 0",
        paddingTop: 24,
        borderTop: "1px solid var(--rule)",
        display: "flex", justifyContent: "space-between",
        fontSize: 12,
        color: "var(--ink-40)",
      }}>
        <div className="mono">© 2026 · Caleb's Library · A community project</div>
        <div>Made with care. Kept alive by contributors.</div>
      </div>
    </footer>
  );
}
function FooterLink({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 13,
        color: "var(--ink-70)",
        cursor: "pointer",
        padding: "4px 0",
        transition: "color var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-100)"}
      onMouseLeave={(e) => e.currentTarget.style.color = ""}
    >{children}</div>
  );
}

// Boot
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
