import React, {Component, SyntheticEvent} from 'react';
import {requireNativeComponent, findNodeHandle, UIManager, StyleProp, ViewStyle, Platform, NativeModules, ImageSourcePropType, Image,} from 'react-native';

const RNNaverMapView = requireNativeComponent('RNNaverMapView');
const RNNaverMapMarker = requireNativeComponent('RNNaverMapMarker');
const RNNaverMapPathOverlay = requireNativeComponent('RNNaverMapPathOverlay');
const RNNaverMapPolylineOverlay = requireNativeComponent('RNNaverMapPolylineOverlay');
const RNNaverMapCircleOverlay = requireNativeComponent('RNNaverMapCircleOverlay');

export interface Coord {
    latitude: number;
    longitude: number;
}

export const TrackingMode = {
    None: 0,
    NoFollow: 1,
    Follow: 2,
    Face: 3,
};

export const MapType = {
    Basic: 0,
    Navi: 1,
    Satellite: 2,
    Hybrid: 3,
    Terrain: 4,
};

export const LayerGroup = {
    LAYER_GROUP_BUILDING: 'building',
    LAYER_GROUP_TRANSIT: 'transit',
    LAYER_GROUP_BICYCLE: 'bike',
    LAYER_GROUP_TRAFFIC: 'ctt',
    LAYER_GROUP_CADASTRAL: 'landparcel',
    LAYER_GROUP_MOUNTAIN: 'mountain',
};

export enum Gravity {
    NO_GRAVITY = 0x0000,
    AXIS_SPECIFIED = 0x0001,
    AXIS_PULL_BEFORE = 0x0002,
    AXIS_PULL_AFTER = 0x0004,
    AXIS_X_SHIFT = 0,
    AXIS_Y_SHIFT = 4,
    TOP = (AXIS_PULL_BEFORE | AXIS_SPECIFIED) << AXIS_Y_SHIFT,
    BOTTOM = (AXIS_PULL_AFTER | AXIS_SPECIFIED) << AXIS_Y_SHIFT,
    LEFT = (AXIS_PULL_BEFORE | AXIS_SPECIFIED) << AXIS_X_SHIFT,
    RIGHT = (AXIS_PULL_AFTER | AXIS_SPECIFIED) << AXIS_X_SHIFT,
    CENTER_VERTICAL = AXIS_SPECIFIED << AXIS_Y_SHIFT,
    CENTER_HORIZONTAL = AXIS_SPECIFIED << AXIS_X_SHIFT,
}

export interface Rect {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}

export interface NaverMapViewProps {
    style?: StyleProp<ViewStyle>;
    center?: Coord & { zoom?: number; tilt?: number; bearing?: number };
    tilt?: number;
    bearing?: number;
    mapPadding?: Rect;
    logoMargin?: Rect;
    logoGravity?: Gravity;
    onInitialized?: Function;
    onCameraChange?: (event: {
        latitude: number;
        longitude: number;
        zoom: number;
    }) => void;
    onMapClick?: (event: {
        x: number;
        y: number;
        latitude: number;
        longitude: number;
    }) => void;
    onMarkerClick?: (event: {
        x: number;
        y: number;
        latitude: number;
        longitude: number;
    }) => void;
    onTouch?: () => void;
    showsMyLocationButton?: boolean;
    compass?: boolean;
    scaleBar?: boolean;
    zoomControl?: boolean;
    mapType?: number;
    buildingHeight?: number;
    nightMode?: boolean;
}

export default class NaverMapView extends Component<NaverMapViewProps> {
    ref?: RNNaverMapView;
    nodeHandle?: null | number;

    private resolveRef = (ref: RNNaverMapView) => {
        this.ref = ref;
        this.nodeHandle = findNodeHandle(ref);
    };

    animateToTwoCoordinates = (c1: Coord, c2: Coord) => {
        this.dispatchViewManagerCommand('animateToTwoCoordinates', [c1, c2]);
    };

    animateToCoordinates = (coords: Coord[], bounds?: { top: number, bottom: number, left: number, right: number, }) => {
        this.dispatchViewManagerCommand("animateToCoordinates", [coords, bounds]);
    };

