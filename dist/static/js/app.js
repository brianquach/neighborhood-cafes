/** Restaurant Model stores and retrieves restaurant data from 3rd-Party API */
var restaurantModel = (function($) {
  'use strict'

  var headers = {
    "user-key": '3dcc424e9b2d38abdfd2d55ae0c36d06'
  };

  var restaurants;

  /** Fetch restaurant data */
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
    }).fail(function (jqXHR, textStatus) {
      d.reject(textStatus);
    });

    return d;
  }

  /** Fetch restaurant review data
   * @param {integer} restaurantId - Id of restaurant to retrieve reviews
   */
  function getRestaurantReviews(restaurantId) {
    var d = $.Deferred();

    var data = $.param({
      res_id: restaurantId,
    });
    var url = 'https://developers.zomato.com/api/v2.1/reviews';

    $.ajax({
      url: url,
      data: data,
      headers: headers
    }).done(function(data) {
      var reviews = data.user_reviews;
      d.resolve(reviews);
    }).fail(function (jqXHR, textStatus) {
      d.reject(textStatus);
    });

    return d;
  }

  /** Store restaurants to avoid duplicate API calls
   * @param {array} unsavedRestaurants - List of restaurants
   */
  function saveRestaurants(unsavedRestaurants) {
    restaurants = unsavedRestaurants;
  }

  return {
    getRestaurants: getRestaurants,
    saveRestaurants: saveRestaurants,
    getRestaurantReviews: getRestaurantReviews
  }
})(jQuery);

/** Map Model holds map data */
var mapModel = (function($) {
  'use strict'

  var markerCluster;
  var infoWindow;

  /** Returns marker cluster object */
  function getMarkerCluster() {
    return markerCluster;
  }

  /** Stores marker cluster object */
  function saveMarkerCluster(unsavedMarkerCluster) {
    markerCluster = unsavedMarkerCluster;
  }

  /** Returns a single instance of an InfoWindow */
  function getInfoWindow() {
    if (!infoWindow) {
      infoWindow = new google.maps.InfoWindow();
    }
    return infoWindow;
  }

  return {
    getMarkerCluster: getMarkerCluster,
    saveMarkerCluster: saveMarkerCluster,
    getInfoWindow: getInfoWindow
  }
})();

/** Map Controller applies logic to data */
var mapController = (function($) {
  'use strict'

  /** Animates map marker for a set amount of time
   * @param {object} marker - represents a google map marker
   * @param {number} timeout - represents milliseconds
   */
  function animateMarker(marker, timeout) {
    timeout = timeout || 1400;
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
      marker.setAnimation(null);
    }, timeout);
  }

  /** Populates an InfowWindow with information about a restaurant
   * @param {number} restaurantId - id of a restaurant
   * @param {object} infoWindow - google map infoWindow
   */
  function loadInfoWindowContent(restaurantId, infoWindow) {
    var $content = $(infoWindow.getContent());
    var $reviews = $content.find('.info-window__reviews');
    var contentString = '';

    $.when(restaurantModel.getRestaurantReviews(restaurantId)).then(
      function (reviews) {
        if (reviews.length) {
          var reviewString = '';
          var review = reviews[0].review;
          reviewString = '<strong>Score</strong>: ' +
            '<small style="color: #' + review.rating_color + ';">' + review.rating +
            '</small><br><strong>Date</strong>: ' + review.review_time_friendly +
            '<p>' + review.review_text + '</p>';
          $reviews.html(reviewString);
        } else {
          $reviews.replaceWith('<span>No Reviews</span>');
        }
        contentString = '<div class="info-window">' +
          $content.html() +
          '</div>';
        infoWindow.setContent(contentString);
      },
      function (resp) {
        $reviews.replaceWith('<p class="error-msg show">Restaurant review could not be loaded from Zomato API</p>');
        contentString = '<div class="info-window">' +
          $content.html() +
          '</div>';
        infoWindow.setContent(contentString);
      }
    );
  }

  /** Adds a google map marker onto the map
   * @param {number} lat - lattitude map coordinate
   * @param {number} lng - longitude map coordinate
   * @param {object} restaurant - restaurant object
   */
  function addMarker(lat, lng, restaurant) {
    var position = {
      lat: lat,
      lng: lng
    };
    var name = restaurant.name;
    var restaurantId = restaurant.id;
    var marker = new google.maps.Marker({
      position: position,
      title: name
    });

    marker.addListener('click', function() {
      var infoWindow = mapModel.getInfoWindow();
      var contentString = '<div class="info-window">' +
        '<h3>' + name + '</h3>' +
        '<label>Cost:</label> ' +
        '<small class="info-window__currency">' + restaurant.currency + '</small><br>' +
        '<label>Address:</label> ' +
        '<p>' + restaurant.location.address + '</p>' +
        '<label>Reviews:</label><br>' +
        '<div class="info-window__reviews">' +
        '<img src="static/images/load.svg" height="30" width="30" alt="loading">' +
        ' loading...</div><br>' +
        '<small>Powered by <a href="https://developers.zomato.com/">Zomato</a></small></div>';
      infoWindow.setContent(contentString);
      infoWindow.open(map, marker);

      loadInfoWindowContent(restaurantId, infoWindow);
      animateMarker(marker);
      map.setCenter(marker.getPosition());
      map.setZoom(16);
    });

    return marker;
  }

  return {
    addMarker: addMarker,
    animateMarker: animateMarker
  };
})(jQuery);

