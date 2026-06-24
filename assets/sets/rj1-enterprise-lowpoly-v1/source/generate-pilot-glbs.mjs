#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class NodeFileReader {
  result = null;
  onloadend = null;

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }

  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    this.onloadend?.();
  }
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const setRoot = resolve(__dirname, '..');
const glbRoot = resolve(setRoot, 'glb');

const materials = {
  base: material('rj-warm-white-pbr', '#dce8e3', 0.08, 0.72),
  dark: material('rj-dark-metal-pbr', '#20343c', 0.35, 0.48),
  asphalt: material('rj-service-road-pbr', '#526a65', 0.12, 0.68),
  land: material('rj-terrain-green-pbr', '#5fb878', 0.03, 0.84),
  glass: material('rj-blue-glass-pbr', '#17394b', 0.18, 0.18, '#33d8ff', 0.18),
  cyan: material('rj-cyan-emissive-pbr', '#33d8ff', 0.05, 0.32, '#33d8ff', 0.82),
  gold: material('rj-gold-emissive-pbr', '#ffd36a', 0.08, 0.36, '#ffd36a', 0.72),
  green: material('rj-green-emissive-pbr', '#65f0a3', 0.06, 0.36, '#65f0a3', 0.64),
  solar: material('rj-solar-blue-pbr', '#0f3445', 0.5, 0.24, '#0a85ad', 0.08),
  rubber: material('rj-rubber-pbr', '#151b1f', 0.18, 0.7)
};

function material(name, color, metalness, roughness, emissive = '#000000', emissiveIntensity = 0) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity
  });
  mat.name = name;
  return mat;
}

function addBox(parent, name, size, position, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, name, radiusTop, radiusBottom, height, position, mat, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat);
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addSphere(parent, name, radius, position, mat, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), mat);
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addCone(parent, name, radius, height, position, mat, segments = 20) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, segments), mat);
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addTorus(parent, name, radius, tube, position, mat, segments = 96) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, segments), mat);
  mesh.name = name;
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addVehicle(parent, name, position, colorMat = materials.base) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBox(group, `${name}-body`, [1.7, 0.48, 0.82], [0, 0.42, 0], colorMat);
  addBox(group, `${name}-cab`, [0.74, 0.44, 0.7], [0.45, 0.82, 0], colorMat);
  addBox(group, `${name}-front-glass`, [0.08, 0.28, 0.56], [0.84, 0.87, 0], materials.glass);
  addBox(group, `${name}-status-light`, [0.5, 0.035, 0.12], [-0.55, 0.7, -0.44], materials.cyan);
  for (const [index, wheel] of [[-0.55, -0.48], [0.55, -0.48], [-0.55, 0.48], [0.55, 0.48]].entries()) {
    const mesh = addCylinder(group, `${name}-wheel-${index + 1}`, 0.18, 0.18, 0.14, [wheel[0], 0.18, wheel[1]], materials.rubber, 18);
    mesh.rotation.x = Math.PI / 2;
  }
  parent.add(group);
  return group;
}

function addDrone(parent, name, position) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBox(group, `${name}-body`, [0.68, 0.18, 0.44], [0, 0, 0], materials.base);
  addBox(group, `${name}-arm-x`, [1.35, 0.05, 0.06], [0, 0.02, 0], materials.dark);
  addBox(group, `${name}-arm-z`, [0.06, 0.05, 1.12], [0, 0.02, 0], materials.dark);
  for (const [index, rotor] of [[-0.72, -0.56], [0.72, -0.56], [-0.72, 0.56], [0.72, 0.56]].entries()) {
    addTorus(group, `${name}-rotor-${index + 1}`, 0.2, 0.012, [rotor[0], 0.05, rotor[1]], materials.cyan, 28);
  }
  addBox(group, `${name}-scan-light`, [0.32, 0.04, 0.08], [0, -0.14, -0.26], materials.cyan);
  parent.add(group);
  return group;
}

function addAIAgentCharacter(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addTorus(group, `${name}-foot-glow-ring`, 0.42, 0.014, [0, 0.05, 0], materials.cyan, 42);
  addCylinder(group, `${name}-body-shell`, 0.22, 0.3, 0.62, [0, 0.56, 0], materials.cyan, 24);
  addBox(group, `${name}-shoulder-compute-rig`, [0.68, 0.14, 0.32], [0, 0.84, 0], materials.cyan);
  addCylinder(group, `${name}-left-arm`, 0.065, 0.08, 0.46, [-0.34, 0.58, 0.02], materials.cyan, 12).rotation.z = -0.22;
  addCylinder(group, `${name}-right-arm`, 0.065, 0.08, 0.46, [0.34, 0.58, 0.02], materials.cyan, 12).rotation.z = 0.22;
  addCylinder(group, `${name}-left-leg`, 0.05, 0.065, 0.36, [-0.12, 0.2, 0], materials.dark, 10).rotation.z = 0.1;
  addCylinder(group, `${name}-right-leg`, 0.05, 0.065, 0.36, [0.12, 0.2, 0], materials.dark, 10).rotation.z = -0.1;
  addSphere(group, `${name}-soft-q-head`, 0.3, [0, 1.03, 0], materials.base, 28);
  addBox(group, `${name}-visor-band`, [0.42, 0.06, 0.05], [0, 1.04, -0.27], materials.cyan);
  addBox(group, `${name}-left-eye`, [0.16, 0.035, 0.05], [-0.1, 0.99, -0.29], materials.dark);
  addBox(group, `${name}-right-eye`, [0.16, 0.035, 0.05], [0.1, 0.99, -0.29], materials.dark);
  addBox(group, `${name}-chest-status-display`, [0.32, 0.05, 0.1], [0, 0.76, -0.23], materials.cyan);
  addBox(group, `${name}-rear-compute-pack`, [0.12, 0.42, 0.22], [0, 0.75, 0.29], materials.dark);
  addCylinder(group, `${name}-halo-mast`, 0.018, 0.024, 0.52, [0.2, 1.22, 0.08], materials.cyan, 8).rotation.z = -0.2;
  addTorus(group, `${name}-head-halo`, 0.44, 0.018, [0, 1.4, 0], materials.cyan, 42);
  addBox(group, `${name}-wrist-display`, [0.26, 0.035, 0.16], [-0.38, 0.75, -0.24], materials.cyan);
  parent.add(group);
  return group;
}

