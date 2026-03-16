# Abstract Interpretation Tutorial — Content Plan

## Step 1: Partial orderings as partial information

Introduce partial orderings as a way to represent **partial information**.
The key intuition: the lower you are in the partial order, the more you know.

**Running example: 2x2x2 Sudoku** (4x4 grid with 2x2 boxes, digits 1–4).

Show a partially filled Sudoku. The initial givens form our starting state of
knowledge a₀ — a list of facts like "3 at (1,2)", "4 at (2,1)". By applying
Sudoku rules, we deduce new facts and arrive at a₁, then a₂, and so on. Each
aᵢ is a state of the reasoning algorithm.

We order these states by information: a ⊑ b iff every fact in b is also in a
(i.e., a has at least as many facts as b — more knowledge = lower in the
order). So a₀ ⊒ a₁ ⊒ a₂ ⊒ … as we learn more, we descend.

But not all states are comparable. Two states can each know something the
other doesn't — e.g., one knows "1 at (1,1)" and the other knows "3 at (2,4)",
but neither contains the other's facts. Neither a ⊑ b nor b ⊑ a holds.
Demonstrate this with a concrete example.

Then formalize: this is a **partial order** — reflexive, antisymmetric,
transitive, but not every pair of elements is comparable.

*Key insight:* We can compare representations of facts according to how much
information they contain. This yields a partial order.

## Step 2: From partial orders to lattices

**Finding agreement (least upper bound).** Given two states, ask: "what do
they agree on?" That is, what is the most informative state that is less
precise than both? Show an example where two states share some facts (their
agreement is non-trivial) and another where they share nothing (agreement is
vacuous). In partial-order terms, this is the **least upper bound (lub / join)**.

**Combining knowledge (greatest lower bound).** Now turn it around: given two
separate sets of facts, what does it mean to combine them? We want the least
precise state that is more precise than both inputs — the **greatest lower
bound (glb / meet)**.

**A partial order with lub and glb is called a lattice.**

**But what about inconsistency?** Combining facts can produce contradictions
(e.g., "1 at (1,1)" and "2 at (1,1)"). We add a special node **⊥ (bottom)**
to represent "inconsistent" — it sits below everything. We also add **⊤ (top)**
for the state of having no knowledge at all — it sits above everything.

Now formally define the lattice with ⊤, ⊥, ⊔ (join), and ⊓ (meet).

*Key insight:* Meet is a little like saying "both are true" and join is like
"at least one is true" — approximate versions of "and" and "or". A lattice
is a representation where we have these approximate "and" and "or".

## Step 3: The powerset lattice — no information loss

Observe that our meets (combining knowledge) are precise, but joins (finding
agreement) lose information. When two states disagree on a cell, the join
just forgets it — even though each state individually knew something.

Ask: what data structure would we need to avoid losing any information? The
simplest answer: track **all possible complete grids** that are compatible
with our current state of knowledge. A state of knowledge is a set of
complete assignments Loc → {1,2,3,4}.

This is the **powerset lattice** P(Loc → Number):
- Elements are sets of complete grids
- ⊤ = the set of all valid grids (know nothing)
- ⊥ = ∅ (inconsistent — no grid satisfies the constraints)
- Meet (⊓) = intersection (combining knowledge narrows the possibilities)
- Join (⊔) = union (agreement keeps all possibilities from both)

Formally define this lattice. Now joins are precise too — no information is
lost.

*Key insight:* There is usually a most precise representation, but it is
computationally too expensive.

## Step 4: Modeling abstraction — α and γ

We now have two representations:
- The **concrete** powerset lattice P(Loc → Number) — precise but expensive
  to store and process.
- The **abstract** lattice from Steps 1–2 (partial assignments) — cheap but
  lossy.

Define a pair of functions connecting them:
- **α (abstraction):** given a set of complete grids, extract the facts that
  all grids agree on → produces an abstract state. We say α(S) **abstracts** S.
- **γ (concretization):** given an abstract state (partial assignment), return
  the set of all complete grids compatible with it → produces a concrete set.
  We say γ(a) is what a **represents**.

Show these on the Sudoku example.

*Key insight:* We can formally connect a precise and an approximate
representation via a pair of functions: α abstracts, γ tells us what an
abstract element represents.

## Step 5: Galois connections and soundness

Our abstract lattice is lossy — but it has a nice property: whenever we can
determine something using only the abstract representation (e.g., a number
assignment for a cell), that conclusion also holds in the precise powerset
version. The abstraction is an **overapproximation** — it may know less, but
it never lies. This "does not lie" quality is called **soundness**.

This means we can write algorithms over the cheap abstract representation and
trust their results. Example: an algorithm that spots the missing number on a
row/column/box. If it concludes "3 goes at (2,3)" in the abstract lattice,
that's true in the concrete lattice too.

Formalize: α and γ must both be **monotone** (order-preserving). Their
key properties:
- **γ ∘ α is extensive (increasing):** γ(α(S)) ⊇ S — going to the abstract
  and back, we always get at least what we started with. We never lose a valid
  solution by abstracting.
- **α ∘ γ is reductive (decreasing):** α(γ(a)) ⊑ a — going to the concrete
  and back, we never end up with a worse abstraction.

These are two sides of the same coin: **abstraction** and **representation**.

The abstraction side (γ ∘ α extensive) says: we never lose a valid solution
by going abstract.

