/** @jsx React.DOM */

define(function () {
    function parseStatuses (ss) {
        ss = ss || [];

        var s = {
            pendente: [],
            agendado: [],
            finalizado: [],
            suspenso: [],
            cancelado: []
        };
        _.forEach(ss, function (st) {
            if (!st.name || !_.isArray(st.references)) return;
            s[st.name] = _.uniq(s[st.name].concat(st.references));
        });

        return s;
    }
    var StatusForm = React.createClass({displayName: 'StatusForm',
        getInitialState: function () {
            return {locked: false};
        },
        handleSubmit: function (e) {

            e.preventDefault();
            this.setState({locked: true});

            $.post(pager.urls.ajax + 'admin/status/' +  this.props.name + '/' + this.refs.newRef.getDOMNode().value)
                .always(function () {
                    if (!this.isMounted()) return;
                    this.refs.newRef.getDOMNode().value = '';
                    this.setState({locked: false});
                }.bind(this))
                .done(this.props.reloadAll);
        },
        removeOne: function (e) {
            e.preventDefault();
            var me = $(e.currentTarget);
            $.ajax({type: 'DELETE', url: me.attr('href')}).always(this.props.reloadAll);
        },
        render: function () {
            return React.DOM.fieldset(null, 
                React.DOM.legend( {className:"textCapitalize"}, this.props.name),
                React.DOM.form( {onSubmit:this.handleSubmit}, 
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"medium-12 columns"}, 
                            React.DOM.label(null, "Novo status",
                                React.DOM.input( {type:"text", list:"UndefinedStatuses", ref:"newRef", name:"reference", disabled:this.state.locked, required:true} )
                            )
                        )
                    )
                ),
                React.DOM.ul(null, 
                    this.props.references.map(function (val) {
                        return React.DOM.li( {key:val, className:"textCapitalize"}, val,
                            React.DOM.a( {onClick:this.removeOne, className:"killStatus close",
                                href:pager.urls.ajax + 'admin/status/' +
                                    this.props.name + '/' + val}, '×')
                        );
                    }.bind(this))
                )
            )
        }
    });
    var Statuses = React.createClass({displayName: 'Statuses',
        getInitialState: function () {
            return {statuses: parseStatuses(), undefinedStatuses: []};
        },
        reloadAll: function () {
            $.get(pager.urls.ajax + 'admin/statuses')
                .done(function(result) {
                    if (!this.isMounted()) return;
                    this.setState({statuses: parseStatuses(result)}, this.loadUndefinedStatuses);
                }.bind(this));
        },
        loadUndefinedStatuses: function () {
            $.get(pager.urls.ajax + 'admin/undefined/statuses')
                .done(function (statuses) {
                    if (!this.isMounted()) return;

                    this.setState({
                        undefinedStatuses: _.filter(statuses,
                            function (status) {
                                return !_.find(this.state.statuses,
                                    function (s) { return s.indexOf(status) >= 0; }
                                );
                            }.bind(this)
                        )
                    });

                }.bind(this));
        },
        componentDidMount: function () {
            this.reloadAll();
        },
        render: function () {
            return React.DOM.div( {className:"medium-block-grid-3"}, 
                React.DOM.datalist( {id:"UndefinedStatuses"}, 
                    this.state.undefinedStatuses.map(function (s) {
                        return React.DOM.option( {key:s, value:s});
                    })
                ),
                _.map(this.state.statuses, function (references, name) {
                    return StatusForm( {reloadAll:this.reloadAll, name:name, references:references, key:name} );
                }.bind(this))
            );
        }
    });

    return Statuses;
});