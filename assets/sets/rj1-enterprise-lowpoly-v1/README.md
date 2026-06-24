# RJ-1 Enterprise Low-Poly Asset Set

Reusable asset-set plan and pilot GLB batch for the RunJian / iRun simWorld demo. The current RJ-1 frontend still renders the live scene procedurally in Three.js, while this set defines the asset hierarchy and includes the first validated replacement targets for GLB production.

## Direction

- Bright enterprise low-poly digital twin, not a toy city.
- Clean white buildings, blue glass, cyan/gold energy accents, service roads, terrain, solar rows, substations, storage racks, outposts, drones, vehicles, and Q-style AI/operator characters.
- HUD, labels, click state, and scripted agent workflow stay in the Svelte frontend.

## Current Status

- Big World, Area, Inside, agent, vehicle, drone, label, and overlay targets are defined in `manifest.json`.
- Twenty-six pilot GLBs are generated and validated: `big-map/rj-big-world-map`, `building/hq-command-tower`, five Big World station landmarks, seven reusable area-map building modules, eight reusable inside-map interior modules, `infrastructure/inspection-service-kit`, and three agent/crew props.
- Web-loadable copies live under `static/assets/sets/rj1-enterprise-lowpoly-v1/glb/`.
- The active Big World render progressively loads validated GLBs for the HQ command tower and all five surrounding station landmarks through `src/lib/simworld/engine/loadAssets.ts`.
- The active Area Map building renderer progressively loads validated GLB modules for `hq`, `office`, `factory`, `tower`, `outpost`, `control`, `storage`, and `solar` building kinds.
- The active Inside Map renderer progressively loads validated GLB interior modules for HQ floors, control rooms, office floors, factory bays, tower floors, outpost dispatch rooms, storage rooms, and solar diagnostic rooms.
- Live AI-agent crews, human-like operators, and inspection drones progressively load validated GLB props while keeping route animation and status logic in the frontend.
- Procedural overlays, labels, live status effects, click targets, and scripted workflow remain frontend-owned so they can respond to API state later.
