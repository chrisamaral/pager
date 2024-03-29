/** @jsx React.DOM */
define(['./console.schedule'], function (Schedule) {

    var RightPanelToolbar = React.createClass({displayName: 'RightPanelToolbar',

        getInitialState: function () {
            return {CSVDataURI: null};
        },

        componentDidMount: function () {
            $(this.getDOMNode()).foundation();
            $(this.refs.cleanEmAll.getDOMNode()).on('click', this.props.emptySchedule);
        },

        exportToCSV: function () {

            function getTimeString (val) {
                var d = _.isDate(val)
                    ? val
                    : new Date(val);

                return d.toLocaleString();
            }

            function escapeCSVCell (str){

                if (!_.isString(str)) str = '' + str;

                str = str.replace(/"/g, '""');

                return (str.search(/("|,|\n)/g) >= 0)
                    ? '"' + str + '"'
                    : str;
            }
            var csvText, schedules, blob;

            csvText = [
                "Início estimado",
                "Fim estimado",
                "Encarregado",
                "Tipo Ordem",
                "Referência",
                "Referência:::Tipo",
                "Referência:::ID",
                "Deslocamento",
                "Endereço"].map(escapeCSVCell).join(",") + "\n";

            schedules = _.flatten(_.map(this.props.schedule, function (schedule) {
                return _.map(schedule.tasks, function (task) {
                    return _.merge({worker: schedule.worker}, task);
                });
            }));

            schedules.forEach(function (schedule, index) {
                var tmp = [];

                tmp.push(getTimeString(schedule.schedule.ini));
                tmp.push(getTimeString(schedule.schedule.end));

                tmp.push(schedule.worker.name);

                tmp.push(_.uniq(schedule.work_orders.map(function (t) {
                    return t.type;
                })).join(", "));

                schedule.target && schedule.target.name
                    ? tmp.push(schedule.target.name)
                    : tmp.push('---');

                schedule.target && schedule.target.type
                    ? tmp.push(schedule.target.type)
                    : tmp.push('---');

                schedule.target && schedule.target.sys_id
                    ? tmp.push(schedule.target.sys_id)
                    : tmp.push('---');

                (schedule.directions)
                    ? tmp.push(schedule.directions.distance.text + " | " + schedule.directions.duration.text)
                    : tmp.push('---');

                tmp.push(schedule.address.address);

                tmp = tmp.map(escapeCSVCell).join(",");

                csvText += index < schedules.length ? tmp + "\n" : tmp;
            });

            blob = new Blob([csvText], {type: 'text/csv'});
            this.setState({CSVDataURI: URL.createObjectURL(blob)});
        },
        cleanCSV: function () {
            this.setState({CSVDataURI: null});
        },

        render: function () {
            return React.DOM.div({id: "RightPanelToolbar"}, 
                React.DOM.div({className: "row"}, 
                    React.DOM.div({className: "medium-12 columns"}, 
                        this.state.CSVDataURI

                            ? React.DOM.a({className: "button success small", href: this.state.CSVDataURI, 
                        download: 'Extração-Pager-' + (new Date()).toLocaleString() + '.csv', 
                        onClick: this.cleanCSV}, "Baixar")

                            : React.DOM.button({className: "button secondary small", onClick: this.exportToCSV}, "Exportar"), 
                            
                        React.DOM.a({'data-dropdown': "RightPanelToolbarDropDown", className: "button secondary small dropdown"}, "Opções")
                    )
                ), 
                React.DOM.ul({id: 'RightPanelToolbarDropDown', 'data-dropdown-content': true, className: "f-dropdown"}, 
                    React.DOM.li(null, React.DOM.a({ref: "cleanEmAll"}, "Limpar"))
                )
            );
        }
    });

    var RightPanel = React.createClass({displayName: 'RightPanel',

        getInitialState: function() {
            return {contentVisible: true, myWidth: null};
        },

        componentDidMount: function () {

            var handler = _.throttle(
                function () {

                    if (!this.isMounted()) return $(['#Console', window]).off('resize', handler);

                    var $elem = $(this.getDOMNode());

                    if (this.isMounted() && $elem && $('#Console').width() - $('#LeftPanel').width() !== $elem.width()) {

                        this.setState({myWidth: $('#Console').width() - $('#LeftPanel').width()});
                    }

                }.bind(this),
                100);

            $(['#Console', window]).on('resize', handler);

        },

        toggleContent: function () {
            this.setState({contentVisible: !this.state.contentVisible});
        },

        cleanScheduleAndUpdate: function () {
            $.ajax({type: 'DELETE', url: pager.urls.ajax + 'console/schedules/' + this.props.day})
                .done(function () {

                    this.props.updateSchedule();
                    this.props.syncQueries();

                }.bind(this));
        },

        render: function () {
            var RouterCfg = pager.components.RouterCfg,
                s = {},
                actuallyVisible = this.state.contentVisible
                    && (this.props.schedule.length || this.props.routerLoader);

            if (actuallyVisible) s.width = this.state.myWidth || $('#Console').width() - $('#LeftPanel').width();

            return React.DOM.main({id: "RightPanel", style: s}, 
                actuallyVisible
                    ? React.DOM.div({id: "RightPanelContent"}, 
                        this.props.routerLoader
                            ? React.DOM.div(null, 
                            React.DOM.h3({className: "controlTitle"}, "Configurações de Roteamento"), 
                            RouterCfg({day: this.props.routerLoader._day, onSet: this.props.routerLoader})
                        )
                            : null, 
                            
                        this.props.schedule.length
                            ? Schedule({setScheduleMover: this.props.setScheduleMover, selectedSchedule: this.props.selectedSchedule, schedule: this.props.schedule, day: this.props.day, syncQueries: this.props.syncQueries, updateSchedule: this.props.updateSchedule})
                            : null, 
                            
                        this.props.schedule.length
                            ? RightPanelToolbar({schedule: this.props.schedule, emptySchedule: this.cleanScheduleAndUpdate})
                            : null
                            

                )
                    : null, 
                    
                this.props.schedule.length || this.props.routerLoader
                    ?
                    React.DOM.div({id: "ToggleRightPanel", className: React.addons.classSet({lonesome: !actuallyVisible})}, 
                        React.DOM.i({onClick: this.toggleContent, className: "fi-arrows-expand"})
                    )
                    : null
                    
            );
        }
    });

    return RightPanel;
});