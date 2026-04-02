import { useState, useEffect, useCallback, useMemo } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const POOL_PLAYERS = [
  { name: "Judy", picks: ["Scottie Scheffler","Collin Morikawa","Tommy Fleetwood","Justin Thomas","Sahith Theegala","Min Woo Lee","Akshay Bhatia","J.T. Poston","Matthieu Pavon"] },
  { name: "Tucker", picks: ["Rory McIlroy","Ludvig Åberg","Brooks Koepka","Sam Burns","Corey Conners","Russell Henley","Davis Thompson","Nick Dunlap","Kevin Yu"] },
  { name: "Jay", picks: ["Xander Schauffele","Jon Rahm","Patrick Cantlay","Will Zalatoris","Tony Finau","Jason Day","Brian Harman","Taylor Moore","Nico Echavarria"] },
  { name: "Tim", picks: ["Bryson DeChambeau","Hideki Matsuyama","Wyndham Clark","Shane Lowry","Robert MacIntyre","Tom Kim","Adam Scott","Cameron Young","Jake Knapp"] },
  { name: "Bill", picks: ["Jon Rahm","Viktor Hovland","Keegan Bradley","Sungjae Im","Cameron Young","Maverick McNealy","Sepp Straka","Chris Kirk","Austin Eckroat"] },
  { name: "David", picks: ["Scottie Scheffler","Bryson DeChambeau","Shane Lowry","Will Zalatoris","Sahith Theegala","Russell Henley","Sepp Straka","Nick Dunlap","Matthieu Pavon"] },
  { name: "Graham", picks: ["Rory McIlroy","Xander Schauffele","Hideki Matsuyama","Viktor Hovland","Sungjae Im","Corey Conners","Jason Day","Chris Kirk","Taylor Moore"] },
  { name: "Chuck", picks: ["Ludvig Åberg","Collin Morikawa","Patrick Cantlay","Brooks Koepka","Tommy Fleetwood","Tony Finau","Tom Kim","Brian Harman","Billy Horschel"] },
];

const PLAYER_COLORS = {
  Judy:"#1a6b3c", Tucker:"#8b5e0a", Jay:"#1e3a6e", Tim:"#5a1a5a",
  Bill:"#7a1a1a", David:"#1a4a5a", Graham:"#3a5a1a", Chuck:"#4a3a1a"
};

const SCORING_CATEGORIES = [
  { key: "champion", label: "Champion", weight: 0.20, description: "Pool player whose golfer wins the tournament", prizes: [1.0] },
  { key: "best4", label: "Best 4 Score", weight: 0.30, description: "Lowest combined score of best 4 golfers (all 4 rounds)", prizes: [0.6, 0.3, 0.1] },
  { key: "best8thru2", label: "Best 8 Thru 2", weight: 0.20, description: "Lowest combined score of best 8 golfers through rounds 1 & 2", prizes: [0.6, 0.3, 0.1] },
  { key: "cutsMade", label: "Most Cuts Made", weight: 0.20, description: "Most golfers making the cut", prizes: [0.6, 0.3, 0.1] },
  { key: "matchPlay", label: "Match Play", weight: 0.10, description: "Head-to-head round wins vs each other pool player", prizes: [0.6, 0.3, 0.1] },
];

const ROUND_LABELS = ["R1", "R2", "R3", "R4"];
const SIM_COUNT = 2000;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatScore = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
};

const scoreColor = (n) => {
  if (n == null || isNaN(n)) return "#aaa";
  if (n < 0) return "#4ade80";
  if (n === 0) return "#f0ead6";
  return "#e05c5c";
};

const pctColor = (p) => {
  if (p >= 35) return "#4ade80";
  if (p >= 18) return "#f0c040";
  if (p >= 7) return "#e09050";
  return "#607d6e";
};

