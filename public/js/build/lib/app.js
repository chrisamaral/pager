require.ensure(["../ext/aviator/main"],function(d){var c=d("../ext/aviator/main"),e,f={};e=React.createClass({displayName:"AppContainer",render:function(){var a=this.props.view||null;return React.DOM.div({id:"appContainer"},a&&a({args:this.props.args,lib:this.props.lib}))}});c.setRoutes({target:{goToMainPage:function(a){var b=pager.user.home?pager.user.home.getValue():"console";c.navigate(a.uri+("/"===a.uri.charAt(a.uri.length-1)?"":"/")+b)},setupLayout:function(){pager.rootElem.setProps({app:e})}},
"/*":"setupLayout","/:org":{"/":"goToMainPage","/console":{target:function(a){var b={init:function(){d(["./"+a],function(a){a.librarian.init(pager.rootElem,function(b){pager.rootElem.setProps({view:a.component,args:{},lib:b})})})},setArgs:function(a){pager.rootElem.setProps({args:a.params})}};f[a]&&_.merge(b,f[a]);return b}("console"),"/*":"init","/:day":"setArgs","/:day/:locations":"setArgs"}}});c.dispatch()});
