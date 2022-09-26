declare namespace WdioInterceptorService {
  type HTTPMethod =
    | 'GET'
    | 'HEAD'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'CONNECT'
    | 'OPTIONS'
    | 'TRACE'
    | 'PATCH';

  interface ExpectedRequest {
    method: HTTPMethod;
    url: string;
    statusCode: number;
  }

  interface PendingRequest {
    url: string;
    method: HTTPMethod;
    body: string | null | object;
    headers: object;
    pending: true;
  }

  interface CompletedRequest {
    url: string;
    method: HTTPMethod;
    body: string | null | object;
    pending: false;
    headers: object;
    response: {
      headers: object;
      body: string | null | object;
      statusCode: number;
    };
  }

  type InterceptedRequest = PendingRequest | CompletedRequest;

  interface OrderingStrategy {
    /** Whether requests are ordered by time of initiation, or fulfillment */
    orderBy?: 'START' | 'END';
  }
  interface AssertionRequestOrderStrategy extends OrderingStrategy {
    /** Whether the intercepted request order must match the order in which expectations were set */
    inOrder?: boolean;
  }

  interface GetRequestOptions extends OrderingStrategy {
    /** Whether pending requests will be included in the response */
    includePending?: boolean;
  }
  type OnlyCompletedRequests = { includePending: false };
}
/**
 * Convert T to T or Promise<T> depending if `@wdio/sync` is being used or not.
 */
type AsyncSync<T> = WebdriverIO.Browser extends WebDriver.Client
  ? T
  : Promise<T>;

declare module WebdriverIO {
  interface Browser {
    setupInterceptor(): AsyncSync<void>;
    disableInterceptor(): AsyncSync<void>;
    excludeUrls(urls: (string | RegExp)[]): AsyncSync<void>;
    expectRequest(
      method: WdioInterceptorService.HTTPMethod,
      url: string | RegExp,
      statusCode: number
    ): AsyncSync<Browser>;
    hasPendingRequests(): AsyncSync<boolean>;
    assertRequests(
      options?: WdioInterceptorService.OrderingStrategy
    ): AsyncSync<Browser>;
    assertExpectedRequestsOnly(inOrder?: boolean): AsyncSync<Browser>;
    assertExpectedRequestsOnly(
      options?: WdioInterceptorService.AssertionRequestOrderStrategy
    ): AsyncSync<Browser>;
    resetExpectations(): AsyncSync<Browser>;
    getExpectations(): AsyncSync<WdioInterceptorService.ExpectedRequest[]>;
    getRequest(
      index: number,
      options?: WdioInterceptorService.GetRequestOptions &
        WdioInterceptorService.OnlyCompletedRequests
    ): AsyncSync<WdioInterceptorService.CompletedRequest>;
    getRequest(
      index: number,
      options: WdioInterceptorService.GetRequestOptions
    ): AsyncSync<WdioInterceptorService.InterceptedRequest>;
    getRequests(
      options?: WdioInterceptorService.GetRequestOptions &
        WdioInterceptorService.OnlyCompletedRequests
    ): AsyncSync<WdioInterceptorService.CompletedRequest[]>;
    getRequests(
      options: WdioInterceptorService.GetRequestOptions
    ): AsyncSync<WdioInterceptorService.InterceptedRequest[]>;
  }
}

declare module 'wdio-intercept-service' {
  export = WdioInterceptorService;
}
