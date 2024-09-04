'use strict';

var jobsData, pubsData, heatMap1Svg, heatMap2Svg, heatmapData, originX, originY, margin, scaleX, scaleY, cityHeight, cityWidth,
mapHeight, mapWidth, heatmapChecked="on", flowmapChecked="off";

document.addEventListener('DOMContentLoaded', function () {
    wrangleData();
})

function setHeatmapData(response) {
    heatmapData = response;
    console.log(heatmapData);
    drawHeatMap1();
}

async function wrangleData() {
    $.ajax({
                    url: '/processDataHeatmap',
                    type: 'POST',
                    contentType: 'application/json',
                    success: function(response) {
                        setHeatmapData(JSON.parse(response));
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
}

function drawHeatMap1() {
    heatMap1Svg = d3.select("#heatmap1Svg");
    margin = 5;
    mapWidth = document.getElementById("heatmap1Svg").clientWidth;
    mapHeight = document.getElementById("heatmap1Svg").clientHeight;
    cityWidth = 7600;
    cityHeight = 7900;
    scaleX = cityWidth/mapWidth;
    scaleY = cityHeight/mapHeight;
    originX = 345;
    originY = 570;

    var tooltip = d3.select("body").append("div")
        .attr("class", "heatmap1-tooltip")
        .style("opacity", 0);

    var currRadius;
    var mouseover = function(event, d) {
//        d3.select(this).raise();
//        currRadius = d3.select(this).node().getBoundingClientRect().width / 2;
//        d3.select(this).transition().attr('stroke-width', '2px').attr('r', currRadius*2);
        tooltip
        .style("left", (event.x+10) + "px")
        .style("top", (event.y-60) + "px")
        tooltip.transition().style("opacity", 1);
        tooltip.html("Establishment-Type: "+d.locType+"<br/>"
                +"Popularity: "+d.count+" &middot; "+"&#9733;".repeat(d.quantileCount)+"<br/>"
                +"Avg-Cost: "+d.avgCost.toFixed(2)+" &middot; "+"$".repeat(d.quantileCost)+"<br/>"
                +"Max-Occupancy: "+d.maxOccupancy+"<br/>"
                )
        }

    var mousemove = function(event) {
        tooltip
        .style("left", (event.x+10) + "px")
        .style("top", (event.y-60) + "px")
        }

    var mouseout = function() {
        tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
//        d3.select(this).transition().attr('stroke-width', '1px').attr('r', currRadius);
//        d3.select(this).lower();
        d3.select("#map_image").lower();
        }

    var mouseclick = function(event, d) {
        drawIncomingCustomers(d3.select(this))
//        d3.select(this).transition().attr('stroke-width', '1px').attr('r', currRadius);
        d3.select(this).lower();
        d3.select("#map_image").lower();
        }

    const circleSizeDomain = d3.extent(heatmapData.map(x => x.count));
    const size = d3.scaleSqrt().domain(circleSizeDomain).range([6, 15]);

    const circleSaturationDomain = d3.extent(heatmapData.map(x => x.avgCost));
    const colorScale = d3.scaleSequential(circleSaturationDomain, d3.interpolateOranges);

    heatMap1Svg.selectAll(".circles")
        .data(heatmapData)
        .join("circle")
        .attr("class", "circles")
        .on("mouseover", _.debounce(mouseover, 100))
        .on("mousemove", mousemove)
        .on("mouseout", mouseout)
        .on("click", mouseclick)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .attr("fill-opacity", 1)
        .attr("fill", (d) => colorScale(d.avgCost))
        .attr("cx", (d) => originX+d.endLocationX/scaleX-margin+"px")
        .attr("cy", (d) => originY-d.endLocationY/scaleY-margin*6+"px")
        .attr("r", function(d) {return size(d.count)})
        .style("opacity", 0)
        .transition().duration(1000)
        .style("opacity", 1)

    const legendWidth = 120;
    const legendHeight = 20;

    const legend = heatMap1Svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(10, ${mapHeight-110})`);

    const gradient = legend.append("defs")
      .append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.selectAll("stop")
      .data(colorScale.ticks().map((d, i, n) => ({
        offset: `${(i / n.length) * 100}%`,
        color: colorScale(d)
      })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    legend.append("rect")
      .attr("width", 0)
      .attr("height", legendHeight)
      .style("fill", "url(#linear-gradient)")
      .transition().duration(1000)
      .attr("width", legendWidth);

    const legendText = heatMap1Svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(45, ${mapHeight-120})`);

    legendText.append('text').attr('text-anchor', 'right').attr('alignment-baseline', 'central')
    .attr('font-size', '12px').style('font-weight', 'bold').text("Avg. Cost").style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1);

    const legendXaxis = d3.scaleLinear()
    .range([0, legendWidth])
    .domain(circleSaturationDomain);

    heatMap1Svg.append("g")
    .attr("transform", `translate(10, ${mapHeight-110+legendHeight})`)
    .style("opacity", 0)
    .call(d3.axisBottom(legendXaxis).tickValues(circleSaturationDomain).tickFormat(d3.format('.1f')))
    .transition().duration(1000)
    .style("opacity", 1);

    var minSize = size(circleSizeDomain[0]);
    var maxSize = size(circleSizeDomain[1]);

    const legendCircleSizeText = heatMap1Svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(45, ${mapHeight-60})`);

    legendCircleSizeText.append('text').attr('text-anchor', 'right').attr('alignment-baseline', 'central')
    .attr('font-size', '12px').attr('font-weight', 'bold').text("Popularity").style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1);

    heatMap1Svg.append("circle").attr("class", "legendHeatMap1").attr("cx", 20).attr("cy", mapHeight-35).attr("r", maxSize)
    .style("fill", "white")
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)

    heatMap1Svg.append("circle").attr("class", "legendHeatMap1").attr("cx", 20).attr("cy", (mapHeight-35)+maxSize-maxSize/1.5).attr("r", maxSize/1.5)
    .style("fill", "white")
    .attr("stroke", "black")
    .style('stroke-dasharray', ('2,2'))
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)

    heatMap1Svg.append("circle").attr("class", "legendHeatMap1").attr("cx", 20).attr("cy", (mapHeight-35)+maxSize-minSize).attr("r", minSize)
    .style("fill", "white")
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)

    heatMap1Svg.append("line").attr("class", "legendHeatMap1")
    .attr("x1", 20+maxSize)
    .attr("y1", (mapHeight-35))
    .attr("x2", 20+maxSize+30)
    .attr("y2", (mapHeight-35))
    .attr("stroke", "black")
    .style('stroke-dasharray', ('2,2'))
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)

    heatMap1Svg.append('text').attr("class", "heatMap1Svg")
    .attr('x', 20+maxSize+30)
    .attr('y', (mapHeight-35))
    .attr('text-anchor', 'right').attr('alignment-baseline', 'central')
    .attr('font-size', '10px')
    .text("Max: "+circleSizeDomain[1])
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)

    heatMap1Svg.append("line").attr("class", "heatMap1Svg")
    .attr("x1", 20+minSize)
    .attr("y1", (mapHeight-35)+maxSize-minSize)
    .attr("x2", 20+maxSize+30)
    .attr("y2", (mapHeight-35)+maxSize-minSize)
    .attr("stroke", "black")
    .style('stroke-dasharray', ('2,2'))
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)

    heatMap1Svg.append('text').attr("class", "heatMap1Svg")
    .attr('x', 20+maxSize+30)
    .attr('y', (mapHeight-35)+maxSize-minSize)
    .attr('text-anchor', 'right').attr('alignment-baseline', 'central')
    .attr('font-size', '10px')
    .text("Min: "+circleSizeDomain[0])
    .style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1)
}

function drawIncomingCustomers(object) {
    var heatmapRadio = document.getElementById('HeatmapRadio');
    heatmapRadio.addEventListener('change', function handleChange(event) {
        heatmapChecked = event.target.value;
        flowmapChecked = "off";
        drawHeatMap3(object);
    });

    var flowmapRadio = document.getElementById('FlowmapRadio');
    flowmapRadio.addEventListener('change', function handleChange(event) {
        flowmapChecked = event.target.value;
        heatmapChecked = "off";
        drawHeatMap2(object);
    });

    if(heatmapChecked=="on")
        drawHeatMap3(object);
    else
        drawHeatMap2(object);
}
function drawHeatMap2(object) {
    heatMap2Svg = d3.select("#heatmap2Svg");

    heatMap2Svg.selectAll("*").remove();

    heatMap2Svg.append("image")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("xlink:href", "static/BaseMap6.png");

    heatMap2Svg.append("circle")
    .attr("class", "circles1")
    .attr("cx", object.attr("cx"))
    .attr("cy", object.attr("cy"))
    .attr("r", object.attr("r"))
    .style("fill", object.style("fill"))
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .style("opacity", 1)

    var data = object.datum().startLocations;

    console.log(data.length);

    let sampleData = new Set();
    let sampleArray = [];

    data.forEach(element => {
        if(!sampleData.has(element[0])){
            sampleArray.push(element);
            sampleData.add(element[0]);
        }
        })

    console.log(sampleArray.length);

    heatMap2Svg.selectAll(".circles")
        .data(sampleArray)
        .join("circle")
        .attr("class", "circles")
        .attr("stroke", "black")
        .attr("stroke-width", "0px")
        .attr("fill-opacity", 1)
        .attr("fill", "black")
        .attr("cx", (d) => originX+d[1]/scaleX-margin+"px")
        .attr("cy", (d) => originY-d[2]/scaleY-margin*6+"px")
        .attr("r", "2px")
        .style("opacity", 1)

    heatMap2Svg.selectAll(".lines")
        .data(sampleArray)
        .join("line")
        .attr("class", "lines")
        .attr("x1", (d) => originX+d[1]/scaleX-margin)
        .attr("y1", (d) => originY-d[2]/scaleY-margin*6)
        .attr("x2", object.attr("cx"))
        .attr("y2", object.attr("cy"))
        .style("stroke", "#FF6037")
        .style("stroke-width", "0.6px")
        .style("opacity", 0.6)

    heatMap2Svg.selectAll(".lines").raise();
}

function drawHeatMap3(object) {
    heatMap2Svg = d3.select("#heatmap2Svg");

    heatMap2Svg.selectAll("*").remove();

    heatMap2Svg.append("image")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("xlink:href", "static/BaseMap6.png");

    const gridSize = 40;

    heatMap2Svg.selectAll(".lines").remove();

    for(let x=0; x<=mapWidth; x+=gridSize)
        {
            heatMap2Svg.append("line")
            .attr("class", "lines")
            .attr("x1", x)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", mapHeight)
            .style("stroke", "blue")
            .style("stroke-width", 1)
            .style("opacity", 0.2);

            heatMap2Svg.append("line")
            .attr("class", "lines")
            .attr("x1", 0)
            .attr("y1", x)
            .attr("x2", mapWidth)
            .attr("y2", x)
            .style("stroke", "blue")
            .style("stroke-width", 1)
            .style("opacity", 0.2);
        }

    var data = object.datum().startLocations;

    heatMap2Svg.selectAll(".circles")
        .data(data)
        .join("circle")
        .attr("class", "circles")
        .attr("stroke", "black")
        .attr("stroke-width", "0px")
        .attr("fill-opacity", 1)
        .attr("fill", "black")
        .attr("cx", (d) => originX+d[1]/scaleX-margin+"px")
        .attr("cy", (d) => originY-d[2]/scaleY-margin*6+"px")
        .attr("r", "2px")
        .style("opacity", 0)

    let arr = [];

    for (let i = 0; i < parseInt(Math.ceil(mapWidth/gridSize)); i++) {
        arr[i] = [];

        for (let j = 0; j < parseInt(Math.ceil(mapHeight/gridSize)); j++) {
            arr[i][j] = 0;
        }
    }

    heatMap2Svg.selectAll(".circles").nodes().map(function(circle) {
        let x = parseFloat(circle.getAttribute("cx").replace(/px$/, ''));
        let y = parseFloat(circle.getAttribute("cy").replace(/px$/, ''));
        let arrX = parseInt(Math.ceil(x/gridSize))-1;
        let arrY = parseInt(Math.ceil(y/gridSize))-1;
        arr[arrX][arrY]++;
        });

    let newArr = [];
    for (let i = 0; i < parseInt(Math.ceil(mapWidth/gridSize)); i++) {
        for (let j = 0; j < parseInt(Math.ceil(mapHeight/gridSize)); j++) {
            newArr.push(arr[i][j]);
        }
    }

    let nonZeroArr = newArr.filter(x => x!=0).sort(function(a, b){return a - b});

    const gridSaturationDomain = d3.extent(nonZeroArr);
    const colorScale = d3.scaleSequential()
        .domain(gridSaturationDomain)
        .interpolator(d3.interpolateRgb("#c7ddef", "#135ea5"))
//        .interpolator(d3.interpolateBlues);

    heatMap2Svg.selectAll(".rects").remove();
    heatMap2Svg.selectAll(".gridCircles").remove();

    for (let i = 0; i < parseInt(Math.ceil(mapWidth/gridSize)); i++) {
        for (let j = 0; j < parseInt(Math.ceil(mapHeight/gridSize)); j++) {
            if(arr[i][j]!=0) {
                heatMap2Svg.append("rect")
                .attr("class", "rects")
                .attr("x", i*gridSize)
                .attr("y", j*gridSize)
                .attr("width", gridSize)
                .attr("height", gridSize)
                .style("fill", colorScale(arr[i][j]))
//                .style("fill", bucketValues(arr[i][j]))
                .style("opacity", 0)
            }
        }
    }

    heatMap2Svg.selectAll(".rects")
    .transition().duration(500)
    .delay(function(d,i){ return i * 50 })
    .style("opacity", 0.8);

    heatMap2Svg.selectAll(".legend").remove();

    const legendWidth = 120;
    const legendHeight = 20;

    const legend = heatMap2Svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(10, ${mapHeight-110})`);

    const gradient = legend.append("defs")
      .append("linearGradient")
      .attr("id", "linear-gradient1")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.selectAll("stop")
      .data(colorScale.ticks().map((d, i, n) => ({
        offset: `${(i / n.length) * 100}%`,
        color: colorScale(d)
      })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    legend.append("rect")
      .attr("width", 0)
      .attr("height", legendHeight)
      .style("fill", "url(#linear-gradient1)")
      .transition().duration(1000)
      .attr("width", legendWidth);

    const legendText = heatMap2Svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(15, ${mapHeight-120})`);

    legendText.append('text').attr('text-anchor', 'right').attr('alignment-baseline', 'central')
    .attr('font-size', '12px').style('font-weight', 'bold').text("No. of Customers").style("opacity", 0)
    .transition().duration(1000)
    .style("opacity", 1);

    const legendXaxis = d3.scaleLinear()
    .range([0, legendWidth])
    .domain(gridSaturationDomain);

    heatMap2Svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(10, ${mapHeight-110+legendHeight})`)
    .style("opacity", 0)
    .call(d3.axisBottom(legendXaxis).tickValues(gridSaturationDomain).tickFormat(d3.format('d')))
    .transition().duration(1000)
    .style("opacity", 1);
}

//function bucketValues(x) {
//    return (x==0)?"none":(x<=50)?"#66FF66":(x<=500)?"#FFFF66":(x<=2500)?"#FF9933":"#FD0E35";
//}
