function display() {
  play();
}

var playInterval;

function play() {
  var startDate = new Date(document.getElementById("start").value);
  var endDate = new Date(document.getElementById("end").value);
  globalDate = "";
  clearInterval(playInterval);
  playInterval = setInterval(function () {
    if (startDate > endDate) clearInterval(playInterval);
    else {
      startVis(
        document.getElementById("attr1").value,
        document.getElementById("attr2").value,
        startDate.toISOString()
      );
      startDate.setDate(startDate.getDate() + 1);
    }
  }, 10000);
}

var participants;
var socialNetwork;
async function loadData() {
  document.getElementById("playBtn").disabled = true;
  Promise.all([
    d3.csv("static/Participants.csv"),
    d3.csv("static/SocialNetwork.csv"),
  ]).then(function (values) {
    participants = values[0];
    socialNetwork = values[1];
    document.getElementById("playBtn").disabled = false;
  });
}
function isValid(group1, group2) {
  if (group1 == "default" || group2 == "default" || group1 === group2)
    return false;
  else return true;
}
var globalDate = "";
function startVis(group1, group2, date) {
  if (!isValid(group1, group2)) return;
  dataMap = {};
  if (globalDate == date) return;
  globalDate = date;

  var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
  svg.selectAll("*").remove();

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id(function (d) {
          return d.id;
        })
        .strength(function (link) {
          if (link.source.group == link.source.target) {
            return 0.5;
          } else {
            return 0.1;
          }
        })
    )
    .force(
      "collide",
      d3.forceCollide((d) => {
        return 2;
      })
    )
    .alphaDecay(0)
    .alpha(0.5)
    .force("charge", d3.forceManyBody().strength(-40))
    .force("center", d3.forceCenter(width / 2, height / 2));

  var groupSimulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id(function (d) {
          return d.id;
        })
        .strength(function (link) {
          link.value * 2;
        })
    )
    .force("charge", d3.forceManyBody().strength(-10))
    .force(
      "collide",
      d3.forceCollide((d) => {
        return 2;
      })
    )
    .alphaDecay(0.2)
    .alpha(1)
    .force("center", d3.forceCenter(width / 2, height / 2));

  var filteredParticipants = [];
  var filteredSocialNetwork = [];
  if (!isValid(group1, group2)) return;
  for (var i = 0; i < participants.length; i++) {
    if (participants[i].group == group1 || participants[i].group == group2)
      filteredParticipants.push(participants[i]);
  }
  var groups = [];

  filteredParticipants.forEach(function (d) {
    if (groups.indexOf(d.group) == -1) groups.push({ id: d.group });
  });
  console.log(filteredParticipants);

  var groupLinks = {};

  for (var i = 0; i < socialNetwork.length; i++) {
    var nodes = filteredParticipants;

    var map = new Map();

    nodes.map((node) => {
      map.set(node.id, node);
    });

    var target = socialNetwork[i].target;
    var source = socialNetwork[i].source;

    if (Date.parse(socialNetwork[i].timestamp) > Date.parse(date)) break;
    if (
      !map.get(target) ||
      !map.get(source) ||
      map.get(target).group === map.get(source).group ||
      (group1 != map.get(target).group && group2 != map.get(target).group) ||
      (group1 != map.get(source).group && group2 != map.get(source).group)
    ) {
      continue;
    } else {
      if (Date.parse(socialNetwork[i].timestamp) == Date.parse(date))
        filteredSocialNetwork.push(socialNetwork[i]);
    }

    if (map.get(target).group > map.get(source).group) {
      var groupTarget = map.get(target).group;
      var groupSource = map.get(source).group;
    } else {
      var groupTarget = map.get(source).group;
      var groupSource = map.get(target).group;
    }

    if (groupTarget != groupSource) {
      var property = "_" + groupSource + "-" + groupTarget;

      if (groupLinks[property]) {
        groupLinks[property]++;
      } else {
        groupLinks[property] = 1;
      }
    }
  }

  var groupGraph = {};

  groupGraph.nodes = groups;
  groupGraph.links = [];

  for (var link in groupLinks) {
    var parts = link.substring(1).split("-");
    var source = parts[0];
    var target = parts[1];
    var value = groupLinks[link];

    groupGraph.links.push({ source: source, target: target, value: value });
  }
  groupSimulation.nodes(groupGraph.nodes);

  var link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(filteredSocialNetwork)
    .enter()
    .append("line")
    .attr("stroke-width", 1);

  var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(filteredParticipants)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", function (d) {
      return color(d.group);
    })
    .on("mouseover", function (event, d) {
      div.transition().duration(200).style("opacity", 1);
      div
        .html(
          "<div><p>ID: " +
            d.id +
            "</p><p>Interest Group: " +
            d.group +
            "</p><p>Age: " +
            d.age +
            "</p><p>Education: " +
            d.educationLevel +
            "</p><p>Joviality: " +
            d.joviality +
            "</p></div>"
        )
        .style("left", event.x + "px")
        .style("border", "1px solid black")
        .style("border-radius", "10px")
        .style("background-color", "white")
        .style("top", event.y + "px");
    })
    .on("mouseout", function (d) {
      div.transition().duration(500).style("opacity", 0);
    })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  svg
    .append("circle")
    .attr("cx", "10")
    .attr("cy", "60")
    .attr("r", 10)
    .style("fill", color(group1));
  svg
    .append("circle")
    .attr("cx", "10")
    .attr("cy", "85")
    .attr("r", 10)
    .style("fill", color(group2));
  var newDate = date + "";

  svg
    .append("text")
    .attr("x", 0)
    .attr("y", 30)
    .text("Date selected: " + newDate.substring(0, 10))
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 25)
    .attr("y", 60)
    .text(group1 + " group")
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");

  svg
    .append("text")
    .attr("x", 25)
    .attr("y", 85)
    .text(group2 + " group")
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");

  svg
    .append("text")
    .attr("x", 0)
    .attr("y", 110)
    .text("# of interactions: " + filteredSocialNetwork.length / 2)
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");
  console.log(filteredSocialNetwork);

  simulation.nodes(filteredParticipants).on("tick", ticked);

  simulation.force("link").links(filteredSocialNetwork);

  var cells = svg
    .selectAll()
    .data(simulation.nodes())
    .enter()
    .append("g")
    .attr("fill", function (d) {
      return color(d.group);
    })
    .attr("class", function (d) {
      return d.group;
    });

  function ticked() {
    var alpha = this.alpha();
    var nodes = this.nodes();

    var coords = {};
    var groups = [];

    var centroids = {};

    groupSimulation.nodes().forEach(function (d) {
      var cx = d.x;
      var cy = d.y;
      centroids[d.id] = { x: cx, y: cy };
    });

    var minDistance = 50;
    if (alpha < 0.2) {
      minDistance = 50 + 1000 * (0.1 - alpha);
    }

    node.each(function (d) {
      var cx = centroids[d.group].x;
      var cy = centroids[d.group].y;
      var x = d.x;
      var y = d.y;
      var dx = cx - x;
      var dy = cy - y;

      var r = Math.sqrt(dx * dx + dy * dy);

      if (r > minDistance) {
        d.x = x * 0.95 + cx * 0.05;
        d.y = y * 0.95 + cy * 0.05;
      }
    });

    link
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    node
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      });
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function renderCell(d) {
    return d == null ? null : "M" + d.join("L") + "Z";
  }
}
