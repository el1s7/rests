/*!
 * Rests v{restsVersion}
 * Author: Elis <github@elis.cc>
 * License: MIT
 */
export interface ResponseObject {
    statusCode: number;
    statusText: string;
    headers: Headers;
    type: "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";
    ok: boolean;
    json?: any;
    text?: string;
    formData?: FormData;
    blob?: Blob;
    message?: string;
}
declare type methodType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "CONNECT" | "HEAD" | "get" | "post" | "put" | "delete" | "options" | "connect" | "head";
export declare type paramOptions = {
    /** The parameter HTTP name */
    name?: string;
    /** Required or not */
    required?: boolean;
    /** A help message to throw in case of errors */
    help?: string;
    /** Param type (default: any)*/
    type?: "string" | "number" | "array" | "object" | "boolean" | "any";
    /** Example value */
    example?: any;
    /** Format functions that accepts supplied value and returns formatted value, you can also throw an error. */
    format?: (value: any) => any;
    /** Regex validation */
    validate?: RegExp | string;
    /** Array validation */
    in?: any[];
    /** Maximum for number type values  */
    max?: number;
    /** Minimum for number type values */
    min?: number;
    /** Default value */
    default?: any;
    /** HTTP Location (default: "query" for GET and "body" for "post") */
    location?: "body" | "headers" | "query" | "path";
};
/**
 * Request parameters
 */
export interface Params {
    [name: string]: paramOptions;
}
export interface OptionsParams {
    [name: string]: paramOptions & {
        /** This parameter should only be set on initialization of the category */
        $initsOnly?: boolean;
    };
}
export declare type HookRequest = {
    /**
     * Fetch URL
     */
    url: string;
    /**
     * Fetch Options
     */
    options: any;
    /**
     * The parameters supplied for this request
     */
    params: any;
    /**
    * Endpoint Key, e.g "user.login"
    */
    key: string;
    /**
     * Rests instance
     */
    instance: any;
    /**
     * Current Endpoint Method
     */
    self: any;
};
export interface Hooks {
    /**
     * A global hook function that is called on request.
     *
     *
     * To modify request
     * ```javascript
     * return {url, options}
     * ```
     *
     * To stop request
     * ```javascript
     * return false
     * ```
     */
    on_request?: (request: HookRequest) => any;
    /**
     * A hook function that is called on successful response, you can also modify and return a different response.
     */
    on_success?: (response: ResponseObject, request?: HookRequest) => any;
    /**
     * A hook function that is called on errors.
     *
     *
     * To return a different error:
     *
     *
     * ```javascript
     * return Promise.reject(CustomErrorResponse: ResponseObject)
     * ```
     *
     */
    on_error?: (error: ResponseObject | unknown, request?: HookRequest) => any;
}
export declare type codeTemplateVars = {
    packageName: string;
    endpoint: Endpoint;
    initsJs: string[];
    initsPy: string[];
    categoryName: string;
    requestKey: string;
    rootCategoryKey: string;
    rootRequestKey: string;
    requestParamsJs: string;
    requestParamsPy: string;
};
export interface openAPIOpts {
    /** Hide this endpoint */
    hide?: boolean;
    /** Neccesary for request code samples */
    packageName?: string;
    /** Code samples template */
    jsTemplate?: (codeTemplateVars: codeTemplateVars) => string;
    /** Code samples template */
    pyTemplate?: (codeTemplateVars: codeTemplateVars) => string;
    /** Any field to include in endpoints object */
    fields?: {
        parameters?: any[];
        responses?: any;
        security?: any;
        tags?: any[];
    } | {
        [key: string]: any;
    };
}
declare type $other = {
    openapi: openAPIOpts;
} | {
    [key: string]: any | openAPIOpts;
};
export interface Endpoint extends Hooks {
    /**
     * The HTTP request path. (default: GET)
     */
    path: string;
    /**
     * The HTTP request method
     */
    method?: methodType;
    /**
     * The body encode type, only for requests that have a body.
     *
     * **json** (application/json) *default*
     *
     * **form** (multipart/form-data)
     *
     * **urlencoded** (application/x-www-form-urlencoded)
     *
     * **text** (text/plain)
     */
    enctype?: "form" | "urlencoded" | "json" | "txt";
    params?: Params;
    /**
     * A short description of the endpoint
     */
    help?: string;
    /**
     * A long description of the endpoint
     */
    comment?: string;
    /**
     * Example response for documentation purposes. This can also be generated automatically.
     */
    example_response?: any;
    /**
     * Any other thing for settings purposes/third-party plugins
     */
    $other?: $other;
}
export interface Options extends Hooks {
    /**
     * This will be prepended before the requests path.
     *
     * @example https://example.com
     */
    base?: string;
    /**
     * This will be used for sending sandbox requests (useful for automatic response generation mockups)
     */
    sandboxBase?: string;
    /**
     * Key-value object of headers include in requests
     */
    headers?: any;
    /**
     * Params to include in requests
     */
    params?: OptionsParams;
    /**
     * Key-value object to set default values for params
     */
    values?: {
        [param_name: string]: any;
    };
    /**
     * Node-Fetch option for adding a proxy
     */
    fetch_agent?: any;
    /**
     * Any other settings for external purposes/third-party plugins
     */
    $other?: $other;
}
export interface CategorySchema {
    /**
      * A help message, might be used for JSDoc & documentation
      */
    help?: string;
    /**
      * A help message, might be used for JSDoc & documentation
      */
    $help?: string;
    /**
     * Override global options for this category
     */
    $options?: Options;
}
export interface newCategoryOptions {
    /**
     * Override global options for this category
     */
    $options: Options;
}
export interface newCategoryWithOptions extends newCategoryOptions {
    [param: string]: any | Options;
}
export declare type newCategoryValues = {
    [param: string]: any;
} | newCategoryWithOptions;
/**
* A object consisting of Endpoint Objects or nested subcategories.
*/
export interface Schema extends CategorySchema {
    [name: string]: string | Options | Endpoint | Schema;
}
declare function Rests(endpoints: Schema, options?: Options): unknown;
export default Rests;
