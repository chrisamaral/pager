/** @jsx React.DOM */

define(function () {
    var Map, infoWindows = {}, AttrTable;
    function infoWindowFactory (marker, mapElem) {
        return function () {
            function killMe () {
                infoWindows[marker._id].close();
                delete infoWindows[marker._id];
            }

            if (infoWindows[marker._id]) {

                return killMe();
            }

            infoWindows[marker._id] = new google.maps.InfoWindow({
                content:
                    $('<div class="consoleInfoWindow">')
                        .append(
                        React.renderComponentToString(<AttrTable attrs={marker.task.attrs} />)
                    )
                        .append(
                        $('<p>').append(
                            $('<a title="Ver todos"><i class="fi-arrow-left"></i></a>').click(function () {

                                mapElem.props.setTaskFocus(marker._id);
                                killMe();

                            })
                        )
                    )[0]
            });

            infoWindows[marker._id].open(pager.console.map, marker.marker);

            google.maps.event.addListener(infoWindows[marker._id], 'closeclick', function () {
                delete infoWindows[marker._id];
            });
        };
    }
    Map = React.createClass({

        getInitialState: function () {
            return {
                markedTasks: []
            };
        },

        massTaskMarker: function (tasks) {

            _.forEach(tasks, function (task) {

                if (!(task.marker === undefined && task.location !== undefined)) {
                    return;
                }

                task.marker = new google.maps.Marker({
                    title: task.address.address,
                    map: pager.console.map,
                    icon: '/icons/default_marker.png',
                    position: new google.maps.LatLng(task.location.lat, task.location.lng)
                });

                google.maps.event.addListener(task.marker, 'click', function () {
                    var elem = $('[data-task="' + task._id + '"]'), leftPanel = document.getElementById('LeftPanel');
                    if (elem.length) {
                        elem.closest('.QueryElem').show().closest('.TaskInput').show();
                        $(leftPanel).animate({
                            scrollTop: leftPanel.scrollTop + elem.offset().top - $(leftPanel).offset().top - 10
                        });
                    }
                    this.props.setTaskFocus(task._id);
                }.bind(this));

            }, this);

            this.setState({markedTasks: tasks});
        },

        filterTasks: function (props) {
            var newMarkers = [], oldMarkers = this.state.markedTasks;

            props.queries.forEach(function (query) {
                query.tasks.forEach(function (task) {

                    if (!task.location) {
                        return;
                    }

                    var marker = {_id: task._id},
                        index = _.findIndex(oldMarkers, marker),
                        old = oldMarkers[index];

                    marker.location = task.location;
                    marker.address = task.address;
                    marker.task = task;

                    if (old && old.marker && old.isSelected) {
                        old.marker.setMap(null);
                    } else if (old && old.marker) {
                        marker.marker = old.marker;
                    }

                    newMarkers.push(marker);

                    if (index >= 0) {
                        oldMarkers.splice(index, 1);
                    }

                }.bind(this));
            }.bind(this));

            oldMarkers.forEach(function (marker) {
                if (marker.marker) {
                    marker.marker.setMap(null);
                }
            });

            return newMarkers;
        },

        updateMapView: function (newProps) {

            var props = newProps || this.props, newMarkers, aux, spawnInfoWindow;

            newMarkers = this.filterTasks(props);
            console.log('update map view');

            if (props.mapState === 'tasks') {

                this.massTaskMarker(newMarkers);

            } else if (props.mapState === 'task') {

                newMarkers.forEach(function (marker) {

                    if (marker.marker) {
                        marker.marker.setMap(null);
                        delete marker.marker;
                    }

                    if (marker._id === props.selectedTask) {
                        marker.isSelected = true;
                        aux = new google.maps.LatLng(marker.location.lat, marker.location.lng);

                        marker.marker = new google.maps.Marker({
                            title: marker.address.address,
                            map: pager.console.map,
                            icon: '/icons/selected_marker.png',
                            position: aux
                        });
                        pager.console.map.panTo(aux);

                        _.forEach(infoWindows, function (i, index) {
                            i.close();
                            delete infoWindows[index];
                        });

                        AttrTable = AttrTable || pager.components.AttrTable;

                        spawnInfoWindow = infoWindowFactory(marker, this);

                        google.maps.event.addListener(marker.marker, 'click', spawnInfoWindow);

                    }
                }.bind(this));

                this.setState({markedTasks: newMarkers});
            }
        },

        componentDidMount: function () {
            var mapOptions = {
                zoom: 8,
                center: new google.maps.LatLng(-22.848658,-43.300933),
                zoomControl: false,
                panControl: false,
                scaleControl: false,
                streetViewControl: true,
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                }
            };

            pager.console = pager.console || {};
            pager.console.map = new google.maps.Map(this.getDOMNode(), mapOptions);

            setTimeout(function () {
                this.updateMapView();
            }.bind(this), 1000);
        },
        componentWillReceiveProps: function (newProps) {
            this.updateMapView(newProps);
        },
        render: function () {

            return <div id='ConsoleMainMap'></div>;
        }
    });
    return Map;
});