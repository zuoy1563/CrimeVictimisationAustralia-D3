const crimes = ["Physical Assault","Face-to-face Threatened Assault","Non Face-to-face Threatened Assault",
    "Robbery","Sexual Assault"];

const years = ["2010-2011", "2011-2012", "2012-2013", "2013-2014", "2014-2015", "2015-2016", "2016-2017"];

var tooltip = d3.select("body")
    .append("div")
    .attr("class","tooltip")
    .style("opacity",0.0);

function drawGenderBar(crime) {
    // if the graph exists, delete that and draw a new one
    var old = document.getElementById("genderBar");
    if (old !== null) {
        old.parentNode.removeChild(old);
    }

    var canvaswidth = 600,
        canvasheight = 300;

    var svg = d3.select("#genderContainer").append("svg")
        .attr("width", canvaswidth)
        .attr("height", canvasheight)
        .attr("id", "genderBar"),
        margin = { top: 20, right: 20, bottom: 30, left: 40 },
        x = d3.scaleBand().padding(0.1),
        y = d3.scaleLinear();

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append("g")
        .attr("class", "axis axis-x");

    g.append("g")
        .attr("class", "axis axis-y");

    // read data
    d3.json("assets/d3/data/victims_by_sex.json", function(error, data) {
        if (error) throw error;

        var bounds = svg.node().getBoundingClientRect(),
            width = bounds.width - margin.left - margin.right,
            height = bounds.height - margin.top - margin.bottom;

        x.rangeRound([0, width]);
        y.rangeRound([height, 0]);


        // get formatted data
        var formatted;
        if (crime === undefined)
            formatted = prepareGenderBarData(data);
        else
            formatted = prepareGenderBarData(data, crime);


        // set x and y domains
        x.domain(formatted.map(function (d) { return d.sex; }));
        y.domain([0, d3.max(formatted, function (d) { return d.vic_rate; })]);

        // draw x axis
        g.select(".axis-x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // draw y axis
        g.append("g")
            .attr("class", "axis axis-y")
            .call(d3.axisLeft(y).ticks(5, "%"))
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

        var bars = g.selectAll(".bar")
            .data(formatted);

        // define color used to fill the bars
        var color = d3.scaleOrdinal(d3.schemeCategory10);


        // draw bars
        var chart = bars
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return x(d.sex); })
            .attr("width", x.bandwidth())
            .attr("y", function () { return y(y.domain()[0]); })
            .attr("height", function () { return 0; });

        chart
            .transition()
            .delay(function (d, i) {
                return i * 200;
            })
            .duration(1500)
            .ease(d3.easeSin)
            .attr("y", function (d) { return y(d.vic_rate); })

            .attr("height", function (d) { return height - y(d.vic_rate); })
            .attr("fill", function (d, i) {
                return color(i);
            });

        chart
            .on("mouseover", function (d, i) {
                // grey out the selected point
                d3.select(this)
                    .attr("opacity", 0.8);
                // show tooltip
                tooltip.html("Avg. Victimisation rate: " + (d.vic_rate* 100).toFixed(2)  + "%")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("opacity",1.0);
            })
            .on("mouseout", function () {
                // restore the point
                d3.select(this)
                    .attr("opacity", 1);
                tooltip.style("opacity",0.0);
            });


    });


}

function prepareGenderBarData(data, crime) {
    // formatted = [{sex, victimisation rate}]
    var formatted = [];
    var count = [];
    data.forEach(function (rawEle) {
        // calculate the sum of victimisation rate according to given conditions
        if (crime === undefined) {
            var isExist = false;
            // if the element with same sex exist then directly add the victimisation rate to that sex, otherwise push a new element
            formatted.forEach(function (forEle) {
                if (forEle.sex === rawEle.sex) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.sex]++;
                }
            });
            if (!isExist) {
                formatted.push({sex:rawEle.sex, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.sex] = 1;
            }
        }
        else {
            var isExist = false;
            formatted.forEach(function (forEle) {
                if (forEle.sex === rawEle.sex && rawEle.crime == crime) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.sex]++;
                }
            });
            if (!isExist && rawEle.crime == crime) {
                formatted.push({sex:rawEle.sex, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.sex] = 1;
            }
        }
    });
    // calculate the average victimisation rate
    formatted.forEach(function (ele) {
        ele.vic_rate /= (count[ele.sex] * 100);
    });
    return formatted;
}

