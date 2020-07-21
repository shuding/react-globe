import { useEffect, useRef } from 'react';
import THREE, {
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  TextureLoader,
} from 'three';
import { createGlowMesh } from 'three-glow-mesh';

import {
  GLOBE_SEGMENTS,
  RADIUS,
} from '../defaults';
import { GlobeOptions } from '../types';

export default function useGlobe<T>(
  {
    enableGlow,
    glowCoefficient,
    glowColor,
    glowPower,
    glowRadiusScale,
    texture,
  }: GlobeOptions,
  onTextureLoaded?: () => void,
): React.RefObject<THREE.Group> {
  const globeRef = useRef<THREE.Group | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);

  if (globeRef.current === null) {
    globeRef.current = new Group();
  }
  if (sphereRef.current === null) {
    sphereRef.current = new Mesh();
  }

  const textureLoadRef = useRef<any>(onTextureLoaded);

  useEffect(() => {
    textureLoadRef.current = onTextureLoaded;
  }, [onTextureLoaded]);

  // init
  useEffect(() => {
    const globe = globeRef.current;
    const sphere = sphereRef.current;

    new TextureLoader().load(texture, map => {
      sphere.geometry = new SphereGeometry(
        RADIUS,
        GLOBE_SEGMENTS,
        GLOBE_SEGMENTS,
      );
      sphere.material = new MeshLambertMaterial({
        map,
      });
      globe.add(sphere);

      // add glow if enabled
      if (enableGlow) {
        const glowMesh = createGlowMesh(sphere.geometry, {
          backside: true,
          color: glowColor,
          coefficient: glowCoefficient,
          power: glowPower,
          size: RADIUS * glowRadiusScale,
        });
        sphere.children = []; // remove all glow instances
        sphere.add(glowMesh);
      }

      textureLoadRef.current && textureLoadRef.current();
    });
  }, [
    enableGlow,
    glowCoefficient,
    glowColor,
    glowPower,
    glowRadiusScale,
    texture,
  ]);

  return globeRef;
}
