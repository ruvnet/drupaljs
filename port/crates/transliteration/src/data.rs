//! Generic transliteration tables ported verbatim from Drupal core's
//! `core/lib/Drupal/Component/Transliteration/data/x{00,01,02}.php`.
//!
//! Each table is a "bank": index `i` (0..=255) is the low byte of a Unicode
//! codepoint whose high byte equals the bank number. The value is:
//!   * `None`           -> no mapping in this bank (caller substitutes unknown)
//!   * `Some("")`       -> maps to the empty string (e.g. C1 control codes)
//!   * `Some("AE")` etc -> the US-ASCII replacement (may be multiple chars)
//!
//! Only the common ranges (Latin-1 Supplement, Latin Extended-A, Latin
//! Extended-B / IPA, bank x02) are bundled here, matching the task scope.

/// Look up the generic replacement for a Unicode code point.
///
/// `bank = code >> 8`, `offset = code & 0xff`. Returns the same tri-state the
/// PHP `$genericMap[$bank][$code] ?? $unknown` lookup produces:
///   * `None`        -> no entry (caller decides the unknown substitution)
///   * `Some(s)`     -> the mapped replacement (possibly empty)
pub fn lookup(code: u32) -> Option<&'static str> {
    let bank = (code >> 8) as usize;
    let offset = (code & 0xff) as usize;
    let table = match bank {
        0x00 => &X00,
        0x01 => &X01,
        0x02 => &X02,
        _ => return None,
    };
    table[offset]
}

// Helper aliases to keep the tables readable.
const N: Option<&str> = None; // no mapping
const E: Option<&str> = Some(""); // maps to empty string

macro_rules! s {
    ($v:literal) => {
        Some($v)
    };
}

/// Bank 0x00 — Latin-1 Supplement. ASCII (0x00-0x7F) is left as `None`
/// because the engine short-circuits codes < 0x80 before consulting tables.
#[rustfmt::skip]
static X00: [Option<&'static str>; 256] = [
    // 0x00-0x7F: plain ASCII, not present in the PHP table.
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    // 0x80
    E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,
    // 0x90
    E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,E,
    // 0xA0
    s!(" "),s!("!"),s!("C/"),s!("PS"),s!("$?"),s!("Y="),s!("|"),s!("SS"),s!("\""),s!("(C)"),s!("a"),s!("<<"),s!("!"),s!("-"),s!("(R)"),s!("-"),
    // 0xB0
    s!("deg"),s!("+-"),s!("2"),s!("3"),s!("'"),s!("m"),s!("P"),s!(":"),s!(","),s!("1"),s!("o"),s!(">>"),s!(" 1/4"),s!(" 1/2"),s!(" 3/4"),s!("?"),
    // 0xC0
    s!("A"),s!("A"),s!("A"),s!("A"),s!("A"),s!("A"),s!("AE"),s!("C"),s!("E"),s!("E"),s!("E"),s!("E"),s!("I"),s!("I"),s!("I"),s!("I"),
    // 0xD0
    s!("D"),s!("N"),s!("O"),s!("O"),s!("O"),s!("O"),s!("O"),s!("*"),s!("O"),s!("U"),s!("U"),s!("U"),s!("U"),s!("Y"),s!("TH"),s!("ss"),
    // 0xE0
    s!("a"),s!("a"),s!("a"),s!("a"),s!("a"),s!("a"),s!("ae"),s!("c"),s!("e"),s!("e"),s!("e"),s!("e"),s!("i"),s!("i"),s!("i"),s!("i"),
    // 0xF0
    s!("d"),s!("n"),s!("o"),s!("o"),s!("o"),s!("o"),s!("o"),s!("/"),s!("o"),s!("u"),s!("u"),s!("u"),s!("u"),s!("y"),s!("th"),s!("y"),
];

