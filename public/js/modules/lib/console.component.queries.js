define(function(){
   return {
       updateDefaultQuery: function (dayHasChanged) {

           var queryList = this.state.queries,
               newQ = {
                   id: 'query-' + Math.random().toString(36).substr(2),
                   name: 'Agenda',
                   tasks: [],
                   query: {
                       schedule: [this.state.day]
                   }
               },
               currentQ = _.find(queryList, {name: 'Agenda'});

           if (currentQ) {
                if (dayHasChanged) {
                    queryList[0] = newQ;
                } else {
                    _.merge(currentQ, newQ);
                }
           } else {
               if (!dayHasChanged) return;

               queryList.unshift(newQ);
           }

           this.setState({queries: queryList}, this.syncQueries);
       },
       setQueries: function (items) {

           items = items.filter(function (item) {
               return item.name === 'Agenda' || item.tasks;
           }).map(function (item) {
               item.id = item.id || 'query-' + Math.random().toString(36).substr(2);
               return item;
           });

           if (Modernizr.localstorage) {

               localStorage.setItem('pager.' + pager.org.id + '.console.queries',
                   JSON.stringify(items.filter(function (query) {
                           return query.name !== 'Agenda';
                       }).map(function (query) {
                           query = _.clone(query);
                           query.tasks = [];
                           return query;
                       })
                   )
               );

           }

           this.setState({queries: items});
       },
       fetchQuery: function (query) {

           return $.get(pager.urls.ajax + 'console/tasks/' + this.state.day, query.query).done(
               function (tasks) {

                   if (!_.isArray(tasks)) return;

                   var qs = this.state.queries,
                       $query = _.find(qs, {id: query.id}) || _.find(qs, {name: query.name});

                   if (!$query) return;

                   $query.tasks = tasks;

                   this.setState({queries: qs});
               }.bind(this)
           );
       },

       fetchQueries: function (callback) {
           var promises = [], aux;

           this.state.queries.forEach(function (query) {

               promises.push(this.fetchQuery(query));

           }.bind(this));

           aux = $.when.apply($, promises);

           if (_.isFunction(callback)) aux.always(callback);
       },

       syncQueries: function () {

           clearTimeout(this.syncQueries.__timeout);

           if (!this.isMounted()) return;

           this.fetchQueries(function () {

               this.syncQueries.__timeout = setTimeout(this.syncQueries,
                   pager.constant.console.QUERY_UPDATE_INTERVAL);

           }.bind(this));
       }
   }
});
