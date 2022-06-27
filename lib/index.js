"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
;
function Rests(endpoints, options) {
    const fetch = (typeof window !== 'undefined') ? window === null || window === void 0 ? void 0 : window.fetch : require("node-fetch"), FormData = (typeof window !== 'undefined') ? window === null || window === void 0 ? void 0 : window.FormData : require("form-data");
    if (!fetch) {
        throw new Error("Fetch API is not installed. If you are using Node please run `npm install node-fetch`");
    }
    if (!FormData) {
        throw new Error("FormData is not installed. If you are using Node please run `npm install form-data`");
    }
    const copyOptions = (o) => (Object.assign(Object.assign({}, o), { headers: Object.assign({}, o.headers), params: Object.assign({}, o.params), values: Object.assign({}, o.values) }));
    const parseSet = (values) => {
        var _a, _b;
        if (((_b = (_a = values === null || values === void 0 ? void 0 : values.__proto__) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) != "Object") {
            throw new Error("Invalid $options object.");
        }
        let saveOptions = copyOptions(values.$options || {});
        delete values['$options'];
        return Object.assign(Object.assign({}, saveOptions), { values: Object.assign(Object.assign({}, saveOptions.values), values) });
    };
    const mergeOptions = (prevOptions, currentOptions, mutate = false //Mutate the previous options?
    ) => {
        let firstOptions = mutate ? prevOptions || {} : copyOptions(prevOptions || {});
        let secondOptions = copyOptions(currentOptions || {});
        secondOptions.headers = Object.assign(Object.assign({}, firstOptions.headers), secondOptions.headers);
        secondOptions.params = Object.assign(Object.assign({}, firstOptions.params), secondOptions.params);
        secondOptions.values = Object.assign(Object.assign({}, firstOptions.values), secondOptions.values);
        Object.assign(firstOptions, secondOptions);
        return firstOptions;
    };
    endpoints = Object.assign({}, endpoints);
    let global_options = {
        base: "",
        headers: {
            'User-Agent': 'Rests JS (v1.0.3)'
        },
        params: {},
        values: {},
        on_error: void 0,
        on_success: void 0,
        on_request: void 0,
        fetch_agent: null,
    };
    mergeOptions(global_options, ((endpoints === null || endpoints === void 0 ? void 0 : endpoints.$options) || {}), true);
    mergeOptions(global_options, options, true);
    const def_param_enctypes = {
        "json": "application/json",
        "form": "multipart/form-data",
        "urlencoded": "application/x-www-form-urlencoded",
        "text": "text/plain"
    }, allowed_param_enctypes = Object.values(def_param_enctypes), allowed_param_locations = ["headers", "body", "query", "path"], def_param_locations = {
        'POST': 'body',
        'GET': 'query',
    };
    const serializers = {
        'multipart/form-data': (function () {
            var formData = new FormData();
            formData.toString = function () { return this; };
            return formData;
        }),
        'application/x-www-form-urlencoded': (function () { return new URLSearchParams(); }),
        'application/json': (function () {
            return {
                append: function (key, value) { this.data = this.data || {}; this.data[key] = value; },
                toString: function () { return JSON.stringify(this.data); },
                isEmpty: function () {
                    return (!this.data || Object.keys(this.data).length == 0);
                }
            };
        }),
        'text/plain': (function () {
            return {
                append: function (_, value) { this.data = this.data || []; return this.data.push(value); },
                toString: function () { return this.data.join(''); },
                isEmpty: function () {
                    return (!this.data || this.data.length == 0);
                }
            };
        })
    };
    const isNull = (value) => {
        return value === null || value === undefined;
    };
    const isEmptyIterable = (iterable) => {
        for (var _ of iterable) {
            return false;
        }
        return true;
    };
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    const capitalize = (string) => {
        return string.substr(0, 1).toUpperCase() + string.substr(1, string.length);
    };
    const formToJson = (f) => {
        return Object.fromEntries(Array.from(f.keys(), (k) => (k.endsWith('[]') ? [k.slice(0, -2), f.getAll(k)] : [k, f.get(k)])));
    };
    const get = (t, path) => (path.split(".").reduce((r, k) => r === null || r === void 0 ? void 0 : r[k], t));
    const getOne = (...args) => {
        for (var i = 0; i < args.length; i++) {
            if (args[i] !== null && args[i] !== undefined) {
                return args[i];
            }
        }
        return null;
    };
    /**
     * Fetch API
     */
    const sendRequest = (url, options, currentOptions, requestInfo) => __awaiter(this, void 0, void 0, function* () {
        return fetch(url, options)
            .then(function (res) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    var contentType = res.headers.get('Content-Type') || '';
                    let formattedResponse = {
                        statusCode: res.status,
                        statusText: res.statusText,
                        headers: res.headers,
                        type: res.type,
                        ok: res.ok
                    };
                    let responseTypes = {
                        'application\/json': 'json',
                        'text\/plain': 'text',
                        '(multipart\/form\-data|application\/x\-www\-form\-urlencoded)': 'formData',
                        'blob': 'blob'
                    };
                    let currentResponseType = Object.keys(responseTypes).find((responseType) => (new RegExp(responseType)).test(contentType)) || "blob";
                    formattedResponse[responseTypes[currentResponseType]] = yield res[responseTypes[currentResponseType]]();
                    formattedResponse['message'] = ((_a = formattedResponse === null || formattedResponse === void 0 ? void 0 : formattedResponse.json) === null || _a === void 0 ? void 0 : _a.message) || (res.ok ? "Success." : "Something went wrong.");
                    if (!res.ok) {
                        throw formattedResponse;
                    }
                    if (currentOptions.on_success) {
                        let successCallbackRes = currentOptions.on_success(formattedResponse, requestInfo);
                        if (successCallbackRes !== undefined) {
                            return successCallbackRes;
                        }
                    }
                    return formattedResponse;
                }
                catch (err) {
                    if (currentOptions.on_error) {
                        let errorCallbackRes = currentOptions.on_error(err, requestInfo);
                        if (errorCallbackRes !== undefined) {
                            return errorCallbackRes;
                        }
                    }
                    return Promise.reject(err);
                }
            });
        });
    });
    /**
     * Request Wrapper
     */
    function wrap(endpoint, categoryOptions, categoryKey) {
        endpoint.method = (endpoint.method || "get").toUpperCase(),
            endpoint.params = endpoint.params || {};
        const sender = function (params) {
            var _a, _b, _c, _d, _e;
            return __awaiter(this, void 0, void 0, function* () {
                if (this instanceof sender) {
                    throw new Error("This is an endpoint, you can't initialize this.");
                }
                var currentOptions = mergeOptions(global_options, categoryOptions);
                currentOptions.on_request = endpoint.on_request || currentOptions.on_request;
                currentOptions.on_success = endpoint.on_success || currentOptions.on_success;
                currentOptions.on_error = endpoint.on_error || currentOptions.on_error;
                var url = `${currentOptions.base}${endpoint.path}`;
                if ((params === null || params === void 0 ? void 0 : params['$sandbox']) || ((_a = currentOptions === null || currentOptions === void 0 ? void 0 : currentOptions.values) === null || _a === void 0 ? void 0 : _a['$sandbox'])) {
                    url = `${currentOptions.sandboxBase || currentOptions.base}${endpoint.path}`;
                }
                var options = {
                    method: endpoint.method,
                    headers: Object.assign({}, currentOptions.headers),
                    agent: currentOptions.fetch_agent
                };
                var enctype = allowed_param_enctypes.includes(endpoint.enctype) ? endpoint.enctype : def_param_enctypes[endpoint.enctype || "json"];
                var request_params = Object.assign({}, currentOptions.params, endpoint.params);
                var bodySerializer = serializers[enctype](), querySerializer = new URLSearchParams();
                /**
                 * Parse Params
                 */
                if (((_b = params === null || params === void 0 ? void 0 : params.constructor) === null || _b === void 0 ? void 0 : _b.name) == 'FormData') {
                    params = formToJson(params);
                }
                else {
                    params = params || {};
                }
                for (var param_name in request_params) {
                    var param = request_params[param_name];
                    var current_param_value = params[param_name], options_param_value = (_c = currentOptions === null || currentOptions === void 0 ? void 0 : currentOptions.values) === null || _c === void 0 ? void 0 : _c[param_name], default_param_value = param.default, example_param_value = (params === null || params === void 0 ? void 0 : params['$sandbox']) ? param.example : undefined;
                    var param_value = getOne(current_param_value, options_param_value, example_param_value, default_param_value);
                    var param_dest = param.name || param_name;
                    var param_error = param.help || `The '${param_name}' field is invalid.`;
                    //Required Param or not
                    if (param.required && isNull(param_value)) {
                        var error = new Error(param_error);
                        error.field = param_name;
                        throw error;
                    }
                    //Skip, not required
                    if (isNull(param_value))
                        continue;
                    //Formatter function?
                    if (typeof param.format === "function") {
                        try {
                            param_value = param.format(param_value);
                        }
                        catch (e) {
                            var error = new Error(e.message || param_error);
                            error.field = param_name;
                            throw error;
                        }
                    }
                    //Type
                    if (param.type && param.type !== "any") {
                        var error = new Error(param_error);
                        error.field = param_name;
                        if ((["string", "boolean", "number"].includes(param.type) && typeof param_value != param.type) ||
                            (param.type == "array" && !Array.isArray(param_value)) ||
                            (param.type == "object" && (!param_value || param_value.__proto__.constructor.name !== "Object"))) {
                            throw error;
                        }
                    }
                    //Validate
                    if (param.validate) {
                        if (((_e = (_d = param.validate) === null || _d === void 0 ? void 0 : _d.constructor) === null || _e === void 0 ? void 0 : _e.name) == "RegExp") {
                            param.validate['toJSON'] = function () {
                                return param.validate.toString().replace(/^\//g, '').replace(/\/$/g, '');
                            };
                        }
                        if (!(new RegExp(param.validate).test(param_value))) {
                            var error = new Error(param_error);
                            error.field = param_name;
                            throw error;
                        }
                    }
                    //Max/Min
                    if (param.type == "number") {
                        if (param.hasOwnProperty('max') && !isNaN(param.max) && Number(param_value) > Number(param.max)) {
                            var error = new Error(`The maximum allowed value allowed for the ${param_dest} parameter is ${param.max}`);
                            error.field = param_name;
                            throw error;
                        }
                        if (param.hasOwnProperty('min') && !isNaN(param.min) && Number(param_value) < Number(param.min)) {
                            var error = new Error(`The minimum allowed value allowed for the ${param_dest} parameter is ${param.min}`);
                            error.field = param_name;
                            throw error;
                        }
                    }
                    //In
                    if (param.in && Array.isArray(param.in) && !param.in.includes(param_value)) {
                        var error = new Error(`The ${param_dest} parameter should be one of these values: ${param.in}`);
                        error.field = param_name;
                        throw error;
                    }
                    //Location
                    var param_location = (typeof param.location === "string" ? param.location.toLowerCase() : def_param_locations[options.method]);
                    if (!param_location || !allowed_param_locations.includes(param_location)) {
                        throw new Error(`Invalid location for '${param_name}' field.`);
                    }
                    if (param_location == "headers") {
                        options['headers'] = options['headers'] || {};
                        options['headers'][param_dest] = param_value;
                        continue;
                    }
                    if (param_location == "body") {
                        bodySerializer.append(param_dest, param_value);
                        continue;
                    }
                    if (param_location == "query") {
                        querySerializer.append(param_dest, param_value);
                        continue;
                    }
                    if (param_location == "path") {
                        url = url.replace(new RegExp(`\{${escapeRegExp(param_dest).trim()}\}`), param_value);
                    }
                }
                //Set Query
                var hasQuery = querySerializer.toString();
                if (hasQuery) {
                    url = `${url}?${hasQuery}`;
                }
                //Set Body
                var isEmptyBody = (bodySerializer.keys && isEmptyIterable(bodySerializer.keys())) ||
                    (bodySerializer.getLengthSync && bodySerializer.getLengthSync() == 0) ||
                    (bodySerializer.isEmpty && bodySerializer.isEmpty());
                if (!isEmptyBody) {
                    options['body'] = bodySerializer.toString();
                }
                //Set content-type header, (not set for multipart/form-data because it overrides the automatically generated multipart key)
                if (options['body'] && enctype !== 'multipart/form-data') {
                    options['headers'] = options['headers'] || {};
                    options['headers']['Content-Type'] = enctype;
                }
                let requestInfo = {
                    url: url,
                    options: options,
                    params: params,
                    key: categoryKey,
                    instance: global_options['__$root_instance__'],
                    self: wrap(endpoint, categoryOptions, categoryKey)
                };
                //Pre-Request Middleware
                if (currentOptions.on_request) {
                    var requestCallbackRes = yield Promise.resolve(currentOptions.on_request(requestInfo));
                    if (requestCallbackRes) {
                        if ((requestCallbackRes === null || requestCallbackRes === void 0 ? void 0 : requestCallbackRes.url) || (requestCallbackRes === null || requestCallbackRes === void 0 ? void 0 : requestCallbackRes.options)) {
                            url = requestCallbackRes.url || url;
                            options = requestCallbackRes.options || options;
                        }
                        else {
                            return requestCallbackRes;
                        }
                    }
                    if (requestCallbackRes === false) {
                        return false;
                    }
                }
                return sendRequest(url, options, currentOptions, requestInfo);
            });
        };
        return sender;
    }
    /**
     * Initalize a category and set values for it's endpoints. (Full category options can be updated with special $options key)
     */
    function newCategory(name, categoryOptions, categoryName, isRoot) {
        name = name || "Rests";
        var New = {
            [name]: (function (values) {
                if (!(this instanceof New[name])) {
                    throw new Error("This is a category, you can initalize this category to update values using 'new' command.");
                }
                if (isRoot) {
                    throw new Error("This is already initialized, you can use 'set' instead.");
                }
                let currentOptions = mergeOptions(global_options, categoryOptions);
                let updateOptions = parseSet(values);
                let newOptions = mergeOptions(currentOptions, updateOptions);
                return Rests(categoryName ? get(endpoints, categoryName) : endpoints, newOptions);
            })
        };
        if (isRoot) {
            /**
             * Root object can update it's options
             */
            New[name]['set'] = function (values) {
                if (this instanceof New[name]['set']) {
                    throw new Error("The set object can't be initialized.");
                }
                let updateOptions = parseSet(values);
                //Mutate Global Options
                mergeOptions(global_options, updateOptions, true);
                return New[name];
            };
        }
        return New[name];
    }
    /**
     * Recursive loop on schema and make wrappers
     */
    function traverse(root, schema, categoryOptions, categoryKey) {
        for (var category in schema) {
            var tree = schema[category];
            if (!tree || typeof tree !== 'object') {
                continue;
            }
            //Skip duplicate keys in main object root
            if (typeof root[category] !== "undefined") {
                console.warn(`Skipping ${category} as it confilicts with another key in the object`);
                continue;
            }
            let categoryName = `${categoryKey ? categoryKey + '.' : ''}${category}`;
            //Is Endpoint
            if (tree.hasOwnProperty('path')) {
                var endpoint = tree;
                root[category] = wrap(endpoint, categoryOptions, categoryName);
            }
            //Is Category, recursion
            else {
                // Don't make category for special objects
                if (category.substr(0, 1) === '$') {
                    continue;
                }
                let nextOptions = categoryOptions;
                if (tree === null || tree === void 0 ? void 0 : tree['$options']) {
                    nextOptions = mergeOptions(categoryOptions, tree === null || tree === void 0 ? void 0 : tree['$options']);
                }
                root[category] = traverse(newCategory(category, nextOptions, categoryName), tree, nextOptions, categoryName);
            }
        }
        return root;
    }
    const rootCategory = Object.defineProperty(newCategory("Rests", global_options, undefined, true), '__schema__', {
        value: {
            schema: endpoints,
            options: global_options
        },
        writable: false,
        enumerable: false
    });
    global_options['__$root_instance__'] = rootCategory;
    return traverse(rootCategory, endpoints, {});
}
let x = {
    '$other': {
        'openapi': {
            'fields': 'test',
        },
        'nmi': {
            'test': 'ss'
        }
    },
};
exports.default = Rests;
module.exports = Rests;
