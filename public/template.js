const json2csv = require('json2csv').parse;

exports.get = function(req, res) {

    var csv = json2csv({
      hike_name: '',
      hike_date: 'YYYY-MM-DD',
      mileage: '0.00',
      time: '00:00:00',
      elevation_gain: '0',
      min_elevation: '0',
      max_elevation: '0',
      average_pace: '00:00',
      average_bpm: '0',
      max_bpm: '0',
      city: '',
      location: '',
      notes: ''
    });

    res.set("Content-Disposition", "attachment;filename=hikes_template.csv");
    res.set("Content-Type", "application/octet-stream");

    res.send(csv);

};
