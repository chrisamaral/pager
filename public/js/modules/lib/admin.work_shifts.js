/** @jsx React.DOM */
define(function(){

    var ShiftEditor = React.createClass({displayName: 'ShiftEditor',
        getInitialState: function () {
            return {locked: false};
        },
        unlock: function () {
            if (!this.isMounted()) return;
            this.setState({locked: false});
        },
        handleSubmit: function (e) {

            e.preventDefault();

            if (this.state.locked) return;

            var $form = $(this.getDOMNode()),
                promise = $.post($form.attr('action'), $form.serialize())
                            .always(this.unlock);

            this.setState({locked: true});

            if (!this.props.shift._id) {
                promise.done(function () {

                    if (!this.isMounted()) return;

                    this.refs.nameInput.getDOMNode().value = this.props.shift.name;
                    this.refs.fromInput.getDOMNode().value = this.props.shift.from;
                    this.refs.toInput.getDOMNode().value = this.props.shift.to;

                    this.props.reloadShifts();
                }.bind(this));
            }
        },
        killMe: function (e) {
            e.preventDefault();

            var $form = $(this.getDOMNode());

            $.ajax({url: $form.attr('action'), type: 'DELETE'})
                .done(this.props.reloadShifts);
        },
        render: function () {

            return React.DOM.form( {onSubmit:this.handleSubmit, action:pager.urls.ajax + 'admin/work_shift' + (this.props.shift._id ? '/' + this.props.shift._id : '')}, 
                React.DOM.div( {className:"row"}, 
                    React.DOM.div( {className:"small-4 columns"}, 
                        React.DOM.input( {required:true, type:"text", ref:"nameInput", name:"name", defaultValue:this.props.shift.name} )
                    ),
                    React.DOM.div( {className:"small-3 columns"}, 
                        React.DOM.input( {required:true, type:"time", ref:"fromInput", name:"from", defaultValue:this.props.shift.from} )
                    ),
                    React.DOM.div( {className:"small-3 columns"}, 
                        React.DOM.input( {required:true, type:"time", ref:"toInput", name:"to", defaultValue:this.props.shift.to} )
                    ),
                    React.DOM.div( {className:"small-1 columns"}, 
                        React.DOM.a( {onClick:this.handleSubmit, className:"button postfix success"}, 
                            React.DOM.i( {className:"fi-save"})
                        )
                    ),
                    React.DOM.div( {className:"small-1 columns"}, 
                        this.props.shift._id
                            ? React.DOM.a( {className:"button postfix alert", onClick:this.killMe}, 
                                    React.DOM.i( {className:"fi-x"})
                                )

                            : null
                    )
                )
            );
        }

    });

    var Shifts = React.createClass({displayName: 'Shifts',

        getInitialState: function () {
            return {
                shifts: [],
                defaultShift: {name: '', from: '08:00', to: '17:00'}
            };
        },
        componentDidMount: function () {
            this.reloadShifts();
        },
        reloadShifts: function () {
            $.get(pager.urls.ajax + 'admin/work_shifts')
                .done(function (s) {

                    if (!this.isMounted()) return;

                    this.setState({shifts: s});
                }.bind(this))
        },
        render: function () {
            return React.DOM.div(null, 
                React.DOM.div( {className:"row"}, 
                    React.DOM.div( {className:"small-4 columns"}, "Nome do Turno"),
                    React.DOM.div( {className:"small-3 columns"}, "Início"),
                    React.DOM.div( {className:"small-3 columns"}, "Fim"),
                    React.DOM.div( {className:"small-2 columns text-center"}, '#')
                ),React.DOM.br(null),
                this.state.shifts.map(function (shift) {
                    return ShiftEditor( {key:shift._id, shift:shift, reloadShifts:this.reloadShifts} )
                }.bind(this)),

                ShiftEditor( {reloadShifts:this.reloadShifts, shift:this.state.defaultShift} )
            );
        }
    });

    return Shifts;
});