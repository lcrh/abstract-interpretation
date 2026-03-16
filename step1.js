(() => {
  const chain = document.getElementById("chain-display");
  const inputs = document.querySelectorAll("#puzzle-grid input");
  let deductionCount = 0;

  function factLabel(r, c, v) {
    return `${v} at (${r + 1},${c + 1})`;
  }

  function addChainNode(newFact) {
    deductionCount++;
    const idx = deductionCount;
    const prevIdx = idx - 1;

    // Add edge
    const edge = document.createElement("div");
    edge.className = "chain-edge";
    edge.textContent = "⊑";
    chain.appendChild(edge);

    // Add node: a_n = a_{n-1} + {new fact}
    const node = document.createElement("div");
    node.className = "chain-node chain-node-expanded";

    // a_n =
    const label = document.createElement("span");
    label.className = "chain-label";
    label.innerHTML =
      `<var>a</var><sub>${idx}</sub> = <var>a</var><sub>${prevIdx}</sub> + `;
    node.appendChild(label);

    // new fact pill
    const pill = document.createElement("span");
    pill.className = "fact deduced-fact";
    pill.textContent = factLabel(newFact.row, newFact.col, newFact.val);
    node.appendChild(pill);

    chain.appendChild(node);

    // Keep latest entries visible at the bottom
    chain.scrollTo({ top: chain.scrollHeight, behavior: "smooth" });
  }

  // Reset
  document.getElementById("reset-btn").addEventListener("click", () => {
    deductionCount = 0;
    inputs.forEach((input) => {
      input.value = "";
      input.disabled = false;
      input.classList.remove("correct", "wrong");
    });
    chain.innerHTML = `<div class="chain-node chain-node-a0" id="chain-a0">
      <div><var>a</var><sub>0</sub> =</div>
      <div class="chain-facts">
        <span class="fact">1 at (1,1)</span>
        <span class="fact">3 at (1,3)</span>
        <span class="fact">4 at (2,2)</span>
        <span class="fact">2 at (3,3)</span>
        <span class="fact">1 at (4,2)</span>
        <span class="fact">3 at (4,4)</span>
      </div>
    </div>`;
  });

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      const val = parseInt(input.value, 10);
      const answer = parseInt(input.dataset.answer, 10);
      const row = parseInt(input.dataset.row, 10);
      const col = parseInt(input.dataset.col, 10);

      if (val === answer) {
        // Correct — lock it in
        input.disabled = true;
        input.classList.add("correct");
        addChainNode({ row, col, val });
      } else if (input.value !== "") {
        // Wrong — flash and clear
        input.classList.add("wrong");
        setTimeout(() => {
          input.classList.remove("wrong");
          input.value = "";
        }, 400);
      }
    });
  });
})();