function addHumanOperatorCharacter(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  const skin = material('rj-operator-skin-pbr', '#ffe8c8', 0.02, 0.58);
  const blueUniform = material('rj-operator-blue-uniform-pbr', '#41a6d9', 0.12, 0.52);
  const helmet = material('rj-operator-helmet-pbr', '#f4f1dc', 0.06, 0.42);
  addCylinder(group, `${name}-uniform-torso`, 0.18, 0.24, 0.64, [0, 0.58, 0], blueUniform, 20);
  addBox(group, `${name}-safety-vest-light`, [0.36, 0.045, 0.08], [0, 0.76, -0.2], materials.gold);
  addCylinder(group, `${name}-left-arm-working`, 0.055, 0.068, 0.44, [-0.28, 0.62, 0.02], blueUniform, 12).rotation.z = -0.52;
  addCylinder(group, `${name}-right-arm-working`, 0.055, 0.068, 0.44, [0.28, 0.62, 0.02], blueUniform, 12).rotation.z = 0.48;
  addCylinder(group, `${name}-left-leg`, 0.05, 0.064, 0.4, [-0.12, 0.22, 0], materials.dark, 10).rotation.z = 0.12;
  addCylinder(group, `${name}-right-leg`, 0.05, 0.064, 0.4, [0.12, 0.22, 0], materials.dark, 10).rotation.z = -0.1;
  addSphere(group, `${name}-head`, 0.24, [0, 1.05, 0], skin, 24);
  addCylinder(group, `${name}-helmet-brim`, 0.23, 0.25, 0.08, [0, 1.21, 0], helmet, 24);
  addBox(group, `${name}-tablet-body`, [0.42, 0.045, 0.3], [0.34, 0.5, -0.22], materials.base);
  addBox(group, `${name}-tablet-screen`, [0.32, 0.03, 0.2], [0.34, 0.52, -0.39], materials.cyan);
  addTorus(group, `${name}-position-ring`, 0.36, 0.012, [0, 0.05, 0], materials.gold, 36);
  parent.add(group);
  return group;
}

function addHqTower(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBox(group, `${name}-executive-plaza`, [9.2, 0.22, 7.4], [0, 0.11, 0], materials.base);
  addBox(group, `${name}-front-plaza-data-rail`, [8.2, 0.055, 0.12], [0, 0.25, -3.86], materials.cyan);
  addBox(group, `${name}-right-plaza-data-rail`, [0.12, 0.055, 6.8], [4.72, 0.25, 0], materials.cyan);
  addBox(group, `${name}-podium`, [6.8, 1.2, 4.8], [0, 0.78, 0], materials.dark);
  addBox(group, `${name}-main-glass-tower`, [2.9, 8.2, 2.4], [0, 4.78, 0], materials.glass);
  addBox(group, `${name}-west-glass-wing`, [2.1, 5.8, 1.9], [-2.35, 3.55, 0.7], materials.glass);
  addBox(group, `${name}-east-glass-wing`, [1.9, 4.7, 1.7], [2.35, 2.98, 0.68], materials.glass);
  addBox(group, `${name}-entrance-canopy`, [3.4, 0.16, 0.7], [0, 1.58, -2.38], materials.cyan);
  addBox(group, `${name}-command-deck-front-rail`, [5.6, 0.05, 0.1], [0, 1.08, -2.62], materials.cyan);
  addBox(group, `${name}-command-deck-rear-rail`, [5.6, 0.045, 0.08], [0, 1.08, 2.62], materials.gold);
  addBox(group, `${name}-command-deck-left-rail`, [0.08, 0.045, 4.8], [-3.25, 1.08, 0], materials.cyan);
  addBox(group, `${name}-command-deck-right-rail`, [0.08, 0.045, 4.8], [3.25, 1.08, 0], materials.gold);
  for (let level = 0; level < 7; level += 1) {
    addBox(group, `${name}-window-rail-${level + 1}`, [2.95, 0.045, 0.06], [0, 2.15 + level * 0.86, -1.24], materials.cyan);
  }
  addCylinder(group, `${name}-roof-beacon`, 0.56, 0.74, 0.3, [0, 9.08, 0], materials.cyan, 48);
  addCone(group, `${name}-antenna-cap`, 0.32, 0.68, [0, 9.76, 0], materials.cyan, 24);
  parent.add(group);
  return group;
}

function addLandmarkBase(group, name, accentMaterial = materials.cyan) {
  addBox(group, `${name}-clickable-district-pad`, [7.2, 0.28, 5.7], [0, 0.14, 0], materials.base);
  addBox(group, `${name}-inner-service-plaza`, [5.35, 0.1, 3.9], [0, 0.34, 0], materials.asphalt);
  addBox(group, `${name}-front-status-rail`, [6.8, 0.055, 0.12], [0, 0.44, -2.95], accentMaterial);
  addBox(group, `${name}-right-status-rail`, [0.12, 0.055, 5.2], [3.65, 0.44, 0], accentMaterial);
  addBox(group, `${name}-left-service-rail`, [0.1, 0.045, 5.0], [-3.65, 0.44, 0], materials.cyan);
  addBox(group, `${name}-rear-service-rail`, [6.6, 0.045, 0.1], [0, 0.44, 2.95], materials.cyan);
}

