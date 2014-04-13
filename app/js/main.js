var map = L.map('map',{center: [37.8, -96.9], zoom: 3})
  .addLayer(new L.TileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-vyofok3q/{z}/{x}/{y}.png"));

var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");
var fireScale = d3.scale.pow().exponent(.5).domain([0, 1000, 10000, 56000, 23000000]);
var colorScale = d3.scale.linear().domain([1400, 1800, 1860, 1940, 2015]);

d3.json("js/mtbs-fires.json", function(collection) {

  var transform = d3.geo.transform({point: projectPoint});
  var path = d3.geo.path().projection(transform);

  var fires = [];
  collection.features.forEach(function(d) {
    d.name = d.properties.FIRENAME;
    d.year = +d.properties.FIRE_YEAR;
    d.area = +d.properties.R_ACRES;
    fires.push(d);
  });

  colorScale.range(["#FFFF66", "#FFFF00", "#E68000", "#D94000", "#CC0000"]);
  fireScale.range([2.5, 3, 4, 5, 10]);

  var feature = g.selectAll("path")
    //here's where we attach the data for now.
    .data(fires)
    .enter().append("path")
    .style("fill", function(d) {return colorScale(d.area)});

  map.on("viewreset", reset);
  reset();

  // Reposition the SVG to cover the features.
  function reset() {
    var bounds = path.bounds(collection),
      topLeft = bounds[0],
      bottomRight = bounds[1];

    svg.attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[1] + "px");

    g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

    feature.attr("d", path);
  }

  // Use Leaflet to implement a D3 geometric transformation.
  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
});
