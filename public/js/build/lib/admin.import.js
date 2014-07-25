/** @jsx React.DOM */define(function(){function e(e){var t=["Bytes","KB","MB"],n;return e===0?"n/a":(n=parseInt(Math.floor(Math.log(e)/Math.log(1024)),10),(e/Math.pow(1024,n)).toFixed(1)+" "+t[n])}var t=React.createClass({displayName:"ImportForm",getInitialState:function(){return{uploadProgress:null}},isValidFile:function(e){var t=e.files[0];return t&&t.type.indexOf("csv")>-1},changeFile:function(t){var n=t.currentTarget,r=n.files[0],i=null;r&&(i={name:r.name,type:r.type,size:e(r.size)}),this.setState({fileDescr:i})},handleSubmit:function(e){e.preventDefault();if(this.state.uploadProgress!==null)return;if(!this.isValidFile(this.refs.csvFile.getDOMNode())){$(React.renderComponentToStaticMarkup(React.DOM.div({"data-alert":!0,className:"alert-box alert radius"},"Arquivo Inválido",React.DOM.a({href:"#",className:"close"},"×")))).insertAfter($(this.refs.fieldSet.getDOMNode()).find("legend"));return}var t=new FormData(e.currentTarget),n=new XMLHttpRequest,r=this;n.open("POST",pager.urls.ajax+"admin/work_orders",!0),n.onload=function(e){if(!r.isMounted())return;this.status===200||this.status===204?$(React.renderComponentToStaticMarkup(React.DOM.div({"data-alert":!0,className:"alert-box success radius"},"Upload completo: ",this.responseText,React.DOM.a({href:"#",className:"close"},"×")))).insertAfter($(r.refs.fieldSet.getDOMNode()).find("legend")):$(React.renderComponentToStaticMarkup(React.DOM.div({"data-alert":!0,className:"alert-box warning radius"},"Falha no upload: "+this.responseText,React.DOM.a({href:"#",className:"close"},"×")))).insertAfter($(r.refs.fieldSet.getDOMNode()).find("legend")),r.setState({uploadProgress:null})},n.upload.onprogress=function(e){if(!r.isMounted())return;e.lengthComputable&&r.setState({uploadProgress:e.loaded/e.total*100})},n.send(t)},render:function(){return React.DOM.form({onSubmit:this.handleSubmit,encType:"multipart/form-data"},React.DOM.fieldset({ref:"fieldSet"},React.DOM.legend(null,"Planilha de Ordens (CSV)"),React.DOM.progress({className:"ProgressBar",value:this.state.uploadProgress,max:100,style:{display:this.state.uploadProgress===null?"none":""}}),React.DOM.div({className:"row"},React.DOM.div({className:"medium-10 columns"},React.DOM.input({type:"file",required:!0,ref:"csvFile",onChange:this.changeFile,name:"csv"})),React.DOM.div({className:"medium-2 columns"},React.DOM.button({className:"success button postfix",disabled:this.state.uploadProgress!==null},"Upload"))),this.state.fileDescr?React.DOM.div({id:"AdminFileDescriptor"},React.DOM.span({className:"label secondary"},this.state.fileDescr.name),React.DOM.span({className:"label secondary"},this.state.fileDescr.type),React.DOM.span({className:"label secondary"},this.state.fileDescr.size)):null))}});return t});