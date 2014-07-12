/** @jsx React.DOM */

define(['../helpers/utils', '../helpers/consts'], function (utils, consts) {
    
    pager.constant = consts;

    var zIndexAltered = false, Root, PageList, uri = location.pathname.split('/');

    if (!uri[1]) {
        $('body').html('<h1>Erro</h1>');
        return;
    }

    pager.org = {id: uri[1]};

    /*
    setInterval(function() {

        if ($('.clearing-blackout').length) {
            $('#TopBar').css('z-index', '-1');
            zIndexAltered = true;
        } else if( zIndexAltered ) {
            $('#TopBar').css('z-index', '');
            zIndexAltered = false;
        }

    }, 1000);
    */
    
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
            $('#ScrollRoot').scroll(
                _.throttle(
                    function(){
                        $('.f-dropdown.open').removeClass('open');
                    }, 300
                )
            );
        },
        render: function () {
            var App = this.props.app;
            return (
                <div id='ScrollRoot' data-offcanvas className="off-canvas-wrap">
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
                                <App view={this.props.view}
                                        args={this.props.args}
                                            lib={this.props.lib} />
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
        var aux = localStorage.getItem('pager.' + pager.org.id + '.' + item);
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
                localStorage.setItem('pager.' + pager.org.id + '.' + key, JSON.stringify(item));
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

    $( document ).ajaxError(function( event, jqxhr ) {

        if (jqxhr.status === 401) {

            if (pager.urls) {
                location.href = pager.urls.base + '/login';
                return;
            }

            location.reload(true);
        }
    });

    if (pager.org) {
        $.get('/' + pager.org.id + '/api')
            .done(function (result) {
                if (_.isObject(result)) {
                    _.merge(pager, result);
                    pager.urls.ajax = '/' + pager.org.id + '/api/';
                    saveAll();
                }
            }).always(init);
    }

    return pager;
});