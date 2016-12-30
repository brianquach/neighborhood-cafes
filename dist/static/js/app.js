var restaurantModel = (function($) {
  'use strict'

  var headers = {
    "user-key": '3dcc424e9b2d38abdfd2d55ae0c36d06'
  };

  var restaurants;

  function getRestaurants() {
    var d = $.Deferred();

    if (restaurants) {
      return d.resolve(restaurants);
    }

    var data = $.param({
      lat: mapState.lat,
      lon: mapState.lng,
      q: 'cafe',
      count: 15,
      radius: 8050  // unit in meters; ~5 miles
    });
    var url = 'https://developers.zomato.com/api/v2.1/search';

    $.ajax({
      url: url,
      data: data,
      headers: headers
    }).done(function(data) {
      var restaurants = data.restaurants;
      d.resolve(restaurants);
    }).fail(function (jqXHR, textStatus, errorThrown) {
      // TODO: Handle failures
      // console.log(jqXHR, textStatus, errorThrown);
    });

    return d;
  }

  function saveRestaurants(unsavedRestaurants) {
    restaurants = unsavedRestaurants;
  }

  return {
    getRestaurants: getRestaurants,
    saveRestaurants: saveRestaurants
  }
})(jQuery);

var mapModel = (function() {
  'use strict'

  var markers = ko.observableArray();

  function getMarkers() {
    return markers;
  }

  function saveMarkers(unsavedMarkers) {
    markers = ko.observableArray(unsavedMarkers);
  }

  return {
    saveMarkers: saveMarkers
  }
})();

var mapController = (function($) {
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

var cafeModule = (function ($) {
  'use strict'

  var cafeViewModel = new CafeViewModel();
  function CafeViewModel() {
    this.restaurants = ko.observableArray();
  }

  function init() {
    $.when(restaurantModel.getRestaurants()).then(
      function (restaurants) {
        var location, lat, lng, marker;
        var markers = [];
        var bounds = map.getBounds();

        restaurants.forEach(function (o) {
          location = o.restaurant.location;
          lat = location.latitude;
          lng = location.longitude;
          if (typeof lat !== 'Number') {
            lat = Number(lat);
          }
          if (typeof lng !== 'Number') {
            lng = Number(lng);
          }
          if (lat !== 0 && lng !== 0) {
            marker = mapController.addMarker(lat, lng);
            markers.push(marker);
            bounds.extend(marker.getPosition());
          }
        });
        map.fitBounds(bounds);
        restaurantModel.saveRestaurants(restaurants);
        cafeViewModel.restaurants = ko.observableArray(restaurants);
        mapModel.saveMarkers(markers);

        ko.applyBindings(cafeViewModel);
      }
    );
  }

  return {
    init: init
  };
})(jQuery);

cafeModule.init();
