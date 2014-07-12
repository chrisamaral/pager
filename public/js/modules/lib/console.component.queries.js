define(function(){
   return {
       updateDefaultQuery: function (dayHasChanged) {
           var qs = this.state.queries,
               d = {
                   id: 'query-' + Math.random().toString(36).substr(2),
                   name: 'Agenda',
                   tasks: [],
                   query: {
                       schedule: [this.state.day]
                   }
               },
               index = _.findIndex(qs, {name: 'Agenda'});

           if (index >= 0) {
               if (qs[index].query.schedule[0] === d.query.schedule[0]) {
                   return;
               }
               qs[index] = d;
           } else {
               if (!dayHasChanged) {
                   return;
               }
               qs.unshift(d);
           }

           this.setState({queries: qs});
       },
       setQueries: function (items) {

           items = items.filter(function (item, index) {
               return item.name === 'Agenda' || item.tasks;
           }).map(function (item) {
               item.id = item.id || 'query-' + Math.random().toString(36).substr(2);
               return item;
           });

           if (Modernizr.localstorage) {

               localStorage.setItem('pager.' + pager.org.id + '.console.queries',
                   JSON.stringify(this.state.queries.filter(function (query) {
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
       fetchQuery: function (query, index) {
           return $.get(pager.urls.ajax + 'console/tasks/' + this.state.day, query.query).done(
               function (tasks) {
                   if (!_.isArray(tasks)) return;

                   var qs = this.state.queries;
                   qs[index].tasks = tasks;

                   this.setState({queries: qs});
               }.bind(this)
           );
       },

       fetchQueries: function (callback) {
           var promises = [];

           this.state.queries.forEach(function (query, index) {

               promises.push(this.fetchQuery(query, index));

           }.bind(this));

           $.when.apply($, promises).always(callback ? callback : function(){});
       },

       syncQueries: function () {
           if (!this.isMounted()) return clearTimeout(this.syncQueries.__timeout);
           if (this.syncQueries.__locked) return;

           this.syncQueries.__locked = true;

           this.fetchQueries(this.state.day, function(){

               this.syncQueries.__locked = false;

               this.syncQueries.__timeout = setTimeout(this.syncQueries,
                   pager.constant.console.QUERY_UPDATE_INTERVAL);

           }.bind(this));
       }
   }
});
