export function drawParallelCoordinatePlot(data, d_color) {
  const interestGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const educationLevels = [
    "Low",
    "HighSchoolOrCollege",
    "Bachelors",
    "Graduate",
  ];

  let tooltip = d3.select('#plotviz')
          .append('div')
          .style("opacity", 0)
          .style('z-index', 100)
          .style('position', 'fixed')
          .attr('class', 'tooltip')
          .style('background-color', 'white')
          .style('border', 'solid')
          .style('border-width', '2px')
          .style('border-radius', '5px')
          .style('padding', '10px')


  const color = d3
    .scaleOrdinal()
    .domain(interestGroups)
    .range(d3.schemeTableau10);
  const categoricalAttributes = ["educationLevel"];
  const numericalAttributes = ["age", "householdSize",  "joviality" , "haveKids"];
  const margin = { top: 30, right: 60, bottom: 30, left: 50 };
  
  const width = 540 - margin.left - margin.right;
  const height = 560 - margin.top - margin.bottom;
  let svg = d3
    .select("#plotviz")
    .append("svg")
    .attr('id', 'parallel-plot')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const y_scale_dict = {};
  for (let attr of numericalAttributes) {
    y_scale_dict[attr] = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[attr]))
      .range([height, 0]);
  }
  y_scale_dict["educationLevel"] = d3
    .scalePoint()
    .range([height, 0])
    .domain(educationLevels);
  // y_scale_dict["haveKids"] = d3
  //   .scaleOrdinal()
  //   .domain(d3.extent(data, (d) => {
  //     console.log(typeof(d.haveKids))

  //    return  d.haveKids}))
  //   .range([height, 0]);
  const attributes = [
    "age",
    "educationLevel",
    "householdSize",
    "haveKids",
    "joviality",
  ];
  const x = d3.scalePoint().range([0, width]).domain(attributes);
  const path = (d) => {
    return d3.line()(
      attributes.map(function (p) {
        return [x(p), y_scale_dict[p](d[p])];
      })
    );
  };
  const paths = svg
    .selectAll("myPath")
    .data(data)
    .join("path")
    .attr("class", (d) => "line " + d.interestGroup.replace(/\s/g, ""))
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", (d) => d_color)
    .style('stroke-width', 1) 
    .style("opacity", 0.4)
    .on('mouseover', function(event, item){
      d3.select(this).transition().duration(100).style('opacity', 1).style('stroke-width', 5) 
      tooltip.html('Age: ' + item['age'] +  '<br>' + 'Education Level:' + ' '  + item['educationLevel'] + ' ' + '<br>' + 'Household Size:' + ' '  + item['householdSize'] + '<br>' + 'Has kids:' + ' '  + item['haveKids'] )
      .style('opacity', 1).style('background-color','azure')
    })
    .on('mousemove', function(event, item){
      tooltip.style("transform","translateY(-55%)")
              .style("left",(event.x) + 25 +"px")
              .style("top",(event.y) - 40 +"px")
  })
  .on('mouseout', function(event, item){
    d3.select(this).transition().duration(500).style('opacity', 0.5)
    .style('stroke-width', 1) 
    tooltip
  .style("opacity", 0)
  })

  svg
    .selectAll("myAxis")
    .data(attributes)
    .enter()
    .append("g")
    .attr("class", "axis code")
    .attr("transform", function (d) {
      return `translate(${x(d)})`;
    })
    .each(function (d) {
      if(d === 'householdSize'){
        d3.select(this).call(d3.axisLeft().ticks(2).scale(y_scale_dict[d]));
      }
      else{
        if(d === 'haveKids'){
          const tickLabels = ['No', 'Yes']
          d3.select(this).call(d3.axisLeft().ticks(1).tickFormat((d,i) => tickLabels[i]).
          scale(y_scale_dict[d]));
        }
        else{
          d3.select(this).call(d3.axisLeft().ticks(7).scale(y_scale_dict[d]));
        }
      }
    })
    .append("text")
    .style("text-anchor", "middle")
    .classed("code", true)
    .attr("y", -9)
    .html(function (d) {
      return `${d}`;
    })
    .style("fill", "#000");
    const brushes = {};
    attributes.forEach(attribute => {
    brushes[attribute] = d3.brushY()
                            .extent([[x(attribute) - 10, 0], [x(attribute) + 10, height]])
                            .on("brush",function(){
                              const extent = d3.brushSelection(this);
                              brushed(extent, attribute)
                            }).on("end", function () {
                              const extent = d3.brushSelection(this);
                              if (!extent) {
                                // Call your function when brush selection is cleared (extent is null)
                                handleClearBrush(extent, attribute);
                              }
                            })

                            ;

    svg.append("g")
      .attr("class", "brush")
      .call(brushes[attribute]);
  });

  function handleClearBrush(extent, attribute){
    actives[attribute] = []
    console.log(actives)
    paths
    .transition().duration(500)
    .style('stroke',d_color).style('opacity', 0.1)
          .style("stroke-width", 1)
  }

  function nearest_value(val, dictionary) {
    let minDiff = Infinity;
    let nearestVal;

    for (const key in dictionary) {
      const dictVal = dictionary[key];
      const diff = Math.abs(val - dictVal);

      if (diff < minDiff) {
        minDiff = diff;
        nearestVal = dictVal;
      }
    }

    return nearestVal;
  }
  function keysBetweenValues(dictionary, start, end) {
    const keys = Object.keys(dictionary);

    return keys.filter(key => {
      const value = dictionary[key];
      return value >= start && value <= end;
    });
  }

  function invert_categorical(extent, attribute){
    const range = y_scale_dict[attribute].domain().map(y_scale_dict[attribute]);
    const domain = y_scale_dict[attribute].domain()
    var rangeToDomain = {}
    domain.forEach((d,i) => {
      rangeToDomain[d] = range[i]
    })
    console.log(keysBetweenValues(rangeToDomain, extent[0], extent[1]))
    return keysBetweenValues(rangeToDomain, extent[0], extent[1])
  }
  const actives = {};
  // Function to handle brushing
  function brushed(extent, attribute) {

  if (extent) {
    actives[attribute] = numericalAttributes.includes(attribute)?extent.map(y_scale_dict[attribute].invert): invert_categorical(extent, attribute)
  }

  console.log(actives)

  // Update the visualization based on the brushed ranges across dimensions
  const activeAttributes = Object.keys(actives);

// Filter paths to include only those corresponding to attributes in actives
const pathsToUpdate = paths.filter(function(d) {
  return activeAttributes.every(attr => {
    const val = d[attr];
    if (numericalAttributes.includes(attr)) {
      return val <= actives[attr][0] && val >= actives[attr][1];
    } else {
      // console.log("haveKids")
      return actives[attr].includes(val);
    }
  });
});

// Update styles for filtered paths
pathsToUpdate.transition().duration(50).style("stroke", d_color).style("stroke-width", 3).style('opacity', 1);

// Update styles for other paths (not in the selected region)
paths.filter(function(d) {
  return !pathsToUpdate.nodes().includes(this);
})
.transition().duration(500)
.style("stroke", "grey")
.style('opacity', 0.1)
.style("stroke-width", 1)
;


  }



}
