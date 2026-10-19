/**
 * 应县木塔 3D 场景数据
 * 仅随 Worker 部署，不下发到前端构建产物中。
 */
export const SCENE_CONFIG = {
  version: '1.0.0',
  palettes: {
    liao: {
      pillar: 0x6e3826,
      dougong: 0x543222,
      wall: 0x613a29,
      mezzanine: 0x8f3d2c,
      roof: 0x3a3937,
      ridge: 0x262523,
      stone: 0xcfc5b4,
      bronze: 0x5c4833,
      edgeLine: 0x291d15
    },
    ming: {
      pillar: 0x3d271d,
      dougong: 0x2e1d15,
      wall: 0x473023,
      mezzanine: 0x6e3224,
      roof: 0x2b2c2e,
      ridge: 0x1d1e20,
      stone: 0xc6bcae,
      bronze: 0x4a3a28,
      edgeLine: 0x1a130e
    },
    weathered: {
      pillar: 0x756759,
      dougong: 0x615447,
      wall: 0x7d7062,
      mezzanine: 0x7a5747,
      roof: 0x595753,
      ridge: 0x42403d,
      stone: 0xd6cebf,
      bronze: 0x63594e,
      edgeLine: 0x3d352e
    }
  },
  layout: {
    base: { baseY: 0, explodedY: -2.5, label: '台基须弥座' },
    tier1: { baseY: 2.2, explodedY: 1.2, label: '一层塔身与副阶周匝' },
    spire: { baseY: 26.6, explodedY: 48.0, label: '铁制仰莲塔刹' }
  },
  tiers: [
    { tierNum: 2, baseY: 7.4, expMezzY: 10.2, expBodyY: 13.8, rCore: 6.35, rEave: 9.05, hMezz: 1.35, hBody: 3.15, roofH: 1.55 },
    { tierNum: 3, baseY: 12.1, expMezzY: 19.2, expBodyY: 22.8, rCore: 5.85, rEave: 8.35, hMezz: 1.25, hBody: 2.95, roofH: 1.45 },
    { tierNum: 4, baseY: 16.4, expMezzY: 28.0, expBodyY: 31.4, rCore: 5.35, rEave: 7.65, hMezz: 1.15, hBody: 2.75, roofH: 1.35 },
    { tierNum: 5, baseY: 20.4, expMezzY: 36.5, expBodyY: 39.8, rCore: 4.85, rEave: 7.15, hMezz: 1.10, hBody: 2.55, roofH: 2.65, isTopTier: true }
  ],
  annotations: [
    {
      id: 'spires',
      title: '铁制仰莲塔刹',
      code: 'ELEV +67.31m',
      sub: '相轮宝珠 · 八链引雷',
      desc: '塔顶铁刹高14.21米，由仰莲、覆钵、相轮、火焰、仰月及宝珠组成。四周以八条粗铁链系于五层屋脊各角，兼具抗风固定与天然避雷针之妙用。',
      target: 'spire',
      localPos: [0, 3.6, 0],
      offsetPx: { x: 115, y: -32 },
      camPos: { x: 18, y: 33, z: 22 },
      camTarget: { x: 0, y: 29, z: 0 }
    },
    {
      id: 'top-roof',
      title: '八角攒尖顶与九梁结构',
      code: 'ELEV +52.0m',
      sub: '五层明层 · 八角攒尖',
      desc: '第五层屋顶采用八角攒尖制，内设平棊藻井，外檐柱头采用双抄双下昂七铺作斗拱，八条戗脊翼角高高起翘并悬挂铁质风铎。',
      target: 'tier-5-body',
      localPos: [4.5, 3.2, 2.2],
      offsetPx: { x: -135, y: -24 },
      camPos: { x: 26, y: 27, z: 26 },
      camTarget: { x: 0, y: 23, z: 0 }
    },
    {
      id: 'dougong',
      title: '双槽六/七铺作斗拱集群',
      code: '54 TYPES · 480 SETS',
      sub: '斗拱博物馆 · 柔性减震',
      desc: '全塔共用54种不同形制的斗拱，总计480朵。斗拱通过层层出跳承托深远屋檐，地震时构件间产生摩擦滑移耗能，构成天然阻尼减震体系。',
      target: 'tier-3-body',
      localPos: [5.6, 2.5, 2.4],
      offsetPx: { x: 125, y: -15 },
      camPos: { x: 22, y: 17, z: 24 },
      camTarget: { x: 0, y: 15, z: 0 }
    },
    {
      id: 'mezzanine',
      title: '平座暗层 · 豪猪刺斜撑',
      code: '4 HIDDEN TIERS',
      sub: '明五暗四 · 刚性结构环',
      desc: '外观五层，实则二至五层平座下皆设有一层暗层。暗层内采用大量斜撑、剪刀撑与圈梁构成空间刚性桁架环，有效抵抗水平风荷载与强震扭转。',
      target: 'tier-3-mezz',
      localPos: [-5.8, 0.8, 2.5],
      offsetPx: { x: -145, y: 10 },
      camPos: { x: -24, y: 14, z: 24 },
      camTarget: { x: 0, y: 13, z: 0 }
    },
    {
      id: 'veranda',
      title: '底层重檐与副阶周匝',
      code: 'Ø 30.27m · 32 COLUMNS',
      sub: '双槽柱网 · 副阶护脚',
      desc: '底层直径30.27米，采用《营造法式》典型“副阶周匝”制，在外槽之外再绕廊一圈，形成重檐外观，既拓宽底座抗倾覆面积，又防止雨水侵蚀柱础。',
      target: 'tier-1',
      localPos: [8.5, 3.3, 3.8],
      offsetPx: { x: 120, y: 22 },
      camPos: { x: 28, y: 9, z: 32 },
      camTarget: { x: 0, y: 6, z: 0 }
    },
    {
      id: 'base',
      title: '下方式上八角须弥石台基',
      code: 'ELEV +0.00m · BASE',
      sub: '阶梯盘石 · 覆盆柱础',
      desc: '木塔屹立于高大石砌台基之上，下层为方形、上层为八角形须弥座，正南北东西四面辟石踏道，承载全塔超过7400吨纯木结构总重。',
      target: 'base',
      localPos: [-8.2, 1.6, 6.2],
      offsetPx: { x: -130, y: 28 },
      camPos: { x: -28, y: 8, z: 32 },
      camTarget: { x: 0, y: 3, z: 0 }
    }
  ]
};
