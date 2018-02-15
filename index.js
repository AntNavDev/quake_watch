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

function reformatDate(date)
{
    var temp = date.split('/');
    if(temp[0] == '' || temp[1] == '' || temp[2] == '')
    {
        return null;
    }
    return $.datepicker.formatDate('yy-mm-dd', new Date(temp[2], (temp[0] - 1), temp[1]));
}

$(document).ready(function(){
    var regionIndicator;
    var markerCluster;

    $('#start_date').datepicker({
        onSelect: function(){
            if(isInputPopulated('#latitude_input') && 
                isInputPopulated('#longitude_input') &&
                isInputPopulated('#radius_input') &&
                isInputPopulated('#start_date') &&
                isInputPopulated('#end_date'))
            {
                $('#get_quake_results_button').attr('disabled', false);
            }
            else
            {
                $('#get_quake_results_button').attr('disabled', true);
            }
        }
    });
    $('#end_date').datepicker({
        onSelect: function(){
            if(isInputPopulated('#latitude_input') && 
                isInputPopulated('#longitude_input') &&
                isInputPopulated('#radius_input') &&
                isInputPopulated('#start_date') &&
                isInputPopulated('#end_date'))
            {
                $('#get_quake_results_button').attr('disabled', false);
            }
            else
            {
                $('#get_quake_results_button').attr('disabled', true);
            }
        }
    });

    $('#get_quake_results_button').attr('disabled', true);
    if(isInputPopulated('#latitude_input') && 
        isInputPopulated('#longitude_input') &&
        isInputPopulated('#radius_input') &&
        isInputPopulated('#start_date') &&
        isInputPopulated('#end_date'))
    {
        $('#get_quake_results_button').attr('disabled', false);
    }

    $('input[class="location_data"]').keyup(function(){
        if(isInputPopulated('#latitude_input') && 
            isInputPopulated('#longitude_input') &&
            isInputPopulated('#radius_input') &&
            isInputPopulated('#start_date') &&
            isInputPopulated('#end_date'))
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
        var has_error = '';
        var start_date = reformatDate($('#start_date').val());
        var end_date = reformatDate($('#end_date').val());
        var my_longitude = $('#longitude_input').val();
        var my_latitude = $('#latitude_input').val();
        var my_radius = $('#radius_input').val();
        var quake_locations = Array();
        var labels = Array();
        // Hacky way to fix datepicker
        if(!start_date)
        {
            has_error += 'You seem to be missing the start date. Please enter a start date to continue.'
        }
        if(!end_date)
        {
            has_error += 'You seem to be missing the end date. Please enter an end date to continue.'
        }
        if(has_error.length)
        {
            $('#content').html('<div>' + has_error + '</div>');
        }
        else
        {
            var my_url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' + start_date + '&endtime=' + end_date + '&latitude=' + my_latitude + '&longitude=' + my_longitude + '&maxradiuskm=' + my_radius;
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
                radius: parseFloat(my_radius) * 1010
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
        }
    });
    
});
