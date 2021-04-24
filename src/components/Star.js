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

    const featureCoordinates = this.feature.getGeometry().getCoordinates()[0];
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

    const scalePod = new Feature(new Point(featureCoordinates[6]));
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
      const center = getCenter(extent);
      Star.geometryFunction(
        [center, event.coordinate],
        this.feature.getGeometry()
      );

      const featureCoordinates = this.feature.getGeometry().getCoordinates()[0];
      closePod.getGeometry().setCoordinates(featureCoordinates[0]);
      scalePod.getGeometry().setCoordinates(featureCoordinates[6]);

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

class Star extends Polygon {
  constructor(options) {
    super(options);
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
      geometryFunction: Star.geometryFunction,
    });
  }

  static generatePoints(coordinates) {
    var center = coordinates[0];
    var last = coordinates[coordinates.length - 1];
    var dx = center[0] - last[0];
    var dy = center[1] - last[1];
    var radius = Math.sqrt(dx * dx + dy * dy);
    var rotation = Math.atan2(dy, dx);
    var newCoordinates = [];
    var numPoints = 12;
    for (var i = 0; i < numPoints; ++i) {
      var angle = rotation + (i * 2 * Math.PI) / numPoints;
      var fraction = i % 2 === 0 ? 1 : 0.5;
      var offsetX = radius * fraction * Math.cos(angle);
      var offsetY = radius * fraction * Math.sin(angle);
      newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
    }
    newCoordinates.push(newCoordinates[0].slice());
    return newCoordinates;
  }

  static geometryFunction(coordinates, geometry) {
    const points = Star.generatePoints(coordinates);
    if (!geometry) {
      geometry = new Star([points]);
    } else {
      geometry.setCoordinates([points]);
    }
    return geometry;
  }
}

export default Star;
