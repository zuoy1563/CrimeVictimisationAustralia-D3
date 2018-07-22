const states = ["New South Wales","Victoria","Queensland","South Australia","Western Australia","Tasmania",
    "Northern Territory","Australian Capital Territory"];

var tooltip = d3.select("body")
    .append("div")
    .attr("class","tooltip")
    .style("opacity",0.0);

function drawDotsAndLine(state) {
    // if the graph exists, delete that and draw a new one
    var old = document.getElementById("trend");
    if (old !== null) {
        old.parentNode.removeChild(old);
    }
    var canvaswidth = 550,
        canvasheight = 300;
    var svg = d3.select("#lineContainer").append("svg").attr("id", "trend")
        .attr("width", canvaswidth)
        .attr("height", canvasheight),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom - 30;
    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]);
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // read data
    d3.json("assets/d3/data/victimisation.json", function(error, data) {
        if (error) throw error;
        
        // get formatted data
        var formatted;
        if (state === undefined)
            formatted = reformatVictimisationDataForLine(data);
        else
            formatted = reformatVictimisationDataForLine(data, state);

        // define the lines to draw victimisation rate and year
        var line = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.vic_rate); });

        x.domain(data.map(function(d) { return d.year; }));

        y.domain([0, d3.max(formatted, function(d) { return d.vic_rate; }) + 0.01]);

        // draw x axis
        g.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // text label for the x axis
        g.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("Year");

        // draw y axis
        g.append("g")
            .attr("class", "axis axis-y")
            .call(d3.axisLeft(y).ticks(4, "%"))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end");

        // text label for the y axis
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Victimisation Rate");

        // draw the path
        g.append("path")
            .datum(formatted)
            .attr("class", "line")
            .attr("d", d3.line().x(function(d) { return x(d.year); }).y(0))
            .transition()
            .delay(function (d, i) {
                return i * 200;
            })
            .ease(d3.easeCubic)
            .duration(1000)
            .attr("d", line);



        // draw the points on the path for showing users the exact data while hovering
        var dots = g.selectAll("circle")
            .data(formatted)
            .enter().append("circle")
            .attr("class", "circle")
            .attr("cx", function(d) { return x(d.year); })
            .attr("cy", function(d) { return y(0); })
            .attr("r", 0);

        dots
            .transition()
            .delay(function (d, i) {
                return i * 200;
            })
            .ease(d3.easeCubic)
            .duration(500)
            .attr("cx", function(d) { return x(d.year); })
            .attr("cy", function(d) { return y(d.vic_rate); })
            .attr("r", 4);

        dots
            .on("mouseover", function (d,i) {
                // grey out the selected point
                d3.select(this)
                    .attr("opacity", 0.6);
                // show tooltip
                tooltip.html("Avg. Victimisation rate: " + (d.vic_rate* 100).toFixed(2)  + "%")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("opacity",1.0);
            })
            .on("mouseout", function (d,i) {
                // restore the point
                d3.select(this)
                    .attr("opacity", 1);
                tooltip.style("opacity",0.0);
            });
    });
}

function reformatVictimisationDataForLine(data, state) {
    // formatted = {year, victimisation rate}
    var formatted = [];
    var count = [];

    // calculate the sum of victimisation rate according to given conditions
    data.forEach(function (rawEle) {
        if (state === undefined) {
            var isExist = false;
            // if the element with same year exist then directly add the victimisation rate to that year, otherwise push a new element
            formatted.forEach(function (forEle) {
                if (forEle.year === rawEle.year) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.year]++;
                }
            });
            if (!isExist) {
                formatted.push({year:rawEle.year, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.year] = 1;
            }
        }
        else {
            var isExist = false;
            formatted.forEach(function (forEle) {
                if (forEle.year === rawEle.year && rawEle.state == state) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.year]++;
                }
            });
            if (!isExist && rawEle.state == state) {
                formatted.push({year:rawEle.year, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.year] = 1;
            }
        }
    });
    // calculate the average victimisation rate
    formatted.forEach(function (ele) {
        ele.vic_rate /= (count[ele.year] * 100);
    });
    return formatted;
}


