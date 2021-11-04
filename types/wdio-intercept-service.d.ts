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

  interface GetRequestOptions {
    includePending?: boolean;
  }

  type OnlyCompletedRequests = { includePending: false };
}
/**
 * Convert T to T or Promise<T> depending if `@wdio/sync` is being used or not.
 */
type AsyncSync<T> = WebdriverIO.BrowserObject extends WebDriver.Client
  ? T
  : Promise<T>;

declare module WebdriverIO {
  interface Browser {
    setupInterceptor: () => AsyncSync<void>;
    expectRequest: (
      method: WdioInterceptorService.HTTPMethod,
      url: string | RegExp,
      statusCode: number
    ) => AsyncSync<BrowserObject>;
    assertRequests: () => AsyncSync<BrowserObject>;
    assertExpectedRequestsOnly: (inOrder?: boolean) => AsyncSync<BrowserObject>;
    resetExpectations: () => AsyncSync<BrowserObject>;
    getExpectations: () => AsyncSync<WdioInterceptorService.ExpectedRequest[]>;
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
