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
            .defer(d3.json, "data/Routes/TradeRoutes.topojson")//load trade routes polylines
            .defer(d3.json, "data/Points/NearTradeHubsSimple.topojson")//load trade hubs
            .defer(d3.json, "data/Points/Isolates_Exact.topojson")//load exactIsolates
            .defer(d3.json, "data/Points/Isolates_Random.topojson")//load Random Isolates
            .defer(d3.json, "data/Polygons/LineageFrequency.topojson")//load lineage frequencies

            .await(callback);

        function callback(error, countryData, whoRegionsData, tradeRouteData, tradeHubData, exactData, randomData, linFreqData){
            // console.log(silkRoadData);

            //place graticule on the map
        		// setGraticule(map, path);

            //translate countries topojson with zoom
            var countryJson = topojson.feature(countryData, countryData.objects.Countries).features,
                whoRegionsJson = topojson.feature(whoRegionsData, whoRegionsData.objects.WHO_Regions).features;

            var tradeHubJson = topojson.feature(tradeHubData, tradeHubData.objects.NearTradeHubsSimple)

            var exactJson = topojson.feature(exactData, exactData.objects.Isolates_Exact)

            var randomJson = topojson.feature(randomData, randomData.objects.Isolates_Random)

            //convert topojsons into geojson objects; coastLine is an array full of objects
            var tradeRouteJson = topojson.feature(tradeRouteData, tradeRouteData.objects.AllRoutes).features;

            var linFreqJson = topojson.feature(linFreqData, linFreqData.objects.LinFreq_1to4_0728).features

            // var dropdownMenu = createDropdown(linFreqJson)

            //set default height and width of map
            var mapWidth = window.innerWidth * 0.75,
          		  mapHeight = 500;

            //set projection of map
            var projection = d3.geo.mercator()
                .center([80, 10])
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

            var colorScale = makeColorScale();

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

            // //add world health organization regions to map
            // var who_regions = g.selectAll(".who_regions")
            //    .data(whoRegionsJson)
            //    .enter()
            //  .append("path")
            //     .attr("class", "who_regions")
            //     .attr("id", function(d){
            //         return d.properties.WHO_Region
            //     })
            //     .attr("d", path)

            var tradeHubs = g.append("path")
                .datum(tradeHubJson)
                .attr("class", "tradeHubs")
                .attr("d", path)

            var exactIsolates = g.append("path")
                .datum(exactJson)
                .attr("class", "exactIsolates")
                .attr("d", path)

            var randomIsolates = g.append("path")
                .datum(randomJson)
                .attr("class", "randomIsolates")
                .attr("d", path)

            //draw trade routes
            var tradeRoutes = g.append("g")
                .attr("class", "tradeRoutes")
              .selectAll("path")
                .data(tradeRouteJson)
                .enter()
              .append("path")
                .attr("d", path)
                .attr("class", function(d){
                  return d.properties.RouteShort
                })
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

            //add countries to map
            var lineageFrequencies = g.selectAll(".lineageFrequencies")
               .data(linFreqJson)
               .enter()
             .append("path")
                .attr("class", "lineageFrequencies")
                .attr("id", function(d){
                    return d.properties.sovereignt
                })
                .style("fill", "none")
                .attr("d", path)
            //function to create a dropdown menu to add/remove trade routes
            createRouteMenu(tradeRouteJson);

            //function to create a dropdown menu to add/remove lineage frequencies
            createLinFreqMenu();

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


function makeColorScale(){
    //array of hex colors to be used for choropleth range
    var colorClasses = ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b', '#00220e']

    //create color scale generator; quantize divides domain by length of range
    var colorScale = d3.scale.quantize()
        .domain([1, 100])
        .range(colorClasses);

    return colorScale;
}

//function to test for data value and return color
function choropleth(props, colorScale, expressed){
  	//make sure attribute value is a number
  	var val = parseFloat(props[expressed]);
  	//if attribute value exists, assign a color; otherwise assign gray
  	if (val && val != 0){
    		return colorScale(val);
  	} else {
    		return "#ddd";
  	};
};

// //creates dropdown menu
// function createDropdown(data){
//     //array for option values in dropdown
//     var lineageValArray = ["per14_Lin1", "per14_Lin2", "per14_Lin3", "per14_Lin4"]
//
//     //array for display text in dropdown
//     var lineageTextArray = ["Lineage 1", "Lineage 2", "Lineage 3", "Lineage 4"]
//
//     //testing if dropdown already exists to prevent duplicate creation
//     if(d3.select(".dropdown").empty() == true){
//         //add select element
//         var dropdown = d3.select("body")
//             .append("select")
//             .attr("class", "dropdown")
//             .on("change", function(){
//                 changeAttribute(this.value, data)
//             });
//
//
//         var attrOptions = dropdown.selectAll(".attrOptions")
//             .data(lineageValArray)
//             .enter()
//           .append("option")
//             .attr("class", "attrOptions")
//             .attr("value", function(d){ return d })
//             .text(function(d, i){ return lineageTextArray[i] });
//     }
// };

function createLinFreqMenu() {

  //array of objects for option values in dropdown
    var linObjArray = [
        {
          text: 'Lineage Frequency Overlays',
          value: 'defaultLineageOption'
        },
        {
          text: 'Lineage 1',
          value: 'per14_Lin1'
        },
        {
          text: 'Lineage 2',
          value: 'per14_Lin2'
        },
        {
          text: 'Lineage 3',
          value: 'per14_Lin3'
        },{
          text: 'Lineage 4',
          value: 'per14_Lin4'
        },
    ]

    //creates the selection menu
    var linSelect = d3.select("body")
        .append("select")
        .attr("id", "linSelect")
        .attr("name", "linSelect")

    //create options for trade routes
    var linOptions = linSelect.selectAll(".linOptions")
        .data(linObjArray)
        .enter()
      .append("option")
        .attr("class", "linOptions")
        .attr("value", function(d){ return d.value })
        .attr("id", function(d){ return d.value })
        .text(function(d){ return d.text });
    //set attributes specific to default option
    d3.select("#defaultLineageOption")
        .attr("disabled", "true")
        .attr("selected", "true")
    //initialize select menu
    $("#linSelect").selectmenu({
        change: function(event, ui) {

            var lineage = ui.item.value;

            drawLineageFrequency(lineage)
        }
    })
}

function drawLineageFrequency(expressed) {
    //create the color scale
    var colorScale = makeColorScale();

    var lineage = d3.selectAll(".lineageFrequencies")
        .transition()
        .duration(800)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale, expressed)
        })

}
function createRouteMenu(tradeRouteJson) {
    var routeObjArray = [
        {
          text: 'Silk Road',
          value: 'silkRoad'
        },
        {
          text: 'Maritime Silk',
          value: 'maritimeSilk'
        },
        {
          text: 'Europe',
          value: 'europe'
        },
        {
          text: 'East Africa',
          value: 'eastAfrica'
        },
        {
          text: 'West Africa',
          value: 'westAfrica'
        },
        {
          text: 'Mediterranean Maritime',
          value: 'medMaritime'
        },
        {
          text: 'China Imperial',
          value: 'chinaImperial'
        },
        {
          text: 'Northern Minor Silk',
          value: 'northSilk'
        },
        {
          text: 'Southern Minor Silk',
          value: 'southSilk'
        },
        {
          text: 'Pacific Maritime',
          value: 'pacific'
        }
    ]

    //creates the selection menu
    var routeSelect = d3.select("body")
        .append("select")
        .attr("id", "routeSelect")
        .attr("name", "routeSelect")
        .attr("multiple", "multiple")

    //create options for trade routes
    var routeOptions = routeSelect.selectAll(".routeOptions")
        .data(routeObjArray)
        .enter()
      .append("option")
        .attr("class", "routeOptions")
        .attr("value", function(d){ return d.value })
        .text(function(d){ return d.text });

    //customize multiselect
    $("#routeSelect").multiselect( //sets default options
        {
            noneSelectedText: "Add or Remove Trade Routes",
            selectedList: false,
            selectedText: "Add or Remove Trade Routes"
        }
    ).multiselect("checkAll") //checks all routes by default
    .on("multiselectclick", function(event, ui) { //event listener for check/uncheck a box
        if (ui.checked === true) {
          d3.selectAll("." + ui.value)
              .attr("visibility", "visible")
        } else {
            d3.selectAll("." + ui.value)
                .attr("visibility", "hidden")
        }
    })
    .on("multiselectcheckall", function(event, ui) { //adds all routes to map
        for (i=0; i<routeObjArray.length; i++) {
            var route = routeObjArray[i].value
            d3.selectAll("." + route)
              .attr("visibility", "visible")
        }
    })
    .on("multiselectuncheckall", function(event, ui) { //removes all routes from map
        for (i=0; i<routeObjArray.length; i++) {
            var route = routeObjArray[i].value
            d3.selectAll("." + route)
              .attr("visibility", "hidden")
        }
    })
}
// function setEnumerationUnits(franceRegions, map, path){
//
//   	//add France regions to map
//   	var regions = map.selectAll(".regions")
//   		.data(franceRegions)
//   		.enter()
//   		.append("path")
//   		.attr("class", function(d){
//   			return "regions " + d.properties.adm1_code;
//   		})
//   		.attr("d", path)
//   		.style("fill", function(d){
//   			return choropleth(d.properties, colorScale);
//   		})
//   		.on("mouseover", function(d){
//   			highlight(d.properties);
//   		})
//   		.on("mouseout", function(d){
//   			dehighlight(d.properties);
//   		})
//   		.on("mousemove", moveLabel);
//
//   	//add style descriptor to each path
//   	var desc = regions.append("desc")
//   		.text('{"stroke": "#000", "stroke-width": "0.5px"}');
// };
// function setGraticule(map, path){
// 	//create graticule generator
// 	var graticule = d3.geo.graticule()
// 		.step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
//
// 	//create graticule background
// 	var gratBackground = map.append("path")
// 		.datum(graticule.outline()) //bind graticule background
// 		.attr("class", "gratBackground") //assign class for styling
// 		.attr("d", path) //project graticule
//
// 	//create graticule lines
// 	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
// 		.data(graticule.lines()) //bind graticule lines to each element to be created
// 	  	.enter() //create an element for each datum
// 		.append("path") //append each element to the svg as a path element
// 		.attr("class", "gratLines") //assign class for styling
// 		.attr("d", path); //project graticule lines
// };

// });
