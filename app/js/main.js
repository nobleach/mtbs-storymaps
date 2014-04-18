var map = L.map('map',{center: [30.4486736, -127.88085937], zoom: 3})
  .addLayer(new L.TileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-vyofok3q/{z}/{x}/{y}.png"));

var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");
var fireScale = d3.scale.pow().exponent(.5).domain([0, 1000, 10000, 56000, 23000000]);
var colorScale = d3.scale.linear().domain([0,100,1000,10000, 100000]);

var yearHist = d3.select('#content').append("svg").attr({
  width:300,
  height:150
});

var sep = d3.select("#content").append("div").attr({
  class:'vert-seperator'
});

var areaHist = d3.select('#content').append("svg").attr({
  width:300,
  height:150
});

d3.json("js/mtbs-fires.json", function(collection) {

  var transform = d3.geo.transform({point: projectPoint});
  var path = d3.geo.path().projection(transform);

  var fires = [];
  var firesByYear = [];
  var firesSeen = {};

  collection.features.forEach(function(d) {
    d.name = d.properties.FIRENAME;
    d.year = +d.properties.FIRE_YEAR;
    d.area = +d.properties.R_ACRES;
    fires.push(d);

    var year = d.year + '';
    if(!firesSeen.hasOwnProperty(year)) {
      firesSeen[year] = {
        area:0,
        numFires:0
      };
    }
    firesSeen[year]['area'] += d.area;
    firesSeen[year]['numFires'] += 1;
  });

  for(var f in firesSeen) {
    var currYear = {};
    currYear.year = f;
    currYear.area = firesSeen[f].area;
    currYear.numFires = firesSeen[f].numFires;
    firesByYear.push(currYear);
  }


  colorScale.range(["#FFFF66", "#FFFF00", "#E68000", "#D94000", "#CC0000"]);
  fireScale.range([2.5, 3, 4, 5, 10]);

  var feature = g.selectAll("path")
    //here's where we attach the data for now.
    .data(fires)
    .enter().append("path")
    .style("fill", function(d) {return colorScale(d.area)});

  map.on("viewreset", reset);
  reset();

  yearHist.selectAll("rect")
    .data(firesByYear)
    .enter()
    .append("rect")
    .attr({
      x:function(d, i) { return i * 10;},
      y:function(d, i) { return 150 - (d.numFires * .1);},
      // y:0,
      width:9,
      height: function(d) {return d.numFires * .1;},
      fill: "orange"
    });

  areaHist.selectAll("rect")
    .data(firesByYear)
    .enter()
    .append("rect")
    .attr({
      x:function(d, i) { return i * 10;},
      y:function(d, i) { return 150 - (d.area * .00001);},
      // y:0,
      width:9,
      height: function(d) {return d.area * .00001;},
      fill: "orange"
    });

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
