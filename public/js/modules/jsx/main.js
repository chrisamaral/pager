/** @jsx React.DOM */

define(function () {
    $(document).foundation();
    var PageList, cortex, pageMenu, mainComponent;
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

    pager.pages = [];
    cortex = new Cortex(pager);
    pageMenu = React.renderComponent(<PageList urls={cortex.urls} pages={cortex.pages} />, 
        $('#container .right-off-canvas-menu')[0]);
    
    cortex.on("update", function(newData) {
        pageMenu.setProps({pages: newData.pages});
    });
    
    $.get('/' + cortex.org.id.getValue() + '/pages')
        .done(function(pages){
            if(pages instanceof Array){
                pages.forEach(function(page){
                    cortex.pages.push(page);
                });
            }
        });

    return cortex;
});
