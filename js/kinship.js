(function () {
  const G = window.GIAPHA;
  const byId = Object.fromEntries(G.people.map((p) => [p.id, p]));

  function chain(id) {
    const out = [];
    const seen = new Set();
    while (id && byId[id] && !seen.has(id)) {
      seen.add(id);
      out.push(byId[id]);
      id = byId[id].fatherId;
    }
    return out;
  }

  function pathFrom(ancestorId, id) {
    const up = chain(id);
    const idx = up.findIndex((p) => p.id === ancestorId);
    if (idx < 0) return null;
    return up.slice(0, idx + 1).reverse();
  }

  function termFor(a, b, gender, elder) {
    const d = a - b;
    const male = gender === "Nam";
    if (d < 0) {
      const down = -d;
      if (a === 0) {
        const map = {
          1: ["Con trai", "Con gái"],
          2: ["Cháu nội trai", "Cháu nội gái"],
          3: ["Chắt trai", "Chắt gái"],
          4: ["Chút trai", "Chút gái"],
          5: ["Chít trai", "Chít gái"],
        };
        if (map[down]) return map[down][male ? 0 : 1];
        return male
          ? `Hậu duệ đời thứ ${down} (trai)`
          : `Hậu duệ đời thứ ${down} (gái)`;
      }
      if (down === 1 || down === 2) return male ? "Cháu trai" : "Cháu gái";
      const label = { 3: "chắt", 4: "chút", 5: "chít" }[down];
      if (label) {
        return male ? `Cháu trai (bậc ${label})` : `Cháu gái (bậc ${label})`;
      }
      return male
        ? `Cháu trai (bậc xa, ${down} đời dưới)`
        : `Cháu gái (bậc xa, ${down} đời dưới)`;
    }
    if (d === 0) {
      if (a === 1) {
        if (male) return elder ? "Anh ruột" : "Em trai ruột";
        return elder ? "Chị ruột" : "Em gái ruột";
      }
      const suffix = a >= 5 ? " họ (đồng tộc)" : " họ";
      if (male) return (elder ? "Anh" : "Em trai") + suffix;
      return (elder ? "Chị" : "Em gái") + suffix;
    }
    if (b === 0) {
      if (d === 1) return male ? "Bố (cha)" : "Mẹ";
      if (d === 2) return male ? "Ông nội" : "Bà nội";
      if (d === 3) return male ? "Cụ ông" : "Cụ bà";
      if (d === 4) return male ? "Kỵ ông" : "Kỵ bà";
      return male ? `Ông tổ (${d} đời trên)` : `Bà tổ (${d} đời trên)`;
    }
    if (d === 1) {
      if (male) return elder ? "Bác" : "Chú";
      return elder ? "Bác (nữ)*" : "Cô";
    }
    if (d === 2) {
      if (male) return elder ? "Ông bác" : "Ông chú";
      return "Bà cô";
    }
    if (d === 3) return male ? "Cụ ông" : "Cụ bà";
    if (d === 4) return male ? "Kỵ ông" : "Kỵ bà";
    return male ? `Ông tổ bậc ${d}` : `Bà tổ bậc ${d}`;
  }

  function regionalize(term, region) {
    if (!term) return term;
    if (region === "trung") {
      return term
        .replace("Bác (nữ)*", "Bác")
        .replace(/^Cô$/, "O")
        .replace("Bố (cha)", "Ba")
        .replace(/^Mẹ$/, "Mạ");
    }
    if (region === "nam") {
      return term
        .replace("Bác (nữ)*", "Cô")
        .replace("Bố (cha)", "Ba")
        .replace(/^Mẹ$/, "Má");
    }
    return term.replace("Bác (nữ)*", "Bác").replace("Bố (cha)", "Bố");
  }

  function fallbackMeta(a, b) {
    const d = a - b;
    const m = Math.max(a, b);
    const scope =
      m <= G.thresholds.nguPhuc
        ? "Trong ngũ phục (cùng cao tổ)"
        : "Ngoài ngũ phục (hết phục, vẫn đồng tộc)";
    const tone =
      m <= G.thresholds.nguPhuc
        ? "Gọi chính xác theo vai vế"
        : m <= G.thresholds.rutGon
          ? "Giữ vai vế nếu biết rõ; có thể rút gọn"
          : "Chỉ giữ ranh giới trên/dưới; cùng đời gọi theo tuổi";
    let type = "Quan hệ đồng tộc";
    if (a === 0 && b > 0) type = "Hậu duệ trực hệ (X là tổ của Y)";
    else if (b === 0 && a > 0) type = "Tổ tiên trực hệ (Y là tổ của X)";
    else if (d === 0) {
      type =
        a >= 5
          ? `Họ xa – đồng tộc (cùng tổ ${a} đời trên)`
          : "Cùng đời";
    } else if (d > 0) type = `Bậc trên ${d} đời`;
    else type = `Bậc dưới ${-d} đời – Y thuộc hàng cháu`;
    return {
      type,
      scope,
      tone,
      han:
        a > 8 || b > 8
          ? "Ngoài bảng 0–8: d > 0 là ông/bà tổ bậc d, d < 0 là cháu bậc xa, d = 0 là anh chị em họ đồng tộc."
          : "",
      lcaX: "",
      lcaY: "",
    };
  }

  function relate(xId, yId, region) {
    const x = byId[xId];
    const y = byId[yId];
    if (!x || !y) return null;
    if (x.id === y.id) {
      return {
        same: true,
        dongToc: true,
        x,
        y,
        a: 0,
        b: 0,
        d: 0,
        branch: null,
        branchMatters: false,
        branchUncertain: false,
        term: "Chính mình",
        termGoc: "Chính mình",
        reverseTerm: "Chính mình",
        reverseGoc: "Chính mình",
        region,
      };
    }
    const ids = new Set(chain(x.id).map((p) => p.id));
    const ancestor = chain(y.id).find((p) => ids.has(p.id)) || null;
    if (!ancestor) {
      return { same: false, dongToc: false, x, y, region };
    }
    const pathX = pathFrom(ancestor.id, x.id);
    const pathY = pathFrom(ancestor.id, y.id);
    const a = pathX.length - 1;
    const b = pathY.length - 1;
    const d = a - b;
    let branch = null;
    let branchUncertain = false;
    if (a >= 1 && b >= 1) {
      const cx = pathX[1];
      const cy = pathY[1];
      if (cx.order == null || cy.order == null) branchUncertain = true;
      else if (cy.order < cx.order) branch = "Lớn hơn";
      else if (cy.order > cx.order) branch = "Nhỏ hơn";
      else branchUncertain = true;
    }
    const branchMatters = a >= 1 && b >= 1 && d >= 0;
    const elder = branch === "Lớn hơn";
    const termGoc =
      branchMatters && branchUncertain ? null : termFor(a, b, y.gender, elder);
    const reverseMatters = b >= 1 && a >= 1 && b - a >= 0;
    const reverseGoc =
      reverseMatters && branchUncertain
        ? null
        : termFor(b, a, x.gender, branch === "Nhỏ hơn");
    const meta = G.rules[`${a}-${b}`] || fallbackMeta(a, b);
    return {
      same: false,
      dongToc: true,
      x,
      y,
      ancestor,
      pathX,
      pathY,
      a,
      b,
      d,
      branch,
      branchUncertain,
      branchMatters,
      termGoc,
      term: termGoc ? regionalize(termGoc, region) : null,
      reverseGoc,
      reverseTerm: reverseGoc ? regionalize(reverseGoc, region) : null,
      type: meta.type,
      scope: meta.scope,
      tone: meta.tone,
      han: meta.han,
      lcaX: meta.lcaX,
      lcaY: meta.lcaY,
      region,
      farSameGen: d === 0 && Math.max(a, b) > G.thresholds.rutGon,
    };
  }

  function siblingRank(order, region) {
    if (order == null) return "";
    const names = {
      1: "Cả",
      2: "Hai",
      3: "Ba",
      4: "Tư",
      5: "Năm",
      6: "Sáu",
      7: "Bảy",
      8: "Tám",
      9: "Chín",
      10: "Mười",
    };
    const n = region === "nam" ? order + 1 : order;
    return names[n] || `thứ ${n}`;
  }

  function chiOf(person) {
    const note = person.note || "";
    if (note.includes("Thủy tổ")) return "Thủy tổ";
    if (note.includes("Chi 1")) return "Chi trưởng";
    if (note.includes("Chi 2")) return "Chi thứ";
    if (person.gender === "Nữ") return "Con gái";
    return note || "Trong họ";
  }

  function runTests() {
    let pass = 0;
    const fails = [];
    G.tests.forEach((t) => {
      const r = relate(t.x, t.y, "bac");
      const ok =
        r &&
        r.ancestor &&
        r.ancestor.id === t.ancestor &&
        r.a === t.a &&
        r.b === t.b &&
        (r.branch || "-") === t.branch &&
        r.termGoc === t.xCallsY &&
        r.reverseGoc === t.yCallsX;
      if (ok) pass += 1;
      else fails.push(t.x + "→" + t.y);
    });
    return { pass, total: G.tests.length, fails };
  }

  window.Kinship = {
    byId,
    chain,
    relate,
    regionalize,
    termFor,
    siblingRank,
    chiOf,
    runTests,
  };
})();
