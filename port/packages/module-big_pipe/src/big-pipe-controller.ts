/**
 * BigPipe route controller.
 *
 * Source: drupal-core/core/modules/big_pipe/src/Controller/BigPipeController.php
 *
 * Backs the `big_pipe.nojs` route (`/big_pipe/no-js`). When a browser without
 * JavaScript follows the `Refresh` meta tag emitted by `pageAttachments`, this
 * controller sets the no-JS cookie and redirects back to the original location
 * so subsequent placeholders are delivered server-side.
 */

import { NOJS_COOKIE } from './big-pipe-strategy.js';
import type { RequestLike } from './types.js';

/** Ports `AccessDeniedHttpException` (HTTP 403). */
export class AccessDeniedHttpException extends Error {
  readonly statusCode = 403;
  constructor(message = 'Access denied.') {
    super(message);
    this.name = 'AccessDeniedHttpException';
  }
}

/** Ports `HttpException(400, ...)` for the missing-destination case. */
export class BadRequestHttpException extends Error {
  readonly statusCode = 400;
  constructor(message = 'Bad request.') {
    super(message);
    this.name = 'BadRequestHttpException';
  }
}

/** A cookie descriptor on the redirect response. */
export interface ResponseCookie {
  name: string;
  value: string;
  /** Unix expiry timestamp; 0 = session cookie. */
  expire: number;
  path: string;
  /** Set without httpOnly so client-side JS can delete it. */
  httpOnly: boolean;
}

/**
 * Minimal port of `LocalRedirectResponse` with the cacheability and cookie
 * surface the controller needs.
 *
 * TODO(@drupaljs/routing): replace with the canonical LocalRedirectResponse.
 */
export interface LocalRedirectResponseLike {
  readonly targetUrl: string;
  readonly statusCode: number;
  readonly cookies: ResponseCookie[];
  readonly cacheContexts: string[];
}

export class BigPipeController {
  /**
   * Ports `BigPipeController::setNoJsCookie()`.
   *
   * @throws {AccessDeniedHttpException} When the no-JS cookie is already set
   *   (indicating a redirect loop).
   * @throws {BadRequestHttpException} When the `destination` query arg is absent.
   */
  setNoJsCookie(request: RequestLike): LocalRedirectResponseLike {
    if (request.cookies.has(NOJS_COOKIE)) {
      throw new AccessDeniedHttpException();
    }
    if (!request.query.has('destination')) {
      throw new BadRequestHttpException('The original location is missing.');
    }

    const destination = request.query.get('destination') ?? '/';
    return {
      targetUrl: destination,
      statusCode: 302,
      cookies: [
        {
          name: NOJS_COOKIE,
          value: '1',
          expire: 0,
          path: '/',
          httpOnly: false,
        },
      ],
      cacheContexts: [`cookies:${NOJS_COOKIE}`, 'session.exists'],
    };
  }
}