function drawMap() {
    var width = 550,
        height = 375;

    var projection = d3.geoMercator()
        .center([175, -40])
        .scale(440);

    var path = d3.geoPath()
        .projection(projection);

    var svg = d3.select("#mapContainer").append("svg")
        .attr("width", width)
        .attr("height", height);

    // read TopoJSON for drawing the map
    d3.json("assets/d3/data/au-states.json", function(error, data) {
        if (error) throw error;

        var australia = svg.append("g");
        var mapStates = australia.attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(data, data.objects.austates).features)
            .enter().append("path")
            .attr("d", path);

        // reformat data to get avg victimisation rate by state
        d3.json("assets/d3/data/victimisation.json", function(error, vicRatesRawData) {
            if (error) throw error;
            var returnedData = reformatVictimisationDataForMap(vicRatesRawData);
            var vicRates = returnedData[0];
            var minValue = returnedData[1];
            var maxValue = returnedData[2];

            // create color scales
            var mapScale = d3.scaleLinear()
                            .domain([minValue, maxValue])
                            .range([0.1, 1]);


            // fill the map with different brightness of red to show the level of victimisation rate
            mapStates.style("fill", function (d, i) {
                var t = mapScale(vicRates[states[i]]);
                return d3.interpolateReds(t);
            });

            mapStates
                .on("mouseover", function(d, i){
                    // grey out the selected state
                    d3.select(this)
                        .attr("opacity", 0.6);

                    // show tooltip
                    tooltip.html("Avg. Victimisation rate at " + "<br/>" + states[i] + " is " + (vicRates[states[i]]).toFixed(2)  + "%")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY + 20) + "px")
                        .style("opacity",1.0);
            })
                .on("mouseout", function (d,i) {
                    // restore the states
                    d3.select(this)
                        .attr("opacity", 1);
                    tooltip.style("opacity",0.0);
                })
                .on("click", function (d, i) {
                    // redraw the line chart while clicking
                    drawDotsAndLine(states[i]);
                    showSelectedState(states[i])
                });

            //define a linear gradient
            var defs = svg.append("defs");

            var linearGradient = defs.append("linearGradient")
                .attr("id","linearColor")
                .attr("x1","0%")
                .attr("y1","0%")
                .attr("x2","100%")
                .attr("y2","0%");

            linearGradient.append("stop")
                .attr("offset","0%")
                .style("stop-color",d3.interpolateReds(0));

            linearGradient.append("stop")
                .attr("offset","40%")
                .style("stop-color",d3.interpolateReds(0.4));

            linearGradient.append("stop")
                .attr("offset","70%")
                .style("stop-color",d3.interpolateReds(0.7));

            linearGradient.append("stop")
                .attr("offset","100%")
                .style("stop-color",d3.interpolateReds(1));

            // show the legend
            // add a rect an apply the linearGradient
            var colorRect = svg.append("rect")
                .attr("x", 10)
                .attr("y", 250)
                .attr("width", 140)
                .attr("height", 30)
                .style("fill","url(#" + linearGradient.attr("id") + ")");

            // add text
            svg.append("text")
                .attr("class","valueText")
                .attr("x", 10)
                .attr("y", 250)
                .attr("dy", "-0.3em")
                .attr("font-size", "12px")
                .text(function(){
                    return "Victimisation Rate";
                });

            svg.append("text")
                .attr("class","valueText")
                .attr("x", 10)
                .attr("y", 300)
                .attr("dy", "-0.3em")
                .attr("font-size", "12px")
                .text(function(){
                    return (minValue.toFixed(2) + "%" );
                });

            svg.append("text")
                .attr("class","valueText")
                .attr("x", 120)
                .attr("y", 300)
                .attr("font-size", "12px")
                .attr("dy", "-0.3em")
                .text(function(){
                    return (maxValue.toFixed(2) + "%" );
                });

        });



        /* Name too long and map too small, dropped
        australia.append("g")
            .attr("class", "states-names")
            .selectAll("text")
            .data(topojson.feature(data, data.objects.austates).features)
            .enter()
            .append("svg:text")
            .text(function(d, i){
                return states[i];
            })
            .attr("x", function(d){
                return path.centroid(d)[0];
            })
            .attr("y", function(d){
                return  path.centroid(d)[1];
            })
            .attr("text-anchor","middle")
            .attr('fill', 'black');
            */


    });



}

