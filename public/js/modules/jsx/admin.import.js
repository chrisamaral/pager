/** @jsx React.DOM */

define(function () {

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB'], i;
        if (bytes === 0) {
            return 'n/a';
        }
        i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }

    var ImportForm = React.createClass({
        getInitialState: function () {
            return {uploadProgress: null};
        },
        isValidFile: function (fInput) {
            var file = fInput.files[0];
            return file && (file.type.indexOf('csv') > -1 || file.type.indexOf('excel') > -1);
        },
        changeFile: function (e) {
            var fElem = e.currentTarget,
                file = fElem.files[0],
                descr = null;
            if (file) {
                descr = {name: file.name, type: file.type, size: bytesToSize(file.size)};
            }
            this.setState({fileDescr: descr});
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
                        <div data-alert className="alert-box warning radius">{'Erro, não foi possível interpretar o arquivo selecionado.'}
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
                    <div className='row'>
                        <div className='medium-6 columns'>
                            <label>Separador
                                <select name='separatorChar'>
                                    <option>;</option>
                                    <option>,</option>
                                </select>
                            </label>
                        </div>
                        <div className='medium-6 columns'>
                            <label>Aspas
                                <select name='quoteChar'>
                                    <option>"</option>
                                    <option>'</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <progress className='ProgressBar'
                                value={this.state.uploadProgress} max={100}
                                style={{display: this.state.uploadProgress === null ? 'none' : ''}} />

                    <div className='row'>
                        <div className='medium-10 columns'>
                            <input type='file' required ref='csvFile' onChange={this.changeFile} name='csv' />
                        </div>
                        <div className='medium-2 columns'>
                            <button className='success button postfix' disabled={this.state.uploadProgress !== null}>Upload</button>
                        </div>
                    </div>
                    {this.state.fileDescr
                        ? <div id='AdminFileDescriptor'>
                                <span className='label secondary'>{this.state.fileDescr.name}</span>
                                <span className='label secondary'>{this.state.fileDescr.type}</span>
                                <span className='label secondary'>{this.state.fileDescr.size}</span>
                            </div>
                        : null}
                </fieldset>
            </form>;
        }
    });
    return ImportForm;
});