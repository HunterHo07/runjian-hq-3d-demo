# Build Notes

Use deterministic Three.js or Blender export scripts for GLB generation.

Generated pilot batch:

```text
big-map/rj-big-world-map.glb
building/hq-command-tower.glb
building/office-module.glb
building/factory-module.glb
building/tower-module.glb
building/outpost-module.glb
building/control-module.glb
building/storage-module.glb
building/solar-module.glb
interior/hq-floor.glb
interior/control-room.glb
interior/office-floor.glb
interior/factory-bay.glb
interior/outpost-dispatch.glb
interior/tower-floor.glb
interior/storage-room.glb
interior/solar-control-room.glb
landmark/solar-operations-landmark.glb
landmark/power-factory-landmark.glb
landmark/field-service-landmark.glb
landmark/ai-tower-landmark.glb
landmark/storage-microgrid-landmark.glb
infrastructure/inspection-service-kit.glb
agent-props/ai-agent.glb
agent-props/operator-human.glb
agent-props/inspection-drone.glb
```

Export rules:

- Standard glTF 2.0 PBR materials.
- No HUD text, status labels, or click logic in GLB.
- Keep asset origins centered and scale consistent with RJ-1 world units.
- Validate in Three.js before replacing procedural geometry.
