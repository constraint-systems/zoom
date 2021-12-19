import React, { useEffect, useRef, useState } from "react";
import { UseWheelZoom, UsePointerPan } from "./PointerUtils";

function Pointer({ element, camera }: { element: any; camera: any }) {
  UseWheelZoom(element, camera);
  UsePointerPan(element, camera);

  return null;
}

export default Pointer;
