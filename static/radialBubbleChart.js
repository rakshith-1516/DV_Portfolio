var employeePopulationData,
  showAcrossTime = false;
document.addEventListener("DOMContentLoaded", function () {
  wrangleData();
});

function setEmployeePopulationData(response) {
  employeePopulationData = response;
}

async function wrangleData() {
  $.ajax({
    url: "/processDataEmployeePopulation",
    type: "POST",
    contentType: "application/json",
    success: function (response) {
      setEmployeePopulationData(JSON.parse(response));
      drawRadialBubbleChart(employeePopulationData);
    },
    error: function (error) {
      console.log(error);
    },
  });
}

const months = [
  "Aug 22",
  "Sep 22",
  "Oct 22",
  "Nov 22",
  "Dec 22",
  "Jan 23",
  "Feb 23",
  "Mar 23",
  "Apr 23",
  "May 23",
  "Mar 22",
  "Apr 22",
  "May 22",
  "Jun 22",
  "Jul 22",
].reverse();

const width = 900,
  height = 900,
  innerRadius = (0.35 * width) / 2,
  outerRadius = (0.9 * width) / 2,
  min_radius = 2,
  max_radius = 10;

var circles, node, sim;

function encodeEducationRequirement(educationRequirement) {
  switch (educationRequirement) {
    case "Low":
      return 0;
      break;
    case "HighSchoolOrCollege":
      return 1;
      break;
    case "Bachelors":
      return 2;
      break;
    case "Graduate":
      return 3;
      break;
  }
  return -1;
}

function decodeEducationRequirement(educationRequirement) {
  switch (educationRequirement) {
    case 0:
      return "Low";
      break;
    case 1:
      return "HighSchoolOrCollege";
      break;
    case 2:
      return "Bachelors";
      break;
    case 3:
      return "Graduate";
      break;
  }
  return "Unknown";
}

function processData(rawData) {
  return rawData.map((d) => {
    return {
      date: new Date(d.month).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      }),
      employer: +d.employer,
      empPopulation: +d.empPopulation,
      avgHourlyWage: +d.avgHourlyWage,
      educationRequirement: encodeEducationRequirement(d.educationRequirement),
    };
  });
}

function updateOnHoverSetting(_source) {
  showAcrossTime = document.getElementById("sameTime").checked;
}

