/**
 * jQuery Validate Form Plugin
 * http://github.com/rost-didyk/bevalid
 * MIT licensed
 * http://www.opensource.org/licenses/MIT
 */

;(function($) {
    'use strict';

    /**
     * Variable declarations
     */
    var PLUGIN_NAME, validateRulesPatterns, errorMessages,
        defaults, matchValue, callbackErrorRegister, callbackValidRegister;

    /**
     * Plugin name
     *
     * @type {string}
     */
    PLUGIN_NAME = 'bevalid';

    /**
     * Defaults plugins options
     *
     * @type {{}}
     */
    defaults = {
        // Selector after append error message
        'appendErrorMessageAfter':'label',
        // Element error class
        'elementErrorClass':'bevalid-error',
        'translateFn': function(string) {
            return string
        }
    };

    /**
     * Validate rules
     *
     * @type {{email: string, phone: string, required: string, minValue: string, maxValue: string}}
     */
    validateRulesPatterns = {
        bevalidRulesRequired: function($element) {
            var isCustom = $element.hasClass('bevalid-custom-value'), value;

            if(!isCustom && $.inArray($element.attr('type'), ['checkbox', 'radio']) != -1) {
                value = $element.prop('checked');
            } else {
                value = isCustom ? $element.data('bevalid-custom-value').length : $.trim($element.val()).length;
            }

            return !!value;
        },

        bevalidRulesEmail: function($element) {
            var pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return matchValue($element, pattern);
        },

        /**
         * +388(063)377 2695
         +380633772695
         (063)3772695
         380633772695
         700-720-1000
         123456789012
         3456789054
         720 2222222
         054-6501530
         054 6501530

         * @param $element
         * @returns {*}
         */
        bevalidRulesPhone: function($element) {
            var pattern = /^[\+?]{0,1}[0-9]{0,3}(\([0-9]{3}\)|[0-9]{3})[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/;
            return matchValue($element, pattern);
        },

        bevalidRulesUrl: function($element) {
            var pattern = /(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
            return matchValue($element, pattern);
        },

        bevalidRulesNumber: function($element) {
            var pattern = /^\d+$/;
            return matchValue($element, pattern);
        },

        bevalidRulesHostName: function($element) {
            var pattern = /^[0-9a-zA-Z][0-9\.\-a-zA-Z]+[0-9a-zA-Z]$/;
            return matchValue($element, pattern);
        },

        bevalidRulesLargeThen: function($element, value) {
            var $form = $element.parents('form'), $el = $form.find('[name="' + value + '"]'), valid = true;

            if ($element.val() > $el.val()) {
                valid = false;
            }

            return valid;
        }
    };

    /**
     * List error messages
     *
     * @type {object}
     */
    errorMessages = {
        bevalidRulesRequired: 'This field is required',
        bevalidRulesEmail:    'This field must be email',
        bevalidRulesPhone:    'Please type correct phone number',
        bevalidRulesUrl:      'Please type correct url address',
        bevalidRulesNumber:   'This field must be only number',
        bevalidRulesHostName:  'Invalid host name',
        bevalidRulesLargeThen: 'Large error'
    };

    /**
     * IF valid error collect callback function
     */
    callbackErrorRegister = {
        bevalidOnElementError: function(element, callback) {
            return callback(element);
        }
    };

    /**
     * IF valid ok collect callback function
     */
    callbackValidRegister = {
        bevalidOnElementValid: function(element, callback) {
            return callback.call(this, element);
        }
    };

    /**
     * Match value by pattern
     */
    matchValue = function($element, pattern) {
        var isCustom = $element.hasClass('bevalid-custom-value'),
            value = isCustom ? $element.data('bevalid-custom-value') : $element.val();

        if(value.length == 0) {
            return true;
        }

        return pattern.test(value);
    };

    /**
     * Return random
     *
     * @param min
     * @param max
     * @returns {number}
     */
    var getRandom = function(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    };

    var eventsRulesPattern = {
        'only-lat': /[^a-zA-Z\s\-\_\.]/g,
        'only-digital': /[^0-9\s]/g
    };

    /**
     * Plugin constructor
     *
     * @param {dom} element
     * @param {object} settings
     * @constructor
     */
    var Plugin = function(element, settings) {
        this.$wrap = $(element);
        this.settings = $.extend( {}, defaults, settings );
        this.initialize();
    };

    $.extend(Plugin.prototype, {

        /**
         * Plugin initialize methods
         */
        initialize: function() {
            this.patterns              = validateRulesPatterns;
            this.errorMessages         = errorMessages;
            this.errorCallbackRegister =  callbackErrorRegister;
            this.validCallbackRegister =  callbackValidRegister;
            this.initElementsEvent();
        },

        /**
         * Init spy events on element
         */
        initElementsEvent: function() {
            var $elements =  this.$wrap.find('[data-bevalid]');

            function parseEvent($el, callback) {
                var dataAttributes = $el.data();
                $.each(dataAttributes, function(data){
                    if (data.indexOf('bevalidEvents') > -1) {
                        var explode = data.match(/[A-Z][a-z]+/g);
                        if (explode[1]) {
                            callback($el,explode[1], dataAttributes[data]);
                        }
                    }
                });
            }

            function activateEventListener($el, event, rules) {
                $el.on(event.toLowerCase(), function(){
                    var $el = $(this), pattern = eventsRulesPattern[rules];
                    if ( $el.val().match(pattern)) {
                        $el.val($el.val().replace(pattern, ''));
                    }
                });
            }

            $.each($elements, function(){
                parseEvent($(this), activateEventListener);
            });

        },

        /**
         * Parse all element who have attr data-bevalid.
         * And add observe to element
         */
        parse: function($elements) {
            var allDataAttr, validToken = [];

            if (typeof $elements == 'undefined') {
                $elements = this.$wrap.find('[data-bevalid]');
            }

            $.each($elements, $.proxy(function(index,element) {
                var validSettings = [];
                allDataAttr = $(element).data();
                $.each(allDataAttr, function(key) {
                    if(key.indexOf('bevalid') > -1 && key != 'bevalid') {
                        validSettings.push({
                            action: key,
                            value: allDataAttr[key]
                        });
                    }
                });

                var $element = $(element);

                validToken.push(this.isElementValid($element, validSettings));

            }, this));

            return validToken;
        },

        /**
         * Check element is valid.
         * If element not valid add class and create error message
         * If valid remove class and error message
         *
         * @param {object} $element
         * @param {object} validSettings
         */
        isElementValid: function($element, validSettings) {
            var errorRules = [], errorCallbacks = [], validCallbacks = [];
            $.each(validSettings, $.proxy(function(i, rules){
                // valid rules
                if(!!this.patterns[rules['action']] && !this.patterns[rules['action']]($element, rules['value'])) {
                    errorRules.push(rules.action);
                }
                // callbacks error
                if(!!this.errorCallbackRegister[rules['action']]) {
                    errorCallbacks.push({
                        fnName: this.errorCallbackRegister[rules['action']],
                        fnValue: rules['value']
                    });
                }
                // callbacks valid
                if(!!this.validCallbackRegister[rules['action']]) {
                    validCallbacks.push({
                        fnName: this.validCallbackRegister[rules['action']],
                        fnValue: rules['value']
                    });
                }

            }, this));

            if(errorRules.length) {
                this.addValidError($element, errorRules);
                this.executeCallback(errorCallbacks, $element);
            } else {
                this.removeValidError($element);
                this.executeCallback(validCallbacks, $element);
            }

            return !errorRules.length;
        },

        /**
         * Call and run callback
         *
         * @param  callbackArray
         * @param {object} $element
         */
        executeCallback: function(callbackArray, $element) {
            if(callbackArray.length) {
                $.each(callbackArray, function(i,fn) {
                    fn['fnName']($element,fn['fnValue']);
                });
            }
        },

        /**
         * Add valid error class and message
         *
         * @param {object} $element
         * @param errorRules
         */
        addValidError: function($element, errorRules) {
            var errorClass, elementIdentifier,
                $errorTemplate, $errorList, $insertElement;

            errorClass = this.settings['elementErrorClass'];
            // Add error token and Identifier
            if(!$element.hasClass(errorClass)) {
                elementIdentifier = errorClass + '-' + getRandom(1,30000);
                $element.addClass(errorClass);
                $element.data('elementIdentifier', elementIdentifier);
                $errorTemplate = $('<div/>').addClass(errorClass + '-wrap ' + elementIdentifier);
                $insertElement = $element.closest(this.settings['appendErrorMessageAfter']).length ? $element.closest(this.settings['appendErrorMessageAfter']) : $element;
                $errorTemplate.insertAfter($insertElement);
            } else {
                elementIdentifier = $element.data('elementIdentifier');
                $errorTemplate = $('.' + elementIdentifier);
            }
            // Create lists of error messages
            $errorList = $('<ul/>');
            for(var i = 0; i < errorRules.length; i++) {
                var message;
                message = this.settings.translateFn(this.errorMessages[errorRules[i]]);
                $('<li/>').html(message).appendTo($errorList);
            }
            $errorTemplate.html('');
            $errorList.appendTo($errorTemplate);
        },

        /**
         * Remove valid error class and message
         *
         * @param $element
         */
        removeValidError: function($element) {
            var  errorClass, elementIdentifier;

            errorClass = this.settings['elementErrorClass'];
            $element.removeClass(errorClass);
            elementIdentifier = $element.data('elementIdentifier');
            $('.' + elementIdentifier).remove();
        },

        /**
         * Valid form elements
         */
        validate: function() {
            return $.inArray(false, this.parse()) == -1;
        },

        /**
         * Submit form validate
         */
        isValid: function() {
            return this.validate();
        },

        /**
         * Extend patterns (validation rules) objects
         *
         * @param value
         * @returns {*}
         */
        setPatterns: function(value) {
            this.patterns = $.extend({},this.patterns, value);
        },

        /**
         * Extend error messages
         *
         * @param value
         */
        setErrorText: function(value) {
            this.errorMessages = $.extend({},this.errorMessages, value);
        },

        /**
         * When server response error message
         * highlight form
         * data is {email:{'error':'error text'}}
         */
        setResponseError: function(data) {
            var  self = this, getKeysFn;

            // Return keys in object
            getKeysFn = function(obj) {
                var result = [];
                $.each(obj, function(k,v){
                    result.push(k);
                });
                return result;
            }

            // Set errors message
            $.each(data, function(i,message){
                self.setErrorText(message);
            });

            // Create error on element
            $.each(data, function(element, message) {
                var $element = self.$wrap.find('[name="' + element +'"]');
                self.addValidError($element, getKeysFn(message));
            });
        },

        /**
         * Destroy plugin
         */
        destroyPlugin: function() {
            console.log("Bevalid destroy..." );
        },

        /**
         * Validate manual fields
         */
        isElValid: function(data) {
            return $.inArray(false, this.parse(data)) == -1;
        },

        /**
         * This is connect to real world=)
         * Public plugin method
         *
         * @param {string} action method name
         * @param {*} value
         */
        callMethod: function(action, value) {
            var result;

            switch (action) {
                case 'isValid': result = this.isValid(); break;
                case 'isElValid': result = this.isElValid(value); break;
                case 'setPatterns': result = this.setPatterns(value); break;
                case 'setErrorText': result = this.setErrorText(value); break;
                case 'setResponseError': result = this.setResponseError(value); break;
                case 'destroy': result = this.destroyPlugin(); break;
                default:
                    console.warn('Method ' + action + ' not found');
                    break;
            }
            return result;
        }
    });

    $.fn[PLUGIN_NAME] = function( options ) {
        var args = arguments, functionReturn = null;
        this.each(function () {
            var pluginInstance = $.data(this, 'plugin_' + PLUGIN_NAME);
            if (!pluginInstance && options === undefined || typeof options === 'object') {
                $.data(this, 'plugin_' + PLUGIN_NAME, new Plugin( this, options ));
            } else if(typeof options === 'string') {
                if (pluginInstance instanceof Plugin && typeof pluginInstance[options] === 'function') {
                    functionReturn = pluginInstance['callMethod'].apply( pluginInstance, args);
                }
            }
            return this;
        });
        return functionReturn;
    };

})(jQuery);
