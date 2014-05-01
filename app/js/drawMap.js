var map = L.map('map',{center: [30.4486736, -127.88085937], zoom: 3})
.addLayer(new L.TileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-vyofok3q/{z}/{x}/{y}.png"));

map._initPathRoot();

var svg = d3.select("#map").select("svg"),
    g = svg.append("g");
var circles;

// Use Leaflet to implement a D3 geometric transformation.
function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

// var fireScale = d3.scale.pow().exponent(.5).domain([0, 1000, 10000, 56000, 23000000]);
var fireScale = d3.scale.linear().domain([300, 160000]);

var colorScale = d3.scale.linear().domain([1984, 2012]);

var fires;


d3.json("js/mtbs-fires.json", function(collection) {


  var transform = d3.geo.transform({point: projectPoint});
  var path = d3.geo.path().projection(transform);

  fires = [];

  collection.features.forEach(function(d, i) {
    d.name = d.properties.FIRENAME;
    d.year = +d.properties.FIRE_YEAR;
    d.area = +d.properties.R_ACRES;
    d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
    d.id = i;
    fires.push(d);
  });


  fires.sort(function(a, b){return a.id - b.id;})

  fireScale
  .range([2.5, 3, 4, 5, 10]);

  colorScale
  .range(["#FFFF66", "#CC0000"]);

  var feature = g.selectAll("circle")
  .data(fires)
  .enter().append("circle")
  .attr("r", function(d) { return fireScale(d.area)})
  .attr("id", function(d){return "id" + d.id;})
  .style("fill", function(d){return colorScale(d.year);	});

  map.on("viewreset", update);
  update();

  function update() {
    feature.attr("transform", 
      function(d) { 
        return "translate("+ 
          map.latLngToLayerPoint(d.LatLng).x +","+ 
          map.latLngToLayerPoint(d.LatLng).y +")";
      }
    );
  }

  var lb = 1.370;

  var firesCF = crossfilter(fires),
    all = firesCF.groupAll(),
    year = firesCF.dimension(function(d){return d.year;}),
    // years = year.group(function(d){return Math.floor(d/10)*10;}),
    years = year.group(function(d){return d;}),
    area = firesCF.dimension(function(d){return d.area}),
    areas = area.group(function(d){ 
      var rv = Math.pow(lb, Math.floor(Math.log(d)/Math.log(lb))) 
      return rv;
    });

    var cartoDbId = firesCF.dimension(function(d){return d.id;});
    var cartoDbIds = cartoDbId.group();

  var charts = [
    barChart()
    .dimension(year)
    .group(years)
    .x(d3.scale.linear()
      .domain([1984,2012])
      .rangeRound([-1, 20*24-5])),

    barChart()
    .dimension(area)
    .group(areas)
    .x(d3.scale.log().base([lb])
      .domain([1,16000000])
      .rangeRound([0,20*24]))
  ];

  var chart = d3.selectAll(".chart")
  .data(charts)
  .each(function(chart){chart.on("brush", renderAll).on("brushend", renderAll)});

  d3.selectAll("#total")
  .text(firesCF.size());

  function render(method){
    d3.select(this).call(method);
  }


  lastFilterArray = [];
  fires.forEach(function(d, i){
    lastFilterArray[i] = 1;
  });

  function renderAll(){
    chart.each(render);

    var filterArray = cartoDbIds.all();
    filterArray.forEach(function(d, i){
      if (d.value != lastFilterArray[i]){
        lastFilterArray[i] = d.value;
        d3.select("#id" + d.key).transition().duration(500)
        .attr("r", d.value == 1 ? 2*fireScale(fires[i].area) : 0)
        .transition().delay(550).duration(500)
        .attr("r", d.value == 1 ? fireScale(fires[i].area) : 0);

      }
    })

    d3.select("#active").text(all.value());
  }

	window.reset = function(i){
		charts[i].filter(null);
		renderAll();
	}

	renderAll();
});



