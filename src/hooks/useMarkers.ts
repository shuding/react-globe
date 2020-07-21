import { max, min } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { useEffect, useRef } from 'react';
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { createGlowMesh } from 'three-glow-mesh';

import {
  MARKER_DEFAULT_COLOR,
  MARKER_SEGMENTS,
  MARKER_UNIT_RADIUS_SCALE,
  RADIUS,
} from '../defaults';
import {
  InteractableObject3D,
  Marker,
  MarkerCallback,
  MarkerOptions,
} from '../types';
import { coordinatesToPosition } from '../utils';

interface Handlers {
  onMouseOver: MarkerCallback;
}

export default function useMarkers<T>(
  markers: Marker[],
  {
    animationDuration,
    enableGlow,
    glowCoefficient,
    glowPower,
    glowRadiusScale,
    offsetRadiusScale,
    radiusScaleRange,
    renderer,
  }: MarkerOptions,
  { onMouseOver }: Handlers,
): React.RefObject<THREE.Group> {
  const markersRef = useRef<THREE.Group>(new Group());
  const unitRadius = RADIUS * MARKER_UNIT_RADIUS_SCALE;

  // init
  useEffect(() => {
    const sizeScale = scaleLinear()
      .domain([
        min(markers, marker => marker.value),
        max(markers, marker => marker.value),
      ])
      .range([RADIUS * radiusScaleRange[0], RADIUS * radiusScaleRange[1]]);

    markersRef.current.children = []; // clear data before adding
    markers.forEach(marker => {
      const { coordinates, value } = marker;
      const shouldUseCustomMarker = renderer !== undefined;

      const color = marker.color || MARKER_DEFAULT_COLOR;
      const size = sizeScale(value);
      let markerObject: InteractableObject3D;

      if (shouldUseCustomMarker) {
        markerObject = renderer(marker);
      } else {
        const mesh = new Mesh();
        mesh.geometry = new SphereGeometry(
          size,
          MARKER_SEGMENTS,
          MARKER_SEGMENTS,
        );
        mesh.material = new MeshBasicMaterial({ color });
        if (enableGlow) {
          // add glow
          const glowMesh = createGlowMesh(
            mesh.geometry.clone() as THREE.Geometry,
            {
              backside: false,
              color,
              coefficient: glowCoefficient,
              power: glowPower,
              size: size * glowRadiusScale,
            },
          );
          mesh.children = [];
          mesh.add(glowMesh);
        }
        markerObject = mesh;
      }

      // place markers
      let heightOffset = 0;
      if (offsetRadiusScale !== undefined) {
        heightOffset = RADIUS * offsetRadiusScale;
      } else {
        heightOffset = (size * (1 + glowRadiusScale)) / 2;
      }
      const position = coordinatesToPosition(
        coordinates,
        RADIUS + heightOffset,
      );
      markerObject.position.set(...position);
      markerObject.lookAt(new Vector3(0, 0, 0));

      // handle events
      markerObject.on('mousemove', event => {
        event.stopPropagation();
        onMouseOver(marker, markerObject);
      });
      markersRef.current.add(markerObject);
    });
  }, [
    animationDuration,
    enableGlow,
    glowCoefficient,
    glowPower,
    glowRadiusScale,
    markers,
    offsetRadiusScale,
    onMouseOver,
    radiusScaleRange,
    renderer,
    unitRadius,
  ]);

  return markersRef;
}