/** Cafe Module initializes application and holds the app ViewModel */
var cafeModule = (function ($) {
  'use strict'

  var cafeViewModel = new CafeViewModel();

  /** Represents the Cafe application ViewModel
   * @constructor
   */
  function CafeViewModel() {
    var self = this;
    self.restaurants = ko.observableArray();

    // Handles restaurants clicked from list view
    self.restaurantClick = function(restaurantObj) {
      if (self.isMobileListView()) {
        self.isMobileListView(false);
      }
      google.maps.event.trigger(restaurantObj.marker, 'click');
    };

    self.query = ko.observable();
    self.query.extend({ rateLimit: 200 }); // Imitate debouncing
    // Filters out restaurant from list view based on filter box input
    self.query.subscribe(function(q) {
      var name, i, len, restaurantObj, restaurant, marker;
      var re = new RegExp(q, 'gi');

      var markerCluster = mapModel.getMarkerCluster();
      if (!markerCluster) {
        return;
      }
      markerCluster.clearMarkers();

      for (i = 0, len = self.restaurants().length; i < len; i++) {
        restaurantObj = self.restaurants()[i];
        restaurant = restaurantObj.restaurant;
        marker = restaurantObj.marker;
        name = restaurantObj.restaurant.name;
        if (name.match(re)) {
          marker.setVisible(true);
          markerCluster.addMarker(marker);
          restaurant.show(true);
        } else {
          marker.setVisible(false);
          restaurant.show(false);
        }
      };
    });

    self.isMobileListView = ko.observable(false);
    self.mobileListView = function() {
      self.isMobileListView(true);
    };
    self.mobileMapView = function() {
      self.isMobileListView(false);
    };
    self.noCafeResults = ko.observable(false);
    self.noGoogleMaps = ko.observable(false);
  }

  /** Initiate application */
  function init() {
    ko.applyBindings(cafeViewModel);
  }

  /** Load default restaurants */
  function loadRestaurants() {
    $.when(restaurantModel.getRestaurants()).then(
      function(restaurants) {
        var restaurant, location, lat, lng, marker;
        var bounds = map.getBounds();
        var markers = [];

        // Parse restaurant data to create map markers and setup infoWindow
        // information
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
            marker = mapController.addMarker(
              lat, lng, restaurant);
            markers.push(marker);
            bounds.extend(marker.getPosition());
            restaurantObj.marker = marker;
            restaurant.show = ko.observable(true);
            cafeViewModel.restaurants.push(restaurantObj);
          }
        });

        var markerCluster = new MarkerClusterer(
          map,
          markers,
          {imagePath: './static/images/m'}
        );
        map.fitBounds(bounds);
        mapModel.saveMarkerCluster(markerCluster);
        restaurantModel.saveRestaurants(restaurants);
      },
      function(resp) {
        cafeViewModel.noCafeResults(true);
      }
    );
  }

  /** return ViewModel */
  function getViewModel() {
    return cafeViewModel;
  }

  return {
    init: init,
    loadRestaurants: loadRestaurants,
    getViewModel: getViewModel
  };
})(jQuery);

$(document).ready(function() {
  cafeModule.init();
});
