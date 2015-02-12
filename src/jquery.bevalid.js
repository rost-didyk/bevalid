/**
 * jQuery Validate Form Plugin
 * http://github.com/rost-didyk/bevalid
 *
 * Copyright 2015, Didyk Rostislav
 *
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
        'appendErrorMessageAfter':'label'
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
                value = isCustom ? $element.data('bevalid-custom-value').length : $element.val().length;
            }

            return !!value;
        },

        bevalidRulesEmail: function($element) {
            var pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return matchValue($element, pattern);
        },

        bevalidRulesPhone: function($element) {
            var pattern = /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/;
            return matchValue($element, pattern);
        },

        bevalidRulesUrl: function($element) {
            var pattern = /(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
            return matchValue($element, pattern);
        },

        bevalidRulesNumber: function($element) {
            var pattern = /^\d+$/;
            return matchValue($element, pattern);
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
        bevalidRulesNumber:   'This field must be only number'
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
     * Match value by patter
     */
    matchValue = function($element, pattern) {
        var isCustom = $element.hasClass('bevalid-custom-value'),
            value = isCustom ? $element.data('bevalid-custom-value') : $element.val();

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
        },

        /**
         * Parse all element who have attr data-bevalid.
         * And add observe to element
         */
        parse: function() {
            var $elements, allDataAttr, validToken = [];

            $elements = this.$wrap.find('[data-bevalid]');
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

            errorClass = 'bevalid-error';
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
                message = this.errorMessages[errorRules[i]];
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

            errorClass = 'bevalid-error';
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
            $.extend({},this.patterns, value);
        },

        /**
         * Extend error messages
         *
         * @param value
         */
        setErrorText: function(value) {
            $.extend({},this.errorMessages, value);
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
                case 'setPatterns': result = this.setPatterns(value); break;
                case 'setErrorText': result = this.setErrorText(value); break;
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