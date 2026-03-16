(() => {
  const pool = document.getElementById("grid-pool");
  const poolWrapper = document.querySelector(".powerset-right");
  const countEl = document.getElementById("grid-count");
  const invalidEl = document.getElementById("invalid-count");
  const gridEl = document.getElementById("powerset-grid");
  const resetBtn = document.getElementById("powerset-reset");
  const inputs = gridEl.querySelectorAll("input");

  let constraints = [];
  const thumbnails = []; // persistent DOM elements, one per grid

  function isCompatible(grid, cons) {
    return cons.every(([r, c, v]) => grid[r][c] === v);
  }

  function showPreview(grid) {
    inputs.forEach((input) => {
      if (input.disabled) return;
      const r = parseInt(input.dataset.row, 10);
      const c = parseInt(input.dataset.col, 10);
      input.value = grid[r][c];
      input.classList.add("preview");
    });
  }

  function clearPreview() {
    inputs.forEach((input) => {
      if (input.disabled) return;
      input.value = "";
      input.classList.remove("preview");
    });
  }

  // Shuffle grids so compatible ones are scattered, not clustered
  function seededShuffle(arr) {
    const a = [...arr];
    let seed = 42;
    for (let i = a.length - 1; i > 0; i--) {
      seed = (seed * 16807 + 0) % 2147483647;
      const j = seed % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const shuffledGrids = seededShuffle(ALL_GRIDS);

  // Build all 288 thumbnails once
  shuffledGrids.forEach((grid) => {
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
      if (!table.classList.contains("incompatible")) showPreview(grid);
    });
    table.addEventListener("mouseleave", clearPreview);
    pool.appendChild(table);
    thumbnails.push({ el: table, grid });
  });

  function update() {
    let count = 0;
    thumbnails.forEach(({ el, grid }) => {
      if (isCompatible(grid, constraints)) {
        el.classList.remove("incompatible");
        count++;
      } else {
        el.classList.add("incompatible");
      }
    });
    countEl.textContent = count;

    // Total complete grids matching constraints = 4^(free cells)
    const freeCells = 16 - constraints.length;
    const totalComplete = Math.pow(4, freeCells);
    const invalidCount = totalComplete - count;
    if (invalidCount > 0) {
      const formatted = invalidCount.toLocaleString();
      invalidEl.textContent = `(+ ${formatted} invalid grids)`;
    } else {
      invalidEl.textContent = "";
    }
  }

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      const val = parseInt(input.value, 10);
      const row = parseInt(input.dataset.row, 10);
      const col = parseInt(input.dataset.col, 10);

      if (val >= 1 && val <= 4) {
        const test = [...constraints, [row, col, val]];
        const compatible = ALL_GRIDS.filter((g) => isCompatible(g, test));

        if (compatible.length > 0) {
          input.disabled = true;
          input.classList.add("correct");
          constraints.push([row, col, val]);
          update();
        } else {
          input.classList.add("wrong");
          setTimeout(() => {
            input.classList.remove("wrong");
            input.value = "";
          }, 400);
        }
      } else if (input.value !== "") {
        input.value = "";
      }
    });
  });

  resetBtn.addEventListener("click", () => {
    constraints = [];
    inputs.forEach((input) => {
      input.value = "";
      input.disabled = false;
      input.classList.remove("correct", "wrong");
    });
    update();
  });

  update();
})();
