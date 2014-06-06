/** @jsx React.DOM */

define(['../helpers/utils', '../ext/strftime'], function(utils, strftime){
    var NativeDate, hasDate = Modernizr.inputtypes.date, MaskedDate;

    function sanitizeDate(d) {
        function s(x, t){
            if (t === 'y') {
                return _.isString(x) && x.length === 4 ? x : (x + '____').substr(0, 4);
            }
            return _.isString(x) && x.length === 2 ? x : (x + '__').substr(0, 2);
        }

        var val = d.replace(/\D/g,''),
            d = val.substr(6, 2),
            m = val.substr(4, 2),
            y = val.substr(0, 4);

        return s(y, 'y') + '-' + s(m, 'm') + '-' + s(d, 'd');

    }

    MaskedDate = React.createClass({
        getInitialState: function () {
            var initial = strftime('%Y-%m-%d', new Date());
            return {value: initial, initial: initial};
        },
        validDate: function (e) {
            var elem = e.currentTarget,
                pos = utils.doGetCaretPosition(elem),
                clean = sanitizeDate(elem.value),
                a0 = this.state.value.charAt(pos - 1),
                p0 = this.state.value.charAt(pos),
                a1 = clean.charAt(pos - 1),
                p1 = clean.charAt(pos);

            if (a0 + p0 === '-_' && a1 + p1 !== '-_') {
                pos += 1;
            }

            this.setState({value: clean}, function () {
                utils.setCaretPosition(this.refs.input.getDOMNode(), pos);
            });

        },
        render: function () {
            return <input name={this.props.inputName} ref='input' required={true} type='text' onChange={this.validDate} value={this.state.value} placeholder={this.state.initial} />;
        }
    });

    NativeDate = React.createClass({
        render: function(){
            return <input name={this.props.inputName} required={true} type='date' defaultValue={this.props.date || (new Date()).toYMD()} />;
        }
    });

    return hasDate ? NativeDate : MaskedDate;
});