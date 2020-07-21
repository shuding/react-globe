import { useEffect, useRef } from 'react';
import { WebGLRenderer } from 'three';

import { Size } from '../types';

export default function useRenderer<T>(
  size: Size,
): [React.RefObject<THREE.WebGLRenderer>, React.RefObject<HTMLCanvasElement>] {
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const canvasRef = useRef<HTMLCanvasElement>();

  // init
  useEffect(() => {
    rendererRef.current = new WebGLRenderer({
      alpha: false,
      antialias: false,
      stencil: false,
      canvas: canvasRef.current
    });
    rendererRef.current.setClearColor(0xffffff);
  }, []);

  // update size
  useEffect(() => {
    rendererRef.current.setSize(...size);
  }, size);

  return [rendererRef, canvasRef];
}
