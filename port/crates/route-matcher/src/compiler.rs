//! Route compilation — the Rust analogue of Drupal's `RouteCompiler` layered on
//! top of Symfony's `RouteCompiler`.
//!
//! Given a route path (e.g. `/node/{node}/edit`) and the set of placeholder
//! names that carry a *default value*, [`compile`] derives everything the
//! matcher needs:
//!
//! - `regex`         — an anchored pattern with named captures per variable,
//!   built for the Rust `regex` crate (`(?P<name>[^/]+)`), so a successful
//!   match yields each path variable by name.
//! - `variables`     — ordered list of placeholder names found in the path.
//! - `tokens`        — Symfony-style token stream used for URL *generation*
//!   (`["text", "/literal"]` and `["variable", "/", "[^/]+", "name"]`),
//!   emitted in reverse order exactly like Symfony.
//! - `pattern_outline` — the path with every `{placeholder}` replaced by `%`,
//!   lower-cased (Drupal stores/matches outlines case-insensitively).
//! - `fit`           — binary fitness: a 1 bit at every *static* path segment,
//!   0 at every wildcard segment, MSB = first segment.
//! - `num_parts`     — number of `/`-separated parts of the *full* path
//!   (including optional trailing defaulted parts).
//!
//! The `fit`, `pattern_outline` and `num_parts` are computed against the path
//! with trailing defaulted placeholders stripped, matching
//! `RouteCompiler::getPathWithoutDefaults()`.

/// A compiled route: derived data sufficient to match an incoming path and to
/// extract its parameters.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRoute {
    /// Route name (identifier used to report a match).
    pub name: String,
    /// Anchored regex with named captures, compatible with the `regex` crate.
    pub regex: String,
    /// Ordered placeholder names appearing in the path.
    pub variables: Vec<String>,
    /// Symfony-style token stream (reverse order) for URL generation.
    pub tokens: Vec<Token>,
    /// Path outline with placeholders normalized to `%`, lower-cased.
    pub pattern_outline: String,
    /// Binary fitness value (1 bit per static segment).
    pub fit: u32,
    /// Number of `/`-separated parts in the full path.
    pub num_parts: usize,
}

/// A Symfony-style routing token.
///
/// `Text` carries a literal path fragment; `Variable` carries the separator
/// that precedes it, the per-segment regex, and the variable name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Token {
    /// A literal fragment of the path (e.g. `/node`).
    Text(String),
    /// A placeholder: (separator, segment-regex, variable-name).
    Variable {
        /// The separator preceding the variable (usually `/`).
        separator: String,
        /// The per-segment regex (defaults to `[^/]+`).
        regex: String,
        /// The placeholder name.
        name: String,
    },
}

/// Splits a path on `/`, dropping empty parts (leading/trailing/duplicate
/// slashes), exactly like `preg_split('@/+@', $path, -1, PREG_SPLIT_NO_EMPTY)`.
pub fn split_parts(path: &str) -> Vec<&str> {
    path.split('/').filter(|p| !p.is_empty()).collect()
}

/// Replaces every `{placeholder}` with `%` (Drupal `getPatternOutline`),
/// then lower-cases (Drupal `CompiledRoute::__construct`).
pub fn pattern_outline(path: &str) -> String {
    normalize_outline(path).to_lowercase()
}

/// Replaces `{word}` placeholders with `%` without case-folding.
fn normalize_outline(path: &str) -> String {
    let mut out = String::with_capacity(path.len());
    let bytes = path.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'{' {
            // Find the matching close brace; the body must be a `\w+`.
            if let Some(close) = find_placeholder_end(&bytes[i..]) {
                out.push('%');
                i += close + 1;
                continue;
            }
        }
        // Push one full UTF-8 char starting at i.
        let ch = path[i..].chars().next().unwrap();
        out.push(ch);
        i += ch.len_utf8();
    }
    out
}

/// If `bytes` starts with `{`, returns the relative index of the closing `}`
/// when the body is a non-empty `\w+` token; otherwise `None`.
fn find_placeholder_end(bytes: &[u8]) -> Option<usize> {
    debug_assert_eq!(bytes[0], b'{');
    let mut j = 1;
    while j < bytes.len() && (bytes[j].is_ascii_alphanumeric() || bytes[j] == b'_') {
        j += 1;
    }
    if j > 1 && j < bytes.len() && bytes[j] == b'}' {
        Some(j)
    } else {
        None
    }
}

/// Computes the Drupal fitness of a path: a binary number with a 1 at every
/// fixed segment and 0 at every wildcard (placeholder) segment, MSB first.
///
/// Mirrors `RouteCompiler::getFit()`.
pub fn fit(path: &str) -> u32 {
    let parts = split_parts(path);
    let number_parts = parts.len();
    if number_parts == 0 {
        return 0;
    }
    let slashes = number_parts - 1;
    let mut fit = 0u32;
    for (k, part) in parts.iter().enumerate() {
        if !part.contains('{') {
            fit |= 1 << (slashes - k);
        }
    }
    fit
}

