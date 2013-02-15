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
              var contents =  "<strong>" + o.data.address + "</strong><br> Current Assessment: " + o.data.old_mv;
              
              if ($('#tooltip').length) {
                  $('#tooltip').html(contents).show();
              } else {
                $('<div/>', {
                  'id': 'tooltip',
                  html: contents
                }).appendTo('#map').show();
              }

              var offset = $('#map').offset();

              $(document).mousemove(function(e){
                var posX = e.pageX - offset.left - 100;
                    posY = e.pageY - offset.top - 70;

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