function reformatVictimisationDataForMap(data) {
    var min = 9999;
    var max = -9999;
    // map data format [vic_rate], use state names as indexes
    var formatted = [];
    // calculate the sum of the victimisation rate by state
    for (var i = 0; i < states.length; i++) {
        var count = 0;
        for (var j = 0; j < data.length;j++) {
            if (data[j].state == states[i]) {
                if (isNaN(formatted[states[i]])) {
                    formatted[states[i]] = 0;
                }
                else {
                    formatted[states[i]] += data[j].vic_rate;
                    count++;
                }
            }
        }
        // calculate the average victimisation rate
        // get the max and the min victimisation rate
        if (count !== 0) {
            formatted[states[i]] /= count;
            if (formatted[states[i]] > max) {
                max = formatted[states[i]];
            }
            if (formatted[states[i]] < min) {
                min = formatted[states[i]];
            }
        }
    }
    return [formatted, min, max];
}



function drawScatter() {
    var canvaswidth = 550,
        canvasheight = 300;
    var svg = d3.select("#scatterContainer").append("svg").attr("id", "scatter")
            .attr("width", canvaswidth)
            .attr("height", canvasheight),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom - 30;

    var x = d3.scaleLinear().rangeRound([0, width]),
        y = d3.scaleLinear().rangeRound([height, 0]);
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // read data
    d3.json("assets/d3/data/edu_work.json", function(error, data) {
        if (error) throw error;
        d3.json("assets/d3/data/victimisation.json", function(error, vicRatesRawData) {
            if (error) throw error;

            // define the colors to be used to fill the points
            var color = d3.scaleOrdinal(d3.schemeCategory10);

            // get formatted victimisation data
            var victimisation  = reformatVictimisationDataForMap(vicRatesRawData);

            // combine data from two data sources
            data.forEach(function (dataElement) {
                dataElement.vic_rate = victimisation[0][dataElement.state];
            });


            x.domain([0, d3.max(data, function(d) { return d.unemploy_rate/100; }) + 0.02]);
            y.domain([0, d3.max(data, function(d) { return d.vic_rate/100; }) + 0.01]);

            // draw x axis
            g.append("g")
                .attr("class", "axis axis-x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).ticks(3, "%"));

            // text label for the x axis
            g.append("text")
                .attr("transform",
                    "translate(" + (width/2) + " ," +
                    (height + margin.top + 20) + ")")
                .style("text-anchor", "middle")
                .text("Unemployment Rate");

            // draw y axis
            g.append("g")
                .attr("class", "axis axis-y")
                .call(d3.axisLeft(y).ticks(4, "%"))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 3)
                .attr("dy", "0.71em")
                .attr("text-anchor", "end")
                .text("Victimisation Rate(%)");

            // text label for the y axis
            g.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x",0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Victimisation Rate");

            // draw points
            g.selectAll("circle")
                .data(data)
                .enter().append("circle")
                .attr("cx", function(d) { return x(d.unemploy_rate/100); })
                .attr("cy", function(d) { return y(d.vic_rate/100); })
                .attr("r", 4)
                .attr("fill",function (d,i) {
                    return color(i);
                })
                .on("mouseover", function (d,i) {
                    // grey out the selected point
                    d3.select(this)
                        .attr("opacity", 0.6);

                    // show the tooltip
                    tooltip.html("Avg. Victimisation rate: " + (d.vic_rate).toFixed(2)  + "%." + "<br/>" + " Unemployment rate: "
                        + d.unemploy_rate + "% at " + d.state)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY + 20) + "px")
                        .style("opacity",1.0);
                })
                .on("mouseout", function (d,i) {
                    // restore the point
                    d3.select(this)
                        .attr("opacity", 1);
                    tooltip.style("opacity",0.0);
                });
        });
    });
}

