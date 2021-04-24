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
      const extent = this.feature.getGeometry().getExtent();
      const newExtent = boundingExtent([getTopLeft(extent), event.coordinate]);
      const extentCoordinates = [
        getTopLeft(newExtent),
        getTopRight(newExtent),
        getBottomRight(newExtent),
        getBottomLeft(newExtent),
      ];
      dottedBox.getGeometry().setCoordinates([extentCoordinates]);
      closePod.getGeometry().setCoordinates(extentCoordinates[0]);
      Ellipse.geometryFunction(
        [extentCoordinates[0], extentCoordinates[2]],
        this.feature.getGeometry()
      );
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

class Ellipse extends Polygon {
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
      type: "Circle",
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: "#f00",
        }),
      }),
      geometryFunction: Ellipse.geometryFunction,
    });
  }

  static generatePoints(center, majorRadius, minorRadius) {
    let x,
      y,
      angle,
      points = [];
    for (let i = 0; i <= 100; i++) {
      angle = (Math.PI * 2 * i) / 100;
      x = center[0] + majorRadius * Math.cos(angle);
      y = center[1] + minorRadius * Math.sin(angle);
      points.push([x, y]);
    }
    return points;
  }

  static geometryFunction(coordinates, geometry) {
    const [start, end] = coordinates;
    const center = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    const majorRadius = Math.abs((start[0] - end[0]) / 2);
    const minorRadius = Math.abs((start[1] - end[1]) / 2);
    const points = Ellipse.generatePoints(center, majorRadius, minorRadius);
    if (!geometry) {
      geometry = new Ellipse([points]);
    } else {
      geometry.setCoordinates([points]);
    }
    return geometry;
  }
}

export default Ellipse;
