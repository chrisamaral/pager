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
    var StatusForm = React.createClass({
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
            return <fieldset>
                <legend className='textCapitalize'>{this.props.name}</legend>
                <form onSubmit={this.handleSubmit}>
                    <div className='row'>
                        <div className='medium-12 columns'>
                            <label>Novo status
                                <input type='text' ref='newRef' name='reference' disabled={this.state.locked} required />
                            </label>
                        </div>
                    </div>
                </form>
                <ul>
                    {this.props.references.map(function (val) {
                        return <li key={val} className='textCapitalize'>{val}
                            <a onClick={this.removeOne} className='killStatus close'
                                href={pager.urls.ajax + 'admin/status/' +
                                    this.props.name + '/' + val}>{'×'}</a>
                        </li>;
                    }.bind(this))}
                </ul>
            </fieldset>
        }
    });
    var Statuses = React.createClass({
        getInitialState: function () {
            return {statuses: parseStatuses()};
        },
        reloadAll: function () {
            $.get(pager.urls.ajax + 'admin/statuses')
                .done(function(result) {
                    if (!this.isMounted()) return;
                    this.setState({statuses: parseStatuses(result)});
                }.bind(this));
        },
        componentDidMount: function () {
            this.reloadAll();
        },
        render: function () {
            return <div className='medium-block-grid-3'>
                {_.map(this.state.statuses, function (references, name) {
                    return <StatusForm reloadAll={this.reloadAll} name={name} references={references} key={name} />;
                }.bind(this))}
            </div>;
        }
    });

    return Statuses;
});