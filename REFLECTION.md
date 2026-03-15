# Reflection on AI-Agent-Assisted Development

## What I Learned Using AI Agents

Working with AI agents on a structured full-stack project revealed a clear pattern: **agents excel at execution within well-defined boundaries, and struggle with cross-cutting concerns that require global context**.

The most valuable insight was the importance of *domain-first prompting*. Before writing any code, translating the FuelEU Regulation's mathematical formulas into precise natural language — including units, constraints, and edge cases — produced accurate, testable output on the first pass. When I started with "write the compliance balance formula," the agent delivered correct code. When I later tried "write the banking use case" without first clarifying the state machine (CB must be positive, amount must not exceed surplus), the agent omitted the validation logic entirely.

I also learned that hexagonal architecture is particularly agent-friendly: the clear separation of ports (interfaces) from adapters (implementations) meant I could prompt the agent to implement each layer independently, with the TypeScript interface acting as a ground-truth contract that the compiler would enforce. This made it straightforward to detect when the agent generated an adapter that didn't satisfy its port.

## Efficiency Gains vs. Manual Coding

The gains were substantial but unevenly distributed:

**High gain areas:**
- PostgreSQL repository adapters: row-mapping functions, SQL parameterization, and UPSERT patterns are highly formulaic — agent output required minimal correction.
- React component scaffolding: table structures, conditional badge rendering, and TailwindCSS utility class patterns emerged quickly and correctly.
- Test mock factories: the agent suggested the `mockRouteRepo(overrides)` pattern that made unit tests composable and concise.
- Boilerplate (package.json, tsconfig, jest.config): instant and accurate.

**Low/negative gain areas:**
- Complex stateful logic (pool allocation, partial bank-entry consumption): required 2–3 refinement cycles. The time spent prompting and correcting sometimes approached the time it would have taken to write it manually.
- Cross-file refactoring: agents had no memory of earlier files and occasionally re-introduced naming inconsistencies that required a Cursor Agent pass to clean up.

**Overall estimate**: AI assistance reduced total implementation time by approximately 40–50%. The largest savings were in infrastructure/adapter code; the smallest were in core domain logic where precision mattered most.

## Improvements I'd Make Next Time

1. **Establish a `tasks.md` upfront**: Define every use case, endpoint, and component as a checklist before starting. This gives the agent clear scope and prevents it from generating features that weren't requested.

2. **Write port interfaces manually, generate implementations**: I'd never delegate the definition of domain ports to an agent. The ports represent the core contracts of the architecture; getting them right requires careful thought about coupling and testability. Once interfaces exist, agent-generated adapters are reliable.

3. **One use case, one prompt, one test**: I found that prompting for a use case, immediately generating its test, and running both before moving on was far more efficient than batching. Errors were caught earlier and the correction cycle was shorter.

4. **Version-lock agent outputs**: When agents generate package.json dependency versions or SQL syntax, the output should be pinned and verified against actual package changelogs. Two generated dependency versions were already outdated.

5. **Use agents for documentation earlier**: I used agents mostly for code in this project. I should have used them earlier to draft the database schema documentation and API contract (OpenAPI spec), which would have served as additional grounding for subsequent code generation prompts.

The overall experience reinforced that AI agents are most powerful as *accelerators for well-understood work*, not as substitutes for architectural thinking. The clearer the human's mental model, the more reliably the agent can execute it.
