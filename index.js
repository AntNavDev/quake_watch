function isInputPopulated(input_name)
{
    if($(input_name).val().length)
    {
        return true;
    }
    return false;
}

// Initialize Map
var map;
function initMap()
{
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 38.5816, lng: -121.4944},
        zoom: 6
    });
}

function getZoomLevel(radius)
{
    if(radius <= 100)
    {
        return 8;
    }
    else if(radius <= 500)
    {
        return 6;
    }
    else if(radius <= 1000)
    {
        return 5;
    }
    else
    {
        return 4;
    }
}

$(document).ready(function(){
    var regionIndicator;
    var markerCluster;

    $("#pac_input").val("");

    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -33.8688, lng: 151.2195},
        zoom: 13
    });


    var card = document.getElementById('pac_card');
    var input = document.getElementById('pac_input');
    var types = document.getElementById('type_selector');

    var autocomplete = new google.maps.places.Autocomplete(input);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow_content');
    infowindow.setContent(infowindowContent);

    autocomplete.addListener('place_changed', function(){
        var place = autocomplete.getPlace();
        var found_lng = place.geometry.location.lng().toFixed(3);
        var found_lat = place.geometry.location.lat().toFixed(3);

        if(!place.geometry){
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }
        
        var address = '';
        if (place.address_components) {
            address = [
             (place.address_components[0] && place.address_components[0].short_name || ''),
             (place.address_components[1] && place.address_components[1].short_name || ''),
             (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        infowindowContent.children['place_name'].textContent = place.name;
        infowindowContent.children['place_address'].textContent = address;
        infowindowContent.children['place_lng'].textContent = found_lng;
        infowindowContent.children['place_lat'].textContent = found_lat;

        if(window.confirm("Would you like to populate the quake coordinates with the lookup values?")){
            $("#latitude_input").val(found_lat);
            $("#longitude_input").val(found_lng);
        }
    });


    $('#get_quake_results_button').attr('disabled', true);
    if(isInputPopulated('#latitude_input') && isInputPopulated('#longitude_input') && isInputPopulated('#radius_input'))
    {
        $('#get_quake_results_button').attr('disabled', false);
    }

    $('input[class="location_data"]').keyup(function(){
        if(isInputPopulated('#latitude_input') && isInputPopulated('#longitude_input') && isInputPopulated('#radius_input'))
        {
            $('#get_quake_results_button').attr('disabled', false);
        }
        else
        {
            $('#get_quake_results_button').attr('disabled', true);
        }
    });

    $('#get_quake_results_button').on('click', function(event){
        event.preventDefault();
        var my_longitude = $('#longitude_input').val();
        var my_latitude = $('#latitude_input').val();
        var my_radius = $('#radius_input').val();
        var quake_locations = Array();
        var labels = Array();
        var my_url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2018-02-13&endtime=2018-02-14&latitude=' + my_latitude + '&longitude=' + my_longitude + '&maxradiuskm=' + my_radius;
        if(regionIndicator)
        {
            regionIndicator.setMap(null);
        }
        regionIndicator = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: map,
            center: {lat: parseFloat(my_latitude), lng: parseFloat(my_longitude)},
            radius: parseFloat(my_radius) * 1000
        });
        $.ajax({
            method: "GET",
            url: my_url,
            success: function(data){
                console.log('done!');
                map.setCenter({lat: parseFloat(my_latitude), lng: parseFloat(my_longitude)});
                map.setZoom(getZoomLevel(parseFloat(my_radius)));
                var quakes = data.features;
                if(quakes.length)
                {
                    $.each(quakes, function(index, value){
                        // console.log(value);
                        var was_alerted = false;
                        var was_felt = 0;
                        var date_obj = new Date(value.properties.time);
                        quake_locations.push({
                            lat: value.geometry.coordinates[1],
                            lng: value.geometry.coordinates[0]
                            // depth: value.geometry.coordinates[2]
                        });
                        labels.push(value.properties.place);
                        date_obj.setUTCSeconds(0);
                        if(index == 0)
                        {
                            var classes = '';
                            if(value.properties.felt)
                            {
                                classes += ' felt';
                                was_felt = value.properties.felt;
                            }
                            if(value.properties.alert)
                            {
                                classes += ' alerted';
                                was_alerted = true;
                            }
                            if(was_alerted)
                            {
                                $('#content').html('<div class="quake_data' + classes + '" style="color: ' + value.properties.alert + '"><p>' + value.properties.title + '</p><p>Location: ' + value.properties.place + '</p><p>Time: ' + date_obj + '</p><p>Type: ' + value.properties.type + '</p><p>Number of reports to DYFI: ' + was_felt + '</p></div>');
                            }
                            else
                            {
                                $('#content').html('<div class="quake_data' + classes + '"><p>' + value.properties.title + '</p><p>Location: ' + value.properties.place + '</p><p>Time: ' + date_obj + '</p><p>Type: ' + value.properties.type + '</p><p>Number of reports to DYFI: ' + was_felt + '</p></div>');
                            }
                        }
                        else
                        {
                            var classes = '';
                            if(value.properties.felt)
                            {
                                classes += ' felt';
                                was_felt = value.properties.felt;
                            }
                            if(value.properties.alert)
                            {
                                classes += ' alerted';
                                was_alerted = true;
                            }
                            if(was_alerted)
                            {
                                $('#content').append('<div class="quake_data' + classes + '" style="color: ' + value.properties.alert + '"><p>' + value.properties.title + '</p><p>Location: ' + value.properties.place + '</p><p>Time: ' + date_obj + '</p><p>Type: ' + value.properties.type + '</p><p>Number of reports to DYFI: ' + was_felt + '</p></div>');                                
                            }
                            else
                            {
                                $('#content').append('<div class="quake_data' + classes + '"><p>' + value.properties.title + '</p><p>Location: ' + value.properties.place + '</p><p>Time: ' + date_obj + '</p><p>Type: ' + value.properties.type + '</p><p>Number of reports to DYFI: ' + was_felt + '</p></div>');
                            }
                        }
                    });
                }
                else
                {
                    $('#content').html('<div class="no_results"><p>There doesn\'t seem to be any earthquake data.</p><p>If you know that this result is incorrect, please check your inputs.</p><p>If you know that your inputs are correct and you\'re still viewing an incorrect result, please contact the developer.</p></div>');
                }
                var markers = quake_locations.map(function(location, i){
                    return new google.maps.Marker({
                        position: location,
                        label: labels[i]
                    });
                });
                if(markerCluster)
                {
                    markerCluster.clearMarkers();
                }
                markerCluster = new MarkerClusterer(map, markers, {imagePath: './google_marker_clusterer/m'});
            },
            error: function(err){
                $('#content').append('<p>There was an error with your request.</p>');
                if(err.status == 400)
                {
                    $('#content').html('<p>The error seems to be a 400 error. This typically comes up when you specify an incorrect value. Please keep in mind that longitude is a number ranging from -180 to 180 and latitude is a number ranging from -90 to 90.</p>');
                }
                console.log(err);
            }
        });
    });
    
});
