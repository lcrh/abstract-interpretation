(() => {
  const svg = document.getElementById("deduction-lattice");
  const W = 900;
  const H = 1600;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const solution = [[1,2,3,4],[3,4,1,2],[4,3,2,1],[2,1,4,3]];
  const free = [[0,1],[0,3],[1,0],[1,2],[2,1],[2,3],[3,0]];
  const N = free.length; // 7
  const SIZE = 1 << N;  // 128

  const digitColors = {
    1: "#2488cf", 2: "#f57c20", 3: "#3dab4a", 4: "#b44ec9", "-1": "#f0f0ec"
  };

  const givenSet = new Set();
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (!free.some(([fr,fc]) => fr===r && fc===c))
        givenSet.add(`${r},${c}`);

  function popcount(n) { let c=0; while(n){c+=n&1;n>>=1;} return c; }

  function getGrid(mask) {
    const g = Array.from({length:4}, ()=>Array(4).fill(-1));
    for (let r=0;r<4;r++) for(let c=0;c<4;c++)
      if (givenSet.has(`${r},${c}`)) g[r][c]=solution[r][c];
    for (let i=0;i<N;i++)
      if (mask&(1<<i)) { const[r,c]=free[i]; g[r][c]=solution[r][c]; }
    return g;
  }

  function gridToMask(g) {
    let mask=0;
    for (let i=0;i<N;i++) { const[r,c]=free[i]; if(g[r][c]!==-1) mask|=(1<<i); }
    return mask;
  }

  // Deduction rules
  function lastInRow(g) {
    let changed=false;
    for (let r=0;r<4;r++) {
      const unknowns=[]; let sum=0;
      for(let c=0;c<4;c++) { if(g[r][c]===-1) unknowns.push([r,c]); else sum+=g[r][c]; }
      if (unknowns.length===1) { g[unknowns[0][0]][unknowns[0][1]]=10-sum; changed=true; }
    }
    return changed;
  }
  function lastInCol(g) {
    let changed=false;
    for (let c=0;c<4;c++) {
      const unknowns=[]; let sum=0;
      for(let r=0;r<4;r++) { if(g[r][c]===-1) unknowns.push([r,c]); else sum+=g[r][c]; }
      if (unknowns.length===1) { g[unknowns[0][0]][unknowns[0][1]]=10-sum; changed=true; }
    }
    return changed;
  }
  function lastInBox(g) {
    let changed=false;
    for (let br=0;br<2;br++) for(let bc=0;bc<2;bc++) {
      const cells=[];
      for(let dr=0;dr<2;dr++) for(let dc=0;dc<2;dc++) cells.push([br*2+dr,bc*2+dc]);
      const unknowns=[]; let sum=0;
      for(const[r,c] of cells) { if(g[r][c]===-1) unknowns.push([r,c]); else sum+=g[r][c]; }
      if (unknowns.length===1) { g[unknowns[0][0]][unknowns[0][1]]=10-sum; changed=true; }
    }
    return changed;
  }

  const rules = [
    { name: "Last in row", fn: lastInRow, enabled: false },
    { name: "Last in column", fn: lastInCol, enabled: false },
    { name: "Last in box", fn: lastInBox, enabled: false },
  ];

  function applyDeduction(mask) {
    const g = getGrid(mask);
    let changed = true;
    while (changed) {
      changed = false;
      for (const rule of rules)
        if (rule.enabled && rule.fn(g)) changed = true;
    }
    return gridToMask(g);
  }

  // Layout: 3D stagger for all multi-node levels
  const positions = {};
  const byLevel = Array.from({length: N+1}, () => []);
  for (let m = 0; m < SIZE; m++) byLevel[popcount(m)].push(m);

  const nodeGap = 50;
  const diagOffsetX = 20;
  const diagOffsetY = 44;
  const levelGap = 100;
  const maxPerRow = 12;

  let yAccum = 60;

  byLevel.forEach((masks, level) => {
    const n = masks.length;

    if (n <= 1) {
      // Single node: centered, no stagger
      positions[masks[0]] = { x: W / 2, y: yAccum };
      yAccum += levelGap;
    } else {
      // Split into sub-rows of maxPerRow for 3D effect
      const rows = [];
      for (let idx = 0; idx < n; idx += maxPerRow) {
        rows.push(masks.slice(idx, idx + maxPerRow));
      }

      rows.forEach((row, ri) => {
        const w = row.length * nodeGap;
        const startX = (W - w) / 2 + nodeGap / 2 + ri * diagOffsetX;
        const y = yAccum + ri * diagOffsetY;
        row.forEach((m, i) => {
          positions[m] = { x: startX + i * nodeGap, y };
        });
      });

      const totalSubRowH = (rows.length - 1) * diagOffsetY;
      yAccum += totalSubRowH + levelGap;
    }
  });

  // Adjust SVG to fit
  const actualH = yAccum + 40;
  svg.setAttribute("viewBox", `0 0 ${W} ${actualH}`);

  // Draw Hasse edges
  const hasseGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  for (let i = 0; i < SIZE; i++) {
    for (let j = i + 1; j < SIZE; j++) {
      if (popcount(i ^ j) === 1 && (i & j) === i) {
        const p1 = positions[i], p2 = positions[j];
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", p1.x);
        line.setAttribute("y1", p1.y + 10);
        line.setAttribute("x2", p2.x);
        line.setAttribute("y2", p2.y - 10);
        line.setAttribute("stroke", "#d8d8d4");
        line.setAttribute("stroke-width", 0.5);
        hasseGroup.appendChild(line);
      }
    }
  }
  svg.appendChild(hasseGroup);

  // Arrow defs
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "ded-arrow");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");
  const mp = document.createElementNS("http://www.w3.org/2000/svg", "path");
  mp.setAttribute("d", "M0,1 L5,3 L0,5");
  mp.setAttribute("fill", "none");
  mp.setAttribute("stroke", "#e05050");
  mp.setAttribute("stroke-width", "1");
  marker.appendChild(mp);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Deduction arrows group
  const arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(arrowGroup);

  // Draw pixel-grid nodes
  const cellSize = 8;
  const gridPx = cellSize * 4;

  for (let m = 0; m < SIZE; m++) {
    const pos = positions[m];
    const g = getGrid(m);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform",
      `translate(${pos.x - gridPx/2}, ${pos.y - gridPx/2})`);
    group.setAttribute("data-mask", m);
    group.setAttribute("class", "deduction-node");

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", c * cellSize);
        rect.setAttribute("y", r * cellSize);
        rect.setAttribute("width", cellSize);
        rect.setAttribute("height", cellSize);
        rect.setAttribute("fill", digitColors[g[r][c]] || "#f0f0ec");
        rect.setAttribute("stroke", "#e0e0dc");
        rect.setAttribute("stroke-width", 0.2);
        group.appendChild(rect);
      }
    }
    group.style.cursor = "pointer";
    group.addEventListener("mouseenter", () => {
      // Dim all arrows, highlight this node's arrow
      arrowGroup.querySelectorAll(".ded-arrow-el").forEach((el) => {
        if (el.getAttribute("data-src") === String(m)) {
          el.setAttribute("opacity", 1);
          el.setAttribute("stroke", "#c03030");
        } else {
          el.setAttribute("opacity", 0.15);
        }
      });
    });
    group.addEventListener("mouseleave", () => {
      // Restore all arrows — just redraw
      updateArrows();
    });

    svg.appendChild(group);
  }

  // Labels
  function addLabel(text, x, y) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", x); el.setAttribute("y", y);
    el.setAttribute("text-anchor", "middle");
    el.setAttribute("class", "lattice-level-label");
    el.textContent = text;
    svg.appendChild(el);
  }
  addLabel("⊤ (givens only)", W/2, 28);
  addLabel("solution", W/2, actualH - 5);

  // Draw deduction arrows
  function updateArrows() {
    arrowGroup.innerHTML = "";
    const anyEnabled = rules.some((r) => r.enabled);

    for (let m = 0; m < SIZE; m++) {
      const target = applyDeduction(m);
      const src = positions[m];

      if (target === m) {
        // Self-loop: vertical tangent out from top, horizontal tangent in to right
        const tx = src.x + 4;
        const ty = src.y - gridPx/2 - 2;
        const rx = src.x + gridPx/2 + 2;
        const ry = src.y - 4;
        const bulge = 30;
        const loop = document.createElementNS("http://www.w3.org/2000/svg", "path");
        loop.setAttribute("d",
          `M${tx},${ty} C${tx},${ty - bulge} ${rx + bulge},${ry} ${rx},${ry}`);
        loop.setAttribute("fill", "none");
        loop.setAttribute("stroke", anyEnabled ? "#ddd" : "#e05050");
        loop.setAttribute("stroke-width", 0.7);
        loop.setAttribute("opacity", 0.85);
        loop.setAttribute("marker-end", "url(#ded-arrow)");
        loop.setAttribute("data-src", m);
        loop.setAttribute("class", "ded-arrow-el");
        arrowGroup.appendChild(loop);
      } else {
        const dst = positions[target];
        const dx = dst.x - src.x;
        const dy = dst.y - src.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const nx = dx/len, ny = dy/len;
        const x1 = src.x + nx * 12;
        const y1 = src.y + ny * 12;
        // End at top center of target grid
        const x2 = dst.x;
        const y2 = dst.y - gridPx/2 - 4;
        // Curved
        const perpX = -ny, perpY = nx;
        const curvature = Math.min(len * 0.15, 25);
        const cx = (x1 + x2) / 2 + perpX * curvature;
        const cy = (y1 + y2) / 2 + perpY * curvature;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#e05050");
        path.setAttribute("stroke-width", 0.7);
        path.setAttribute("opacity", 0.85);
        path.setAttribute("marker-end", "url(#ded-arrow)");
        path.setAttribute("data-src", m);
        path.setAttribute("class", "ded-arrow-el");
        arrowGroup.appendChild(path);
      }
    }
  }

  // Build controls
  const controls = document.getElementById("deduction-controls");
  rules.forEach((rule) => {
    const label = document.createElement("label");
    label.className = "deduction-rule-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = false;
    cb.addEventListener("change", () => {
      rule.enabled = cb.checked;
      updateArrows();
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + rule.name));
    controls.appendChild(label);
  });

  updateArrows();
})();
