(function () {
  const G = window.GIAPHA;
  const K = window.Kinship;
  const Lh = window.Lienho;
  const regionName = { bac: "Bắc", trung: "Trung", nam: "Nam" };
  const preferName = { gan: "Gần nhất", noi: "Ưu tiên nội", ngoai: "Ưu tiên ngoại" };
  const preferHelp = {
    gan: "Gần nhất chọn đường ít đời hơn; bằng nhau thì lấy bên nội.",
    noi: "Ưu tiên nội lấy bên cha khi đường đó có.",
    ngoai: "Ưu tiên ngoại lấy bên mẹ khi đường đó có.",
  };
  const state = {
    view: "tree",
    egoId: "P09",
    lienEgoId: "N07",
    lienClan: "Nguyễn",
    lienPrefer: "gan",
    region: "bac",
    selectedId: null,
    xId: "P13",
    yId: "P11",
    query: "",
    ruleA: 3,
    ruleB: 2,
    tree: { x: 0, y: 24, scale: 1, fitted: false },
  };
  let panMoved = false;
  let printSnapshot = null;
  const checks = K.runTests();
  const lienChecks = Lh.runChecks();

  const $ = (sel) => document.querySelector(sel);
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }
  function given(person) {
    return person.name.replace(/^Nguyễn\s+/, "");
  }
  function kidsOf(id) {
    return G.people
      .filter((p) => p.fatherId === id)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
  function lienPeople() {
    return Lh.people;
  }
  function lienKids(id) {
    return lienPeople()
      .filter((p) => p.fatherId === id)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
  function lienRel(fromId, toId) {
    if (!fromId || fromId === toId) return null;
    return Lh.relate(fromId, toId, state.lienPrefer);
  }
  function lienLabel(fromId, toId) {
    if (!fromId || fromId === toId) return "Bạn";
    const rel = lienRel(fromId, toId);
    if (!rel || !rel.term) return "Chưa nối họ";
    return K.regionalize(rel.term, state.region);
  }
  function lienSide(rel) {
    if (!rel || rel.same) return "";
    if (rel.kind === "blood") {
      const side = rel.side === "Nội" ? "Bên nội" : "Bên ngoại";
      return rel.differentPaths ? side + " · 2 đường" : side;
    }
    if (rel.kind === "marriage" || rel.kind === "spouse") return "Qua hôn nhân";
    return "";
  }
  function options(selected) {
    return G.people
      .map((p) => `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${esc(p.name)} · đời ${p.generation}</option>`)
      .join("");
  }
  function kinLabel(fromId, toId) {
    if (!fromId || fromId === toId) return "Bạn";
    const rel = K.relate(fromId, toId, state.region);
    if (!rel || rel.dongToc === false) return "Khác tộc";
    return rel.term || "Cần xác minh thứ tự";
  }
  function personClass(person) {
    const classes = ["person"];
    const ego = state.view === "lien" ? state.lienEgoId : state.egoId;
    if (person.id === ego) classes.push("is-ego");
    if (person.id === state.selectedId) classes.push("is-open");
    if (person.gender === "Nữ") classes.push("is-nu");
    if ((person.note || "").includes("Chi 1") || (person.note || "").includes("Thủy tổ")) classes.push("chi-1");
    if ((person.note || "").includes("Chi 2")) classes.push("chi-2");
    return classes.join(" ");
  }
  function rankLine(person) {
    const rank = K.siblingRank(person.order, state.region);
    const bits = [K.chiOf(person)];
    if (rank) bits.push("con " + rank);
    if (person.gender === "Nữ") bits.push("họ ngoại ở đời sau");
    return bits.join(" · ");
  }

  function branchHtml(id) {
    const person = K.byId[id];
    const kids = kidsOf(id);
    const nested = kids.length
      ? `<ul>${kids.map((kid) => `<li>${branchHtml(kid.id)}</li>`).join("")}</ul>`
      : "";
    return `
      <div class="${personClass(person)}" data-open="${person.id}" role="button" tabindex="0">
        <span class="gen">Đời ${person.generation}</span>
        <strong>${esc(person.name)}</strong>
        <span class="meta">${esc(rankLine(person))}</span>
        <span class="kin">${esc(kinLabel(state.egoId, person.id))}</span>
      </div>
      ${nested}`;
  }

  function renderTree() {
    const root = G.people.find((p) => !p.fatherId);
    const speaker = K.byId[state.egoId];
    return `
      <div class="toolbar no-print">
        <div class="legend">
          <span><i class="swatch a"></i>Chi trưởng</span>
          <span><i class="swatch b"></i>Chi thứ</span>
          <span><i class="swatch c"></i>Người đang xưng hô</span>
        </div>
        <div class="zoom-bar">
          <button class="btn ghost" type="button" id="zoom-out" aria-label="Thu nhỏ">−</button>
          <span id="zoom-readout">100%</span>
          <button class="btn ghost" type="button" id="zoom-in" aria-label="Phóng to">+</button>
          <button class="btn ghost" type="button" id="zoom-fit">Vừa khung</button>
          <button class="btn" type="button" id="print">In phả đồ</button>
        </div>
      </div>
      <div class="print-mast">
        <strong>Phả đồ ${esc(G.clan.name)}</strong>
        <span>Người xưng hô: ${esc(speaker.name)} · miền ${regionName[state.region]}</span>
      </div>
      <div class="panel tree-shell">
        <div class="tree-viewport" id="tree-viewport">
          <div class="tree-stage" id="tree-stage">
            <div class="phado-banner">
              <span class="glyph" aria-hidden="true">龍</span>
              <div>
                <strong>Phả đồ ${esc(G.clan.name)}</strong>
                <em>Long phụng trình tường</em>
              </div>
              <span class="glyph" aria-hidden="true">鳳</span>
            </div>
            <ul class="tree"><li>${branchHtml(root.id)}</li></ul>
          </div>
        </div>
      </div>
      <p class="note">Kéo để dịch cây, lăn chuột hoặc chụm hai ngón để phóng. Nhãn đỏ là cách <b>${esc(speaker.name)}</b> gọi từng người theo miền ${regionName[state.region]}.</p>`;
  }

  function lienBranch(id) {
    const person = Lh.byId[id];
    const kids = lienKids(id);
    const nested = kids.length
      ? `<ul>${kids.map((kid) => `<li>${lienBranch(kid.id)}</li>`).join("")}</ul>`
      : "";
    const rel = lienRel(state.lienEgoId, person.id);
    const term = lienLabel(state.lienEgoId, person.id);
    const muted = rel && !rel.term ? " is-muted" : "";
    const side = lienSide(rel);
    const jumps = crossLinks(person).map((link) =>
      `<button class="clan-jump" type="button" data-open="${link.id}">${esc(link.role)} · ${esc(link.name)}</button>`
    ).join("");
    return `
      <div class="${personClass(person)}" data-open="${person.id}" role="button" tabindex="0">
        <span class="gen">Đời ${person.generation} · ${esc(person.clan)}</span>
        <strong>${esc(person.name)}</strong>
        <span class="meta">${esc(lienMeta(person))}</span>
        <span class="kin${muted}">${esc(term)}</span>
        ${side ? `<span class="side-tag">${esc(side)}</span>` : ""}
        ${jumps}
      </div>
      ${nested}`;
  }

  function crossLinks(person) {
    const links = [];
    const push = (other, role) => {
      if (!other || other.clan === person.clan || links.some((item) => item.id === other.id)) return;
      links.push({ id: other.id, role, name: other.name });
    };
    push(person.fatherId && Lh.byId[person.fatherId], "Cha");
    push(person.motherId && Lh.byId[person.motherId], "Mẹ");
    const spouse = person.spouseId && Lh.byId[person.spouseId];
    push(spouse, spouse && spouse.gender === "Nữ" ? "Vợ" : "Chồng");
    lienPeople().forEach((child) => {
      if (child.fatherId === person.id || child.motherId === person.id) {
        push(child, child.gender === "Nữ" ? "Con gái" : "Con trai");
      }
    });
    return links;
  }

  function lienMeta(person) {
    const bits = [];
    const rank = K.siblingRank(person.order, state.region);
    if ((person.note || "").includes("Thủy tổ")) bits.push("Thủy tổ");
    else if ((person.note || "").includes("Chi 1")) bits.push("Chi trưởng");
    else if ((person.note || "").includes("Chi 2")) bits.push("Chi thứ");
    if (rank) bits.push("con " + rank);
    if (person.motherClan) bits.push("họ mẹ " + person.motherClan);
    return bits.join(" · ");
  }

  function renderLien() {
    const speaker = Lh.byId[state.lienEgoId];
    const clans = [];
    lienPeople().forEach((p) => {
      if (!clans.includes(p.clan)) clans.push(p.clan);
    });
    if (!clans.includes(state.lienClan)) state.lienClan = clans[0];
    const clan = state.lienClan;
    const roots = lienPeople().filter((p) => p.clan === clan && !p.fatherId);
    const trees = roots.map((root) => `<ul class="tree"><li>${lienBranch(root.id)}</li></ul>`).join("");
    const tabs = clans.map((name) =>
      `<button type="button" role="tab" data-clan="${esc(name)}" aria-selected="${name === clan}">Họ ${esc(name)}</button>`
    ).join("");
    const prefer = ["gan", "noi", "ngoai"].map((key) =>
      `<button class="btn ghost" type="button" data-prefer="${key}" aria-pressed="${state.lienPrefer === key}">${preferName[key]}</button>`
    ).join("");
    return `
      <div class="toolbar no-print">
        <div class="legend">
          <span><i class="swatch a"></i>Chi trưởng</span>
          <span><i class="swatch b"></i>Chi thứ</span>
          <span><i class="swatch c"></i>Người đang xưng hô</span>
        </div>
        <div class="zoom-bar" role="group" aria-label="Ưu tiên đường huyết thống">
          ${prefer}
        </div>
        <div class="zoom-bar">
          <button class="btn ghost" type="button" id="zoom-out" aria-label="Thu nhỏ">−</button>
          <span id="zoom-readout">100%</span>
          <button class="btn ghost" type="button" id="zoom-in" aria-label="Phóng to">+</button>
          <button class="btn ghost" type="button" id="zoom-fit">Vừa khung</button>
          <button class="btn" type="button" id="print">In phả đồ</button>
        </div>
      </div>
      <div class="clan-tabs no-print" role="tablist" aria-label="Chọn dòng họ">
        ${tabs}
      </div>
      <div class="print-mast">
        <strong>Phả đồ Dòng họ ${esc(clan)}</strong>
        <span>Người xưng hô: ${esc(speaker.name)} · ${preferName[state.lienPrefer]} · miền ${regionName[state.region]}</span>
      </div>
      <div class="panel tree-shell">
        <div class="tree-viewport" id="tree-viewport">
          <div class="tree-stage is-lien" id="tree-stage">
            <div class="phado-banner">
              <span class="glyph" aria-hidden="true">龍</span>
              <div>
                <strong>Phả đồ Dòng họ ${esc(clan)}</strong>
                <em>Long phụng trình tường</em>
              </div>
              <span class="glyph" aria-hidden="true">鳳</span>
            </div>
            ${trees}
          </div>
        </div>
      </div>
      <p class="note">Chọn tab để xem từng họ. Tên gạch chân trên thẻ là mối nối sang họ kia: bấm để chuyển tab và mở người đó. Nhãn đỏ là cách <b>${esc(speaker.name)}</b> gọi từng người. ${esc(preferHelp[state.lienPrefer])}</p>`;
  }

  function applyTreeTransform() {
    const stage = document.getElementById("tree-stage");
    const readout = document.getElementById("zoom-readout");
    if (!stage) return;
    const { x, y, scale } = state.tree;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    if (readout) readout.textContent = `${Math.round(scale * 100)}%`;
  }

  function stageSize() {
    const stage = document.getElementById("tree-stage");
    const prev = stage.style.transform;
    stage.style.transform = "none";
    const size = { w: stage.offsetWidth, h: stage.offsetHeight };
    stage.style.transform = prev;
    return size;
  }

  function setScaleAt(next, px, py) {
    const scale = Math.max(0.2, Math.min(2.8, next));
    const k = scale / state.tree.scale;
    state.tree.x = px - (px - state.tree.x) * k;
    state.tree.y = py - (py - state.tree.y) * k;
    state.tree.scale = scale;
    applyTreeTransform();
  }

  function fitTree(mode) {
    const viewport = document.getElementById("tree-viewport");
    const stage = document.getElementById("tree-stage");
    if (!viewport || !stage) return;
    const { w, h } = stageSize();
    const widthScale = (viewport.clientWidth - 28) / w;
    const heightScale = (viewport.clientHeight - 28) / h;
    const scale = mode === "both" ? Math.min(widthScale, heightScale) : Math.min(widthScale, 1);
    state.tree.scale = Math.max(0.2, scale);
    state.tree.x = (viewport.clientWidth - w * state.tree.scale) / 2;
    state.tree.y = mode === "both" ? Math.max(8, (viewport.clientHeight - h * state.tree.scale) / 2) : 12;
    state.tree.fitted = true;
    applyTreeTransform();
  }

  function bindTree() {
    const viewport = document.getElementById("tree-viewport");
    const stage = document.getElementById("tree-stage");
    if (!viewport || !stage) return;
    if (!state.tree.fitted) fitTree("width");
    else applyTreeTransform();

    const points = new Map();
    let drag = null;
    let pinch = null;

    viewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try { viewport.setPointerCapture(event.pointerId); } catch (err) { /* con trỏ giả lập */ }
      if (points.size >= 2) {
        const [a, b] = [...points.values()];
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: state.tree.scale };
        drag = null;
        return;
      }
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        ox: state.tree.x,
        oy: state.tree.y,
        moved: false,
      };
    });
    viewport.addEventListener("pointermove", (event) => {
      if (points.has(event.pointerId)) {
        points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (points.size >= 2 && pinch) {
        const [a, b] = [...points.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const rect = viewport.getBoundingClientRect();
        setScaleAt(pinch.scale * (dist / pinch.dist), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
        return;
      }
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        panMoved = true;
        viewport.classList.add("is-panning");
      }
      if (!drag.moved) return;
      state.tree.x = drag.ox + dx;
      state.tree.y = drag.oy + dy;
      applyTreeTransform();
    });
    function endPointer(event) {
      points.delete(event.pointerId);
      if (points.size < 2) pinch = null;
      if (points.size === 0) {
        drag = null;
        viewport.classList.remove("is-panning");
      }
    }
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
    viewport.addEventListener("click", (event) => {
      if (!panMoved) return;
      event.stopPropagation();
      event.preventDefault();
      panMoved = false;
    }, true);
    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      setScaleAt(state.tree.scale * factor, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });
    document.getElementById("zoom-in").addEventListener("click", () => {
      const viewportBox = viewport.getBoundingClientRect();
      setScaleAt(state.tree.scale * 1.15, viewportBox.width / 2, viewportBox.height / 2);
    });
    document.getElementById("zoom-out").addEventListener("click", () => {
      const viewportBox = viewport.getBoundingClientRect();
      setScaleAt(state.tree.scale / 1.15, viewportBox.width / 2, viewportBox.height / 2);
    });
    document.getElementById("zoom-fit").addEventListener("click", () => fitTree("both"));
  }

  function preparePrint() {
    const viewport = document.getElementById("tree-viewport");
    const stage = document.getElementById("tree-stage");
    if (!viewport || !stage || (state.view !== "tree" && state.view !== "lien")) return;
    printSnapshot = {
      tree: { ...state.tree },
      width: viewport.style.width,
      height: viewport.style.height,
    };
    const { w, h } = stageSize();
    const maxW = 1500;
    const maxH = 900;
    const scale = Math.min(maxW / w, maxH / h);
    state.tree.scale = scale;
    state.tree.x = 0;
    state.tree.y = 0;
    viewport.style.width = `${Math.ceil(w * scale)}px`;
    viewport.style.height = `${Math.ceil(h * scale)}px`;
    applyTreeTransform();
  }

  function restorePrint() {
    const viewport = document.getElementById("tree-viewport");
    if (!printSnapshot || !viewport) return;
    state.tree = printSnapshot.tree;
    viewport.style.width = printSnapshot.width;
    viewport.style.height = printSnapshot.height;
    printSnapshot = null;
    applyTreeTransform();
  }

  function renderRelation(rel) {
    if (!rel) return "";
    if (rel.same) {
      return `<div class="panel result"><p class="kicker">Cùng một người</p><h2>Chính mình</h2></div>`;
    }
    if (rel.dongToc === false) {
      return `<div class="panel result"><p class="kicker">Không đồng tộc</p><h2>Không có tổ chung</h2><p>Hai người không nối được trên cây phụ hệ này, nên không tính a, b.</p></div>`;
    }
    const spoken = rel.term
      ? `${given(rel.x)} gọi ${given(rel.y)} là ${rel.term}`
      : "Chưa đủ thứ tự sinh để chốt anh hay em";
    const back = rel.reverseTerm
      ? `${given(rel.y)} gọi lại là ${rel.reverseTerm}.`
      : "Chiều ngược lại cũng cần xác minh thứ tự.";
    const branchText = rel.branch || (rel.branchUncertain ? "chưa chắc" : "không xét");
    const notes = [];
    if (rel.branch && !rel.branchMatters) {
      notes.push("Nhánh đã ghi để đối chiếu. Cách gọi không đổi vì một người ở bậc dưới hoặc thuộc trực hệ.");
    }
    if (rel.farSameGen) {
      notes.push("Cùng đời và đã qua ngưỡng rút gọn. Họ ước có thể cho gọi theo tuổi; cây này vẫn theo nhánh sinh trước.");
    }
    if (rel.term && rel.termGoc && rel.term !== rel.termGoc.replace("Bác (nữ)*", "Bác").replace("Bố (cha)", "Bố")) {
      notes.push(`Miền ${regionName[rel.region]} đọc là “${rel.term}”. Bảng gốc Bắc Bộ ghi “${rel.termGoc}”.`);
    }
    if (rel.han && /Bác \(nữ\)|^Cô$|^Mẹ$|Bố \(cha\)/.test(rel.termGoc || "")) notes.push(rel.han);
    return `
      <div class="panel result">
        <p class="kicker">${esc(rel.type || "Quan hệ")}</p>
        <h2>${esc(rel.term || "Cần xác minh")}</h2>
        <p class="spoken">${esc(spoken)}. ${esc(back)}</p>
        <div class="facts">
          <div class="fact"><span>Tổ chung</span><b>${esc(rel.ancestor.name)}</b></div>
          <div class="fact"><span>a · b · d</span><b>${rel.a} · ${rel.b} · ${rel.d}</b></div>
          <div class="fact"><span>Nhánh của người được gọi</span><b>${esc(branchText)}</b></div>
          <div class="fact"><span>Phạm vi</span><b>${esc(rel.scope || "")}</b></div>
          <div class="fact"><span>Mức xưng hô</span><b>${esc(rel.tone || "")}</b></div>
          <div class="fact"><span>Tổ chung theo từng người</span><b>${esc(rel.lcaX || "—")} / ${esc(rel.lcaY || "—")}</b></div>
        </div>
        <div class="path">${rel.pathX.map((p) => `<span class="chip">${esc(given(p))}</span>`).join("")}</div>
        ${notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}
      </div>`;
  }

  function renderAddress() {
    const rel = K.relate(state.xId, state.yId, state.region);
    return `
      <div class="toolbar">
        <div>
          <div class="eyebrow">Tra a, b và nhánh</div>
          <h2>Xưng hô giữa hai người</h2>
        </div>
      </div>
      <div class="formula">
        <div><span>Tổ chung A</span><b>LCA</b></div>
        <div><span>a đời xuống người gọi</span><b>a</b></div>
        <div><span>b đời xuống người được gọi</span><b>b</b></div>
        <div><span>d = a − b</span><b>vai vế</b></div>
      </div>
      <div class="address-grid">
        <div class="panel" style="padding:18px">
          <div class="pair">
            <label class="field">Người xưng hô
              <select id="x-id">${options(state.xId)}</select>
            </label>
            <button class="btn ghost" type="button" id="swap">Đổi</button>
            <label class="field">Người được gọi
              <select id="y-id">${options(state.yId)}</select>
            </label>
          </div>
          <p class="note">Nhánh lớn hơn khi người con của tổ chung dẫn tới người được gọi sinh trước. Trong ngũ phục khi max(a, b) ≤ ${G.thresholds.nguPhuc}. Rút gọn khi vượt ${G.thresholds.rutGon}.</p>
        </div>
        ${renderRelation(rel)}
      </div>`;
  }

  function renderMembers() {
    const q = state.query.trim().toLowerCase();
    const rows = G.people.filter((p) => !q || `${p.name} ${p.note} ${p.id}`.toLowerCase().includes(q));
    return `
      <div class="toolbar">
        <div class="search"><input id="q" value="${esc(state.query)}" placeholder="Tìm tên, chi, mã"></div>
      </div>
      <div class="member-list">
        ${rows.map((p) => `
          <button class="member" type="button" data-open="${p.id}">
            <b>Đời ${p.generation}</b>
            <span>${esc(p.name)}</span>
            <span>${esc(rankLine(p))}</span>
            <span>${esc(kinLabel(state.egoId, p.id))}</span>
          </button>`).join("")}
      </div>`;
  }

  function renderRules() {
    const a = Number(state.ruleA);
    const b = Number(state.ruleB);
    const cells = ["Nam", "Nữ"].flatMap((gender) =>
      [true, false].map((elder) => {
        const term = K.termFor(a, b, gender, elder);
        const label = `${gender} · nhánh ${elder ? "lớn hơn" : "nhỏ hơn"}`;
        return `<div class="mini"><span class="kicker">${label}</span><h3>${esc(K.regionalize(term, state.region))}</h3><p class="note">${esc(term)}</p></div>`;
      })
    );
    const meta = G.rules[`${a}-${b}`];
    const keys = Object.keys(G.rules).sort((m, n) => {
      const [a1, b1] = m.split("-").map(Number);
      const [a2, b2] = n.split("-").map(Number);
      return a1 - a2 || b1 - b2;
    });
    return `
      <div class="toolbar">
        <div>
          <div class="eyebrow">80 trường hợp trong bảng</div>
          <h2>Quy tắc xưng hô</h2>
        </div>
        <div style="display:flex;gap:8px">
          <label class="field">a<input id="rule-a" type="number" min="0" max="12" value="${a}"></label>
          <label class="field">b<input id="rule-b" type="number" min="0" max="12" value="${b}"></label>
        </div>
      </div>
      <div class="cards">${cells.join("")}</div>
      <p class="note">${meta ? esc(`${meta.type}. ${meta.scope}. ${meta.tone}.`) : "Ngoài bảng 0–8, áp dụng quy tắc tổng quát theo d."}</p>
      <div class="panel table-wrap" style="margin-top:12px">
        <table>
          <thead><tr><th>Khóa</th><th>Loại</th><th>Phạm vi</th><th>Khi xa</th></tr></thead>
          <tbody>
            ${keys.map((key) => {
              const row = G.rules[key];
              return `<tr><td>${key}</td><td>${esc(row.type)}</td><td>${esc(row.scope)}</td><td>${esc(row.tone)}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <h2>Case đặc biệt</h2>
      ${G.cases.map((item) => `
        <details class="case">
          <summary>${item.n}. ${esc(item.title)}</summary>
          <p>${esc(item.desc)}</p>
          <p><b>Cách xử lý.</b> ${esc(item.handle)}</p>
          <p class="note">${esc(item.effect)}</p>
        </details>`).join("")}
      <h2>Cấp bậc họ</h2>
      <div class="cards">
        ${G.ranks.map((rank) => `<article class="mini"><h3>${esc(rank.level)}</h3><p>${esc(rank.how)}</p><p class="note">${esc(rank.example)}</p></article>`).join("")}
      </div>`;
  }

  function renderRegion() {
    return `
      <div class="toolbar"><div><div class="eyebrow">Bắc · Trung · Nam</div><h2>Cùng một vai, khác tiếng gọi</h2></div></div>
      <p class="lead">Cây và nhánh không đổi theo miền. Chỉ lời gọi của cha mẹ, bác gái và cô được đổi khi bạn chọn miền ở thanh trên.</p>
      <div class="panel table-wrap">
        <table>
          <thead><tr><th>Quan hệ</th><th>Bắc</th><th>Trung</th><th>Nam</th><th>Ghi chú</th></tr></thead>
          <tbody>
            ${G.regions.map((row) => `<tr><td>${esc(row.relation)}</td><td>${esc(row.bac)}</td><td>${esc(row.trung)}</td><td>${esc(row.nam)}</td><td>${esc(row.note)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
      <h2>Qua hôn nhân</h2>
      <p class="note">Gọi theo vai của người huyết thống mình nối qua. Vợ và rể không tạo thêm nút trên cây phụ hệ này.</p>
      <div class="panel table-wrap">
        <table>
          <thead><tr><th>Người</th><th>Cách gọi</th><th>Nối qua</th><th>Ghi chú</th></tr></thead>
          <tbody>
            ${G.marriage.map((row) => `<tr><td>${esc(row.person)}</td><td>${esc(row.call)}</td><td>${esc(row.via)}</td><td>${esc(row.note)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  const views = { tree: renderTree, lien: renderLien, address: renderAddress, members: renderMembers, rules: renderRules, region: renderRegion };

  function renderStats() {
    const generations = Math.max(...G.people.map((p) => p.generation));
    $("#stats").innerHTML = `
      <div class="stat"><b>${generations}</b><span>đời</span></div>
      <div class="stat"><b>${G.people.length}</b><span>thành viên</span></div>
      <div class="stat"><b>2</b><span>chi</span></div>
      <div class="stat"><b>${checks.pass}/${checks.total}</b><span>ca kiểm thử khớp</span></div>`;
    $("#foot").innerHTML = `${esc(G.clan.model)} Bảng quy tắc đối chiếu xong ${checks.pass}/${checks.total} ca.`;
  }

  function render() {
    document.querySelector(".hero").classList.toggle("compact", state.view !== "tree");
    document.querySelectorAll(".nav button").forEach((btn) => {
      if (btn.dataset.view === state.view) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    if (state.view === "lien") {
      $("#ego").innerHTML = lienPeople()
        .map((p) => `<option value="${p.id}" ${p.id === state.lienEgoId ? "selected" : ""}>${esc(p.name)} · họ ${esc(p.clan)}</option>`)
        .join("");
    } else {
      $("#ego").innerHTML = options(state.egoId);
    }
    $("#region").value = state.region;
    const active = document.activeElement;
    const focusId = active && active.id;
    const caret = active && active.selectionStart;
    $("#view").innerHTML = views[state.view]();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus();
        if (caret != null && el.setSelectionRange) el.setSelectionRange(caret, caret);
      }
    }
    bindTree();
    renderDrawer();
  }

  function renderLienDrawer(person) {
    const ego = Lh.byId[state.lienEgoId];
    const rel = person.id === ego.id ? null : Lh.relate(ego.id, person.id, state.lienPrefer);
    const father = person.fatherId ? Lh.byId[person.fatherId] : null;
    const mother = person.motherId ? Lh.byId[person.motherId] : null;
    const spouse = person.spouseId ? Lh.byId[person.spouseId] : null;
    const siblings = father ? lienKids(father.id).filter((p) => p.id !== person.id) : [];
    const children = lienPeople()
      .filter((p) => p.fatherId === person.id || p.motherId === person.id)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const line = (list) => list.length
      ? list.map((p) => `<button class="text-btn" type="button" data-open="${p.id}">${esc(p.name)} · ${esc(lienLabel(state.lienEgoId, p.id))}</button>`).join("")
      : `<span class="note">Không có.</span>`;
    let spoken = "Đây là người đang xưng hô.";
    let extra = "";
    if (rel) {
      const term = rel.term ? K.regionalize(rel.term, state.region) : "chưa có đường xưng hô";
      spoken = ego.name + " gọi người này là " + term + ".";
      if (rel.kind === "blood" && rel.paths.noi && rel.paths.ngoai) {
        const noi = K.regionalize(rel.paths.noi.term, state.region);
        const ngoai = K.regionalize(rel.paths.ngoai.term, state.region);
        extra += `<p class="note">Bên nội: ${esc(noi)}. Bên ngoại: ${esc(ngoai)}. ${rel.differentPaths ? "Hai đường khác nhau, đang chọn " + esc(preferName[state.lienPrefer]) + "." : "Hai đường cùng cách gọi."}</p>`;
      }
      if (rel.kind === "blood" && rel.spouses) {
        extra += `<p class="note">Hai người cũng là vợ chồng. Cách xưng hô lấy theo huyết thống.</p>`;
      } else if (rel.kind === "blood" && rel.marriage) {
        const alt = K.regionalize(rel.marriage.term, state.region);
        const used = K.regionalize(rel.term, state.region);
        if (alt !== used) {
          extra += `<p class="note">Theo hôn nhân có thể gọi là ${esc(alt)}. Cách đang dùng là huyết thống.</p>`;
        }
      } else if (rel.kind === "marriage" && rel.viaId) {
        extra += `<p class="note">Nối qua ${esc(Lh.byId[rel.viaId].name)}.</p>`;
      }
    }
    const personBtn = (p, empty) => p
      ? `<button class="text-btn" type="button" data-open="${p.id}">${esc(p.name)} · ${esc(lienLabel(state.lienEgoId, p.id))}</button>`
      : `<span class="note">${empty}</span>`;
    $("#drawer").innerHTML = `
      <button class="icon-btn" type="button" id="close-drawer">Đóng</button>
      <p class="kicker">${esc(person.id)} · họ ${esc(person.clan)} · đời ${person.generation}</p>
      <h2>${esc(person.name)}</h2>
      <p>${esc(lienMeta(person))} · ${esc(person.gender)}</p>
      <p class="spoken">${esc(spoken)}</p>
      ${extra}
      <div class="actions">
        <button class="btn" type="button" id="make-ego">Đặt làm người xưng hô</button>
      </div>
      <h3>Cha</h3>
      ${personBtn(father, "Thủy tổ của họ này.")}
      <h3>Mẹ</h3>
      ${personBtn(mother, "Chưa ghi mẹ.")}
      <h3>Vợ / chồng</h3>
      ${personBtn(spouse, "Chưa ghi hôn nhân.")}
      <h3>Anh chị em cùng cha</h3>
      ${line(siblings)}
      <h3>Con</h3>
      ${line(children)}`;
  }

  function renderDrawer() {
    if (state.view === "lien") {
      const person = state.selectedId ? Lh.byId[state.selectedId] : null;
      $("#drawer").classList.toggle("hidden", !person);
      $("#drawer-back").classList.toggle("hidden", !person);
      if (person) renderLienDrawer(person);
      return;
    }
    const person = state.selectedId ? K.byId[state.selectedId] : null;
    $("#drawer").classList.toggle("hidden", !person);
    $("#drawer-back").classList.toggle("hidden", !person);
    if (!person) return;
    const father = person.fatherId ? K.byId[person.fatherId] : null;
    const siblings = father ? kidsOf(father.id).filter((p) => p.id !== person.id) : [];
    const children = kidsOf(person.id);
    const line = (list) => list.length
      ? list.map((p) => `<button class="text-btn" type="button" data-open="${p.id}">${esc(p.name)} · ${esc(kinLabel(state.egoId, p.id))}</button>`).join("")
      : `<span class="note">Không có trong cây này.</span>`;
    $("#drawer").innerHTML = `
      <button class="icon-btn" type="button" id="close-drawer">Đóng</button>
      <p class="kicker">${esc(person.id)} · đời ${person.generation}</p>
      <h2>${esc(person.name)}</h2>
      <p>${esc(rankLine(person))} · ${esc(person.gender)}</p>
      <p class="spoken">${esc(state.egoId === person.id ? "Đây là người đang xưng hô." : K.byId[state.egoId].name + " gọi người này là " + kinLabel(state.egoId, person.id) + ".")}</p>
      <div class="actions">
        <button class="btn" type="button" id="make-ego">Đặt làm người xưng hô</button>
        <button class="btn ghost" type="button" id="compare">So với người này</button>
      </div>
      <h3>Cha</h3>
      ${father ? `<button class="text-btn" type="button" data-open="${father.id}">${esc(father.name)}</button>` : `<span class="note">Thủy tổ của cây.</span>`}
      <h3>Anh chị em cùng cha</h3>
      ${line(siblings)}
      <h3>Con</h3>
      ${line(children)}
      ${person.gender === "Nữ" ? `<p class="note">Con của con gái không đưa vào cây phụ hệ. Họ thuộc họ ngoại.</p>` : ""}`;
  }

  document.body.addEventListener("click", (event) => {
    const viewBtn = event.target.closest("[data-view]");
    if (viewBtn && viewBtn.dataset.view) {
      event.preventDefault();
      if (viewBtn.dataset.view !== state.view) {
        state.selectedId = null;
        state.tree.fitted = false;
      }
      if (viewBtn.dataset.view === "lien" && state.view !== "lien") {
        const speaker = Lh.byId[state.lienEgoId];
        if (speaker) state.lienClan = speaker.clan;
      }
      state.view = viewBtn.dataset.view;
      render();
      return;
    }
    const clanBtn = event.target.closest("[data-clan]");
    if (clanBtn && state.view === "lien") {
      state.lienClan = clanBtn.dataset.clan;
      const selected = state.selectedId && Lh.byId[state.selectedId];
      if (!selected || selected.clan !== state.lienClan) state.selectedId = null;
      state.tree.fitted = false;
      render();
      return;
    }
    const preferBtn = event.target.closest("[data-prefer]");
    if (preferBtn && state.view === "lien") {
      state.lienPrefer = preferBtn.dataset.prefer;
      render();
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) {
      if (state.view === "lien") {
        const person = Lh.byId[open.dataset.open];
        if (person && person.clan !== state.lienClan) {
          state.lienClan = person.clan;
          state.tree.fitted = false;
        }
      }
      state.selectedId = open.dataset.open;
      render();
      return;
    }
    if (event.target.id === "swap") {
      [state.xId, state.yId] = [state.yId, state.xId];
      render();
      return;
    }
    if (event.target.id === "print") {
      window.print();
      return;
    }
    if (event.target.id === "close-drawer" || event.target.id === "drawer-back") {
      state.selectedId = null;
      render();
      return;
    }
    if (event.target.id === "make-ego" && state.selectedId) {
      if (state.view === "lien") state.lienEgoId = state.selectedId;
      else {
        state.egoId = state.selectedId;
        state.xId = state.selectedId;
      }
      render();
      return;
    }
    if (event.target.id === "compare" && state.selectedId) {
      state.xId = state.egoId;
      state.yId = state.selectedId;
      state.view = "address";
      state.selectedId = null;
      render();
    }
  });

  document.body.addEventListener("change", (event) => {
    if (event.target.id === "ego") {
      if (state.view === "lien") state.lienEgoId = event.target.value;
      else {
        state.egoId = event.target.value;
        state.xId = event.target.value;
      }
    } else if (event.target.id === "region") state.region = event.target.value;
    else if (event.target.id === "x-id") state.xId = event.target.value;
    else if (event.target.id === "y-id") state.yId = event.target.value;
    else if (event.target.id === "rule-a") state.ruleA = event.target.value;
    else if (event.target.id === "rule-b") state.ruleB = event.target.value;
    else return;
    render();
  });

  document.body.addEventListener("input", (event) => {
    if (event.target.id === "q") {
      state.query = event.target.value;
      render();
    } else if (event.target.id === "rule-a" || event.target.id === "rule-b") {
      state[event.target.id === "rule-a" ? "ruleA" : "ruleB"] = event.target.value;
      render();
    }
  });

  document.body.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.selectedId = null;
      render();
    }
    const card = event.target.closest("[data-open]");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      state.selectedId = card.dataset.open;
      render();
    }
  });

  window.addEventListener("beforeprint", preparePrint);
  window.addEventListener("afterprint", restorePrint);
  renderStats();
  render();
})();
