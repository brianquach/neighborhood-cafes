var restaurantModel=function(e){"use strict";function t(){var t=e.Deferred();if(n)return t.resolve(n);var r=e.param({lat:mapState.lat,lon:mapState.lng,q:"cafe",count:15,radius:8050}),a="https://developers.zomato.com/api/v2.1/search";return e.ajax({url:a,data:r,headers:o}).done(function(e){var r=e.restaurants;t.resolve(r)}).fail(function(e,r){t.reject(r)}),t}function r(t){var r=e.Deferred(),a=e.param({res_id:t}),n="https://developers.zomato.com/api/v2.1/reviews";return e.ajax({url:n,data:a,headers:o}).done(function(e){var t=e.user_reviews;r.resolve(t)}).fail(function(e,t){r.reject(t)}),r}function a(e){n=e}var n,o={"user-key":"3dcc424e9b2d38abdfd2d55ae0c36d06"};return{getRestaurants:t,saveRestaurants:a,getRestaurantReviews:r}}(jQuery),mapModel=function(e){"use strict";function t(){return n}function r(e){n=e}function a(){return o||(o=new google.maps.InfoWindow),o}var n,o;return{getMarkerCluster:t,saveMarkerCluster:r,getInfoWindow:a}}(),mapController=function(e){"use strict";function t(e,t){t=t||1400,e.setAnimation(google.maps.Animation.BOUNCE),window.setTimeout(function(){e.setAnimation(null)},t)}function r(t,r){var a=e(r.getContent()),n=a.find(".info-window__reviews"),o="";e.when(restaurantModel.getRestaurantReviews(t)).then(function(e){if(e.length){var t="",i=e[0].review;t='<strong>Score</strong>: <small style="color: #'+i.rating_color+';">'+i.rating+"</small><br><strong>Date</strong>: "+i.review_time_friendly+"<p>"+i.review_text+"</p>",n.html(t)}else n.replaceWith("<span>No Reviews</span>");o='<div class="info-window">'+a.html()+"</div>",r.setContent(o)},function(e){n.replaceWith('<p class="error-msg show">Restaurant review could not be loaded from Zomato API</p>'),o='<div class="info-window">'+a.html()+"</div>",r.setContent(o)})}function a(e,a,n){var o={lat:e,lng:a},i=n.name,s=n.id,l=new google.maps.Marker({position:o,title:i});return l.addListener("click",function(){var e=mapModel.getInfoWindow(),a='<div class="info-window"><h3>'+i+'</h3><label>Cost:</label> <small class="info-window__currency">'+n.currency+"</small><br><label>Address:</label> <p>"+n.location.address+'</p><label>Reviews:</label><br><div class="info-window__reviews"><img src="static/images/load.svg" height="30" width="30" alt="loading"> loading...</div><br><small>Powered by <a href="https://developers.zomato.com/">Zomato</a></small></div>';e.setContent(a),e.open(map,l),r(s,e),t(l),map.setCenter(l.getPosition()),map.setZoom(16)}),l}return{addMarker:a,animateMarker:t}}(jQuery),cafeModule=function(e){"use strict";function t(){var e=this;e.restaurants=ko.observableArray(),e.restaurantClick=function(t){e.isMobileListView()&&e.isMobileListView(!1),google.maps.event.trigger(t.marker,"click")},e.query=ko.observable(),e.query.extend({rateLimit:200}),e.query.subscribe(function(t){var r,a,n,o,i,s,l=new RegExp(t,"gi"),u=mapModel.getMarkerCluster();if(u)for(u.clearMarkers(),a=0,n=e.restaurants().length;a<n;a++)o=e.restaurants()[a],i=o.restaurant,s=o.marker,r=o.restaurant.name,r.match(l)?(s.setVisible(!0),u.addMarker(s),i.show(!0)):(s.setVisible(!1),i.show(!1))}),e.isMobileListView=ko.observable(!1),e.mobileListView=function(){e.isMobileListView(!0)},e.mobileMapView=function(){e.isMobileListView(!1)},e.noCafeResults=ko.observable(!1),e.noGoogleMaps=ko.observable(!1)}function r(){ko.applyBindings(o)}function a(){e.when(restaurantModel.getRestaurants()).then(function(e){var t,r,a,n,i,s=map.getBounds(),l=[];e.forEach(function(e,u){t=e.restaurant,r=t.location,a=r.latitude,n=r.longitude,"Number"!=typeof a&&(a=Number(a)),"Number"!=typeof n&&(n=Number(n)),0!==a&&0!==n&&(i=mapController.addMarker(a,n,t),l.push(i),s.extend(i.getPosition()),e.marker=i,t.show=ko.observable(!0),o.restaurants.push(e))});var u=new MarkerClusterer(map,l,{imagePath:"./static/images/m"});map.fitBounds(s),mapModel.saveMarkerCluster(u),restaurantModel.saveRestaurants(e)},function(e){o.noCafeResults(!0)})}function n(){return o}var o=new t;return{init:r,loadRestaurants:a,getViewModel:n}}(jQuery);$(document).ready(function(){cafeModule.init()});