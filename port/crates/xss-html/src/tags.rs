//! Default allowed-tag lists, ported verbatim from `Drupal\Component\Utility\Xss`.

/// Tags allowed by `Xss::filter()` when no explicit list is supplied
/// (`Xss::$htmlTags`).
pub const DEFAULT_HTML_TAGS: &[&str] = &[
    "a", "em", "strong", "cite", "blockquote", "code", "ul", "ol", "li", "dl",
    "dt", "dd",
];

/// Tags allowed by `Xss::filterAdmin()` (`Xss::$adminTags`) — the permissive
/// inline-markup set that still excludes `script`, `style`, `iframe`, etc.
pub const ADMIN_TAGS: &[&str] = &[
    "a", "abbr", "acronym", "address", "article", "aside", "b", "bdi", "bdo",
    "big", "blockquote", "br", "caption", "cite", "code", "col", "colgroup",
    "command", "dd", "del", "details", "dfn", "div", "dl", "dt", "em",
    "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6",
    "header", "hgroup", "hr", "i", "img", "ins", "kbd", "li", "mark", "menu",
    "meter", "nav", "ol", "output", "p", "pre", "progress", "q", "rp", "rt",
    "ruby", "s", "samp", "section", "small", "span", "strong", "sub", "summary",
    "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "tt",
    "u", "ul", "var", "wbr",
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn html_tag_list_matches_drupal_default() {
        assert_eq!(DEFAULT_HTML_TAGS.len(), 12);
        assert!(DEFAULT_HTML_TAGS.contains(&"a"));
        assert!(!DEFAULT_HTML_TAGS.contains(&"script"));
        assert!(!DEFAULT_HTML_TAGS.contains(&"img"));
    }

    #[test]
    fn admin_tag_list_excludes_dangerous_tags() {
        for bad in ["script", "style", "iframe", "frame", "frameset", "object",
                    "embed", "applet", "param", "layer", "meta", "link"] {
            assert!(!ADMIN_TAGS.contains(&bad), "admin list must not allow {bad}");
        }
        // Spot-check permissive inclusions.
        assert!(ADMIN_TAGS.contains(&"img"));
        assert!(ADMIN_TAGS.contains(&"div"));
        assert!(ADMIN_TAGS.contains(&"table"));
    }
}
