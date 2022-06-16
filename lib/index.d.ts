/*!
 * Rests-CLI
 * Author: Elis <github@elis.cc>
 * License: MIT
 */
interface ResponseObject {
    statusCode: number;
    statusText: string;
    headers: any;
    type: "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";
    ok: boolean;
    json?: any;
    text?: string;
    formData?: any;
    blob?: Blob;
    message?: string;
}
declare type methodType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "CONNECT" | "HEAD" | "get" | "post" | "put" | "delete" | "options" | "connect" | "head";
/**
 * Request parameters
 */
interface Params {
    [name: string]: {
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
        /** Format functions that accepts supplied value and returns formatted value. */
        format?: (value: any) => any;
        /** Regex validation */
        validate?: RegExp | string;
        /** Array validation */
        in?: any[];
        /** Default value */
        default?: any;
        /** HTTP Location (default: "query" for GET and "body" for "post") */
        location?: "body" | "headers" | "query" | "path";
    };
}
interface Hooks {
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
    on_request?: (request: {
        url: string;
        options: any;
    }) => ({
        url: string;
        options: any;
    } | false | void);
    /**
     * A hook function that is called on successful response, you can also modify and return a different response.
     */
    on_success?: (response: ResponseObject, request?: {
        url: string;
        options: any;
    }) => any;
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
    on_error?: (error: ResponseObject | unknown, request?: {
        url: string;
        options: any;
    }) => any;
}
interface Endpoint extends Hooks {
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
     * A description used for documantation generation
     */
    help?: string;
    /**
     * Example response for documentation generation
     */
    example_response?: any;
}
interface Options extends Hooks {
    /**
     * This will be prepended before the requests path.
     *
     * @example https://example.com
     */
    base?: string;
    /**
     * Key-value object of headers include in requests
     */
    headers?: any;
    /**
     * Params to include in requests
     */
    params?: Params;
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
}
interface CategorySchema {
    /**
     * Override global options for this category
     */
    $options?: Options;
    /**
     * A help message, might be used for JSDoc & documentation generation
     */
    $help?: string;
}
/**
* A object consisting of Endpoint Objects or nested subcategories.
*/
interface Schema extends CategorySchema {
    [name: string]: string | Options | Endpoint | Schema;
}
declare function Rests(endpoints: Schema, options?: Options): any;
export { Schema, Options, ResponseObject };
export default Rests;
