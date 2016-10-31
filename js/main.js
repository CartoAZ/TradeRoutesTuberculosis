// (function(){

    //execute script when window is loaded
    window.onload = setMap();
    var routeObjArray = [
        {
          text: 'Land - Major',
          value: 'majorLand',
          checked: 1
        },
        {
          text: 'Land - Minor',
          value: 'minorLand',
          checked: 1
        },
        {
          text: 'Sea - Major',
          value: 'majorSea',
          checked: 1
        },
        {
          text: 'Sea - Minor',
          value: 'minorSea',
          checked: 1
        }
    ]
    //empty array to hold UN info for legend
    var unObjArray = [];

    var isolateLegendArray = [
        {
          text: "Exact Location Known",
          value: "exactIsolates",
          fill: "#333"
        },
        {
          text: "Only Country of Origin Known",
          value: "randomIsolates",
          fill: "#aaa"
        }
    ];
    // //empty array to hold all isolate names
    // var isolateNameArray = [];

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
                        value: linValue,
                      }
        //push object to array
        isolateObjArray.push(linObj)
    };

    var menubar = d3.select("body").append("div")
        .attr("id", "menubar")

    function setMap(){

        //set variable to access queue.js to parallelize asynchronous data loading
        var q = d3_queue.queue();

        q
            .defer(d3.json, "data/Polygons/Countries_50m.topojson")//load countries outline spatial data
            .defer(d3.json, "data/Polygons/UN_Regions1026.topojson")//load UN regions outline
            .defer(d3.json, "data/Routes/AllRoutes1025.topojson")//load trade routes polylines
            .defer(d3.json, "data/Points/TradeHubs_1018.topojson")//load trade hubs
            .defer(d3.json, "data/Points/Isolates_Exact.topojson")//load exactIsolates
            .defer(d3.json, "data/Points/Isolates_Random.topojson")//load Random Isolates
            .defer(d3.json, "data/Polygons/LineageFrequencies_100m.topojson")//load lineage frequencies
            .await(callback);

        function callback(error, countryData, UNRegionsData, tradeRouteData, tradeHubData, exactData, randomData, linFreqData, unScaleData){

            //place graticule on the map
        		// setGraticule(map, path);
            //translate countries topojson with zoom
            var countryJson = topojson.feature(countryData, countryData.objects.Countries_50m).features,
                UNRegionsJson = topojson.feature(UNRegionsData, UNRegionsData.objects.UN_Regions1026).features;

            var tradeHubJson = topojson.feature(tradeHubData, tradeHubData.objects.TradeHubs_1018).features

            var exactJson = topojson.feature(exactData, exactData.objects.Isolates_Exact).features

            var randomJson = topojson.feature(randomData, randomData.objects.Isolates_Random).features

            //convert topojsons into geojson objects; coastLine is an array full of objects
            var tradeRouteJson = topojson.feature(tradeRouteData, tradeRouteData.objects.AllRoutes1018).features;

            var linFreqJson = topojson.feature(linFreqData, linFreqData.objects.LineageFrequencies_100m).features

            //set default height and width of map
            var mapWidth = window.innerWidth * 0.75,
          		  mapHeight = 500;

            //set projection of map
            var projection = d3.geo.mercator()
                .center([95, 23])
                .scale(210)

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

            //add countries to map
        		var countries = g.selectAll(".countries")
        			 .data(countryJson)
               .enter()
             .append("path")
                .attr("class", "countries")
                // .attr("id", function(d){
                //     return d.properties.Country
                // })
                .attr("d", path)

            //add second set of countries for lineage frequencies to map
            var lineageFrequencies = g.selectAll(".lineageFrequencies")
               .data(linFreqJson)
               .enter()
             .append("path")
                .attr("class", "lineageFrequencies")
                .attr("id", function(d){

                    return d.properties.shortName
                })
                .style({"fill": "none", "stroke": "none"})
                .attr("d", path)
                .on("mouseover", function(d){
                    highlightCountry(d.properties);
                })
                .on("mouseout", function(d){
                    dehighlightCountry(d.properties);
                })
                // .on("mousemove",  moveLabel);
                .on("mousemove", function(d){
                    moveLabel(d.properties)
                });

            //add UN regions to map
            var un_regions = g.selectAll(".un_regions")
               .data(UNRegionsJson)
               .enter()
             .append("path")
                .attr("class", function(d){
                      return "un_regions " + d.properties.UN_Group
                })
                .attr("id", function(d){
                    //place region name into variable
                    var region = d.properties.UN_Region
                    //remove all spaces
                    region = region.replace(/\s+/g, '')

                    return region
                })
                .attr("d", path)
                .attr("visibility", "hidden")

            //draw trade routes
            var tradeRoutes = g.append("g")
                .attr("class", "tradeRoutes")
              .selectAll("path")
                .data(tradeRouteJson)
                .enter()
              .append("path")
                .attr("d", path)
                .attr("id", function(d){
                  return d.properties.routeName
                })

            var tradeHubs = g.append("g")
                .attr("class", "tradeHubs")
                .selectAll("circle")
              .data(tradeHubJson)
                .enter()
              .append("circle")
                .attr("id", "tradeHubs")
                .attr("cx", function(d){return projection(d.geometry.coordinates)[0]})
                .attr("cy", function(d){return projection(d.geometry.coordinates)[1]})
                .attr("r", 4)


            //add exact isolates to map
            var exactIsolates = g.append("g")
                .attr("class", "exactIsolates")
                .selectAll("rect")
              .data(exactJson)
                .enter()
              .append("rect")
                .attr("x", function(d){return projection(d.geometry.coordinates)[0]})
                .attr("y", function(d){return projection(d.geometry.coordinates)[1]})
                .attr("width", 5)
                .attr("height", 5)
                .attr("class", function(d){
                    var lineage = d.properties.lineage_of;

                    return "lin_" + lineage + " notFiltered unchecked";
                })
                .attr("id", function(d){
                    return d.properties.SampleName;
                })
                .attr("visibility", "hidden")

            //add random isolates to map
            var randomIsolates = g.append("g")
                .attr("class", "randomIsolates")
                .selectAll("path")
              .data(randomJson)
                .enter()
              .append("rect")
                .attr("x", function(d){return projection(d.geometry.coordinates)[0]})
                .attr("y", function(d){return projection(d.geometry.coordinates)[1]})
                .attr("width", 5)
                .attr("height", 5)
                .attr("class", function(d){
                    var lineage = d.properties.lineage_of;

                    return "lin_" + lineage + " notFiltered unchecked";
                })
                .attr("id", function(d){
                    return d.properties.SampleName;
                })
                .attr("visibility", "hidden")


            // //push isolate names into array for use with search widget
            // exactJson.map(function(d){
            //     isolateNameArray.push(d.properties.SampleName)
            // })
            //
            // //push isolate names into array for use with search widget
            // randomJson.map(function(d){
            //     isolateNameArray.push(d.properties.SampleName)
            // })

            // createSearch();
            //function to create a dropdown menu to add/remove isolates by lineage
            createIsoLineageMenu();

            //function to create a dropdown menu to add/remove lineage frequencies
            createLinFreqMenu();

            UNRegionsJson.map(function(d, i){
                var un_region = new Object();

                var region = d.properties.UN_Region

                un_region.text = region

                var regionValue = region.replace(/\s+/g, '')
                //add region into obj array as a value
                un_region.value = regionValue

                // pull color from stroke of route
                var unColor = d3.select("#" + regionValue).style("fill")
                // create new property in unObjArray for the color; easier to build legend using one array
                un_region.color = unColor

                un_region.group = d.properties.UN_Group

                unObjArray.push(un_region)

                // console.log(d.properties);
                // console.log(i);

            })

            unObjArray.sort(function(a,b){
                if (a.group < b.group)
                  return -1;
                if (a.group > b.group)
                  return 1;
                return 0;
            })

            createLegend();

            // zoom and pan
            var zoom = d3.behavior.zoom()
                .on("zoom",function() {
                    g.attr("transform","translate("+
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    g.selectAll("circle")
                        .attr("d", path.projection(projection))
                    g.selectAll("rect")
                        .attr("d", path.projection(projection))
                    g.selectAll("path")
                        .attr("d", path.projection(projection));

              });

            map.call(zoom)

            // //add enumeration units to the map
            // setEnumerationUnits(whoRegionsJson, map, path);
        };

    };

function makeColorScale(){
    //array of hex colors to be used for choropleth range
    var colorClasses = ['#fff','#ffffcc','#ffeda0','#fed976','#fecb43','#feab3b','#fe9c19','#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']

    //create color scale generator; quantize divides domain by length of range
    var colorScale = d3.scale.threshold()
        .domain([0.1, 10, 20, 30, 40, 50, 60, 70, 80, 90])
        .range(colorClasses);

    return colorScale;
}

//function to test for data value and return color
function choropleth(props, colorScale, expressed){

  	//make sure attribute value is a number
  	var val = parseFloat(props[expressed]);

  	//if attribute value exists, assign a color; otherwise assign gray
  	if (val >= 0){
    		return colorScale(val);
  	} else {
    		return "none";
  	};
};

function createLinFreqMenu() {

  //array of objects for option values in dropdown
    var linObjArray = [
        {
          text: 'Lineage Frequencies',
          value: 'defaultLineageOption'
        },
        {
          text: 'Lineage 1 - Genomic',
          value: 'per14L1Gen'
        },
        {
          text: 'Lineage 2 - Genomic',
          value: 'per14L2Gen'
        },
        {
          text: 'Lineage 3 - Genomic',
          value: 'per14L3Gen'
        },{
          text: 'Lineage 4 - Genomic',
          value: 'per14L4Gen'
        },
        {
          text: 'Lineage 1 - Spoligo',
          value: 'per14L1Spo'
        },
        {
          text: 'Lineage 2 - Spoligo',
          value: 'per14L2Spo'
        },
        {
          text: 'Lineage 3 - Spoligo',
          value: 'per14L3Spo'
        },{
          text: 'Lineage 4 - Spoligo',
          value: 'per14L4Spo'
        }
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

    if (expressed === "clear") {

        //conditional to check if legend exists
        if (d3.select("#freqLegendSvg").empty() == false){
            //removes legend
            d3.select("#freqLegendSvg").remove();
            //removes fill of countries
            d3.selectAll(".lineageFrequencies")
                .style("fill", "none")
        }
    } else {
        //disable each checkbox for UN regions when lineage frequency is drawn
        d3.selectAll(".un_checkbox")[0].forEach(function(d){
            d.disabled = true
        });

        //create the color scale
        var colorScale = makeColorScale();

        var lineage = d3.selectAll(".lineageFrequencies")
            .transition()
            .duration(800)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale, expressed)
            })
            .style({"stroke": "#ccc", "stroke-width": "1px"})
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
              var colorClasses = ['#fff','#ffffcc','#ffeda0','#fed976','#fecb43','#feab3b','#fe9c19','#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', 'none', '#eee']

              //color values array
              var colorValues = ['0', '0.1', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100','No Data']
              //conditional to determine whether legend title should be spoligo or genomic
              if (expressed.indexOf("Gen") != -1) {
                  var legendTitleText = "Lineage Frequency by Country (Pct.) - Genomic"
              } else {
                  var legendTitleText = "Lineage Frequency by Country (Pct.) - Spoligo"
              }

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
                  .text(legendTitleText)

              //creates a group for each rectangle and offsets each by same amount
              var freqLegend = freqLegendSvg.selectAll('.freqLegend')
                  .data(colorClasses)
                  .enter()
                .append("g")
                  .attr("class", "freqLegend")
                  .attr("transform", function(d, i) {
                      // if (i === 0) {
                      //     var rectWidth = 5;
                      // } else {
                      //     //set variables to define spacing/size
                      //     var rectHeight = 20,
                      //         rectWidth = 40;
                      // }
                        var offset =  rectWidth * colorClasses.length / 2;
                        var vert = height - 30;
                        var horz = i * rectWidth - offset + width / 2;

                        return 'translate(' + horz + ',' + vert + ')';
                });

              var mapWidth = +d3.select(".map").attr("width");

              //rect to hold styling
              var freqBackButton = d3.select(".map").append("rect")
                  .attr("id", "freqBack")
                  .attr("height", "15px")
                  .attr("width", "170px")
                  .attr("transform", function(){
                      var horz = mapWidth - 195
                      return "translate(" + horz + ",10)"
                  })
              //text of button
              var freqButtonText = d3.select(".map").append("text")
                  .attr("class", "buttonText")
                  .attr("id", "freqButtonText")
                  .attr("transform",  function(){
                      var horz = mapWidth - 175
                      return "translate(" + horz + ",20)"
                  })
                  .text("Remove Lineage Frequency")
              //clickable rect
              var freqSelectButton = d3.select(".map").append("rect")
                  .attr("id", "freqSelect")
                  .attr("height", "15px")
                  .attr("width", "170px")
                  .attr("transform", function(){
                      var horz = mapWidth - 195
                      return "translate(" + horz + ",10)"
                  })
                  .on("click", function(){
                      //remove legend from map
                      d3.select("#freqLegendSvg").remove();
                      //remove button
                      d3.select("#freqBack").remove();
                      //remove button
                      d3.select("#freqButtonText").remove();
                      //remove button
                      d3.select("#freqSelect").remove();
                      //removes fill from countries
                      d3.selectAll(".lineageFrequencies")
                          .style("fill", "none")
                      //update text on dropdown menu
                      d3.selectAll("span").filter(".ui-selectmenu-text").text("Lineage Frequencies")

                      //enables each checkbox for UN regions when lineage frequency is removed
                      d3.selectAll(".un_checkbox")[0].forEach(function(d){
                          d.disabled = false
                      });

                  })
                  .on("mouseover", function(){
                      buttonMouseover(this);
                  })
                  .on("mouseout", function(){
                      buttonMouseout(this);
                  })

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
        } else { //if the legend has already been created, this conditional updates the text of the legend title appropriately
            if (expressed.indexOf("Gen") != -1) {
                var legendTitleText = "Lineage Frequency by Country (Pct.) - Genomic"
            } else {
                var legendTitleText = "Lineage Frequency by Country (Pct.) - Spoligo"
            }
            //update legend text appropriately
            d3.select(".freqLegendTitle")
                .text(legendTitleText)
        }
    }
}

