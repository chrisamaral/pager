/** @jsx React.DOM */
define(function(){
    var TaskPendingApproval, Queue, SubTask;

    SubTask = React.createClass({displayName: 'SubTask',
        getInitialState: function () {
            return {obsError: false};
        },
        render: function(){
            var txtClasses = React.addons.classSet({error: this.state.obsError, 'default-textarea': true}),
                AttrTable = pager.components.AttrTable;
            return React.DOM.div( {className:"panel sequential"}, 
                AttrTable( {attrs:this.props.task.attrs} ),
                React.DOM.form(null, 
                    React.DOM.textarea( {className:txtClasses, placeholder:"Observação", name:"obs"}),
                    this.state.obsError ? React.DOM.small( {className:"error"}, "Campo necessário") : null,
                    React.DOM.div( {className:"text-right"}, 
                        React.DOM.button( {className:"tiny alert button", type:"submit"}, "Rejeitar"),
                        React.DOM.button( {className:"tiny success button", type:"submit"}, "Aceitar")
                    )
                )
            );
        }
    });

    PicSlide = React.createClass({displayName: 'PicSlide',
        componentDidMount: function(){
            $(this.getDOMNode()).foundation();

            $(document.body).on("open.clearing.fndtn", function(event) {
                console.info("About to open thumbnail with src ", $('img', event.target).attr('src'));
            });
        },
        render: function(){
            return React.DOM.div( {className:"panel"}, 
                React.DOM.ul( {className:"clearing-thumbs oksized-thumbs", 'data-clearing':true}, 
                    this.props.pics.map(function(p, index){
                        var pic = p && p.src ? p : {src: p};
                        return React.DOM.li( {className:"panel radio", key:index}, 
                            React.DOM.a( {href:pic.src}, 
                                pic.descr
                                    ? React.DOM.img( {'data-caption':pic.descr, src:pic.src} )
                                    : React.DOM.img( {src:pic.src} )
                                
                            )
                        );
                    })
                )
            );
        }
    });
    function anyDate (d) {
        var dd = new Date();

        if (_.isString(d)) {
            return new Date(d);
        }

        if (_.isNumber(d)) {
            dd.setTime(d);
        }

        return _.isDate(d) ? dd.setTime(d.getTime()) : dd;
    }
    TaskPendingApproval = React.createClass({displayName: 'TaskPendingApproval',
        getInitialState: function(){
            return {infoShown: false};
        },
        toggleStuff: function () {
            this.setState({infoShown: !this.state.infoShown});
        },
        render: function () {
            var event = this.props.item,
                UserLink = pager.components.UserLink,
                ObjectLink = pager.components.ObjectLink,
                toggleClasses = React.addons.classSet({
                    'activity-full': true,
                    panel: true,
                    contained: true,
                    hide: !this.state.infoShown
                }),
                timestamp = anyDate(event.timestamp),
                AttrTable = pager.components.AttrTable;

            return React.DOM.div( {className:"activity-item panel"}, 
                React.DOM.span( {className:"activity-timestamp"}, timestamp),

                React.DOM.div( {className:"activity-header"}, 
                    React.DOM.div( {className:"activity-avatar"}, 
                        React.DOM.img( {src:event.subject.avatar.thumb} )
                    ),
                    React.DOM.div( {className:"activity-summary"}, 
                        UserLink( {user:event.subject} ),
                        React.DOM.span(null, ' ' + event.predicate + ' '),
                        ObjectLink( {object:event.object} )
                    )
                ),
                event.pics && event.pics.length ? PicSlide( {pics:event.pics} ) : null,
                React.DOM.div( {className:toggleClasses}, 
                    AttrTable( {attrs:event.attrs} ),
                    event.tasks.map(function(task){
                        return SubTask( {key:task.id, task:task} );
                    })
                ),
                React.DOM.div( {className:"activity-footer"}, 
                    React.DOM.button( {className:"tiny secondary button", onClick:this.toggleStuff}, 
                        this.state.infoShown ? 'menos' : 'mais')
                )
            );
        }
    });

    Queue = React.createClass({displayName: 'Queue',
        render: function () {

            return React.DOM.div( {id:"Queue"}, 
                React.DOM.h4(null, "Ordens Pendentes"),
                React.DOM.div( {className:"activity-feed"}, 
                    this.props.items.map(function (item) {
                        return TaskPendingApproval( {item:item, key:item.id} );
                    }) 
                )
            );

        }
    });
    return Queue;
});