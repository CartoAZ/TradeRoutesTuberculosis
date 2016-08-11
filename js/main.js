// (function(){

    //execute script when window is loaded
    window.onload = setMap();
    var routeObjArray = [
        {
          text: 'Silk Road',
          value: 'silkRoad',
          checked: 1
        },
        {
          text: 'Maritime Silk',
          value: 'maritimeSilk',
          checked: 1
        },
        {
          text: 'Europe',
          value: 'europe',
          checked: 1
        },
        {
          text: 'East Africa',
          value: 'eastAfrica',
          checked: 1
        },
        {
          text: 'West Africa',
          value: 'westAfrica',
          checked: 1
        },
        {
          text: 'Mediterranean Maritime',
          value: 'medMaritime',
          checked: 1
        },
        {
          text: 'China Imperial',
          value: 'chinaImperial',
          checked: 1
        },
        {
          text: 'Northern Minor Silk',
          value: 'northSilk',
          checked: 1
        },
        {
          text: 'Southern Minor Silk',
          value: 'southSilk',
          checked: 1
        },
        {
          text: 'Pacific Maritime',
          value: 'pacific',
          checked: 1
        },
        {
          text: 'Europe Maritime',
          value: 'europeMaritime',
          checked: 1
        }
    ]
    var menubar = d3.select("body").append("div")
        .attr("id", "menubar")

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

            //add second set of countries for lineage frequencies to map
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
            // //add near trade hub cities to map
            // var tradeHubs = g.append("path")
            //     .datum(tradeHubJson)
            //     .attr("class", "tradeHubs")
            //     .attr("d", path)

            //add exact isolates to map
            var exactIsolates = g.append("g")
                .attr("class", "exactIsolates")
                .selectAll("path")
              .data(exactJson.features)
                .enter()
              .append("path")
                .attr("d", path)
                .attr("class", function(d){
                    var lineage = d.properties.lineage_of;

                    return "lin_" + lineage;
                })
            //add exact isolates to map
            var randomIsolates = g.append("g")
                .attr("class", "randomIsolates")
                .selectAll("path")
              .data(randomJson.features)
                .enter()
              .append("path")
                .attr("d", path)
                .attr("class", function(d){
                    var lineage = d.properties.lineage_of;

                    return "lin_" + lineage;
                })


            //function to create a dropdown menu to add/remove isolates by lineage
            createIsoLineageMenu();

            //function to create a dropdown menu to add/remove lineage frequencies
            createLinFreqMenu();

            createLegend();

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
    var linSelect = d3.select("#menubar").append("select")
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
    //retrieve width of map
    var width = d3.select(".map").attr("width");
    var height = d3.select(".map").attr("height");

    //conditional to prevent creation of multiple divs
    if(d3.select("#freqLegendSvg").empty() == true){

        // var freqLegendContainer = d3.select(".map").append("div")
        //     .attr("id", "freqLegendContainer")
        //     .attr("width", width)
        //     .attr("height", height / 7)
        //

        var freqLegendSvg = d3.select(".map").append("svg")
            .attr("id", "freqLegendSvg")

          //set variables to define spacing/size
          var rectHeight = 20,
              rectWidth = 40;
              // legendSpacing = 4;
          //color classes array
          var colorClasses = ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b', '#00220e', 'none']
          //color values array
          var colorValues = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']
          //
          // var freqObjArray = [];
          //
          // for (i=0; i<routeObjArray.length; i++) {
          //     //current route in loop
          //     var route = routeObjArray[i].value
          //     //pull color from stroke of route
          //     var color = d3.select("." + route).style("stroke")
          //     //add color to colorclasses array
          //     colorClasses.push(color)
          //     // create new property in routeObjArray for the color; easier to build legend using one array
          //     routeObjArray[i].color = color
          // }

          //sets legend title
          var freqLegendTitle = freqLegendSvg.append("text")
              .attr("class", "freqLegendTitle")
              // .attr("transform", "translate(100,60)")
              .attr("transform", function(d){
                  var horz = width / 3;
                  horz = horz + 20;
                  var vert = height - 55;


                  return "translate(" + horz + "," + vert + ")";
              })
              .text("Lineage Frequency by Country")

          //creates a group for each rectangle and offsets each by same amount
          var freqLegend = freqLegendSvg.selectAll('.freqLegend')
              .data(colorClasses)
              .enter()
            .append("g")
              .attr("class", "freqLegend")
              .attr("transform", function(d, i) {
                  var offset =  rectWidth * colorClasses.length / 2;
                  var vert = height - 30;
                  var horz = i * rectWidth - offset + width / 2;

                  return 'translate(' + horz + ',' + vert + ')';
            });

          //creates rect elements for legened
          var freqLegendRect = freqLegend.append('rect')
              .attr("class", "freqLegendRect")
              .attr('width', rectWidth)
              .attr('height', rectHeight)
              .attr("transform", "translate(0,5)")
              .style('fill', function(d){ return d })
              .style('stroke', function(d){ return d });

          //adds text to legend
          var freqLegendText = freqLegend.append('text')
              .attr("class", "freqLegendText")
              .attr("transform", "translate(-7, 0) ")
              .text(function(d, i) { return colorValues[i] });
      }
}
function createIsoLineageMenu() {
    //empty array to bind to select element
    var isolateObjArray = [];
    //for loop to populate isolateObjArray
    for (i=1; i<8; i++) {
        // set variables to be added as values in object
        var linText = "Lineage " + i,
            linValue = "lin_" + i;
        //create object for each of 7 lineages
        var linObj = {
                        text: linText,
                        value: linValue
                      }
        //push object to array
        isolateObjArray.push(linObj)
    };

    //creates the selection menu
    var isoSelect = d3.select("#menubar").append("select")
        .attr("id", "isoSelect")
        .attr("name", "isoSelect")
        .attr("multiple", "multiple")

    //create options for trade routes
    var isoOptions = isoSelect.selectAll(".isoOptions")
        .data(isolateObjArray)
        .enter()
      .append("option")
        .attr("class", "isoOptions")
        .attr("value", function(d){ return d.value })
        .text(function(d){ return d.text });

    //customize multiselect
    $("#isoSelect").multiselect( //sets default options
        {
            noneSelectedText: "Filter Isolates by Lineage",
            selectedList: false,
            selectedText: "Filter Isolates by Lineage"
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
    .on("multiselectcheckall", function(event, ui) { //adds all isolates to map
        for (i=0; i<isolateObjArray.length; i++) {
            var lineage = isolateObjArray[i].value
            d3.selectAll("." + lineage)
              .attr("visibility", "visible")
        }
    })
    .on("multiselectuncheckall", function(event, ui) { //removes all routes from map
        for (i=0; i<isolateObjArray.length; i++) {
            var lineage = isolateObjArray[i].value
            d3.selectAll("." + lineage)
              .attr("visibility", "hidden")
        }
    })
}

// function createLegend() {
//
//     var legendDiv = d3.select("body").append("div")
//         .attr("id", "legendDiv")
//         .attr("width", window.innerWidth * 0.2)
//         .attr("height", "400px");
//     var legendSvg = legendDiv.append("svg")
//         .attr("id", "legendSvg")
//         .attr("width", window.innerWidth * 0.18)
//         .attr("height", "300px");
//
//
//
//       //set variables to define spacing/size
//       var rectHeight = 1,
//           rectWidth = 20,
//           legendSpacing = 4;
//       //color classes array
//       var colorClasses = [];
//
//       var legendTextArray = [];
//
//       // for loop retrieving stroke color of each route for the legend
//       for (i=0; i<routeObjArray.length; i++) {
//           var routeText = routeObjArray[i].text
//           //current route in loop
//           var routeVal = routeObjArray[i].value
//           //pull color from stroke of route
//           var color = d3.select("." + routeVal).style("stroke")
//           //add color to colorclasses array
//           colorClasses.push(color)
//
//           legendTextArray.push(routeText)
//           // create new property in routeObjArray for the color; easier to build legend using one array
//           routeObjArray[i].color = color
//       }
//
//       var ordinal = d3.scale.ordinal()
//           .domain(routeText)
//           .range(colorClasses)
//
//       var legend = legendSvg.append("g")
//           .attr("class","legend")
//           .attr("transform","translate(50,30)")
//           .style("font-size","12px")
//
//
//       var legendColor = d3.legend.color()
//           .shape("path", d3.svg.symbol().type("triangle-up").size(150)())
//           .shapePadding(10)
//           .scale(ordinal)
// }

function createLegend() {

    var legendContainer = d3.select("body").append("div")
        .attr("id", "legendContainer")

    var legendSvg = legendContainer.append("svg")
        .attr("id", "legendSvg")


      //set variables to define spacing/size
      var rectHeight = 1,
          rectWidth = 20,
          legendSpacing = 4;
      //color classes array
      var colorClasses = [];

      // for loop retrieving stroke color of each route for the legend
      for (i=0; i<routeObjArray.length; i++) {
          //current route in loop
          var route = routeObjArray[i].value
          //pull color from stroke of route
          var color = d3.select("." + route).style("stroke")
          //add color to colorclasses array
          colorClasses.push(color)
          // create new property in routeObjArray for the color; easier to build legend using one array
          routeObjArray[i].color = color
      }

      //sets legend title
      var legendTitle = legendSvg.append("text")
          .attr("class", "legendTitle")
          .attr("transform", "translate(70,30)")
          .text("Legend")

      //sets legend title
      var legendRouteTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendRouteTitle")
          .attr("transform", "translate(70,60)")
          .text("Trade Routes")

      //creates a group for each rectangle and offsets each by same amount
      var legend = legendSvg.selectAll('.legend')
          .data(routeObjArray)
          .enter()
        .append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) {
              var height = rectWidth + legendSpacing;
              var offset =  height * routeObjArray.length / 2;
              var horz = 2 * rectWidth;
              var vert = i * height - offset + 200;
              return 'translate(' + horz + ',' + vert + ')';
        });

      //creates rect elements for legened
      var legendRect = legend.append('rect')
          .attr("class", "legendRect")
          .attr('width', rectWidth)
          .attr('height', rectHeight)
          .attr("transform", "translate(-20,-3)")
          .style('fill', function(d){ return d.color })
          .style('stroke', function(d){ return d.color });

      //adds text to legend
      var legendText = legend.append('text')
          .attr("class", "legendText")
          .attr("transform", "translate(5, 0)")
          .text(function(d) { return d.text });

      //checkboxes for each route
      var checkboxes = legend.append("foreignObject")
          // .attr('x', textX - 30)
          // .attr('y', attHeight - 36)
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-47, -12)")
        .append("xhtml:body")
          .html(function(d, i) {
              // console.log(routeObjArray[i].value);
              // console.log(d);
              // console.log(i);
              // //get unique attribute for every variable
              // var attribute = createAttID(d, rankData)
              //create ID for checkboxes
              var routeID = routeObjArray[i].value + "_check";
              return "<form><input type=checkbox class='checkbox' id='" + routeID + "'</input></form>"
          })
          // .on("change", function(d) { //event listener for check/uncheck a box
          //     console.log(d);
          //     // if (ui.checked === true) {
          //     //   d3.selectAll("." + ui.value)
          //     //       .attr("visibility", "visible")
          //     // } else {
          //     //     d3.selectAll("." + ui.value)
          //     //         .attr("visibility", "hidden")
          //     // }
          // })
          .on("change", function(d){

              // var checked = d3.selectAll(".checkbox")
              //function updates "checked" property for every route
              routeObjArray = setCheckedProp();
              //updates visibility of route based on if it is checked or not
              updateRouteVisibility();
          });
      //checks all routes by default
      for (i=0; i<routeObjArray.length; i++) {
          var route = routeObjArray[i].value
          // console.log(d3.select("#" + route + "_check")[0][0].checked);
          d3.select("#" + route + "_check")[0][0].checked = true;
      }


}
//updates visibility of routes based on whether or not route is checked in legend
function updateRouteVisibility() {

    for (i=0; i<routeObjArray.length; i++) {
        //store route class
        var route = d3.selectAll("." + routeObjArray[i].value)

        //checks if route is selected
        if (routeObjArray[i].checked === 1){
            route.attr("visibility", "visible")
        } else {
            route.attr("visibility", "hidden")
        }
    }
}
// function createLegend() {
//
//
//     //set measurements for panel
//     var legendMargin = {top: 20, right: 10, bottom: 30, left: 10},
//     legendHeight = 800, //set height
//     legendHeight = legendHeight - legendMargin.top,
//     legendWidth = window.innerWidth * 0.2,//width of legendSvg
//     legendWidth = legendWidth - legendMargin.left - legendMargin.right //width with margins for padding
//
//     //div container that holds SVG
//     var legendContainer = d3.select("body").append("div")
//         .attr("id", "legendContainer")
//         .attr("width", legendWidth + 10)
//         .attr("height", "400px")
//
//     var collapseButton = legendContainer.append("button")
//         .html("&raquo;")
//
//
//     var hideWidth = "-385px";
//     var collapsibleE1 = $('#legendContainer')
//     var buttonE1 = $("#legendContainer button")
//
//     $(buttonE1).click(function() {
//          var curwidth = $(this).parent().offset(); //get offset value of the parent element
//          if(curwidth.left>0) //compare margin-left value
//          {
//              //animate margin-left value to -490px
//              $(this).parent().animate({marginLeft: hideWidth}, 300 );
//              $(this).html('&raquo;'); //change text of button
//          }else{
//              //animate margin-left value 0px
//              $(this).parent().animate({marginLeft: "0"}, 300 );
//              $(this).html('&laquo;'); //change text of button
//          }
//     });
//     //create svg for legendpanel
//     var legendSvg = d3.select("#legendContainer").append("svg")
//         .attr("class", "legendSvg")
//         .attr("width", "300px")
//         .attr("height", legendHeight)
//       .append("g")
//         .attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top + ")");// adds padding to group element in SVG
// //sets legend title
//     var legendTitleRect = legendSvg.append("rect")
//         .attr("id", "legendTitleRect")
//         .attr('x', -10)
//         .attr("y", -20)
//         .attr("width", '100%')
//         .attr("height", 60)
//         .text("Attributes")
//     //sets legend title
//     var legendTitle = legendSvg.append("text")
//         .attr("class", "legendTitle")
//         .attr("x", legendWidth / 5)
//         .attr("y", legendMargin.top)
//         .text("Select Attributes")
//
// }
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
function setCheckedProp() {
    //select all of the checkboxes
    var checked = d3.selectAll(".checkbox");
    //loop through array of checkbox elements
    checked.forEach(function(d) { //d is array of all checkbox elements
        // loop through each checkbox element in array
        for (j=0; j<10; j++) {
            //if the checkbox is checked, do this
            if (d[j].checked == true) {
                //gets ID, which contains attribute name
                var getID = d[j].id;
                console.log(getID);
                //trim "_check" from end of ID string
                var att = getID.slice(0, -6);
                console.log(att);
                // loop through array of att objects and sets checked property to 1
                for (i=0; i<routeObjArray.length; i++){
                    if (routeObjArray[i].value == att) {
                        routeObjArray[i].checked = 1;
                    };
                };
            } else { //if the checkbox isn't checked, do this
                var getID = d[j].id;
                //trim "_check" from end of ID string
                var att = getID.slice(0, -6);
                // loop through array of att objects and sets checked property to 0
                for (i=0; i<routeObjArray.length; i++){
                    if (routeObjArray[i].value == att) {
                        routeObjArray[i].checked = 0;
                    };
                };
            };
        };
    });
    return routeObjArray;
}

//creates array containing names of attributes currently checked
function checkedAttributes(){
    //create array to hold attributes that are checked
    checkedAtts = [];
    //loop through each attribute object and add all that are checked to checkedAtts array
    routeObjArray.forEach(function(d){
        //if attribute is checked, push it's "Attribute" property to array
        if (d.checked == 1){
            checkedAtts.push(d.value);
        };
    });

    return checkedAtts;
};
