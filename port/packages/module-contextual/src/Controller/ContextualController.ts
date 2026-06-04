/**
 * Returns responses for Contextual module routes.
 *
 * Ports `Drupal\contextual\ContextualController`. Given a list of contextual
 * link IDs and their signed tokens, validates each token then renders the
 * corresponding `contextual_links` element. Because the IDs are arbitrary user
 * input, every ID is verified against its HMAC token before unserialization.
 */

import {
  BadRequestHttpException,
  type ContextualRenderRequest,
  type RendererLike,
  type TokenSigner,
} from '../contracts.js';
import { ContextualLinksSerializer } from '../ContextualLinksSerializer.js';

/** The JSON response body: rendered markup keyed by contextual ID. */
export type ContextualRenderResponse = Record<string, string>;

export class ContextualController {
  constructor(
    private readonly renderer: RendererLike,
    private readonly serializer: ContextualLinksSerializer,
    private readonly tokenSigner: TokenSigner,
  ) {}

  /**
   * Renders the requested contextual links. Ports `render()`.
   *
   * @throws {BadRequestHttpException}
   *   When `ids`/`tokens` are absent or any token fails verification.
   */
  render(request: ContextualRenderRequest): ContextualRenderResponse {
    if (request.ids === undefined) {
      throw new BadRequestHttpException('No contextual ids specified.');
    }
    if (request.tokens === undefined) {
      throw new BadRequestHttpException('No contextual ID tokens specified.');
    }

    const ids = normalize(request.ids);
    const tokens = normalize(request.tokens);

    const rendered: ContextualRenderResponse = {};
    for (const [key, id] of Object.entries(ids)) {
      const token = tokens[key];
      if (token === undefined || !timingSafeEqual(token, this.tokenSigner.sign(id))) {
        throw new BadRequestHttpException('Invalid contextual ID specified.');
      }
      rendered[id] = this.renderer.renderRoot({
        '#type': 'contextual_links',
        '#contextual_links': this.serializer.idToLinks(id),
      });
    }

    return rendered;
  }
}

/** Coerces an array-or-record request field into a string-keyed record. */
function normalize(value: Record<string, string> | string[]): Record<string, string> {
  if (Array.isArray(value)) {
    const out: Record<string, string> = {};
    value.forEach((v, i) => {
      out[String(i)] = v;
    });
    return out;
  }
  return value;
}

/**
 * Constant-time string comparison, porting PHP `hash_equals()`. Both inputs are
 * fixed-length HMAC tokens; comparing all characters avoids leaking which
 * prefix matched via early return timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
