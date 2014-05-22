/** @jsx React.DOM */

define(function () {
    var Pager, PageList, cortex, mainComponent;
    //LazyLoad.css('');
    PageList = React.createClass({
        render: function () {

            var icons = {
                    'Administração': 'fi-lock',
                    'Configurações': 'fi-wrench'
                },
                pages = this.props.pages.map(function (page) {
                    var icon = icons[page.name.getValue()];

                    return <li key={page.name.getValue()}>
                        <a href={page.url.getValue()}>
                            {icon && <i className={'the-icon ' + icon}></i>}
                            {page.name.getValue()}
                        </a>
                    </li>;

                }), baseUrl = this.props.urls.base.getValue();


            pages.unshift(<li key={'usr.home'}>
                <a href={baseUrl + '/home'}>
                    <i className='the-icon fi-home'></i>
                    Início
                </a>
            </li>);
            pages.unshift(<li key={'placeholder'}><label>Menu</label></li>);
            pages.push(<li key='usr'><label>Usuário</label></li>);
            pages.push(<li key={'usr.settings'}>
                <a href={baseUrl + '/user'}>
                    <i className='the-icon fi-torso'></i>
                    Configurações
                </a>
            </li>);
            pages.push(<li key={'usr.logout'}>
                <a href={baseUrl + '/logout'}>
                    <i className='the-icon fi-x'></i>
                    Logout
                </a>
            </li>);

            return <ul className="off-canvas-list">{pages}</ul>;
        }
    });

    Pager = React.createClass({
        getInitialState: function(){
            return {menuOpen: false};
        },
        toggleMenu: function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.setState({menuOpen: !this.state.menuOpen});
        },
        render: function () {
            var classes = React.addons.classSet({"off-canvas-wrap": true, "move-left": this.state.menuOpen});
            return <div className={classes} data-offcanvas>
                <div className='inner-wrap'>
                    <nav className="tab-bar">
                        <section className="middle tab-bar-section">
                            <h1 className="title">{'Pager - ' + pager.org.name}</h1>
                        </section>
                        <section className="right-small">
                            <a className="right-off-canvas-toggle menu-icon" onClick={this.toggleMenu}>
                                <span></span>
                            </a>
                        </section>
                    </nav>
                    <aside className="right-off-canvas-menu">
                        <PageList urls={this.props.pager.urls} pages={this.props.pager.pages} />
                    </aside>
                    <section className='main-section'>
                        <div className="row">
                            <div className="large-12 columns">
                                <br/>
                                <h4>Boring</h4>
                            </div>
                        </div>
                    </section>
                </div>
            </div>;
        }
    });

    pager.pages = [];
    cortex = new Cortex(pager);
    mainComponent = React.renderComponent(<Pager pager={cortex}/>, document.getElementById('container'));
    /*
    cortex.on("update", function(newData) {
      mainComponent.setProps({pager: newData});
    });
    */
    $.get('/' + cortex.org.id.getValue() + '/pages')
        .done(function(pages){
            if(pages instanceof Array){
                pages.forEach(function(page){
                    cortex.pages.push(page);
                });
            }
        });

    return {cortex: cortex, root: mainComponent};
});
