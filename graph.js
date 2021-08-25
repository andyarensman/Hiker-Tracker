// const d3 = require("d3");



//Prepare the Data for D3.js



      // number: +row[0],
      // name: row[1],
      // date: row[2],
      // mileage: +row[3],
      // time: row[4],
      // elevation_gain: +(row[5].replace(/,/g, '')),
      // min_elevation: +(row[6].replace(/,/g, '')),
      // max_elevation: +(row[7].replace(/,/g, '')),
      // average_pace: row[8],
      // average_bpm: +row[9],
      // max_bpm: +row[10],
      // city: row[11],
      // location: row[12],
      // notes: row[13]



//Render the D3.js chart

const d3ScatterPlot = (data) => {
  //removing entries with no data
  var hikeData = [];

  for (var i = 0; i < data.length && data[i].mileage; i++) {
    hikeData.push(data[i])
  }

  console.log(hikeData[1])

  //Variables
  const width = 900,
        height = 600,
        margin = { top: 100, right: 220, bottom: 90, left: 120 },
        circleRadius = 6.5,
        selectedCircleRadius = 10,
        xAxisLabelOffset = 50,
        yAxisLabelOffset = 45,
        legendMargin = 35,
        legendDescriptionOffset = 48,
        moreInfoOffset = 200,
        titleOffset = 60,
        descriptionOffset = 28,
        footerMargin = 8;

  const title = '52 Hike Challenge 2021';
  const description = 'Scatter plot comparing distance vs. elevation';
  const xAxisLabel = 'Distance (mi)';
  const yAxisLabel = 'Elevevation Gain (ft)';
  const legendLabel = 'Locations';
  const signature = 'created by Andy Arensman with D3.js'

  const dataColors = {
    'top': '#708259',
    'second': '#8E6C8A',
    'third': '#9A3E25',
    'fourth': '#E6842A',
    'fifth': '#E3BA22',
    'other': '#137B80'
  };

  const svg = d3
    .select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .attr('id', 'tooltip');

  const legendTooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'legend-tooltip');


  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;


  //border & background of svg
  svg
    .append('rect')
    .attr('class','border')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#F8F8F8')
    .attr('stroke', '#C0C0BB')

  //background of graph
  svg
    .append('rect')
    .attr('class','inner-background')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', '#EFECEA');

  //Data Variables
  var mileageData = [];
  for (var i = 0; i < hikeData.length; i++) {
    if (hikeData[i].mileage) {
      mileageData.push(hikeData[i].mileage)
    }
  }

  var mileageMin = d3.min(mileageData)
  var mileageMax = d3.max(mileageData)
  const mileDomainTop = Math.floor(mileageMax) + 1

  var elevationData = [];
  for (var i = 0; i < hikeData.length; i++) {
    if (hikeData[i].elevation_gain) {
      elevationData.push(hikeData[i].elevation_gain)
    }
  }

  var elevationMin = d3.min(elevationData);
  var elevationMax = d3.max(elevationData);

  const elDomainTop = () => {
    return Math.ceil(elevationMax/400) * 400
  };

  var yTickNumber = elDomainTop() + 1;

  const colorValue = d => d.location;

  //Getting the most visited hike locations

  var locationsObj = hikeData.reduce(function(obj, v) {
    obj[v.location] = (obj[v.location] || 0) + 1;
    return obj;
  }, {})

  var sortedHikes = [];
  for (var hike in locationsObj) {
    sortedHikes.push([hike, locationsObj[hike]]);
  }
  sortedHikes.sort(function(a, b) {
    return b[1] - a[1];
  });

    //console.log(sortedHikes)
    //If you want more/less colors (max 6 including 'other' at this size), add locations below, increase slice in otherLocations(), and get new hex code in dataColors Object. Then update the colorLegendData array and the switch statement in the svg element that makes the circles

  var topLocation = sortedHikes[0];
  var secLocation = sortedHikes[1];
  var thirdLocation = sortedHikes[2];
  var fourthLocation = sortedHikes[3];
  var fifthLocation = sortedHikes[4];
  var otherLocationNames = sortedHikes.slice(5);

  var otherLocations = () => {
    var locations = sortedHikes.slice(4);
    var count = 0
    for (var i = 0; i < locations.length; i++) {
      count+= locations[i][1]
    }
    return ['Other', count]
  };

  var colorLegendData = [topLocation, secLocation, thirdLocation, fourthLocation, fifthLocation, otherLocations()]
    //console.log(colorLegendData)

  //scales

  const xScale = d3
    .scaleLinear()
    .domain([1, mileDomainTop])
    .range([margin.left, innerWidth + margin.left])

  const yScale = d3
    .scaleLinear()
    .domain([elDomainTop(), 0])
    .range([margin.top, innerHeight + margin.top])


  //rendering the Axes

  const xAxis = d3.axisBottom(xScale).tickSize(-innerHeight).tickPadding(8);
  const yAxis = d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(8).tickValues(d3.range(0, yTickNumber, 400));

  svg.append('g')
      .attr('transform', 'translate(0, ' + (innerHeight + margin.top) + ')')
      .call(xAxis)
      .attr('id', 'x-axis')

  svg.append('g')
       .attr('transform', 'translate(' + margin.left + ', 0)')
       .call(yAxis)
       .attr('id', 'y-axis')


  //axes labels

  const yAxisG = svg.append('g')
  yAxisG.selectAll('.domain').remove();

  yAxisG.append('text')
      .attr('class', 'axis-label')
      .attr('y', margin.left - 70)
      .attr('x', (-innerHeight/2 - margin.top))
      .attr('transform', `rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text(yAxisLabel);

  const xAxisG = svg.append('g')

  xAxisG.select('.domain').remove();

  xAxisG.append('text')
      .attr('class', 'axis-label')
      .attr('y', innerHeight + margin.top + 55)
      .attr('x', ((innerWidth / 2) + margin.left))
      .attr('text-anchor', 'middle')
      .text(xAxisLabel);

  //rendering circles
  svg.selectAll('circle')
    .data(hikeData)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(d.mileage))
    .attr('cy', d => yScale(d.elevation_gain))
    .attr('r', circleRadius)
    .attr('fill', d => {
      var color;
      switch (d.location) {
        case topLocation[0]:
          color = dataColors.top;
          break;
        case secLocation[0]:
          color = dataColors.second;
          break;
        case thirdLocation[0]:
          color = dataColors.third;
          break;
        case fourthLocation[0]:
          color = dataColors.fourth;
          break;
        case fifthLocation[0]:
          color = dataColors.fifth;
          break;
        default:
          color = dataColors.other;
      }
      return color;
  })
  //rendering tooltip
    .on('mouseover', function(d, i) {
      d3.select(this)
        .transition()
        .duration(1)
        .attr('r', selectedCircleRadius)
      tooltip
        .html('<b>Hike No. ' + hikeData[i].number + '</b><br/>' +
              hikeData[i].name + '<br/>' +
              hikeData[i].location + '<br/><hr>' +
              hikeData[i].mileage + " mi & " + hikeData[i].elevation_gain + ' ft gain<br/>' +
              hikeData[i].time + ' duration<br/>' +
              hikeData[i].date)
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px')
        .style('opacity', 1);
      })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(1)
        .attr('r', circleRadius)
      tooltip.style('opacity', 0);
        });


  //rendering title

  svg.append('text')
      .attr('class', 'title')
      .attr('y', titleOffset)
      .attr('x', ((innerWidth / 2) + margin.left))
      .attr('text-anchor', 'middle')
      .style('cursor', 'help')
      .text(title)
      .on('click', function() { window.open('https://www.52hikechallenge.com/'); })

  //rendering description

  svg.append('text')
      .attr('class', 'description')
      .attr('y', titleOffset + descriptionOffset)
      .attr('x', ((innerWidth / 2) + margin.left))
      .attr('text-anchor', 'middle')
      .text(description);

  //render footer

  svg.append('text')
      .attr('class', 'footer')
      .attr('y', height - footerMargin)
      .attr('x', footerMargin)
      .attr('text-anchor', 'left')
      .text('*Graph is automatically updated when new hikes are added to the ')
      .append('tspan')
      .attr('text-decoration',"underline")
      .style('fill', '#137B80')
      .style('cursor', 'default')
      .text('Google Spreadsheet')
      .on('click', function() { window.open(googleSpreadSheetURL); })

  svg.append('text')
      .attr('class', 'footer')
      .attr('y', height - footerMargin)
      .attr('x', width - footerMargin)
      .attr('text-anchor', 'end')
      .text(signature)


  //rendering legend

  const colorLegend = svg
    .append('g')
    .attr('class', 'color-legend')
    .attr('transform', 'translate(' + (innerWidth + margin.left + legendMargin) + ','+ (margin.top + 1) + ')');

  colorLegend.selectAll('circle')
    .data(colorLegendData)
    .enter()
    .append('circle')
    .attr('cx', 0)
    .attr('cy', (d, i) => i*25 + legendDescriptionOffset)
    .attr('r', circleRadius)
    .attr('fill', (d, i) => Object.values(dataColors)[i])

  colorLegend.selectAll('text')
    .data(colorLegendData)
    .enter()
    .append('text')
    .attr('class', 'legend-text')
    .attr('x', 12)
    .attr('y', (d, i) => i*25 + circleRadius/2 + legendDescriptionOffset)
    .text((d, i) => {
      var legendWords;
      if (colorLegendData[i][0].length > 22) {
        legendWords = colorLegendData[i][0].slice(0, 21)
        legendWords += '…'
      } else {
        legendWords = colorLegendData[i][0]
      }
      return legendWords + ' (' + colorLegendData[i][1] +')'
    })
    //rendering tooltip for legend
    .on('mouseover', function(d, i) {
      legendTooltip
        .html(function() {
             if (colorLegendData[i][0] === 'Other') {
               var otherInfo = "";
              for (var j = 0; j < otherLocationNames.length; j++) {
                otherInfo += otherLocationNames[j][0] + ' (' + otherLocationNames[j][1] +')<br/>'
              }
               return otherInfo
            } else {
              return colorLegendData[i][0] + ' (' + colorLegendData[i][1] +')'
            }
          })
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px')
        .style('opacity', 1)
      })
    .on('mouseout', function() {
      legendTooltip.style('opacity', 0);
        });

  //console.log(otherLocationNames)

  colorLegend.append('text')
    .attr('class', 'legend-title')
    .attr('dominant-baseline', 'hanging')
    .attr('x', -circleRadius)
    .attr('y', 0)
    .text(legendLabel);


  //more info data
  var getTime = () => {
    var durationsArray = hikeData.map(d => d.time);

    var timeArray = []
    durationsArray.forEach(element => timeArray.push(element.split(':')))

    var hours = 0;
    for (var i = 0; i < timeArray.length; i++) {
      hours += parseInt(timeArray[i][0]);
    }

    var minutes = 0;
    for (var i = 0; i < timeArray.length; i++) {
      minutes += parseInt(timeArray[i][1]);
    }

    var seconds = 0;
    for (var i = 0; i < timeArray.length; i++) {
      seconds += parseInt(timeArray[i][2]);
    }

    while (minutes >= 60 || seconds >= 60) {
      hours = Math.floor(hours + (minutes/60));
      minutes = Math.floor(minutes%60 + seconds/60);
      seconds = seconds%60;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    return hours + ':' + minutes + ':' + seconds;
  };
  var totalTime = getTime();

  var getAverageTime = () => {
    var timeArray = []
    timeArray.push(totalTime.split(':'))

    var totalSeconds = Math.round((parseInt(timeArray[0][2]) + (parseInt(timeArray[0][1]) * 60) + (parseInt(timeArray[0][0]) * 60 * 60))/hikeData.length)

    hours = Math.floor(totalSeconds/(60*60))
    minutes = Math.floor((totalSeconds - (hours*60*60))/60);
    seconds = totalSeconds - (hours*60*60) - (minutes*60);

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    return hours + ':' + minutes + ':' + seconds;
  };
  var averageTime = getAverageTime();

  var averageMileage = (hikeData.map(d => d.mileage).reduce((a, b) => a + b, 0).toFixed(2)/hikeData.length).toFixed(2);
  var totalMileage = hikeData.map(d => d.mileage).reduce((a, b) => a + b, 0).toFixed(2);
  var averageGain =  d3.format(',.6d')(hikeData.map(d => d.elevation_gain).reduce((a, b) => a + b, 0)/hikeData.length)
  var totalGain = d3.format(',.6d')(hikeData.map(d => d.elevation_gain).reduce((a, b) => a + b, 0));
  var hikeNumber = hikeData.length;
  var lastHikeDate = hikeData[hikeData.length - 1].date

  var moreInfoArray = [[['As of '], [lastHikeDate + ', ' + hikeNumber + ' hikes']],
                       [['Average Distance: '], [averageMileage + " mi"]],
                       [['Total Distance: '], [totalMileage + ' mi']],
                       [['Average Gain: '], [averageGain + ' ft']],
                       [['Total Gain: '], [totalGain + ' ft']],
                       [['Average Time: '], [averageTime]],
                       [['Total Time: '], [totalTime]],
                       //[], //uncomment if you want a gap line here
                       [[], [], ['Hover over points for more info...']]]

  //more info render

  const moreInfo = svg
    .append('g')
    .attr('class', 'color-legend')
    .attr('transform', 'translate(' + (innerWidth + margin.left + legendMargin - circleRadius) + ','+ (margin.top + innerHeight - moreInfoOffset) + ')');

  moreInfo.selectAll('text')
    .data(moreInfoArray)
    .enter()
    .append('text')
    .attr('class', 'legend-text')
    .attr('x', 0)
    .attr('y', (d, i) => i*21 + circleRadius/2 + legendDescriptionOffset)
    .attr('font-weight', 300)
    .text(d => d[0])
    .append("tspan")
    .attr('font-weight', 600)
    .text(d => d[1])
    .append('tspan')
    .attr('font-weight', 300)
    //.attr('font-size', 11)
    .attr('font-style', 'italic')
    .text(d => d[2]);

  moreInfo.append('text')
    .attr('class', 'legend-title')
    .attr('dominant-baseline', 'hanging')
    .attr('x', 0)
    .attr('y', 0)
    .text('Statistics');


}

module.exports = { d3ScatterPlot };