/// Bank 0x01 — Latin Extended-A and start of Latin Extended-B.
#[rustfmt::skip]
static X01: [Option<&'static str>; 256] = [
    // 0x00
    s!("A"),s!("a"),s!("A"),s!("a"),s!("A"),s!("a"),s!("C"),s!("c"),s!("C"),s!("c"),s!("C"),s!("c"),s!("C"),s!("c"),s!("D"),s!("d"),
    // 0x10
    s!("D"),s!("d"),s!("E"),s!("e"),s!("E"),s!("e"),s!("E"),s!("e"),s!("E"),s!("e"),s!("E"),s!("e"),s!("G"),s!("g"),s!("G"),s!("g"),
    // 0x20
    s!("G"),s!("g"),s!("G"),s!("g"),s!("H"),s!("h"),s!("H"),s!("h"),s!("I"),s!("i"),s!("I"),s!("i"),s!("I"),s!("i"),s!("I"),s!("i"),
    // 0x30
    s!("I"),s!("i"),s!("IJ"),s!("ij"),s!("J"),s!("j"),s!("K"),s!("k"),s!("q"),s!("L"),s!("l"),s!("L"),s!("l"),s!("L"),s!("l"),s!("L"),
    // 0x40
    s!("l"),s!("L"),s!("l"),s!("N"),s!("n"),s!("N"),s!("n"),s!("N"),s!("n"),s!("'n"),s!("N"),s!("n"),s!("O"),s!("o"),s!("O"),s!("o"),
    // 0x50
    s!("O"),s!("o"),s!("OE"),s!("oe"),s!("R"),s!("r"),s!("R"),s!("r"),s!("R"),s!("r"),s!("S"),s!("s"),s!("S"),s!("s"),s!("S"),s!("s"),
    // 0x60
    s!("S"),s!("s"),s!("T"),s!("t"),s!("T"),s!("t"),s!("T"),s!("t"),s!("U"),s!("u"),s!("U"),s!("u"),s!("U"),s!("u"),s!("U"),s!("u"),
    // 0x70
    s!("U"),s!("u"),s!("U"),s!("u"),s!("W"),s!("w"),s!("Y"),s!("y"),s!("Y"),s!("Z"),s!("z"),s!("Z"),s!("z"),s!("Z"),s!("z"),s!("s"),
    // 0x80
    s!("b"),s!("B"),s!("B"),s!("b"),s!("6"),s!("6"),s!("O"),s!("C"),s!("c"),s!("D"),s!("D"),s!("D"),s!("d"),s!("d"),s!("3"),s!("@"),
    // 0x90
    s!("E"),s!("F"),s!("f"),s!("G"),s!("G"),s!("hv"),s!("I"),s!("I"),s!("K"),s!("k"),s!("l"),s!("l"),s!("W"),s!("N"),s!("n"),s!("O"),
    // 0xA0
    s!("O"),s!("o"),s!("OI"),s!("oi"),s!("P"),s!("p"),s!("YR"),s!("2"),s!("2"),s!("SH"),s!("sh"),s!("t"),s!("T"),s!("t"),s!("T"),s!("U"),
    // 0xB0
    s!("u"),s!("Y"),s!("V"),s!("Y"),s!("y"),s!("Z"),s!("z"),s!("ZH"),s!("ZH"),s!("zh"),s!("zh"),s!("2"),s!("5"),s!("5"),s!("ts"),s!("w"),
    // 0xC0
    s!("|"),s!("||"),s!("|="),s!("!"),s!("DZ"),s!("Dz"),s!("dz"),s!("LJ"),s!("Lj"),s!("lj"),s!("NJ"),s!("Nj"),s!("nj"),s!("A"),s!("a"),s!("I"),
    // 0xD0
    s!("i"),s!("O"),s!("o"),s!("U"),s!("u"),s!("U"),s!("u"),s!("U"),s!("u"),s!("U"),s!("u"),s!("U"),s!("u"),s!("@"),s!("A"),s!("a"),
    // 0xE0
    s!("A"),s!("a"),s!("AE"),s!("ae"),s!("G"),s!("g"),s!("G"),s!("g"),s!("K"),s!("k"),s!("O"),s!("o"),s!("O"),s!("o"),s!("ZH"),s!("zh"),
    // 0xF0
    s!("j"),s!("DZ"),s!("Dz"),s!("dz"),s!("G"),s!("g"),s!("HV"),s!("W"),s!("N"),s!("n"),s!("A"),s!("a"),s!("AE"),s!("ae"),s!("O"),s!("o"),
];

