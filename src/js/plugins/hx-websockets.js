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
        return this;
    };

    /**
     * Initializes instance
     */
    $.Websockets.prototype.init = function() {
        var self = this;
        var collection_id = self.options.collection_id;
        var wsUrl = self.options.Websockets.wsUrl;
        var chatSocket = new WebSocket(
            'wss://' + wsUrl +
            '/ws/chat/' + collection_id + '/');

        chatSocket.onmessage = function(e) {
            var data = JSON.parse(e.data);
            var message = data['message'];
            var annotation = eval( "(" + message + ")");
            var wa = self.convertingFromAnnotatorJS(annotation);
            if (data['type'] === 'annotation_deleted') {
                $.publishEvent('GetSpecificAnnotationData', self.instance_id, [wa.id, function(annotationFound) {
                    $.publishEvent('TargetAnnotationUndraw', self.instance_id, [annotationFound]);
                    jQuery('.item-' + annotation.id).remove();
                }]);
            } else {
                $.publishEvent('annotationLoaded', self.instance_id, [wa]);
                if (data['type'] === 'annotation_updated') {
                    $.publishEvent('GetSpecificAnnotationData', self.instance_id, [wa.id, function(annotationFound) {
                        $.publishEvent('TargetAnnotationUndraw', self.instance_id, [annotationFound]);
                        $.publishEvent('TargetAnnotationDraw', self.instance_id, [wa]);
                    }]);
                } else {
                    $.publishEvent('TargetAnnotationDraw', self.instance_id, [wa]);
                }
            }
        };

        chatSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };
    };

    $.Websockets.prototype.extractHostname = function(url1) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url1.indexOf("//") > -1) {
            hostname = url1.split('/')[2];
        }
        else {
            hostname = url1.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    }

    $.Websockets.prototype.saving = function(annotation) {
        return annotation;
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
