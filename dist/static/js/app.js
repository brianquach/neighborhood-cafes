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

var mapController = (function($) {
  'use strict'

  function animateMarker(marker, timeout) {
    timeout = timeout || 1400;
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      marker.setAnimation(null);
    }, timeout);
  }

  function addMarker(lat, lng, name) {
    var position = {
      lat: lat,
      lng: lng
    };
    var marker = new google.maps.Marker({
      position: position,
      map: map,
      title: name
    });

    marker.addListener('click', function() {
      animateMarker(marker);
      map.setZoom(15);
      map.panTo(marker.getPosition());
    });

    return marker;
  }

  return {
    addMarker: addMarker,
    animateMarker: animateMarker
  };
})(jQuery);

var cafeModule = (function ($) {
  'use strict'

  var cafeViewModel = new CafeViewModel();
  function CafeViewModel() {
    var self = this;
    self.restaurants = ko.observableArray();
    self.restaurantClick = function(restaurantObj) {
      google.maps.event.trigger(restaurantObj.marker, 'click');
    };
    self.query = ko.observable();
    self.query.extend({ rateLimit: 200 }); // Imitate debouncing
    self.query.subscribe(function(q) {
      var name, i, len, restaurantObj, restaurant;
      var re = new RegExp(q, 'gi');
      for (i = 0, len = self.restaurants().length; i < len; i++) {
        restaurantObj = self.restaurants()[i];
        restaurant = restaurantObj.restaurant;
        name = restaurantObj.restaurant.name;
        if (name.match(re)) {
          restaurant.show(true);
        } else {
          restaurant.show(false);
        }
      };
    });
  }

  function init() {
    $.when(restaurantModel.getRestaurants()).then(
      function (restaurants) {
        var restaurant, location, lat, lng, marker;
        var bounds = map.getBounds();

        restaurants.forEach(function (restaurantObj, idx) {
          restaurant = restaurantObj.restaurant;
          location = restaurant.location;
          lat = location.latitude;
          lng = location.longitude;
          if (typeof lat !== 'Number') {
            lat = Number(lat);
          }
          if (typeof lng !== 'Number') {
            lng = Number(lng);
          }
          if (lat !== 0 && lng !== 0) {
            marker = mapController.addMarker(lat, lng, restaurant.name);
            bounds.extend(marker.getPosition());
            restaurantObj.marker = marker;
            restaurant.show = ko.observable(true);
            cafeViewModel.restaurants.push(restaurantObj);
          }
        });

        map.fitBounds(bounds);
        restaurantModel.saveRestaurants(restaurants);

        ko.applyBindings(cafeViewModel);
      }
    );
  }

  return {
    init: init
  };
})(jQuery);

cafeModule.init();
