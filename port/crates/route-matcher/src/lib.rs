//! `drupaljs-route-matcher` — compiled-route regex matching for Drupal.js.
//!
//! This crate is the Rust analogue of Drupal's `RouteCompiler` /
//! `CompiledRoute` (layered on Symfony's `RouteCompiler` / `UrlMatcher`) and
//! the candidate-selection logic in `RouteProvider`. It pairs with the
//! `@drupaljs/routing` `PathMatcher` seam:
//!
//! - [`compile`] turns a route path into a `{ regex, variables, tokens,
//!   pattern_outline, fit, num_parts }` record.
//! - [`match_route`] takes an incoming path plus a set of compiled routes and
//!   returns the best `{ name, params }` by static-prefix/fit ordering, falling
//!   back through candidates until a regex matches.
//!
//! Two surfaces are exported (mirroring `drupaljs-graph`):
//!
//! 1. **Plain-Rust API** ([`compiler`], [`matcher`]) for the `rlib` — typed,
//!    panic-free, no JS marshalling. Other crates depend on these directly.
//! 2. **`#[wasm_bindgen]` API** (this file) for the `cdylib` — paths and
//!    compiled-route arrays cross the boundary as JSON strings (no `serde`, to
//!    keep the WASM bundle small per ADR-0015). Batch compile, then match many
//!    paths against the cached compiled set to amortize the boundary cost.
//!
//! ## TypeScript wrapper (consumed by `@drupaljs/routing`)
//!
//! ```ts
//! import init, { compile, match_route } from "drupaljs-route-matcher";
//! await init();
//! // Compile once at router-build time:
//! const compiled = JSON.parse(compile("node.edit", "/node/{node}/edit", []));
//! // compiled = { name, regex, variables, tokens, patternOutline, fit, numParts }
//! //
//! // Match at request time (pass the full compiled-route array as JSON):
//! const res = JSON.parse(match_route("/node/42/edit", JSON.stringify([compiled])));
//! // res = { matched: true, name: "node.edit", params: { node: "42" } }
//! //   or  { matched: false }
//! ```

mod compiler;
mod matcher;

pub use compiler::{compile as compile_route, fit, pattern_outline, CompiledRoute, Token};
pub use matcher::{candidate_outlines, match_path, MatchResult};

use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Minimal JSON helpers (no serde — keeps the bundle small, ADR-0015).
// ---------------------------------------------------------------------------

/// Appends a JSON-escaped, quoted string to `out`.
fn push_json_string(out: &mut String, value: &str) {
    out.push('"');
    for ch in value.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
}

/// Serializes a [`CompiledRoute`] to the JSON shape the TS wrapper expects.
fn compiled_route_to_json(c: &CompiledRoute) -> String {
    let mut out = String::from("{");
    out.push_str("\"name\":");
    push_json_string(&mut out, &c.name);
    out.push_str(",\"regex\":");
    push_json_string(&mut out, &c.regex);
    out.push_str(",\"variables\":");
    push_string_array(&mut out, &c.variables);
    out.push_str(",\"tokens\":");
    push_tokens(&mut out, &c.tokens);
    out.push_str(",\"patternOutline\":");
    push_json_string(&mut out, &c.pattern_outline);
    out.push_str(",\"fit\":");
    out.push_str(&c.fit.to_string());
    out.push_str(",\"numParts\":");
    out.push_str(&c.num_parts.to_string());
    out.push('}');
    out
}

fn push_string_array(out: &mut String, items: &[String]) {
    out.push('[');
    for (i, item) in items.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        push_json_string(out, item);
    }
    out.push(']');
}

/// Tokens serialize as Symfony-style arrays:
/// text  -> `["text", "/literal"]`
/// var   -> `["variable", separator, regex, name]`
fn push_tokens(out: &mut String, tokens: &[Token]) {
    out.push('[');
    for (i, token) in tokens.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        match token {
            Token::Text(text) => {
                out.push_str("[\"text\",");
                push_json_string(out, text);
                out.push(']');
            }
            Token::Variable {
                separator,
                regex,
                name,
            } => {
                out.push_str("[\"variable\",");
                push_json_string(out, separator);
                out.push(',');
                push_json_string(out, regex);
                out.push(',');
                push_json_string(out, name);
                out.push(']');
            }
        }
    }
    out.push(']');
}

