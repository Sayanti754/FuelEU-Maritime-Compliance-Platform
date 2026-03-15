# AI Agent Workflow Log

## Agents Used

| Agent | Role in This Project |
|-------|---------------------|
| **Claude (claude.ai / Claude Code)** | Primary agent — architecture design, all domain logic, use-case implementations, repository adapters, React components, hooks, tests |
| **GitHub Copilot** | Inline autocomplete for repetitive boilerplate (type declarations, import paths, test `beforeEach` blocks) |
| **Cursor Agent** | Refactoring passes — enforcing consistent naming conventions across files, extracting shared utilities |

---

## Prompts & Outputs

### Example 1 — Domain Formula Generation

**Prompt (to Claude Code):**
```
Given the FuelEU Maritime Regulation (EU) 2023/1805 spec:
- Target GHG intensity 2025 = 89.3368 gCO2e/MJ (2% below 91.16)
- Energy in scope (MJ) = fuelConsumption (tonnes) × 41,000 MJ/t
- Compliance Balance = (Target − Actual) × EnergyInScope

Write a TypeScript module `formulas.ts` with pure functions:
- computeEnergyInScope(fuelConsumptionTonnes)
- computeComplianceBalance(target, actual, fuelConsumption)
- computePercentDiff(comparison, baseline)
- isCompliant(ghgIntensity, target?)

Use strict TypeScript, export all constants.
```

**Generated Output (abbreviated):**
```typescript
export const TARGET_GHG_INTENSITY_2025 = 89.3368;
export const ENERGY_CONVERSION_FACTOR = 41_000;

export function computeComplianceBalance(
  targetIntensity: number,
  actualIntensity: number,
  fuelConsumptionTonnes: number
): number {
  const energyInScope = fuelConsumptionTonnes * ENERGY_CONVERSION_FACTOR;
  return (targetIntensity - actualIntensity) * energyInScope;
}
```

✅ Output was correct on first pass — pure functions with no side effects, matching the spec formula exactly.

---

### Example 2 — CreatePool Greedy Allocation

**Prompt (to Claude Code):**
```
Implement CreatePoolUseCase (TypeScript) following Article 21 of FuelEU Maritime.
Rules:
1. Sum(adjustedCB) >= 0 — reject otherwise
2. Deficit ship cannot exit worse than it entered
3. Surplus ship cannot exit negative
4. Use greedy allocation: sort members desc by CB, transfer surplus to deficits
5. Return pool, members with cb_before/cb_after, and poolSum
```

**Initial Output:** Had a bug — the inner loop iterated over `sorted` in the same order for both surplus and deficit, so surplus ships were matched against themselves.

**Refinement Prompt:**
```
The allocation loop is incorrect — when iterating deficit ships you're using 
sorted (descending), but deficits are at the end. Reverse the inner loop to 
iterate from lowest CB upward when looking for deficit recipients.
```

**Corrected Output:**
```typescript
for (const deficitShip of sorted.slice().reverse()) {
  if (cbAfterMap[deficitShip.shipId] >= 0) continue;
  ...
}
```

✅ After correction, all pool allocation tests pass correctly.

---

### Example 3 — Hexagonal Architecture Scaffolding

**Prompt (to Cursor Agent):**
```
Generate the complete hexagonal directory structure for a Node.js TypeScript 
backend with:
- src/core/domain/ (entities, formulas)
- src/core/application/use-cases/
- src/core/ports/ (repository interfaces)
- src/adapters/inbound/http/routes/
- src/adapters/outbound/postgres/
- src/infrastructure/db/ and server/
No framework imports in core/. Ports are pure interfaces only.
```

**Output:** Correct directory structure with proper import directions enforced. Agent also generated `IRouteRepository`, `IComplianceRepository`, `IBankRepository`, and `IPoolRepository` port interfaces in one shot.

---

### Example 4 — React Hooks with Axios

