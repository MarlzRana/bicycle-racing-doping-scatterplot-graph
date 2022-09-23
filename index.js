const mouseoverTooltipPlotStrokeColor = "#DCE5E5";

const fetchData = async (url) => {
  const response = await fetch(url);
  const responseJSON = await response.json();
  return responseJSON;
};

const formatDataset = (dataset) => {
  return dataset.map((data) => ({
    ...data,
    Time: new Date(
      1970,
      0,
      1,
      0,
      data.Time.split(":")[0],
      data.Time.split(":")[1]
    ),
  }));
};

const ensureAtLeastTwoDigits = (string) => {
  if (string.length === 0) {
    return "00";
  }
  if (string.length === 1) {
    return "0" + string;
  }
  return string;
};

document.addEventListener("DOMContentLoaded", async () => {
  //Fetch the data
  const unformattedDataset = await fetchData(
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json"
  );
  const dataset = formatDataset(unformattedDataset);
  //Getting svg, its margins and setting up its dimensions
  const svg = d3.select("#svg-graph");
  const margin = { top: 10, right: 15, bottom: 20, left: 35 };
  const outerWidth = svg.node().getBoundingClientRect().width;
  const outerHeight = svg.node().getBoundingClientRect().height;
  const innerWidth = outerWidth - margin.left - margin.left;
  const innerHeight = outerWidth - margin.top - margin.bottom;
  //Create xScale and yScale
  const xScale = d3
    .scaleLinear()
    .domain([
      d3.min(dataset, (d) => d.Year - 1),
      d3.max(dataset, (d) => d.Year + 1),
    ])
    .range([margin.left, outerWidth - margin.right]);

  const yScale = d3
    .scaleTime()
    .domain([d3.max(dataset, (d) => d.Time), d3.min(dataset, (d) => d.Time)])
    .range([outerHeight - margin.bottom, margin.top]);

  //Create xAxis and yAxis
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale).tickFormat(d3.timeFormat("%M:%S"));
  //Plot xAxis and yAxis
  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(${0},${outerHeight - margin.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${margin.left},${0})`)
    .call(yAxis);

  //Plotting the actual data
  const plots = svg
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("r", 6)
    .attr("cx", (d, i) => xScale(d.Year))
    .attr("cy", (d, i) => yScale(d.Time))
    .attr("class", (d, i) => {
      if (d.Doping) {
        return "dot doping";
      }
      return "dot not-doping";
    })
    .attr("data-xvalue", (d, i) => d.Year)
    .attr("data-yvalue", (d, i) => d.Time);
  //Adding the legend
  const labelInfo = [
    {
      correspondingCssColorClass: "doping",
      tag: "Riders with doping allegations",
    },
    {
      correspondingCssColorClass: "not-doping",
      tag: "Riders without doping allegations",
    },
  ];

  const marginX = 8;
  const marginY = 10;
  const legend = svg.append("g").attr("id", "legend");

  const subLegends = legend
    .selectAll(".sub-legend")
    .data(labelInfo)
    .enter()
    .append("g")
    .attr("class", "sub-legend")
    .attr("transform", (d, i) => `translate(${0}, ${i * 20})`);

  subLegends
    .append("text")
    .text((d) => d.tag)
    .attr("transform", (d, i) => `translate(${marginX + 15}, ${marginY + 5})`);

  subLegends
    .append("circle")
    .attr("r", 7)
    .attr("class", (d) => {
      if (d.tag == "Riders with doping allegations") {
        return "doping";
      }
      if (d.tag == "Riders without doping allegations") {
        return "not-doping";
      }
    })
    .attr("transform", (d, i) => `translate(${marginX}, ${marginY})`);
  legend.attr(
    "transform",
    `translate(${
      outerWidth - margin.right - legend.node().getBoundingClientRect().width
    },${margin.top})`
  );
  legend
    .insert("rect", ":first-child")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", legend.node().getBoundingClientRect().width + marginX)
    .attr("height", legend.node().getBoundingClientRect().height + marginY);

  //Creating our tooltip
  const tooltip = d3
    .select(".graph-container")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  //Creating our tooltip functions
  const mouseoverTooltip = (e) => {
    tooltip.transition().duration(150).style("opacity", 0.95);
    d3.select(e.srcElement).style("stroke", mouseoverTooltipPlotStrokeColor);
  };
  const mouseleaveTooltip = (e) => {
    tooltip.transition().duration(150).style("opacity", 0);
    d3.select(e.srcElement).style("stroke", "black");
  };

  const mousemoveTooltip = (e) => {
    const data = d3.select(e.srcElement).data()[0];
    tooltip.attr("data-year", data.Year);
    tooltip.selectAll("p").remove();

    tooltip.append("p").text(`${data.Name}: ${data.Nationality}`);
    tooltip
      .append("p")
      .text(
        `Year: ${data.Year}, Time: ${ensureAtLeastTwoDigits(
          data.Time.getMinutes()
        )}:${ensureAtLeastTwoDigits(data.Time.getSeconds())}`
      );
    if (data.Doping) {
      tooltip.append("p").text(`${data.Doping}`);
    }
    tooltip
      .style("left", e.pageX + 15 + "px")
      .style("top", e.pageY - 30 + "px");
  };
  //Attaching out tooltip functions to each plpt
  plots
    .on("mouseover", mouseoverTooltip)
    .on("mouseleave", mouseleaveTooltip)
    .on("mousemove", mousemoveTooltip);
});
