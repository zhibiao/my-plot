import { LineString, Polygon, Point } from "ol/geom";
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

class FreeLine extends LineString {
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
      type: "LineString",
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: "#f00",
        }),
      }),
      geometryFunction: FreeLine.geometryFunction,
    });
  }

  static generatePoints(coordinates) {
    return coordinates;
  }

  static geometryFunction(coordinates, geometry) {
    const points = FreeLine.generatePoints(coordinates);
    if (!geometry) {
      geometry = new FreeLine(points);
    } else {
      geometry.setCoordinates(points);
    }
    return geometry;
  }
}

export default FreeLine;