The representation side (α ∘ γ reductive) says: the abstract may carry
extraneous representational structure that we can eliminate by round-tripping
through the concrete. Illustrate with a different abstract domain: represent
numbers by a range and a parity (odd/even). Start with the abstract element
(even, [3,6]). Concretize: the even numbers in [3,6] are {4,6}. Re-abstract:
(even, [4,6]) — a strictly more precise abstract element. The round-trip
squeezed out the slack.

A **Galois connection** is the special setting where for every concrete state
of affairs, there is always one *ideal* (most precise) abstract
representation — even though many non-ideal abstract elements may represent
the same concrete set.

Note: our earlier observation that meets are precise but joins are lossy in
the abstract lattice falls out of the math of the Galois connection — it is
not a coincidence but a structural consequence of the abstraction.

**Side note:** This entire section dualizes. The dual of soundness is
**completeness** — we never add a solution candidate that isn't an actual
solution. In that setting, α and γ swap roles. This is beyond the scope of
this tutorial.

*Key insight:* The intuitive notions of "abstraction" and "representation"
can be formalized by Galois connections.

## Step 6: A hierarchy of abstractions

Think of logical deduction as **filtering out invalid candidates** from the
set of possible solutions.

Deduction functions can vary in strength. What properties should any
reasonable deduction function have?

- **Monotone:** if you start with fewer candidates, you should end with fewer
  candidates. Deduction shouldn't somehow produce more results from less
  input.
- **Decreasing:** deduction only removes candidates, never adds them. The
  result is always ⊑ the input.

The **best** deduction function on the powerset lattice simply filters out
every grid that violates a Sudoku constraint — applying it leaves exactly
the valid solutions. This best deduction function has the following
properties:

- **Monotone:** fewer candidates in → fewer candidates out.
- **Decreasing:** it only removes candidates, never adds them.
- **Idempotent:** applying it twice gives the same result as once — once
  invalid candidates are gone, they're gone.

Such a function is called a **closure operator** (specifically a lower closure).

**Sound abstract deduction.** We can also define deduction on the abstract
lattice. An abstract deduction operator d is **sound** if
α ∘ d ∘ γ ⊑ d* (where d* is the best concrete deduction). That is:
whatever d concludes in the abstract, when we check against the concrete, is
consistent with what the ideal deduction would conclude.

Introduce a simple Python deduction rule for 2x2x2 Sudoku: check each
row/column/box — if exactly one number is missing, fill it in. Walk through
this on the running example.

*Key insight:* Deduction is filtering out invalid candidates. We can define
sound deduction on cheap abstract lattices and trust the results.

## Step 7: Deduction as filtering

We now have the machinery to compare different ways of representing Sudoku
knowledge. Line up three lattices, each more abstract than the last:

1. **P(Loc → N)** — the powerset lattice from Step 3. Most precise, tracks
   all possible complete grids.

2. **Loc → P(N)** — for each location, track the set of numbers still
   possible there. This is like "penciling in" candidates at each cell.
   What do we lose? **Relational information** — we no longer know which
   combinations of cell values are jointly possible, only what's possible
   per cell independently.

3. **Loc → (N ∪ {⊥, ⊤})** — for each location, either we know the number
   for certain, or we don't (⊤), or we have a contradiction (⊥). This is
   the partial-assignment lattice from Steps 1–2. Even more abstract: we
   only keep what we're sure about.

Draw a lattice diagram showing the three levels with Galois connections
between them, each step trading precision for efficiency.

*Key insight:* There is a hierarchy of abstractions trading precision for
efficiency. Each level loses a specific kind of information (e.g., relational
information between cells).

---

## Interactive elements

### Interactive 1 (Step 1): Sudoku solver with partial order chain

A 2x2x2 Sudoku puzzle (4x4 grid, digits 1–4) with a unique solution. The
user solves it interactively by filling in cells. The puzzle is generated
randomly (or from a curated set).

Alongside the grid, display a **descending chain** of knowledge states. Start
with a₀ (the givens). Each time the user correctly fills in a cell, a new
element aᵢ₊₁ appears below the previous one, connected by a line labeled ⊒.
The chain grows downward as the user progresses toward the solution.

### Interactive 2 (Step 2): Zoomable lattice with glb/lub explorer

A zoomable visualization of the full lattice (for a small 2x2x2 Sudoku
state space), including ⊥. The user can click on any two elements and the
view zooms in to highlight their glb and lub, showing how meet and join
work concretely.

### Interactive 3 (Step 3): Shrinking candidate pool

Display the Sudoku grid alongside a pool of all compatible complete grids,
rendered as tiny thumbnail grids. As the user fills in a correct deduction,
candidates that are now incompatible disappear, and the remaining candidates
grow larger to fill the available space. Starts crowded and overwhelming
(driving home "too expensive"), ends with a single full-size solved grid.

### Interactive 4–5 (Steps 4–5): α/γ round-trip

Start with a small, hand-picked set of complete grids displayed on the left.
Apply α: highlight the cells that all grids agree on → show the resulting
partial assignment (abstract element) in the center. Apply γ: expand back to
all compatible grids on the right. On the right, show the resulting abstract element (partial assignment grid).
Apply γ back to the left: the original grids plus any new compatible grids
that weren't in the original set, visually distinguished (e.g., different
color/border), making γ(α(S)) ⊇ S immediately visible — the round-trip
added candidates. Keep the sets small enough (say 3–6 grids) that every
grid is fully readable.
