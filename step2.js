(() => {
  const svg = document.getElementById("lattice-svg");
  const meetResult = document.getElementById("meet-result");
  const joinResult = document.getElementById("join-result");
  const selectionHint = document.getElementById("selection-hint");
  const resetBtn = document.getElementById("lattice-reset");

  const facts = ["1 at (1,1)", "3 at (1,3)", "4 at (2,2)"];

  // Elements as bitmasks over 3 facts: 0b000 = ⊤ (no facts), 0b111 = all facts
  // More bits = more knowledge = lower in the order
  const elements = [];
  for (let i = 0; i < 8; i++) {
    const included = [];
    for (let b = 0; b < 3; b++) {
      if (i & (1 << b)) included.push(facts[b]);
    }
    elements.push({ mask: i, facts: included });
  }

  function label(mask) {
    if (mask === 0) return "⊤";
    const parts = [];
    for (let b = 0; b < 3; b++) {
      if (mask & (1 << b)) parts.push(facts[b]);
    }
    return parts.join(", ");
  }

  function shortLabel(mask) {
    if (mask === 0) return "⊤";
    const letters = [];
    for (let b = 0; b < 3; b++) {
      if (mask & (1 << b)) letters.push(String.fromCharCode(65 + b));
    }
    return "{" + letters.join(",") + "}";
  }

  // Layout: arrange by number of bits (level)
  // Level 0 (top): 0 bits = ⊤
  // Level 1: 1 bit
  // Level 2: 2 bits
  // Level 3 (bottom): 3 bits = all facts
  const width = 360;
  const height = 300;
  const levelY = [35, 110, 190, 265];
  const positions = {};

  // Level 0: mask=0
  positions[0] = { x: width / 2, y: levelY[0] };
  // Level 1: masks 1,2,4
  const level1 = [1, 2, 4];
  level1.forEach((m, i) => {
    positions[m] = { x: 80 + i * 100, y: levelY[1] };
  });
  // Level 2: masks 3,5,6
  const level2 = [3, 5, 6];
  level2.forEach((m, i) => {
    positions[m] = { x: 80 + i * 100, y: levelY[2] };
  });
  // Level 3: mask=7
  positions[7] = { x: width / 2, y: levelY[3] };

  // Draw edges (Hasse diagram: connect if they differ by exactly one bit)
  function popcount(n) {
    let c = 0;
    while (n) { c += n & 1; n >>= 1; }
    return c;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const diff = i ^ j;
      // Edge if j has exactly one more bit than i and j contains i
      if (popcount(diff) === 1 && (i & j) === i) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", positions[i].x);
        line.setAttribute("y1", positions[i].y);
        line.setAttribute("x2", positions[j].x);
        line.setAttribute("y2", positions[j].y);
        line.setAttribute("class", "lattice-edge");
        line.dataset.from = i;
        line.dataset.to = j;
        svg.appendChild(line);
      }
    }
  }

  // Draw nodes
  const nodeEls = {};
  for (let i = 0; i < 8; i++) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "lattice-node");
    g.dataset.mask = i;
    g.style.cursor = "pointer";

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", positions[i].x);
    circle.setAttribute("cy", positions[i].y);
    circle.setAttribute("r", 16);
    g.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", positions[i].x);
    text.setAttribute("y", positions[i].y + 4.5);
    text.setAttribute("text-anchor", "middle");
    text.textContent = shortLabel(i);
    g.appendChild(text);

    svg.appendChild(g);
    nodeEls[i] = g;
  }

  // Selection state
  let selected = [];

  function clearHighlights() {
    svg.querySelectorAll(".lattice-node").forEach((g) => {
      g.classList.remove("selected", "is-meet", "is-join");
    });
    svg.querySelectorAll(".lattice-edge").forEach((e) => {
      e.classList.remove("path-highlight");
    });
    meetResult.textContent = "";
    joinResult.textContent = "";
    selectionHint.textContent = "Click two elements to see their meet and join.";
  }

  function computeMeet(a, b) {
    return a | b; // union of facts = more knowledge = meet
  }

  function computeJoin(a, b) {
    return a & b; // intersection of facts = less knowledge = join
  }

  // Find edges on the path between two nodes in the Hasse diagram
  function findPathEdges(from, to) {
    // Highlight edges where one endpoint is a superset of `from` (or `to`)
    // and the other is a subset. This traces the path through the lattice.
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const highlighted = [];
    svg.querySelectorAll(".lattice-edge").forEach((e) => {
      const a = parseInt(e.dataset.from);
      const b = parseInt(e.dataset.to);
      // Edge (a,b) with a⊂b is on a path from lo to hi if
      // lo ⊆ a and b ⊆ hi (going from less bits to more bits)
      if ((a & lo) === lo && (hi & b) === b) {
        highlighted.push(e);
      }
    });
    return highlighted;
  }

  function showMeetJoin(maskA, maskB) {
    const meet = computeMeet(maskA, maskB);
    const join = computeJoin(maskA, maskB);

    nodeEls[meet].classList.add("is-meet");
    nodeEls[join].classList.add("is-join");

    // Highlight paths from selections to meet/join
    findPathEdges(join, maskA).forEach((e) => e.classList.add("path-highlight"));
    findPathEdges(join, maskB).forEach((e) => e.classList.add("path-highlight"));
    findPathEdges(maskA, meet).forEach((e) => e.classList.add("path-highlight"));
    findPathEdges(maskB, meet).forEach((e) => e.classList.add("path-highlight"));

    meetResult.innerHTML = `<var>a</var> ⊓ <var>b</var> = ${label(meet) || "⊤"}`;
    joinResult.innerHTML = `<var>a</var> ⊔ <var>b</var> = ${label(join) || "⊤"}`;
    selectionHint.textContent = "";
  }

  // Click handler
  Object.entries(nodeEls).forEach(([mask, g]) => {
    g.addEventListener("click", () => {
      const m = parseInt(mask);
      if (selected.length === 2) {
        clearHighlights();
        selected = [];
      }
      selected.push(m);
      g.classList.add("selected");

      if (selected.length === 1) {
        selectionHint.textContent = "Click a second element.";
      } else if (selected.length === 2) {
        showMeetJoin(selected[0], selected[1]);
      }
    });
  });

  resetBtn.addEventListener("click", () => {
    clearHighlights();
    selected = [];
  });
})();
