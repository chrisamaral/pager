/** @jsx React.DOM */
var drawQueue = [];
 define(function () {
    var Map;

    Map = React.createClass({displayName: 'Map',

        getInitialState: function () {
            return {markedTasks: []};
        },

        massTaskMarker: _.debounce(function () {
            if (this.props.mapState !== 'tasks') {
                return;
            }
            var tasks = this.state.markedTasks,
                index =_.findIndex(tasks, function (task) {
                    if (task.marker === undefined && task.location === undefined) {
                        console.log(task);
                    }

                    return task.marker === undefined && task.location !== undefined;
                }),
                task = tasks[index];

            if (!task) {
                return;
            }

            task.marker = new google.maps.Marker({
                title: task.address.address,
                map: pager.console.map,
                position: new google.maps.LatLng(task.location.lat, task.location.lng)
            });

            this.setState({markedTasks: tasks});

            this.massTaskMarker();
        }, 50),
        filterExistingTasks: function (props) {
            var newMarkers = [], oldMarkers = this.state.markedTasks;

            props.queries.forEach(function (query) {
                query.tasks.forEach(function (task) {

                    if (!task.location) {
                        return;
                    }

                    var marker = {id: task._id},
                        index = _.findIndex(oldMarkers, marker),
                        old = oldMarkers[index];

                    marker.location = task.location;
                    marker.address = task.address;

                    if (old && old.marker) {
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

        updateMapView: _.debounce(function (newProps) {

            var props = newProps || this.props, newMarkers, selected;

            newMarkers = this.filterExistingTasks(props);
            console.log('update map view');

            if (props.mapState === 'tasks') {

                this.setState({markedTasks: newMarkers}, function(){
                    this.massTaskMarker();
                }.bind(this));

            } else if (props.mapState === 'task') {

                newMarkers.forEach(function (marker) {
                    if (marker.marker) {
                        marker.marker.setMap(null);
                        delete marker.marker;
                    }
                    return marker;
                });

                selected = _.find(newMarkers, {id: props.selectedTask});

                if (selected) {
                    selected.marker =
                        new google.maps.Marker({
                            title: selected.address.address,
                            map: pager.console.map,
                            position: new google.maps.LatLng(selected.location.lat, selected.location.lng)
                        });
                } else {
                    this.props.setMapState('tasks');
                }

                this.setState({markedTasks: newMarkers});
            }
            
        }, 100),

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
            return React.DOM.div( {id:"ConsoleMainMap"});
        }
    });
    return Map;
});