import { drawLineChart } from "./line.js";
import { drawParallelCoordinatePlot } from "./parallelCoordinatePlot.js";

var participantsData;
document.addEventListener("DOMContentLoaded", function () {
  wrangleData();
});

function setParticipantsData(response) {
  participantsData = response;
}

async function wrangleData() {
  $.ajax({
    url: "/processDataParticipants",
    type: "POST",
    contentType: "application/json",
    success: function (response) {
      setParticipantsData(JSON.parse(response));
      drawLineChart(participantsData)
      // drawParallelCoordinatePlot(participantsData);
      // drawRadialBubbleChart(participantsData);
    },
    error: function (error) {
      console.log(error);
    },
  });
}
