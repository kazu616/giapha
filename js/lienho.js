(function () {
  const L = window.LIENHO;
  const byId = Object.fromEntries(L.people.map((p) => [p.id, p]));

  function search(start) {
    const dist = new Map([[start, 0]]);
    const pred = new Map([[start, null]]);
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop();
      const person = byId[cur];
      if (!person) continue;
      for (const nxt of [person.fatherId, person.motherId]) {
        if (!nxt || !byId[nxt]) continue;
        const nd = dist.get(cur) + 1;
        if (!dist.has(nxt) || nd < dist.get(nxt)) {
          dist.set(nxt, nd);
          pred.set(nxt, cur);
          stack.push(nxt);
        }
      }
    }
    return { dist, pred };
  }

  function pathBetween(start, target, pred) {
    const path = [target];
    let cur = target;
    const seen = new Set();
    while (cur !== start) {
      cur = pred.get(cur);
      if (!cur || seen.has(cur)) return null;
      seen.add(cur);
      path.push(cur);
    }
    path.reverse();
    return path.map((id) => byId[id]);
  }

  function connector(pathX, pathY, a, b) {
    const d = a - b;
    if (a === 0 && b >= 1) return pathY[b - 1].gender;
    if (d > 0) return pathX[a - b].gender;
    if (d === 0 && a >= 2) return pathY[b - 1].gender;
    return "Nam";
  }

  function branchOf(pathX, pathY, a, b) {
    if (a < 1 || b < 1) return "Lớn hơn";
    const cx = pathX[a - 1];
    const cy = pathY[b - 1];
    if (cx.order == null || cy.order == null) return "Lớn hơn";
    if (cy.order < cx.order) return "Lớn hơn";
    if (cy.order > cx.order) return "Nhỏ hơn";
    return "Lớn hơn";
  }

  function blood(xId, yId, side) {
    const x = byId[xId];
    const y = byId[yId];
    if (!x || !y || xId === yId) return null;
    const entry = side === "Nội" ? x.fatherId : x.motherId;
    const up = entry && byId[entry] ? search(entry) : { dist: new Map(), pred: new Map() };
    if (side === "Nội") {
      up.dist.set(xId, -1);
      up.pred.set(xId, null);
    }
    if (!up.dist.size) return null;
    const down = search(yId);
    let best = null;
    up.dist.forEach((de, anc) => {
      if (!down.dist.has(anc)) return;
      const a = anc === xId ? 0 : de + 1;
      const b = down.dist.get(anc);
      const score = a + b;
      if (!best || score < best.score || (score === best.score && a < best.a)) {
        best = { score, a, b, anc, de };
      }
    });
    if (!best) return null;
    const pathX = best.anc === xId
      ? [x]
      : [x].concat(pathBetween(entry, best.anc, up.pred) || []);
    const pathY = pathBetween(yId, best.anc, down.pred);
    if (!pathY || pathX.length - 1 !== best.a || pathY.length - 1 !== best.b) return null;
    const noi = connector(pathX, pathY, best.a, best.b);
    const br = branchOf(pathX, pathY, best.a, best.b);
    const key = `${best.a}|${best.b}|${side}|${noi}|${y.gender}|${br}`;
    const row = L.rules[key];
    if (!row) return null;
    return {
      a: best.a,
      b: best.b,
      anc: best.anc,
      noi,
      br,
      term: row[0],
      spouse: row[1],
      inlaw: row[2],
      score: best.score,
      side,
      key,
    };
  }

  function choose(xId, yId, prefer) {
    const noi = blood(xId, yId, "Nội");
    const ngoai = blood(xId, yId, "Ngoại");
    let picked = null;
    if (prefer === "noi") picked = noi || ngoai;
    else if (prefer === "ngoai") picked = ngoai || noi;
    else if (noi && ngoai) picked = ngoai.score < noi.score ? ngoai : noi;
    else picked = noi || ngoai;
    return { noi, ngoai, picked };
  }

  function marriage(xId, yId) {
    const x = byId[xId];
    const y = byId[yId];
    const found = [];
    if (y.spouseId && y.spouseId !== xId && byId[y.spouseId]) {
      const hit = choose(xId, y.spouseId, "gan").picked;
      if (hit && hit.spouse) found.push({ score: hit.score, kind: "A", term: hit.spouse, viaId: y.spouseId });
    }
    if (x.spouseId && x.spouseId !== yId && byId[x.spouseId]) {
      const hit = choose(x.spouseId, yId, "gan").picked;
      if (hit && hit.inlaw) found.push({ score: hit.score, kind: "B", term: hit.inlaw, viaId: x.spouseId });
    }
    found.sort((a, b) => a.score - b.score || (a.kind === "A" ? -1 : 1));
    return found[0] || null;
  }

  function relate(xId, yId, prefer) {
    const x = byId[xId];
    const y = byId[yId];
    if (!x || !y) return null;
    const mode = prefer || L.prefer || "gan";
    if (xId === yId) {
      return { same: true, x, y, term: "Chính mình", kind: "self", side: null, paths: {}, marriage: null, differentPaths: false };
    }
    const paths = choose(xId, yId, mode);
    const wedding = marriage(xId, yId);
    const both = paths.noi && paths.ngoai;
    const differentPaths = Boolean(both && paths.noi.term !== paths.ngoai.term);
    if (paths.picked) {
      return {
        same: false,
        x,
        y,
        term: paths.picked.term,
        kind: "blood",
        side: paths.picked.side,
        paths,
        marriage: wedding,
        differentPaths,
        spouses: x.spouseId === yId,
      };
    }
    if (x.spouseId === yId) {
      return {
        same: false,
        x,
        y,
        term: y.gender === "Nữ" ? "Vợ" : "Chồng",
        kind: "spouse",
        side: null,
        paths,
        marriage: null,
        differentPaths: false,
        spouses: true,
      };
    }
    if (wedding) {
      return {
        same: false,
        x,
        y,
        term: wedding.term,
        kind: "marriage",
        side: null,
        viaId: wedding.viaId,
        marriageKind: wedding.kind,
        paths,
        marriage: wedding,
        differentPaths: false,
        spouses: false,
      };
    }
    return {
      same: false,
      x,
      y,
      term: null,
      kind: "none",
      side: null,
      paths,
      marriage: null,
      differentPaths: false,
      spouses: false,
    };
  }

  function runChecks() {
    const ego = "N07";
    const expect = [
      ["N01", "Cụ ông nội", "Nội"],
      ["N02", "Ông nội", "Nội"],
      ["N03", "Ông chú (bên nội)", "Nội"],
      ["N04", "Bà cô (bên nội)", "Nội"],
      ["N05", "Bố (cha)", "Nội"],
      ["N06", "Cô", "Nội"],
      ["N08", "Em trai ruột", "Nội"],
      ["N09", "Chú", "Nội"],
      ["N10", "Em trai họ (họ 2 đời, bên nội)", "Nội"],
      ["N11", "Cháu trai", "Ngoại"],
      ["N12", "Cháu gái", "Ngoại"],
      ["D01", "Ông ngoại", "Ngoại"],
      ["D02", "Cậu", "Ngoại"],
      ["D03", "Mẹ", "Ngoại"],
      ["D04", "Cậu", "Ngoại"],
      ["D05", "Anh họ (con cậu)", "Ngoại"],
      ["D06", "Chị họ (con cậu)", "Ngoại"],
      ["D07", "Em gái họ (con cậu)", "Ngoại"],
    ];
    const back = {
      N01: "Chắt nội trai",
      N02: "Cháu nội trai",
      N03: "Cháu trai",
      N04: "Cháu trai",
      N05: "Con trai",
      N06: "Cháu trai",
      N08: "Anh ruột",
      N09: "Cháu trai",
      N10: "Anh họ (họ 2 đời, bên nội)",
      N11: "Cậu",
      N12: "Cậu",
      D01: "Cháu ngoại trai",
      D02: "Cháu trai",
      D03: "Con trai",
      D04: "Cháu trai",
      D05: "Em trai họ (con cô)",
      D06: "Em trai họ (con cô)",
      D07: "Anh họ (con cô)",
    };
    const fails = [];
    expect.forEach(([id, term, side]) => {
      const rel = relate(ego, id, "gan");
      if (!rel || rel.term !== term || rel.side !== side) fails.push(ego + "→" + id);
      const rev = relate(id, ego, "gan");
      if (!rev || rev.term !== back[id]) fails.push(id + "→" + ego);
    });
    const marriageRows = [
      ["D05", "N05", "Dượng (chú)"],
      ["D06", "N05", "Dượng (chú)"],
      ["N05", "D05", "Cháu trai (theo vợ/chồng)"],
      ["N05", "D02", "Anh (anh của vợ/chồng)"],
      ["N10", "D05", "Anh (anh của vợ/chồng)"],
      ["N10", "D03", "Cô (theo vợ/chồng)"],
      ["N05", "D03", "Vợ"],
      ["D03", "N05", "Chồng"],
    ];
    marriageRows.forEach(([x, y, term]) => {
      const rel = relate(x, y, "gan");
      if (!rel || rel.term !== term) fails.push(x + "→" + y);
    });
    const quan = relate("N11", "N07", "noi");
    if (!quan || quan.side !== "Nội" || quan.term !== "Bác") fails.push("N11→N07 nội");
    return { pass: expect.length * 2 + marriageRows.length + 1 - fails.length, total: expect.length * 2 + marriageRows.length + 1, fails };
  }

  window.Lienho = { byId, people: L.people, relate, blood, runChecks };
})();
