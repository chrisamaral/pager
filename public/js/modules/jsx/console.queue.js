/** @jsx React.DOM */
define(function(){
    var TaskPendingApproval, Queue, SubTask;

    SubTask = React.createClass({
        getInitialState: function () {
            return {obsError: false};
        },
        render: function(){
            var txtClasses = React.addons.classSet({error: this.state.obsError, 'default-textarea': true}),
                AttrTable = pager.components.AttrTable;
            return <div className='panel sequential'>
                <AttrTable attrs={this.props.task.attrs} />
                <form>
                    <textarea className={txtClasses} placeholder='Observação' name='obs'></textarea>
                    {this.state.obsError ? <small className="error">Campo necessário</small> : null}
                    <div className='text-right'>
                        <button className='tiny alert button' type='submit'>Rejeitar</button>
                        <button className='tiny success button' type='submit'>Aceitar</button>
                    </div>
                </form>
            </div>;
        }
    });

    PicSlide = React.createClass({
        componentDidMount: function(){
            $(this.getDOMNode()).foundation();
        },
        render: function(){
            return <div className='panel'>
                <ul className="clearing-thumbs small-block-grid-2 medium-block-grid-3 large-block-grid-4" data-clearing>
                    {this.props.pics.map(function(p, index){
                        var pic = p && p.src ? p : {src: p};
                        return <li key={index}>
                            <a href={pic.src}>
                                {pic.descr
                                    ? <img className='th' data-caption={pic.descr} src={pic.src} />
                                    : <img className='th' src={pic.src} />
                                }
                            </a>
                        </li>;
                    })}
                </ul>
            </div>;
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
    TaskPendingApproval = React.createClass({
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

            return <div className='activity-item panel'>
                <span className='activity-timestamp'>{timestamp}</span>

                <div className='activity-header'>
                    <div className='activity-avatar'>
                        <img src={event.subject.avatar.thumb} />
                    </div>
                    <div className='activity-summary'>
                        <UserLink user={event.subject} />
                        <span>{' ' + event.predicate + ' '}</span>
                        <ObjectLink object={event.object} />
                    </div>
                </div>
                {event.pics && event.pics.length ? <PicSlide pics={event.pics} /> : null}
                <div className={toggleClasses}>
                    <AttrTable attrs={event.attrs} />
                    {event.tasks.map(function(task){
                        return <SubTask key={task.id} task={task} />;
                    })}
                </div>
                <div className='activity-footer'>
                    <button className='tiny secondary button' onClick={this.toggleStuff}>
                        {this.state.infoShown ? 'menos' : 'mais'}</button>
                </div>
            </div>;
        }
    });

    Queue = React.createClass({
        render: function () {

            return <div id='Queue' className='leftMapControl'>
                <div className='controlIco'><i className='fi-clock'></i></div>
                <div className='controlContent'>
                    <h4>Ordens Pendentes</h4>
                    <div className='panel contained activity-feed'>
                        { _.isArray(this.props.items)
                            ? this.props.items.map(function (item) {
                                    return <TaskPendingApproval item={item} key={item.id} />;
                                })
                            : null
                        }
                    </div>
                </div>
            </div>;

        }
    });
    return Queue;
});