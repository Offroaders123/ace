import { implement } from "./oop.js";
import { EventEmitter } from "./event_emitter.js";

var optionsProvider = {
    setOptions: function(optList) {
        Object.keys(optList).forEach(function(key) {
            this.setOption(key, optList[key]);
        }, this);
    },
    getOptions: function(optionNames) {
        var result = {};
        if (!optionNames) {
            var options = this.$options;
            optionNames = Object.keys(options).filter(function(key) {
                return !options[key].hidden;
            });
        } else if (!Array.isArray(optionNames)) {
            result = optionNames;
            optionNames = Object.keys(result);
        }
        optionNames.forEach(function(key) {
            result[key] = this.getOption(key);
        }, this);
        return result;
    },
    setOption: function(name, value) {
        if (this["$" + name] === value)
            return;
        var opt = this.$options[name];
        if (!opt) {
            return warn('misspelled option "' + name + '"');
        }
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].setOption(name, value);

        if (!opt.handlesSet)
            this["$" + name] = value;
        if (opt && opt.set)
            opt.set.call(this, value);
    },
    getOption: function(name) {
        var opt = this.$options[name];
        if (!opt) {
            return warn('misspelled option "' + name + '"');
        }
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].getOption(name);
        return opt && opt.get ? opt.get.call(this) : this["$" + name];
    }
};

function warn(message) {
    if (typeof console != "undefined" && console.warn)
        console.warn.apply(console, arguments);
}

function reportError(msg, data) {
    var e = new Error(msg);
    e.data = data;
    if (typeof console == "object" && console.error)
        console.error(e);
    setTimeout(function() { throw e; });
}

var messages;

export class AppConfig {
    constructor() {
        this.$defaultOptions = {};
    }

    warn = warn;
    reportError = reportError;

    /*
     * option {name, value, initialValue, setterName, set, get }
     */
    defineOptions(obj, path, options) {
        if (!obj.$options)
            this.$defaultOptions[path] = obj.$options = {};

        Object.keys(options).forEach(function(key) {
            var opt = options[key];
            if (typeof opt == "string")
                opt = {forwardTo: opt};

            opt.name || (opt.name = key);
            obj.$options[opt.name] = opt;
            if ("initialValue" in opt)
                obj["$" + opt.name] = opt.initialValue;
        });

        // implement option provider interface
        implement(obj, optionsProvider);

        return this;
    }

    resetOptions(obj) {
        Object.keys(obj.$options).forEach(function(key) {
            var opt = obj.$options[key];
            if ("value" in opt)
                obj.setOption(key, opt.value);
        });
    }

    setDefaultValue(path, name, value) {
        if (!path) {
            for (path in this.$defaultOptions)
                if (this.$defaultOptions[path][name])
                    break;
            if (!this.$defaultOptions[path][name])
                return false;
        }
        var opts = this.$defaultOptions[path] || (this.$defaultOptions[path] = {});
        if (opts[name]) {
            if (opts.forwardTo)
                this.setDefaultValue(opts.forwardTo, name, value);
            else
                opts[name].value = value;
        }
    }

    setDefaultValues(path, optionHash) {
        Object.keys(optionHash).forEach(function(key) {
            this.setDefaultValue(path, key, optionHash[key]);
        }, this);
    }
    
    setMessages(value) {
        messages = value;
    }
    
    nls(string, params) {
        if (messages && !messages[string])  {
            warn("No message found for '" + string + "' in the provided messages, falling back to default English message.");
        }
        var translated = messages && messages[string] || string;
        if (params) {
            translated = translated.replace(/\$(\$|[\d]+)/g, function(_, name) {
                if (name == "$") return "$";
                return params[name];
            });
        }
        return translated;
    }
}

// module loading
implement(AppConfig.prototype, EventEmitter);