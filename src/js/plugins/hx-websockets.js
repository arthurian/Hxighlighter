/**
 *  Websockets Annotations Plugin
 *  
 *
 */

//uncomment to add css file
//require('./filaname.css');

(function($){

    /**
     * @constructor
     * @params {Object} options - specific options for this plugin
     */
    $.Websockets = function(options, instanceID) {
        this.options = jQuery.extend({}, options);
        this.instanceID = instanceID;
        this.init();
        this.timerRetryInterval;
        this.socket = null;
        return this;
    };

    /**
     * Initializes instance
     */
    $.Websockets.prototype.init = function() {
        var self = this;
        self.slot_id = self.options.context_id.replace(/[^a-zA-Z0-9-.]/g, '-') + '--' + self.options.collection_id + '--' + self.options.object_id;
        self.setUpConnection();
    };

    $.Websockets.prototype.saving = function(annotation) {
        return annotation;
    };

    $.Websockets.prototype.setUpConnection = function() {
        var self = this;
        self.socket = self.openWs(self.slot_id, self.options.Websockets.wsUrl);
        self.socket.onopen = function(e) {
            self.onWsOpen(e);
        };
        self.socket.onmessage = function(e) {
            var data = JSON.parse(e.data);
            self.receiveWsMessage(data);
        };
        self.socket.onclose = function(e) {
            self.onWsClose(e);
        };
    };

    $.Websockets.prototype.receiveWsMessage = function(response) {
        var self = this;
        var message = response['message'];
            var annotation = eval( "(" + message + ")");
            if (typeof(annotation.id) == "number") {
                var wa = self.convertingFromAnnotatorJS(annotation);
            }
            if (response['type'] === 'annotation_deleted') {
                $.publishEvent('GetSpecificAnnotationData', self.instance_id, [wa.id, function(annotationFound) {
                    $.publishEvent('TargetAnnotationUndraw', self.instance_id, [annotationFound]);
                    jQuery('.item-' + annotation.id).remove();
                }]);
            } else {
                $.publishEvent('annotationLoaded', self.instance_id, [wa]);
                if (response['type'] === 'annotation_updated') {
                    $.publishEvent('GetSpecificAnnotationData', self.instance_id, [wa.id, function(annotationFound) {
                        $.publishEvent('TargetAnnotationUndraw', self.instance_id, [annotationFound]);
                        $.publishEvent('TargetAnnotationDraw', self.instance_id, [wa]);
                    }]);
                } else {
                    $.publishEvent('TargetAnnotationDraw', self.instance_id, [wa]);
                }
            }
    };

    $.Websockets.prototype.openWs = function(slot_id, wsUrl) {
        var chatSocket = new WebSocket(
            'wss://' + wsUrl +
            '/ws/chat/' + slot_id + '/');

        return chatSocket;
    };

    $.Websockets.prototype.onWsOpen = function() {
        var self = this;
        if (self.timerRetryInterval) {
            clearInterval(self.timerRetryInterval);
            self.timerRetryInterval = undefined;
        }
    };

    $.Websockets.prototype.onWsClose = function() {
        var self = this;
        if (!self.timerRetryInterval) {
            self.timerRetryInterval = setInterval(function() {
                console.log('intervalrunning');
                self.setUpConnection();
            }, 5000)
        }
    };

    Object.defineProperty($.Websockets, 'name', {
        value: "Websockets"
    });

    $.Websockets.prototype.convertingFromAnnotatorJS = function(annotation) {
        var self = this;
        var ranges = annotation.ranges;
        var rangeList = [];
        ranges.forEach(function(range) {
            rangeList.push({
                'xpath': range,
                'text': {
                    prefix: '',
                    exact: annotation.quote,
                    suffix: ''
                }
            })
        });
        var annotation = {
            annotationText: [annotation.text],
            created: annotation.created,
            creator: annotation.user,
            exact: annotation.quote,
            id: annotation.id,
            media: annotation.media,
            tags: annotation.tags,
            ranges: rangeList,
            totalReplies: annotation.totalComments,
            permissions: annotation.permissions

        }
        return annotation
    }


    $.plugins.push($.Websockets);
}(Hxighlighter ?  Hxighlighter : require('../hxighlighter.js')));
