var lastLookup = Date.now();

define(function () {

    function addressInfo(address) {
        if (!address || !address.components) {
            return null;
        }
        var components = null;

        address.components.forEach(function (component) {
            components = components || {};
            if (component && component.name && component.value) {
                components[component.name] = component.value;
            }
        });

        return components;
    }
    function Geocoder(tasks) {

        this.status = 'OK';
        var queue = tasks.concat();

        this.init = function () {
            this.processGeoQueue(queue);
            //processGeoQueue(queue, this.onComplete, this.onError, this.onProgress);
        };
    }

    Geocoder.prototype.abort = function () {
        console.log('will abort lookup');
        this.status = 'Aborted';
    };

    Geocoder.prototype.processGeoQueue = function (originalQueue) {
        var that = this;
        function tick(queue) {

            if (that.status.toLowerCase() === 'aborted') {
                return;
            }

            var task = queue.splice(0, 1), geocoder, inASec = function () {
                if (Date.now() - lastLookup > 1100) {
                    tick(queue);
                } else {
                    setTimeout(inASec, 100);
                }
            };

            if (!task.length) {
                return that.onComplete();
            }
            task = task[0];

            //by pass
            if (task.location) {
                if (_.isFunction(that.onProgress)) {
                    that.onProgress(originalQueue.length - queue.length, originalQueue.length, task, 'unchanged');
                }
                return inASec();
            }

            geocoder = new google.maps.Geocoder();
            var geocodeOptions = {address: task.address.address},
                info = addressInfo(task.address);

            if (info) {
                geocodeOptions.componentRestrictions = {};
                if (info.city) {
                    geocodeOptions.componentRestrictions.locality = info.city;
                }

                if (info.country) {
                    geocodeOptions.region = info.country;
                    geocodeOptions.componentRestrictions.country = info.country;
                }

                if (info.state) {
                    geocodeOptions.componentRestrictions.administrativeArea = info.state;
                }

                /*

                    if (info.route) {
                        geocodeOptions.componentRestrictions.route = info.route;
                    }

                    if (info.postal_code) {
                        geocodeOptions.componentRestrictions.postalCode = info.postal_code;
                    }

                */

            }

            console.log('searching', geocodeOptions.address);

            lastLookup = Date.now();
            geocoder.geocode(geocodeOptions, function (results, status) {
                var lat, lng;

                if (status === google.maps.GeocoderStatus.OK) {

                    lat = results[0].geometry.location.lat();
                    lng = results[0].geometry.location.lng();

                    task.location = {lat: lat, lng: lng};

                    if (_.isFunction(that.onProgress)) {
                        that.onProgress(originalQueue.length - queue.length, originalQueue.length, task);
                    }

                    $.post(pager.urls.ajax + 'workOrder/' + task._id + '/location', task.location);

                } else {
                    console.log('Geocode failure: ' + status);
                }

                inASec();
            });
        }

        tick(originalQueue.concat());
    };

    return Geocoder;
});