    watchCameraChange = () => {
        this.dispatchViewManagerCommand('watchCameraChange', []);
    };

    setLocationTrackingMode = (mode: number) => {
        this.dispatchViewManagerCommand('setLocationTrackingMode', [mode]);
    };

    showsMyLocationButton = (show: boolean) => {
        this.dispatchViewManagerCommand('showsMyLocationButton', [show]);
    };

    private dispatchViewManagerCommand = (command: string, arg: any) => {
        return Platform.select({
            // @ts-ignore
            android: () => UIManager.dispatchViewManagerCommand(
                this.nodeHandle,
                // @ts-ignore
                UIManager.getViewManagerConfig('RNNaverMapView').Commands[command],
                arg,
            ),
            ios: () =>
                NativeModules[`RNNaverMapView`][command](this.nodeHandle, ...arg),
        })();
    };

    handleOnCameraChange = (event: SyntheticEvent<{}, {
        latitude: number;
        longitude: number;
        zoom: number;
    }>) => this.props.onCameraChange && this.props.onCameraChange(event.nativeEvent);

    handleOnMapClick = (event: SyntheticEvent<{}, {
        x: number;
        y: number;
        latitude: number;
        longitude: number;
    }>) => this.props.onMapClick && this.props.onMapClick(event.nativeEvent);

    render() {
        const {
            onInitialized,
            center,
            tilt,
            bearing,
            mapPadding,
            logoMargin,
            nightMode,
        } = this.props;

        return <RNNaverMapView
            ref={this.resolveRef}
            {...this.props}
            onInitialized={onInitialized}
            center={center}
            mapPadding={mapPadding}
            logoMargin={logoMargin}
            tilt={tilt}
            bearing={bearing}
            nightMode={nightMode}
            onCameraChange={this.handleOnCameraChange}
            onMapClick={this.handleOnMapClick}
        />
    }
}

interface RNNaverMapView extends React.Component<{}, any> {

}

interface MarkerProps {
    coordinate: Coord;
    anchor?: { x: number; y: number };
    pinColor?: string;
    rotation?: number;
    flat?: boolean;
    image?: ImageSourcePropType;
    width?: number;
    height?: number;
    alpha?: number;
    animated?: boolean;
    caption?: {
        text?: string;
        align?: number;
        textSize?: number;
        color?: number;
        haloColor?: number;
    };
    subCaption?: {
        text?: string;
        textSize?: number;
        color?: number;
        haloColor?: number;
    };
    onClick?: () => void;
}

export class Marker extends Component<MarkerProps> {
    render() {
        return <RNNaverMapMarker {...this.props} image={getImageUri(this.props.image)}/>
    }
}

interface CircleProps {
    coordinate: Coord;
    radius?: number;
    color?: string;
    outlineWidth?: number;
    outlineColor?: string;
    zIndex?: number;
}

export class Circle extends Component<CircleProps> {
    render() {
        return <RNNaverMapCircleOverlay {...this.props} />;
    }
}

interface PolylineProps {
    coordinates: Coord[];
    strokeWidth?: number;
    strokeColor?: string;
}

export class Polyline extends Component<PolylineProps> {
    render() {
        return <RNNaverMapPolylineOverlay {...this.props} />;
    }
}

interface PathProps {
    coordinates: Coord[];
    width?: number;
    color?: string;
    outlineWidth?: number;
    passedColor?: string;
    outlineColor?: string;
    passedOutlineColor?: string;
    pattern?: ImageSourcePropType;
    patternInterval?: number;
    progress?: number;
    zIndex?: number;
}

export class Path extends Component<PathProps> {
    render() {
        return <RNNaverMapPathOverlay
            {...this.props}
            pattern={getImageUri(this.props.pattern)}
        />
    }
}

function getImageUri(src?: ImageSourcePropType): string | null {
    let imageUri = null;
    if (src) {
        let image = Image.resolveAssetSource(src) || {uri: null};
        imageUri = image.uri;
    }
    return imageUri;
}
