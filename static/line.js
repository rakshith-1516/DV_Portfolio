import { drawParallelCoordinatePlot } from "./parallelCoordinatePlot.js";

    export function drawLineChart(data) {

        const groupedData = data.reduce((acc, entry) => {
            const { interestGroup, age, joviality } = entry;
          
            const key = `${interestGroup}-${age}`;
          
            if (!acc[key]) {
              acc[key] = { interestGroup, age, totalJoviality: 0, count: 0 };
            }
          
            acc[key].totalJoviality += +joviality;
            acc[key].count++;
          
            return acc;
          }, {});
          
          // Calculate average joviality for each interestGroup and age combination
          const results = Object.values(groupedData).map(entry => ({
            interestGroup: entry.interestGroup,
            age: entry.age,
            averageJoviality: (entry.totalJoviality / entry.count).toFixed(2),
          }));
          
  let filtered_data = results

  let dataNest = Array.from(
  d3.group(filtered_data, d => d.interestGroup), ([key, value]) => ({key, value})
  );
  
  const margin = {top: 20, right: 30, bottom: 60, left: 60},
    width = 540 - margin.left - margin.right,
    height = 560 - margin.top - margin.bottom;

  const svg = d3.select("#dataviz")
  .append("svg")
  .attr('id', '#line-chart-svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const ageGroups = ['10-20', '20-30', '30-40', '40-50', '50-60', '60-70']
  
const x = d3.scaleBand()
.domain(ageGroups)
.range([0, width])
.padding(1); 
svg.append("g")
.attr("transform", `translate(0, ${height})`)
.call(d3.axisBottom(x));

  const y = d3.scaleLinear()
    .domain([d3.min(filtered_data, function(d) { return +d.averageJoviality; }), d3.max(filtered_data, function(d) { return +d.averageJoviality; })])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y));

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // const color = d3.scaleOrdinal()
    // .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999', '#333333'])

    // let line = 
    
    // console.log(sumstat)

    // svg.selectAll(".line")
    //   .data(sumstat)
    //   .join("path")
    //     .attr("fill", d => colorDictionary[d.interestGroup])
    //     .attr("stroke", d => colorDictionary[d.interestGroup])
    //     .attr("stroke-width", 1.5)
    //     .attr('d', d => d3.line()
    //     .x(function(d) { return x(+d.age); })
    //     .y(function(d) { return y(+d.averageJoviality); })
    //     (d.values)
        
    //     )

    var line = d3.line()	
  .x(function(d) { return x(d.ageGroup); })
  .y(function(d) { return y(+d.averageJoviality); });

  const transformedDataArray = [];

  dataNest.forEach(group => {
    group.value.sort((a, b) => +a.age - +b.age);
    const transformedData = groupAndAverage(group.value)
    transformedDataArray.push(transformedData);
  });

  // This works best
  dataNest.forEach((group, index) => {
    group.value = transformedDataArray[index]; 
  });
    dataNest.forEach(function(d,i) { 
      const linePath = svg.append("path")
      .attr("class", "line")
      .style("stroke", function() {
      return d.color = color(d.key); })
      .attr("stroke-width", 1.5)
      .attr('fill', 'none')
      .attr("d", line(d.value))
      .on('mouseover', function() {
        d3.select(this)
        .transition().duration(500)
        .attr('stroke-width', 5); 
      })
      .on('mouseout', function() {
        d3.select(this)
        .transition().duration(500)
        .attr('stroke-width', 1.5); 
      })
      .on('click', function(event){
        
        let pass_data = data.filter(item => item.interestGroup === d.key)
        const parallelSVG = d3
                            .select("#parallel-plot")
        parallelSVG.remove()
        drawParallelCoordinatePlot(pass_data, d.color)
      })

      ;
      
    
    }
      
      )

      const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(10, 10)"); 

  legend.append("text")
    .attr("x", 0)
    .attr("y", 0 + 9) 
    .text("Interest Groups"); 

dataNest.forEach((group, index) => {
  const yPos = (index + 1)  * 20; 

 
  legend.append("rect")
    .attr("x", 0)
    .attr("y", yPos)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", group.color);

  
  legend.append("text")
    .attr("x", 20)
    .attr("y", yPos + 9) 
    .text(group.key); 
});

svg.append('text')
  .attr('transform', 'translate(' + (width / 2) + ' ,' + (height + 40) + ')')
  .style('text-anchor', 'middle')
  .text('Age Groups');

  svg.append('text')
  .attr('transform', 'rotate(-90)')
  .attr('y', 10 - margin.left)
  .attr('x', 0 - (height / 2))
  .attr('dy', '1em')
  .style('text-anchor', 'middle')
  .text('Average Joviality');
    
    }
    
    function groupAndAverage(data) {
      const groupedData = {};
    
      data.forEach(entry => {
        const age = parseInt(entry.age); 
        const ageGroup = Math.floor(age / 10) * 10 + '-' + (Math.floor(age / 10) * 10 + 10);
        if (!groupedData[ageGroup]) {
          groupedData[ageGroup] = {
            sum: 0,
            count: 0
          };
        }
        groupedData[ageGroup].sum += parseFloat(entry.averageJoviality); 
        groupedData[ageGroup].count++;
      });
    
      const transformedData = [];
      for (const ageGroup in groupedData) {
        const avgJoviality = groupedData[ageGroup].sum / groupedData[ageGroup].count;
        transformedData.push({
          interestGroup: data[0].interestGroup,
          ageGroup: ageGroup,
          averageJoviality: avgJoviality.toFixed(7), 
          count: groupedData[ageGroup].count 
        });
      }
    
      return transformedData;
    }
    

