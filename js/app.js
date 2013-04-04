if (typeof app === 'undefined' || !app) {
  var app = {};
}

// Merge url params with settings set by user
// URL params take preference
app.mergeMapSettings = function() {
  var mapParams = {},
      urlParams = decodeURIComponent(location.hash.substring(1)).trim().split('/');

  if(urlParams[1] && typeof Number(urlParams[1]) === "number") {
    mapParams = {
      zoom: urlParams[1],
      center: [urlParams[2], urlParams[3]]
    };
  }

  _.defaults(mapParams, app.opts.mapOptions);

  return mapParams;
};

app.getClass = function(value) {
  var colorClass = '';

  switch(true) {
    case (value <= - 1):
      colorClass = 'step-zero';
      break;
    case (value > - 1) && (value <= -0.5):
      colorClass = 'step-one';
      break;
    case (value > - 0.5) && (value < -0.1):
      colorClass = 'step-two';
      break;
    case (value >= - 0.1) && (value <= 0.1):
      colorClass = 'step-three';
      break;
    case (value > 0.1) && (value <= 0.5):
      colorClass = 'step-four';
      break;
    case (value > 0.5) && (value <= 1):
      colorClass = 'step-five';
      break;
    case (value > 1) && (value <= 2):
      colorClass = 'step-six';
      break;
    case (value > 2) && (value <= 4):
      colorClass = 'step-seven';
      break;
    case (value > 4) && (value <= 6):
      colorClass = 'step-eight';
      break;
    case (value > 6) && (value <= 8):
      colorClass = 'step-nine';
      break;
    case (value > 8) && (value <= 10):
      colorClass = 'step-ten';
      break;
    case (value > 10):
      colorClass = 'step-eleven';
      break;
  }

  return colorClass;
};

Number.prototype.formatMoney = function(){
  var c=0, d='.', t=',';
  var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10) + "", j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
//http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript

function toTitleCase(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Create the map
app.initMap = function(callback) {
  var mapSettings = app.mergeMapSettings();

  wax.tilejson(app.opts.tileURL,
  function(tilejson) {
    app.map = new L.Map(app.opts.mapContainer, mapSettings)
      .addLayer(new wax.leaf.connector(tilejson))
      .setView(mapSettings.center, mapSettings.zoom);

    wax.leaf.legend(app.map, tilejson).appendTo(app.map._container);

    wax.leaf.interaction()
      .map(app.map)
      .tilejson(tilejson)
      .on({
          on: function(o){
            if (app.map._zoom >= 16) {
              var template = _.template($('#tooltip-template').html());

              if ($('#tooltip').length) {
                  $('#tooltip').html(template(o.data)).show();
              } else {
                $('<div/>', {
                  'id': 'tooltip',
                  html: template(o.data)
                }).appendTo('#map').show();
              }

              var offset = $('#map').offset();

              //ipad fix
              $(document).click(function(e){
                var posX = e.pageX - offset.left - 170;
                    posY = e.pageY - offset.top - 200;

                $('#tooltip').css({ left: posX, top: posY });
              });

              $(document).mousemove(function(e){
                var posX = e.pageX - offset.left - 170;
                    posY = e.pageY - offset.top - 200;

                $('#tooltip').css({ left: posX, top: posY });
              });
            }
          },
          off: function(o) {
            $('#tooltip').hide();
            $(document).unbind('mousemove');
          }
        });

    app.setEvents();

    if(callback && typeof callback === 'function') { callback(); }
  });
};

// Listen for changes as user pans and zoom on the map
app.setEvents = function() {
  app.map
    .on('zoomend', function(e) {
      app.updateURL();
    })
    .on('dragend', function(e) {
      app.updateURL();
    });
};

// Gets the current map center and zoom and sets
// those values in the url
// i.e. #zoom=12&lat=39.976&lng=-75.172
app.updateURL = function() {
  var zoom = app.map.getZoom(),
      lat = app.map.getCenter().lat.toFixed(3),
      lng = app.map.getCenter().lng.toFixed(3),
      params = '/' + zoom + '/' + lat + '/' + lng;

  location.hash = params;
};
