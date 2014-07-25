/** @jsx React.DOM */define(["../helpers/utils.js"],function(e){var t=React.createClass({displayName:"PlaceInput",componentDidMount:function(){$(this.refs.pInput.getDOMNode()).geocomplete().bind("geocode:result",function(e,t){if(!this.isMounted()||!t)return;var n=this.refs.pInput.getDOMNode();setTimeout(function(){$(n).val("")},500),this.props.newPlace({address:t.formatted_address,location:{lat:t.geometry.location.lat(),lng:t.geometry.location.lng()}})}.bind(this))},noAction:function(e){e.preventDefault()},render:function(){return React.DOM.form({onSubmit:this.noAction},React.DOM.div({className:"row"},React.DOM.div({className:"medium-12 columns"},React.DOM.label(null,"Endereço do novo local",React.DOM.input({type:"text",ref:"pInput",name:"address",placeholder:"Avenida Rio Branco 1, Rio de Janeiro"})))))}}),n=React.createClass({displayName:"PlaceForm",getInitialState:function(){return{mapURL:null}},componentDidMount:function(){e.loadAPIKeys(function(e){if(!this.isMounted())return;var t=this.refs.mapContainer.getDOMNode();this.setState({mapURL:"http://maps.googleapis.com/maps/api/staticmap?markers="+this.props.place.location.lat+","+this.props.place.location.lng+"&zoom=14&size="+$(t).width()+"x300&key="+e.google})}.bind(this))},handleSubmit:function(e){e.preventDefault();var t=$(e.currentTarget),n=[];t.find(":checkbox").each(function(){$(this).is(":checked")&&n.push($(this).val())}),this.props.savePlace({name:this.refs.nameInput.getDOMNode().value,tags:n},this.props.place._id)},removeMe:function(e){e.preventDefault(),this.props.removePlace(this.props.place._id)},render:function(){var e=this.props.place;return React.DOM.fieldset(null,React.DOM.legend(null,this.props.place.address),React.DOM.form({onSubmit:this.handleSubmit},React.DOM.div({className:"row"},React.DOM.div({className:"medium-7 columns"},React.DOM.div({className:"row"},React.DOM.div({className:"medium-12 columns"},React.DOM.label(null,"Dê um nome a este local",React.DOM.input({type:"text",ref:"nameInput",name:"name",required:!0,placeholder:"Sede, Almoxarifado, Posto de Gasolina",defaultValue:this.props.place.name})))),this.props.availableTags.map(function(t){return React.DOM.div({className:"row",key:t.value},React.DOM.div({className:"medium-12 columns"},React.DOM.input({id:"tagType"+t.value+e._id,type:"checkbox",value:t.value,defaultChecked:_.isArray(e.tags)&&e.tags.indexOf(t.value)>=0}),React.DOM.label({htmlFor:"tagType"+t.value+e._id},t.name)))}),React.DOM.div({className:"row"},React.DOM.div({className:"medium-12 columns text-right"},React.DOM.button({className:"button success small"},"Salvar"),React.DOM.a({onClick:this.removeMe,className:"button alert small"},"Remover")))),React.DOM.div({className:"medium-5 columns",ref:"mapContainer"},this.state.mapURL?React.DOM.img({src:this.state.mapURL}):React.DOM.div(null,"Carregando...")))))}}),r=React.createClass({displayName:"Places",getInitialState:function(){return{mapsLoaded:!1,geoCompleteLoaded:!1,places:[],availableTags:[{name:"Ponto de Saída",value:"origin"},{name:"Parada opcional",value:"pitstop"}]}},loadMaps:function(){if(typeof google!="undefined"&&google&&google.maps&&google.maps.places)return this.setState({mapsLoaded:!0});e.loadAPIKeys(function(e){var t=this,n="PagerCallback_"+Math.random().toString(36).substr(2);if(!t.isMounted())return;window[n]=function(){t.isMounted()&&t.setState({mapsLoaded:!0}),delete window[n]},LazyLoad.js(["//maps.googleapis.com/maps/api/js?libraries=places&callback="+n+"&key="+e.google])}.bind(this))},loadGeocomplete:function(){if($.fn.geocomplete)return this.setState({geoCompleteLoaded:!0});LazyLoad.js([pager.build.moduleRoot+"/ext/jquery.geocomplete.js"],function(){this.setState({geoCompleteLoaded:!0})}.bind(this))},componentDidMount:function(){this.loadMaps(),this.loadGeocomplete(),this.reloadPlaces()},reloadPlaces:function(){return $.get(pager.urls.ajax+"admin/places").done(function(e){this.setState({places:e})}.bind(this))},removePlace:function(e){$.ajax({type:"DELETE",url:pager.urls.ajax+"admin/place/"+e}).done(this.reloadPlaces)},savePlace:function(e,t){$.ajax({type:"POST",url:pager.urls.ajax+"admin/place"+(t?"/"+t:""),contentType:"application/json; charset=utf-8",data:JSON.stringify({place:e})}).done(this.reloadPlaces)},render:function(){return React.DOM.div(null,this.state.mapsLoaded&&this.state.geoCompleteLoaded?t({newPlace:this.savePlace}):null,this.state.places.map(function(e){return n({availableTags:this.state.availableTags,key:e._id,place:e,removePlace:this.removePlace,savePlace:this.savePlace})}.bind(this)))}});return r});