/** @jsx React.DOM */

define(['../helpers/utils'], function () {
    $(document).foundation();
    var zIndexAltered = false;
    setInterval(function() {

        if ($('.clearing-blackout').length) {
            $('#TopBar').css('z-index', '-1');
            zIndexAltered = true;
        } else if( zIndexAltered ) {
            $('#TopBar').css('z-index', '');
            zIndexAltered = false;
        }

    }, 1000);

    var pageMenu,
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

    pager.pages = [];
    pager.components = {};
    pageMenu = React.renderComponent(<PageList urls={pager.urls} pages={pager.pages} />,
        $('#container .right-off-canvas-menu')[0]);
    

    $.get('/' + pager.org.id + '/api/pages')
        .done(function (pages) {
            if (pages instanceof Array) {
                pager.pages = pages.concat();
                pageMenu.setProps({pages: pager.pages});
            }
        });

    require.run('./app');
    return pager;
});