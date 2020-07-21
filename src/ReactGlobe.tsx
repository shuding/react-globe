import * as TWEEN from 'es6-tween';
import React, { useEffect, useReducer, useRef } from 'react';
import { useEventCallback } from 'react-cached-callback';
import { Scene } from 'three';
import { Interaction } from 'three.interaction';

import {
  defaultCameraOptions,
  defaultFocusOptions,
  defaultGlobeOptions,
  defaultLightOptions,
  defaultMarkerOptions,
} from './defaults';
import {
  useCamera,
  useGlobe,
  useMarkers,
  useRenderer,
} from './hooks';
import reducer, { ActionType } from './reducer';
import * as types from './types';
import { tween } from './utils';

export type CameraOptions = types.Optional<types.CameraOptions>;
export type FocusOptions = types.Optional<types.FocusOptions>;
export type GlobeOptions = types.Optional<types.GlobeOptions>;
export type LightOptions = types.Optional<types.LightOptions>;
export type MarkerOptions = types.Optional<types.MarkerOptions>;

export type Animation = types.Animation;
export type Coordinates = types.Coordinates;
export type EasingFunction = types.EasingFunction;
export type InteractionEvent = types.InteractionEvent;
export type Interactable = types.Interactable;
export type Marker = types.Marker;
export type MarkerCallback = types.MarkerCallback;
export type MarkerType = types.MarkerType;
export type Position = types.Position;
export type Size = types.Size;

export interface Props {
  /** Configure camera options (e.g. rotation, zoom, angles). */
  cameraOptions?: CameraOptions;
  /** A set of [lat, lon] coordinates to be focused on. */
  focus?: Coordinates;
  /** Configure focusing options (e.g. animation duration, distance, easing function). */
  focusOptions?: FocusOptions;
  /** Configure globe options (e.g. textures, glow). */
  globeOptions?: GlobeOptions;
  /** Configure light options (e.g. ambient and point light colors + intensity). */
  lightOptions?: LightOptions;
  /** A set of starting [lat, lon] coordinates for the globe. */
  lookAt?: Coordinates;
  /** An array of data that will render interactive markers on the globe. */
  markers?: Marker[];
  /** Configure marker options (e.g. size, marker types, custom marker renderer). */
  markerOptions?: MarkerOptions;
  /** Callback when texture is successfully loaded */
  onTextureLoaded?: () => void;
  /** Set explicit [width, height] values for the canvas container.  This will disable responsive resizing. */
  size?: Size;
}

function ReactGlobe({
  cameraOptions,
  focus,
  globeOptions,
  lightOptions,
  lookAt,
  markers,
  markerOptions,
  onTextureLoaded,
  size: initialSize,
}: Props) {
  // merge options with defaults to support incomplete options
  const mergedGlobeOptions = { ...defaultGlobeOptions, ...globeOptions };
  const mergedCameraOptions = { ...defaultCameraOptions, ...cameraOptions };
  const mergedLightOptions = { ...defaultLightOptions, ...lightOptions };
  const mergedMarkerOptions = { ...defaultMarkerOptions, ...markerOptions };

  const [state, dispatch] = useReducer(reducer, {});
  const { activeMarker, activeMarkerObject } = state;
  const { activeScale } = mergedMarkerOptions;
  const previousActiveMarkerObject = useRef<any>();

  // animate the marker on mouse move
  useEffect(() => {
    if (previousActiveMarkerObject.current) {
      const object = previousActiveMarkerObject.current;
      const from: Position= [activeScale, activeScale, activeScale];
      tween(from, [1, 1, 1], 200, ['Cubic', 'InOut'], () => {
        object.scale.set(...from);
      });
      previousActiveMarkerObject.current = undefined;
    }
    if (activeMarkerObject) {
      const object = activeMarkerObject;
      const from: Position= [1, 1, 1];
      tween(from, [activeScale, activeScale, activeScale], 200, ['Cubic', 'InOut'], () => {
        object.scale.set(...from);
      });
      previousActiveMarkerObject.current = activeMarkerObject;
    }
  }, [activeMarkerObject]);

  // cache event handlers
  const handleMouseOverMarker = useEventCallback(
    (marker: Marker, markerObject: THREE.Object3D) => {
      dispatch({
        type: ActionType.SetActiveMarker,
        payload: {
          marker,
          markerObject,
        },
      });
    },
  );

  // initialize THREE instances
  const [rendererRef, canvasRef] = useRenderer(initialSize);
  const globeRef = useGlobe(mergedGlobeOptions, onTextureLoaded);
  const [cameraRef, orbitControlsRef] = useCamera(
    mergedCameraOptions,
    mergedLightOptions,
    defaultFocusOptions,
    rendererRef,
    initialSize,
    lookAt,
    focus,
  );
  const markersRef = useMarkers(markers, mergedMarkerOptions, {
    onMouseOver: handleMouseOverMarker,
  });

  // handle scene and rendering loop
  useEffect(() => {
    const renderer = rendererRef.current;
    const globe = globeRef.current;
    const camera = cameraRef.current;
    let animationFrameID: number;

    // create scene
    const scene = new Scene() as types.InteractableScene;
    globe.add(markersRef.current);
    scene.add(camera);
    scene.add(globe);

    // initialize interaction events
    new Interaction(renderer, scene, camera);
    scene.on('mousemove', event => {
      event.stopPropagation();
      if (previousActiveMarkerObject.current) {
        dispatch({
          type: ActionType.SetActiveMarker,
          payload: {
            activeMarker: undefined,
            activeMarkerObject: undefined,
          },
        });
      }
    });

    function animate() {
      renderer.render(scene, cameraRef.current);
      TWEEN.update();
      orbitControlsRef.current.update();
      animationFrameID = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameID) {
        cancelAnimationFrame(animationFrameID);
      }
    };
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

ReactGlobe.defaultProps = {
  animations: [],
  cameraOptions: defaultCameraOptions,
  focusOptions: defaultFocusOptions,
  globeOptions: defaultGlobeOptions,
  lightOptions: defaultLightOptions,
  lookAt: [1.3521, 103.8198],
  markers: [],
  markerOptions: defaultMarkerOptions,
};

export default ReactGlobe;