function drawAgeBar(year, crime) {
    // if the graph exists, delete that and draw a new one
    var old = document.getElementById("ageBar");
    if (old !== null) {
        old.parentNode.removeChild(old);
    }

    var canvaswidth = 600,
        canvasheight = 300;

    var svg = d3.select("#ageContainer").append("svg")
            .attr("width", canvaswidth)
            .attr("height", canvasheight)
            .attr("id", "ageBar"),
        margin = { top: 20, right: 20, bottom: 30, left: 40 },
        x = d3.scaleBand().padding(0.1),
        y = d3.scaleLinear();

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append("g")
        .attr("class", "axis axis-x");

    g.append("g")
        .attr("class", "axis axis-y");

    // read data
    d3.json("assets/d3/data/victims_by_age.json", function(error, data) {
        if (error) throw error;

        var bounds = svg.node().getBoundingClientRect(),
            width = bounds.width - margin.left - margin.right,
            height = bounds.height - margin.top - margin.bottom;

        x.rangeRound([0, width]);
        y.rangeRound([height, 0]);

        var formatted;
        if (year === undefined)
            formatted = prepareAgeBarData(data, undefined, crime);
        else
            formatted = prepareAgeBarData(data, year, crime);

        x.domain(formatted.map(function (d) { return d.age_group; }));
        y.domain([0, d3.max(formatted, function (d) { return d.vic_rate; })]);

        // draw x axis
        g.select(".axis-x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // draw y axis
        g.append("g")
            .attr("class", "axis axis-y")
            .call(d3.axisLeft(y).ticks(5, "%"))
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

        var bars = g.selectAll(".bar")
            .data(formatted);

        // define the colors used to fill the bars
        var color = d3.scaleOrdinal(d3.schemeCategory10);


        // draw bars
        var chart = bars
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return x(d.age_group); })
            .attr("width", x.bandwidth())
            .attr("y", function () { return y(y.domain()[0]); })
            .attr("height", function () { return 0; });

        chart
            .transition()
            .delay(function (d, i) {
                return i * 200;
            })
            .duration(1000)
            .ease(d3.easeSin)
            .attr("y", function (d) { return y(d.vic_rate); })

            .attr("height", function (d) { return height - y(d.vic_rate); })
            .attr("fill", function (d, i) {
                return color(i);
            });

        chart
            .on("mouseover", function (d, i) {
                // grey out the selected point
                d3.select(this)
                    .attr("opacity", 0.8);
                // show tooltip
                tooltip.html("Avg. Victimisation rate: " + (d.vic_rate* 100).toFixed(2)  + "%")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("opacity",1.0);
            })
            .on("mouseout", function () {
                // restore the point
                d3.select(this)
                    .attr("opacity", 1);
                tooltip.style("opacity",0.0);
            });


    });


}


function prepareAgeBarData(data, year, crime) {
    // formatted = [{age group, victimisation rate}]
    var formatted = [];
    var count = [];
    data.forEach(function (rawEle) {
        // calculate the sum of victimisation rate according to given conditions
        if (year === undefined) {
            var isExist = false;
            // if the element with same age group exist then directly add the victimisation rate to that age group, otherwise push a new element
            formatted.forEach(function (forEle) {
                if (forEle.age_group === rawEle.age_group && rawEle.crime == crime) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.age_group]++;
                }
            });
            if (!isExist && rawEle.crime == crime) {
                formatted.push({age_group:rawEle.age_group, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.age_group] = 1;
            }
        }
        else {
            var isExist = false;
            formatted.forEach(function (forEle) {
                if (forEle.age_group === rawEle.age_group && rawEle.crime == crime && rawEle.year == year) {
                    isExist = true;
                    forEle.vic_rate += rawEle.vic_rate;
                    count[rawEle.age_group]++;
                }
            });
            if (!isExist && rawEle.crime == crime && rawEle.year == year) {
                formatted.push({age_group:rawEle.age_group, vic_rate:0 + rawEle.vic_rate});
                count[rawEle.age_group] = 1;
            }
        }
    });

    // calculate the average victimisation rate
    formatted.forEach(function (ele) {
        ele.vic_rate /= (count[ele.age_group] * 100);
    });
    return formatted;
}

// initialise the page
window.onload = function () {
    initialiseGenderBarOptions();
    drawGenderBar();
    document.getElementById("yearSelectorLabel").innerHTML = "Selected: All years";
    initialiseAgeBarOptions();
    drawAgeBar(undefined,crimes[0]);
};

// if the user select a particular crime name in the Victims by Gender graph
$('#genderBarOptions').change(function () {
    if ($('#genderBarOptions').val() == "All") {
        drawGenderBar();
    }
    else {
        drawGenderBar($('#genderBarOptions').val());
    }
});

// initialise the options (crime names) available for user to choose in the Victims by Gender graph
function initialiseGenderBarOptions() {
    var selectList = document.getElementById("genderBarOptions");
    selectList.options.add(new Option("All", "All"));
    crimes.forEach(function (crime) {
        selectList.options.add(new Option(crime, crime))
    });
}

// if the user select a particular crime name in the Victims by Age graph
$('#ageBarOptions').change(function () {
    drawAgeBar(years[$('#yearSelector').val()], $('#ageBarOptions').val());
});

// initialise the options (crime names) available for user to choose in the Victims by Gender graph
function initialiseAgeBarOptions() {
    var selectList = document.getElementById("ageBarOptions");
    crimes.forEach(function (crime) {
        selectList.options.add(new Option(crime, crime))
    });
}

// if the user select a particular year in the Victims by Age graph
$('#yearSelector').change(function () {
    if ($('#yearSelector').val() <= 6) {
        document.getElementById("yearSelectorLabel").innerHTML = "Selected: " + years[$('#yearSelector').val()];
        drawAgeBar(years[$('#yearSelector').val()], $('#ageBarOptions').val());
    }
    else {
        document.getElementById("yearSelectorLabel").innerHTML = "Selected: All years";
        drawAgeBar(undefined, $('#ageBarOptions').val());
    }
});