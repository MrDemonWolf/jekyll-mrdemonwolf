(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory); // jQuery Switch
		// define(['zepto'], factory); // Zepto Switch
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		factory(require('jquery')); // jQuery Switch
		//factory(require('zepto')); // Zepto Switch
	} else {
		// Browser globals
		if(root.jQuery) { // Use jQuery if available
			factory(root.jQuery);
		} else { // Otherwise, use Zepto
			factory(root.Zepto);
		}
	}
}(this, function ($, undefined) {
    $.jPlayer.solutions.chromecast = function(jplayer, options) {
        this.name = "chromecast";
        $.jPlayerSolution.call(this, jplayer, options);
        
        this.currentMediaSession = null;
        this.session = null;
        this.storedSession = null;
     };
    $.jPlayer.solutions.chromecast.prototype = {
        options: {
        },
        init: function() {
            this.jplayer.status.playbackRateEnabled = false;
        },
        onInitSuccess: function() {
            if (typeof(Storage) !== 'undefined') {
                this.storedSession = JSON.parse(localStorage.getItem('jplayer.chromecast.session'));
            }
            this.requestSession();
        },
        onError: function(e) {
            this.jplayer._error( {
                type: $.jPlayer.solutions.chromecast.error.CHROMECAST,
                context: "{supplied:'" + this.jplayer.options.supplied + "'}",
                message: $.jPlayer.solutions.chromecast.errorMsg.CHROMECAST + e,
                hint: $.jPlayer.solutions.chromecast.errorHint.CHROMECAST
            });
        },
        sessionListener: function(e) {
            var self = this;
            
            self.session = e;
            // TODO: Notify thumb ACTIVE here
            if (self.session.media.length !== 0) {
                self.onMediaDiscovered('sessionListener', self.session.media[0]);
            }
            
            self.session.addMediaListener(
                self.onMediaDiscovered.bind(self, 'addMediaListener')
            );
            self.session.addUpdateListener(
                self.sessionUpdateListener.bind(self)
            );
            
            self.internal.ready = true;
            self.jplayer._checkSolutionsReady();
        },
        sessionUpdateListener: function(isAlive) {
            var self = this;
            
            if (!isAlive) {
                this.session = null;
                // TODO: Notify thumb IDLE here
                //playpauseresume.innerHTML = 'Play';
                if (self.timer) {
                    clearInterval(self.timer);
                } else {
                    // Check progress bar changes every second
                    self.timer = setInterval(self.updateCurrentTime.bind(this), 1000);
                    //playpauseresume.innerHTML = 'Pause';
                }
            }
        },
        receiverListener: function(e) {
            if (e === 'available') {
                // New received found
            }
        },
        initUse: function() {
            var self = this;
            
            self.internal.ready = false;
            
            // Wait for chromecast object init
            if (!chrome.cast || !chrome.cast.isAvailable) {
                setTimeout( function() {
                        var autoJoinPolicyArray = [
                            chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
                            chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
                            chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
                        ];
                        var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
                        var apiConfig = new chrome.cast.ApiConfig(
                            sessionRequest,
                            function(e) { self.sessionListener(e); },
                            function(e) { self.receiverListener(e); },
                            autoJoinPolicyArray[1]
                        );
                        chrome.cast.initialize(
                            apiConfig,
                            function() { self.onInitSuccess(); },
                            function(e) { self.onError(e); }
                        );
                    }, 500);
            } else {alert('aa');
                self.requestSession();
            }
        },
        requestSession: function() {
            var self = this;
            
            if (this.storedSession) {
                this.joinSessionBySessionId();
                setTimeout(function() {
                    // If we still don't have a session after few millisecs, clear stored session and request again
                    if (!self.session) {
                        self.storedSession = null;
                        localStorage.removeItem('jplayer.chromecast.session');
                        self.requestSession();
                    }
                }, 500);
            } else {
                chrome.cast.requestSession(
                    function (e) { self.onRequestSessionSuccess(e); },
                    function () { self.onLaunchError(); }
                );
            }
            if (self.timer) {
                clearInterval(self.timer);
            }
        },
        onRequestSessionSuccess: function(e) {
            var self = this;
            
            this.saveSessionID(e.sessionId);
            this.session = e;
            // TODO: Notify thumb ACTIVE here
            this.session.addUpdateListener(
                self.sessionUpdateListener.bind(self)
            );
            if (this.session.media.length !== 0) {
                this.onMediaDiscovered('onRequestSession', this.session.media[0]);
            }
            this.session.addMediaListener(
                self.onMediaDiscovered.bind(self, 'addMediaListener')
            );
            
            self.internal.ready = true;
            self.jplayer._checkSolutionsReady();
        },
        onLaunchError: function() {
            this.jplayer._error( {
                type: $.jPlayer.solutions.chromecast.error.CHROMECAST,
                context: "{supplied:'" + this.jplayer.options.supplied + "'}",
                message: $.jPlayer.solutions.chromecast.errorMsg.CHROMECAST + "Launch error.",
                hint: $.jPlayer.solutions.chromecast.errorHint.CHROMECAST
            });
        },
        saveSessionID: function(sessionId) {
            // Check browser support of localStorage
            if (typeof(Storage) !== 'undefined') {
                // Store sessionId and timestamp into an object
                var object = {id: sessionId, timestamp: new Date().getTime()};
                localStorage.setItem('jplayer.chromecast.session', JSON.stringify(object));
            }
        },
        joinSessionBySessionId: function() {
            if (this.storedSession) {
                chrome.cast.requestSessionById(this.storedSession.id);
            }
        },
        stopApp: function() {
            var self = this;
            
            this.session.stop(
                function() { self.onStopAppSuccess(); },
                function() { self.onError(); }
            );
            if (this.timer) {
                clearInterval(this.timer);
            }
        },
        onStopAppSuccess: function() {
        },
        resetGate: function() {
            this.gate = false;
        },
        setAudio: function(media) {
            this.setMedia(media);
        },
        setVideo: function(media) {
            this.setMedia(media);
        },
        setMedia: function(media) {
            var self = this;
            
            this.gate = true;
                
            $.each(media, function(format, mediapart) {
                if(self.support[format]) {
                    self.jplayer.status.src = mediapart;
                    self.jplayer.status.format[format] = true;
                    self.jplayer.status.formatType = format;
            
                    return false;
                }
            });
            
            this.jplayer.status.waitForLoad = true;
            if(this.jplayer.options.preload === 'auto') {
                this.load();
            }
        },
        resetMedia: function() {
            this.stop();
        },
        clearMedia: function() {
            // Nothing to clear.
        },
        load: function() {
            var self = this;
            if (this.session) {
                var mediaInfo = new chrome.cast.media.MediaInfo(this.jplayer.status.src);
                
                mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
                mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
                mediaInfo.contentType = this.jplayer.format[self.jplayer.status.formatType].codec;

                mediaInfo.metadata.title = this.jplayer.status.media.title;
                if (this.jplayer.status.media.poster) {
                    mediaInfo.metadata.images = [{'url': this.jplayer.status.media.poster}];
                }

                var request = new chrome.cast.media.LoadRequest(mediaInfo);
                request.autoplay = false;
                request.currentTime = 0;

                self.session.loadMedia(
                    request,
                    self.onMediaDiscovered.bind(self, 'loadMedia'),
                    function(e) { self.onMediaError(e); }
                );
                
                this.jplayer.status.waitForLoad = false;
            }
        },
        onMediaDiscovered: function(how, mediaSession) {
            var self = this;
            
            this.currentMediaSession = mediaSession;
            // Call onLoad callback if specified
            if (this.onLoad) {
                this.onLoad();
                this.onLoad = null;
            }
            this.currentMediaSession.addUpdateListener(
                function(isAlive) { self.onMediaStatusUpdate(isAlive); }
            );
            this.jplayer.status.currentTime = this.currentMediaSession.currentTime;
            // TODO: Notify thumb ACTIVE here
            // TODO: update this.jplayer.status.readyState correctly, currentMediaSession.playerState is not low level enough
            this.jplayer.status.readyState = 4;
            this.jplayer.status.networkState = 0;
            this.jplayer.status.playbackRate = 1;
            this.jplayer.status.ended = false;
            
            if (!this.timer) {
                this.timer = setInterval(self.updateCurrentTime.bind(self), 1000);
            }
        },
        onMediaError: function(e) {
            this.jplayer._error( {
                type: $.jPlayer.solutions.chromecast.error.CHROMECAST,
                context: "{supplied:'" + this.jplayer.status.src + "'}",
                message: $.jPlayer.solutions.chromecast.errorMsg.CHROMECAST + e,
                hint: $.jPlayer.solutions.chromecast.errorHint.CHROMECAST
            });
        },
        getMediaStatus: function() {
            var self = this;
            if (!this.session || !this.currentMediaSession) {
                return;
            }

            this.currentMediaSession.getStatus(
                null,
                self.mediaCommandSuccessCallback.bind(self, 'getMediaStatus'),
                function() { self.onError(); }
            );
        },
        onMediaStatusUpdate: function(isAlive) {
            if (!isAlive) {
                this.currentMediaSession = null;
                this.jplayer.status.currentTime = 0;
                this.jplayer.status.waitForLoad = true;
                this.jplayer._updateButtons(false);
                this.jplayer._updateInterface();
                this.jplayer._trigger($.jPlayer.event.ended);
            } else {
                if (this.currentMediaSession.playerState === 'PLAYING') {
                    this._updateProgress();
                }
            }
        },
        updateCurrentTime: function() {
            if (!this.session || !this.currentMediaSession) {
                return;
            }
            
            if (this.currentMediaSession.media && this.currentMediaSession.media.duration != null) {
            } else {
                if (this.timer) {
                    clearInterval(this.timer);
                }
            }
            this._updateProgress();
        },
        _updateProgress: function() {
            var cpa = 0, sp = 0, cpr = 0;
            this.jplayer.status.currentTime = this.currentMediaSession.getEstimatedTime();
            if (this.jplayer.status.duration !== this.currentMediaSession.media.duration) {
                this.jplayer.status.duration = this.currentMediaSession.media.duration;
                this.jplayer._trigger($.jPlayer.event.durationchange);
            }
            
            if (this.options.volume !== this.currentMediaSession.media.volume) {
                this.options.volume = this.currentMediaSession.media.volume;
                this.jplayer._trigger($.jPlayer.event.volumechange);
            }
        
            cpa = (this.jplayer.status.duration > 0) ? 100 * this.jplayer.status.currentTime / this.jplayer.status.duration : 0;
            sp = (this.jplayer.status.duration > 0) ? (100 * this.jplayer.status.duration) / this.jplayer.status.duration : 100;
            cpr = (this.jplayer.status.duration > 0) ? this.jplayer.status.currentTime / (100 * this.jplayer.status.duration) : 0;
            
            this.jplayer.status.seekPercent = sp;
            this.jplayer.status.currentPercentRelative = cpr;
            this.jplayer.status.currentPercentAbsolute = cpa;
            this.jplayer.status.remaining = this.jplayer.status.duration - this.jplayer.status.currentTime;
            
            this.jplayer._updateInterface();
            this.jplayer._trigger($.jPlayer.event.progress);
        },
        play: function(time) {
            var self = this;
            
            if (this.jplayer.status.waitForLoad) {
                this.onLoad = function() { self.play(time); };
                this.load();
                return;
            }
          
            if (!this.currentMediaSession) {
                return;
            }
            
            if (!this.jplayer.status.waitForLoad) {
                if (!isNaN(time)) {
                    this.seek(time);
                }
            }

            if (this.timer) {
                clearInterval(this.timer);
            }

            this.currentMediaSession.play(
                null,
                self.mediaCommandSuccessCallback.bind(self, 'playing started for ' +
                this.currentMediaSession.sessionId),
                function() { self.onError(); }
            );
            this.timer = setInterval(self.updateCurrentTime.bind(this), 1000);
            
            this.jplayer.status.waitForLoad = false;
            this._checkWaitForPlay();
            
            // No event from the player, update UI now.
            this.jplayer._updateButtons(true);
            this.jplayer._trigger($.jPlayer.event.play);
        },
        pause: function(time) {
            var self = this;
            if (!this.currentMediaSession) {
                return;
            }
            
            if (!isNaN(time)) {
                this.seek(time);
            }
            this.currentMediaSession.pause(
                null,
                self.mediaCommandSuccessCallback.bind(self, 'playing started for ' + self.currentMediaSession.sessionId),
                function() { self.onError(); }
            );
            
            this.jplayer._updateButtons(false);
            this.jplayer._trigger($.jPlayer.event.pause);
        },
        stop: function() {
            var self = this;
            
            if (!this.currentMediaSession) {
                return;
            }
            
            this.currentMediaSession.stop(
                null,
                self.mediaCommandSuccessCallback.bind(self, 'stopped ' + self.currentMediaSession.sessionId),
                function () { self.onError(); }
            );
            
            if (this.timer) {
                clearInterval(this.timer);
            }
            
            this.jplayer._updateButtons(false);
            this.jplayer._trigger($.jPlayer.event.abort);
        },
        playHead: function(percent) {
            if(this.currentMediaSession) {
                this.seek(percent * this.jplayer.status.duration / 100);
            }
                
            if(!this.jplayer.status.waitForLoad) {
                this._checkWaitForPlay();
            }
        },
        _checkWaitForPlay: function() {
            if(this.jplayer.status.waitForPlay) {
                this.jplayer.status.waitForPlay = false;
            }
        },
        setMediaVolume: function (level, mute) {
            var self = this;
            
            if (!this.session) {
                return;
            }
            
            var volume = new chrome.cast.Volume();
            volume.level = level;
            this.currentVolume = volume.level;
            volume.muted = mute;
            var request = new chrome.cast.media.VolumeRequest();
            request.volume = volume;
            
            this.currentMediaSession.setVolume(
                request,
                self.mediaCommandSuccessCallback.bind(self, 'media set-volume done'),
                function() { self.onError(); }
            );
            
            this.jplayer._updateVolume(level);
            this.jplayer._trigger($.jPlayer.event.volumechange);
        },
        volume: function(v) {
            this.setMediaVolume(v, false);
        },
        mute: function(m) {
            this.setMediaVolume(this.currentVolume, m);
            this.jplayer._updateMute(m);
        },
        seek: function(time) {
            var self = this;
            
            if (!this.currentMediaSession) {
                return;
            }
            
            var request = new chrome.cast.media.SeekRequest();
            request.currentTime = time;
            this.currentMediaSession.seek(
                request,
                self.onSeekSuccess.bind(self, 'media seek done'),
                function() { self.onError(); }
            );
        },
        /*jslint unused: false*/
        onSeekSuccess: function(info) {
        },
        mediaCommandSuccessCallback: function(info) {
        },
        setPlaybackRate: function(value) {
            // Not supported
        },
        setDefaultPlaybackRate: function(value) {
            // Not supported
        },
        /*jslint unused: true*/
        updateSize: function() {
            // Do nothing
        },
        updateCanPlay: function(format) {
            var self = this;
            // TODO: check if we can ask Chromecast for supported format
            self.canPlay[format] = true;
        },
        updateNativeVideoControls: function() {
            // Not supported
        },
        setFullScreen: function(value) {
            this.jplayer.options.fullScreen = value;
            this.jplayer._setOption("fullWindow", value);
        },
        /*jslint unused: false*/
        jPlayerMsgHandler: function(args) {
            // No external message to handle, messages are managed through event listeners.
        }
        /*jslint unused: true*/
    };
    
    $.jPlayer.solutions.chromecast.error = {
        CHROMECAST: "e_chromecast",
        CHROMECAST_UNAVAILABLE: "e_chromecast_unavailable"
    };

    $.jPlayer.solutions.chromecast.errorMsg = {
        CHROMECAST: "jPlayer's Solution solution error. Details: ",
        CHROMECAST_UNAVAILABLE: "jPlayer's Chromecast solution is unavailable. Details: "
    };

    $.jPlayer.solutions.chromecast.errorHint = {
        CHROMECAST: "Check your settings and network connectivity.",
        CHROMECAST_INIT: "Check that your browser is Chromecast compatible and test with Chrome."
    };
}));