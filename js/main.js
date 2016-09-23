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

    var whoObjArray = [
        {
          text: 'Western Pacific',
          value: 'WPR',
          checked: 1,
          color: "#FF8C03"
        },
        {
          text: 'Southeast Asia',
          value: 'SEA',
          checked: 1,
          color: "#85FF0D"
        },
        {
          text: 'Eastern Mediterranean',
          value: 'EMR',
          checked: 1,
          color: "#0AFCD2"
        },
        {
          text: 'African',
          value: 'AFR',
          checked: 1,
          color: "#FFFF3B"
        },
        {
          text: 'European',
          value: 'EUR',
          checked: 1,
          color: "#ABADFF"
        }
    ]

    var isolateLegendArray = [
        {
          text: "Exact Location Known",
          value: "exactIsolates",
          fill: "#333"
        },
        {
          text: "Only Country of Origin Known",
          value: "randomIsolates",
          fill: "#888"
        }
    ];
    //empty array to hold all isolate names
    var isolateNameArray = [];

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
            .defer(d3.json, "data/Polygons/WHO_Regions50m.topojson")//load WHO regions outline
            .defer(d3.json, "data/Routes/TradeRoutes.topojson")//load trade routes polylines
            .defer(d3.json, "data/Points/NearTradeHubsSimple.topojson")//load trade hubs
            .defer(d3.json, "data/Points/Isolates_Exact.topojson")//load exactIsolates
            .defer(d3.json, "data/Points/Isolates_Random.topojson")//load Random Isolates
            .defer(d3.json, "data/Polygons/LineageFrequencies_100m.topojson")//load lineage frequencies

            .await(callback);

        function callback(error, countryData, whoRegionsData, tradeRouteData, tradeHubData, exactData, randomData, linFreqData){

            //place graticule on the map
        		// setGraticule(map, path);

            //translate countries topojson with zoom
            var countryJson = topojson.feature(countryData, countryData.objects.Countries_50m).features,
                whoRegionsJson = topojson.feature(whoRegionsData, whoRegionsData.objects.WHO_Regions50m).features;

            var tradeHubJson = topojson.feature(tradeHubData, tradeHubData.objects.NearTradeHubsSimple)

            var exactJson = topojson.feature(exactData, exactData.objects.Isolates_Exact)

            var randomJson = topojson.feature(randomData, randomData.objects.Isolates_Random)

            //convert topojsons into geojson objects; coastLine is an array full of objects
            var tradeRouteJson = topojson.feature(tradeRouteData, tradeRouteData.objects.AllRoutes).features;

            var linFreqJson = topojson.feature(linFreqData, linFreqData.objects.LineageFrequencies_100m).features

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
                .attr("visibility", "hidden")

            //add second set of countries for lineage frequencies to map
            var lineageFrequencies = g.selectAll(".lineageFrequencies")
               .data(linFreqJson)
               .enter()
             .append("path")
                .attr("class", "lineageFrequencies")
                .attr("id", function(d){
                  var countryName = d.properties.name.toLowerCase()

                  countryName = countryName.replace(/[^0-9a-zA-Z]/g, '')
                  console.log(countryName);
                  // var countryName = d3.select(".ui-selectmenu-text").text().toLowerCase().replace(" ", "_");

                    // return d.properties.name
                })
                .style({"fill": "none", "stroke": "none"})
                .attr("d", path)
                .on("mouseover", function(d){
                    highlightCountry(d.properties);
                })
                .on("mouseout", function(d){
                    dehighlightCountry(d.properties);
                })
                .on("mousemove", moveLabel);

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

            // //add near trade hub cities to map
            // var tradeHubs = g.append("path")
            //     .datum(tradeHubJson)
            //     .attr("class", "tradeHubs")
            //     .attr("d", path)


            //add exact isolates to map
            var exactIsolates = g.append("g")
                .attr("class", "exactIsolates")
                .selectAll("rect")
              .data(exactJson.features)
                .enter()
              .append("rect")
                .attr("x", function(d){return projection(d.geometry.coordinates)[0]})
                .attr("y", function(d){return projection(d.geometry.coordinates)[1]})
                .attr("width", 4)
                .attr("height", 4)
                .attr("class", function(d){
                    var lineage = d.properties.lineage_of;

                    return "lin_" + lineage + " notFiltered checked";
                })
                .attr("id", function(d){
                    return d.properties.SampleName;
                })

            //add random isolates to map
            var randomIsolates = g.append("g")
                .attr("class", "randomIsolates")
                .selectAll("path")
              .data(randomJson.features)
                .enter()
              .append("rect")
                .attr("x", function(d){return projection(d.geometry.coordinates)[0]})
                .attr("y", function(d){return projection(d.geometry.coordinates)[1]})
                .attr("width", 4)
                .attr("height", 4)
                .attr("class", function(d){
                    var lineage = d.properties.lineage_of;

                    return "lin_" + lineage + " notFiltered checked";
                })
                .attr("id", function(d){
                    return d.properties.SampleName;
                })

            //store features of exact isolates in variable
            var exactSamples = exactJson.features;
            //push isolate names into array for use with search widget
            exactSamples.map(function(d){
                isolateNameArray.push(d.properties.SampleName)
            })

            //store features of exact isolates in variable
            var randomSamples = randomJson.features;
            //push isolate names into array for use with search widget
            randomSamples.map(function(d){
                isolateNameArray.push(d.properties.SampleName)
            })

            createSearch();
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

            // //add enumeration units to the map
            // setEnumerationUnits(whoRegionsJson, map, path);
        };

    };