fn match_result_to_json(result: &Option<MatchResult>) -> String {
    match result {
        None => String::from("{\"matched\":false}"),
        Some(m) => {
            let mut out = String::from("{\"matched\":true,\"name\":");
            push_json_string(&mut out, &m.name);
            out.push_str(",\"params\":{");
            for (i, (k, v)) in m.params.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                push_json_string(&mut out, k);
                out.push(':');
                push_json_string(&mut out, v);
            }
            out.push_str("}}");
            out
        }
    }
}

// ---------------------------------------------------------------------------
// Minimal JSON parsing for the compiled-route array passed to match_route.
// We only parse the fields the matcher needs: name, regex, variables,
// patternOutline, fit, numParts. (tokens are generation-only and ignored.)
// ---------------------------------------------------------------------------

/// Parses the compiled-route array JSON produced by [`compile`] back into
/// [`CompiledRoute`] values. On malformed input, returns an empty list so the
/// boundary stays panic-free (a `match` against no routes yields no match).
fn parse_compiled_routes(json: &str) -> Vec<CompiledRoute> {
    let value = match json::parse(json) {
        Some(v) => v,
        None => return Vec::new(),
    };
    let arr = match value {
        json::Value::Array(a) => a,
        _ => return Vec::new(),
    };
    arr.into_iter()
        .filter_map(|v| match v {
            json::Value::Object(fields) => {
                let get_str = |k: &str| fields.iter().find(|(fk, _)| fk == k).and_then(|(_, fv)| {
                    if let json::Value::String(s) = fv {
                        Some(s.clone())
                    } else {
                        None
                    }
                });
                let get_num = |k: &str| fields.iter().find(|(fk, _)| fk == k).and_then(|(_, fv)| {
                    if let json::Value::Number(n) = fv {
                        Some(*n)
                    } else {
                        None
                    }
                });
                let get_strs = |k: &str| {
                    fields
                        .iter()
                        .find(|(fk, _)| fk == k)
                        .and_then(|(_, fv)| {
                            if let json::Value::Array(a) = fv {
                                Some(
                                    a.iter()
                                        .filter_map(|e| match e {
                                            json::Value::String(s) => Some(s.clone()),
                                            _ => None,
                                        })
                                        .collect::<Vec<_>>(),
                                )
                            } else {
                                None
                            }
                        })
                        .unwrap_or_default()
                };
                Some(CompiledRoute {
                    name: get_str("name")?,
                    regex: get_str("regex")?,
                    variables: get_strs("variables"),
                    tokens: Vec::new(),
                    pattern_outline: get_str("patternOutline").unwrap_or_default(),
                    fit: get_num("fit").unwrap_or(0.0) as u32,
                    num_parts: get_num("numParts").unwrap_or(0.0) as usize,
                })
            }
            _ => None,
        })
        .collect()
}

// ---------------------------------------------------------------------------
// WASM exports.
// ---------------------------------------------------------------------------

/// Compiles a route path into a JSON `CompiledRoute` record.
///
/// `defaults_json` is a JSON `string[]` of placeholder names that carry a
/// default value (stripped from the trailing outline so optional params still
/// match). Pass `"[]"` when there are none.
///
/// Returns a JSON object:
/// `{ "name", "regex", "variables", "tokens", "patternOutline", "fit", "numParts" }`.
#[wasm_bindgen]
pub fn compile(name: &str, path: &str, defaults_json: &str) -> String {
    let defaults = match json::parse(defaults_json) {
        Some(json::Value::Array(a)) => a
            .into_iter()
            .filter_map(|v| match v {
                json::Value::String(s) => Some(s),
                _ => None,
            })
            .collect::<Vec<_>>(),
        _ => Vec::new(),
    };
    compiled_route_to_json(&compile_route(name, path, &defaults))
}

/// Matches `path` against the JSON array of compiled routes (as produced by
/// [`compile`]). Returns `{ "matched": true, "name", "params" }` on the best
/// match, or `{ "matched": false }` when nothing matches.
#[wasm_bindgen]
pub fn match_route(path: &str, compiled_routes_json: &str) -> String {
    let routes = parse_compiled_routes(compiled_routes_json);
    let result = match_path(path, &routes);
    match_result_to_json(&result)
}

