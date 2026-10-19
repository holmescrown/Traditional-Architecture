import * as THREE from 'three';

export function createProceduralWoodTexture(baseHex, grainHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = grainHex;
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 1 + Math.random() * 2.5;
    const h = 18 + Math.random() * 65;
    ctx.globalAlpha = 0.08 + Math.random() * 0.14;
    ctx.fillRect(x, y, w, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createRoofTileTexture(baseHex, ridgeHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // 筒瓦瓦陇纵向条纹
  for (let x = 0; x < 256; x += 8) {
    ctx.fillStyle = ridgeHex;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x, 0, 3, 256);
  }
  // 瓦当横向叠瓦暗影
  for (let y = 0; y < 256; y += 16) {
    ctx.fillStyle = '#181412';
    ctx.globalAlpha = 0.12;
    ctx.fillRect(0, y, 256, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 3);
  return tex;
}

export function createMaterials(palettes) {
  const palette = palettes.liao;
  const woodTex = createProceduralWoodTexture('#FFFFFF', '#998877');
  const tileTex = createRoofTileTexture('#FFFFFF', '#777777');

  return {
    pillar: new THREE.MeshStandardMaterial({ color: palette.pillar, map: woodTex, roughness: 0.78, metalness: 0.06 }),
    dougong: new THREE.MeshStandardMaterial({ color: palette.dougong, map: woodTex, roughness: 0.72, metalness: 0.08 }),
    wall: new THREE.MeshStandardMaterial({ color: palette.wall, map: woodTex, roughness: 0.82, metalness: 0.04 }),
    mezzanine: new THREE.MeshStandardMaterial({ color: palette.mezzanine, roughness: 0.7, metalness: 0.08 }),
    roof: new THREE.MeshStandardMaterial({ color: palette.roof, map: tileTex, roughness: 0.65, metalness: 0.15 }),
    ridge: new THREE.MeshStandardMaterial({ color: palette.ridge, roughness: 0.6, metalness: 0.2 }),
    stone: new THREE.MeshStandardMaterial({ color: palette.stone, roughness: 0.9, metalness: 0.02 }),
    bronze: new THREE.MeshStandardMaterial({ color: palette.bronze, roughness: 0.42, metalness: 0.68 }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xDFD5C5, roughness: 0.88, metalness: 0.02 }),
    edge: new THREE.LineBasicMaterial({ color: palette.edgeLine, transparent: true, opacity: 0.35 })
  };
}