function addSolarOperationsLandmark(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addLandmarkBase(group, name, materials.gold);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const panel = addBox(group, `${name}-pv-panel-${row + 1}-${col + 1}`, [0.86, 0.055, 0.44], [-2.0 + col * 1.0, 0.72, -1.05 + row * 0.62], materials.solar);
      panel.rotation.x = -0.32;
    }
  }
  addBox(group, `${name}-inverter-hall`, [2.4, 1.18, 1.25], [1.45, 0.98, 1.15], materials.base);
  addBox(group, `${name}-inverter-glass-bay`, [1.7, 0.58, 0.08], [1.45, 1.08, 0.51], materials.gold);
  addCylinder(group, `${name}-met-mast`, 0.035, 0.055, 3.25, [-2.25, 1.95, 1.3], materials.dark, 10);
  addBox(group, `${name}-met-mast-crossbar`, [0.88, 0.035, 0.035], [-2.25, 3.45, 1.3], materials.gold);
  addDrone(group, `${name}-solar-inspection-drone`, [-1.1, 2.55, 1.55]);
  parent.add(group);
  return group;
}

function addPowerFactoryLandmark(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addLandmarkBase(group, name, materials.green);
  addBox(group, `${name}-generator-hall`, [3.3, 1.55, 1.75], [-0.85, 1.06, 0.05], materials.base);
  addBox(group, `${name}-generator-roof`, [3.58, 0.22, 2.0], [-0.85, 1.96, 0.05], materials.dark);
  addBox(group, `${name}-control-strip`, [2.15, 0.08, 0.09], [-0.85, 1.25, -0.86], materials.green);
  for (let i = 0; i < 3; i += 1) {
    addCylinder(group, `${name}-transformer-bank-${i + 1}`, 0.28, 0.32, 0.94, [1.18 + i * 0.72, 0.82, -0.75], materials.dark, 24);
    addBox(group, `${name}-transformer-cap-${i + 1}`, [0.54, 0.08, 0.54], [1.18 + i * 0.72, 1.34, -0.75], materials.green);
  }
  for (let i = 0; i < 2; i += 1) {
    addCylinder(group, `${name}-pylon-${i + 1}-left`, 0.04, 0.06, 2.35, [1.25 + i * 1.2, 1.48, 1.05], materials.dark, 10);
    addCylinder(group, `${name}-pylon-${i + 1}-right`, 0.04, 0.06, 2.35, [1.65 + i * 1.2, 1.48, 1.05], materials.dark, 10);
    addBox(group, `${name}-pylon-${i + 1}-busbar`, [0.72, 0.045, 0.045], [1.45 + i * 1.2, 2.58, 1.05], materials.green);
  }
  addVehicle(group, `${name}-grid-service-van`, [-2.25, 0.2, 1.05], materials.base);
  parent.add(group);
  return group;
}

function addFieldServiceLandmark(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addLandmarkBase(group, name, materials.gold);
  addBox(group, `${name}-outpost-module`, [2.75, 1.15, 1.58], [-0.45, 0.94, -0.18], materials.base);
  addBox(group, `${name}-dispatch-glass`, [1.7, 0.5, 0.08], [-0.45, 1.05, -1.0], materials.gold);
  addBox(group, `${name}-vehicle-bay-roof`, [2.2, 0.16, 1.45], [1.75, 1.36, 1.0], materials.dark);
  addVehicle(group, `${name}-maintenance-rover`, [1.78, 0.28, 1.0], materials.gold);
  addTorus(group, `${name}-drone-launch-pad`, 0.82, 0.035, [-2.15, 0.46, 0.95], materials.cyan, 56);
  addDrone(group, `${name}-dispatch-drone`, [-2.15, 1.72, 0.95]);
  addCylinder(group, `${name}-radio-mast`, 0.045, 0.07, 3.5, [-2.35, 2.1, -1.1], materials.dark, 10);
  addBox(group, `${name}-radio-crossbar`, [1.15, 0.04, 0.04], [-2.35, 3.75, -1.1], materials.gold);
  parent.add(group);
  return group;
}

function addAiTowerLandmark(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addLandmarkBase(group, name, materials.cyan);
  addCylinder(group, `${name}-command-tower-core`, 0.82, 1.1, 4.45, [0, 2.58, 0], materials.glass, 56);
  addBox(group, `${name}-model-lab-wing`, [2.35, 0.75, 1.42], [-1.45, 0.96, 1.05], materials.base);
  addBox(group, `${name}-drone-room-wing`, [2.0, 0.68, 1.24], [1.65, 0.92, -0.95], materials.base);
  addTorus(group, `${name}-inference-ring`, 1.42, 0.045, [0, 3.8, 0], materials.cyan, 96);
  addTorus(group, `${name}-sky-crown`, 1.08, 0.04, [0, 4.92, 0], materials.gold, 84);
  addCone(group, `${name}-beacon-cap`, 0.42, 0.86, [0, 5.58, 0], materials.cyan, 28);
  for (let i = 0; i < 4; i += 1) {
    addBox(group, `${name}-tower-data-rail-${i + 1}`, [1.02, 0.045, 0.05], [0, 1.45 + i * 0.68, -0.82], materials.cyan);
  }
  addDrone(group, `${name}-model-room-drone`, [1.75, 2.2, 1.25]);
  parent.add(group);
  return group;
}

function addStorageMicrogridLandmark(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addLandmarkBase(group, name, materials.green);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      addBox(group, `${name}-battery-rack-${row + 1}-${col + 1}`, [0.42, 0.9, 0.5], [-2.1 + col * 0.56, 0.85, -0.8 + row * 0.62], materials.base);
      addBox(group, `${name}-battery-status-${row + 1}-${col + 1}`, [0.28, 0.035, 0.08], [-2.1 + col * 0.56, 1.32, -1.06 + row * 0.62], materials.green);
    }
  }
  addBox(group, `${name}-microgrid-control-shelter`, [2.45, 1.35, 1.55], [1.45, 1.0, 0.92], materials.glass);
  addBox(group, `${name}-shelter-roof`, [2.7, 0.18, 1.8], [1.45, 1.78, 0.92], materials.dark);
  for (let i = 0; i < 3; i += 1) {
    addCylinder(group, `${name}-cooling-fan-${i + 1}`, 0.2, 0.2, 0.08, [0.72 + i * 0.54, 1.16, 0.1], materials.dark, 28);
    addBox(group, `${name}-cooling-fan-light-${i + 1}`, [0.32, 0.035, 0.06], [0.72 + i * 0.54, 1.32, 0.1], materials.green);
  }
  addVehicle(group, `${name}-battery-service-cart`, [1.1, 0.18, -1.65], materials.base);
  parent.add(group);
  return group;
}