function drawBubble(state, options) {
    // if the old one exist, delete that and draw a new one
    var old = document.getElementById("bubble");
    if (old !== null) {
        old.parentNode.removeChild(old);
    }
    var diameter = 700, //max size of the bubbles
        color = d3.scaleOrdinal(d3.schemeCategory20); //color category

    var bubble = d3.pack()
        .size([diameter, diameter])
        .padding(1.5);

    var svg = d3.select("#bubbleContainer")
        .append("svg")
        .attr("id", "bubble")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

    d3.json("assets/d3/data/victimisation.json", function(error, data){
        if (error) throw error;

        // get formatted data according to given conditions
        var formatted;
        if (state === undefined && options === undefined) {
            formatted = prepareBubbleData(data);
        }
        else if (state !== undefined && options === undefined) {
            formatted = prepareBubbleData(data,state);
        }
        else if (state !== undefined && options !== undefined) {
            formatted = prepareBubbleData(data,state, options);
        }
        else {
            formatted = prepareBubbleData(data,undefined,options);
        }
        //bubbles needs very specific format, convert data to this.
        var nodes = d3.hierarchy(formatted)
            .sum(function(d) { return d.vic_rate; });

        var node = svg.selectAll(".node")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        // draw bubbles
        var chart = node.append("circle")
            .attr("r", function(d) {
                return 0;
            })
            .style("fill", function(d, i) {
                return color(i);
            });

        chart
            .transition()
            .delay(function (d, i) {
            return i * 200;
        })
            .duration(200)
            .ease(d3.easeBounce)
            .attr("r", function(d) {
                return d.r;
            });


        chart
            .on("mouseover", function (d, i) {
                // grey out the selected bubble
                d3.select(this)
                    .attr("opacity", 0.8);

                // show the tooltip
                tooltip.html("Avg. Victimisation rate: " + (d.data.vic_rate).toFixed(2)  + "%")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("opacity",1.0);
            })
            .on("mouseout", function () {
                // restore the bubble
                d3.select(this)
                    .attr("opacity", 1);
                tooltip.style("opacity",0.0);
            });

        // show crime names on the bubbles
        node.append("text")
            .attr("dy", ".3em")
            .selectAll("tspan")
            .data(function(d){ return d.data.crime.split(" "); })
            .enter().append("tspan")
            .attr("x", 0)
            .attr("y", function(d, i, nodes) { return 5 + (i + i*1.1 - nodes.length / 2 - 0.5) * 10; })
            .style("font-size", "13px")
            .style("text-anchor", "middle")
            .style("opacity", "0")
            .text(function(d,i) {
                return d ;
            })
            .transition()
            .delay(function (d, i) {
                return i * 200;
            })
            .duration(5000)
            .ease(d3.easeBounce)
            .style("opacity", "1");

        d3.select(self.frameElement)
            .style("height", diameter + "px");
    })
}

function prepareBubbleData(data, state, options) {
    // formatted = {children:[{crime, victimisation rate}]}
    var formatted = {children:[]};
    var count = [];
    // calculate the sum of victimisation rate according to given conditions
    data.forEach(function (rawEle) {
        // if nothing selected (by default)
        if (state === undefined && options === undefined) {
            var isExist = false;
            formatted.children.forEach(function (forEle) {
                if (forEle.crime === rawEle.crime) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.crime]++;
                }
            });
            if (!isExist) {
                formatted.children.push({crime:rawEle.crime, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.crime] = 1;
            }
        }
        // if user select a state but do not select the crime types
        else if (state !== undefined && options === undefined){
            var isExist = false;
            formatted.children.forEach(function (forEle) {
                if (forEle.crime === rawEle.crime && state === rawEle.state) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.crime]++;
                }
            });
            if (!isExist && state === rawEle.state) {
                formatted.children.push({crime:rawEle.crime, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.crime] = 1;
            }
        }
        // if user select crime types but do not select a state
        else if (state !== undefined && options !== undefined){
            var isExist = false;
            formatted.children.forEach(function (forEle) {
                if (forEle.crime === rawEle.crime && state === rawEle.state) {
                    options.forEach(function (crimeType) {
                        if (rawEle.crime_type === crimeType) {
                            isExist = true;
                            forEle.vic_rate += rawEle.vic_rate;
                            count[rawEle.crime]++;
                        }
                    });
                }
            });
            if (!isExist && state === rawEle.state) {
                options.forEach(function (crimeType) {
                    if (rawEle.crime_type === crimeType) {
                        formatted.children.push({crime: rawEle.crime, vic_rate: 0 + rawEle.vic_rate});
                        count[rawEle.crime] = 1;
                    }
                });
            }
        }
        // if only crime types are selected
        else {
            var isExist = false;
            formatted.children.forEach(function (forEle) {
                if (forEle.crime === rawEle.crime) {
                    options.forEach(function (crimeType) {
                        if (rawEle.crime_type === crimeType) {
                            isExist = true;
                            forEle.vic_rate += rawEle.vic_rate;
                            count[rawEle.crime]++;
                            }
                    });
                }
            });
            if (!isExist) {
                options.forEach(function (crimeType) {
                    if (rawEle.crime_type === crimeType) {
                        formatted.children.push({crime: rawEle.crime, vic_rate: 0 + rawEle.vic_rate});
                        count[rawEle.crime] = 1;
                    }
                });
            }
        }
    });
    // calculate the average victimisation rate
    formatted.children.forEach(function (ele) {
        ele.vic_rate /= (count[ele.crime]);
    });
    return formatted;
}

