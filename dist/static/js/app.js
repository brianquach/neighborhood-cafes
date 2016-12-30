var zomatoModel = (function($) {
  'use strict'

  var headers = {
    "user-key": '3dcc424e9b2d38abdfd2d55ae0c36d06'
  };

  function getCafes() {
    var data = $.param({
      lat: mapState.lat,
      lon: mapState.lng,
      q: 'cafe',
      count: 15,
      radius: 8050  // unit in meters; ~5 miles
    });
    var url = 'https://developers.zomato.com/api/v2.1/search';

    return $.ajax({
      url: url,
      data: data,
      headers: headers
    });
  }

  return {
    getCafes: getCafes
  }
})(jQuery);

var zomatoController = (function ($) {
  'use strict'

  function init() {
    zomatoModel.getCafes()
      .done(function (data) {
        var location, lat, lng, marker;
        var bounds = map.getBounds();
        var restaurants = data.restaurants;

        restaurants.forEach(function (r) {
          location = r.restaurant.location;
          lat = location.latitude;
          lng = location.longitude;
          if (typeof lat !== 'Number') {
            lat = Number(lat);
          }
          if (typeof lng !== 'Number') {
            lng = Number(lng);
          }
          if (lat !== 0 && lng !== 0) {
            marker = mapAPIController.addMarker(lat, lng);
            bounds.extend(marker.getPosition());
          }
        });
        map.fitBounds(bounds);
      }).fail(function (jqXHR, textStatus, errorThrown) {
        // TODO: Handle failures
        // console.log(jqXHR, textStatus, errorThrown);
      });
  }

  return {
    init: init
  };
})(jQuery);

var mapAPIController = (function($) {
  'use strict'

  function addMarker(lat, lng) {
    var position = {
      lat: lat,
      lng: lng
    };
    var marker = new google.maps.Marker({
      position: position,
      map: map
    });
    return marker;
  }

  return {
    addMarker: addMarker
  };
})(jQuery);

zomatoController.init();