function addWindowBands(group, name, width, floors, yStart, z, mat = materials.cyan) {
  for (let floor = 0; floor < floors; floor += 1) {
    addBox(group, `${name}-window-band-${floor + 1}`, [width, 0.045, 0.06], [0, yStart + floor * 0.62, z], mat);
  }
}

function addBuildingBase(group, name, width = 10, depth = 7.5, accent = materials.cyan) {
  addBox(group, `${name}-service-pad`, [width + 1.25, 0.16, depth + 1.15], [0, 0.08, 0], materials.asphalt);
  addBox(group, `${name}-front-glow-rail`, [width + 0.7, 0.05, 0.08], [0, 0.24, -depth / 2 - 0.48], accent);
  addBox(group, `${name}-side-glow-rail-left`, [0.08, 0.05, depth + 0.7], [-width / 2 - 0.45, 0.24, 0], accent);
  addBox(group, `${name}-side-glow-rail-right`, [0.08, 0.05, depth + 0.7], [width / 2 + 0.45, 0.24, 0], accent);
}

function addOfficeModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 10, 7.2, materials.cyan);
  addBox(group, `${name}-main-glass-office`, [8.4, 4.4, 5.1], [0, 2.48, 0], materials.glass);
  addBox(group, `${name}-white-side-wing`, [2.7, 3.2, 4.4], [-3.1, 1.9, 0.55], materials.base);
  addBox(group, `${name}-roof-cap`, [8.9, 0.32, 5.5], [0, 4.86, 0], materials.dark);
  addBox(group, `${name}-entry-canopy`, [3.2, 0.16, 0.78], [0, 1.25, -2.95], materials.cyan);
  addWindowBands(group, name, 6.8, 5, 1.45, -2.58, materials.cyan);
  addBox(group, `${name}-roof-solar-left`, [2.2, 0.06, 1.2], [-2.0, 5.08, 0.65], materials.solar);
  addBox(group, `${name}-roof-solar-right`, [2.2, 0.06, 1.2], [1.1, 5.1, 0.65], materials.solar);
  parent.add(group);
  return group;
}

function addFactoryModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 12, 8.4, materials.green);
  addBox(group, `${name}-generator-hall`, [9.4, 4.7, 5.8], [-0.8, 2.65, 0], materials.base);
  addBox(group, `${name}-dark-roof`, [10.1, 0.42, 6.25], [-0.8, 5.25, 0], materials.dark);
  addBox(group, `${name}-control-bay-glow`, [4.5, 0.9, 0.08], [-0.8, 2.45, -2.94], materials.green);
  for (let i = 0; i < 4; i += 1) {
    addCylinder(group, `${name}-roof-stack-${i + 1}`, 0.24, 0.32, 1.4, [-3.8 + i * 1.85, 5.95, 1.55], materials.dark, 24);
    addBox(group, `${name}-stack-status-${i + 1}`, [0.44, 0.045, 0.44], [-3.8 + i * 1.85, 6.7, 1.55], materials.green);
  }
  addVehicle(group, `${name}-service-truck`, [4.55, 0.18, -2.55], materials.base);
  parent.add(group);
  return group;
}

function addTowerModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 8, 8, materials.cyan);
  addCylinder(group, `${name}-tower-core`, 1.75, 2.3, 8.4, [0, 4.4, 0], materials.glass, 56);
  addTorus(group, `${name}-mid-command-ring`, 2.42, 0.045, [0, 4.25, 0], materials.cyan, 96);
  addTorus(group, `${name}-roof-command-ring`, 1.82, 0.045, [0, 8.65, 0], materials.gold, 96);
  addCone(group, `${name}-beacon-cap`, 0.55, 1.0, [0, 9.42, 0], materials.cyan, 28);
  addBox(group, `${name}-side-equipment-pod`, [2.15, 1.25, 1.7], [2.35, 1.1, -1.0], materials.base);
  parent.add(group);
  return group;
}

function addOutpostModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 9.5, 6.8, materials.gold);
  addBox(group, `${name}-ready-room`, [5.2, 2.75, 3.6], [-1.45, 1.6, -0.45], materials.base);
  addBox(group, `${name}-dispatch-window`, [2.7, 0.62, 0.08], [-1.45, 1.72, -2.3], materials.gold);
  addBox(group, `${name}-vehicle-bay-canopy`, [3.4, 0.18, 2.35], [2.8, 2.35, 1.3], materials.dark);
  addVehicle(group, `${name}-field-rover`, [2.85, 0.18, 1.3], materials.gold);
  addCylinder(group, `${name}-radio-mast`, 0.045, 0.07, 4.4, [-4.0, 2.45, 1.95], materials.dark, 10);
  addBox(group, `${name}-radio-crossbar`, [1.15, 0.04, 0.04], [-4.0, 4.55, 1.95], materials.gold);
  addDrone(group, `${name}-standby-drone`, [-3.35, 2.1, -1.95]);
  parent.add(group);
  return group;
}

function addControlModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 10.5, 8, materials.cyan);
  addBox(group, `${name}-command-block`, [7.6, 4.8, 5.6], [0, 2.7, 0], materials.glass);
  addBox(group, `${name}-dark-roof-deck`, [8.3, 0.36, 6.1], [0, 5.35, 0], materials.dark);
  addBox(group, `${name}-tactical-wall`, [5.4, 1.2, 0.08], [0, 2.75, -2.86], materials.cyan);
  addTorus(group, `${name}-decision-ring`, 3.25, 0.04, [0, 5.65, 0], materials.cyan, 96);
  addBox(group, `${name}-side-model-room`, [2.2, 2.8, 3.4], [3.8, 1.8, 0.55], materials.base);
  addWindowBands(group, name, 6.0, 4, 1.45, -2.9, materials.cyan);
  parent.add(group);
  return group;
}

function addStorageModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 12, 8.5, materials.green);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      addBox(group, `${name}-battery-container-${row + 1}-${col + 1}`, [0.84, 1.65, 0.9], [-4.4 + col * 1.25, 1.02, -1.25 + row * 1.25], materials.base);
      addBox(group, `${name}-battery-light-${row + 1}-${col + 1}`, [0.58, 0.045, 0.08], [-4.4 + col * 1.25, 1.88, -1.72 + row * 1.25], materials.green);
    }
  }
  addBox(group, `${name}-microgrid-control-room`, [3.2, 2.6, 2.65], [3.65, 1.55, 2.35], materials.glass);
  addBox(group, `${name}-control-room-roof`, [3.55, 0.26, 2.95], [3.65, 3.0, 2.35], materials.dark);
  parent.add(group);
  return group;
}

function addSolarModule(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addBuildingBase(group, name, 13, 9, materials.gold);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const panel = addBox(group, `${name}-panel-${row + 1}-${col + 1}`, [1.18, 0.055, 0.58], [-4.2 + col * 1.4, 0.78, -2.45 + row * 0.84], materials.solar);
      panel.rotation.x = -0.33;
    }
  }
  addBox(group, `${name}-inverter-control-building`, [3.6, 2.35, 2.55], [3.65, 1.42, 2.55], materials.base);
  addBox(group, `${name}-inverter-status-wall`, [2.4, 0.62, 0.08], [3.65, 1.52, 1.25], materials.gold);
  addCylinder(group, `${name}-met-mast`, 0.04, 0.06, 4.2, [-5.45, 2.38, 3.1], materials.dark, 10);
  addBox(group, `${name}-met-mast-crossbar`, [1.05, 0.04, 0.04], [-5.45, 4.4, 3.1], materials.gold);
  parent.add(group);
  return group;
}

function addInteriorShell(group, name, accent = materials.cyan) {
  addBox(group, `${name}-raised-interior-floor`, [16.4, 0.12, 10.2], [0, 0.06, 0], materials.dark);
  addBox(group, `${name}-front-wayfinding-rail`, [13.8, 0.045, 0.08], [0, 0.17, -4.75], accent);
  addBox(group, `${name}-rear-wayfinding-rail`, [13.8, 0.045, 0.08], [0, 0.17, 4.75], accent);
  addBox(group, `${name}-left-wayfinding-rail`, [0.08, 0.045, 8.4], [-7.6, 0.18, 0], accent);
  addBox(group, `${name}-right-wayfinding-rail`, [0.08, 0.045, 8.4], [7.6, 0.18, 0], accent);
  addBox(group, `${name}-rear-glass-wall`, [15.6, 2.65, 0.12], [0, 1.45, 5.05], materials.glass);
  addBox(group, `${name}-left-wall-frame`, [0.14, 2.5, 9.7], [-8.25, 1.36, 0], materials.base);
  addBox(group, `${name}-right-wall-frame`, [0.14, 2.5, 9.7], [8.25, 1.36, 0], materials.base);
  addBox(group, `${name}-ceiling-spine`, [15.2, 0.12, 0.2], [0, 3.25, 0], materials.dark);
  for (let i = 0; i < 5; i += 1) {
    addBox(group, `${name}-linear-light-${i + 1}`, [1.45, 0.05, 0.34], [-5.9 + i * 2.95, 3.18, -3.9], accent);
    addBox(group, `${name}-status-floor-tile-${i + 1}`, [1.5, 0.035, 0.28], [-5.9 + i * 2.95, 0.19, 3.95], accent);
  }
}

function addInteriorExitAndSchedule(group, name, accent = materials.gold) {
  addBox(group, `${name}-exit-door-frame`, [2.75, 2.0, 0.16], [0, 1.1, -5.1], materials.dark);
  addBox(group, `${name}-exit-light`, [2.1, 0.08, 0.08], [0, 2.2, -4.98], accent);
  addBox(group, `${name}-agent-rest-pod`, [2.7, 0.42, 1.2], [5.8, 0.36, 3.25], materials.base);
  addBox(group, `${name}-rest-pod-glow`, [2.15, 0.06, 0.72], [5.8, 0.6, 3.25], accent);
}

function addInteriorScreenWall(group, name, count = 4, accent = materials.cyan) {
  addBox(group, `${name}-screen-wall-backplane`, [12.8, 1.74, 0.1], [0, 1.9, 4.88], materials.dark);
  for (let i = 0; i < count; i += 1) {
    addBox(group, `${name}-main-display-${i + 1}`, [2.42, 1.08, 0.07], [-4.8 + i * 3.2, 1.94, 4.78], accent);
    addBox(group, `${name}-display-status-rail-${i + 1}`, [1.64, 0.045, 0.08], [-4.8 + i * 3.2, 2.6, 4.72], materials.gold);
  }
}

function addWorkstationCluster(group, name, rows = 2, columns = 4, accent = materials.cyan) {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = -5.2 + col * 3.45;
      const z = row === 0 ? -1.3 : 1.45;
      addBox(group, `${name}-desk-${row + 1}-${col + 1}`, [1.75, 0.16, 0.82], [x, 0.58, z], materials.base);
      addBox(group, `${name}-monitor-${row + 1}-${col + 1}`, [1.05, 0.62, 0.06], [x, 1.02, z + 0.46], accent);
      addBox(group, `${name}-chair-${row + 1}-${col + 1}`, [0.64, 0.54, 0.58], [x, 0.33, z - 0.76], materials.dark);
    }
  }
}

function addDecisionTable(group, name, accent = materials.cyan) {
  addCylinder(group, `${name}-decision-table-base`, 1.58, 1.9, 0.2, [0, 0.42, -0.05], materials.base, 56);
  addCylinder(group, `${name}-hologram-map-table`, 1.35, 1.48, 0.07, [0, 0.58, -0.05], accent, 56);
  addTorus(group, `${name}-hologram-data-ring`, 1.78, 0.03, [0, 0.68, -0.05], accent, 96);
  for (let i = 0; i < 3; i += 1) {
    addBox(group, `${name}-table-slate-${i + 1}`, [0.55, 0.04, 1.75], [-1.1 + i * 1.1, 0.74, -0.05], materials.glass);
  }
}

function addControlRoomInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.cyan);
  addInteriorScreenWall(group, name, 5, materials.cyan);
  addDecisionTable(group, name, materials.cyan);
  addWorkstationCluster(group, name, 2, 4, materials.cyan);
  for (let i = 0; i < 4; i += 1) {
    addCylinder(group, `${name}-status-pillar-${i + 1}`, 0.14, 0.2, 1.55, [-6.6 + i * 4.4, 0.98, -3.25], materials.gold, 20);
    addTorus(group, `${name}-pillar-ring-${i + 1}`, 0.42, 0.018, [-6.6 + i * 4.4, 1.78, -3.25], materials.cyan, 42);
  }
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addOfficeFloorInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.cyan);
  addInteriorScreenWall(group, name, 3, materials.cyan);
  addWorkstationCluster(group, name, 3, 4, materials.cyan);
  addBox(group, `${name}-quiet-meeting-room`, [3.2, 1.75, 2.2], [5.0, 1.05, -2.7], materials.glass);
  addBox(group, `${name}-meeting-table`, [2.2, 0.18, 1.0], [5.0, 0.58, -2.7], materials.base);
  addBox(group, `${name}-floor-kpi-wall`, [3.2, 1.2, 0.08], [-5.6, 1.7, 4.68], materials.gold);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addFactoryBayInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.green);
  addInteriorScreenWall(group, name, 4, materials.green);
  addBox(group, `${name}-overhead-busbar`, [13.2, 0.09, 0.09], [0, 2.65, 0.35], materials.green);
  for (let i = 0; i < 5; i += 1) {
    const x = -5.4 + i * 2.7;
    addBox(group, `${name}-machine-cell-${i + 1}`, [1.45, 1.25, 1.42], [x, 0.78, -1.2], materials.dark);
    addCylinder(group, `${name}-machine-cap-${i + 1}`, 0.34, 0.38, 0.42, [x, 1.62, -1.2], materials.green, 24);
    addBox(group, `${name}-diagnostic-panel-${i + 1}`, [0.9, 0.52, 0.07], [x, 1.08, -1.94], materials.green);
  }
  addVehicle(group, `${name}-maintenance-cart`, [5.6, 0.16, 2.25], materials.gold);
  addBox(group, `${name}-operator-desk`, [2.8, 0.16, 0.85], [-5.4, 0.58, 2.6], materials.base);
  addBox(group, `${name}-operator-screen`, [1.75, 0.68, 0.07], [-5.4, 1.04, 2.15], materials.green);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addOutpostDispatchInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.gold);
  addInteriorScreenWall(group, name, 3, materials.gold);
  addDecisionTable(group, name, materials.gold);
  addBox(group, `${name}-dispatch-counter`, [4.8, 0.28, 1.05], [-3.0, 0.54, -1.4], materials.base);
  addBox(group, `${name}-dispatch-status-map`, [3.4, 0.72, 0.07], [-3.0, 1.16, -1.98], materials.gold);
  addVehicle(group, `${name}-mini-rover-bay`, [4.7, 0.16, -1.75], materials.gold);
  addTorus(group, `${name}-drone-ready-ring`, 0.78, 0.034, [4.8, 0.22, 1.65], materials.cyan, 56);
  addDrone(group, `${name}-standby-drone`, [4.8, 1.26, 1.65]);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addTowerFloorInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.cyan);
  addInteriorScreenWall(group, name, 4, materials.cyan);
  addDecisionTable(group, name, materials.cyan);
  addCylinder(group, `${name}-central-model-core`, 1.05, 1.22, 2.15, [0, 1.24, -1.4], materials.glass, 48);
  addTorus(group, `${name}-model-core-ring`, 1.45, 0.04, [0, 2.34, -1.4], materials.cyan, 96);
  addTorus(group, `${name}-gold-inference-ring`, 2.15, 0.035, [0, 2.72, -1.4], materials.gold, 112);
  addWorkstationCluster(group, name, 1, 4, materials.cyan);
  addBox(group, `${name}-observation-bench`, [5.6, 0.22, 0.9], [0, 0.54, 3.0], materials.base);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addStorageRoomInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.green);
  addInteriorScreenWall(group, name, 3, materials.green);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = -5.3 + col * 1.58;
      const z = row === 0 ? -1.75 : 1.1;
      addBox(group, `${name}-battery-rack-${row + 1}-${col + 1}`, [0.92, 1.55, 0.78], [x, 0.9, z], materials.base);
      addBox(group, `${name}-battery-light-${row + 1}-${col + 1}`, [0.62, 0.045, 0.08], [x, 1.73, z - 0.42], materials.green);
    }
  }
  addBox(group, `${name}-thermal-console`, [2.8, 0.2, 0.95], [5.0, 0.58, -3.05], materials.dark);
  addBox(group, `${name}-thermal-screen`, [2.0, 0.68, 0.07], [5.0, 1.05, -3.55], materials.green);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addHqFloorInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.cyan);
  addInteriorScreenWall(group, name, 5, materials.cyan);
  addDecisionTable(group, name, materials.cyan);
  addWorkstationCluster(group, name, 2, 3, materials.cyan);
  addBox(group, `${name}-executive-briefing-table`, [4.8, 0.2, 1.24], [3.7, 0.56, 2.5], materials.base);
  addBox(group, `${name}-briefing-map`, [3.8, 0.055, 0.82], [3.7, 0.72, 2.5], materials.gold);
  addCylinder(group, `${name}-hq-identity-core`, 0.72, 0.9, 2.0, [-4.7, 1.18, 2.3], materials.glass, 48);
  addTorus(group, `${name}-hq-identity-ring`, 1.16, 0.035, [-4.7, 2.28, 2.3], materials.gold, 76);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function addSolarControlRoomInterior(parent, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  addInteriorShell(group, name, materials.gold);
  addInteriorScreenWall(group, name, 4, materials.gold);
  addDecisionTable(group, name, materials.gold);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const panel = addBox(group, `${name}-pv-diagnostic-table-${row + 1}-${col + 1}`, [1.0, 0.045, 0.48], [-4.8 + col * 1.28, 0.6, -2.3 + row * 0.72], materials.solar);
      panel.rotation.x = -0.22;
    }
  }
  addBox(group, `${name}-inverter-rack`, [2.3, 1.55, 0.86], [4.8, 0.98, -1.65], materials.base);
  addBox(group, `${name}-inverter-diagnostic-panel`, [1.6, 0.62, 0.07], [4.8, 1.18, -2.1], materials.gold);
  addInteriorExitAndSchedule(group, name, materials.gold);
  parent.add(group);
  return group;
}

