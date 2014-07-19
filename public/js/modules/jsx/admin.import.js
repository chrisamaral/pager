/** @jsx React.DOM */

define(function () {
    var ImportForm = React.createClass({
        getInitialState: function () {
            return {uploadProgress: null};
        },
        isValidFile: function (fInput) {
            var file = fInput.files[0];
            return file && file.type.match('csv');
        },
        handleSubmit: function (e) {
            e.preventDefault();
            if (this.state.uploadProgress !== null) return;
            if (!this.isValidFile(this.refs.csvFile.getDOMNode())) {

                $(React.renderComponentToStaticMarkup(
                    <div data-alert className="alert-box alert radius">Arquivo Inválido
                        <a href="#" className="close">{'×'}</a>
                    </div>
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
                        <div data-alert className="alert-box success radius">Upload completo: {this.responseText}
                            <a href="#" className="close">{'×'}</a>
                        </div>
                    )).insertAfter($(formComponent.refs.fieldSet.getDOMNode()).find('legend'));

                } else {

                    $(React.renderComponentToStaticMarkup(
                        <div data-alert className="alert-box warning radius">{'Falha no upload: ' + this.responseText}
                            <a href="#" className="close">{'×'}</a>
                        </div>
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
            return <form onSubmit={this.handleSubmit} encType="multipart/form-data">
                <fieldset ref='fieldSet'>
                    <legend>Planilha de Ordens (CSV)</legend>

                    <progress className='ProgressBar'
                                value={this.state.uploadProgress} max={100}
                                style={{display: this.state.uploadProgress === null ? 'none' : ''}} />

                    <div className='row'>
                        <div className='small-10 columns'>
                            <input type='file' required ref='csvFile' name='csv' />
                        </div>
                        <div className='small-2 columns'>
                            <button className='success button postfix' disabled={this.state.uploadProgress !== null}>Upload</button>
                        </div>
                    </div>
                </fieldset>
            </form>;
        }
    });
    return ImportForm;
});