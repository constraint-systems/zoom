import { useEffect, useRef, useState } from "react";
import "./font.css";
import * as THREE from "three";
import Pointer from "./Pointer";
import Text from "./Text";

function App() {
  const [loaded, setLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.visible = false;

    camera.position.z = 5;

    const text = new Text(scene, camera);

    function animate() {
      // if (camera.position.z > 3) {
      //   text.visible = true;
      // } else {
      //   text.visible = false;
      // }
      // @ts-ignore
      text.material.uniforms.z.value = camera.position.z;
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  }, []);

  useEffect(() => {
    document.fonts.load('16px "custom"').then(() => {
      setLoaded(true);
    });
  }, []);

  return (
    <canvas ref={canvasRef}>
      {loaded ? (
        <Pointer
          element={rendererRef.current!.context.canvas}
          camera={cameraRef.current}
        />
      ) : null}
    </canvas>
  );
}

export default App;
