define(["../helpers/utils"],function(){$(document).foundation();var a=!1;setInterval(function(){$(".clearing-blackout").length?($("#TopBar").css("z-index","-1"),a=!0):a&&($("#TopBar").css("z-index",""),a=!1)},1E3);var c,e=React.createClass({displayName:"PageList",render:function(){var d={"Administra\u00e7\u00e3o":"fi-lock","Configura\u00e7\u00f5es":"fi-wrench"},b=this.props.pages.map(function(a){var b=d[a.name];return React.DOM.li({key:a.name},React.DOM.a({href:a.url},b&&React.DOM.i({className:"the-icon "+
b}),a.name))}),a=this.props.urls.base;b.unshift(React.DOM.li({key:"usr.home"},React.DOM.a({href:a+"/home"},React.DOM.i({className:"the-icon fi-home"}),"In\u00edcio")));b.unshift(React.DOM.li({key:"placeholder"},React.DOM.label(null,"Menu")));b.push(React.DOM.li({key:"usr"},React.DOM.label(null,"Usu\u00e1rio")));b.push(React.DOM.li({key:"usr.settings"},React.DOM.a({href:a+"/user"},React.DOM.i({className:"the-icon fi-torso"}),"Configura\u00e7\u00f5es")));b.push(React.DOM.li({key:"usr.logout"},React.DOM.a({href:a+
"/logout"},React.DOM.i({className:"the-icon fi-x"}),"Logout")));return React.DOM.ul({className:"off-canvas-list"},b)}});pager.pages=[];pager.components={};c=React.renderComponent(e({urls:pager.urls,pages:pager.pages}),$("#container .right-off-canvas-menu")[0]);$.get("/"+pager.org.id+"/api/pages").done(function(a){a instanceof Array&&(pager.pages=a.concat(),c.setProps({pages:pager.pages}))});require.run("./app");return pager});