function drawRadialBubbleChart(rawData) {
  var data = processData(rawData);
  console.log(data);

  const colorDomain = d3.extent(data, (d) => d.avgHourlyWage);
  const colorScale = d3
    .scaleQuantile()
    .domain(colorDomain) // pass the whole dataset to a scaleQuantile's domain
    .range(["#E4E3F0", "#9E9BC9", "#5F3C99"]);

  const rScale = d3
    .scaleSqrt()
    .domain(d3.extent(data, (d) => d.empPopulation))
    .range([min_radius, max_radius]);

  const yDomain = d3.extent(data, (d) => d.educationRequirement);

  // Y scale
  const yScale = d3
    .scaleLinear()
    .domain(yDomain)
    .range([innerRadius, outerRadius]);

  // X scale
  const x = d3
    .scaleBand()
    .range([0, 2 * Math.PI])
    .align(0)
    .domain(data.map((d) => d.date));

  circles = data.map((d) => ({
    x: yScale(d.educationRequirement) * Math.sin(x(d.date)),
    y: yScale(d.educationRequirement) * Math.cos(x(d.date)),
    r: rScale(d.empPopulation),
    date: d.date,
    employer: d.employer,
    empPopulation: d.empPopulation,
    avgHourlyWage: d.avgHourlyWage,
    educationRequirement: d.educationRequirement,
  }));

  const xAxis = (g) =>
    g
      .attr("text-anchor", "middle")
      .attr("class", "main")
      .call((g) =>
        g
          .selectAll("g")
          .data(months)
          .join("g")
          .attr("class", "main-child")
          .attr("transform", (d, i, arr) => {
            // console.log(d);
            // should be in degrees
            let degrees = (i * 360) / arr.length; // x(d) * (180 / Math.PI);
            return `
          rotate(${degrees})
          translate(${innerRadius},0)
        `;
          })
          .call((g) =>
            g
              .append("line")
              .attr("class", "line")
              .attr("x1", -5)
              .attr("x2", outerRadius - innerRadius + 10)
              .style("stroke", "#aaa")
          )
          .call((g) =>
            g
              .append("text")
              .attr("class", "text")
              .attr("transform", (d, i, arr) =>
                ((i * 360) / arr.length) % 360 > 180
                  ? "rotate(90)translate(0,16)"
                  : "rotate(-90)translate(0,-9)"
              )
              .style("font-family", "sans-serif")
              .style("font-size", 12)
              .text((d) => d)
              .style("font-weight", 900)
          )
      );

  const yAxis = (g) =>
    g
      .attr("text-anchor", "middle")
      //  THIS IS Y-AXIS LABEL
      .call((g) =>
        g
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", (d) => -yScale(yScale.ticks(5).pop()) - 10)
          .attr("dy", "-1em")
          .style("fill", "#1a1a1a")
          .text("Education Requirement")
          .style("font-weight", 900)
          .style("font-size", 12)
      )
      .call((g) =>
        g
          .selectAll("g")
          .data(yScale.ticks(4))
          .join("g")
          .attr("fill", "none")
          //  GUIDE CIRCLES
          .call((g) =>
            g
              .append("circle")
              .style("stroke", "#1a1a1a")
              .style("stroke-opacity", 0.8)
              .attr("r", yScale)
          )
          //  Y-AXIS TICKS
          .call((g) =>
            g
              .append("text")
              .attr("y", (d) => -yScale(d))
              .attr("dy", "0.35em")
              .style("stroke", "#fff")
              .style("stroke-width", 5)
              .style("fill", "#1a1a1a")
              .text((d) => decodeEducationRequirement(d))
              .clone(true)
              .style("stroke", "none")
              .style("font-weight", 900)
              .style("font-size", 12)
              .style("background", "transparent")
          )
      );

  /*
  TOOLTIP FUNCTIONS
  */
  const getTooltipHtml = (d) => {
    return `
      <b>Employer ID</b>: ${d.employer}<br/>
      <b># of Employees</b>: ${d.empPopulation}<br/>
      <b>Avg Hourly Wage</b>: ${d.avgHourlyWage}<br/>
      <b>Education Level Required*</b>: ${decodeEducationRequirement(
        d.educationRequirement
      )}
    `;
  };

  const mouseover = (event, d) => {
    showAcrossTime
      ? highlightSameEmployer(event, d)
      : highlightSameDate(event, d);
    var tooltipDiv = d3.select("#myTooltip");
    tooltipDiv.transition().duration(200).style("opacity", 1);
    tooltipDiv
      .html(getTooltipHtml(d))
      .style("left", event.pageX + "px")
      .style("cursor", "pointer")
      .style("top", function (d) {
        return event.pageY + "px";
      })
      .style("color", "#1a1a1a");
  };

  const mouseleave = (event, d) => {
    unhighlight(event, d);
    var tooltipDiv = d3.select("#myTooltip");
    tooltipDiv.transition().duration(500).style("opacity", 0);
    tooltipDiv.html(getTooltipHtml(d));
  };

  const mousemove = (event, d) => {
    d3.select("#myTooltip")
      .style("left", event.pageX + "px")
      .style("cursor", "pointer")
      .style("top", function (d) {
        return event.pageY + "px";
      });
  };

  const highlightSameEmployer = (event, d) => {
    let selected = d.employer;
    d3.selectAll(".circle-data")
      .style("fill", "lightgrey")
      .style("opacity", 0.2);
    d3.selectAll(".e" + selected)
      .style("fill", function (i) {
        return colorScale(i.avgHourlyWage);
      })
      .style("opacity", 1);
  };

  const highlightSameDate = (event, d) => {
    let selected = d.date;
    d3.selectAll(".circle-data")
      .style("fill", "lightgrey")
      .style("opacity", 0.2);
    d3.selectAll(".d" + selected.replace(/\s/g, ""))
      .style("fill", function (i) {
        return colorScale(i.avgHourlyWage);
      })
      .style("opacity", 1);
  };

  const unhighlight = (_event, _d) => {
    d3.selectAll(".circle-data")
      .style("fill", function (i) {
        return colorScale(i.avgHourlyWage);
      })
      .style("opacity", 0.9);
  };

  const svg = d3
    .select("#dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "graph_svg");

  const container = svg
    .append("g")
    .attr("class", "container")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .style("font-size", 10)
    .style("font-family", "sans-serif");

  container.append("g").call(xAxis);

  container.append("g").call(yAxis);

  d3.select("body")
    .append("div")
    .attr("id", "myTooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("text-align", "center")
    .style("font-size", "11px")
    .style("margin-top", "5px")
    .style("padding", "2px")
    .style("background-color", "rgb(255, 255, 255)")
    .style("border", "1px solid rgb(0, 0, 0)")
    .style("color", "#000")
    .style("pointer-events", "none");

  node = container
    .selectAll(".circle-data")
    .data(circles)
    .join("circle")
    .attr(
      "class",
      (d) => "circle-data d" + d.date.replace(/\s/g, "") + " e" + d.employer
    )
    .attr("cy", (d) => d.y)
    .attr("cx", (d) => d.x)
    .attr("r", (d) => d.r)
    .style("fill", (d) => colorScale(d.avgHourlyWage))
    .style("opacity", 0.9)
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .style("opacity", 0.75)
    .on("mouseover", mouseover)
    .on("mouseleave", mouseleave)
    .on("mousemove", mousemove);

  d3.selectAll(".circle-data").each(function () {
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
  });

  sim = d3
    .forceSimulation(circles)
    .force("x", d3.forceX((d) => d.x).strength(1))
    .force("y", d3.forceY((d) => d.y).strength(1))
    .force(
      "collide",
      d3
        .forceCollide(13)
        .strength(1.5)
        .radius((d) => d.r)
    );
  // .stop()
  // .tick(20);

  sim.on("tick", () => {
    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });
}