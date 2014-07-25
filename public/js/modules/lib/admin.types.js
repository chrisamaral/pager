/** @jsx React.DOM */

define(function () {
    var TypeForm = React.createClass({displayName: 'TypeForm',

        mixins: [React.addons.LinkedStateMixin],

        getInitialState: function () {
            return this.props.type;
        },

        handleSubmit: function (e) {
            e.preventDefault();
            var name = $(this.refs.nameInput.getDOMNode()).val(),
                type = {
                    duration: parseInt(this.state.duration, 10)
                };

            $.ajax({

                type: 'POST',
                url: pager.urls.ajax + 'admin/type/' + name,
                data: JSON.stringify({type: type}),
                contentType: "application/json; charset=utf-8"

            }).done(this.props.reloadAll);
        },

        componentWillReceiveProps: function (props) {
            this.setState(props.type);
        },

        killMe: function (e) {
            e.preventDefault();

            $.ajax({url: pager.urls.ajax + 'admin/type/' + $(this.refs.nameInput.getDOMNode()).val(), type: 'DELETE'})
                .done(this.props.reloadAll);
        },

        render: function () {
            return React.DOM.form( {onSubmit:this.handleSubmit}, 
                React.DOM.div( {className:"panel"}, 
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"medium-7 columns"}, 
                            React.DOM.input( {type:"text", name:"name", list:"UndefinedTypes", ref:"nameInput", required:true, valueLink:this.linkState('name'), placeholder:"Nome"} )
                        ),
                        React.DOM.div( {className:"medium-3 columns"}, 
                            React.DOM.input( {type:"number", min:0, name:"duration", ref:"durationInput", valueLink:this.linkState('duration'), placeholder:"Minutos"} )
                        ),
                        React.DOM.div( {className:"medium-1 columns"}, 
                            React.DOM.button( {className:"fi-save button postfix success"})
                        ),
                        React.DOM.div( {className:"medium-1 columns"}, 
                            this.state._id
                                ? React.DOM.button( {className:"fi-x button postfix alert", onClick:this.killMe})
                                : null
                        )
                    )
                )
            );
        }
    });
    var Types = React.createClass({displayName: 'Types',

        getInitialState: function () {
            return {availableTypes: [], defaultType: {name: '', duration: 30}, undefinedTypes: []};
        },
        reloadTypes: function () {
            $.get(pager.urls.ajax + 'admin/types')
                .done(function (types) {
                    if (!this.isMounted()) return;
                    this.setState({availableTypes: types}, this.loadUndefinedTypes);
                }.bind(this));
        },
        componentDidMount: function () {
            this.reloadTypes();
        },
        loadUndefinedTypes: function () {
            $.get(pager.urls.ajax + 'admin/undefined/types')
                .done(function (types) {
                    if (!this.isMounted()) return;
                    this.setState({undefinedTypes: _.filter(types, function(type){
                        return !_.find(this.state.availableTypes,{name: type});
                    }.bind(this))});
                }.bind(this));
        },
        render: function () {
            return React.DOM.div(null, 
                React.DOM.datalist( {id:"UndefinedTypes"}, 
                    this.state.undefinedTypes.map(function(type){
                        return React.DOM.option( {key:type, value:type});
                    })
                ),
                this.state.availableTypes.map(function (t) {
                    return TypeForm( {type:t, key:t._id, reloadAll:this.reloadTypes} );
                }.bind(this)),
                TypeForm( {type:this.state.defaultType, reloadAll:this.reloadTypes} )
            );
        }
    });
    return Types;
});