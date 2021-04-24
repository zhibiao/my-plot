import { Polygon, Point } from "ol/geom";
import { Collection } from "ol";
import { Translate, Draw } from "ol/interaction";
import { Style, Stroke, Fill, Icon } from "ol/style";
import { Feature } from "ol";
import {
  getTopLeft,
  getTopRight,
  getBottomRight,
  getBottomLeft,
  boundingExtent,
  getWidth,
  getHeight,
  getCenter,
} from "ol/extent";

class Modify {
  constructor(options) {
    const { map, source, feature } = options;
    this.map = map;
    this.source = source;
    this.feature = feature;
    this.features = [];
    this.interactions = [];
  }

  getDistance(start, end) {
    const [x0, y0] = start,
      [x1, y1] = end;
    const dx = Math.abs(x1 - x0),
      dy = Math.abs(y1 - y0);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  }

  getAngle(start, end) {
    const [x0, y0] = start,
      [x1, y1] = end;
    const dx = Math.abs(x1 - x0),
      dy = Math.abs(y1 - y0);
    return Math.atan(dy / dx) * (180 / Math.PI);
  }

  getExtent() {
    const image = this.feature.getStyle().getImage();
    const imageScale = image.getScale();
    const imageSize = image.getSize();
    const centerCoordinates = this.feature.getGeometry().getCoordinates();
    const imageCenter = this.map.getPixelFromCoordinate(centerCoordinates);
    const imageWidth = imageSize[0] * imageScale,
      imageHeight = imageSize[1] * imageScale;
    const [imageCenterX, imageCenterY] = imageCenter;
    const extent = [
      imageCenterX - imageWidth / 2,
      imageCenterY - imageHeight / 2,
      imageCenterX + imageWidth / 2,
      imageCenterY + imageHeight / 2,
    ];
    const pixelExtent = [getTopLeft(extent), getBottomRight(extent)];
    const coordinasteExtent = pixelExtent.map((coordinate) => {
      return this.map.getCoordinateFromPixel(coordinate);
    });
    const [[minx, miny], [maxx, maxy]] = coordinasteExtent;
    return [minx, miny, maxx, maxy];
  }

  activate() {
    const extent = this.getExtent();
    const extentCoordinates = [
      getTopLeft(extent),
      getTopRight(extent),
      getBottomRight(extent),
      getBottomLeft(extent),
    ];
    const dottedBox = new Feature(new Polygon([extentCoordinates]));
    dottedBox.set("type", "dottedBox");
    dottedBox.setStyle(
      new Style({
        fill: new Fill({
          color: "rgba(0, 100, 0, 0.1)",
        }),
        stroke: new Stroke({
          width: 1,
          color: "#f00",
          lineDash: [5, 5, 5, 5],
        }),
      })
    );
    this.source.addFeature(dottedBox);
    this.features.push(dottedBox);

    const closePod = new Feature(new Point(extentCoordinates[0]));
    closePod.set("type", "closePod");
    closePod.destroy = () => {
      this.deactivate();
      this.source.removeFeature(this.feature);
    };
    closePod.setStyle(
      new Style({
        image: new Icon({
          src: "close.png",
        }),
      })
    );
    this.source.addFeature(closePod);
    this.features.push(closePod);

    const scalePod = new Feature(new Point(extentCoordinates[2]));
    scalePod.set("type", "scalePod");
    scalePod.setStyle(
      new Style({
        image: new Icon({
          src: "scale.png",
        }),
      })
    );
    this.source.addFeature(scalePod);
    this.features.push(scalePod);

    const dottedBoxTranslate = new Translate({
      features: new Collection([this.feature, dottedBox, scalePod, closePod]),
      filter: (target) => {
        return target != closePod && target != scalePod;
      },
    });
    this.map.addInteraction(dottedBoxTranslate);
    this.interactions.push(dottedBoxTranslate);

    const scalePodTranslate = new Translate({
      features: new Collection([scalePod]),
    });
    scalePodTranslate.on("translating", (event) => {
      const center = this.map.getPixelFromCoordinate(
        this.feature.getGeometry().getCoordinates()
      );
      const end = this.map.getPixelFromCoordinate(event.coordinate);
      const boxWidth = Math.sqrt(
        Math.pow(this.getDistance(center, end), 2) / 2
      );

      const image = this.feature.getStyle().getImage();
      const imageSize = image.getSize();
      image.setScale((boxWidth * 2) / imageSize[0]);

      const extent = this.getExtent();
      const extentCoordinates = [
        getTopLeft(extent),
        getTopRight(extent),
        getBottomRight(extent),
        getBottomLeft(extent),
      ];

      dottedBox.getGeometry().setCoordinates([extentCoordinates]);
      closePod.getGeometry().setCoordinates(extentCoordinates[0]);
      scalePod.getGeometry().setCoordinates(extentCoordinates[2]);
    });
    this.map.addInteraction(scalePodTranslate);
    this.interactions.push(scalePodTranslate);
  }
  deactivate() {
    for (const feature of this.features) {
      this.source.removeFeature(feature);
    }
    this.features = [];

    for (const interaction of this.interactions) {
      this.map.removeInteraction(interaction);
    }
    this.interactions = [];
  }
}

class Marker extends Point {
  constructor(coordinates) {
    super(coordinates);
  }

  static generateModify(options) {
    return new Modify(options);
  }

  static draw(options) {
    const { source } = options;
    return new Draw({
      source,
      freehand: true,
      type: "Point",
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: "#f00",
        }),
      }),
      geometryFunction: Marker.geometryFunction,
    });
  }

  static generatePoints(coordinates) {
    return coordinates;
  }

  static geometryFunction(coordinates, geometry) {
    const points = Marker.generatePoints(coordinates);
    if (!geometry) {
      geometry = new Marker(points);
    } else {
      geometry.setCoordinates(points);
    }
    return geometry;
  }
}

export default Marker;
