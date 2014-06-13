define(['../ext/strftime'], function(strftime){

    function Router (day, tasks, workers) {
        this.id = Math.random().toString(36).substr(2);
        this.deferred = $.Deferred();
        $.when(
                $.get(pager.build.moduleRoot + '/lib/router.worker.js')
                    .pipe(function(x){return x}),
                $.get(pager.build.moduleRoot + '/ext/crypto.sha1.min.js')
                    .pipe(function(x){return x;})
            ).done(function (worker, crypto) {

                var blob = new Blob([$('#script_lodash').text(), crypto, worker], {type: 'application/javascript'}),
                    blobURL = window.URL.createObjectURL(blob);

                this.webWorker = new Worker(blobURL);
                window.URL.revokeObjectURL(blobURL);

                this.connectToWorker();
                this.webWorker.postMessage({cmd: 'startRouter', data: {tasks: tasks, workers: workers, day: day}});
            }.bind(this));

        return this.deferred.promise();

    }

    Router.prototype.fetchTypes = function (usedTypes) {
        $.get(pager.urls.ajax + 'console/typeDuration', {types: usedTypes})
            .done(function (types) {
                this.webWorker.postMessage({cmd: 'parseTypes', data: types});
            }.bind(this));
    };

    Router.prototype.drawGraph = function (graph) {
        require(['../ext/sigma.min.js'], function(sigma) {
            var id = this.id,
                modal = $('#Modal-' + id),
                container = $('#Graph-' + id).remove(),
                that = this;

            if (!modal.length) {
                modal = $('<div class="reveal-modal" data-reveal>').
                    attr('id', 'Modal-' + id).appendTo('body')
                    .append('<h2>Diagrama de roteamento</h2><a class="close-reveal-modal">&#215;</a>');
            }


            container = $('<div>').attr('id', 'Graph-' + id)
                            .css({
                                width: $(window).width() - 400,
                                height: 400
                            })
                            .appendTo(modal);

            $('#Modal-' + id).foundation('reveal').foundation('reveal', 'open');

            setTimeout(function() {
                this.sigma = new sigma({
                    graph: graph,
                    container: 'Graph-' + id
                });
            }.bind(this), 2000);
        }.bind(this));

    };

    Router.prototype.connectToWorker = function () {

        this.webWorker.addEventListener('message', function (e) {
            switch (e.data.type) {
                case 'progressLog':
                    console.log(e.data.data);
                    break;
                case 'fetchTypes':
                    this.fetchTypes(e.data.data);
                    break;
                case 'drawGraph':
                    this.drawGraph(e.data.data);
                    break;
            }
        }.bind(this));

    };

    return Router;
});