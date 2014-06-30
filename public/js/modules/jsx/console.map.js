/** @jsx React.DOM */

define(function () {
    var Map,
        AttrTable;
    /*
    scrollStates:
        noScroll
        anyScroll
        bigScroll
     */

    function zeroInfoWindows(infoWindows) {
        _.forEach(infoWindows, function (i) { i.close(); });
        for (var i in infoWindows) {
            if (infoWindows.hasOwnProperty(i)) delete infoWindows[i];
        }
    }

    Map = React.createClass({
        getInitialState: function(){ return {markers: [], infoW: {}, scrollState: 'noScroll'}; },

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

                    var elem = $('[data-task="' + task._id + '"]'), scrollRoot = document.getElementById('ScrollRoot');

                    if (elem.length && elem.is(':visible')) {
                        $(scrollRoot).animate({
                            scrollTop: scrollRoot.scrollTop + elem.offset().top - $(scrollRoot).offset().top - 10
                        });
                    }

                    this.props.setTaskFocus(task._id);

                }.bind(this));

            }, this);

            return tasks;
        },

        selectedTaskClick: function (marker) {
            var infoWindows = this.state.infoW, $content, elem;

            function killMe () {

                infoWindows[marker._id].close();
                delete infoWindows[marker._id];

                this.setState({infoW: infoWindows});
            }

            if (infoWindows[marker._id]) {
                return killMe.call(this);
            }

            $content = $('<div class="consoleInfoWindow">');
            elem = $('[data-task="' + marker.task._id + '"]');

            if (elem.length && elem.is(':visible')) {
                $content.append('<p>' + marker.task.address.address + '</p>');
            } else {
                $content.append(React.renderComponentToString(<AttrTable attrs={marker.task.attrs} />));
            }

            $content.append(
                $('<p>').append(
                    $('<a title="Ver todos"><i class="fi-arrow-left"></i></a>')
                        .click(function () {
                            this.props.setTaskFocus(marker._id);
                            killMe.call(this);
                        }.bind(this))
                    )
            );

            infoWindows[marker._id] = new google.maps.InfoWindow({content: $content[0]});

            infoWindows[marker._id].open(pager.console.map, marker.marker);
            this.setState({infoW: infoWindows});

            google.maps.event.addListener(infoWindows[marker._id], 'closeclick', function () {
                var infoWindows = this.state.infoW;
                delete infoWindows[marker._id];
                this.setState({infoW: infoWindows});
            }.bind(this));

        },

        filterTasks: function (props) {
            var newMarkers = [],
                oldMarkers = this.state.markers;

            props.mapState !== 'router' && props.queries.forEach(function (query) {
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

                    function unMark () {
                        old.marker.setMap(null);
                        delete old.marker;
                    }

                    if (old && old.marker) {

                        if ((props.mapState === 'tasks' && !old.hasSelectedMarker) ||
                            (props.mapState === 'task' && old.hasSelectedMarker && old._id === props.selectedTask)
                        ) {
                            marker.marker = old.marker;
                        } else {
                            unMark();
                        }
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

            AttrTable = AttrTable || pager.components.AttrTable;

            var props = newProps || this.props,
                infoWindows = this.state.infoW,
                newMarkers,
                aux,
                mapElem = this,
                selected;

            console.log('update map view');

            switch (props.mapState) {
                case 'tasks':
                    newMarkers = this.filterTasks(props);
                    newMarkers = this.massTaskMarker(newMarkers);
                    break;
                case 'task':
                    newMarkers = this.filterTasks(props);
                    selected = _.find(newMarkers, {_id: props.selectedTask});
                    if (selected) {
                        selected.hasSelectedMarker = true;

                        if (!selected.marker) {

                            aux = new google.maps.LatLng(selected.location.lat, selected.location.lng);
                            selected.marker = new google.maps.Marker({
                                title: selected.address.address,
                                map: pager.console.map,
                                icon: '/icons/selected_marker.png',
                                position: aux
                            });

                            pager.console.map.panTo(aux);

                            zeroInfoWindows(infoWindows);

                            this.selectedTaskClick(selected);

                            google.maps.event.addListener(selected.marker, 'click', function () {
                                this.selectedTaskClick(selected);
                            }.bind(this));
                        }
                    }

                    break;
                case 'router':
                    newMarkers = this.filterTasks(props);

                    zeroInfoWindows(infoWindows);

                    newMarkers = props.routerWorker.wayPoints.map(function (wayPoint) {

                        wayPoint.marker = new google.maps.Marker({
                            map: pager.console.map,
                            icon: '/icons/fixed_marker.png',
                            position: new google.maps.LatLng(wayPoint.location.lat, wayPoint.location.lng)
                        });

                        google.maps.event.addListener(wayPoint.marker, 'click', function () {

                            function killMe () {

                                infoWindows[wayPoint.id].close();
                                delete infoWindows[wayPoint.id];

                                mapElem.setState({infoW: infoWindows});
                            }

                            if (infoWindows[wayPoint.id]) {
                                return killMe();
                            }

                            infoWindows[wayPoint.id] = new google.maps.InfoWindow({
                                content:
                                    $('<div class="consoleInfoWindow">')
                                        .append(React.renderComponentToString(<AttrTable
                                            attrs={wayPoint.attrs} />))[0]
                            });

                            infoWindows[wayPoint.id].open(pager.console.map, wayPoint.marker);
                            mapElem.setState({infoW: infoWindows});

                            google.maps.event.addListener(infoWindows[wayPoint.id], 'closeclick', function () {
                                var infoWindows = mapElem.state.infoW;
                                delete infoWindows[wayPoint.id];
                                mapElem.setState({infoW: infoWindows});
                            });
                        });

                        return wayPoint;
                    });
                    break;
            }
            
            this.setState({markers: newMarkers, infoW: infoWindows});
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
                },
                mapComponent = this,
                weirdLockOn = false,

                actualHandler = function (e) {
                    if (!mapComponent.isMounted()) return unBind();
                    if (weirdLockOn) return;

                    var currentState = 'noScroll', target;
                    
                    if (e && e.currentTarget) {
                        target = e.currentTarget;
                    } else {
                        target = document.getElementById('ScrollRoot')
                    }

                    if (target.scrollHeight > document.body.scrollHeight) currentState = 'anyScroll';
                    if (target.scrollTop > $('#Console').position().top) currentState = 'bigScroll';

                    if (mapComponent.state.scrollState !== currentState) {
                        weirdLockOn = true;
                        mapComponent.setState({scrollState: currentState}, function() {weirdLockOn = false;});
                    }
                },

                scrollHandler = _.throttle(actualHandler, 100);

            $('#ScrollRoot').on('scroll resize', scrollHandler);

            function unBind() {
                $('#ScrollRoot').off('scroll resize', scrollHandler);
            }

            pager.console = pager.console || {};
            pager.console.map = new google.maps.Map(this.refs.mapContainer.getDOMNode(), mapOptions);

            setTimeout(function () {
                this.updateMapView();
            }.bind(this), 1000);

            actualHandler();
        },

        componentWillReceiveProps: function (newProps) {
            this.updateMapView(newProps);
        },

        render: function () {
            var s = {
                top: this.state.scrollState === 'bigScroll' ? 0 : $('#Console').position().top,
                width: '',
                height: this.state.scrollState === 'bigScroll'
                    ? $(window).height()
                    : this.props.height
            };

            if (this.state.scrollState !== 'noScroll') {
                s.width = $('#ScrollRoot>.inner-wrap').width();
            }

            return <div id='ConsoleMainMap' style={s}>
                <div ref='mapContainer'></div>
            </div>;
        }
    });

    return Map;
});