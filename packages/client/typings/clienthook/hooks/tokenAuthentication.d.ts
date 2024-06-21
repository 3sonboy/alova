import { AlovaGenerics, AlovaOptions, AlovaRequestAdapter, Method, StatesHook } from 'alova';

export type AlovaResponded<
  SH extends StatesHook<any, any>,
  RA extends AlovaRequestAdapter<any, any, any>
> = NonNullable<
  AlovaOptions<
    Pick<
      AlovaGenerics<ReturnType<SH['create']>, SH['export'] extends (...args: any) => infer R ? R : any>,
      'State' | 'Computed'
    > &
      (Parameters<RA>[1] extends Method<infer AG> ? AG : never)
  >['responded']
>;

export type MetaMatches = Record<string, any>;
export type ResponseInterceptHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  response: ReturnType<ReturnType<RA>['response']> extends Promise<infer RE> ? RE : never,
  method: Parameters<RA>[1]
) => RESULT;
export type ResponseErrorInterceptHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  error: any,
  method: Parameters<RA>[1]
) => RESULT;
export type ResponseAuthorizationInterceptor<RA extends AlovaRequestAdapter<any, any, any>> =
  | ResponseInterceptHandler<RA, void | Promise<void>>
  | {
      metaMatches?: MetaMatches;
      handler: ResponseInterceptHandler<RA, void | Promise<void>>;
    };

export type RequestHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  method: Parameters<RA>[1]
) => RESULT;

export interface TokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>> {
  /**
   * 忽略拦截的method
   */
  visitorMeta?: MetaMatches;
  /**
   * 登录请求拦截器
   */
  login?: ResponseAuthorizationInterceptor<RA>;

  /**
   * 登出请求拦截器
   */
  logout?: ResponseAuthorizationInterceptor<RA>;
  /**
   * 赋值token回调函数，登录标识和访客标识的请求不会触发此函数
   * @param method method实例
   */
  assignToken?: <AG extends AlovaGenerics>(method: Method<AG>) => void | Promise<void>;
}
export interface ClientTokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * 在请求前的拦截器中判断token是否过期，并刷新token
   */
  refreshToken?: {
    /**
     * 判断token是否过期
     */
    isExpired: RequestHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: RequestHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };
}

export type BeforeRequestType<AG extends AlovaGenerics> = (
  originalBeforeRequest?: AlovaOptions<AG>['beforeRequest']
) => AlovaOptions<AG>['beforeRequest'];
export type ResponseType<AG extends AlovaGenerics> = (
  originalResponded?: AlovaOptions<AG>['responded']
) => AlovaOptions<AG>['responded'];

export interface TokenAuthenticationResult<AG extends AlovaGenerics> {
  onAuthRequired: BeforeRequestType<AG>;
  onResponseRefreshToken: ResponseType<AG>;
  waitingList: {
    method: Method;
    resolve: () => void;
  }[];
}

export interface ServerTokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * 在请求成功拦截器中判断token是否过期，并刷新token
   */
  refreshTokenOnSuccess?: {
    /**
     * 判断token是否过期
     */
    isExpired: ResponseInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: ResponseInterceptHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };

  /**
   * 在请求失败拦截器中判断token是否过期，并刷新token
   */
  refreshTokenOnError?: {
    /**
     * 判断token是否过期
     */
    isExpired: ResponseErrorInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: ResponseErrorInterceptHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };
}

/**
 * 创建客户端的token认证拦截器
 * @example
 * ```js
 * const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication(\/* ... *\/);
 * const alova = createAlova({
 *   // ...
 *   beforeRequest: onAuthRequired(method => {
 *     // ...
 *   }),
 *   responded: onResponseRefreshToken({
 *     onSuccess(response, method) {
 *       // ...
 *     },
 *     onError(error, method) {
 *       // ...
 *     },
 *   })
 * });
 * ```
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export declare function createClientTokenAuthentication<AG extends AlovaGenerics = AlovaGenerics>(
  options: ClientTokenAuthenticationOptions<
    AlovaRequestAdapter<AG['RequestConfig'], AG['Response'], AG['ResponseHeader']>
  >
): TokenAuthenticationResult<AG>;

/**
 * 创建服务端的token认证拦截器
 * @example
 * ```js
 * const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication(\/* ... *\/);
 * const alova = createAlova({
 *   // ...
 *   beforeRequest: onAuthRequired(method => {
 *     // ...
 *   }),
 *   responded: onResponseRefreshToken({
 *     onSuccess(response, method) {
 *       // ...
 *     },
 *     onError(error, method) {
 *       // ...
 *     },
 *   })
 * });
 * ```
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export declare function createServerTokenAuthentication<AG extends AlovaGenerics = AlovaGenerics>(
  options: ServerTokenAuthenticationOptions<AlovaRequestAdapter<any, any, any>>
): TokenAuthenticationResult<AG>;
