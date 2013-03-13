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

Number.prototype.formatMoney = function(){
  var c=0, d='.', t=',';
  var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10) + "", j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
//http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript

function toTitleCase(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function appendPropertyData(addr) {
  var url = '/opa-api-wrapper.php/address/' + addr;
  var data = $.ajax(url, {
    // dataType: 'jsonp',
    // jsonpCallback: 'json_callback',
    success: function (res) {
      res = jQuery.parseJSON(res);
      // the property listing from api.phillyaddress is loaded with information.
      // At this point i'm only interested in assessed value per square foot, 
      // but there's loads more data here that could be included in the listing. 
      var property = res.property.account_details;
      var tax = res.property.valuation_details;
      var land_sqft = parseFloat(property.land_area.replace(' SqFt', ''));
      var bldg_sqft = parseFloat(property.improvement_area.replace(' SqFt', ''));
      var land_ass_2013 = parseInt(tax[2013].assessed_land_exempt.replace(/[$,]/gi, '')) + parseInt(tax[2013].assessed_land_taxable.replace(/[$,]/gi, ''));
      var land_ass_2014 = parseInt(tax[2014].assessed_land_exempt.replace(/[$,]/gi, '')) + parseInt(tax[2014].assessed_land_taxable.replace(/[$,]/gi, ''));
      var bldg_ass_2013 = parseInt(tax[2013].assessed_improvement_exempt.replace(/[$,]/gi, '')) + parseInt(tax[2013].assessed_improvement_taxable.replace(/[$,]/gi, ''));
      var bldg_ass_2014 = parseInt(tax[2014].assessed_improvement_exempt.replace(/[$,]/gi, '')) + parseInt(tax[2014].assessed_improvement_taxable.replace(/[$,]/gi, ''));
      
      var land_sqft_2013 = Math.floor(land_ass_2013 / land_sqft);
      var land_sqft_2014 = Math.floor(land_ass_2014 / land_sqft);
      var bldg_sqft_2013 = Math.floor(bldg_ass_2013 / bldg_sqft);
      var bldg_sqft_2014 = Math.floor(bldg_ass_2014 / bldg_sqft);
      var land_delta = 0;
      var bldg_delta = 0;

      land_delta = Math.floor((land_sqft_2014 / land_sqft_2013) * 100);
      if (land_sqft_2013 > land_sqft_2014) {
        land_delta = -(100 - land_delta);
      }

      bldg_delta = Math.floor((bldg_sqft_2014 / bldg_sqft_2013) * 100);
      if (bldg_sqft_2013 > bldg_sqft_2014) {
        bldg_delta = -(100 - bldg_delta);
      }
      $('#tooltip #opa-data-container').html(
          '<strong>OPA Data</strong>' +
            '<br>improvement area: ' + property.improvement_area +
            '<br>land area: ' + property.land_area + 
            '<br>2013 improvement value / sqft: $' + bldg_sqft_2013 +
            '<br>2014 improvement value / sqft: $' + bldg_sqft_2014 +
            '<br>% change: ' + bldg_delta + '%' + 
            '<br>2013 land value / sqft: $' + land_sqft_2013 +
            '<br>2014 land value / sqft: $' + land_sqft_2014 +
            '<br>% change: ' + land_delta + '%'
          );
    }
  });
  $('#tooltip').append('<br><span id="opa-data-container">acquiring OPA data...</span>');
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
              var contents =  "<strong>" + o.data.address + "</strong><br/>" +
                              "Approved for Homestead Exemption: " + toTitleCase(o.data.homestd_ex) + "<br>" +
                              "2013 Market Value: $" + Number(o.data.mktval_13).formatMoney() + "<br>" +
                              "2013 Tax: $" + Number(o.data.tx_2013).formatMoney() + "<br>" +
                              "2014 Market Value: $" + Number(o.data.mktval_14).formatMoney() + "<br>" +
                              "2014 Tax: $" + Number(o.data.tx_2014).formatMoney() + "<br>" +
                              "Change in Tax: " + Number(o.data.tax_change * 100).toFixed(0)  + '% ' + // Append property data on a time callback, so that we're not hammering the data api server:
                              '<script type="text/javascript">clearTimeout(app.myInterval); app.myInterval = setTimeout(function() { appendPropertyData("' + o.data.address + '") }, 1000); </script>';


              if ($('#tooltip').length) {
                window.clearTimeout(mapSettings.myTimeout);
                  $('#tooltip').html(contents).show();
              } else {
                $('<div/>', {
                  'id': 'tooltip',
                  html: contents
                }).appendTo('#map').show();
              }

              var offset = $('#map').offset();

              $(document).mousemove(function(e){
                var posX = e.pageX - offset.left - 130;
                    posY = e.pageY - offset.top - 300;

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