const nameMatch = (a, b) => {
  const fa = a.toLowerCase().trim(), fb = b.toLowerCase().trim();
  if (fa === fb) return true;
  const al = fa.split(" ").pop(), bl = fb.split(" ").pop();
  if (al.length > 3 && al === bl) return true;
  return fa.split(" ").some(p => p.length > 3 && fb.includes(p));
};

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #091a0d; --card: rgba(255,255,255,0.03); --border: rgba(255,255,255,0.06);
    --gold: #b8963e; --green: #4ade80; --red: #e05c5c; --text: #f0ead6; --dim: #555;
    --font: 'Georgia', 'Times New Roman', serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }
  .app { min-height: 100vh; max-width: 800px; margin: 0 auto; padding-bottom: 40px; }
  .header { background: linear-gradient(180deg, #0a1f0e, #123018); border-bottom: 2px solid var(--gold); padding: 22px 16px 16px; text-align: center; }
  .header h1 { font-size: 24px; color: #fff; letter-spacing: 1px; }
  .header .sub { color: var(--gold); font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 6px; }
  .tabs { display: flex; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.3); }
  .tab { flex: 1; padding: 10px; background: none; border: none; color: var(--dim); font-family: var(--font); font-size: 12px; cursor: pointer; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid transparent; }
  .tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .rbar { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--border); }
  .rbtn { background: rgba(184,150,62,0.15); border: 1px solid rgba(184,150,62,0.3); color: var(--gold); padding: 6px 14px; border-radius: 4px; cursor: pointer; font-family: var(--font); font-size: 11px; font-weight: 700; }
  .rbtn:hover { background: rgba(184,150,62,0.25); }
  .pot-input { width: 80px; background: rgba(255,255,255,0.1); border: 1px solid var(--gold); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 13px; text-align: center; font-family: var(--font); }
  .player-row { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
  .player-row:hover { background: rgba(184,150,62,0.04); }
  .badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; letter-spacing: 0.5px; margin: 1px 2px; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 100; display: flex; align-items: center; justify-content: center; }
  .modal { background: #0d1f12; border: 1px solid var(--gold); border-radius: 12px; padding: 24px; max-width: 700px; width: 95%; max-height: 85vh; overflow-y: auto; }
  .golfer-input { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 6px 9px; color: #fff; font-size: 11px; width: 100%; font-family: var(--font); }
  .cat-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin: 8px 16px; overflow: hidden; }
  .cat-header { padding: 10px 14px; background: rgba(184,150,62,0.06); border-bottom: 1px solid var(--border); }
  .cat-row { display: grid; grid-template-columns: 30px 1fr 60px 60px 70px; padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; font-size: 12px; }
  .ev-bar { height: 6px; border-radius: 3px; background: var(--gold); transition: width 0.4s; }
  .lb-row { display: grid; grid-template-columns: 40px 1fr 64px 50px; padding: 9px 15px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; }
  .rule-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin: 8px 16px; padding: 16px; }
`;

// ─── MOCK LEADERBOARD ────────────────────────────────────────────────────────

const generateMockLeaderboard = () => {
  const allGolfers = new Set();
  POOL_PLAYERS.forEach(p => p.picks.forEach(g => allGolfers.add(g)));
  ["Tiger Woods","Phil Mickelson","Jordan Spieth","Dustin Johnson","Justin Rose","Cameron Smith","Max Homa","Matt Fitzpatrick","Tyrrell Hatton","Patrick Reed","Danny Willett","Sergio Garcia","Adam Hadwin","Si Woo Kim","Bubba Watson","Fred Couples","Zach Johnson","José María Olazábal","Vijay Singh","Larry Mize"].forEach(g => allGolfers.add(g));

  const cr = 2;
  const golfers = Array.from(allGolfers).map(name => {
    const rounds = [];
    for (let i = 0; i <= cr; i++) rounds.push(Math.floor(Math.random() * (i < cr ? 13 : 10)) - (i < cr ? 4 : 3));
    for (let i = cr + 1; i < 4; i++) rounds.push(null);
    const r1r2 = rounds[0] + rounds[1];
    const cutMade = r1r2 <= 4;
    if (!cutMade) { for (let i = 2; i < 4; i++) rounds[i] = null; }
    const total = rounds.filter(r => r !== null).reduce((a, b) => a + b, 0);
    return { name, rounds, total, cutMade, thru: cutMade ? (cr < 3 ? `${Math.floor(Math.random() * 12) + 6}` : "F") : "CUT" };
  });
  golfers.sort((a, b) => { if (a.cutMade !== b.cutMade) return a.cutMade ? -1 : 1; return a.total - b.total; });
  golfers.forEach((g, i) => { g.position = i + 1; });
  return { golfers, currentRound: cr };
};

// ─── SCORING ENGINE ──────────────────────────────────────────────────────────

function computeStandings(lb, players) {
  const gm = {};
  lb.forEach(g => { gm[g.name] = g; });

  const standings = players.map(player => {
    const gd = player.picks.map(n => gm[n] || { name: n, rounds: [null, null, null, null], total: null, cutMade: false, thru: "—" });
    const valid = gd.filter(g => g.total !== null).sort((a, b) => a.total - b.total);
    const b4 = valid.slice(0, 4);
    const b4s = b4.reduce((s, g) => s + g.total, 0);
    const t2 = gd.map(g => ({ name: g.name, s: (g.rounds[0] ?? 999) + (g.rounds[1] ?? 999) })).filter(x => x.s < 500).sort((a, b) => a.s - b.s);
    const b8 = t2.slice(0, 8);
    const b8s = b8.reduce((s, x) => s + x.s, 0);
    const cuts = gd.filter(g => g.cutMade).length;
    const champ = lb.length > 0 && gd.some(g => g.name === lb[0]?.name);
    return { ...player, golferData: gd, best4Score: b4s, best8Thru2Score: b8s, cutsMade: cuts, champion: champ, best4Golfers: b4.map(g => g.name), best8Thru2Golfers: b8.map(g => g.name) };
  });

  // Match play
  standings.forEach(p => { p.matchPlayWins = 0; p.matchPlayRecord = []; });
  for (let i = 0; i < standings.length; i++) {
    for (let j = i + 1; j < standings.length; j++) {
      const a = standings[i], b = standings[j];
      let aW = 0, bW = 0;
      for (let r = 0; r < 4; r++) {
        const aS = a.golferData.reduce((s, g) => s + (g.rounds[r] ?? 99), 0);
        const bS = b.golferData.reduce((s, g) => s + (g.rounds[r] ?? 99), 0);
        if (aS < bS) aW++;
        else if (bS < aS) bW++;
      }
      if (aW > bW) { a.matchPlayWins++; a.matchPlayRecord.push(`W vs ${b.name}`); b.matchPlayRecord.push(`L vs ${a.name}`); }
      else if (bW > aW) { b.matchPlayWins++; b.matchPlayRecord.push(`W vs ${a.name}`); a.matchPlayRecord.push(`L vs ${b.name}`); }
      else { a.matchPlayRecord.push(`T vs ${b.name}`); b.matchPlayRecord.push(`T vs ${a.name}`); }
    }
  }

  const rankBy = (arr, key, asc = true) => {
    const sorted = [...arr].sort((a, b) => asc ? a[key] - b[key] : b[key] - a[key]);
    sorted.forEach((item, i) => { item[`${key}Rank`] = i + 1; });
  };
  rankBy(standings, "best4Score", true);
  rankBy(standings, "best8Thru2Score", true);
  rankBy(standings, "cutsMade", false);
  rankBy(standings, "matchPlayWins", false);

  standings.forEach(p => {
    p.compositeScore = (
      (p.champion ? 0 : standings.length) * 0.20 +
      p.best4ScoreRank * 0.30 +
      p.best8Thru2ScoreRank * 0.20 +
      p.cutsMadeRank * 0.20 +
      p.matchPlayWinsRank * 0.10
    );
  });
  standings.sort((a, b) => a.compositeScore - b.compositeScore);
  standings.forEach((p, i) => { p.overallRank = i + 1; });
  return standings;
}

// ─── MONTE CARLO ─────────────────────────────────────────────────────────────

function runSimulations(leaderboard, currentRound, players, numSims) {
  const MEAN = 0.8, STD = 3.2;
  const randRound = () => {
    const u1 = Math.random(), u2 = Math.random();
    return Math.round(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * STD + MEAN);
  };

  const wins = {};
  players.forEach(p => { wins[p.name] = { champion: 0, best4: 0, best8thru2: 0, cutsMade: 0, matchPlay: 0 }; });

  const golferMap = {};
  leaderboard.forEach(g => { golferMap[g.name] = g; });

  for (let sim = 0; sim < numSims; sim++) {
    const simGolfers = {};
    leaderboard.forEach(g => {
      const rounds = [...g.rounds];
      if (!g.cutMade) { simGolfers[g.name] = { ...g, rounds, simTotal: g.total }; return; }
      for (let r = 0; r < 4; r++) { if (rounds[r] === null) rounds[r] = randRound(); }
      const simTotal = rounds.reduce((a, b) => a + (b ?? 0), 0);
      simGolfers[g.name] = { ...g, rounds, simTotal };
    });

    let champName = null, champScore = Infinity;
    Object.values(simGolfers).forEach(g => {
      if (g.cutMade && g.simTotal < champScore) { champScore = g.simTotal; champName = g.name; }
    });

    const simStandings = players.map(player => {
      const gData = player.picks.map(name => simGolfers[name] || { name, rounds: [null, null, null, null], simTotal: 999, cutMade: false });
      const valid = gData.filter(g => g.cutMade);
      const sorted = [...valid].sort((a, b) => a.simTotal - b.simTotal);
      const b4 = sorted.slice(0, 4).reduce((s, g) => s + g.simTotal, 0);
      const t2 = gData.map(g => ({ s: (g.rounds[0] ?? 999) + (g.rounds[1] ?? 999) })).filter(x => x.s < 500).sort((a, b) => a.s - b.s);
      const b8t2 = t2.slice(0, 8).reduce((s, x) => s + x.s, 0);
      const cuts = gData.filter(g => g.cutMade).length;
      const hasChamp = gData.some(g => g.name === champName);
      return { name: player.name, b4, b8t2, cuts, hasChamp, gData };
    });

    simStandings.forEach(p => { if (p.hasChamp) wins[p.name].champion++; });

    const b4Sorted = [...simStandings].sort((a, b) => a.b4 - b.b4);
    if (b4Sorted.length > 0) wins[b4Sorted[0].name].best4++;

    const b8Sorted = [...simStandings].sort((a, b) => a.b8t2 - b.b8t2);
    if (b8Sorted.length > 0) wins[b8Sorted[0].name].best8thru2++;

    const cutsSorted = [...simStandings].sort((a, b) => b.cuts - a.cuts);
    if (cutsSorted.length > 0) wins[cutsSorted[0].name].cutsMade++;

    const mpWins = {};
    simStandings.forEach(p => { mpWins[p.name] = 0; });
    for (let i = 0; i < simStandings.length; i++) {
      for (let j = i + 1; j < simStandings.length; j++) {
        const a = simStandings[i], b = simStandings[j];
        let aW = 0, bW = 0;
        for (let r = 0; r < 4; r++) {
          const aS = a.gData.reduce((s, g) => s + (g.rounds[r] ?? 99), 0);
          const bS = b.gData.reduce((s, g) => s + (g.rounds[r] ?? 99), 0);
          if (aS < bS) aW++; else if (bS < aS) bW++;
        }
        if (aW > bW) mpWins[a.name]++; else if (bW > aW) mpWins[b.name]++;
      }
    }
    const mpSorted = Object.entries(mpWins).sort((a, b) => b[1] - a[1]);
    if (mpSorted.length > 0) wins[mpSorted[0][0]].matchPlay++;
  }

  const probs = {};
  players.forEach(p => {
    probs[p.name] = {
      champion: (wins[p.name].champion / numSims * 100),
      best4: (wins[p.name].best4 / numSims * 100),
      best8thru2: (wins[p.name].best8thru2 / numSims * 100),
      cutsMade: (wins[p.name].cutsMade / numSims * 100),
      matchPlay: (wins[p.name].matchPlay / numSims * 100),
    };
  });
  return probs;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function StandingsRow({ player, leaderboard }) {
  const [open, setOpen] = useState(false);
  const color = PLAYER_COLORS[player.name] || "#555";
  const badges = [
    { label: "CHAMP", active: player.champion },
    { label: `B4: ${formatScore(player.best4Score)}`, active: player.best4ScoreRank === 1 },
    { label: `8×2: ${formatScore(player.best8Thru2Score)}`, active: player.best8Thru2ScoreRank === 1 },
    { label: `CUTS: ${player.cutsMade}`, active: player.cutsMadeRank === 1 },
    { label: `MP: ${player.matchPlayWins}`, active: player.matchPlayWinsRank === 1 },
  ];

  return (
    <div className="player-row" onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {player.overallRank}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{player.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
              {badges.map((b, i) => (
                <span key={i} className="badge" style={{ background: b.active ? color : "rgba(255,255,255,0.05)", color: b.active ? "#fff" : "#444", border: `1px solid ${b.active ? color : "#222"}` }}>{b.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#444" }}>{open ? "▲" : "▼"}</div>
      </div>

      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 6 }}>
            {player.golferData.map(g => {
              const sc = formatScore(g.total);
              const col = scoreColor(g.total);
              return (
                <div key={g.name} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "9px 11px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#ddd" }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{g.cutMade ? `Pos ${g.position} · ${g.thru}` : g.thru === "CUT" ? "Missed Cut" : "—"}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{sc}</div>
                </div>
              );
            })}
          </div>
          {player.matchPlayRecord.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 10, color: "#555" }}>
              Match Play: {player.matchPlayRecord.join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OddsTab({ probs, players, potAmount }) {
  if (!probs || Object.keys(probs).length === 0) return <div style={{ padding: 40, textAlign: "center", color: "#444" }}>Running simulation...</div>;

  return (
    <div style={{ padding: "0 0 20px" }}>
      {SCORING_CATEGORIES.map(cat => {
        const catPot = potAmount * cat.weight;
        const sorted = [...players].sort((a, b) => (probs[b.name]?.[cat.key] || 0) - (probs[a.name]?.[cat.key] || 0));
        return (
          <div key={cat.key} className="cat-card">
            <div className="cat-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 2 }}>{cat.description}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>${Math.round(catPot)}</div>
              </div>
            </div>
            <div style={{ padding: "4px 14px", display: "grid", gridTemplateColumns: "30px 1fr 60px 70px", fontSize: 9, color: "var(--dim)", letterSpacing: 1, textTransform: "uppercase" }}>
              <div>#</div><div>Player</div><div style={{ textAlign: "right" }}>Win %</div><div style={{ textAlign: "right" }}>EV</div>
            </div>
            {sorted.map((p, i) => {
              const pct = probs[p.name]?.[cat.key] || 0;
              const ev = (pct / 100) * catPot;
              return (
                <div key={p.name} style={{ display: "grid", gridTemplateColumns: "30px 1fr 60px 70px", padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center", fontSize: 12 }}>
                  <div style={{ color: "var(--dim)" }}>{i + 1}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: PLAYER_COLORS[p.name] || "#555" }} />
                    <span style={{ color: "#ddd" }}>{p.name}</span>
                  </div>
                  <div style={{ textAlign: "right", color: pctColor(pct), fontWeight: 700 }}>{pct.toFixed(1)}%</div>
                  <div style={{ textAlign: "right", color: "var(--gold)", fontWeight: 600 }}>${ev.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Total EV Summary */}
      <div className="cat-card">
        <div className="cat-header">
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>Total Expected Value</div>
        </div>
        {(() => {
          const evs = players.map(p => {
            let totalEv = 0;
            SCORING_CATEGORIES.forEach(cat => {
              const pct = probs[p.name]?.[cat.key] || 0;
              totalEv += (pct / 100) * potAmount * cat.weight;
            });
            return { name: p.name, ev: totalEv };
          }).sort((a, b) => b.ev - a.ev);
          const maxEv = evs[0]?.ev || 1;
          return evs.map((p, i) => (
            <div key={p.name} style={{ display: "grid", gridTemplateColumns: "30px 1fr 80px", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "var(--dim)" }}>{i + 1}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: PLAYER_COLORS[p.name] || "#555" }} />
                  <span style={{ fontSize: 12, color: "#ddd" }}>{p.name}</span>
                </div>
                <div className="ev-bar" style={{ width: `${(p.ev / maxEv) * 100}%` }} />
              </div>
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>${p.ev.toFixed(0)}</div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

function TournamentLeaderboard({ leaderboard }) {
  if (leaderboard.length === 0) return <div style={{ padding: 48, textAlign: "center", color: "#444" }}>No live data yet — The Masters begins April 10, 2026</div>;
  return (
    <div style={{ background: "var(--card)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", margin: "8px 16px" }}>
      <div className="lb-row" style={{ background: "rgba(184,150,62,0.1)", fontSize: 9, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase" }}>
        <div>Pos</div><div>Player</div><div style={{ textAlign: "right" }}>Score</div><div style={{ textAlign: "right" }}>Thru</div>
      </div>
      {leaderboard.slice(0, 50).map((g, i) => {
        const owner = POOL_PLAYERS.find(p => p.picks.some(pk => nameMatch(pk, g.name)));
        return (
          <div key={g.name} className="lb-row" style={{ background: owner ? "rgba(184,150,62,0.05)" : "transparent" }}>
            <div style={{ color: "#555" }}>{g.position}</div>
            <div>
              <span style={{ color: owner ? "#fff" : "#aaa" }}>{g.name}</span>
              {owner && <span style={{ fontSize: 9, color: PLAYER_COLORS[owner.name], marginLeft: 6 }}>({owner.name})</span>}
            </div>
            <div style={{ textAlign: "right", color: scoreColor(g.total), fontWeight: 700 }}>{formatScore(g.total)}</div>
            <div style={{ textAlign: "right", color: "#555" }}>{g.thru}</div>
          </div>
        );
      })}
    </div>
  );
}

function ScoringRules({ potAmount }) {
  return (
    <div style={{ padding: "8px 0" }}>
      <div className="rule-card" style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ color: "var(--gold)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Total Pot</div>
        <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>${potAmount}</div>
      </div>
      {SCORING_CATEGORIES.map(cat => {
        const prize = Math.round(potAmount * cat.weight);
        return (
          <div key={cat.key} className="rule-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{cat.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>${prize}</div>
            </div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{cat.description}</div>
            <div style={{ fontSize: 10, color: "var(--dim)" }}>Weight: {(cat.weight * 100).toFixed(0)}% of pot</div>
            {cat.prizes.length > 1 && (
              <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 2 }}>
                Podium: 1st ${Math.round(prize * cat.prizes[0])} · 2nd ${Math.round(prize * cat.prizes[1])} · 3rd ${Math.round(prize * cat.prizes[2])}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditPicksModal({ players, onSave, onClose }) {
  const [ep, setEp] = useState(players.map(p => ({ ...p, picks: [...p.picks] })));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)", marginBottom: 4 }}>Edit Picks</div>
        <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 16 }}>9 picks per player</div>
        {ep.map((player, pi) => (
          <div key={player.name} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: PLAYER_COLORS[player.name] || "#555" }} />
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{player.name}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
              {player.picks.map((g, gi) => (
                <input key={gi} className="golfer-input" value={g} onChange={e => {
                  const updated = [...ep];
                  updated[pi] = { ...updated[pi], picks: [...updated[pi].picks] };
                  updated[pi].picks[gi] = e.target.value;
                  setEp(updated);
                }} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={() => { onSave(ep); onClose(); }} style={{ flex: 1, background: "var(--gold)", border: "none", color: "#0a1a0e", padding: 11, borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 1, fontFamily: "var(--font)" }}>SAVE PICKS</button>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #555", color: "#888", padding: 11, borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "var(--font)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [players, setPlayers] = useState(POOL_PLAYERS);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [standings, setStandings] = useState([]);
  const [probs, setProbs] = useState({});
  const [tab, setTab] = useState("standings");
  const [potAmount, setPotAmount] = useState(480);
  const [editingPot, setEditingPot] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [simming, setSimming] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const refresh = useCallback(() => {
    // Use mock data until tournament is live
    const mock = generateMockLeaderboard();
    setLeaderboard(mock.golfers);
    setCurrentRound(mock.currentRound);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (leaderboard.length === 0) return;
    const st = computeStandings(leaderboard, players);
    setStandings(st);
    setSimming(true);
    setTimeout(() => {
      const p = runSimulations(leaderboard, currentRound, players, SIM_COUNT);
      setProbs(p);
      setSimming(false);
    }, 50);
  }, [leaderboard, players, currentRound]);

  const handleSavePicks = (updated) => { setPlayers(updated); };

  const roundStatus = currentRound >= 3 ? "Final" : `Round ${currentRound + 1} In Progress`;

  const tabs = [
    { k: "standings", l: "Standings" },
    { k: "odds", l: "Odds" },
    { k: "leaderboard", l: "Tournament" },
    { k: "rules", l: "Rules" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div className="sub">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ height: 1, width: 30, background: "var(--gold)", display: "inline-block" }} />
              Augusta National · 2026
              <span style={{ height: 1, width: 30, background: "var(--gold)", display: "inline-block" }} />
            </span>
          </div>
          <h1>⛳ Masters Fantasy Pool</h1>
          <div style={{ marginTop: 10 }}>
            {editingPot ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--gold)", fontSize: 12 }}>$</span>
                <input type="number" className="pot-input" value={potAmount} onChange={e => setPotAmount(Number(e.target.value))} />
                <button className="rbtn" onClick={() => setEditingPot(false)} style={{ padding: "4px 10px" }}>✓</button>
              </span>
            ) : (
              <span onClick={() => setEditingPot(true)} style={{ cursor: "pointer", color: "var(--gold)", fontSize: 13, fontWeight: 700 }}>
                💰 Pot: ${potAmount} <span style={{ fontSize: 10, color: "var(--dim)" }}>(tap to edit)</span>
              </span>
            )}
          </div>
        </div>

        <div className="tabs">
          {tabs.map(t => (
            <button key={t.k} className={`tab ${tab === t.k ? "active" : ""}`} onClick={() => setTab(t.k)}>
              {t.l}{t.k === "odds" && simming ? " ⏳" : ""}
            </button>
          ))}
        </div>

        <div className="rbar">
          <div>
            <div style={{ fontSize: 11, color: "var(--dim)" }}>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""}</div>
            <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>{roundStatus}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="rbtn" onClick={refresh}>↻ Refresh</button>
            <button className="rbtn" onClick={() => setShowEditModal(true)}>✎ Picks</button>
          </div>
        </div>

        {tab === "standings" && standings.map(p => <StandingsRow key={p.name} player={p} leaderboard={leaderboard} />)}
        {tab === "odds" && <OddsTab probs={probs} players={players} potAmount={potAmount} />}
        {tab === "leaderboard" && <TournamentLeaderboard leaderboard={leaderboard} />}
        {tab === "rules" && <ScoringRules potAmount={potAmount} />}
        {showEditModal && <EditPicksModal players={players} onSave={handleSavePicks} onClose={() => setShowEditModal(false)} />}
      </div>
    </>
  );
}
