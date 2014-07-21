/** @jsx React.DOM */

define(function () {
    var ImportForm = React.createClass({displayName: 'ImportForm',
        getInitialState: function () {
            return {uploadProgress: null};
        },
        isValidFile: function (fInput) {
            var file = fInput.files[0];
            return file && file.type.indexOf('csv') > -1;
        },
        handleSubmit: function (e) {
            e.preventDefault();
            if (this.state.uploadProgress !== null) return;
            if (!this.isValidFile(this.refs.csvFile.getDOMNode())) {

                $(React.renderComponentToStaticMarkup(
                    React.DOM.div( {'data-alert':true, className:"alert-box alert radius"}, "Arquivo Inválido",
                        React.DOM.a( {href:"#", className:"close"}, '×')
                    )
                )).insertAfter($(this.refs.fieldSet.getDOMNode()).find('legend'));

                return;
            }

            var form = new FormData(e.currentTarget),
                xhr = new XMLHttpRequest(),
                formComponent = this;

            xhr.open('POST', pager.urls.ajax + 'admin/work_orders', true);

            xhr.onload = function (loadEvent) {
                if (!formComponent.isMounted()) return;
                if (this.status === 200 || this.status === 204) {

                    $(React.renderComponentToStaticMarkup(
                        React.DOM.div( {'data-alert':true, className:"alert-box success radius"}, "Upload completo: ", this.responseText,
                            React.DOM.a( {href:"#", className:"close"}, '×')
                        )
                    )).insertAfter($(formComponent.refs.fieldSet.getDOMNode()).find('legend'));

                } else {

                    $(React.renderComponentToStaticMarkup(
                        React.DOM.div( {'data-alert':true, className:"alert-box warning radius"}, 'Falha no upload: ' + this.responseText,
                            React.DOM.a( {href:"#", className:"close"}, '×')
                        )
                    )).insertAfter($(formComponent.refs.fieldSet.getDOMNode()).find('legend'));

                }

                formComponent.setState({uploadProgress: null});
            };

            xhr.upload.onprogress = function (uploadEvent) {
                if (!formComponent.isMounted()) return;
                if (uploadEvent.lengthComputable) formComponent.setState({uploadProgress: (uploadEvent.loaded / uploadEvent.total) * 100});
            };

            xhr.send(form);

        },
        render: function () {
            return React.DOM.form( {onSubmit:this.handleSubmit, encType:"multipart/form-data"}, 
                React.DOM.fieldset( {ref:"fieldSet"}, 
                    React.DOM.legend(null, "Planilha de Ordens (CSV)"),

                    React.DOM.progress( {className:"ProgressBar",
                                value:this.state.uploadProgress, max:100,
                                style:{display: this.state.uploadProgress === null ? 'none' : ''}} ),

                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"small-10 columns"}, 
                            React.DOM.input( {type:"file", required:true, ref:"csvFile", name:"csv"} )
                        ),
                        React.DOM.div( {className:"small-2 columns"}, 
                            React.DOM.button( {className:"success button postfix", disabled:this.state.uploadProgress !== null}, "Upload")
                        )
                    )
                )
            );
        }
    });
    return ImportForm;
});