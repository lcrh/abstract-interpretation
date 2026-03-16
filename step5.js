(() => {
  const container = document.getElementById("galois-interactive");
  const stageLabel = document.getElementById("galois-stage");
  const nextBtn = document.getElementById("galois-next");
  const resetBtn = document.getElementById("galois-reset");
  const leftPanel = document.getElementById("galois-left");
  const midPanel = document.getElementById("galois-mid");
  const rightPanel = document.getElementById("galois-right");

  const examples = [
    {
      name: "3 grids, only (1,1)=1 shared",
      grids: [
        [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
        [[1,3,2,4],[2,4,1,3],[3,1,4,2],[4,2,3,1]],
        [[1,4,2,3],[2,3,1,4],[3,1,4,2],[4,2,3,1]],
      ],
    },
  ];

  let currentExample = 0;
  let stage = 0; // 0=S, 1=α(S), 2=γ(α(S))

  function computeAlpha(grids) {
    const facts = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grids[0][r][c];
        if (grids.every((g) => g[r][c] === val)) {
          facts.push([r, c, val]);
        }
      }
    }
    return facts;
  }

  function computeGamma(facts) {
    return ALL_GRIDS.filter((g) =>
      facts.every(([r, c, v]) => g[r][c] === v)
    );
  }

  function renderMiniGrid(grid, highlightCells, cls) {
    const table = document.createElement("table");
    table.className = "sudoku sudoku-mini " + (cls || "");
    for (let r = 0; r < 4; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 4; c++) {
        const td = document.createElement("td");
        td.textContent = grid[r][c];
        if (highlightCells && highlightCells.some(([hr, hc]) => hr === r && hc === c)) {
          td.classList.add("agree");
        } else if (highlightCells) {
          td.classList.add("disagree");
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }

  function renderThumbnail(grid, cls, alpha, sGridEls) {
    const table = document.createElement("table");
    table.className = "thumbnail " + (cls || "");
    for (let r = 0; r < 4; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 4; c++) {
        const td = document.createElement("td");
        td.dataset.d = grid[r][c];
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    const gridKey = JSON.stringify(grid);

    table.addEventListener("mouseenter", () => {
      // Fill in the abstract grid's empty cells with this grid's values
      const absGrid = midPanel.querySelector(".sudoku-mini");
      if (absGrid) {
        absGrid.querySelectorAll("td").forEach((td) => {
          if (td.classList.contains("disagree")) {
            const r = td.parentElement.rowIndex;
            const c = td.cellIndex;
            td.textContent = grid[r][c];
            td.classList.add("preview-cell");
          }
        });
      }
      // Highlight matching original grid in S
      if (sGridEls && sGridEls.has(gridKey)) {
        sGridEls.get(gridKey).classList.add("grid-highlight");
      }
    });
    table.addEventListener("mouseleave", () => {
      const absGrid = midPanel.querySelector(".sudoku-mini");
      if (absGrid) {
        absGrid.querySelectorAll(".preview-cell").forEach((td) => {
          td.textContent = "";
          td.classList.remove("preview-cell");
        });
      }
      if (sGridEls && sGridEls.has(gridKey)) {
        sGridEls.get(gridKey).classList.remove("grid-highlight");
      }
    });

    return table;
  }

  function renderFactPills(facts) {
    const div = document.createElement("div");
    div.className = "facts";
    facts.forEach(([r, c, v]) => {
      const span = document.createElement("span");
      span.className = "fact shared-fact";
      span.textContent = `${v} at (${r + 1},${c + 1})`;
      div.appendChild(span);
    });
    return div;
  }

  function renderPartialGrid(facts) {
    const table = document.createElement("table");
    table.className = "sudoku sudoku-mini";
    const factMap = {};
    facts.forEach(([r, c, v]) => { factMap[`${r},${c}`] = v; });
    for (let r = 0; r < 4; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 4; c++) {
        const td = document.createElement("td");
        const key = `${r},${c}`;
        if (key in factMap) {
          td.textContent = factMap[key];
          td.classList.add("agree");
        } else {
          td.classList.add("disagree");
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }

  function update() {
    const ex = examples[currentExample];
    const S = ex.grids;
    const alpha = computeAlpha(S);
    const alphaCells = alpha.map(([r, c]) => [r, c]);
    const gammaSet = computeGamma(alpha);

    leftPanel.innerHTML = "";
    midPanel.innerHTML = "";
    rightPanel.innerHTML = "";

    // Map from grid JSON to its mini grid element for highlighting
    const sGridEls = new Map();

    if (stage >= 0) {
      // Stage 0: Show S
      const label = document.createElement("div");
      label.className = "galois-panel-label";
      label.textContent = `S (${S.length} grids)`;
      leftPanel.appendChild(label);
      S.forEach((g) => {
        const el = renderMiniGrid(g, stage >= 1 ? alphaCells : null);
        sGridEls.set(JSON.stringify(g), el);
        leftPanel.appendChild(el);
      });
    }

    if (stage >= 1) {
      // Stage 1: Show α(S)
      const label = document.createElement("div");
      label.className = "galois-panel-label";
      label.textContent = `α(S) — ${alpha.length} facts`;
      midPanel.appendChild(label);
      midPanel.appendChild(renderPartialGrid(alpha));
    }

    if (stage >= 2) {
      // Stage 2: Show γ(α(S))
      const origSet = new Set(S.map((g) => JSON.stringify(g)));
      const extras = gammaSet.filter((g) => !origSet.has(JSON.stringify(g)));
      const label = document.createElement("div");
      label.className = "galois-panel-label";
      label.textContent = `γ(α(S)) — ${gammaSet.length} grids`;
      rightPanel.appendChild(label);

      const pool = document.createElement("div");
      pool.className = "galois-pool";
      // Original grids first
      S.forEach((g) => pool.appendChild(renderThumbnail(g, "", alpha, sGridEls)));
      // Extras highlighted
      extras.forEach((g) => pool.appendChild(renderThumbnail(g, "thumbnail-extra", alpha, sGridEls)));
      rightPanel.appendChild(pool);

      if (extras.length > 0) {
        const note = document.createElement("div");
        note.className = "galois-extra-note";
        note.textContent = `+${extras.length} new valid grids`;
        rightPanel.appendChild(note);
      }

      // Count invalid grids that also match the facts
      const freeCells = 16 - alpha.length;
      const totalComplete = Math.pow(4, freeCells);
      const invalidCount = totalComplete - gammaSet.length;
      if (invalidCount > 0) {
        const invalidNote = document.createElement("div");
        invalidNote.className = "galois-invalid-note";
        invalidNote.textContent = `(+ ${invalidCount.toLocaleString()} invalid grids)`;
        rightPanel.appendChild(invalidNote);
      }
    }

    // Update button states
    const stages = ["S", "α(S)", "γ(α(S))"];
    stageLabel.textContent = stage < 2 ? `Next: ${stages[stage + 1]}` : "Done";
    nextBtn.disabled = stage >= 2;
  }

  nextBtn.addEventListener("click", () => {
    if (stage < 2) {
      stage++;
      update();
    }
  });

  resetBtn.addEventListener("click", () => {
    stage = 0;
    update();
  });

  update();
})();
