<template>
  <div id="app">
    <button id="Ellipse">Ellipse</button>
    <button id="Rectangle">Rectangle</button>
    <button id="Star">Star</button>
    <button id="Arrow">Arrow</button>
    <button id="FreeLine">FreeLine</button>
    <button id="Marker">Marker</button>

    <hr />

    <div id="map"></div>
  </div>
</template>

<script>
import Plot from "./components/Plot";

export default {
  name: "App",
  mounted() {
    const pl = new Plot({ el: "map" });

    document.querySelector("#Ellipse").addEventListener("click", () => {
      pl.plot("Ellipse");
    });

    document.querySelector("#Rectangle").addEventListener("click", () => {
      pl.plot("Rectangle");
    });

    document.querySelector("#Star").addEventListener("click", () => {
      pl.plot("Star");
    });

    document.querySelector("#Arrow").addEventListener("click", () => {
      pl.plot("Arrow");
    });

    document.querySelector("#FreeLine").addEventListener("click", () => {
      pl.plot("FreeLine");
    });

    document.querySelector("#Marker").addEventListener("click", () => {
      pl.plot("Marker");
    });
  },
  components: {},
};
</script>

<style>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  touch-action: none;
  user-select: none;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  width: 100%;
  height: 100%;
}
#map {
  width: 100%;
  height: 100%;
}
</style>
