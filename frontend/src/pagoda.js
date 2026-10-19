import * as THREE from 'three';
import { createMaterials } from './materials.js';

export function buildPagoda({ scene, config }) {
  const materials = createMaterials(config.palettes);
  const layout = config.layout;

  // ==================== 组装应县木塔多层可分解结构 ====================
  const pagodaMasterGroup = new THREE.Group();
  scene.add(pagodaMasterGroup);

  // 存储可分层爆炸的层级组 (Explodable Groups)
  const explodableParts = [];
  const targets = {};

  function registerExplodable(group, baseY, explodedY, label) {
    group.position.y = baseY;
    group.userData = { baseY, explodedY, label };
    explodableParts.push(group);
    pagodaMasterGroup.add(group);
  }

  // 辅助函数：创建带古建测绘墨线描边的 Mesh
  function createArchMesh(geometry, material, castShadow = true, receiveShadow = true, addInkEdges = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    if (addInkEdges) {
      const edgesGeo = new THREE.EdgesGeometry(geometry, 24);
      const line = new THREE.LineSegments(edgesGeo, materials.edge);
      mesh.add(line);
    }
    return mesh;
  }

  // 辅助函数：构建八角飞檐折坡屋顶（还原中国古建“反宇”曲线屋面与八角起翘戗脊）
  function createOctagonalCurvedEaveRoof(innerRadius, outerRadius, height, layers = 3) {
    const roofGroup = new THREE.Group();
    const octRotation = Math.PI / 8; // 使八角平面正面朝向 Z 轴

    for (let i = 0; i < layers; i++) {
      const t0 = i / layers;
      const t1 = (i + 1) / layers;
      // 抛物线反宇曲率：上陡下缓，檐口微翘
      const rTop = innerRadius + (outerRadius - innerRadius) * Math.pow(t0, 0.72);
      const rBot = innerRadius + (outerRadius - innerRadius) * Math.pow(t1, 0.72);
      const yTop = height * Math.pow(1 - t0, 1.38);
      const yBot = height * Math.pow(1 - t1, 1.38);
      const segH = Math.max(0.05, yTop - yBot);

      const segGeo = new THREE.CylinderGeometry(rTop, rBot, segH, 8, 1, false);
      segGeo.rotateY(octRotation);
      const segMesh = createArchMesh(segGeo, materials.roof, true, true, true);
      segMesh.position.y = yBot + segH / 2;
      roofGroup.add(segMesh);
    }

    // 檐口厚唇封边与飞椽连檐
    const eaveRimGeo = new THREE.CylinderGeometry(outerRadius, outerRadius * 0.985, 0.24, 8);
    eaveRimGeo.rotateY(octRotation);
    const eaveRim = createArchMesh(eaveRimGeo, materials.dougong, true, true, true);
    eaveRim.position.y = 0.02;
    roofGroup.add(eaveRim);

    // 八条角脊（戗脊）与翼角起翘及角梁风铎（铁马铃）
    for (let k = 0; k < 8; k++) {
      const angle = k * (Math.PI / 4) + octRotation;
      const ridgeLen = Math.hypot(outerRadius - innerRadius * 0.9, height);
      const pitchAngle = Math.atan2(height, outerRadius - innerRadius * 0.9);

      const ridgeHolder = new THREE.Group();
      ridgeHolder.rotation.y = angle;

      // 戗脊条
      const ridgeGeo = new THREE.BoxGeometry(0.18, 0.18, ridgeLen);
      const ridgeMesh = createArchMesh(ridgeGeo, materials.ridge, true, false, false);
      const midR = (innerRadius * 0.92 + outerRadius) / 2;
      const midY = height * 0.44;
      ridgeMesh.position.set(0, midY, midR);
      ridgeMesh.rotation.x = pitchAngle * 0.92;
      ridgeHolder.add(ridgeMesh);

      // 翼角微翘与走兽仙人装饰块
      const cornerTipGeo = new THREE.BoxGeometry(0.22, 0.32, 0.55);
      const cornerTip = createArchMesh(cornerTipGeo, materials.ridge, false, false, false);
      cornerTip.position.set(0, 0.22, outerRadius * 0.99);
      cornerTip.rotation.x = -0.35;
      ridgeHolder.add(cornerTip);

      // 檐角悬挂风铎（铁铃）
      const bellGeo = new THREE.ConeGeometry(0.11, 0.28, 6);
      const bell = createArchMesh(bellGeo, materials.bronze, false, false, false);
      bell.position.set(0, -0.26, outerRadius * 0.98);
      ridgeHolder.add(bell);

      roofGroup.add(ridgeHolder);
    }

    return roofGroup;
  }

  // 辅助函数：构建单朵多层出跳斗拱簇 (DouGong Bracket Cluster)
  function createDouGongCluster(scale = 1) {
    const dg = new THREE.Group();
    // 栌斗 (Base Cap Block)
    const ludou = createArchMesh(new THREE.BoxGeometry(0.42, 0.22, 0.42), materials.dougong, false, false, false);
    ludou.position.y = 0.11;
    dg.add(ludou);

    // 华拱第一跳与横拱
    const gong1 = createArchMesh(new THREE.BoxGeometry(0.95, 0.22, 0.85), materials.dougong, false, false, false);
    gong1.position.y = 0.32;
    dg.add(gong1);

    // 华拱第二跳与昂嘴斜挑 (Ang cantilever beak)
    const gong2 = createArchMesh(new THREE.BoxGeometry(1.35, 0.24, 1.32), materials.dougong, false, false, false);
    gong2.position.y = 0.55;
    dg.add(gong2);

    // 下昂斜挑尖嘴
    const angGeo = new THREE.BoxGeometry(0.18, 0.16, 1.65);
    const ang = createArchMesh(angGeo, materials.mezzanine, false, false, false);
    ang.position.set(0, 0.42, 0.25);
    ang.rotation.x = 0.28;
    dg.add(ang);

    dg.scale.setScalar(scale);
    return dg;
  }

  const octRot = Math.PI / 8;

  // --- [部件 0]：地面测绘坐标圆盘与八角须弥石台基 (Base Platform) ---
  const baseGroup = new THREE.Group();
  // 测绘底座刻线圆环
  const groundRingGeo = new THREE.RingGeometry(13.2, 13.4, 64);
  groundRingGeo.rotateX(-Math.PI / 2);
  const groundRing = new THREE.Mesh(groundRingGeo, new THREE.MeshBasicMaterial({ color: 0x5A4E43, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
  groundRing.position.y = 0.02;
  baseGroup.add(groundRing);

  // 下层方形叠加八角大台基 (高 2.2)
  const lowerSquarePlatform = createArchMesh(new THREE.BoxGeometry(22.5, 1.0, 22.5), materials.stone);
  lowerSquarePlatform.position.y = 0.5;
  baseGroup.add(lowerSquarePlatform);

  // 上层八角须弥座 (半径 11.4)
  const upperOctPlatformGeo = new THREE.CylinderGeometry(11.2, 11.6, 1.2, 8);
  upperOctPlatformGeo.rotateY(octRot);
  const upperOctPlatform = createArchMesh(upperOctPlatformGeo, materials.stone);
  upperOctPlatform.position.y = 1.6;
  baseGroup.add(upperOctPlatform);

  // 四面踏道台阶 (Steps on 4 cardinal directions)
  for (let s = 0; s < 4; s++) {
    const stepHolder = new THREE.Group();
    stepHolder.rotation.y = s * (Math.PI / 2);
    const stepMesh = createArchMesh(new THREE.BoxGeometry(3.6, 1.15, 2.2), materials.stone);
    stepMesh.position.set(0, 1.55, 11.1);
    stepHolder.add(stepMesh);
    baseGroup.add(stepHolder);
  }
  registerExplodable(baseGroup, layout.base.baseY, layout.base.explodedY, layout.base.label);
  targets.base = baseGroup;

  // --- [部件 1]：底层塔身 + 副阶周匝 (Tier 1 Core & Perimeter Veranda) ---
  const tier1Group = new THREE.Group();
  const t1Height = 4.6;
  const t1OuterR = 6.95; // 外槽半径
  const t1InnerR = 4.25; // 内槽半径
  const verandaR = 9.15; // 副阶檐柱半径

  // 内槽八角泥塑墙体与大佛核心筒
  const t1InnerCoreGeo = new THREE.CylinderGeometry(t1InnerR, t1InnerR, t1Height, 8);
  t1InnerCoreGeo.rotateY(octRot);
  const t1InnerCore = createArchMesh(t1InnerCoreGeo, materials.plaster);
  t1InnerCore.position.y = t1Height / 2;
  tier1Group.add(t1InnerCore);

  // 外槽八角木壁与门窗
  const t1OuterWallGeo = new THREE.CylinderGeometry(t1OuterR * 0.96, t1OuterR * 0.96, t1Height, 8);
  t1OuterWallGeo.rotateY(octRot);
  const t1OuterWall = createArchMesh(t1OuterWallGeo, materials.wall);
  t1OuterWall.position.y = t1Height / 2;
  tier1Group.add(t1OuterWall);

  // 八角外槽柱列、副阶檐柱列及门洞
  for (let k = 0; k < 8; k++) {
    const angle = k * (Math.PI / 4) + octRot;
    const faceAngle = k * (Math.PI / 4);

    // 外槽角柱
    const pOut = createArchMesh(new THREE.CylinderGeometry(0.24, 0.26, t1Height, 10), materials.pillar, true, true, false);
    pOut.position.set(Math.sin(angle) * t1OuterR, t1Height / 2, Math.cos(angle) * t1OuterR);
    tier1Group.add(pOut);

    // 副阶周匝外圈角柱与辅柱
    const pVeranda = createArchMesh(new THREE.CylinderGeometry(0.21, 0.23, 3.2, 10), materials.pillar, true, true, false);
    pVeranda.position.set(Math.sin(angle) * verandaR, 1.6, Math.cos(angle) * verandaR);
    tier1Group.add(pVeranda);

    // 副阶柱头斗拱
    const vDg = createDouGongCluster(0.72);
    vDg.position.set(Math.sin(angle) * verandaR, 3.1, Math.cos(angle) * verandaR);
    vDg.rotation.y = angle;
    tier1Group.add(vDg);

    // 底层主檐柱头与补间斗拱 (每面2朵补间+1角科)
    const mainDg = createDouGongCluster(0.9);
    mainDg.position.set(Math.sin(angle) * t1OuterR, t1Height - 0.55, Math.cos(angle) * t1OuterR);
    mainDg.rotation.y = angle;
    tier1Group.add(mainDg);

    const midDg = createDouGongCluster(0.85);
    const faceDist = t1OuterR * Math.cos(Math.PI / 8);
    midDg.position.set(Math.sin(faceAngle) * faceDist, t1Height - 0.55, Math.cos(faceAngle) * faceDist);
    midDg.rotation.y = faceAngle;
    tier1Group.add(midDg);
  }

  // 副阶周匝裙檐屋顶 (Veranda Skirt Roof)
  const verandaRoof = createOctagonalCurvedEaveRoof(t1OuterR * 0.97, 10.65, 1.45, 3);
  verandaRoof.position.y = 3.15;
  tier1Group.add(verandaRoof);

  // 一层上层主屋檐 (Tier 1 Main Upper Eave)
  const tier1MainRoof = createOctagonalCurvedEaveRoof(5.6, 9.75, 1.65, 3);
  tier1MainRoof.position.y = t1Height + 0.05;
  tier1Group.add(tier1MainRoof);

  registerExplodable(tier1Group, layout.tier1.baseY, layout.tier1.explodedY, layout.tier1.label);
  targets['tier-1'] = tier1Group;

  // --- 辅助函数：构建 二至五层 含【平座暗层】与【明层塔身】的标准楼阁层 ---
  config.tiers.forEach((cfg) => {
    // A. 暗层与平座勾栏组 (Hidden Mezzanine & Pingzuo Balcony)
    // 在爆炸模式下，暗层与明层分离，直观展现内部红色交叉斜撑桁架！
    const mezzGroup = new THREE.Group();
    const innerR = cfg.rCore * 0.62;

    // 暗层上下平栿梁环
    const bottomRingGeo = new THREE.CylinderGeometry(cfg.rCore, cfg.rCore, 0.22, 8);
    bottomRingGeo.rotateY(octRot);
    const bottomRing = createArchMesh(bottomRingGeo, materials.dougong);
    bottomRing.position.y = 0.11;
    mezzGroup.add(bottomRing);

    const topRingGeo = new THREE.CylinderGeometry(cfg.rCore * 1.03, cfg.rCore * 1.03, 0.24, 8);
    topRingGeo.rotateY(octRot);
    const topRing = createArchMesh(topRingGeo, materials.dougong);
    topRing.position.y = cfg.hMezz;
    mezzGroup.add(topRing);

    // 八面暗层内部：柱网 + 红色豪猪刺斜撑剪刀撑 (Diagonal Bracing Trusses)
    for (let k = 0; k < 8; k++) {
      const angle = k * (Math.PI / 4) + octRot;
      const faceAngle = k * (Math.PI / 4);

      // 暗层短柱
      const mCol = createArchMesh(new THREE.CylinderGeometry(0.18, 0.18, cfg.hMezz, 8), materials.pillar, false, false, false);
      mCol.position.set(Math.sin(angle) * cfg.rCore * 0.95, cfg.hMezz / 2, Math.cos(angle) * cfg.rCore * 0.95);
      mezzGroup.add(mCol);

      // 剪刀斜撑桁架 (X-Bracing along octagonal face & radial)
      const braceHolder = new THREE.Group();
      braceHolder.rotation.y = faceAngle;
      const faceDist = cfg.rCore * Math.cos(Math.PI / 8) * 0.92;
      const faceWidth = 2 * cfg.rCore * Math.sin(Math.PI / 8) * 0.85;
      const diagLen = Math.hypot(faceWidth, cfg.hMezz);
      const diagAngle = Math.atan2(cfg.hMezz, faceWidth);

      const brace1 = createArchMesh(new THREE.BoxGeometry(diagLen, 0.14, 0.14), materials.mezzanine, false, false, false);
      brace1.position.set(0, cfg.hMezz / 2, faceDist);
      brace1.rotation.z = diagAngle;
      braceHolder.add(brace1);

      const brace2 = createArchMesh(new THREE.BoxGeometry(diagLen, 0.14, 0.14), materials.mezzanine, false, false, false);
      brace2.position.set(0, cfg.hMezz / 2, faceDist);
      brace2.rotation.z = -diagAngle;
      braceHolder.add(brace2);

      // 径向内外槽斜撑
      const radialBrace = createArchMesh(new THREE.BoxGeometry(0.14, 0.14, cfg.rCore - innerR), materials.mezzanine, false, false, false);
      radialBrace.position.set(0, cfg.hMezz / 2, (cfg.rCore + innerR) * 0.45);
      radialBrace.rotation.x = 0.42;
      braceHolder.add(radialBrace);

      mezzGroup.add(braceHolder);

      // 平座斗拱
      const pzDg = createDouGongCluster(0.68);
      pzDg.position.set(Math.sin(angle) * cfg.rCore, cfg.hMezz * 0.55, Math.cos(angle) * cfg.rCore);
      pzDg.rotation.y = angle;
      mezzGroup.add(pzDg);
    }

    // 外圈平座游廊勾栏栏杆 (Balcony Railing)
    const railR = cfg.rCore * 1.1;
    const railGeo = new THREE.CylinderGeometry(railR, railR, 0.48, 8, 1, true);
    railGeo.rotateY(octRot);
    const railMesh = createArchMesh(railGeo, materials.pillar, true, true, true);
    railMesh.position.y = cfg.hMezz + 0.28;
    mezzGroup.add(railMesh);

    registerExplodable(mezzGroup, cfg.baseY, cfg.expMezzY, `${cfg.tierNum}层平座暗层`);
    targets[`tier-${cfg.tierNum}-mezz`] = mezzGroup;

    // B. 明层塔身 + 柱头斗拱 + 飞檐屋顶 (Visible Story & Roof)
    const bodyGroup = new THREE.Group();

    // 内槽佛坛核心筒
    const innerCoreGeo = new THREE.CylinderGeometry(innerR, innerR, cfg.hBody, 8);
    innerCoreGeo.rotateY(octRot);
    const innerCore = createArchMesh(innerCoreGeo, materials.plaster);
    innerCore.position.y = cfg.hBody / 2;
    bodyGroup.add(innerCore);

    // 外槽八角木构回廊格扇墙体
    const outerWallGeo = new THREE.CylinderGeometry(cfg.rCore * 0.94, cfg.rCore * 0.94, cfg.hBody, 8);
    outerWallGeo.rotateY(octRot);
    const outerWall = createArchMesh(outerWallGeo, materials.wall);
    outerWall.position.y = cfg.hBody / 2;
    bodyGroup.add(outerWall);

    // 外槽檐柱与柱头/补间斗拱集群
    for (let k = 0; k < 8; k++) {
      const angle = k * (Math.PI / 4) + octRot;
      const faceAngle = k * (Math.PI / 4);
      const faceDist = cfg.rCore * Math.cos(Math.PI / 8);

      // 檐柱
      const col = createArchMesh(new THREE.CylinderGeometry(0.21, 0.23, cfg.hBody, 10), materials.pillar, true, true, false);
      col.position.set(Math.sin(angle) * cfg.rCore, cfg.hBody / 2, Math.cos(angle) * cfg.rCore);
      bodyGroup.add(col);

      // 柱头角科斗拱
      const cornerDg = createDouGongCluster(0.82);
      cornerDg.position.set(Math.sin(angle) * cfg.rCore, cfg.hBody - 0.52, Math.cos(angle) * cfg.rCore);
      cornerDg.rotation.y = angle;
      bodyGroup.add(cornerDg);

      // 补间斗拱 (每面两朵)
      [-0.36, 0.36].forEach(offset => {
        const interDg = createDouGongCluster(0.76);
        const sideVec = new THREE.Vector3(Math.cos(faceAngle) * offset * cfg.rCore * 0.65, cfg.hBody - 0.52, -Math.sin(faceAngle) * offset * cfg.rCore * 0.65);
        sideVec.x += Math.sin(faceAngle) * faceDist;
        sideVec.z += Math.cos(faceAngle) * faceDist;
        interDg.position.copy(sideVec);
        interDg.rotation.y = faceAngle;
        bodyGroup.add(interDg);
      });

      // 四正方向券门格扇装饰框
      if (k % 2 === 0) {
        const doorGeo = new THREE.BoxGeometry(1.1, cfg.hBody * 0.72, 0.16);
        const door = createArchMesh(doorGeo, materials.dougong, false, false, true);
        door.position.set(Math.sin(faceAngle) * (faceDist * 0.95), cfg.hBody * 0.36, Math.cos(faceAngle) * (faceDist * 0.95));
        door.rotation.y = faceAngle;
        bodyGroup.add(door);
      }
    }

    // 该层飞檐屋顶（第五层为八角攒尖顶，收至中心 0.35）
    const topInnerR = cfg.isTopTier ? 0.38 : cfg.rCore * 0.82;
    const roofLayers = cfg.isTopTier ? 4 : 3;
    const storyRoof = createOctagonalCurvedEaveRoof(topInnerR, cfg.rEave, cfg.roofH, roofLayers);
    storyRoof.position.y = cfg.hBody;
    bodyGroup.add(storyRoof);

    registerExplodable(bodyGroup, cfg.baseY + cfg.hMezz, cfg.expBodyY, `${cfg.tierNum}层明层与飞檐`);
    targets[`tier-${cfg.tierNum}-body`] = bodyGroup;
  });

  // --- [部件 Top]：铁制仰莲塔刹与八角铁链 (Iron Finial Spire) ---
  const spireGroup = new THREE.Group();
  // 砖雕仰莲须弥刹座
  const lotusBaseGeo = new THREE.CylinderGeometry(1.25, 0.95, 0.65, 8);
  lotusBaseGeo.rotateY(octRot);
  const lotusBase = createArchMesh(lotusBaseGeo, materials.stone);
  lotusBase.position.y = 0.32;
  spireGroup.add(lotusBase);

  // 覆钵 (Inverted Bowl)
  const bowlGeo = new THREE.SphereGeometry(0.95, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const bowl = createArchMesh(bowlGeo, materials.bronze);
  bowl.position.y = 0.65;
  spireGroup.add(bowl);

  // 中心刹杆 (Central Iron Mast)
  const mastGeo = new THREE.CylinderGeometry(0.09, 0.16, 6.6, 12);
  const mast = createArchMesh(mastGeo, materials.bronze);
  mast.position.y = 3.3;
  spireGroup.add(mast);

  // 仰莲受花与相轮七重环 (Concentric Rings)
  for (let r = 0; r < 7; r++) {
    const ringR = 0.72 - r * 0.048;
    const ringGeo = new THREE.TorusGeometry(ringR, 0.065, 8, 20);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = createArchMesh(ringGeo, materials.bronze, false, false, false);
    ringMesh.position.y = 1.85 + r * 0.38;
    spireGroup.add(ringMesh);
  }

  // 华盖、仰月、宝珠与火焰宝珠刹顶
  const canopyGeo = new THREE.ConeGeometry(0.85, 0.35, 8);
  const canopy = createArchMesh(canopyGeo, materials.bronze);
  canopy.position.y = 4.65;
  spireGroup.add(canopy);

  const pearlGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const pearl = createArchMesh(pearlGeo, materials.mezzanine);
  pearl.position.y = 5.55;
  spireGroup.add(pearl);

  // 八条拽刹铁链（由刹顶连向五层屋檐八个翼角）
  for (let k = 0; k < 8; k++) {
    const angle = k * (Math.PI / 4) + octRot;
    const chainEnd = new THREE.Vector3(Math.sin(angle) * 6.8, -2.5, Math.cos(angle) * 6.8);
    const chainStart = new THREE.Vector3(0, 4.5, 0);
    const chainGeo = new THREE.BufferGeometry().setFromPoints([chainStart, chainEnd]);
    const chainLine = new THREE.Line(chainGeo, new THREE.LineBasicMaterial({ color: 0x3A2E25, transparent: true, opacity: 0.65 }));
    spireGroup.add(chainLine);
  }

  registerExplodable(spireGroup, layout.spire.baseY, layout.spire.explodedY, layout.spire.label);
  targets.spire = spireGroup;

  return { materials, explodableParts, targets };
}