/// Returns the Drupal fitness of a path (1 bit per static segment).
///
/// Exposed for callers that want to bucket routes by fit without a full
/// compile (mirrors `RouteCompiler::getFit()`).
#[wasm_bindgen]
pub fn route_fit(path: &str) -> u32 {
    fit(path)
}

// ---------------------------------------------------------------------------
// Tiny dependency-free JSON parser (only what the boundary needs).
// ---------------------------------------------------------------------------
mod json {
    /// A minimal JSON value sufficient for parsing compiled-route arrays.
    #[derive(Debug, Clone, PartialEq)]
    pub enum Value {
        Null,
        Bool(bool),
        Number(f64),
        String(String),
        Array(Vec<Value>),
        Object(Vec<(String, Value)>),
    }

    /// Parses a complete JSON document, returning `None` on any error.
    pub fn parse(input: &str) -> Option<Value> {
        let mut p = Parser {
            chars: input.chars().collect(),
            pos: 0,
        };
        p.skip_ws();
        let v = p.value()?;
        p.skip_ws();
        if p.pos == p.chars.len() {
            Some(v)
        } else {
            None
        }
    }

    struct Parser {
        chars: Vec<char>,
        pos: usize,
    }

    impl Parser {
        fn peek(&self) -> Option<char> {
            self.chars.get(self.pos).copied()
        }
        fn next(&mut self) -> Option<char> {
            let c = self.chars.get(self.pos).copied();
            if c.is_some() {
                self.pos += 1;
            }
            c
        }
        fn skip_ws(&mut self) {
            while matches!(self.peek(), Some(' ' | '\t' | '\n' | '\r')) {
                self.pos += 1;
            }
        }
        fn value(&mut self) -> Option<Value> {
            self.skip_ws();
            match self.peek()? {
                '"' => self.string().map(Value::String),
                '{' => self.object(),
                '[' => self.array(),
                't' | 'f' => self.boolean(),
                'n' => self.null(),
                _ => self.number(),
            }
        }
        fn string(&mut self) -> Option<String> {
            if self.next()? != '"' {
                return None;
            }
            let mut s = String::new();
            loop {
                match self.next()? {
                    '"' => return Some(s),
                    '\\' => match self.next()? {
                        '"' => s.push('"'),
                        '\\' => s.push('\\'),
                        '/' => s.push('/'),
                        'n' => s.push('\n'),
                        'r' => s.push('\r'),
                        't' => s.push('\t'),
                        'b' => s.push('\u{0008}'),
                        'f' => s.push('\u{000C}'),
                        'u' => {
                            let mut code = 0u32;
                            for _ in 0..4 {
                                let c = self.next()?;
                                code = code * 16 + c.to_digit(16)?;
                            }
                            s.push(char::from_u32(code)?);
                        }
                        _ => return None,
                    },
                    c => s.push(c),
                }
            }
        }
        fn object(&mut self) -> Option<Value> {
            self.next(); // consume '{'
            let mut fields = Vec::new();
            self.skip_ws();
            if self.peek() == Some('}') {
                self.next();
                return Some(Value::Object(fields));
            }
            loop {
                self.skip_ws();
                let key = self.string()?;
                self.skip_ws();
                if self.next()? != ':' {
                    return None;
                }
                let val = self.value()?;
                fields.push((key, val));
                self.skip_ws();
                match self.next()? {
                    ',' => continue,
                    '}' => return Some(Value::Object(fields)),
                    _ => return None,
                }
            }
        }
        fn array(&mut self) -> Option<Value> {
            self.next(); // consume '['
            let mut items = Vec::new();
            self.skip_ws();
            if self.peek() == Some(']') {
                self.next();
                return Some(Value::Array(items));
            }
            loop {
                let val = self.value()?;
                items.push(val);
                self.skip_ws();
                match self.next()? {
                    ',' => continue,
                    ']' => return Some(Value::Array(items)),
                    _ => return None,
                }
            }
        }
        fn boolean(&mut self) -> Option<Value> {
            if self.consume_lit("true") {
                Some(Value::Bool(true))
            } else if self.consume_lit("false") {
                Some(Value::Bool(false))
            } else {
                None
            }
        }
        fn null(&mut self) -> Option<Value> {
            if self.consume_lit("null") {
                Some(Value::Null)
            } else {
                None
            }
        }
        fn consume_lit(&mut self, lit: &str) -> bool {
            let end = self.pos + lit.len();
            if end <= self.chars.len() && self.chars[self.pos..end].iter().collect::<String>() == lit
            {
                self.pos = end;
                true
            } else {
                false
            }
        }
        fn number(&mut self) -> Option<Value> {
            let start = self.pos;
            if self.peek() == Some('-') {
                self.next();
            }
            while matches!(self.peek(), Some(c) if c.is_ascii_digit() || c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-')
            {
                self.next();
            }
            let slice: String = self.chars[start..self.pos].iter().collect();
            slice.parse::<f64>().ok().map(Value::Number)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn parses_object_with_array_and_number() {
            let v = parse(r#"{"a":1,"b":["x","y"],"c":true}"#).unwrap();
            if let Value::Object(fields) = v {
                assert_eq!(fields.len(), 3);
            } else {
                panic!("expected object");
            }
        }

        #[test]
        fn rejects_trailing_garbage() {
            assert!(parse(r#"{}x"#).is_none());
        }

        #[test]
        fn parses_escaped_string() {
            let v = parse(r#""a\"b""#).unwrap();
            assert_eq!(v, Value::String("a\"b".to_string()));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compile_emits_expected_json_shape() {
        let json = compile("node.edit", "/node/{node}/edit", "[]");
        assert!(json.contains("\"name\":\"node.edit\""));
        assert!(json.contains("\"regex\":\"^/node/(?P<node>[^/]+)/edit$\""));
        assert!(json.contains("\"variables\":[\"node\"]"));
        assert!(json.contains("\"patternOutline\":\"/node/%/edit\""));
        assert!(json.contains("\"fit\":5"));
        assert!(json.contains("\"numParts\":3"));
    }

    #[test]
    fn compile_serializes_tokens_symfony_shape() {
        let json = compile("r", "/node/{node}", "[]");
        // Reverse order: variable token first, then the literal text token.
        assert!(json.contains(r#""tokens":[["variable","/","[^/]+","node"],["text","/node"]]"#));
    }

    #[test]
    fn round_trip_compile_then_match() {
        let compiled = compile("node.edit", "/node/{node}/edit", "[]");
        let arr = format!("[{compiled}]");
        let res = match_route("/node/42/edit", &arr);
        assert!(res.contains("\"matched\":true"));
        assert!(res.contains("\"name\":\"node.edit\""));
        assert!(res.contains("\"node\":\"42\""));
    }

    #[test]
    fn match_route_no_match_shape() {
        let compiled = compile("admin", "/admin/content", "[]");
        let arr = format!("[{compiled}]");
        let res = match_route("/nope", &arr);
        assert_eq!(res, "{\"matched\":false}");
    }

    #[test]
    fn match_route_prefers_higher_fit() {
        let a = compile("node.canonical", "/node/{node}", "[]");
        let b = compile("node.add", "/node/add", "[]");
        let arr = format!("[{a},{b}]");
        let res = match_route("/node/add", &arr);
        assert!(res.contains("\"name\":\"node.add\""));
    }

    #[test]
    fn match_route_optional_trailing_param_omitted() {
        let c = compile("r", "/test/{something}/more/{here}", "[\"here\"]");
        let arr = format!("[{c}]");
        // The 3-part path matches with the optional trailing `here` omitted.
        let res = match_route("/test/foo/more", &arr);
        assert!(res.contains("\"matched\":true"));
        assert!(res.contains("\"something\":\"foo\""));
    }

    #[test]
    fn route_fit_export_matches_compiler() {
        assert_eq!(route_fit("test/with/{some}/slugs"), 13);
    }

    #[test]
    fn match_route_tolerates_malformed_json() {
        // Panic-free boundary: garbage yields no routes -> no match.
        assert_eq!(match_route("/x", "not json"), "{\"matched\":false}");
    }
}