function buildBigWorldPilot() {
  const scene = new THREE.Scene();
  scene.name = 'rj-big-world-map-pilot-scene';
  const root = new THREE.Group();
  root.name = 'rj-big-world-map-pilot';
  scene.add(root);

  addCylinder(root, 'operations-island-base', 22.5, 24.5, 0.28, [0, 0.14, 0], materials.land, 128);
  addCylinder(root, 'glass-map-table', 25.4, 26.0, 0.08, [0, 0.42, 0], materials.glass, 128);
  addBox(root, 'east-west-service-road', [38, 0.08, 0.56], [0, 0.56, 0], materials.asphalt);
  addBox(root, 'north-south-service-road', [0.56, 0.08, 28], [0, 0.57, 0], materials.asphalt);
  addBox(root, 'north-command-corridor', [18.5, 0.065, 0.26], [0, 0.6, 11.6], materials.cyan);
  addBox(root, 'south-energy-corridor', [18.5, 0.065, 0.26], [0, 0.6, -11.6], materials.gold);
  addBox(root, 'west-dispatch-corridor', [0.26, 0.065, 16.4], [-12.5, 0.6, 0], materials.cyan);
  addBox(root, 'east-generation-corridor', [0.26, 0.065, 16.4], [12.5, 0.6, 0], materials.gold);
  addBox(root, 'outer-north-service-corridor', [34.5, 0.055, 0.18], [0, 0.62, 19.2], materials.cyan);
  addBox(root, 'outer-south-service-corridor', [34.5, 0.055, 0.18], [0, 0.62, -19.2], materials.gold);
  addBox(root, 'outer-west-service-corridor', [0.18, 0.055, 24.0], [-19.2, 0.62, 0], materials.cyan);
  addBox(root, 'outer-east-service-corridor', [0.18, 0.055, 24.0], [19.2, 0.62, 0], materials.gold);
  addHqTower(root, 'central-hq-landmark', [0, 0.48, 0]);

  const areas = [
    ['solar-operations-landmark', [18, 0.48, -9], materials.gold],
    ['power-factory-landmark', [-18, 0.48, -9], materials.green],
    ['field-service-landmark', [18, 0.48, 11], materials.gold],
    ['ai-tower-landmark', [-17, 0.48, 11], materials.cyan],
    ['storage-microgrid-landmark', [0, 0.48, -19], materials.green]
  ];

  for (const [index, [name, position, accent]] of areas.entries()) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(...position);
    addBox(group, `${name}-pad`, [7.1, 0.28, 5.6], [0, 0.14, 0], materials.base);
    addBox(group, `${name}-front-status-rail`, [6.5, 0.055, 0.12], [0, 0.36, -2.9], accent);
    addBox(group, `${name}-side-status-rail`, [0.12, 0.055, 5.1], [3.55, 0.36, 0], accent);
    if (name.includes('solar')) {
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const panel = addBox(group, `${name}-solar-${row + 1}-${col + 1}`, [0.95, 0.05, 0.46], [-1.8 + col * 1.2, 0.72, -0.75 + row * 0.58], materials.solar);
          panel.rotation.x = -0.28;
        }
      }
    } else if (name.includes('power')) {
      addBox(group, `${name}-generator-hall`, [3.0, 1.5, 1.9], [-0.7, 1.08, 0.1], materials.base);
      for (let i = 0; i < 3; i += 1) addCylinder(group, `${name}-transformer-${i + 1}`, 0.28, 0.28, 1.0, [1.4 + i * 0.72, 0.75, -0.8], materials.dark, 20);
    } else if (name.includes('ai')) {
      addCylinder(group, `${name}-tower`, 0.82, 1.05, 4.2, [0, 2.25, 0], materials.glass, 42);
      addTorus(group, `${name}-crown-ring`, 1.3, 0.045, [0, 4.35, 0], accent, 72);
    } else if (name.includes('storage')) {
      for (let i = 0; i < 7; i += 1) addBox(group, `${name}-battery-${i + 1}`, [0.42, 0.82, 0.5], [-2.0 + i * 0.62, 0.62, -0.35], materials.base);
      addBox(group, `${name}-microgrid-shelter`, [2.0, 1.35, 1.4], [1.4, 0.92, 1.05], materials.glass);
    } else {
      addBox(group, `${name}-outpost`, [2.5, 1.25, 1.7], [-0.2, 0.9, 0], materials.base);
      addVehicle(group, `${name}-service-rover`, [1.85, 0.2, 0.75], materials.gold);
      addCylinder(group, `${name}-radio-mast`, 0.04, 0.07, 3.3, [-1.65, 1.82, -0.7], materials.dark, 10);
    }
    root.add(group);
  }

  addDrone(root, 'world-inspection-drone', [-7, 5.7, 9]);
  addVehicle(root, 'world-service-shuttle', [7, 0.56, -14], materials.base);
  return scene;
}

function buildHqTowerPilot() {
  const scene = new THREE.Scene();
  scene.name = 'rj-hq-command-tower-pilot-scene';
  addHqTower(scene, 'rj-hq-command-tower', [0, 0, 0]);
  return scene;
}