/// Removes `/{name}` fragments for each placeholder name that has a default,
/// matching `RouteCompiler::getPathWithoutDefaults()`.
fn path_without_defaults(path: &str, defaults: &[String]) -> String {
    let mut result = path.to_string();
    for name in defaults {
        let needle = format!("/{{{name}}}");
        result = result.replace(&needle, "");
    }
    result
}

/// Compiles a route path into a [`CompiledRoute`].
///
/// `defaults` is the list of placeholder names that have a default value;
/// these are stripped (only at the end of the path) before computing `fit`,
/// `pattern_outline` and `num_parts`, so optional trailing parameters still
/// match shorter incoming paths.
pub fn compile(name: &str, path: &str, defaults: &[String]) -> CompiledRoute {
    let stripped = path_without_defaults(path, defaults);
    let (regex, variables, tokens) = compile_pattern(path, defaults);
    CompiledRoute {
        name: name.to_string(),
        regex,
        variables,
        tokens,
        pattern_outline: pattern_outline(&stripped),
        fit: fit(&stripped),
        // num_parts counts the FULL path (incl. optional trailing parts), so
        // the `number_parts >= count_parts` candidate filter still admits the
        // route when the incoming path omits the trailing optional segment.
        num_parts: split_parts(path).len(),
    }
}

/// An intermediate parsed segment of a route path.
enum Segment {
    /// A literal fragment (may include a leading/trailing separator).
    Literal(String),
    /// A placeholder: (separator-char, variable-name).
    Variable(String, String),
}

/// Parses a path into an ordered list of literal/variable segments.
fn parse_segments(path: &str) -> Vec<Segment> {
    let mut segments: Vec<Segment> = Vec::new();
    let bytes = path.as_bytes();
    let mut i = 0;
    let mut literal = String::new();
    while i < bytes.len() {
        if bytes[i] == b'{' {
            if let Some(close) = find_placeholder_end(&bytes[i..]) {
                let name = &path[i + 1..i + close];
                // Separator = the char immediately before the brace.
                let separator = literal
                    .chars()
                    .last()
                    .map(|c| c.to_string())
                    .unwrap_or_default();
                // Move the separator out of the literal into the variable.
                if !separator.is_empty() {
                    literal.pop();
                }
                if !literal.is_empty() {
                    segments.push(Segment::Literal(std::mem::take(&mut literal)));
                }
                segments.push(Segment::Variable(separator, name.to_string()));
                i += close + 1;
                continue;
            }
        }
        let ch = path[i..].chars().next().unwrap();
        literal.push(ch);
        i += ch.len_utf8();
    }
    if !literal.is_empty() {
        segments.push(Segment::Literal(literal));
    }
    segments
}

/// Builds the regex, the ordered variable list and the Symfony token stream
/// (emitted in reverse, like Symfony's compiler).
///
/// A trailing run of placeholders whose names are all in `defaults` is emitted
/// as nested optional groups, so the route matches both with and without those
/// segments (the omitted ones fall back to their default values).
fn compile_pattern(path: &str, defaults: &[String]) -> (String, Vec<String>, Vec<Token>) {
    let segments = parse_segments(path);
    let mut variables: Vec<String> = Vec::new();
    let mut tokens: Vec<Token> = Vec::new();

    // Determine the index of the first segment in the optional trailing run:
    // a maximal suffix consisting solely of defaulted variables.
    let mut optional_from = segments.len();
    for (idx, seg) in segments.iter().enumerate().rev() {
        match seg {
            Segment::Variable(_, name) if defaults.iter().any(|d| d == name) => {
                optional_from = idx;
            }
            _ => break,
        }
    }

    let seg_regex = "[^/]+";
    let mut regex = String::from("^");
    let mut open_optional = 0usize;

    // From `optional_from` onward, each variable opens a nested optional group
    // so trailing defaulted segments can be independently omitted.
    for (idx, seg) in segments.iter().enumerate() {
        match seg {
            Segment::Literal(text) => {
                regex.push_str(&escape_regex(text));
                tokens.push(Token::Text(text.clone()));
            }
            Segment::Variable(separator, name) => {
                if idx >= optional_from {
                    regex.push_str("(?:");
                    open_optional += 1;
                }
                regex.push_str(&escape_regex(separator));
                regex.push_str("(?P<");
                regex.push_str(name);
                regex.push('>');
                regex.push_str(seg_regex);
                regex.push(')');
                variables.push(name.clone());
                tokens.push(Token::Variable {
                    separator: separator.clone(),
                    regex: seg_regex.to_string(),
                    name: name.clone(),
                });
            }
        }
    }
    // Close the nested optional groups (innermost last), each made optional.
    for _ in 0..open_optional {
        regex.push_str(")?");
    }
    regex.push('$');

    // Symfony stores tokens in reverse (URL generation walks them backwards).
    tokens.reverse();
    (regex, variables, tokens)
}