function makeColorScale(){
    //array of hex colors to be used for choropleth range
    var colorClasses = ['#eee','#ffffcc','#ffeda0','#fed976','#fecb43','#feab3b','#fe9c19','#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']

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
          value: 'Per14L1Spo'
        },
        {
          text: 'Lineage 2 - Spoligo',
          value: 'Per14L2Spo'
        },
        {
          text: 'Lineage 3 - Spoligo',
          value: 'Per14L3Spo'
        },{
          text: 'Lineage 4 - Spoligo',
          value: 'Per14L4Spo'
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
              var colorClasses = ['#eee','#ffffcc','#ffeda0','#fed976','#fecb43','#feab3b','#fe9c19','#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', 'none', 'white']

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

              //rect to hold styling
              var freqBackButton = d3.select(".map").append("rect")
                  .attr("id", "freqBack")
                  .attr("height", "15px")
                  .attr("width", "170px")
                  .attr("transform", "translate(670,10)")
              //text of button
              var freqButtonText = d3.select(".map").append("text")
                  .attr("class", "buttonText")
                  .attr("id", "freqButtonText")
                  .attr("transform", "translate(690,20)")
                  .text("Remove Lineage Frequency")
              //clickable rect
              var freqSelectButton = d3.select(".map").append("rect")
                  .attr("id", "freqSelect")
                  .attr("height", "15px")
                  .attr("width", "170px")
                  .attr("transform", "translate(670,10)")
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
                  })
                  .on("mouseover", function(){
                      //extract ID of rectangle is clicked
                      var buttonID = this.id;
                      //changes click to back in ID string so we can change fill
                      var rectID = buttonID.replace("Select", "Back")
                      //change fill
                      d3.select("#" + rectID).style({
                          "stroke": "#aaa",
                          "stroke-width": "2px",
                      })
                  })
                  .on("mouseout", function(){
                      //extract ID of whichever rectangle is clicked
                      var buttonID = this.id;
                      //changes click to back in ID string so we can change fill
                      var rectID = buttonID.replace("Select", "Back")
                      //change fill
                      d3.select("#" + rectID).style({
                        "fill": "#eee",
                        "stroke": "#ddd",
                        "stroke-width": "1px"
                      })
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

function createSearch() {
    //creates search div
    var searchDiv = d3.select("#menubar").append("div")
        .attr("class", "ui-widget")
        .attr("id", "searchDiv")
        .attr("width", "200px")
        .attr("height", "80%")
        .html("<label for='tags'>Isolate Name: </label><input id='tags'>")
    //populates search with array
    $("#tags").autocomplete({
        source: isolateNameArray,
        messages: {
            noResults: 'Isolate not found',
            results: function(){}
        },
        select: function(event, ui) {

            var isolate = ui.item.value
            var selection = "#" + isolate;

            var selectionFill = d3.select(selection).style("fill");

            d3.select(selection)
                .transition()
                .duration(200)
                .style("stroke-width", "5px")
                .style({"stroke": selectionFill, "stroke-width": "8px"})
            //conditional to check if legend exists
            if (d3.select("#sampleBack").empty() == true){

                //rect to hold styling
                var sampleBackButton = d3.select(".map").append("rect")
                    .attr("id", "sampleBack")
                    .attr("height", "15px")
                    .attr("width", "140px")
                    .attr("transform", "translate(10,10)")
                //text of button
                var sampleButtonText = d3.select(".map").append("text")
                    .attr("class", "buttonText")
                    .attr("id", "sampleButtonText")
                    .attr("transform", "translate(25,21)")
                    .text("Clear Selected Isolates")
                //clickable rect
                var sampleSelectButton = d3.select(".map").append("rect")
                    .attr("id", "sampleSelect")
                    .attr("height", "15px")
                    .attr("width", "140px")
                    .attr("transform", "translate(10,10)")
                    .on("click", function(){
                        d3.select(".exactIsolates").selectAll("rect")
                            .style({"fill": "#333", "stroke": "none"})

                        d3.select(".randomIsolates").selectAll("rect")
                            .style({"fill": "#888", "stroke": "none"})

                        //remove button
                        d3.select("#sampleBack").remove();
                        //remove button
                        d3.select("#sampleButtonText").remove();
                        //remove button
                        d3.select("#sampleSelect").remove();
                    })
                    .on("mouseover", function(){
                        //extract ID of rectangle is clicked
                        var buttonID = this.id;
                        //changes click to back in ID string so we can change fill
                        var rectID = buttonID.replace("Select", "Back")
                        //change fill
                        d3.select("#" + rectID).style({
                            "stroke": "#aaa",
                            "stroke-width": "2px",
                        })
                    })
                    .on("mouseout", function(){
                        //extract ID of whichever rectangle is clicked
                        var buttonID = this.id;
                        //changes click to back in ID string so we can change fill
                        var rectID = buttonID.replace("Select", "Back")
                        //change fill
                        d3.select("#" + rectID).style({
                          "fill": "#eee",
                          "stroke": "#ddd",
                          "stroke-width": "1px"
                        })
                    })
            }
        }
    });



}

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
            selectedText: "Filter Isolates by Lineage"
        }
    ).multiselect("checkAll") //checks all routes by default
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

    var legendContainer = d3.select("body").append("div")
        .attr("id", "legendContainer")

    var legendSvg = legendContainer.append("svg")
        .attr("id", "legendSvg")


      //set variables to define spacing/size
      var rectHeight = 1,
          rectWidth = 20,
          legendSpacing = 0.75;
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
          .attr("transform", "translate(75,30)")
          .text("Legend")

      //sets legend title
      var legendIsolateTitle = legendSvg.append("text")
            .attr("class", "legendSubHead")
            .attr("id", "legendIsolateTitle")
            .attr("transform", "translate(85,60)")
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
          .attr("transform", "translate(6,59)")
          .text("Clear All")
      //clickable rect
      var isoSelectButton = legendSvg.append("rect")
          .attr("id", "isolateSelect")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,47)")
          .on("click", function(){
              updateButton("isolate", isolateLegendArray);
          })
          .on("mouseover", function(){
              //extract ID of rectangle is clicked
              var buttonID = this.id;
              //changes click to back in ID string so we can change fill
              var rectID = buttonID.replace("Select", "Back")
              //change fill
              d3.select("#" + rectID).style({
                  "stroke": "#aaa",
                  "stroke-width": "2px",
              })
          })
          .on("mouseout", function(){
              //extract ID of whichever rectangle is clicked
              var buttonID = this.id;
              //changes click to back in ID string so we can change fill
              var rectID = buttonID.replace("Select", "Back")
              //change fill
              d3.select("#" + rectID).style({
                "fill": "#eee",
                "stroke": "#ddd",
                "stroke-width": "1px"
              })
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
              return "<form><input type=checkbox class='isolate_checkbox' id='" + isolateID + "'</input></form>"
          })
          .on("change", function(){
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
          });

      //sets legend title
      var legendRouteTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendRouteTitle")
          .attr("transform", "translate(65,130)")
          .text("Trade Routes")

      //rect to hold styling
      var routeBackButton = legendSvg.append("rect")
          .attr("id", "routeBack")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,117)")
      //text of button
      var routeButtonText = legendSvg.append("text")
          .attr("class", "buttonText")
          .attr("id", "routeButtonText")
          .attr("transform", "translate(6,129)")
          .text("Clear All")
      //clickable rect
      var routeSelectButton = legendSvg.append("rect")
          .attr("id", "routeSelect")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,117)")
          .on("click", function(){
              updateButton("route", routeObjArray);
          })
          .on("mouseover", function(){
              //extract ID of rectangle is clicked
              var buttonID = this.id;
              //changes click to back in ID string so we can change fill
              var rectID = buttonID.replace("Select", "Back")
              //change fill
              d3.select("#" + rectID).style({
                  "stroke": "#aaa",
                  "stroke-width": "2px",
              })
          })
          .on("mouseout", function(){
              //extract ID of whichever rectangle is clicked
              var buttonID = this.id;
              //changes click to back in ID string so we can change fill
              var rectID = buttonID.replace("Select", "Back")
              //change fill
              d3.select("#" + rectID).style({
                "fill": "#eee",
                "stroke": "#ddd",
                "stroke-width": "1px"

              })
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
              var vert = i * height - offset + 265;
              return 'translate(' + horz + ',' + vert + ')';
        });

      //creates rect elements for legened
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
          .attr("transform", "translate(-47, -12)")
        .append("xhtml:body")
          .html(function(d, i) {
              //create ID for checkboxes
              var routeID = routeObjArray[i].value + "_check";
              return "<form><input type=checkbox class='route_checkbox' id='" + routeID + "'</input></form>"
          })
          .on("change", function(d){
              //function updates "checked" property for every route
              routeObjArray = setCheckedProp(routeObjArray, "route");
              //updates visibility of route based on if it is checked or not
              updateVisibility(routeObjArray);
          });

      //sets legend title
      var legendWhoTitle = legendSvg.append("text")
          .attr("class", "legendSubHead")
          .attr("id", "legendWhoTitle")
          .attr("transform", "translate(60,388)")
          .text("WHO Regions")

      //rect to hold styling
      var whoBackButton = legendSvg.append("rect")
          .attr("id", "whoBack")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,375)")
      //text of button
      var whoButtonText = legendSvg.append("text")
          .attr("class", "buttonText")
          .attr("id", "whoButtonText")
          .attr("transform", "translate(9,387)")
          .text("Add All")
      //clickable rect
      var whoSelectButton = legendSvg.append("rect")
          .attr("id", "whoSelect")
          .attr("height", "15px")
          .attr("width", "50px")
          .attr("transform", "translate(4,375)")
          .on("click", function(){
              updateButton("who", whoObjArray);
          })
          .on("mouseover", function(){
              //extract ID of rectangle is clicked
              var buttonID = this.id;
              //changes click to back in ID string so we can change fill
              var rectID = buttonID.replace("Select", "Back")
              //change fill
              d3.select("#" + rectID).style({
                  "stroke": "#aaa",
                  "stroke-width": "2px",
              })
          })
          .on("mouseout", function(){
              //extract ID of whichever rectangle is clicked
              var buttonID = this.id;
              //changes click to back in ID string so we can change fill
              var rectID = buttonID.replace("Select", "Back")
              //change fill
              d3.select("#" + rectID).style({
                "fill": "#eee",
                "stroke": "#ddd",
                "stroke-width": "1px"

              })
          })

      //creates a group for each rectangle and offsets each by same amount
      var legendWho = legendSvg.selectAll('.legendWho')
          .data(whoObjArray)
          .enter()
        .append("g")
          .attr("class", "legendWho")
          .attr("transform", function(d, i) {
              var height = rectWidth + legendSpacing;
              var offset =  height * routeObjArray.length / 2;
              var horz = 2 * rectWidth;
              var vert = i * height - offset + 235;
              return 'translate(' + horz + ',' + vert + ')';
        });

      //creates rect elements for legened
      var legendWhoRect = legendWho.append('rect')
          .attr("class", "legendWhoRect")
          .attr('width', 20)
          .attr('height', 10)
          .attr("transform", "translate(-20,280)")
          .style('fill', function(d){ return d.color })

      //adds text to legend
      var legendWhoText = legendWho.append('text')
          .attr("class", "legendText")
          .attr("transform", "translate(5, 288.5)")
          .text(function(d) { return d.text });

      //checkboxes for each route
      var checkboxesWho = legendWho.append("foreignObject")
          .attr('width', "20px")
          .attr('height', "20px")
          .attr("transform", "translate(-47, 274)")
        .append("xhtml:body")
          .html(function(d, i) {
              //create ID for checkboxes
              var whoID = whoObjArray[i].value + "_check";
              return "<form><input type=checkbox class='who_checkbox' id='" + whoID + "'</input></form>"
          })
          .on("change", function(d){
              //function updates "checked" property for every route
              whoObjArray = setCheckedProp(whoObjArray, "who");
              //updates visibility of route based on if it is checked or not
              updateVisibility(whoObjArray);
          });

      //checks all routes by default
      for (i=0; i<routeObjArray.length; i++) {
          var route = routeObjArray[i].value;
          d3.select("#" + route + "_check")[0][0].checked = true;
      }

      //checks all routes by default
      for (i=0; i<isolateLegendArray.length; i++) {
          var isolate = isolateLegendArray[i].value;
          d3.select("#" + isolate + "_check")[0][0].checked = true;
      }

};

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
            vert += 70;
        } else if (item === "who") {
            vert += 328;
        }

        //change button text and text position
        d3.select("#" + item + "ButtonText").text("Add All")
            .attr("transform", "translate("+ horz + "," + vert + ")")

        var checkboxes = d3.selectAll("." + item + "_checkbox");

        //updates checkboxes
        checkboxes.forEach(function(d){
              // loop through each checkbox element in array
              for (j=0; j<length; j++) {
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
        } else if (item === "route") {
          //updates checked property of each object
          routeObjArray = setCheckedProp(array, item);
          //updates visibility based on array
          updateVisibility(routeObjArray)
        } else if (item === "who") {
          //updates checked property of each object
          whoObjArray = setCheckedProp(array, item);
          //updates visibility based on array
          updateVisibility(whoObjArray)
        }
    }

    if (buttonText == "Add All") {//adds all items based on which button is clicked

        //for button text placement
        horz = 6;

        if (item === "route") {
            //moves label to appropriate place
            vert += 70;
        } else if (item === "who") {
            vert += 328;
        }

        //change button text
        d3.select("#" + item + "ButtonText").text("Clear All")
            .attr("transform", "translate("+ horz + "," + vert + ")")

        var checkboxes = d3.selectAll("." + item + "_checkbox");
        //updates checkboxes
        checkboxes.forEach(function(d){
              // loop through each checkbox element in array
              for (j=0; j<length; j++) {
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
        } else if (item === "route") {
            //updates checked property of each object
            routeObjArray = setCheckedProp(array, item);
            //updates visibility based on array
            updateVisibility(routeObjArray)
        } else if (item === "who") {
            //updates checked property of each object
            whoObjArray = setCheckedProp(array, item);
            //updates visibility based on array
            updateVisibility(whoObjArray)
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

//function to highlight enumeration units and bars
function highlightCountry(props){
    console.log(props.name);
  	//change stroke
  	var selected = d3.selectAll("#" + props.name)
  		.style({
  			"stroke": "black",
  			"stroke-width": "2"
  		});

  	setLabel(props);
};

//function to create dynamic label
function setLabel(props){
    //gets current lineage from the dropdown menu selection
    var currentLineage = d3.select(".ui-selectmenu-text").text().toLowerCase().replace(" ", "_");
    //conditional to display appropriate percent spoligo or otherwise
    if (currentLineage.indexOf("spoligo") != -1) {
        var percent1 = +props.Per14L1Spo;
        percent1 = percent1.toFixed(2) + "%";

        var percent2 = +props.Per14L2Spo;
        percent2 = percent2.toFixed(2) + "%";

        var percent3 = +props.Per14L3Spo;
        percent3 = percent3.toFixed(2) + "%";

        var percent4 = +props.Per14L4Spo;
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
	 var selected = d3.selectAll("#" + props.name)
      .style({
          "stroke": "#CCC",
          "stroke-width": "1px"
      })

	//remove info label
	d3.select(".infolabel")
		.remove();
};

//function to move info label with mouse
function moveLabel(){
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
};
