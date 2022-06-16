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
    let global_options = Object.assign({ base: "", headers: {}, params: {}, on_error: void 0, on_success: void 0, on_request: void 0, fetch_agent: null }, options);
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
    const sendRequest = (url, options, restOptions) => {
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
                    };
                    let currentResponseType = Object.keys(responseTypes).find((responseType) => (new RegExp(responseType)).test(contentType)) || "blob";
                    formattedResponse[responseTypes[currentResponseType]] = yield res[responseTypes[currentResponseType]]();
                    formattedResponse['message'] = ((_a = formattedResponse === null || formattedResponse === void 0 ? void 0 : formattedResponse.json) === null || _a === void 0 ? void 0 : _a.message) || (res.ok ? "Success." : "Something went wrong.");
                    if (!res.ok) {
                        throw formattedResponse;
                    }
                    if (restOptions.on_success) {
                        let successCallbackRes = restOptions.on_success(formattedResponse, { url, options });
                        if (successCallbackRes !== undefined) {
                            return successCallbackRes;
                        }
                    }
                    return formattedResponse;
                }
                catch (err) {
                    if (restOptions.on_error) {
                        let errorCallbackRes = restOptions.on_error(err, { url, options });
                        if (errorCallbackRes !== undefined) {
                            return errorCallbackRes;
                        }
                    }
                    return Promise.reject(err);
                }
            });
        });
    };
    /**
     * Constructor Maker Wrapper
     * Initalize a category and set values for it's endpoints. (Full category options can be updated with special $options key)
     * @param {*} root
     * @param {*} name
     */
    function newSetObject(root, name, category_options) {
        name = name || "Rests";
        var New = {
            [name]: (function (values) {
                if (!(this instanceof New[name])) {
                    throw new Error("You must initalize this object using 'new' command.");
                }
                Object.assign(this, root);
                const setter = (function (values) {
                    if ((this instanceof setter)) {
                        throw new Error("This object is already initialized.");
                    }
                    // Special Options object
                    if (values["$options"]) {
                        if (typeof values["$options"] === "string" || typeof values["$options"] === "function" || typeof values["$options"] === "number" || typeof values["$options"] === "boolean") {
                            throw new Error("Invalid $options object received.");
                        }
                        Object.assign(category_options, values["$options"]);
                        delete values["$options"];
                    }
                    // Set Values for endpoints
                    category_options.values = Object.assign(Object.assign({}, category_options.values), values);
                }).bind(this);
                this.set = setter;
                this.set(values);
                return this;
            })
        };
        return New[name];
    }
    /**
     * Main Wrapper
     * @param {Object} request
     */
    function wrap(request, category_options, testing = false) {
        request.method = (request.method || "get").toUpperCase(),
            request.params = request.params || {};
        return function (params) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                var stored_options = category_options || global_options;
                stored_options.on_request = request.on_request || stored_options.on_request;
                stored_options.on_success = request.on_success || stored_options.on_success;
                stored_options.on_error = request.on_error || stored_options.on_error;
                var url = `${stored_options.base}${request.path}`;
                var options = {
                    method: request.method,
                    headers: Object.assign({}, stored_options.headers),
                    agent: stored_options.fetch_agent
                };
                var enctype = allowed_param_enctypes.includes(request.enctype) ? request.enctype : def_param_enctypes[request.enctype || "json"];
                var request_params = Object.assign({}, stored_options.params, request.params);
                var bodySerializer = serializers[enctype](), querySerializer = new URLSearchParams();
                /**
                 * Parse Params
                 */
                if (((_a = params === null || params === void 0 ? void 0 : params.constructor) === null || _a === void 0 ? void 0 : _a.name) == 'FormData') {
                    let buildParams = {};
                    params.forEach(function (value, key) {
                        buildParams[key] = value;
                    });
                    params = buildParams;
                }
                else {
                    params = params || {};
                }
                for (var param_name in request_params) {
                    var param = request_params[param_name];
                    var param_value = !isNull(params[param_name]) ? params[param_name] : (param.hasOwnProperty('default') ? param.default : ((stored_options.values && stored_options.values[param_name]) || (testing ? param.example : undefined)));
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
                        if (!(new RegExp(param.validate).test(param_value))) {
                            var error = new Error(param_error);
                            error.field = param_name;
                            throw error;
                        }
                    }
                    //In
                    if (param.in && Array.isArray(param.in) && !param.in.includes(param_value)) {
                        var error = new Error(param_error);
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
                        url = url.replace(new RegExp(`\:${escapeRegExp(param_dest)}`), param_value);
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
                //Pre-Request Middleware
                if (stored_options.on_request) {
                    var requestCallbackRes = yield Promise.resolve(stored_options.on_request({ url, options }));
                    if (requestCallbackRes === false) {
                        return false;
                    }
                    if (requestCallbackRes && (requestCallbackRes === null || requestCallbackRes === void 0 ? void 0 : requestCallbackRes.url)) {
                        url = requestCallbackRes.url;
                    }
                    if (requestCallbackRes && (requestCallbackRes === null || requestCallbackRes === void 0 ? void 0 : requestCallbackRes.options)) {
                        options = requestCallbackRes.options;
                    }
                }
                return sendRequest(url, options, stored_options);
            });
        };
    }
    /**
     * Recursive loop on schema and make wrappers
     * @param {*} root
     * @param {*} tree
     * @param {*} name
     */
    function traverse(root, tree, name, category_options) {
        for (var category in tree) {
            var category_tree = tree[category];
            if (!category_tree || typeof category_tree !== 'object') {
                continue;
            }
            //Is Endpoint
            if (category_tree.hasOwnProperty('path')) {
                var request = category_tree;
                root._ne = true; //Not empty
                //Skip duplicate keys in main object root
                if (typeof root[category] !== "undefined") {
                    console.warn(`Skipping ${category} as it confilicts with another key in the object, avoid using keys like ('set') because they are reserved constructor words.`);
                    continue;
                }
                root[category] = wrap(request, category_options);
            }
            //Is Category, recursion
            else {
                var subcategory = category_tree;
                if (category === '$options') { //Special Options
                    var options = subcategory;
                    category_options = Object.assign({}, category_options, options);
                }
                // Skip Special Object (i.e Options)
                if (category.substr(0, 1) === '$') {
                    continue;
                }
                root[category] = traverse({}, subcategory, category, category_options);
            }
        }
        //If it has endpoints , add the 'set' constructor function.
        root = (root._ne) ? Object.assign(root, {
            'set': newSetObject(root, name, category_options)
        }) : root;
        return root;
    }
    const instanceRoot = Object.defineProperty({}, '__schema__', {
        value: {
            schema: endpoints,
            options: global_options
        },
        writable: false,
        enumerable: false
    });
    return traverse(instanceRoot, endpoints, "Rests", global_options);
}
module.exports = Rests;
exports.default = Rests;
