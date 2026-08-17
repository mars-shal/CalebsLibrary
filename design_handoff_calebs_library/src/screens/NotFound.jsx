function NotFoundScreen({ navigate }) {
  return (
    <div style={{
      maxWidth: 720, textAlign: "center",
      margin: "0 auto",
      padding: "120px 32px 96px",
    }}>
      {/* Fallen books */}
      <div style={{
        display: "flex", justifyContent: "center",
        marginBottom: 40, position: "relative",
        height: 240,
      }}>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%) translateY(20px) rotate(-14deg)", zIndex: 1 }}>
          <BookCover paper={PAPERS[3]} size="md" />
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-70%) translateY(70px) rotate(-38deg)", zIndex: 2, opacity: 0.7 }}>
          <BookCover paper={PAPERS[7]} size="sm" />
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-30%) translateY(90px) rotate(24deg)", zIndex: 2, opacity: 0.7 }}>
          <BookCover paper={PAPERS[11]} size="sm" />
        </div>
      </div>

      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: 96,
        fontStyle: "italic",
        color: "var(--ink-100)",
        lineHeight: 1,
        marginBottom: 16,
        fontWeight: 500,
        letterSpacing: "-0.03em",
      }}>404</div>

      <h1 style={{
        fontFamily: "var(--font-sans)",
        fontSize: 40,
        color: "var(--ink-100)",
        margin: 0,
        letterSpacing: "-0.025em",
        fontWeight: 500,
      }}>This page wandered off the shelves.</h1>

      <p style={{
        fontSize: 17,
        color: "var(--ink-70)",
        marginTop: 20, marginBottom: 40,
        lineHeight: 1.6,
        letterSpacing: "-0.005em",
      }}>
        Whatever you were looking for isn't here — or isn't here anymore.
        Perhaps a moderator moved it, or it was withdrawn from circulation.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("home")}>
          <Icon.Home style={{ width: 14, height: 14 }} /> Back to the library
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("browse")}>
          Browse everything
        </button>
      </div>
    </div>
  );
}
window.NotFoundScreen = NotFoundScreen;
