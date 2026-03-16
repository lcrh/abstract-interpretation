(() => {
  const thumbContainer = document.getElementById("hierarchy-thumbs");
  const concreteGrid = document.getElementById("hierarchy-concrete");
  const pencilGrid = document.getElementById("hierarchy-pencil");
  const abstractGrid = document.getElementById("hierarchy-abstract");

  // 3 grids sharing rows 1-2, nice pencil marks (max 2 per cell)
  const gridSet = [
    [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],
    [[1,2,3,4],[3,4,1,2],[2,3,4,1],[4,1,2,3]],
    [[1,2,3,4],[3,4,1,2],[4,1,2,3],[2,3,4,1]],
  ];

  // Precompute pencil marks (Loc -> P(N))
  const pencilMarks = [];
  for (let r = 0; r < 4; r++) {
    pencilMarks.push([]);
    for (let c = 0; c < 4; c++) {
      const vals = [...new Set(gridSet.map((g) => g[r][c]))].sort();
      pencilMarks[r].push(vals);
    }
  }

  // Precompute alpha (Loc -> N | ⊤)
  const alpha = [];
  for (let r = 0; r < 4; r++) {
    alpha.push([]);
    for (let c = 0; c < 4; c++) {
      const vals = new Set(gridSet.map((g) => g[r][c]));
      alpha[r].push(vals.size === 1 ? [...vals][0] : null);
    }
  }

  // Build thumbnails with set notation: { grid, grid, grid }
  const openBrace = document.createElement("span");
  openBrace.className = "set-brace";
  openBrace.textContent = "{";
  thumbContainer.appendChild(openBrace);

  gridSet.forEach((grid, idx) => {
    if (idx > 0) {
      const comma = document.createElement("span");
      comma.className = "set-comma";
      comma.textContent = ",";
      thumbContainer.appendChild(comma);
    }

    const table = document.createElement("table");
    table.className = "thumbnail";
    for (let r = 0; r < 4; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 4; c++) {
        const td = document.createElement("td");
        td.dataset.d = grid[r][c];
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    table.addEventListener("mouseenter", () => {
      showSingle(grid);
      highlightPencilFor(grid);
    });
    table.addEventListener("mouseleave", () => {
      clearSingle();
      resetPencilHighlight();
    });
    thumbContainer.appendChild(table);
  });

  const closeBrace = document.createElement("span");
  closeBrace.className = "set-brace";
  closeBrace.textContent = "}";
  thumbContainer.appendChild(closeBrace);

  function buildSudokuGrid(container, cellFn) {
    container.innerHTML = "";
    const table = document.createElement("table");
    table.className = "sudoku sudoku-mini";
    for (let r = 0; r < 4; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 4; c++) {
        const td = cellFn(r, c);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    container.appendChild(table);
  }

  const digitColors = {
    1: "#2488cf",
    2: "#f57c20",
    3: "#3dab4a",
    4: "#b44ec9",
  };

  function renderPencilMarks() {
    buildSudokuGrid(pencilGrid, (r, c) => {
      const td = document.createElement("td");
      const vals = pencilMarks[r][c];
      if (vals.length === 1) {
        td.textContent = vals[0];
        td.classList.add("agree");
      } else {
        td.classList.add("pencil-cell");
        vals.forEach((v, i) => {
          if (i > 0) td.appendChild(document.createTextNode(","));
          const span = document.createElement("span");
          span.textContent = v;
          span.style.color = digitColors[v];
          span.style.fontWeight = "600";
          span.dataset.r = r;
          span.dataset.c = c;
          span.dataset.v = v;
          span.style.opacity = "0.35";
          span.className = "pencil-digit";
          td.appendChild(span);
        });
      }
      return td;
    });
  }

  function highlightPencilFor(grid) {
    pencilGrid.querySelectorAll(".pencil-digit").forEach((span) => {
      const r = parseInt(span.dataset.r);
      const c = parseInt(span.dataset.c);
      const v = parseInt(span.dataset.v);
      span.style.opacity = (grid[r][c] === v) ? "1" : "0.25";
    });
  }

  function resetPencilHighlight() {
    pencilGrid.querySelectorAll(".pencil-digit").forEach((span) => {
      span.style.opacity = "0.35";
    });
  }

  function renderAbstract() {
    buildSudokuGrid(abstractGrid, (r, c) => {
      const td = document.createElement("td");
      if (alpha[r][c] !== null) {
        td.textContent = alpha[r][c];
        td.classList.add("agree");
      } else {
        td.textContent = "?";
        td.classList.add("disagree");
      }
      return td;
    });
  }

  function showSingle(grid) {
    buildSudokuGrid(concreteGrid, (r, c) => {
      const td = document.createElement("td");
      td.textContent = grid[r][c];
      // Highlight cells where all grids agree
      if (alpha[r][c] !== null) {
        td.classList.add("agree");
      }
      return td;
    });
  }

  function clearSingle() {
    buildSudokuGrid(concreteGrid, (r, c) => {
      const td = document.createElement("td");
      td.classList.add("empty-cell");
      return td;
    });
  }

  // Initial render
  clearSingle();
  renderPencilMarks();
  renderAbstract();

  // Match spacer height to thumbnails row
  requestAnimationFrame(() => {
    const thumbHeight = thumbContainer.offsetHeight;
    document.querySelectorAll(".hierarchy-spacer").forEach((el) => {
      el.style.height = thumbHeight + "px";
    });
  });
})();
