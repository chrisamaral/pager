/** @jsx React.DOM */
define(function(){
    var Tasks, TaskFinderForm;

    TaskFinderForm = React.createClass({
        render: function () {
            return <form>

            </form>;
        }
    });
    TaskList = React.createClass({
        render: function(){
            return <div></div>;
        }
    });
    Tasks = React.createClass({
        render: function () {
            return <div id='Tasks'>
                <TaskFinderForm />
                <TaskList />
            </div>;
        }
    });

    return Tasks;
});