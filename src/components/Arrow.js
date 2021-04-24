import { Polygon, Point, LineString } from "ol/geom";
import { Collection } from "ol";
import { Translate, Draw } from "ol/interaction";
import { createBox } from "ol/interaction/Draw";

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

  activate() {
    const extent = this.feature.getGeometry().getExtent();
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

    const featureCoordinates = this.feature.getGeometry().getCoordinates();
    const closePod = new Feature(new Point(featureCoordinates[0]));
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

    const scalePod = new Feature(new Point(featureCoordinates[1]));
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
      const firstPoint = this.feature.getGeometry().getCoordinates()[0];
      Arrow.geometryFunction(
        [firstPoint, event.coordinate],
        this.feature.getGeometry()
      );
      const featureCoordinates = this.feature.getGeometry().getCoordinates();
      closePod.getGeometry().setCoordinates(featureCoordinates[0]);
      scalePod.getGeometry().setCoordinates(featureCoordinates[1]);

      const newExtent = boundingExtent(featureCoordinates);
      const extentCoordinates = [
        getTopLeft(newExtent),
        getTopRight(newExtent),
        getBottomRight(newExtent),
        getBottomLeft(newExtent),
      ];
      dottedBox.getGeometry().setCoordinates([extentCoordinates]);
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

class Arrow extends LineString {
  constructor(coordinates) {
    super(coordinates);
  }

  static getDistance(start, end) {
    const [x0, y0] = start,
      [x1, y1] = end;
    const dx = Math.abs(x1 - x0),
      dy = Math.abs(y1 - y0);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  }

  static getThirdPoint(startPnt, endPnt, angle, distance, clockWise) {
    let azimuth = Arrow.getAzimuth(startPnt, endPnt);
    let alpha = clockWise ? azimuth + angle : azimuth - angle;
    let dx = distance * Math.cos(alpha);
    let dy = distance * Math.sin(alpha);
    return [endPnt[0] + dx, endPnt[1] + dy];
  }

  static getAzimuth(startPoint, endPoint) {
    let azimuth;
    let angle = Math.asin(
      Math.abs(endPoint[1] - startPoint[1]) /
        Arrow.getDistance(startPoint, endPoint)
    );
    if (endPoint[1] >= startPoint[1] && endPoint[0] >= startPoint[0]) {
      azimuth = angle + Math.PI;
    } else if (endPoint[1] >= startPoint[1] && endPoint[0] < startPoint[0]) {
      azimuth = Math.PI * 2 - angle;
    } else if (endPoint[1] < startPoint[1] && endPoint[0] < startPoint[0]) {
      azimuth = angle;
    } else if (endPoint[1] < startPoint[1] && endPoint[0] >= startPoint[0]) {
      azimuth = Math.PI - angle;
    }
    return azimuth;
  }

  static generateModify(options) {
    return new Modify(options);
  }

  static draw(options) {
    const { source } = options;
    return new Draw({
      source,
      freehand: true,
      type: "Circle",
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: "#f00",
        }),
      }),
      geometryFunction: Arrow.geometryFunction,
    });
  }

  static generatePoints(coordinates) {
    const [start, end] = coordinates;
    const distance = Arrow.getDistance(start, end);

    const maxArrowLength = 3000000;
    const arrowLengthScale = 5;

    let len = distance / arrowLengthScale;
    len = len > maxArrowLength ? maxArrowLength : len;

    const leftPnt = Arrow.getThirdPoint(start, end, Math.PI / 6, len, false);
    const rightPnt = Arrow.getThirdPoint(start, end, Math.PI / 6, len, true);

    return [start, end, leftPnt, end, rightPnt];
  }

  static geometryFunction(coordinates, geometry) {
    const points = Arrow.generatePoints(coordinates);
    if (!geometry) {
      geometry = new Arrow(points);
    } else {
      geometry.setCoordinates(points);
    }
    return geometry;
  }
}

export default Arrow;