// function createSearch() {
//     //creates search div
//     var searchDiv = d3.select("#menubar").append("div")
//         .attr("class", "ui-widget")
//         .attr("id", "searchDiv")
//         .attr("width", "200px")
//         .attr("height", "80%")
//         .html("<label for='tags'>Isolate Name: </label><input id='tags'>")
//     //populates search with array
//     $("#tags").autocomplete({
//         source: isolateNameArray,
//         messages: {
//             noResults: 'Isolate not found',
//             results: function(){}
//         },
//         select: function(event, ui) {
//
//             var isolate = ui.item.value
//             var selection = "#" + isolate;
//
//             var selectionFill = d3.select(selection).style("fill");
//
//             d3.select(selection)
//                 .transition()
//                 .duration(200)
//                 .style("stroke-width", "5px")
//                 .style({"stroke": selectionFill, "stroke-width": "8px"})
//             //conditional to check if legend exists
//             if (d3.select("#sampleBack").empty() == true){
//
//                 //rect to hold styling
//                 var sampleBackButton = d3.select(".map").append("rect")
//                     .attr("id", "sampleBack")
//                     .attr("height", "15px")
//                     .attr("width", "140px")
//                     .attr("transform", "translate(10,10)")
//                 //text of button
//                 var sampleButtonText = d3.select(".map").append("text")
//                     .attr("class", "buttonText")
//                     .attr("id", "sampleButtonText")
//                     .attr("transform", "translate(25,21)")
//                     .text("Clear Selected Isolates")
//                 //clickable rect
//                 var sampleSelectButton = d3.select(".map").append("rect")
//                     .attr("id", "sampleSelect")
//                     .attr("height", "15px")
//                     .attr("width", "140px")
//                     .attr("transform", "translate(10,10)")
//                     .on("click", function(){
//                         d3.select(".exactIsolates").selectAll("rect")
//                             .style({"fill": "#333", "stroke": "none"})
//
//                         d3.select(".randomIsolates").selectAll("rect")
//                             .style({"fill": "#888", "stroke": "none"})
//
//                         //remove button
//                         d3.select("#sampleBack").remove();
//                         //remove button
//                         d3.select("#sampleButtonText").remove();
//                         //remove button
//                         d3.select("#sampleSelect").remove();
//                     })
//                     .on("mouseover", function(){
//                         //extract ID of rectangle is clicked
//                         var buttonID = this.id;
//                         //changes click to back in ID string so we can change fill
//                         var rectID = buttonID.replace("Select", "Back")
//                         //change fill
//                         d3.select("#" + rectID).style({
//                             "stroke": "#aaa",
//                             "stroke-width": "2px",
//                         })
//                     })
//                     .on("mouseout", function(){
//                         //extract ID of whichever rectangle is clicked
//                         var buttonID = this.id;
//                         //changes click to back in ID string so we can change fill
//                         var rectID = buttonID.replace("Select", "Back")
//                         //change fill
//                         d3.select("#" + rectID).style({
//                           "fill": "#eee",
//                           "stroke": "#ddd",
//                           "stroke-width": "1px"
//                         })
//                     })
//             }
//         }
//     });
//
//
//
// }

