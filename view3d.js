// 3D view: a short length of muscle cut crosswise, cut face toward the viewer.
// the face is the cross-section (every fibre, same colour modes); the body behind it
// shortens and bulges with muscle length. a schematic of one pooled muscle: the model
// has no pennation, tendon or joint, so none is drawn. drag to orbit, double-click to reset.
(function (M) {
  const DEPTH = 1.6, STEPS = 10, TAPER = 0.45, HOME = {yaw: 0.35, pitch: 0.25};
  M.webglOK = () => !!document.createElement('canvas').getContext('webgl');

  // fibre prism from its cross-section polygon; the far end narrows toward the axis
  const prism = poly => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(poly.map(v => new THREE.Vector2(v[0], v[1]))), {depth: DEPTH, steps: STEPS, bevelEnabled: false});
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 - TAPER * ((DEPTH - p.getZ(i)) / DEPTH) ** 2;
      p.setXY(i, p.getX(i) * k, p.getY(i) * k);
    }
    g.computeVertexNormals();
    return g;
  };
  // css hsl()/hex strings from colours.js; three's own parser wants commas in hsl()
  const paint = (c, s) => {
    if (s[0] === '#') return c.set(s);
    const [h, sat, l] = s.match(/[\d.]+/g).map(Number);
    return c.setHSL(h / 360, sat / 100, l / 100);
  };

  M.View3D = class {
    constructor(canvas, fibres) {
      this.canvas = canvas; this.yaw = HOME.yaw; this.pitch = HOME.pitch;
      this.renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
      this.renderer.setPixelRatio(devicePixelRatio);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50); this.camera.position.set(0, 0, 5.2);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const sun = new THREE.DirectionalLight(0xffffff, 0.45); sun.position.set(2, 3, 5); this.scene.add(sun);
      this.pivot = new THREE.Group(); this.body = new THREE.Group();
      this.pivot.add(this.body); this.scene.add(this.pivot);
      this.build(fibres);
      this.drag();
    }
    // one mesh per fibre; call again when the muscle is rebuilt
    build(fibres) {
      for (const m of this.meshes || []) { m.geometry.dispose(); m.material.dispose(); this.body.remove(m); }
      this.meshes = fibres.map(f => {
        const mesh = new THREE.Mesh(prism(f.poly), new THREE.MeshLambertMaterial());
        this.body.add(mesh); return mesh;
      });
    }
    drag() {
      const c = this.canvas; let last = null;
      c.style.touchAction = 'none';
      c.onpointerdown = e => { last = e; c.setPointerCapture(e.pointerId); };
      c.onpointerup = () => { last = null; };
      c.onpointermove = e => {
        if (!last) return;
        this.yaw += (e.clientX - last.clientX) * 0.01;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + (e.clientY - last.clientY) * 0.01));
        last = e;
      };
      c.ondblclick = () => { this.yaw = HOME.yaw; this.pitch = HOME.pitch; };
    }
    resize() { this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false); }
    // length: relative muscle length; volume stays constant, so the cross-section scales by 1/sqrt(length)
    draw(fibres, mode, length) {
      const top = Math.max(1e-9, ...fibres.map(f => f.tut)), r = 1 / Math.sqrt(length);
      fibres.forEach((f, i) => paint(this.meshes[i].material.color, M.colour[mode](f, top)));
      this.body.scale.set(r, r, length);
      this.body.position.z = -DEPTH * length / 2;
      this.pivot.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      this.renderer.render(this.scene, this.camera);
    }
  };
})(window.M);
