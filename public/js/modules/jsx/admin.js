/** @jsx React.DOM */
define(function () {

    var Aviator = pager.Aviator, Component = null;

    LazyLoad.css("/css/admin.css");

    var SubNavItem = React.createClass({
        selectMe: function (e) {
            e.preventDefault();
            Aviator.navigate($(e.currentTarget).attr('href'));
        },
        render: function () {
            var opt = this.props.option,
                classes = React.addons.classSet(
                            {active: opt.id === this.props.currentView});

            return <li className={classes} key={opt.id}>
                    <a onClick={this.selectMe} href={'/' + pager.org.id + '/admin/' + opt.id}>{opt.name}</a>
            </li>;
        }
    });

    var SubNav = React.createClass({
        componentDidMount: function () {
            if(!this.props.currentView) this.props.setView(this.props.options[0].id);
        },
        render: function () {
            return <ul id='AdminSideNav' className='side-nav'>
                {
                    this.props.options.map(function(opt){
                        return <SubNavItem key={opt.id} option={opt} setView={this.props.setView} currentView={this.props.currentView} />;
                    }.bind(this))
                }
            </ul>;
        }
    });

    var Main = React.createClass({
        getInitialState: function () {
            return {
                currentView: this.props.args.view,
                options: [],
                loadingView: false
            };
        },

        componentWillReceiveProps: function (newProps) {
            this.setView(newProps.args.view);
        },

        setView: function (newVal) {

            if (!this.isMounted() || !newVal) return;

            Component = null;

            this.setState({
                currentView: newVal,
                loadingView: true
            });

            require(['./admin.' + newVal], function (Comp) {

                Component = Comp;
                this.setState({loadingView: false});

            }.bind(this));

        },

        componentDidMount: function () {

            $.get(pager.urls.ajax + 'admin/options')
                .done(function (options) {

                    if (!this.isMounted()) return;

                    this.setState({options: options});
                }.bind(this));

            if (!Component && this.state.currentView) this.setView(this.state.currentView);
        },

        render: function () {
            return <div id='AdminPanel' className='panel'>
                <div className='row'>
                    <div className='small-3 columns'>
                        {this.state.options.length
                            ? <SubNav options={this.state.options} currentView={this.state.currentView} setView={this.setView} />
                            : null}
                    </div>
                    <div id='InnerComponent' className='small-9 columns'>
                        {Component && !this.state.loadingView
                            ? <Component />
                            : <div>...</div>}
                    </div>
                </div>
            </div>
        }
    });

    return Main;
});