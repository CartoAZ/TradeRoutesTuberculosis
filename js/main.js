// (function(){

    //execute script when window is loaded
    window.onload = setMap();

    function setMap(){


      	// //create Albers equal area conic projection centered on France
      	// var projection = d3.geo.conicEqualArea()
        //     // .rotate([40, 0])
        //     .center([73, 30])
        // 		.parallels([-35, 43])
        // 		.scale(800)
        // 		.translate([mapWidth / 2, mapHeight / 2]);
        //
      	// var path = d3.geo.path()
      	// 	  .projection(projection);

        //set variable to access queue.js to parallelize asynchronous data loading
        var q = d3_queue.queue();

        q
            .defer(d3.json, "data/Polygons/Countries.topojson")//load countries outline spatial data
            .defer(d3.json, "data/Polygons/WHO_Regions.topojson")//load WHO regions outline
            .defer(d3.json, "data/Routes/SilkRoad.topojson")//load silk road polyline
            .defer(d3.json, "data/Points/NearTradeHubsSimple.topojson")//load trade hubs
            .await(callback);

        function callback(error, countryData, whoRegionsData, silkRoadData, tradeHubData){
            // console.log(silkRoadData);

            //place graticule on the map
        		// setGraticule(map, path);

            //translate countries topojson with zoom
            var countryJson = topojson.feature(countryData, countryData.objects.Countries).features,
                whoRegionsJson = topojson.feature(whoRegionsData, whoRegionsData.objects.WHO_Regions).features;

            var tradeHubJson = topojson.feature(tradeHubData, tradeHubData.objects.NearTradeHubsSimple)

            //convert topojsons into geojson objects; coastLine is an array full of objects
            var silkRoad = topojson.feature(silkRoadData, silkRoadData.objects["SilkRoad"]).features;

            // console.log(silkRoad);

            //set default height and width of map
            var mapWidth = window.innerWidth * 0.75,
          		  mapHeight = 500;

            //set projection of map
            var projection = d3.geo.mercator()
                .center([130, 10])
                .scale(230)
                // .rotate([0,0]);

            // Create a path generator
            var path = d3.geo.path()
                .projection(projection)
                .pointRadius(2);

            //create new svg container for the map
            var map = d3.select("body").append("svg")
                .attr("class", "map")
                .attr("width", mapWidth)
                .attr("height", mapHeight)

            //create group element to hold everything on map for zooming/panning purposes
            var g = map.append("g");


            // //translate countries topojson for non-zoom
            // var countryJson = topojson.feature(countryData, countryData.objects.Countries),
            //     whoRegionsJson = topojson.feature(whoRegionsData, whoRegionsData.objects.WHO_Regions).features;
            // //add countries to map
        		// var countries = map.append("g")
        		// 	 .attr("class", "countries")
            //   .selectAll("path")
            //     .data(countryJson)
            //     .attr("d", path)
            //     .attr("id", function(d){
            //       // console.log(d.properties);
            //         return d.properties.Country
            //     })
            //
            // //add a path to the coastal states group element to color borders without coloring coastline
            // map.append("path")
            //     .datum(topojson.mesh(countryData, countryData.objects.Countries, function(a, b) { return a !== b; }))
            //     .attr("id", "country-borders")
            //     .attr("d", path);
            //

            // var sphere = g.append("path")
            //     .datum({type: "Sphere"})
            //     .attr("class", "sphere")
            //     .attr("d", path)


            //add countries to map
        		var countries = g.selectAll(".countries")
        			 .data(countryJson)
               .enter()
             .append("path")
                .attr("class", "countries")
                .attr("id", function(d){
                    return d.properties.Country
                })
                .attr("d", path)

            //add world health organization regions to map
            var who_regions = g.selectAll(".who_regions")
               .data(whoRegionsJson)
               .enter()
             .append("path")
                .attr("class", "who_regions")
                .attr("id", function(d){
                    return d.properties.WHO_Region
                })
                .attr("d", path)

                console.log(tradeHubJson);
            // var tradeHubs = g.selectAll(".tradeHubs")
            //     .data(tradeHubJson)
            //     .enter()
            //   .append("path")
            //     .attr("class", "tradeHubs")
            //     .attr("d", path)

            console.log("hello");
            var tradeHubs = g.append("path")
                .datum(tradeHubJson)
                .attr("class", "tradeHubs")
                .attr("d", path)
                // .attr("id", function(d){console.log(d);})



            //draw silk road
            var activeCoast = g.append("g")
                .attr("class", "silk_road")
              .selectAll("path")
                .data(silkRoadData)
                .enter()
              .append("path")
                .attr("d", path)

                // .attr("id", function(d){
                //   return "c" + d.properties.ID;
                // })
                // .style("stroke", function(d){
                //     return choropleth(d.properties, colorScale);
                // })
                // .on("mouseover", function(d){
                //     highlightLine(d.properties, expressed);
                // })
                // .on("mouseout", function(d){
                //     dehighlightLine(d.properties, colorScale);
                // });


            // zoom and pan
            var zoom = d3.behavior.zoom()
                .on("zoom",function() {
                    g.attr("transform","translate("+
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    // g.selectAll("circle")
                    //     .attr("d", path.projection(projection));
                    g.selectAll("path")
                        .attr("d", path.projection(projection));

              });

            map.call(zoom)



        			// .attr("class", "countries")
              // .attr("id", function(d){
              //     console.log(d);
              // })
        			// .attr("d", path);

            // //add enumeration units to the map
            // setEnumerationUnits(whoRegionsJson, map, path);


        };

    };


function setEnumerationUnits(franceRegions, map, path){

  	//add France regions to map
  	var regions = map.selectAll(".regions")
  		.data(franceRegions)
  		.enter()
  		.append("path")
  		.attr("class", function(d){
  			return "regions " + d.properties.adm1_code;
  		})
  		.attr("d", path)
  		.style("fill", function(d){
  			return choropleth(d.properties, colorScale);
  		})
  		.on("mouseover", function(d){
  			highlight(d.properties);
  		})
  		.on("mouseout", function(d){
  			dehighlight(d.properties);
  		})
  		.on("mousemove", moveLabel);

  	//add style descriptor to each path
  	var desc = regions.append("desc")
  		.text('{"stroke": "#000", "stroke-width": "0.5px"}');
};
function setGraticule(map, path){
	//create graticule generator
	var graticule = d3.geo.graticule()
		.step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline()) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule

	//create graticule lines
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines()) //bind graticule lines to each element to be created
	  	.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
};

// });
