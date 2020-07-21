import { Marker } from './types';

export enum ActionType {
  SetActiveMarker = 'SET_ACTIVE_MANAGER',
}

interface Action {
  type: ActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export interface State {
  activeMarker?: Marker;
  activeMarkerObject?: THREE.Object3D;
}

export default function reducer(state: State, action: Action): State {
  const { payload, type } = action;
  switch (type) {
    case ActionType.SetActiveMarker:
      return {
        ...state,
        activeMarker: payload.marker,
        activeMarkerObject: payload.markerObject,
      };
    default:
      return state;
  }
}