/// Escapes regex metacharacters in a literal path fragment.
fn escape_regex(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for ch in text.chars() {
        if matches!(
            ch,
            '.' | '\\'
                | '+'
                | '*'
                | '?'
                | '('
                | ')'
                | '['
                | ']'
                | '{'
                | '}'
                | '^'
                | '$'
                | '|'
                | '#'
        ) {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn names(s: &[&str]) -> Vec<String> {
        s.iter().map(|x| x.to_string()).collect()
    }

    // --- split_parts -------------------------------------------------------

    #[test]
    fn split_parts_ignores_leading_trailing_and_duplicate_slashes() {
        assert_eq!(split_parts("/a//b/c/"), vec!["a", "b", "c"]);
        assert_eq!(split_parts("test"), vec!["test"]);
        assert!(split_parts("/").is_empty());
        assert!(split_parts("").is_empty());
    }

    // --- pattern_outline ---------------------------------------------------

    #[test]
    fn pattern_outline_replaces_placeholders_with_percent_and_lowercases() {
        assert_eq!(pattern_outline("/Test/{Something}/More"), "/test/%/more");
        assert_eq!(pattern_outline("/node/{node}/edit"), "/node/%/edit");
        assert_eq!(pattern_outline("/{a}/{b}"), "/%/%");
    }

    #[test]
    fn pattern_outline_leaves_non_placeholder_braces_alone() {
        // An empty or non-\w brace body is not a placeholder.
        assert_eq!(pattern_outline("/a/{}/b"), "/a/{}/b");
    }

    // --- fit ---------------------------------------------------------------
    // These mirror RouteCompilerTest::providerTestGetFit exactly.

    #[test]
    fn fit_matches_drupal_data_provider() {
        assert_eq!(fit("test"), 1);
        assert_eq!(fit("/estWithLeadingSlash"), 1);
        assert_eq!(fit("testWithTrailingSlash/"), 1);
        assert_eq!(fit("/testWithSlashes/"), 1);
        assert_eq!(fit("test/with/multiple/parts"), 15);
        assert_eq!(fit("test/with/{some}/slugs"), 13);
        assert_eq!(
            fit("test/very/long/path/that/drupal/7/could/not/have/handled"),
            2047
        );
    }

    #[test]
    fn fit_empty_path_is_zero() {
        assert_eq!(fit("/"), 0);
        assert_eq!(fit(""), 0);
    }

    // --- compile: testCompilation -----------------------------------------

    #[test]
    fn compile_matches_drupal_test_compilation() {
        let c = compile("r", "/test/{something}/more", &[]);
        assert_eq!(c.fit, 5, "fit should be 101 binary");
        assert_eq!(c.pattern_outline, "/test/%/more");
        assert_eq!(c.num_parts, 3);
        assert_eq!(c.variables, names(&["something"]));
    }

    #[test]
    fn compile_strips_trailing_default_for_fit_and_outline() {
        // RouteCompilerTest::testCompilationDefaultValue — "here" has a default.
        let c = compile("r", "/test/{something}/more/{here}", &names(&["here"]));
        assert_eq!(c.fit, 5, "fit should be 101 binary (here stripped)");
        assert_eq!(c.pattern_outline, "/test/%/more");
        // num_parts counts the FULL path including the optional trailing part.
        assert_eq!(c.num_parts, 4);
        // The regex still captures the optional variable.
        assert_eq!(c.variables, names(&["something", "here"]));
    }

    // --- compile: regex shape ---------------------------------------------

    #[test]
    fn compile_builds_anchored_named_capture_regex() {
        let c = compile("r", "/node/{node}/edit", &[]);
        assert_eq!(c.regex, "^/node/(?P<node>[^/]+)/edit$");
    }

    #[test]
    fn compile_static_path_has_no_variables() {
        let c = compile("r", "/admin/content", &[]);
        assert_eq!(c.regex, "^/admin/content$");
        assert!(c.variables.is_empty());
        assert_eq!(c.fit, 3);
    }

    #[test]
    fn compile_escapes_regex_metacharacters_in_literals() {
        let c = compile("r", "/a.b/{x}", &[]);
        assert_eq!(c.regex, r"^/a\.b/(?P<x>[^/]+)$");
    }

    // --- compile: tokens (Symfony reverse order) --------------------------

    #[test]
    fn compile_emits_symfony_reverse_tokens() {
        let c = compile("r", "/node/{node}", &[]);
        assert_eq!(
            c.tokens,
            vec![
                Token::Variable {
                    separator: "/".to_string(),
                    regex: "[^/]+".to_string(),
                    name: "node".to_string(),
                },
                Token::Text("/node".to_string()),
            ]
        );
    }

    // --- optional trailing parameter (default value) ----------------------

    #[test]
    fn compile_makes_trailing_defaulted_var_optional_in_regex() {
        let c = compile("r", "/test/{something}/more/{here}", &names(&["here"]));
        assert_eq!(
            c.regex,
            "^/test/(?P<something>[^/]+)/more(?:/(?P<here>[^/]+))?$"
        );
    }

    #[test]
    fn compile_nests_multiple_trailing_optionals() {
        // Both x and y are optional; omitting x must also allow omitting y.
        let c = compile("r", "/p/{x}/{y}", &names(&["x", "y"]));
        assert_eq!(c.regex, "^/p(?:/(?P<x>[^/]+)(?:/(?P<y>[^/]+))?)?$");
    }
}