function createIsoLineageMenu() {

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
            selectedText: "Filter Isolates by Lineage",
        }
    ).multiselect("checkAll") //checks all routes by default
    .multiselect("disable") //disables by default since you cannot show isolates on map when cities are displayed (cities displayed by default)
    .on("multiselectclick", function(event, ui) { //event listener for check/uncheck a box
        //store current lineage
        var lineage = ui.value;

        //checks which lineage is checked
        if (ui.checked === true) {
          // d3.select("." + getClass).selectAll("path").filter(".notFiltered")
          //update visibility and class for isolates of current lineage for selected precisions in legend
          //change class from filtered to notFiltered
          d3.select(".exactIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
              .attr("visibility", "visible")
              .attr("class", function() {
                  return lineage + " notFiltered checked"
              })

          //update visibility and class for isolates of current lineage for selected precisions in legend
          //change class from filtered to notFiltered
          d3.select(".randomIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
              .attr("visibility", "visible")
              .attr("class", function() {
                  return lineage + " notFiltered checked"
              })


            // //update visibility and class for isolates of current lineage for selected precisions in legend
            // d3.selectAll("#checked").filter("." + lineage)
            //     .attr("visibility", "visible")
            //     .attr("class", function() {
            //         return lineage + " notFiltered"
            //     })

          //update class for isolates of current lineage for unselected precision in legend
          //change class from filtered to notFiltered
          d3.select(".exactIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
              .attr("class", function() {
                  return lineage + " notFiltered unchecked"
              })

          //update class for isolates of current lineage for unselected precision in legend
          //change class from filtered to notFiltered
          d3.select(".randomIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
              .attr("class", function() {
                  return lineage + " notFiltered unchecked"
              })
            // //update class for isolates of current lineage for unselected precision in legend
            // d3.selectAll("#unchecked").filter("." + lineage)
            //     .attr("class", function() {
            //         return lineage + " notFiltered"
            //     })

          //select the isolate checkboxes from legend to determine which isolates should be filtered
          var checked = d3.selectAll(".isolate_checkbox");
        } else if (ui.checked === false){ //lineage is unchecked in dropdown multiselect
            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from notFiltered to filtered
            d3.select(".exactIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
                .attr("visibility", "hidden")
                .attr("class", function() {
                    return lineage + " filtered checked"
                })

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from notFiltered to filtered
            d3.select(".randomIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
                .attr("visibility", "hidden")
                .attr("class", function() {
                    return lineage + " filtered checked"
                })

            // d3.selectAll("#checked").filter("." + lineage)
            //     .attr("visibility", "hidden")
            //     .attr("class", function() {
            //         return lineage + " filtered"
            //     })
            //update class for isolates of current lineage for unselected precision in legend
            //change class from notFiltered to filtered
            d3.select(".exactIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
                .attr("class", function() {
                    return lineage + " filtered unchecked"
                })

            //update class for isolates of current lineage for unselected precision in legend
            //change class from notFiltered to filtered
            d3.select(".randomIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
                .attr("class", function() {
                    return lineage + " filtered unchecked"
                })
            // //update class for isolates of current lineage for unselected precision in legend
            // d3.selectAll("#unchecked").filter("." + lineage)
            //     .attr("class", function() {
            //         return lineage + " filtered"
            //     })
        }
    })
    .on("multiselectcheckall", function(event, ui) { //adds all isolates to map
        for (i=1; i<8; i++) {
            //store current lineage
            var lineage = "lin_" + i;

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from filtered to notFiltered
            d3.select(".exactIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
                .attr("visibility", "visible")
                .attr("class", function() {
                    return lineage + " notFiltered checked"
                })

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from filtered to notFiltered
            d3.select(".randomIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
                .attr("visibility", "visible")
                .attr("class", function() {
                    return lineage + " notFiltered checked"
                })

            //update class for isolates of current lineage for unselected precision in legend
            //change class from filtered to notFiltered
            d3.select(".exactIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
                .attr("class", function() {
                    return lineage + " notFiltered unchecked"
                })

            //update class for isolates of current lineage for unselected precision in legend
            //change class from filtered to notFiltered
            d3.select(".randomIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
                .attr("class", function() {
                    return lineage + " notFiltered unchecked"
                })

        }
    })
    .on("multiselectuncheckall", function(event, ui) { //removes all routes from map
        for (i=1; i<8; i++) {

            //store current lineage
            var lineage = "lin_" + i;

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from notFiltered to filtered
            d3.select(".exactIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
                .attr("visibility", "hidden")
                .attr("class", function() {
                    return lineage + " filtered checked"
                })

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from notFiltered to filtered
            d3.select(".randomIsolates").selectAll("rect").filter(".checked").filter("." + lineage)
                .attr("visibility", "hidden")
                .attr("class", function() {
                    return lineage + " filtered checked"
                })

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from notFiltered to filtered
            d3.select(".exactIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
                .attr("class", function() {
                    return lineage + " filtered unchecked"
                })

            //update visibility and class for isolates of current lineage for selected precisions in legend
            //change class from notFiltered to filtered
            d3.select(".randomIsolates").selectAll("rect").filter(".unchecked").filter("." + lineage)
                .attr("class", function() {
                    return lineage + " filtered unchecked"
                })

        }
    })
}

function createLegend() {
    //div to hold SVG for legend
    var legendContainer = d3.select("body").append("div")
        .attr("id", "legendContainer")
    //SVG inside div container
    var legendSvg = legendContainer.append("svg")
        .attr("id", "legendSvg")

    //set variables to define spacing/size for displaying items withing <g> elements
    var rectHeight = 1,
        rectWidth = 20,
        legendSpacing = 0.75;
    //color classes array for retrieving color of trade routes
    var colorClasses = [];

    // for loop retrieving stroke color of each route for the legend
    for (i=0; i<routeObjArray.length; i++) {
        //current route in loop
        var route = routeObjArray[i].value
        //pull color from stroke of route
        var color = d3.select("#" + route).style("stroke")
        //add color to colorclasses array
        colorClasses.push(color)
        // create new property in routeObjArray for the color; easier to build legend using one array
        routeObjArray[i].color = color
    }

    // // for loop to push value into UN Obj array
    // for (i=0; i<unObjArray.length; i++) {
    //     //current region in loop
    //     var region = unObjArray[i].text
    //     //remove all spaces
    //     region = region.replace(/\s+/g, '')
    //     //add region into obj array as a value
    //     unObjArray[i].value = region
    // }

    // // for loop retrieving fill color of each UN Region for the legend
    // for (i=0; i<unObjArray.length; i++) {
    //     //current region in loop
    //     var region = unObjArray[i].value
    //     //pull color from stroke of route
    //     var color = d3.select("#" + region).style("fill")
    //     // create new property in unObjArray for the color; easier to build legend using one array
    //     unObjArray[i].color = color
    // }

    //sets legend title
    var legendTitle = legendSvg.append("text")
        .attr("class", "legendTitle")
        .attr("transform", "translate(75,30)")
        .text("Legend")

    //sets legend subtitle
    var legendIsolateTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendIsolateTitle")
          .attr("transform", "translate(81,60)")
          .text("Isolates")
          .style("text-align", "center")

    //rect to hold styling
    var isoBackButton = legendSvg.append("rect")
        .attr("id", "isolateBack")
        .attr("height", "15px")
        .attr("width", "50px")
        .attr("transform", "translate(4,47)")
    //text of button
    var isoButtonText = legendSvg.append("text")
        .attr("class", "buttonText")
        .attr("id", "isolateButtonText")
        .attr("transform", "translate(10,59)")
        .text("Add All")
    //clickable rect
    var isoSelectButton = legendSvg.append("rect")
        .attr("id", "isolateSelect")
        .attr("height", "15px")
        .attr("width", "50px")
        .attr("transform", "translate(4,47)")
        .attr("title", "Cannot display isolates while trade cities are showing on map.")
        .on("click", function(){
            if (d3.select(".isolate_checkbox")[0][0].disabled == false){
                updateButton("isolate", isolateLegendArray);
                setCheckbox();
            }
        })
        .on("mouseover", isoButtonMouseover)
        .on("mouseout", function(){
            buttonMouseout(this);
        })

    //creates a group for each rectangle and offsets each by same amount
    var legendIsolate = legendSvg.selectAll('.legendIsolate')
        .data(isolateLegendArray)
        .enter()
      .append("g")
        .attr("class", "legendIsolate")
        .attr("transform", function(d, i) {
            var height = rectWidth + legendSpacing;
            var offset =  height;
            var horz = 2 * rectWidth;
            var vert = i * height - offset + 195;
            return 'translate(' + horz + ',' + vert + ')';
        });

    //creates rect elements for legened
    var legendIsolateRect = legendIsolate.append('rect')
        .attr("class", "legendIsolateRect")
        .attr("x", -12)
        .attr("y", -103)
        .attr("width", 6)
        .attr("height", 6)
        // .attr("transform", "translate(-35,-125)")
        .style('fill', function(d){ return d.fill })

    //adds text to legend
    var legendIsolateText = legendIsolate.append('text')
        .attr("class", "legendText")
        .attr("transform", "translate(5, -97)")
        .text(function(d) { return d.text });

    // //checkboxes for each isolate precision
    var checkboxesIsolate = legendIsolate.append("foreignObject")
        .attr('width', "20px")
        .attr('height', "20px")
        .attr("transform", "translate(-47, -108)")
      .append("xhtml:body")
        .html(function(d, i) {
            //create ID for checkboxes
            var isolateID = isolateLegendArray[i].value + "_check";

            return "<form><input type=checkbox class='isolate_checkbox' id='" + isolateID + "' title='Cannot display isolates while trade cities are showing on map.'</input></form>"
        })
        .on("mouseover", function(){

          checkboxMouseover("isolate")
        })
        .on("change", isoCheckboxChange);

      //sets legend title
      var legendHubTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendHubTitle")
          .attr("transform", "translate(63,128)")
          .text("Trade Cities")

      //creates rect elements for legened
      var legendHubCircle = legendSvg.append('circle')
          .attr("class", "tradeHubs")
          .attr("cx", "32")
          .attr("cy", "140")
          .attr("r", "5")

      //adds text to legend
      var legendHubText = legendSvg.append('text')
          .attr("class", "legendText")
          .attr("transform", "translate(44,143)")
          .text("Major Trade City");

      //checkboxes for each route
      var checkboxesHub = legendSvg.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-7, 129)")
        .append("xhtml:body")
          .html("<form><input type=checkbox class='hub_checkbox' id='tradeHubs_check' title='Cannot display trade cities while isolates are showing on map.'</input></form>")
          .on("mouseover", hubMouseover)
          .on("change", function(){
              //event listener function for clicking checkbox
              checkboxChange("hub", "none")
              //updates disabled property of isolate checkboxes appropriately
              setCheckbox();
          });

      //sets legend title
      var legendRouteTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendRouteTitle")
          .attr("transform", "translate(60,174)")
          .text("Trade Routes")

      //rect to hold styling
      var routeBackButton = legendSvg.append("rect")
          .attr("id", "routeBack")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,161)")
      //text of button
      var routeButtonText = legendSvg.append("text")
          .attr("class", "buttonText")
          .attr("id", "routeButtonText")
          .attr("transform", "translate(6,173)")
          .text("Clear All")
      //clickable rect
      var routeSelectButton = legendSvg.append("rect")
          .attr("id", "routeSelect")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,161)")
          .on("click", function(){
              updateButton("route", routeObjArray);
          })
          .on("mouseover", function(){
              buttonMouseover(this)
          })
          .on("mouseout", function(){
              buttonMouseout(this);
          })


      //creates a group for each rectangle and offsets each by same amount
      var legendRoute = legendSvg.selectAll('.legendRoute')
          .data(routeObjArray)
          .enter()
        .append("g")
          .attr("class", "legendRoute")
          .attr("transform", function(d, i) {
              var height = rectWidth + legendSpacing;
              var offset =  height * routeObjArray.length / 2;
              var horz = 2 * rectWidth;
              var vert = i * height - offset + 235;
              return 'translate(' + horz + ',' + vert + ')';
        });

      // //creates rect elements for legened
      var legendRouteRect = legendRoute.append('rect')
          .attr("class", "legendRouteRect")
          .attr("id", function(d){ return "legend_" + d.value })
          .attr('width', rectWidth)
          .attr('height', rectHeight)
          .attr("transform", "translate(-20,-3)")
          .style('fill', function(d){ return d.color })
          .style('stroke', function(d){ return d.color });

      //adds text to legend
      var legendRouteText = legendRoute.append('text')
          .attr("class", "legendText")
          .attr("transform", "translate(5, 0)")
          .text(function(d) { return d.text });

      //checkboxes for each route
      var checkboxesRoute = legendRoute.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-47, -11)")
        .append("xhtml:body")
          .html(function(d, i) {
              //create ID for checkboxes
              var routeID = routeObjArray[i].value + "_check";
              return "<form><input type=checkbox class='route_checkbox' id='" + routeID + "'</input></form>"
          })
          .on("change", function(){
              checkboxChange("route", "none")
          });

      //sets legend title
      var legendUNTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendUNTitle")
          .attr("transform", "translate(60,288)")
          .text("UN Regions")

      //rect to hold styling
      var UNBackButton = legendSvg.append("rect")
          .attr("id", "unBack")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,275)")
      //text of button
      var unButtonText = legendSvg.append("text")
          .attr("class", "buttonText")
          .attr("id", "unButtonText")
          .attr("transform", "translate(9,287)")
          .text("Add All")
      //clickable rect
      var unSelectButton = legendSvg.append("rect")
          .attr("id", "unSelect")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,275)")
          .attr("title", 'Cannot display UN Regions while Lineage Frequency overlays are on the map.')
          .on("click", function(){
              if (d3.select(".un_checkbox")[0][0].disabled == false){

                  updateButton("un", unObjArray);
                  //updates disabled property of trade hub checkbox appropriately
                  setCheckbox();
              }
          })
          .on("mouseover", function(){
              if (d3.select(".un_checkbox")[0][0].disabled == false){

                //changes cursor because check boxes are disabled
                d3.select(this).style("cursor", "pointer")

                //remove tooltip instructing user they can't have lineage frequency and Un overlays on map at same time
                $("#unSelect").tooltip("disable");

                buttonMouseover(this);
              } else {
                  //changes cursor because check boxes are disabled
                  d3.select(this).style("cursor", "not-allowed")

                  //display tooltip instructing user they can't have lineage frequency and Un overlays on map at same time
                  $("#unSelect").tooltip("enable");

              }
          })
          .on("mouseout", function(){
              buttonMouseout(this);
          })

      var AfrRegionTitle = legendSvg.append("text")
          .attr("class", "unRegionTitle")
          .attr("transform", "translate(24, 314)")
          .text("Africa")

      //checkboxes for UN Group
      var checkboxAfrUn = legendSvg.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-7, 299)")
        .append("xhtml:body")
          .html("<form><input type=checkbox class='un_checkbox' id='Africa_check' title='Cannot display UN Regions while Lineage Frequency overlays are on the map.'</input></form>")
          .on("change", function(){
              unGroupCheckboxChange("Africa");
              //updates disabled property of trade hub checkbox appropriately
              setCheckbox();
          })
          .on("mouseover", function(){
              checkboxMouseover("un");
          })

      var AsiaRegionTitle = legendSvg.append("text")
          .attr("class", "unRegionTitle")
          .attr("transform", "translate(24, 438.5)")
          .text("Asia")

      //checkboxes for UN Group
      var checkboxAsiaUn = legendSvg.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-7, 423.5)")
        .append("xhtml:body")
          .html("<form><input type=checkbox class='un_checkbox' id='Asia_check' title='Cannot display UN Regions while Lineage Frequency overlays are on the map.'</input></form>")
          .on("change", function(){
              unGroupCheckboxChange("Asia");
              //updates disabled property of trade hub checkbox appropriately
              setCheckbox();
          })
          .on("mouseover", function(){
              checkboxMouseover("un");
          });

      var EurRegionTitle = legendSvg.append("text")
          .attr("class", "unRegionTitle")
          .attr("transform", "translate(24, 563)")
          .text("Europe")

      //checkboxes for UN Group
      var checkboxEurUn = legendSvg.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-7, 548)")
        .append("xhtml:body")
          .html("<form><input type=checkbox class='un_checkbox' id='Europe_check' title='Cannot display UN Regions while Lineage Frequency overlays are on the map.'</input></form>")
          .on("change", function(){
              unGroupCheckboxChange("Europe");
              //updates disabled property of trade hub checkbox appropriately
              setCheckbox();
          })
          .on("mouseover", function(){
              checkboxMouseover("un");
          });

      var OceaniaRegionTitle = legendSvg.append("text")
          .attr("class", "unRegionTitle")
          .attr("transform", "translate(24, 666.75)")
          .text("Oceania")

      //checkboxes for UN Group
      var checkboxOceaniaUn = legendSvg.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-7, 651.75)")
        .append("xhtml:body")
          .html("<form><input type=checkbox class='un_checkbox' id='Oceania_check' title='Cannot display UN Regions while Lineage Frequency overlays are on the map.'</input></form>")
          .on("change", function(){
              unGroupCheckboxChange("Oceania");
              //updates disabled property of trade hub checkbox appropriately
              setCheckbox();
          })
          .on("mouseover", function(){
              checkboxMouseover("un");
          });

      //creates a group for each rectangle and offsets each by same amount
      var legendUN = legendSvg.selectAll('.legendUN')
          .data(unObjArray)
          .enter()
        .append("g")
          .attr("class", "legendUN")
          .attr("transform", function(d, i) {

              var height = rectWidth + legendSpacing;
              var offset =  height * routeObjArray.length / 2;
              var horz = 2 * rectWidth;

              //conditionals to leave a space after each Continent
              if (d.group == "Africa"){
                  var vert = i * height - offset + 82.75;

              } else if (d.group == "Asia") {
                  var vert = (i+1) * height - offset + 82.75;
              } else if (d.group == "Europe") {
                  var vert = (i+2) * height - offset + 82.75;
              } else if (d.group == "Oceania") {
                  var vert = (i+3) * height - offset + 82.75;
              }

              return 'translate(' + horz + ',' + vert + ')';


        });

      //creates rect elements for legened
      var legendUNRect = legendUN.append('rect')
          .attr("class", "legendUNRect")
          .attr('width', 20)
          .attr('height', 10)
          .attr("transform", "translate(-20,280)")
          .style('fill', function(d){ return d.color })

      //adds text to legend
      var legendUNText = legendUN.append('text')
          .attr("class", "legendText")
          .attr("transform", "translate(5, 288.5)")
          .text(function(d) { return d.text });

      //checkboxes for each UN Region
      var checkboxesUN = legendUN.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-47, 274)")
        .append("xhtml:body")
          .html(function(d) {
              //create ID for checkboxes
              var unID = d.value + "_check";
              var unGroup = d.group + "_check"
              return "<form><input type=checkbox class='un_checkbox " + unGroup + "' id='" + unID + "' title='Cannot display UN Regions while Lineage Frequency overlays are on the map.'</input></form>"
          })
          .on("change", function(d){
              checkboxChange("un", d.group)
              //updates disabled property of trade hub checkbox appropriately
              setCheckbox();
          })
          .on("mouseover", function(){
              checkboxMouseover("un")
          });

      //function that sets default state of legend
      initializeLegend();
};

// calls code that sets default state of legend; keeping it separate from code for structure of legend
function initializeLegend() {
    //initializes jQuery UI tooltip for Add All button
    $("#isolateSelect").tooltip();
    //initializes jQuery UI tooltip for checkbox
    $("#exactIsolates_check").tooltip();
    //initializes jQuery UI tooltip for checkbox
    $("#randomIsolates_check").tooltip();
    //initializes jQuery UI tooltip for checkbox
    $(".hub_checkbox").tooltip();
    //disables tooltip because the checkbox is checked and we only need message when it is not
    $(".hub_checkbox").tooltip("disable");
    //initializes jQuery UI tooltip for checkbox
    $(".un_checkbox").tooltip();
    //disables tooltip because the checkbox is checked and we only need message when it is not
    $(".un_checkbox").tooltip("disable");
    //initializes jQuery UI tooltip for Add All button
    $("#unSelect").tooltip();
    //disables jQuery UI tooltip for Add All button
    $("#unSelect").tooltip("disable");


    //checks all routes by default
    for (i=0; i<routeObjArray.length; i++) {
        var route = routeObjArray[i].value;
        d3.select("#" + route + "_check")[0][0].checked = true;
    }

    //checks all isolates by default
    for (i=0; i<isolateLegendArray.length; i++) {
        var isolate = isolateLegendArray[i].value;
        d3.select("#" + isolate + "_check")[0][0].disabled = true;
    }

    //checks trade hubs by default
    d3.select(".hub_checkbox")[0][0].checked = true;

}

//function to update checkboxes of UN Group as well as depict UN Regions on map
function unGroupCheckboxChange(unGroup){
    //selects current checkbox and stores whether or not it is checked
    var checked = d3.select("#" + unGroup + "_check")[0][0].checked

    if (checked == true){  //if unchecking UN Group checkbox...
        var checkboxes = d3.selectAll("." + unGroup + "_check")
        //updates checkboxes
        checkboxes.forEach(function(d, i){
            // loop through each checkbox element in array
            for (j=0; j<checkboxes[0].length; j++) {

                // checks each checkbox
                d[j].checked = true
            }
        })
        //updates visibility of all UN Regions in Africa UN Group
        d3.selectAll("." + unGroup).attr("visibility", "visible");

    } else if (checked == false){ //if unchecking UN Group checkbox...
        var checkboxes = d3.selectAll("." + unGroup + "_check")
        //updates checkboxes
        checkboxes.forEach(function(d, i){
        // loop through each checkbox element in array
            for (j=0; j<checkboxes[0].length; j++) {

                // unchecks each checkbox
                d[j].checked = false
            };
        });
        //updates visibility of all UN Regions in Africa UN Group
        d3.selectAll("." + unGroup).attr("visibility", "hidden");
    };

    //counter variable to determine if Add/Clear All button texts need to be updated
    var itemCount = 0;
    var regionChecked = d3.selectAll(".un_checkbox")[0];


    //loops through all checkboxes of certain type and counts how many are checked
    for (j=0; j<regionChecked.length; j++){
        if (regionChecked[j].checked == true){ //if checkbox is checked, add one to counter
            itemCount += 1
        }
    }
    //if all of the checkboxes of a certain item are checked, call checkButtons function
    if (regionChecked.length == itemCount){
        //updates text of button if necessary
        checkButtons("un", itemCount);
    } else if (itemCount == 0) {//if none of the checkboxes of a certain item are checked, call checkButtons function
        //updates text of button if necessary
        checkButtons("un", itemCount);
    }

};

function checkboxChange(item, unGroup){
    //select all checkboxes
    var checked = d3.selectAll("." + item + "_checkbox")[0];

    for (i=0; i<checked.length; i++) {
        if (checked[i].checked === true) { //un checkbox checked in legend
          // console.log(checked[i]);
          //gets ID, which contains element to update
          var getID = checked[i].id;
          // console.log(checked[i]);
          //trim "_check" from end of ID string
          var getClass = getID.slice(0, -6);
          // console.log(getClass);
          //update visibility of selected un region
          d3.selectAll("#" + getClass)
              .attr("visibility", "visibile")

        } else { //if unchecked in legend
            //gets ID, which contains element to update
            var getID = checked[i].id;
            //trim "_check" from end of ID string
            var getClass = getID.slice(0, -6);
            //update ID and visibility for isolates of selected lineages in dropdown when isolate precision is unchecked
            d3.selectAll("#" + getClass)
                .attr("visibility", "hidden")
        }
    }

    //conditional only for UN Regions -- if all UN Regions in a group are selected, select that group's checkbox
    if (unGroup != "none") {
        //select all Africa checkboxes
        var groupCheckboxes = d3.selectAll("." + unGroup + "_check")[0];
        //counter variable to determine when to check/uncheck UN Group checkbox
        var checkCount = 0;

        if (unGroup == "Europe"){ // for Europe, bump checkcount start to 1 because it only has 4 regions
            checkCount = 1;
        } else if(unGroup == "Oceania"){ // for Oceania, bump checkcount start to 3 because it only has 2 regions
            checkCount = 3;
        }

        // loops through all checkboxes of this UN Group
        for (j=0; j<groupCheckboxes.length; j++){
            if (groupCheckboxes[j].checked == true){ //if checkbox is checked, add one to counter
                checkCount += 1
            }
            if (checkCount == 5) { //if counter variable reaches threshold, check UN Group checkbox
                //check the checkbox
                d3.select("#" + unGroup + "_check")[0][0].checked = true;
            } else {
                //uncheck the checkbox
                d3.select("#" + unGroup + "_check")[0][0].checked = false;

            }
        }
    }

    //counter variable to determine if Add/Clear All button texts need to be updated
    var itemCount = 0;
    //prevent checkButtons function from being called on trade cities because it has no Add/Clear All button
    if (item == "hub") {
        itemCount -= 1;
    }

    //loops through all checkboxes of certain type and counts how many are checked
    for (j=0; j<checked.length; j++){
        if (checked[j].checked == true){ //if checkbox is checked, add one to counter
            itemCount += 1
        }
    }
    //if all of the checkboxes of a certain item are checked, call checkButtons function
    if (checked.length == itemCount){
        //updates text of button if necessary
        checkButtons(item, itemCount);
    } else if (itemCount == 0) {//if none of the checkboxes of a certain item are checked, call checkButtons function
        //updates text of button if necessary
        checkButtons(item, itemCount);
    }

}

function hubMouseover() {
    //checks if trade hub checkbox is disabled
    if (d3.select(".hub_checkbox")[0][0].disabled == true){
        //make the cursor a not allowed symbol
        d3.select(".hub_checkbox")
            .style("cursor", "not-allowed")

        //enable jQuery UI Tooltip for the trade hub checkbox
        $(".hub_checkbox").tooltip("enable");
    } else { //if checkbox is enabled
        //make cursor the pointer symbol
        d3.select(".hub_checkbox")
            .style("cursor", "pointer")

        //disable jQuery UI Tooltip for the trade hub checkbox
        $(".hub_checkbox").tooltip("disable");
    }
}


function checkButtons(item, itemCount){
    if (item == "route") {
        //y coordinate for transform, translate
        vert = 173;
    } else if (item == "un") {
        //y coordinate for transform, translate
        vert = 287;
    } else if (item == "isolate") {
        //y coordinate for transform, translate
        vert = 59;
    }

    if (itemCount > 0){
        //retrieves button text to determin action
        var buttonText = d3.select("#" + item + "ButtonText")[0][0].innerHTML;

        if (buttonText == "Add All"){//removes all items based on which button is clicked
            //for button text placement
            horz = 6;

            //change button text
            d3.select("#" + item + "ButtonText").text("Clear All")
                .attr("transform", "translate("+ horz + "," + vert + ")")
        }
    } else if (itemCount == 0) {
        //retrieves button text to determin action
        var buttonText = d3.select("#" + item + "ButtonText")[0][0].innerHTML;

        if (buttonText == "Clear All"){//removes all items based on which button is clicked
            //for button text placement
            horz = 9;

            //change button text
            d3.select("#" + item + "ButtonText").text("Add All")
                .attr("transform", "translate("+ horz + "," + vert + ")")
        }
    }
}

//holds event function for mouseout of all/clear all buttons
function buttonMouseout(button) {
    //extract ID of whichever rectangle is clicked
    var buttonID = button.id;
    //changes click to back in ID string so we can change fill
    var rectID = buttonID.replace("Select", "Back")
    //change fill
    d3.select("#" + rectID).style({
      "fill": "#eee",
      "stroke": "#ddd",
      "stroke-width": "1px"
    })
}

//holds event function for mouseover of add all/clear all button
function buttonMouseover(button) {
    //extract ID of rectangle is clicked
    var buttonID = button.id;
    //changes click to back in ID string so we can change fill
    var rectID = buttonID.replace("Select", "Back")
    //change fill
    d3.select("#" + rectID).style({
        "stroke": "#aaa",
        "stroke-width": "2px",
    })
}

//function to hold event listener for mouseover of Add/Clear ALl button for isolates in legend
function isoButtonMouseover(){
    if (d3.select(".isolate_checkbox")[0][0].disabled == false){ //if isolate checkboxes are NOT disabled (i.e., not cities showing on the map)

        //display tooltip instructing user they can't have isolates and trade cities on map at same time
        $("#isolateSelect").tooltip("disable");

        //call mouseover event listener
        buttonMouseover(this);

    } else { //if isolate checkboxes are disabled (i.e., cities showing on the map
        //update cursor
        d3.select("#isolateSelect")
            .style("cursor", "not-allowed")

        //display tooltip instructing user they can't have isolates and trade cities on map at same time
        $("#isolateSelect").tooltip("enable");
    }
}

//function holding event listener for mouseover of isolate checkboxes in legend
function checkboxMouseover(item){

    //select both all checkboxes for item
    var checkbox = d3.selectAll("." + item + "_checkbox")[0][0]
    if (checkbox.disabled == false){ //if the isolate checkboxes are NOT disabled (i.e., trade cities are not on map)
        //changes cursor to pointer when checkboxes can be clicked
        d3.selectAll("." + item + "_checkbox")
            .style("cursor", "pointer")

        if (item == "isolate"){
            //retrieve innerHTML of the checkbox as a string to search
            var checkboxHTML = d3.select(this.childNodes)[0][0][0].innerHTML;

            //search string for substring to determine which checkbox is selected
            var isExact = checkboxHTML.indexOf("exact")

            if (isExact == -1) { //randomIsolates checkbox selected
                //disables jQuery UI tooltip for checkbox
                $("#randomIsolates_check").tooltip("disable");
            } else if (isExact > -1) { //exactIsolates checkbox selected
                //disables jQuery UI tooltip for checkbox
                $("#exactIsolates_check").tooltip("disable");
            }
        } else {
            //disables jQuery UI tooltip for checkbox
            $(".un_checkbox").tooltip("disable");

        }
    } else { //if the isolate checkboxes are disabled (i.e., trade cities are on map)
        d3.selectAll("." + item + "_checkbox")
            .style("cursor", "not-allowed")
        if (item == "isolate"){
            //retrieve innerHTML of the checkbox as a string to search
            var checkboxHTML = d3.select(this.childNodes)[0][0][0].innerHTML;

            //search string for substring to determine which checkbox is selected
            var isExact = checkboxHTML.indexOf("exact")

            if (isExact == -1) { //randomIsolates checkbox selected
                //enables jQuery UI tooltip for checkbox
                $("#randomIsolates_check").tooltip("enable");
            } else if (isExact > -1) { //exactIsolates checkbox selected
                //enables jQuery UI tooltip for checkbox
                $("#exactIsolates_check").tooltip("enable");
            }
        } else {
            //enables jQuery UI tooltip for checkbox
            $(".un_checkbox").tooltip("enable");
        }
    }
}

function isoCheckboxChange(){
    //select both checkboxes
    var checked = d3.selectAll(".isolate_checkbox")[0];

    for (i=0; i<checked.length; i++) {
        if (checked[i].checked === true) { //isolate checkbox checked in legend
          //gets ID, which contains element to update
          var getID = checked[i].id;
          //trim "_check" from end of ID string
          var getClass = getID.slice(0, -6);

          //update ID and visibility for isolates of selected lineages in dropdown when isolate precision is checked
          d3.select("." + getClass).selectAll("rect").filter(".notFiltered")
              .attr("visibility", "visibile")
              .attr("class", function(d){
                  //retrieve lineage of current isolate for class
                  var lineage = d.properties.lineage_of
                  //update class from unchecked to checked
                  return "lin_" + lineage + " notFiltered checked"
              })

          //update ID for isolates of unselected lineages in dropdown when isolate precision is checked
          d3.select("." + getClass).selectAll("rect").filter(".filtered")
              .attr("class", function(d){
                  //retrieve lineage of current isolate for class
                  var lineage = d.properties.lineage_of
                  //update class from unchecked to checked
                  return "lin_" + lineage + " filtered checked"
              })

        } else { //if unchecked in legend
            //gets ID, which contains element to update
            var getID = checked[i].id;
            //trim "_check" from end of ID string
            var getClass = getID.slice(0, -6);
            //update ID and visibility for isolates of selected lineages in dropdown when isolate precision is unchecked
            d3.selectAll("." + getClass).selectAll("rect").filter(".notFiltered")
                .attr("visibility", "hidden")
                .attr("class", function(d){
                    //retrieve lineage of current isolate for class
                    var lineage = d.properties.lineage_of
                    //update class from unchecked to checked
                    return "lin_" + lineage + " notFiltered unchecked"
                })
            //update ID for isolates of unselected lineages in dropdown when isolate precision is unchecked
            d3.selectAll("." + getClass).selectAll("rect").filter(".filtered")
                .attr("class", function(d){
                    //retrieve lineage of current isolate for class
                    var lineage = d.properties.lineage_of
                    //update class from unchecked to checked
                    return "lin_" + lineage + " filtered unchecked"
                })
        }
    }
    //counter variable to determine if Add/Clear All button texts need to be updated
    var itemCount = 0;

    //loops through all checkboxes of certain type and counts how many are checked
    for (j=0; j<checked.length; j++){
        if (checked[j].checked == true){ //if checkbox is checked, add one to counter
            itemCount += 1
        }
    }
    //if all of the checkboxes of a certain item are checked, call checkButtons function
    if (checked.length == itemCount){
        //updates text of button if necessary
        checkButtons("isolate", itemCount);
    } else if (itemCount == 0) {//if none of the checkboxes of a certain item are checked, call checkButtons function
        //updates text of button if necessary
        checkButtons("isolate", itemCount);
    }

    //updates disabled property of trade hub checkbox appropriately
    setCheckbox();
}
//update disabled property of trade hub and isolate checkboxes so both cannot be displayed on map
function setCheckbox(){
    //selects trade hub checkbox
    var hubCheck = d3.select(".hub_checkbox")[0][0]

    //selects exact isolates checkbox
    var exactCheck = d3.select("#exactIsolates_check")[0][0]

    //selects random isolates checkbox
    var randomCheck = d3.select("#randomIsolates_check")[0][0]

    //selects un checkboxes
    var unCheck = d3.selectAll(".un_checkbox")[0]

    //retrieves whether trade hub checkbox is checked or not (stored as true/false)
    var checkedHub = hubCheck.checked

    //retrieves whether exact isolates is checked or not (stored as true/false)
    var checkedExact = exactCheck.checked

    //retrieves whether random isolates is checked or not (stored as true/false)
    var checkedRandom = randomCheck.checked

    //creates variable with default of false because following statement changes to true if any checkbox is checked
    var checkedUn = false;

    //retrieves whether any UN checkbox is checked or not (stored as true/false)
    unCheck.forEach(function(d){
        if (d.checked == true) {
            checkedUn = true
        }
    })

    if (checkedHub == true) { //if trade hubs checkbox is checked...
        //set both isolate checkboxes to be disabled
        exactCheck.disabled = true
        randomCheck.disabled = true
    } else if (checkedHub == false) { //if trade hubs checkbox is NOT checked...
        //set both isolate checkboxes to be enabled
        exactCheck.disabled = false
        randomCheck.disabled = false
        //enable lineage multiselect
        $("#isoSelect").multiselect("enable")

        //update cursor property for "add all"/"clear all" button to be pointer again
        d3.select("#isolateSelect")
            .style("cursor", "pointer")
    }

    if (checkedExact == true || checkedRandom == true) { //if either isolate checkbox is checked...
        //set trade hub checkbox to disabled
        hubCheck.disabled = true
    } else if (checkedExact == false && checkedRandom == false) { //if both isolate checkboxes are NOT checked...
        //set trade hub checkbox to enabled
        hubCheck.disabled = false

        //disable lineage multiselect
        $("#isoSelect").multiselect("disable")

    }

    if (checkedUn == true) {
        //disables lineage frequency overlays if any un checkbox is checked
        $("#linSelect").selectmenu("disable")
    } else {
        //enables lineage frequency overlays if any un checkbox is checked
        $("#linSelect").selectmenu("enable")
    }
}

//updates button text in legend
function updateButton(item, array){
    //calculate length of array
    var length = array.length;
    //variables for placing button text
    var vert = 59,
        horz = 9;

    //retrieves button text to determin action
    var buttonText = d3.select("#" + item + "ButtonText")[0][0].innerHTML;

    if (buttonText == "Clear All"){//removes all items based on which button is clicked
        if (item === "route") {
            vert += 114;
        } else if (item === "un") {
            vert += 228;
        }

        //change button text and text position
        d3.select("#" + item + "ButtonText").text("Add All")
            .attr("transform", "translate("+ horz + "," + vert + ")")

        var checkboxes = d3.selectAll("." + item + "_checkbox");

        //updates checkboxes
        checkboxes.forEach(function(d){
              // loop through each checkbox element in array
              for (j=0; j<checkboxes[0].length; j++) {
                  // unchecks each checkbox
                  d[j].checked = false
              }
        })
        //update values in proper array
        if (item === "isolate") {
            //select both checkboxes
            var checked = d3.selectAll(".isolate_checkbox")[0];

            for (i=0; i<checked.length; i++) {
                if (checked[i].checked === false) { //isolate checkbox not checked in legend

                    //gets ID, which contains element to update
                    var getID = checked[i].id;
                    //trim "_check" from end of ID string
                    var getClass = getID.slice(0, -6);
                    //update ID and visibility for isolates of selected lineages in dropdown when isolate precision is unchecked
                    d3.selectAll("." + getClass).selectAll("rect").filter(".notFiltered")
                        .attr("visibility", "hidden")
                        .attr("class", function(d){
                            //retrieve lineage of current isolate for class
                            var lineage = d.properties.lineage_of
                            //update class from unchecked to checked
                            return "lin_" + lineage + " notFiltered unchecked"
                        })
                    //update ID for isolates of unselected lineages in dropdown when isolate precision is unchecked
                    d3.selectAll("." + getClass).selectAll("rect").filter(".filtered")
                        .attr("class", function(d){
                            //retrieve lineage of current isolate for class
                            var lineage = d.properties.lineage_of
                            //update class from unchecked to checked
                            return "lin_" + lineage + " filtered unchecked"
                        })
                };
            };
        } else if (item === "route" || item === "un") {
            //updates visibility of item appropriately
            checkboxChange(item, "none")
        }
    }

    if (buttonText == "Add All") {//adds all items based on which button is clicked

        //for button text placement
        horz = 6;

        if (item === "route") {
            //moves label to appropriate place
            vert += 114;
        } else if (item === "un") {
            vert += 228;
        }

        //change button text
        d3.select("#" + item + "ButtonText").text("Clear All")
            .attr("transform", "translate("+ horz + "," + vert + ")")

        var checkboxes = d3.selectAll("." + item + "_checkbox");
        //updates checkboxes
        checkboxes.forEach(function(d){
              // loop through each checkbox element in array
              for (j=0; j<checkboxes[0].length; j++) {
                  // unchecks each checkbox
                  d[j].checked = true
              }
        });
        //update values in proper array
        if (item === "isolate") {
            //select both checkboxes
            var checked = d3.selectAll(".isolate_checkbox")[0];

            for (i=0; i<checked.length; i++) {
                if (checked[i].checked === true) { //isolate checkbox checked in legend
                    //gets ID, which contains element to update
                    var getID = checked[i].id;
                    //trim "_check" from end of ID string
                    var getClass = getID.slice(0, -6);

                    //update ID and visibility for isolates of selected lineages in dropdown when isolate precision is checked
                    d3.select("." + getClass).selectAll("rect").filter(".notFiltered")
                        .attr("visibility", "visibile")
                        .attr("class", function(d){
                            //retrieve lineage of current isolate for class
                            var lineage = d.properties.lineage_of
                            //update class from unchecked to checked
                            return "lin_" + lineage + " notFiltered checked"
                        })
                    //update ID for isolates of unselected lineages in dropdown when isolate precision is checked
                    d3.select("." + getClass).selectAll("rect").filter(".filtered")
                        .attr("class", function(d){
                            //retrieve lineage of current isolate for class
                            var lineage = d.properties.lineage_of
                            //update class from unchecked to checked
                            return "lin_" + lineage + " filtered checked"
                        })
                }
            };
        } else if (item === "route" || item === "un") {
            //updates visibility of item appropriately
            checkboxChange(item);
        }
    };
};


//updates visibility of routes based on whether or not route is checked in legend
function updateVisibility(array) {
    for (i=0; i<array.length; i++) {

        if (array.length === 5) { //who_regions have individual IDs
            //store ID
            var item = d3.selectAll("#" + array[i].value)
        } else { //routes have classes
            //store class
            var item = d3.selectAll("." + array[i].value)
        }

        //checks if route is selected
        if (array[i].checked === 1){
            item.attr("visibility", "visible")
        } else {
            item.attr("visibility", "hidden")
        }
    }
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
function setCheckedProp(array, className) {
    //calculate length of array
    var length = array.length;
    //select all of the appropriate checkboxes
    var checked = d3.selectAll("." + className + "_checkbox");
    //loop through array of checkbox elements
    checked.forEach(function(d) { //d is array of all checkbox elements
        // loop through each checkbox element in array
        for (j=0; j<length; j++) {
            //if the checkbox is checked, do this
            if (d[j].checked == true) {
                //gets ID, which contains element to update
                var getID = d[j].id;
                //trim "_check" from end of ID string
                var att = getID.slice(0, -6);
                // loop through array of objects and sets checked property to 1
                for (i=0; i<array.length; i++){
                    if (array[i].value == att) {
                        array[i].checked = 1;
                    };
                };
            } else { //if the checkbox isn't checked, do this
                var getID = d[j].id;
                //trim "_check" from end of ID string
                var att = getID.slice(0, -6);
                // loop through array of objects and sets checked property to 0
                for (i=0; i<array.length; i++){
                    if (array[i].value == att) {
                        array[i].checked = 0;
                    };
                };
            };
        };
    });

    return array;
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
//function to retrieve lineage frequency property for currently selected lineage
function findLineageProperty(props) {
    //retrieve current selection from lineage frequency dropdown menu
    var currentLineage = d3.select(".ui-selectmenu-text").text().toLowerCase().replace(" ", "_");
    //define variable as 0 to be updated according to current lineage
    var lineageNumber = "0";
    //define variable as blank to be updated according to current lineage
    var lineageType = "";
    //check if current lineage is 1
    if (currentLineage.indexOf ("1") != -1){
        lineageNumber = "1"
    } else if (currentLineage.indexOf ("2") != -1){ //check if current lineage is 2
        lineageNumber = "2"
    } else if (currentLineage.indexOf ("3") != -1){ //check if current lineage is 3
        lineageNumber = "3"
    } else if (currentLineage.indexOf ("4") != -1){ //check if current lineage is 4
        lineageNumber = "4"
    }
    //check if current lineage is spoligo
    if (currentLineage.indexOf("spoligo") != -1) {
        lineageType = "Spo"
    } else {
        lineageType = "Gen"
    }
    //define variable as string to check in properties of current countryJson
    //if property is -999 we want to disable mouseover
    var lineageProperty = "per14L" + lineageNumber + lineageType

    return lineageProperty
}

//function to highlight enumeration units and bars
function highlightCountry(props){

    //retrieve current lineage property name
    var lineageProperty = findLineageProperty(props)
    //check if current lineage is defined (i.e., >= 0) and highlight accordingly
    //don't want to highlight countries that don't have any data
    if (props[lineageProperty] > -1){
      	//change stroke
      	var selected = d3.selectAll("#" + props.shortName)
        		.style({
        			"stroke": "black",
              "stroke-width": "2",
        		});

      	setLabel(props);
    }
};

//function to create dynamic label
function setLabel(props){
    //gets current lineage from the dropdown menu selection
    var currentLineage = d3.select(".ui-selectmenu-text").text().toLowerCase().replace(" ", "_");
    //conditional to display appropriate percent spoligo or otherwise
    if (currentLineage.indexOf("spoligo") != -1) {
        var percent1 = +props.per14L1Spo;
        percent1 = percent1.toFixed(2) + "%";

        var percent2 = +props.per14L2Spo;
        percent2 = percent2.toFixed(2) + "%";

        var percent3 = +props.per14L3Spo;
        percent3 = percent3.toFixed(2) + "%";

        var percent4 = +props.per14L4Spo;
        percent4 = percent4.toFixed(2) + "%";

    } else {
        var percent1 = +props.per14L1Gen;
        percent1 = percent1.toFixed(2) + "%";

        var percent2 = +props.per14L2Gen;
        percent2 = percent2.toFixed(2) + "%";

        var percent3 = +props.per14L3Gen;
        percent3 = percent3.toFixed(2) + "%";

        var percent4 = +props.per14L4Gen;
        percent4 = percent4.toFixed(2) + "%";

    }
    //puts the labels into an array so we can feed into d3 code block as "data"
    var labelArray = [percent1, percent2, percent3, percent4];

  	//label content
  	var labelAttribute = "<h1>" + props.name + "</h1>";

  	//create info label div
  	var infolabel = d3.select("body")
  		.append("div")
  		.attr({
  			"class": "infolabel",
  			"id": props.name + "_label"
  		})
  		.html(labelAttribute);

  	var linFreqPct = infolabel.append("div")
  		.attr("class", "linFreqPct")
  		.html(function(){
          var pctList = "<div class='pctList'>"
          for (i=0; i<labelArray.length; i++){
              var lineage = i + 1
              pctList = pctList + "<p class='lineage_" + lineage + "'><b>Lineage " + lineage + ":</b> " + labelArray[i] + "</p>"
          }
          pctList += "</div>"

          return pctList;
      });

    d3.select(".pctList").style({"color": "white", "font-weight": "normal"})

    //splits the current lineage by space so that I can highlight the proper lineage
    var linSplit = currentLineage.split(" ");
    //the lineage number is first element in split array; need to use it to select appropriate lineage by class to highlight in popup
    var linClass = linSplit[0]
    //select current lineage in popup to highlight it
    d3.select("." + linClass).style({"color": "#a60704", "font-weight": "bold"})
};

//function to reset the element style on mouseout
function dehighlightCountry(props){
	 var selected = d3.selectAll("#" + props.shortName)
      .style({
        // "stroke": "none"
          "stroke": "#CCC",
          "stroke-width": "1px"
      })

	//remove info label
	d3.select(".infolabel")
		.remove();
};

//function to move info label with mouse
function moveLabel(props){
  //retrieve current lineage property name
  var lineageProperty = findLineageProperty(props)
  //check if current lineage is defined (i.e., >= 0)
  //don't want to call code to move label if it doesn't exist
  if (props[lineageProperty] > -1){

    	//get width of label
    	var labelWidth = d3.select(".infolabel")
    		.node()
    		.getBoundingClientRect()
    		.width;

    	//use coordinates of mousemove event to set label coordinates
    	var x1 = d3.event.clientX + 10,
    		y1 = d3.event.clientY - 75,
    		x2 = d3.event.clientX - labelWidth - 10,
    		y2 = d3.event.clientY + 25;

    	//horizontal label coordinate, testing for overflow
    	var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    	//vertical label coordinate, testing for overflow
    	var y = d3.event.clientY < 75 ? y2 : y1;

    	d3.select(".infolabel")
    		.style({
    			"left": x + "px",
    			"top": y + "px"
    		});
    }
};
