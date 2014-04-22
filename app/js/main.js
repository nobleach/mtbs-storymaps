var margin = {top: 10, right: 20, bottom: 30, left: 80},
  w = 380 - margin.left - margin.right,
  h = 150 - margin.top - margin.bottom,
  brashDirty,
  feature;

var map = L.map('map',{center: [30.4486736, -127.88085937], zoom: 3})
  .addLayer(new L.TileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-vyofok3q/{z}/{x}/{y}.png"));

var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");
var fireScale = d3.scale.pow().exponent(.5).domain([0, 1000, 10000, 56000, 23000000]);
var colorScale = d3.scale.linear().domain([0,100,1000,10000, 100000]);

var yearHist = d3.select('#content').append("svg").attr({
  width:w + margin.left + margin.right,
  height:h + margin.top + margin.bottom
});

var areaHist = d3.select('#content').append("svg").attr({
  width:w + margin.left + margin.right,
  height:h + margin.top + margin.bottom
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

  //scales
  var numHeightScale = d3.scale.linear()
    .domain([0, d3.max(firesByYear, function(d) { return d.numFires; })])
    .range([h, 0]);

  var areaHeightScale = d3.scale.linear()
    .domain([0, d3.max(firesByYear, function(d) { return d.area; })])
    .range([h, 0]);

  var areaYearScale = d3.scale.linear()
    .domain(d3.extent(firesByYear, function(d) {return d.year})) 
    .range([0, w]);

  var yAreaAxis = d3.svg.axis().scale(areaHeightScale).orient("left");
  var yNumAxis = d3.svg.axis().scale(numHeightScale).orient("left");
  var xAreaAxis = d3.svg.axis().scale(areaYearScale).orient("bottom").ticks(5).tickFormat(d3.format(""));

  //brush
  var brush = d3.svg.brush()
    .x(areaYearScale)
    .extent([1984, 2013])
    .on("brushend", brushed);

  colorScale.range(["#FFFF66", "#FFFF00", "#E68000", "#D94000", "#CC0000"]);
  
  /*************** main map features **************************/ 
  function update(selection) {

    // binding the data
    feature = g.selectAll(".path")
      .data(selection);

    // exit selection
    feature
     .exit()
     .remove();

    // enter selection
    feature
      .enter()
      .append("path")
        .attr("class","path");

    // update selection
    feature
      .style("fill", function(d) {return colorScale(d.area)});

    // update selection
    feature
      .style("fill", function(d) {return colorScale(d.area)})
      .attr("d",path); // this was the missing piece!
  }

  map.on("viewreset", reset);
  update(fires);
  reset();

  yearHist.append("g").attr({
    "class": "axis",
    transform: "translate(" + [margin.left, 0] + ")"
  }).call(yNumAxis);

  yearHist.append("g").attr({
    "class": "axis",
    transform: "translate("+[margin.left,h]+")"
  }).call(xAreaAxis);

  yearHist.selectAll("rect")
    .data(firesByYear)
    .enter()
    .append("rect")
    .attr({
      x:function(d, i) { return w + margin.left - areaYearScale(d.year);},
      y:function(d, i) { return h - (numHeightScale(d.numFires));},
      width:9,
      height: function(d) {return numHeightScale(d.numFires);},
      fill: "orange"
    });


  var gyBrush = yearHist.append("g")
      .attr({
        "class": "brush",
        transform: "translate(" + [margin.left, 0] + ")"
      })
      .call(brush);

  gyBrush.selectAll("rect")
      .attr("height", h);

  areaHist.append("g").attr({
    "class": "axis",
    transform: "translate(" + [margin.left, 0] + ")"
  }).call(yAreaAxis);

  areaHist.append("g").attr({
    "class": "axis",
    transform: "translate("+[margin.left,h]+")"

  }).call(xAreaAxis);

  areaHist.selectAll("rect")
    .data(firesByYear)
    .enter()
    .append("rect")
    .attr({
      x:function(d, i) { return w + margin.left - areaYearScale(d.year);},
      y:function(d, i) { return h - (areaHeightScale(d.area));},
      width:9,
      height: function(d) {return areaHeightScale(d.area);},
      fill: "orange"
    });

  var gBrush = areaHist.append("g")
      .attr({
        "class": "brush",
        "id": "areaBrush",
        transform: "translate(" + [margin.left, 0] + ")"
      })
      .call(brush);

  gBrush.selectAll("rect")
      .attr("height", h);

  function brushed() {
    var extent0 = brush.extent();
    startYear = Math.floor(extent0[0]);
    endYear = Math.floor(extent0[1]);

    var selectedFires = fires.filter(function(fire) {
      if(fire.year >= startYear && fire.year <= endYear) return fire;
    });

    update(selectedFires);
  }

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
