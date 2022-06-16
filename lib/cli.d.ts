#!/usr/bin/env node
/*!
 * Rests CLI v1.0.0
 * Author: Elis <github@elis.cc>
 * License: MIT
 */
declare const fs: any;
declare const url: any;
declare const path: any;
declare const Rests: any;
declare const getArgs: any;
interface DocsOptions {
    /**
     * Generate requests example
     *
     * @default true
     */
    request?: boolean;
    /**
     * Generate response examples?
     *
     * @default false
     */
    response?: boolean;
    /**
     * Sleep between requests
     *
     * @default 0
     */
    responseSleep?: number;
    /**
     * Don't generate responses automatically
     * @default true
     */
    onlyExampleResponses?: boolean;
    /**
     * Include optionial parameters on docs
     */
    showOptional?: boolean;
    /**
     * Add a markdown comment on optional parameters
     */
    commentOptional?: boolean;
    /**
     * API Title
     */
    apiName?: string;
    headStartLevel?: number;
    /**
     * File output
     */
    output?: string;
}
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
        /** HTTP Location */
        location?: "body" | "headers" | "query" | "path";
    };
}
interface Endpoint {
    /**
     * The HTTP request method
     */
    method: methodType;
    /**
     * The HTTP request path
     */
    path: string;
    /**
     * The body encode type, only for requests that have a body.
     *
     * **form** (multipart/form-data) *default*
     *
     * **url** (application/x-www-form-urlencoded)
     *
     * **json** (application/json)
     *
     * **text** (text/plain)
     */
    enctype?: "form" | "urlencoded" | "json" | "txt";
    params?: Params;
    /**
     * A hook function that is called on successful response, you can also modify and return a different response.
     */
    on_success?: (response: any) => any;
    /**
     * A hook function that is called on errors.
     */
    on_error?: (error: any) => any;
    /**
     * A hook function that is called on request.
     */
    on_request?: (request: any) => any;
    /**
     * A description used for documantation generation
     */
    help?: string;
    /**
     * Example response for documentation generation
     */
    example_response?: any;
}
interface Options {
    base?: string;
    headers?: any;
    params?: Params;
    /**
     * Set default values for parameters
     */
    values?: {
        [param_name: string]: any;
    };
    /**
     * A global hook function that is called on request.
     */
    on_request?: (request: {
        url: string;
        options: any;
    }) => any;
    /**
     * A hook function that is called on successful response, you can also modify and return a different response.
     */
    on_success?: (response: ResponseObject, request?: {
        url: string;
        options: any;
    }) => any;
    /**
     * A hook function that is called on errors.
     */
    on_error?: (error: ResponseObject | unknown, request?: {
        url: string;
        options: any;
    }) => any;
    /**
     * Node-Fetch option for adding a proxy
     */
    fetch_agent?: any;
}
interface newSetObjectOptions {
    /**
     * Override global options for this category
     */
    $options: Options;
}
interface newSetObjectWithOptions extends newSetObjectOptions {
    [param: string]: any | Options;
}
declare type newSetObjectParams = {
    [param: string]: any;
} | newSetObjectWithOptions;
interface newSetObject<T> {
    new (values: newSetObjectParams): T;
}
/**
* A object consisting of Endpoint Objects or nested subcategories.
*/
interface CategorySchema {
    [endpointOrCategory: string]: Endpoint | CategorySchema;
}
/**
* A object consisting of Endpoint Objects or nested subcategories.
*/
declare type Category = CategorySchema & {
    /**
     * Override global options for this category
     */
    $options?: Options;
    /**
     * A help message, might be used for documentation generation
     */
    $help?: string;
    path?: void;
};
declare const capitalize: (string: string) => string;
declare const getJSDoc: (string: string, tabs?: number, tabFirst?: boolean) => string;
declare const dent: (str: string, size?: number) => string;
/**
 * Generate a simple Markdown documentation
 */
declare function generateDocs(schema: Category, rests?: typeof Rests, options?: Options, docsOptions?: DocsOptions): Promise<{
    reference: string;
    body: string;
}>;
/**
 * Generate typescript interface
 */
declare function generateTypes(schema: Category, options?: {
    output: string;
}): string;
declare const main: () => Promise<void>;
