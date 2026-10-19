import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import './style.css';
import { fetchSceneConfig } from './api.js';
import { buildPagoda } from './pagoda.js';

const loader = document.getElementById('app-loader');
const loaderText = document.getElementById('app-loader-text');

async function init() {
  const config = await fetchSceneConfig();

  // 1. 初始化场景、相机与渲染器
  const container = document.getElementById('canvas-container');
  const leaderSvg = document.getElementById('leader-svg');
  const annotationsContainer = document.getElementById('annotations-container');

  const scene = new THREE.Scene();
  // 柔和的宣纸雾效让底座边缘自然融入背景
  scene.fog = new THREE.FogExp2(0xF3EDE2, 0.0045);

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.5, 500);
  camera.position.set(42, 30, 56);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // 2. OrbitControls 360度旋转与俯仰交互控制
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 17, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 125;
  controls.minDistance = 16;
  controls.maxPolarAngle = Math.PI * 0.54; // 支持适度从下往上仰视飞檐斗拱
  controls.minPolarAngle = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.65;

  // 3. 灯光布局（营造古典建筑体积感与飞檐深邃阴影）
  const ambientLight = new THREE.AmbientLight(0xFFF6E6, 0.72);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xFFFDF8, 0x9E8C76, 0.45);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const mainSunLight = new THREE.DirectionalLight(0xFFEBD2, 1.15);
  mainSunLight.position.set(45, 72, 48);
  mainSunLight.castShadow = true;
  mainSunLight.shadow.mapSize.width = 2048;
  mainSunLight.shadow.mapSize.height = 2048;
  mainSunLight.shadow.camera.near = 10;
  mainSunLight.shadow.camera.far = 160;
  const d = 28;
  mainSunLight.shadow.camera.left = -d;
  mainSunLight.shadow.camera.right = d;
  mainSunLight.shadow.camera.top = d + 15;
  mainSunLight.shadow.camera.bottom = -d;
  mainSunLight.shadow.bias = -0.0005;
  scene.add(mainSunLight);

  // 背光勾勒飞檐轮廓
  const rimLight = new THREE.DirectionalLight(0xE8D8C0, 0.55);
  rimLight.position.set(-45, 25, -40);
  scene.add(rimLight);

  // 4. 由 API 下发的结构参数、色彩与标注数据构建全塔
  const { materials, explodableParts, targets } = buildPagoda({ scene, config });

  // ==================== 悬浮引线标注系统 (3D Annotation Pins + SVG Leader Lines) ====================
  const annotationData = config.annotations
    .map((item) => ({
      ...item,
      localPos: new THREE.Vector3(...item.localPos),
      parentGroup: targets[item.target]
    }))
    .filter((item) => item.parentGroup);

  let showAnnotations = true;
  const annotationElements = [];

  // 创建每个标注的 DOM 节点与 SVG 引线
  annotationData.forEach((item) => {
    // 圆点锚点
    const pinEl = document.createElement('div');
    pinEl.className = 'annotation-pin';
    pinEl.innerHTML = `
        <div class="pin-pulse"></div>
        <div class="pin-dot"></div>
        <div class="pin-card rounded-[2px]" style="left: ${item.offsetPx.x}px; top: ${item.offsetPx.y}px; transform: translate(${item.offsetPx.x < 0 ? '-100%' : '0%'}, -50%);">
            <div class="flex items-center justify-between gap-3 border-b border-[#3A2E25]/20 pb-0.5 mb-0.5">
                <span class="text-[11px] font-bold text-[#231D18]">${item.title}</span>
                <span class="font-mono-tech text-[9px] text-[#9E3328] font-semibold">${item.code}</span>
            </div>
            <div class="text-[10px] text-[#5A4E43]">${item.sub}</div>
        </div>
    `;

    // SVG 折线引线
    const svgPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    svgPolyline.setAttribute('fill', 'none');
    svgPolyline.setAttribute('stroke', '#3A2E25');
    svgPolyline.setAttribute('stroke-width', '1');
    svgPolyline.setAttribute('stroke-dasharray', '3 2');
    svgPolyline.setAttribute('opacity', '0.75');
    leaderSvg.appendChild(svgPolyline);

    // 点击标注点：更新左侧信息卡并平滑运镜聚焦
    pinEl.addEventListener('click', (e) => {
      e.stopPropagation();
      focusOnAnnotation(item);
    });

    annotationsContainer.appendChild(pinEl);
    annotationElements.push({ data: item, pinEl, svgPolyline });
  });

  function focusOnAnnotation(item) {
    annotationElements.forEach(a => a.pinEl.classList.remove('selected'));
    const targetObj = annotationElements.find(a => a.data.id === item.id);
    if (targetObj) targetObj.pinEl.classList.add('selected');

    // 更新左侧底部构件解说面板
    document.getElementById('node-title').textContent = `【${item.title}】`;
    document.getElementById('node-code').textContent = item.code;
    document.getElementById('node-desc').textContent = item.desc;

    // 平滑运镜
    const currentOffsetY = item.parentGroup.position.y - item.parentGroup.userData.baseY;
    gsap.to(camera.position, {
      x: item.camPos.x,
      y: item.camPos.y + currentOffsetY,
      z: item.camPos.z,
      duration: 1.3,
      ease: 'power3.out'
    });
    gsap.to(controls.target, {
      x: item.camTarget.x,
      y: item.camTarget.y + currentOffsetY,
      z: item.camTarget.z,
      duration: 1.3,
      ease: 'power3.out'
    });
  }

  // 每帧同步 3D 坐标至 2D 屏幕与 SVG 引线
  const tempWorldVec = new THREE.Vector3();
  function updateAnnotations() {
    if (!showAnnotations) return;
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    annotationElements.forEach(({ data, pinEl, svgPolyline }) => {
      tempWorldVec.copy(data.localPos);
      data.parentGroup.localToWorld(tempWorldVec);
      tempWorldVec.project(camera);

      // 判断是否在视野前方
      if (tempWorldVec.z > 1) {
        pinEl.style.opacity = '0';
        svgPolyline.setAttribute('opacity', '0');
        return;
      }

      const screenX = (tempWorldVec.x * halfW) + halfW;
      const screenY = -(tempWorldVec.y * halfH) + halfH;

      pinEl.style.left = `${screenX}px`;
      pinEl.style.top = `${screenY}px`;
      pinEl.style.opacity = '1';

      // 计算折线拐点连接圆点与标签框
      const endX = screenX + data.offsetPx.x;
      const endY = screenY + data.offsetPx.y;
      const elbowX = screenX + data.offsetPx.x * 0.45;
      const elbowY = endY;

      svgPolyline.setAttribute('points', `${screenX},${screenY} ${elbowX},${elbowY} ${endX},${endY}`);
      svgPolyline.setAttribute('opacity', '0.75');
    });
  }

  // ==================== UI 按钮与键盘快捷键交互绑定 ====================
  let isWireframe = false;
  let isExploded = false;

  const btnWireframe = document.getElementById('btn-wireframe');
  const btnExplode = document.getElementById('btn-explode');
  const btnAutoRotate = document.getElementById('btn-autorotate');
  const btnReset = document.getElementById('btn-reset');
  const togglePinsCheckbox = document.getElementById('toggle-pins');
  const statusLabel = document.getElementById('active-status-label');

  // 线框透视切换 (Wireframe Mode)
  function toggleWireframe() {
    isWireframe = !isWireframe;
    btnWireframe.classList.toggle('active', isWireframe);

    Object.values(materials).forEach(mat => {
      if (mat.isMeshStandardMaterial) {
        mat.wireframe = isWireframe;
      }
    });
    materials.edge.opacity = isWireframe ? 0.85 : 0.35;
    statusLabel.textContent = isWireframe ? '交互模式：木构骨架线框透视' : '交互模式：全视角3D环绕观察';
  }
  btnWireframe.addEventListener('click', toggleWireframe);

  // 爆炸分解切换 (Exploded View - 展现明五暗四分层与斜撑结构)
  function toggleExplode() {
    isExploded = !isExploded;
    btnExplode.classList.toggle('accent-active', isExploded);

    explodableParts.forEach((grp, idx) => {
      const targetY = isExploded ? grp.userData.explodedY : grp.userData.baseY;
      gsap.to(grp.position, {
        y: targetY,
        duration: 1.4,
        delay: idx * 0.03,
        ease: 'power3.inOut'
      });
    });

    // 相机拉远以容纳全塔爆炸高度
    if (isExploded) {
      gsap.to(camera.position, { x: 56, y: 38, z: 74, duration: 1.4, ease: 'power3.inOut' });
      gsap.to(controls.target, { x: 0, y: 24, z: 0, duration: 1.4, ease: 'power3.inOut' });
      statusLabel.textContent = '交互模式：明五暗四爆炸分解图解';
    } else {
      gsap.to(camera.position, { x: 42, y: 30, z: 56, duration: 1.4, ease: 'power3.inOut' });
      gsap.to(controls.target, { x: 0, y: 17, z: 0, duration: 1.4, ease: 'power3.inOut' });
      statusLabel.textContent = '交互模式：全视角3D环绕观察';
    }
  }
  btnExplode.addEventListener('click', toggleExplode);

  // 自动慢速自转开关
  function toggleAutoRotate() {
    controls.autoRotate = !controls.autoRotate;
    btnAutoRotate.classList.toggle('active', controls.autoRotate);
  }
  btnAutoRotate.addEventListener('click', toggleAutoRotate);

  // 重置视角
  function resetView() {
    if (isExploded) toggleExplode();
    if (isWireframe) toggleWireframe();
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="aerial"]').classList.add('active');

    gsap.to(camera.position, { x: 42, y: 30, z: 56, duration: 1.2, ease: 'power3.out' });
    gsap.to(controls.target, { x: 0, y: 17, z: 0, duration: 1.2, ease: 'power3.out' });
    statusLabel.textContent = '交互模式：全视角3D环绕观察';
  }
  btnReset.addEventListener('click', resetView);

  // 悬浮引线标注显示/隐藏
  togglePinsCheckbox.addEventListener('change', (e) => {
    showAnnotations = e.target.checked;
    annotationsContainer.style.display = showAnnotations ? 'block' : 'none';
    leaderSvg.style.display = showAnnotations ? 'block' : 'none';
  });

  // 测绘视点快切 (View Mode Presets)
  const viewPresets = {
    aerial: { pos: { x: 42, y: 32, z: 54 }, target: { x: 0, y: 17, z: 0 }, label: '3D 鸟瞰轴测视角' },
    front:  { pos: { x: 0, y: 17, z: 68 },  target: { x: 0, y: 17, z: 0 }, label: '南向正立面测绘视角' },
    side:   { pos: { x: 68, y: 17, z: 0 },  target: { x: 0, y: 17, z: 0 }, label: '东向侧立面测绘视角' },
    lookup: { pos: { x: 18, y: 4.5, z: 22 }, target: { x: 0, y: 21, z: 0 }, label: '飞檐斗拱仰视视角' }
  };

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = viewPresets[btn.dataset.view];
      if (preset) {
        const yBoost = isExploded ? 7 : 0;
        gsap.to(camera.position, {
          x: preset.pos.x,
          y: preset.pos.y + yBoost,
          z: preset.pos.z,
          duration: 1.25,
          ease: 'power3.out'
        });
        gsap.to(controls.target, {
          x: preset.target.x,
          y: preset.target.y + yBoost,
          z: preset.target.z,
          duration: 1.25,
          ease: 'power3.out'
        });
        statusLabel.textContent = `视点：${preset.label}`;
      }
    });
  });

  // 木构色泽/历史风貌材质切换 (Finish / Dynasty Styles)
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const palette = config.palettes[btn.dataset.style];
      if (!palette) return;

      const animateColor = (mat, hex) => {
        const c = new THREE.Color(hex);
        gsap.to(mat.color, { r: c.r, g: c.g, b: c.b, duration: 0.75 });
      };

      animateColor(materials.pillar, palette.pillar);
      animateColor(materials.dougong, palette.dougong);
      animateColor(materials.wall, palette.wall);
      animateColor(materials.mezzanine, palette.mezzanine);
      animateColor(materials.roof, palette.roof);
      animateColor(materials.ridge, palette.ridge);
      animateColor(materials.stone, palette.stone);
      animateColor(materials.bronze, palette.bronze);
      animateColor(materials.edge, palette.edgeLine);
    });
  });

  // 右下角微距特写卡片点击联动聚焦
  document.querySelectorAll('.detail-card').forEach(card => {
    card.addEventListener('click', () => {
      const focusId = card.dataset.focus;
      const item = annotationData.find(a => a.id === focusId);
      if (item) {
        // 若点击“平座暗层斜撑”且当前未爆炸，自动开启爆炸视图展示暗层内部斜撑
        if (focusId === 'mezzanine' && !isExploded) {
          toggleExplode();
        }
        focusOnAnnotation(item);
      }
    });
  });

  // 键盘快捷键支持
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') toggleWireframe();
    if (key === 'e') toggleExplode();
    if (key === 'r') toggleAutoRotate();
    if (e.code === 'Space') {
      e.preventDefault();
      resetView();
    }
  });

  // 窗口自适应与相机角度实时读数
  const angleReadout = document.getElementById('camera-angle-readout');
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 主渲染循环
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateAnnotations();

    // 更新测绘相机方位角与俯仰角读数
    const az = Math.round(THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()));
    const el = Math.round(90 - THREE.MathUtils.radToDeg(controls.getPolarAngle()));
    angleReadout.textContent = `AZ: ${az}° EL: ${el}°`;

    renderer.render(scene, camera);
  }

  animate();

  // 场景就绪后淡出加载遮罩
  loader.classList.add('opacity-0');
  window.setTimeout(() => loader.remove(), 500);
}

init().catch((error) => {
  console.error(error);
  if (loaderText) {
    loaderText.textContent = `场景数据加载失败：${error.message}`;
    loaderText.classList.add('text-[#9E3328]');
  }
});
