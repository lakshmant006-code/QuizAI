function App() {
  const [view, setView] = React.useState("login");

  if (view === "login") return <window.LoginScreen onSignIn={() => setView("dashboard")} />;

  const nav = (label) => {
    if (label === "Dashboard" || label === "Quizzes") setView("dashboard");
    if (label === "Summaries") setView("summaries");
  };

  if (view === "summaries") return <window.SummariesScreen active="Summaries" onNav={nav} />;
  return <window.DashboardScreen active="Dashboard" onNav={nav} />;
}

const rootEl = document.getElementById("root");
if (rootEl) ReactDOM.createRoot(rootEl).render(<App />);
