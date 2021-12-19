import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const UseWheelZoom = (element: any, camera: THREE.PerspectiveCamera) => {
  const cameraDown = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMousewheel = (e: WheelEvent) => {
      e.preventDefault();
      const width = element.clientWidth;
      const height = element.clientHeight;

      cameraDown.current.copy(camera.position);

      const percent = (height - e.deltaY) / height;
      const nextZoom = Math.min(32, Math.max(1, camera.position.z / percent));

      const visibleHeight =
        2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDown.current.z;
      const zoomPixel = visibleHeight / height;
      const relx = e.clientX - element.offsetLeft - width / 2;
      const rely = -(e.clientY - element.offsetTop - height / 2);
      const worldRelX = relx * zoomPixel;
      const worldRelY = rely * zoomPixel;

      const newVisibleHeight =
        2 * Math.tan((camera.fov * Math.PI) / 360) * nextZoom;
      const newZoomPixel = newVisibleHeight / height;

      const newWorldX = relx * newZoomPixel;
      const newWorldY = rely * newZoomPixel;

      const diffX = newWorldX - worldRelX;
      const diffY = newWorldY - worldRelY;

      camera.position.x = cameraDown.current.x - diffX;
      camera.position.y = cameraDown.current.y - diffY;
      camera.position.z = nextZoom;
    };

    element.addEventListener("wheel", handleMousewheel, {
      passive: false,
    });
    return () => {
      element.removeEventListener("wheel", handleMousewheel);
    };
  }, [element, camera]);
};

type PointerType = {
  id: number;
  x: number;
  y: number;
  pointerDown: [number, number];
  primary: boolean;
};

export const UsePointerPan = (element: any, camera: any) => {
  const cameraDown = useRef(new THREE.Vector3());
  const diff = useRef(new THREE.Vector2());
  const pointersRef = useRef<PointerType[]>([]);

  useEffect(() => {
    const pointers = pointersRef.current;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();

      pointers.push({
        id: e.pointerId,
        x: e.clientX - element.offsetLeft,
        y: e.clientY - element.offsetTop,
        pointerDown: [
          e.clientX - element.offsetLeft,
          e.clientY - element.offsetTop,
        ],
        primary: e.isPrimary,
      });
      for (const pointer of pointers) {
        pointer.pointerDown = [pointer.x, pointer.y];
      }
      cameraDown.current.copy(camera.position);

      element.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const width = element.clientWidth;
      const height = element.clientHeight;

      if (pointers.length === 1) {
        const pointer = pointers[0];
        pointer.x = e.clientX - element.offsetLeft;
        pointer.y = e.clientY - element.offsetTop;
        const visibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDown.current.z;
        const zoomPixel = visibleHeight / height;
        diff.current.x =
          (e.clientX - element.offsetLeft - pointer.pointerDown[0]) * zoomPixel;
        diff.current.y =
          (e.clientY - element.offsetTop - pointer.pointerDown[1]) * zoomPixel;
        camera.position.x = cameraDown.current.x - diff.current.x;
        camera.position.y = cameraDown.current.y + diff.current.y;
      } else if (pointers.length === 2) {
        const pointer = pointers.filter((p) => p.id === e.pointerId)[0];
        pointer.x = e.clientX - element.offsetLeft;
        pointer.y = e.clientY - element.offsetTop;

        const a = pointers[0];
        const b = pointers[1];
        const minDown = [
          Math.min(a.pointerDown[0], b.pointerDown[0]),
          Math.min(a.pointerDown[1], b.pointerDown[1]),
        ];
        const maxDown = [
          Math.max(a.pointerDown[0], b.pointerDown[0]),
          Math.max(a.pointerDown[1], b.pointerDown[1]),
        ];
        const min = [Math.min(a.x, b.x), Math.min(a.y, b.y)];
        const max = [Math.max(a.x, b.x), Math.max(a.y, b.y)];
        const combined = {
          down: [
            minDown[0] + (maxDown[0] - minDown[0]) / 2,
            minDown[1] + (maxDown[1] - minDown[1]) / 2,
          ],
          current: [
            min[0] + (max[0] - min[0]) / 2,
            min[1] + (max[1] - min[1]) / 2,
          ],
        };

        const visibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * cameraDown.current.z;
        const zoomPixel = visibleHeight / height;

        const dragged = [
          (combined.current[0] - combined.down[0]) * zoomPixel,
          (combined.current[1] - combined.down[1]) * zoomPixel,
        ];

        const adjustedDown = new THREE.Vector3();
        adjustedDown.x = cameraDown.current.x - dragged[0];
        adjustedDown.y = cameraDown.current.y + dragged[1];

        const downDiff = Math.sqrt(
          Math.pow(a.pointerDown[0] - b.pointerDown[0], 2) +
            Math.pow(a.pointerDown[1] - b.pointerDown[1], 2)
        );
        const currDiff = Math.sqrt(
          Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
        );
        const percent = (currDiff - downDiff) / downDiff + 1;

        const relx = combined.current[0] - width / 2;
        const rely = -(combined.current[1] - height / 2);
        const worldRelX = relx * zoomPixel;
        const worldRelY = rely * zoomPixel;

        const nextZoom = Math.min(
          32,
          Math.max(1, cameraDown.current.z / percent)
        );

        const newVisibleHeight =
          2 * Math.tan((camera.fov * Math.PI) / 360) * nextZoom;
        const newZoomPixel = newVisibleHeight / height;

        const newWorldX = relx * newZoomPixel;
        const newWorldY = rely * newZoomPixel;

        const diffX = newWorldX - worldRelX;
        const diffY = newWorldY - worldRelY;

        camera.position.x = adjustedDown.x - diffX;
        camera.position.y = adjustedDown.y - diffY;
        camera.position.z = nextZoom;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();

      pointers.splice(
        pointers.findIndex((p) => p.id === e.pointerId),
        1
      );
      for (const pointer of pointers) {
        pointer.pointerDown = [pointer.x, pointer.y];
      }

      cameraDown.current.copy(camera.position);

      element.releasePointerCapture(e.pointerId);
    };

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerup", handlePointerUp);
    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerUp);
    };
  }, [element, camera]);
};
