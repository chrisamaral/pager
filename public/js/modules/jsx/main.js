/** @jsx React.DOM */

define(['../helpers/utils'], function (utils) {
    var zIndexAltered = false, Root, PageList, uri = location.pathname.split('/');

    if (!uri[1]) {
        $('<h1>Erro</h1>').appendTo('body');
        return;
    }

    pager.org = {id: uri[1]};

    setInterval(function() {

        if ($('.clearing-blackout').length) {
            $('#TopBar').css('z-index', '-1');
            zIndexAltered = true;
        } else if( zIndexAltered ) {
            $('#TopBar').css('z-index', '');
            zIndexAltered = false;
        }

    }, 1000);

    PageList = React.createClass({
        render: function () {

            var icons = {
                    'Administração': 'fi-lock',
                    'Configurações': 'fi-wrench'
                },
                pages = this.props.pages.map(function (page) {
                    var icon = icons[page.name];

                    return <li key={page.name}>
                        <a href={page.url}>
                                {icon && <i className={'the-icon ' + icon}></i>}
                                {page.name}
                        </a>
                    </li>;

                }), baseUrl = this.props.urls.base;


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

    Root = React.createClass({
        componentDidMount: function () {
            $(document).foundation();
        },
        render: function () {
            var App = this.props.app;

            return (
                <div data-offcanvas className="off-canvas-wrap">
                    <div className="inner-wrap">
                        <nav id="TopBar" className="tab-bar">
                            <section className="middle tab-bar-section">
                                <h1 className="title">Pager - Sim Tv</h1>
                            </section>
                            <section className="right-small">
                                <a className="right-off-canvas-toggle menu-icon">
                                    <span></span>
                                </a>
                            </section>
                        </nav>
                        <aside className="right-off-canvas-menu">
                            <PageList urls={this.props.urls} pages={this.props.pages} />
                        </aside>
                        <section className="main-section">
                            { App &&
                                <App view={this.props.view} args={this.props.args} lib={this.props.lib} />
                            }
                        </section>
                    </div>
                </div>
            );
        }
    });

    pager.pages = [];
    pager.components = {};

    function loadFromLocalStorage(item) {
        var aux = localStorage.getItem('pager.' + item);
        pager[item] = aux && JSON.parse(aux) || pager[item];
    }

    if (Modernizr.localstorage) {
        ['urls', 'pages', 'org', 'user'].forEach(function (item) {
            loadFromLocalStorage(item);
        });
    }




    function saveAll(){
        ['urls', 'pages', 'org', 'user', 'org', 'build'].forEach(function (key) {
            var item = pager[key];
            if (item && Modernizr.localstorage) {
                localStorage.setItem('pager.' + key, JSON.stringify(item));
            }
        });
    }

    function init () {

        pager.rootElem = React.renderComponent(<Root urls={pager.urls} pages={pager.pages} />,
            document.getElementById('container'));

        $.get('/' + pager.org.id + '/api/pages')
            .done(function (pages) {
                if (pages instanceof Array) {
                    pager.pages = pages.concat();
                    pager.rootElem.setProps({pages: pager.pages});
                }
                saveAll();
            });

        require.run('./app');
    }

    if (pager.org) {
        $.get('/' + pager.org.id + '/api')
            .done(function (result) {
                if (_.isObject(result)) {
                    _.merge(pager, result);
                    saveAll();
                }
            }).always(init);
    }

    return pager;
});