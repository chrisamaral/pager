/** @jsx React.DOM */
define(function(){
    var AttrItem, AttrTable, TaskPendingApproval, Queue, SubTasks;

    AttrItem = React.createClass({
        render: function () {
            var attr = this.props.attr,
                classes = React.addons.classSet({
                    'main-attr': attr.relevance === 3,
                    'important-attr': attr.relevance === 2
                }),
                val = attr.relevance === 3 ? attr.value.toUpperCase() : attr.value;
            return <tr className={classes}>
                {attr.relevance !== 3 ? <td>{attr.descr}</td> : null}
                <td colSpan={attr.relevance === 3 ? 2 : 1}>
                    {attr.url
                        ? <a href={attr.url} target='_blank'>{val}</a>
                        : val
                    }
                </td>
            </tr>;
        }
    });

    AttrTable = React.createClass({
        render: function () {
            return <table className='attr-table'>
                    <tbody>
                        {this.props.attrs.sort(function(a, b){

                            a.relevance = a.relevance || 1;
                            b.relevance = b.relevance || 1;

                            return a.relevance > b.relevance ? -1 : 1;
                        }).map(function(attr){
                            return <AttrItem
                                key={Foundation.utils.random_str(10)}
                                attr={attr} />;
                        })}
                    </tbody>
                </table>;
        }
    });

    SubTask = React.createClass({
        getInitialState: function () {
            return {obsError: false};
        },
        render: function(){
            var txtClasses = React.addons.classSet({error: this.state.obsError, 'default-textarea': true});
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

            $(document.body).on("open.clearing.fndtn", function(event) {
                console.info("About to open thumbnail with src ", $('img', event.target).attr('src'));
            });
        },
        render: function(){
            return <div className='panel'>
                <ul className="clearing-thumbs oksized-thumbs" data-clearing>
                    {this.props.pics.map(function(p){
                        var pic = p && p.src ? p : {src: p};
                        return <li className='panel radio' key={Foundation.utils.random_str(10)}>
                            <a href={pic.src}>
                                {pic.descr
                                    ? <img data-caption={pic.descr} src={pic.src} />
                                    : <img src={pic.src} />
                                }
                            </a>
                        </li>;
                    })}
                </ul>
            </div>;
        }
    });
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
                });

            return <div className='activity-item panel'>
                <span className='activity-timestamp'>{event.timestamp.toLocaleTimeString()}</span>

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

            return <div id='Queue'>
                <h4>Ordens Pendentes</h4>
                <div className='activity-feed'>
                    {this.props.items.map(function (item) {
                        return <TaskPendingApproval item={item} key={item.id} />;
                    }) }
                </div>
            </div>;

        }
    });
    return Queue;
});