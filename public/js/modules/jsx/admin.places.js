/** @jsx React.DOM */

define(['../helpers/utils.js'], function (utils) {

    var PlaceInput = React.createClass({
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
            return <form onSubmit={this.noAction}>
                <div className='row'>
                    <div className='small-12 columns'>
                        <label>Endereço do novo local
                            <input type='text' ref='pInput' name='address' placeholder='Avenida Rio Branco 1, Rio de Janeiro' />
                        </label>
                    </div>
                </div>
            </form>
        }
    });

    var PlaceForm = React.createClass({
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
            return <fieldset>
                <legend>{this.props.place.address}</legend>
                <form onSubmit={this.handleSubmit}>
                    <div className='row'>
                        <div className='small-7 columns'>
                            <div className='row'>
                                <div className='small-12 columns'>
                                    <label>Dê um nome a este local
                                        <input type='text' ref='nameInput' name='name'
                                            required={true} placeholder='Sede, Almoxarifado, Posto de Gasolina'
                                            defaultValue={this.props.place.name} />
                                    </label>
                                </div>
                            </div>
                            {this.props.avaibleTags.map(function (tag) {
                                return <div className='row' key={tag.value}>
                                    <div className='small-12 columns'>
                                        <input id={'tagType' + tag.value + thisPlace._id} type='checkbox' value={tag.value}
                                            defaultChecked={_.isArray(thisPlace.tags) && thisPlace.tags.indexOf(tag.value) >= 0}/>
                                        <label htmlFor={'tagType' + tag.value + thisPlace._id}>{tag.name}</label>
                                    </div>
                                </div>;
                            })}
                            <div className='row'>
                                <div className='small-12 columns text-right'>
                                    <button className='button success small'>Salvar</button>
                                    <a onClick={this.removeMe} className='button alert small'>Remover</a>
                                </div>
                            </div>
                        </div>
                        <div className='small-5 columns' ref='mapContainer'>
                            {this.state.mapURL
                                ? <img src={this.state.mapURL} />
                                : <div>Carregando...</div>
                            }
                        </div>
                    </div>
                </form>
            </fieldset>;
        }
    });
    var Places = React.createClass({

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
            return <div>
                {this.state.mapsLoaded && this.state.geoCompleteLoaded
                    ? <PlaceInput newPlace={this.savePlace} />
                    : null}
                {this.state.places.map(function(place){
                    return <PlaceForm avaibleTags={this.state.avaibleTags} key={place._id} place={place} removePlace={this.removePlace} savePlace={this.savePlace} />;
                }.bind(this))}
            </div>;
        }
    });

    return Places;
});