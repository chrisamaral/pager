/** @jsx React.DOM */

define(['../helpers/utils.js'], function (utils) {

    var PlaceInput = React.createClass({displayName: 'PlaceInput',
        componentDidMount: function () {
            $(this.refs.pInput.getDOMNode())
                .geocomplete().bind("geocode:result", function (event, result) {

                    if (!this.isMounted() || !result) return;

                    var e = this.refs.pInput.getDOMNode();

                    setTimeout(function(){
                        $(e).val('');
                    }, 500);


                    this.props.newPlace({
                        address: result.formatted_address,
                        location: {
                            lat: result.geometry.location.lat(),
                            lng: result.geometry.location.lng()
                        }
                    });



                }.bind(this));
        },
        noAction: function (e) {
            e.preventDefault();
        },
        render: function () {
            return React.DOM.form( {onSubmit:this.noAction}, 
                React.DOM.div( {className:"row"}, 
                    React.DOM.div( {className:"small-12 columns"}, 
                        React.DOM.label(null, "Endereço do novo local",
                            React.DOM.input( {type:"text", ref:"pInput", name:"address", placeholder:"Avenida Rio Branco 1, Rio de Janeiro"} )
                        )
                    )
                )
            )
        }
    });

    var PlaceForm = React.createClass({displayName: 'PlaceForm',
        getInitialState: function () {
            return {mapURL: null};
        },
        componentDidMount: function () {
            utils.loadAPIKeys(function (keys) {
                if (!this.isMounted()) return;

                var container = this.refs.mapContainer.getDOMNode();
                this.setState({mapURL: 'http://maps.googleapis.com/maps/api/staticmap?markers=' +
                    this.props.place.location.lat + ',' + this.props.place.location.lng +
                    '&zoom=14&size=' + $(container).width() + 'x300&key=' + keys.google});
            }.bind(this));
        },
        handleSubmit: function (e) {
            e.preventDefault();
            var $form = $(e.currentTarget), tags = [];
            $form.find(':checkbox').each(function () {
                if ($(this).is(':checked')) tags.push($(this).val());
            });
            this.props.savePlace({
                name:  this.refs.nameInput.getDOMNode().value,
                tags: tags
            }, this.props.place._id);
        },
        removeMe: function (e) {
            e.preventDefault();
            this.props.removePlace(this.props.place._id);
        },
        render: function () {
            var thisPlace = this.props.place;
            return React.DOM.fieldset(null, 
                React.DOM.legend(null, this.props.place.address),
                React.DOM.form( {onSubmit:this.handleSubmit}, 
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"small-7 columns"}, 
                            React.DOM.div( {className:"row"}, 
                                React.DOM.div( {className:"small-12 columns"}, 
                                    React.DOM.label(null, "Dê um nome a este local",
                                        React.DOM.input( {type:"text", ref:"nameInput", name:"name",
                                            required:true, placeholder:"Sede, Almoxarifado, Posto de Gasolina",
                                            defaultValue:this.props.place.name} )
                                    )
                                )
                            ),
                            this.props.avaibleTags.map(function (tag) {
                                return React.DOM.div( {className:"row", key:tag.value}, 
                                    React.DOM.div( {className:"small-12 columns"}, 
                                        React.DOM.input( {id:'tagType' + tag.value + thisPlace._id, type:"checkbox", value:tag.value,
                                            defaultChecked:_.isArray(thisPlace.tags) && thisPlace.tags.indexOf(tag.value) >= 0}),
                                        React.DOM.label( {htmlFor:'tagType' + tag.value + thisPlace._id}, tag.name)
                                    )
                                );
                            }),
                            React.DOM.div( {className:"row"}, 
                                React.DOM.div( {className:"small-12 columns text-right"}, 
                                    React.DOM.button( {className:"button success small"}, "Salvar"),
                                    React.DOM.a( {onClick:this.removeMe, className:"button alert small"}, "Remover")
                                )
                            )
                        ),
                        React.DOM.div( {className:"small-5 columns", ref:"mapContainer"}, 
                            this.state.mapURL
                                ? React.DOM.img( {src:this.state.mapURL} )
                                : React.DOM.div(null, "Carregando...")
                            
                        )
                    )
                )
            );
        }
    });
    var Places = React.createClass({displayName: 'Places',

        getInitialState: function () {
            return {
                mapsLoaded: false,
                geoCompleteLoaded: false,
                places: [],
                avaibleTags: [
                    {name: 'Ponto de Saída', value: 'origin'},
                    {name: 'Parada opcional', value: 'pitstop'}
                ]
            };
        },

        loadMaps: function () {


            if (typeof google !== 'undefined' && google && google.maps && google.maps.places) {
                return this.setState({mapsLoaded: true});
            }

            utils.loadAPIKeys(function (keys) {

                var component = this,
                    randomID = 'PagerCallback_' + Math.random().toString(36).substr(2);

                if (!component.isMounted()) return;

                window[randomID] = function () {

                    if (component.isMounted()) {
                        component.setState({mapsLoaded: true});
                    }

                    delete window[randomID];
                };

                LazyLoad.js(['//maps.googleapis.com/maps/api/js?libraries=places&callback=' + randomID + '&key=' + keys.google]);

            }.bind(this));

        },

        loadGeocomplete: function () {
            if ($.fn.geocomplete) return this.setState({geoCompleteLoaded: true});

            LazyLoad.js([pager.build.moduleRoot + '/ext/jquery.geocomplete.js'], function(){

                this.setState({geoCompleteLoaded: true});

            }.bind(this))

        },

        componentDidMount: function () {

            this.loadMaps();
            this.loadGeocomplete();
            this.reloadPlaces();

        },

        reloadPlaces: function () {
            return $.get(pager.urls.ajax + 'admin/places')
                        .done(function (places) {
                            this.setState({places: places});
                        }.bind(this))
        },

        removePlace: function (id) {
            $.ajax({
                type: 'DELETE',
                url: pager.urls.ajax + 'admin/place/' + id
            }).done(this.reloadPlaces);
        },

        savePlace: function (place, id) {
            $.ajax({
                type: 'POST',
                url: pager.urls.ajax + 'admin/place' + (id ? '/' + id : ''),
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({place: place})
            }).done(this.reloadPlaces);
        },

        render: function () {
            return React.DOM.div(null, 
                this.state.mapsLoaded && this.state.geoCompleteLoaded
                    ? PlaceInput( {newPlace:this.savePlace} )
                    : null,
                this.state.places.map(function(place){
                    return PlaceForm( {avaibleTags:this.state.avaibleTags, key:place._id, place:place, removePlace:this.removePlace, savePlace:this.savePlace} );
                }.bind(this))
            );
        }
    });

    return Places;
});