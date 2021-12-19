import * as THREE from "three";

const makeCanvas = (
  c: HTMLCanvasElement,
  chars: string[],
  color = "#000000"
) => {
  const cx = c.getContext("2d")!;
  cx.clearRect(0, 0, c.width, c.height);
  const fs = 64;
  cx.font = fs + "px custom";

  const ch = Math.round(fs * 1.2);

  const toMeasure = cx.measureText("n");
  const cw = toMeasure.width;
  c.width = 2048;
  const rows = Math.ceil((chars.length * cw) / c.width);
  c.height = rows * ch;
  const perRow = Math.floor(c.width / cw);

  cx.fillStyle = "white";
  cx.fillRect(0, 0, c.width, c.height);
  cx.clearRect(0, 0, c.width, c.height);

  // have to set font again after resize
  cx.font = fs + "px custom";
  cx.fillStyle = color;
  cx.textBaseline = "middle";
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    cx.fillText(char, col * cw, row * ch + ch / 2);
  }
  return { c, cw, ch, rows, perRow };
};

const LIMIT = 2000;
class Text extends THREE.InstancedMesh {
  perRow: number;
  rows: number;
  cw: number;
  ch: number;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const geometry = new THREE.PlaneBufferGeometry();
    var uv = geometry.getAttribute("uv");
    let texture;
    let texScale = [1, 1];
    let aspect;
    let rows;
    let perRow;
    const chars =
      " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789%$€¥£¢&*@#|áâàäåãæçéêèëíîìï:;-–—•,.…'\"`„‹›«»/\\?!¿¡()[]{}©®§+×=_°~^<>".split(
        ""
      );
    const canvas = document.createElement("canvas");

    let cw, ch;
    {
      const madeCanvas = makeCanvas(canvas, chars);
      const c = madeCanvas.c;
      cw = madeCanvas.cw;
      ch = madeCanvas.ch;
      rows = madeCanvas.rows;
      perRow = madeCanvas.perRow;
      texture = new THREE.CanvasTexture(c);
      // texture.minFilter = THREE.LinearFilter;

      uv.setXY(0, 0, 1);
      uv.setXY(1, 1, 1);
      uv.setXY(2, 0, 0);
      uv.setXY(3, 1, 0);
      texScale[0] = cw / c.width;
      texScale[1] = ch / c.height;

      aspect = [cw / ch, 1, 1];
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "9";
    }

    const offsets = [];
    for (let i = 0; i < LIMIT; i++) {
      offsets.push(0, 0);
    }

    const selected = [];
    for (let i = 0; i < LIMIT; i++) {
      selected.push(0);
    }

    geometry.setAttribute(
      "offset",
      new THREE.InstancedBufferAttribute(new Float32Array(offsets), 2, false)
    );

    geometry.setAttribute(
      "selected",
      new THREE.InstancedBufferAttribute(new Float32Array(selected), 1, false)
    );

    const vertexShader = `
    varying vec2 vUv;
    attribute vec2 offset;
    varying vec2 vOffset;
    uniform vec2 texScale;
    varying vec2 vTexScale;
    uniform vec3 aspect;
    uniform float z;
    uniform float scale;
    attribute float selected;
    varying float vSelected;

    void main() {
      vUv = uv * texScale;
      vOffset = offset * texScale;
      vTexScale = texScale;
      vSelected = selected;

      gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position * aspect * scale * (z / 5.0), 1.0);
    }
    `;

    const fragmentShader = `
    uniform sampler2D texture1;
    varying vec2 vUv;
    varying vec2 vOffset;
    varying float vSelected;
    uniform vec3 color;

    void main() {
      vec4 tex = texture2D(texture1, vec2(vUv.x + vOffset.x, vUv.y + vOffset.y ));
      vec4 colored = vec4(color, tex.a);
      if (vSelected == 1.0 && colored.a < 0.2) {
        colored.r = 0.5;
        colored.g = 1.0;
        colored.b = 0.5;
        colored.a = 1.0;
      }
      gl_FragColor = colored;
    }
    `;

    var uniforms = {
      texture1: { type: "t", value: texture },
      texScale: { value: texScale },
      aspect: { value: aspect },
      selected: { value: selected },
      scale: { value: 0.5 },
      color: { value: [1.0, 1.0, 1.0] },
      z: { value: camera.position.z },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    material.transparent = true;

    super(geometry, material, LIMIT);
    scene.add(this);
    this.perRow = perRow;
    this.rows = rows;
    this.cw = cw;
    this.ch = ch;

    const offsetBuffer = this.geometry.attributes.offset.array;
    // @ts-ignore
    offsetBuffer.fill(-1);
    const starterText = `Call me Ishmael. Some years ago--never mind how long precisely--having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off--then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me. There now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs--commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there. Circumambulate the city of a dreamy Sabbath afternoon. Go from Corlears Hook to Coenties Slip, and from thence, by Whitehall, northward. What do you see?--Posted like silent sentinels all around the town, stand thousands upon thousands of mortal men fixed in ocean reveries. Some leaning against the spiles; some seated upon the pier-heads; some looking over the bulwarks of ships from China; some high aloft in the rigging, as if striving to get a still better seaward peep. But these are all landsmen; of week days pent up in lath and plaster--tied to counters, nailed to benches, clinched to desks. How then is this? Are the green fields gone? What do they here?`;

    const wrapText = (text: string, maxLength: number) => {
      const result = [];
      let line: string[] = [];
      let length = 0;
      text.split(" ").forEach(function (word) {
        if (length + word.length >= maxLength) {
          result.push(line.join(" "));
          line = [];
          length = 0;
        }
        length += word.length + 1;
        line.push(word);
      });
      if (line.length > 0) {
        result.push(line.join(" "));
      }
      return result;
    };

    const wrapped = wrapText(starterText, 46);

    const matrix = new THREE.Matrix4();
    let item = 0;
    for (let r = 0; r < wrapped.length; r++) {
      const line = wrapped[r];
      for (let c = 0; c < line.length + 1; c++) {
        matrix.setPosition(
          c * 0.25 - (46 / 2) * 0.25,
          -wrapped.length * 0.5 +
            (wrapped.length - 1 - r) * 0.5 +
            (wrapped.length / 2) * 0.5,
          0
        );
        this.setMatrixAt(item, matrix);
        item++;
      }
    }
    this.instanceMatrix.needsUpdate = true;

    let counter = 0;
    for (const char of starterText) {
      const index = chars.indexOf(char);
      const col = index % this.perRow;
      const row = Math.floor(index / this.perRow);
      // @ts-ignore
      offsetBuffer[counter * 2] = col;
      // @ts-ignore
      offsetBuffer[counter * 2 + 1] = this.rows - 1 - row;
      counter++;
    }
    this.geometry.attributes.offset.needsUpdate = true;
  }
}

export default Text;
