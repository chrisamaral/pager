/** @jsx React.DOM */
define(function(){
    var Tasks, TaskFinderForm;

    TaskFinderForm = React.createClass({displayName: 'TaskFinderForm',
        render: function () {
            return React.DOM.form(null

            );
        }
    });
    TaskList = React.createClass({displayName: 'TaskList',
        render: function(){
            return React.DOM.div(null);
        }
    });
    Tasks = React.createClass({displayName: 'Tasks',
        render: function () {
            return React.DOM.div( {id:"Tasks"}, 
                TaskFinderForm(null ),
                TaskList(null )
            );
        }
    });

    return Tasks;
});