function buildInspectionServiceKitPilot() {
  const scene = new THREE.Scene();
  scene.name = 'rj-inspection-service-kit-pilot-scene';
  const root = new THREE.Group();
  root.name = 'rj-inspection-service-kit';
  scene.add(root);
  addBox(root, 'service-pad', [6.8, 0.12, 4.2], [0, 0.06, 0], materials.asphalt);
  addTorus(root, 'drone-launch-ring', 1.35, 0.04, [-2.1, 0.18, 0], materials.cyan, 64);
  addDrone(root, 'inspection-drone', [-2.1, 1.25, 0]);
  addVehicle(root, 'maintenance-service-truck', [1.4, 0.1, 0.3], materials.gold);
  addBox(root, 'tool-cart-body', [0.9, 0.62, 0.58], [2.95, 0.42, -1.2], materials.base);
  addBox(root, 'tool-cart-status-light', [0.62, 0.04, 0.12], [2.95, 0.78, -1.5], materials.green);
  addCylinder(root, 'field-radio-mast', 0.04, 0.07, 3.6, [-3.2, 1.86, -1.4], materials.dark, 10);
  addBox(root, 'field-radio-crossbar', [1.1, 0.045, 0.045], [-3.2, 3.62, -1.4], materials.cyan);
  return scene;
}

function buildLandmarkPilot(sceneName, builder, groupName) {
  const scene = new THREE.Scene();
  scene.name = `${sceneName}-pilot-scene`;
  builder(scene, groupName, [0, 0, 0]);
  return scene;
}

function buildBuildingModule(sceneName, builder, groupName) {
  const scene = new THREE.Scene();
  scene.name = `${sceneName}-module-scene`;
  builder(scene, groupName, [0, 0, 0]);
  return scene;
}

function buildAgentProp(sceneName, builder, groupName) {
  const scene = new THREE.Scene();
  scene.name = `${sceneName}-prop-scene`;
  builder(scene, groupName, [0, 0, 0]);
  return scene;
}

function buildInteriorModule(sceneName, builder, groupName) {
  const scene = new THREE.Scene();
  scene.name = `${sceneName}-interior-scene`;
  builder(scene, groupName, [0, 0, 0]);
  return scene;
}

async function exportGlb(scene, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(scene, { binary: true, trs: false, onlyVisible: true });
  writeFileSync(outputPath, Buffer.from(result));
}

const outputs = [
  ['big-map/rj-big-world-map.glb', buildBigWorldPilot()],
  ['building/hq-command-tower.glb', buildHqTowerPilot()],
  ['infrastructure/inspection-service-kit.glb', buildInspectionServiceKitPilot()],
  ['landmark/solar-operations-landmark.glb', buildLandmarkPilot('rj-solar-operations-landmark', addSolarOperationsLandmark, 'rj-solar-operations-landmark')],
  ['landmark/power-factory-landmark.glb', buildLandmarkPilot('rj-power-factory-landmark', addPowerFactoryLandmark, 'rj-power-factory-landmark')],
  ['landmark/field-service-landmark.glb', buildLandmarkPilot('rj-field-service-landmark', addFieldServiceLandmark, 'rj-field-service-landmark')],
  ['landmark/ai-tower-landmark.glb', buildLandmarkPilot('rj-ai-tower-landmark', addAiTowerLandmark, 'rj-ai-tower-landmark')],
  ['landmark/storage-microgrid-landmark.glb', buildLandmarkPilot('rj-storage-microgrid-landmark', addStorageMicrogridLandmark, 'rj-storage-microgrid-landmark')],
  ['building/office-module.glb', buildBuildingModule('rj-office-building', addOfficeModule, 'rj-office-building-module')],
  ['building/factory-module.glb', buildBuildingModule('rj-factory-building', addFactoryModule, 'rj-factory-building-module')],
  ['building/tower-module.glb', buildBuildingModule('rj-tower-building', addTowerModule, 'rj-tower-building-module')],
  ['building/outpost-module.glb', buildBuildingModule('rj-outpost-building', addOutpostModule, 'rj-outpost-building-module')],
  ['building/control-module.glb', buildBuildingModule('rj-control-building', addControlModule, 'rj-control-building-module')],
  ['building/storage-module.glb', buildBuildingModule('rj-storage-building', addStorageModule, 'rj-storage-building-module')],
  ['building/solar-module.glb', buildBuildingModule('rj-solar-building', addSolarModule, 'rj-solar-building-module')],
  ['interior/hq-floor.glb', buildInteriorModule('rj-hq-floor', addHqFloorInterior, 'rj-hq-floor-interior')],
  ['interior/control-room.glb', buildInteriorModule('rj-control-room', addControlRoomInterior, 'rj-control-room-interior')],
  ['interior/office-floor.glb', buildInteriorModule('rj-office-floor', addOfficeFloorInterior, 'rj-office-floor-interior')],
  ['interior/factory-bay.glb', buildInteriorModule('rj-factory-bay', addFactoryBayInterior, 'rj-factory-bay-interior')],
  ['interior/outpost-dispatch.glb', buildInteriorModule('rj-outpost-dispatch', addOutpostDispatchInterior, 'rj-outpost-dispatch-interior')],
  ['interior/tower-floor.glb', buildInteriorModule('rj-tower-floor', addTowerFloorInterior, 'rj-tower-floor-interior')],
  ['interior/storage-room.glb', buildInteriorModule('rj-storage-room', addStorageRoomInterior, 'rj-storage-room-interior')],
  ['interior/solar-control-room.glb', buildInteriorModule('rj-solar-control-room', addSolarControlRoomInterior, 'rj-solar-control-room-interior')],
  ['agent-props/ai-agent.glb', buildAgentProp('rj-ai-agent-character', addAIAgentCharacter, 'rj-ai-agent-character')],
  ['agent-props/operator-human.glb', buildAgentProp('rj-human-operator-character', addHumanOperatorCharacter, 'rj-human-operator-character')],
  ['agent-props/inspection-drone.glb', buildAgentProp('rj-inspection-drone-prop', addDrone, 'rj-inspection-drone-prop')]
];

for (const [relativePath, scene] of outputs) {
  const outputPath = resolve(glbRoot, relativePath);
  await exportGlb(scene, outputPath);
  console.log(`wrote ${outputPath}`);
}
