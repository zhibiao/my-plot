import Map from "ol/Map";
import View from "ol/View";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Stroke, Icon, Fill, Circle as CircleStyle } from "ol/style";

import Select from "./Select";
import Ellipse from "./Ellipse";
import Rectangle from "./Rectangle";
import FreeLine from "./FreeLine";
import Marker from "./Marker";
import Arrow from "./Arrow";
import Star from "./Star";

class Plot {
  constructor(options) {
    this.source = new VectorSource({
      wrapX: false,
    });
    this.vector = new VectorLayer({
      source: this.source,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "#00f",
          width: 4,
        }),
        image: new CircleStyle({
          radius: 32,
          fill: new Fill({
            color: "#ffcc33",
          }),
        }),
      }),
    });

    this.map = new Map({
      controls: [],
      interactions: [],
      target: options.el,
      layers: [this.vector],
      view: new View({
        center: [0, 0],
        zoom: 1,
        maxZoom: 1,
      }),
    });

    this.select = new Select({
      style: false,
      hitTolerance: 10,
      filter: (feature) => {
        if (feature.get("type") == "closePod") {
          feature.destroy();
        }
        return [
          "Ellipse",
          "Rectangle",
          "FreeLine",
          "Marker",
          "Arrow",
          "Star",
        ].includes(feature.get("type"));
      },
    });

    this.select.on("select", (event) => {
      for (const feature of event.selected) {
        feature.modify.activate();
      }

      for (const feature of event.deselected) {
        feature.modify.deactivate();
      }
    });
    this.map.addInteraction(this.select);
  }

  plot(type) {
    this.map.removeInteraction(this.draw);
    switch (type) {
      case "Ellipse":
        {
          this.draw = Ellipse.draw({ source: this.source });
          this.draw.on("drawend", ({ feature }) => {
            feature.set("type", "Ellipse");
            feature.modify = Ellipse.generateModify({
              map: this.map,
              source: this.source,
              feature,
            });
          });
          this.map.addInteraction(this.draw);
        }
        break;

      case "Rectangle":
        {
          this.draw = Rectangle.draw({ source: this.source });
          this.draw.on("drawend", ({ feature }) => {
            feature.set("type", "Rectangle");
            feature.modify = Rectangle.generateModify({
              map: this.map,
              source: this.source,
              feature,
            });
          });
          this.map.addInteraction(this.draw);
        }
        break;

      case "FreeLine":
        {
          this.draw = FreeLine.draw({ source: this.source });
          this.draw.on("drawend", ({ feature }) => {
            feature.set("type", "FreeLine");
            feature.modify = FreeLine.generateModify({
              map: this.map,
              source: this.source,
              feature,
            });
          });
          this.map.addInteraction(this.draw);
        }
        break;

      case "Marker":
        {
          this.draw = Marker.draw({ source: this.source });
          this.draw.on("drawstart", () => {});
          this.draw.on("drawend", ({ feature }) => {
            feature.set("type", "Marker");
            feature.setStyle(
              new Style({
                image: new Icon({
                  src: "cat.png",
                }),
              })
            );
            this.map.removeInteraction(this.draw);
            feature.modify = Marker.generateModify({
              map: this.map,
              source: this.source,
              feature,
            });
          });
          this.map.addInteraction(this.draw);
        }
        break;

      case "Arrow":
        {
          this.draw = Arrow.draw({ source: this.source });
          this.draw.on("drawstart", () => {});
          this.draw.on("drawend", ({ feature }) => {
            feature.set("type", "Arrow");
            feature.modify = Arrow.generateModify({
              map: this.map,
              source: this.source,
              feature,
            });
          });
          this.map.addInteraction(this.draw);
        }
        break;

      case "Star":
        {
          this.draw = Star.draw({ source: this.source });
          this.draw.on("drawstart", () => {});
          this.draw.on("drawend", ({ feature }) => {
            feature.set("type", "Star");
            feature.modify = Star.generateModify({
              map: this.map,
              source: this.source,
              feature,
            });
          });
          this.map.addInteraction(this.draw);
        }
        break;
    }
  }
}

export default Plot;