**Prompt (to Claude Code):**
```
Write a React custom hook `useBanking` that:
- Manages state: cb, records, totalBanked, lastResult, loading, error
- fetchCB(shipId, year) — calls both complianceService.getCB and bankingService.getRecords in parallel
- bank(shipId, year, amount) — calls bankingService.bank, then refetches state
- apply(shipId, year, amount) — calls bankingService.apply, then refetches state
- All errors stored in error state, re-thrown for caller to catch
TypeScript strict mode. No any types.
```

**Output:** Hook generated correctly, including the `Promise.all` for parallel fetching. Minor correction needed — initial version didn't re-throw errors from `bank()` and `apply()`, which prevented the UI from showing per-action success messages. Fixed with a try/catch that sets `error` state and re-throws.

---

## Validation / Corrections

### How agent output was verified:

1. **Formula correctness** — manually computed CB for R002 (LNG, ghg=88.0, fuel=4800):
   - EnergyInScope = 4800 × 41,000 = 196,800,000 MJ
   - CB = (89.3368 − 88.0) × 196,800,000 = +263,367,240 gCO₂eq (surplus ✅)
   - Verified against agent output with a unit test.

2. **Banking logic** — ran edge-case tests: amount = 0 (rejected), amount > CB (rejected), CB ≤ 0 (rejected). All validated.

3. **Pool allocation** — manually traced through a 2-ship pool (surplus=50000, deficit=−20000):
   - Expected: deficit → 0, surplus → 30000, poolSum = 30000 ✅

4. **API endpoints** — tested with `curl` / Postman before writing integration tests:
   ```bash
   curl http://localhost:3001/routes
   curl -X POST http://localhost:3001/routes/R002/baseline
   curl "http://localhost:3001/compliance/cb?shipId=R002&year=2024"
   ```

5. **TypeScript strict** — ran `tsc --noEmit` on both frontend and backend; fixed 4 implicit `any` issues flagged by the compiler that the agent missed.

---

## Observations

### Where agents saved significant time:
- **Boilerplate elimination**: Repository adapters (PostgresRouteRepository, etc.) were generated in ~30 seconds vs. 15+ minutes of manual typing for SQL mapping + row conversion functions.
- **Test scaffolding**: Mock factory pattern (`mockRouteRepo`, `mockComplianceRepo`) was suggested by the agent and saved significant test setup time.
- **Type generation**: All TypeScript interfaces for domain entities and API response shapes were generated instantly.
- **Component structure**: React tab components with TailwindCSS styling were scaffolded quickly; the agent correctly inferred the responsive grid layout from the KPI spec.

### Where agents failed or hallucinated:
- **Pool allocation direction bug** (Example 2 above) — agent initially sorted both loops in descending order.
- **Missing error re-throw** in `useBanking` hook — agent correctly set error state but forgot the `throw` statement needed for caller-side feedback.
- **Import paths** — Cursor occasionally generated incorrect relative import paths (e.g., `../../../ports` instead of `../../ports`) that required manual correction.
- **pg Pool naming conflict** — when generating `PoolRepository.ts`, the agent used `Pool` as both the pg import alias and the domain entity type, causing a TypeScript collision. Required manual rename to `PgPool`.

### How tools were combined:
- Claude Code for architecture decisions, domain logic, and complex use cases
- Copilot for repetitive patterns (SQL INSERT templates, `rowTo*` mapping functions)
- Cursor Agent for cross-file refactoring (renaming, consistent style enforcement)
- Manual validation at each layer boundary before proceeding to the next

---

## Best Practices Followed

1. **Domain-first prompting** — always defined the business rule (from EU Regulation) before asking the agent to generate code. This produced accurate formulas.
2. **Small, focused prompts** — each prompt targeted a single use case or component. Avoided "build the whole backend" prompts.
3. **Explicit interface contracts** — provided port interfaces before asking for implementations; agents generated adapters that correctly satisfied the interface.
4. **Incremental commits** — used `git commit` after each verified layer: domain → ports → adapters → HTTP → tests → frontend.
5. **Test-driven correction** — when agent output was wrong, wrote a failing test first, then prompted the agent to fix it.
6. **Type-first** — always requested TypeScript interfaces before implementation, letting the type system catch agent mistakes.
