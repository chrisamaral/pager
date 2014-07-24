/** @jsx React.DOM */

define(function () {
    var TypeForm = React.createClass({

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
            return <form onSubmit={this.handleSubmit}>
                <div className='panel'>
                    <div className='row'>
                        <div className='medium-7 columns'>
                            <input type='text' name='name' ref='nameInput' required valueLink={this.linkState('name')} placeholder='Nome' />
                        </div>
                        <div className='medium-3 columns'>
                            <input type='number' min={0} name='duration' ref='durationInput' valueLink={this.linkState('duration')} placeholder='Minutos' />
                        </div>
                        <div className='medium-1 columns'>
                            <button className='fi-save button postfix success'></button>
                        </div>
                        <div className='medium-1 columns'>
                            {this.state._id
                                ? <button className='fi-x button postfix alert' onClick={this.killMe}></button>
                                : null}
                        </div>
                    </div>
                </div>
            </form>;
        }
    });
    var Types = React.createClass({

        getInitialState: function () {
            return {availableTypes: [], defaultType: {name: '', duration: 30}};
        },
        reloadTypes: function () {
            $.get(pager.urls.ajax + 'admin/types')
                .done(function (types) {
                    if (!this.isMounted()) return;
                    this.setState({availableTypes: types});
                }.bind(this));
        },
        componentDidMount: function () {
            this.reloadTypes();
        },

        render: function () {
            return <div>
                {this.state.availableTypes.map(function (t) {
                    return <TypeForm type={t} key={t._id} reloadAll={this.reloadTypes} />;
                }.bind(this))}
                <TypeForm type={this.state.defaultType} reloadAll={this.reloadTypes} />
            </div>;
        }
    });
    return Types;
});