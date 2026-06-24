# Asset Direction Comparison

## Current Procedural Set

- Fastest to iterate in SvelteKit and Three.js.
- Already supports scene rebuilding, status updates, click targets, day/night, and animation.
- Good for exhibition prototype delivery.

## Pilot GLB Set

- Twenty-six validated GLB assets now exist under `glb/`.
- `big-map/rj-big-world-map` proves the Big World terrain, six landmarks, routes, vehicles, drones, and masts can move out of procedural code.
- `building/hq-command-tower` proves the hero building language: clean white massing, blue glass, roof halo, antenna, and cyan/gold accents.
- `landmark/solar-operations-landmark`, `landmark/power-factory-landmark`, `landmark/field-service-landmark`, `landmark/ai-tower-landmark`, and `landmark/storage-microgrid-landmark` replace the generic Big World station silhouettes with area-specific GLB landmarks.
- `building/office-module`, `building/factory-module`, `building/tower-module`, `building/outpost-module`, `building/control-module`, `building/storage-module`, and `building/solar-module` replace generic Area Map building bodies with reusable GLB modules.
- `interior/hq-floor`, `interior/control-room`, `interior/office-floor`, `interior/factory-bay`, `interior/outpost-dispatch`, `interior/tower-floor`, `interior/storage-room`, and `interior/solar-control-room` replace generic Inside Map fit-out with room-specific GLB modules.
- `infrastructure/inspection-service-kit` proves portable station detail for service vehicles, drones, transformers, cable drums, and beacons.
- `agent-props/ai-agent`, `agent-props/operator-human`, and `agent-props/inspection-drone` replace the live AI crew, human operator, and drone bodies with validated GLB props while preserving frontend motion paths.
- Labels, HUD, status rings, click targets, and agent workflow should remain frontend-owned.

## Recommendation

Keep the current procedural scene as the live RJ-1 prototype and replace visual chunks asset-by-asset. Current Big World landmark, Area Map building-body, Inside Map room-fitout, and live crew targets are now live GLB replacements. Next targets:

1. Generate the six full area-map GLBs after the live procedural layouts are accepted.
2. Add screenshot-based visual QA captures for every render level.