// initialise the page
window.onload = function () {
    drawDotsAndLine();
    drawMap();
    showSelectedState();
    prepareOptions();
    drawBubble();
    drawScatter();
};

// get the options (states) available for the dropdown list which is on the right hand side of the bubble chart.
function prepareOptions() {
    var selectList = document.getElementById("bubbleOptions");
    selectList.options.add(new Option("All", "All"));
    states.forEach(function (state) {
        selectList.options.add(new Option(state, state))
    });

}

function checkBoxProcessing(id1, id2){
    var options = [];
    if ($(id1).is(":checked")) {
        // if both checked
        if ($(id2).is(':checked')) {
            options.push($(id2).val());
        }
        // if only this is checked
        options.push($(id1).val());
    }
    // if the other one checked
    else if ($(id2).is(':checked')) {
        options.push($(id2).val());
    }
    // what if no checkbox is checked
    else {
        var old = document.getElementById("bubble");
        if (old !== null) {
            old.parentNode.removeChild(old);
        }
        d3.select("#bubbleContainer")
            .append("svg")
            .attr("id", "bubble")
            .attr("width", 700)
            .attr("height", 700)
            .attr("class", "bubble");
        return;
    }

    // check what state is selected
    if ($("#bubbleOptions").val() != "All") {
        if (options.length >= 1) {
            drawBubble($("#bubbleOptions").val(),options);
        }
        else{
            drawBubble($("#bubbleOptions").val());
        }
    }
    else {
        if (options.length >= 1) {
            drawBubble(undefined, options);
        }
        else{
            drawBubble();
        }
    }
}

// if users change the checkbox which represents the crime type named Personal
$('#personal').change(function () {
    checkBoxProcessing('#personal','#household');

});

// if users change the checkbox which represents the crime type named Household
$('#household').change(function () {
    checkBoxProcessing('#household','#personal');
});

// if users change the selected state for the bubble chart
$('#bubbleOptions').change(function () {
    // check how is the situation of checkboxes
    if ($('#bubbleOptions').val() == "All" && $('#personal').is(":checked") && $('#household').is(":checked")) {
        drawBubble();
    }
    else {
        var options = getOptions();
        if (options.length >= 1) {
            if ($('#bubbleOptions').val() == "All") {
                drawBubble(undefined, options);
            }
            else
                drawBubble($('#bubbleOptions').val(), options);
        }
    }
});

// get the selected checkboxes for the bubble chart
function getOptions() {
    var options = [];
    if ($('#personal').is(":checked")) {
        options.push($('#personal').val());
    }
    if ($('#household').is(":checked")) {
        options.push($('#household').val());
    }
    return options;
}

// show the selected state above the line chart
function showSelectedState(state) {
    if (state === undefined) {
        document.getElementById("showState").innerHTML = "in Australia";
    }
    else {
        document.getElementById("showState").innerHTML = "in " + state;
    }
}