/// Bank 0x02 — remainder of Latin Extended-B plus IPA Extensions. Only the
/// first half (0x00-0xBF) is needed to fully cover `removeDiacritics` range2
/// (codes < 0x0250); the rest is included up to 0xBF for completeness.
#[rustfmt::skip]
static X02: [Option<&'static str>; 256] = [
    // 0x00
    s!("A"),s!("a"),s!("A"),s!("a"),s!("E"),s!("e"),s!("E"),s!("e"),s!("I"),s!("i"),s!("I"),s!("i"),s!("O"),s!("o"),s!("O"),s!("o"),
    // 0x10
    s!("R"),s!("r"),s!("R"),s!("r"),s!("U"),s!("u"),s!("U"),s!("u"),s!("S"),s!("s"),s!("T"),s!("t"),s!("Y"),s!("y"),s!("H"),s!("h"),
    // 0x20
    s!("N"),s!("d"),s!("OU"),s!("ou"),s!("Z"),s!("z"),s!("A"),s!("a"),s!("E"),s!("e"),s!("O"),s!("o"),s!("O"),s!("o"),s!("O"),s!("o"),
    // 0x30
    s!("O"),s!("o"),s!("Y"),s!("y"),s!("l"),s!("n"),s!("t"),s!("j"),s!("db"),s!("qp"),s!("A"),s!("C"),s!("c"),s!("L"),s!("T"),s!("s"),
    // 0x40
    s!("z"),s!("?"),s!("?"),s!("B"),s!("U"),s!("V"),s!("E"),s!("e"),s!("J"),s!("j"),s!("Q"),s!("q"),s!("R"),s!("r"),s!("Y"),s!("y"),
    // 0x50
    s!("a"),s!("a"),s!("a"),s!("b"),s!("o"),s!("c"),s!("d"),s!("d"),s!("e"),s!("@"),s!("@"),s!("e"),s!("e"),s!("e"),s!("e"),s!("j"),
    // 0x60
    s!("g"),s!("g"),s!("G"),s!("g"),s!("u"),s!("Y"),s!("h"),s!("h"),s!("i"),s!("i"),s!("I"),s!("l"),s!("l"),s!("l"),s!("lZ"),s!("W"),
    // 0x70
    s!("W"),s!("m"),s!("n"),s!("n"),s!("N"),s!("o"),s!("OE"),s!("O"),s!("F"),s!("R"),s!("R"),s!("R"),s!("r"),s!("r"),s!("r"),s!("R"),
    // 0x80
    s!("R"),s!("R"),s!("s"),s!("S"),s!("j"),s!("S"),s!("S"),s!("t"),s!("t"),s!("u"),s!("U"),s!("v"),s!("^"),s!("W"),s!("Y"),s!("Y"),
    // 0x90
    s!("z"),s!("z"),s!("Z"),s!("Z"),s!("?"),s!("?"),s!("?"),s!("C"),s!("@"),s!("B"),s!("E"),s!("G"),s!("H"),s!("j"),s!("k"),s!("L"),
    // 0xA0
    s!("q"),s!("?"),s!("?"),s!("dz"),s!("dZ"),s!("dz"),s!("ts"),s!("tS"),s!("tC"),s!("fN"),s!("ls"),s!("lz"),s!("WW"),s!("]]"),s!("h"),s!("h"),
    // 0xB0 (Drupal continues; we stop the table here, rest = no mapping)
    s!("k"),s!("h"),s!("j"),s!("r"),s!("r"),s!("r"),s!("r"),s!("w"),s!("y"),s!("'"),s!("\""),s!("`"),s!("'"),s!("`"),s!("`"),s!("'"),
    // 0xC0-0xFF: not bundled
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
    N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
];
