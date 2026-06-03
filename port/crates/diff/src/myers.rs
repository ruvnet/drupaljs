//! Myers O(ND) line/sequence diff producing an edit script.
//!
//! Mirrors the semantics of Drupal's `Drupal\Component\Diff` engine: given two
//! sequences of lines, compute the shortest edit script as a list of
//! [`EditOp`]s. Each op is one of `Equal`, `Insert`, `Delete` and carries the
//! affected lines. Reconstructing `b` from `a` by replaying the ops yields the
//! original `b`; replaying only `Equal`/`Delete` (dropping `Insert`) yields `a`.
//!
//! The core is the linear-space-free O(ND) algorithm from Eugene W. Myers,
//! "An O(ND) Difference Algorithm and Its Variations" (1986), with backtracking
//! over recorded V-frontiers to emit the operations.

/// A single operation in a diff edit script over line sequences.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EditOp {
    /// Lines present unchanged in both sequences.
    Equal(Vec<String>),
    /// Lines inserted (present only in the new sequence `b`).
    Insert(Vec<String>),
    /// Lines deleted (present only in the old sequence `a`).
    Delete(Vec<String>),
}

impl EditOp {
    /// The kind tag, useful for stable serialization across the WASM boundary.
    pub fn kind(&self) -> &'static str {
        match self {
            EditOp::Equal(_) => "equal",
            EditOp::Insert(_) => "insert",
            EditOp::Delete(_) => "delete",
        }
    }

    /// The lines carried by this op.
    pub fn lines(&self) -> &[String] {
        match self {
            EditOp::Equal(l) | EditOp::Insert(l) | EditOp::Delete(l) => l,
        }
    }
}

/// Low-level single-step edit, before runs are coalesced into [`EditOp`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Step {
    Equal,
    Insert,
    Delete,
}

/// Compute the Myers shortest edit script between line sequences `a` and `b`.
///
/// Returns a coalesced edit script: consecutive single-line steps of the same
/// kind are merged into a single [`EditOp`] holding the run of lines.
pub fn diff_lines<S: AsRef<str>>(a: &[S], b: &[S]) -> Vec<EditOp> {
    let a: Vec<&str> = a.iter().map(|s| s.as_ref()).collect();
    let b: Vec<&str> = b.iter().map(|s| s.as_ref()).collect();
    let steps = myers_steps(&a, &b);
    coalesce(&a, &b, &steps)
}

/// Produce the per-element step sequence using the O(ND) algorithm with
/// frontier recording + backtrack. Steps are returned in forward order.
fn myers_steps(a: &[&str], b: &[&str]) -> Vec<Step> {
    let n = a.len() as isize;
    let m = b.len() as isize;

    // Trivial cases keep the hot path simple and avoid index juggling.
    if n == 0 && m == 0 {
        return Vec::new();
    }
    if n == 0 {
        return vec![Step::Insert; m as usize];
    }
    if m == 0 {
        return vec![Step::Delete; n as usize];
    }

    let max = (n + m) as usize;
    let offset = max as isize; // shift so diagonal k in [-max,max] maps to [0,2*max]
    let vsize = 2 * max + 1;

    // v[k] = furthest x reached on diagonal k. Record a snapshot per d for
    // backtracking. This is the O(ND) time / O(D^2) space trace variant.
    let mut v = vec![0isize; vsize];
    let mut trace: Vec<Vec<isize>> = Vec::new();

    let mut d_final = 0usize;
    'outer: for d in 0..=max as isize {
        trace.push(v.clone());
        let mut k = -d;
        while k <= d {
            // Decide whether we arrived by a down move (insert) or right (delete).
            let idx = (k + offset) as usize;
            let down = k == -d
                || (k != d && v[(k - 1 + offset) as usize] < v[(k + 1 + offset) as usize]);
            let mut x = if down {
                v[(k + 1 + offset) as usize] // insert: x unchanged, y increments
            } else {
                v[(k - 1 + offset) as usize] + 1 // delete: x increments
            };
            let mut y = x - k;

            // Follow the diagonal (snake) of equal elements.
            while x < n && y < m && a[x as usize] == b[y as usize] {
                x += 1;
                y += 1;
            }
            v[idx] = x;

            if x >= n && y >= m {
                d_final = d as usize;
                break 'outer;
            }
            k += 2;
        }
    }

    backtrack(a, b, &trace, offset, d_final)
}

/// Walk the recorded frontiers backward to recover the forward step list.
fn backtrack(
    a: &[&str],
    b: &[&str],
    trace: &[Vec<isize>],
    offset: isize,
    d_final: usize,
) -> Vec<Step> {
    let mut steps_rev: Vec<Step> = Vec::new();
    let mut x = a.len() as isize;
    let mut y = b.len() as isize;

    for d in (0..=d_final).rev() {
        let v = &trace[d];
        let k = x - y;
        let down = k == -(d as isize)
            || (k != d as isize
                && v[(k - 1 + offset) as usize] < v[(k + 1 + offset) as usize]);
        let prev_k = if down { k + 1 } else { k - 1 };
        let prev_x = v[(prev_k + offset) as usize];
        let prev_y = prev_x - prev_k;

        // Equal moves along the snake before the d-th edit.
        while x > prev_x && y > prev_y {
            steps_rev.push(Step::Equal);
            x -= 1;
            y -= 1;
        }

        if d > 0 {
            if down {
                steps_rev.push(Step::Insert);
                y -= 1;
            } else {
                steps_rev.push(Step::Delete);
                x -= 1;
            }
        }
    }

    let _ = (a, b); // bounds already enforced by the algorithm
    steps_rev.reverse();
    steps_rev
}

/// Merge consecutive same-kind steps into runs, attaching the source lines.
fn coalesce(a: &[&str], b: &[&str], steps: &[Step]) -> Vec<EditOp> {
    let mut ops: Vec<EditOp> = Vec::new();
    let mut ai = 0usize; // cursor into a
    let mut bi = 0usize; // cursor into b

    for &step in steps {
        match step {
            Step::Equal => {
                let line = a[ai].to_string();
                ai += 1;
                bi += 1;
                push_run(&mut ops, Step::Equal, line);
            }
            Step::Delete => {
                let line = a[ai].to_string();
                ai += 1;
                push_run(&mut ops, Step::Delete, line);
            }
            Step::Insert => {
                let line = b[bi].to_string();
                bi += 1;
                push_run(&mut ops, Step::Insert, line);
            }
        }
    }
    ops
}

/// Append `line` to the trailing op if it matches `step`, else start a new op.
fn push_run(ops: &mut Vec<EditOp>, step: Step, line: String) {
    match (step, ops.last_mut()) {
        (Step::Equal, Some(EditOp::Equal(v))) => v.push(line),
        (Step::Insert, Some(EditOp::Insert(v))) => v.push(line),
        (Step::Delete, Some(EditOp::Delete(v))) => v.push(line),
        (Step::Equal, _) => ops.push(EditOp::Equal(vec![line])),
        (Step::Insert, _) => ops.push(EditOp::Insert(vec![line])),
        (Step::Delete, _) => ops.push(EditOp::Delete(vec![line])),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lines(s: &[&str]) -> Vec<String> {
        s.iter().map(|x| x.to_string()).collect()
    }

    /// Replay ops to reconstruct `b` (equal + insert) and `a` (equal + delete).
    fn reconstruct(ops: &[EditOp]) -> (Vec<String>, Vec<String>) {
        let mut a = Vec::new();
        let mut b = Vec::new();
        for op in ops {
            match op {
                EditOp::Equal(l) => {
                    a.extend(l.iter().cloned());
                    b.extend(l.iter().cloned());
                }
                EditOp::Delete(l) => a.extend(l.iter().cloned()),
                EditOp::Insert(l) => b.extend(l.iter().cloned()),
            }
        }
        (a, b)
    }

    #[test]
    fn both_empty_is_empty_script() {
        let a: Vec<&str> = vec![];
        let b: Vec<&str> = vec![];
        assert_eq!(diff_lines(&a, &b), Vec::<EditOp>::new());
    }

    #[test]
    fn identical_sequences_are_all_equal() {
        let a = ["a", "b", "c"];
        let ops = diff_lines(&a, &a);
        assert_eq!(ops, vec![EditOp::Equal(lines(&["a", "b", "c"]))]);
    }

    #[test]
    fn all_inserts_when_a_empty() {
        let a: Vec<&str> = vec![];
        let b = ["x", "y"];
        assert_eq!(diff_lines(&a, &b), vec![EditOp::Insert(lines(&["x", "y"]))]);
    }

    #[test]
    fn all_deletes_when_b_empty() {
        let a = ["x", "y"];
        let b: Vec<&str> = vec![];
        assert_eq!(diff_lines(&a, &b), vec![EditOp::Delete(lines(&["x", "y"]))]);
    }

    #[test]
    fn single_insertion_in_middle() {
        let a = ["a", "c"];
        let b = ["a", "b", "c"];
        let ops = diff_lines(&a, &b);
        assert_eq!(
            ops,
            vec![
                EditOp::Equal(lines(&["a"])),
                EditOp::Insert(lines(&["b"])),
                EditOp::Equal(lines(&["c"])),
            ]
        );
    }

    #[test]
    fn single_deletion_in_middle() {
        let a = ["a", "b", "c"];
        let b = ["a", "c"];
        let ops = diff_lines(&a, &b);
        assert_eq!(
            ops,
            vec![
                EditOp::Equal(lines(&["a"])),
                EditOp::Delete(lines(&["b"])),
                EditOp::Equal(lines(&["c"])),
            ]
        );
    }

    #[test]
    fn replacement_is_delete_then_insert() {
        let a = ["a", "b", "c"];
        let b = ["a", "x", "c"];
        let ops = diff_lines(&a, &b);
        let (ra, rb) = reconstruct(&ops);
        assert_eq!(ra, lines(&a));
        assert_eq!(rb, lines(&b));
        // The middle differs: must contain both a delete of "b" and insert of "x".
        assert!(ops.iter().any(|o| matches!(o, EditOp::Delete(l) if l == &lines(&["b"]))));
        assert!(ops.iter().any(|o| matches!(o, EditOp::Insert(l) if l == &lines(&["x"]))));
    }

    #[test]
    fn classic_abcabba_cbabac() {
        // The canonical Myers example. SES length must be 5 edits.
        let a = ["a", "b", "c", "a", "b", "b", "a"];
        let b = ["c", "b", "a", "b", "a", "c"];
        let ops = diff_lines(&a, &b);
        let (ra, rb) = reconstruct(&ops);
        assert_eq!(ra, lines(&a));
        assert_eq!(rb, lines(&b));
        let edits: usize = ops
            .iter()
            .filter(|o| !matches!(o, EditOp::Equal(_)))
            .map(|o| o.lines().len())
            .sum();
        assert_eq!(edits, 5, "shortest edit script should be 5 ops");
    }

    #[test]
    fn coalesces_adjacent_runs() {
        let a = ["keep", "old1", "old2", "tail"];
        let b = ["keep", "new1", "new2", "new3", "tail"];
        let ops = diff_lines(&a, &b);
        // Adjacent deletes coalesce into one op, adjacent inserts into one op.
        assert!(ops
            .iter()
            .any(|o| matches!(o, EditOp::Delete(l) if l.len() == 2)));
        assert!(ops
            .iter()
            .any(|o| matches!(o, EditOp::Insert(l) if l.len() == 3)));
        let (ra, rb) = reconstruct(&ops);
        assert_eq!(ra, lines(&a));
        assert_eq!(rb, lines(&b));
    }

    #[test]
    fn reconstruction_holds_for_prefix_and_suffix_overlap() {
        let a = ["1", "2", "3", "4", "5"];
        let b = ["1", "9", "3", "4", "8", "5"];
        let ops = diff_lines(&a, &b);
        let (ra, rb) = reconstruct(&ops);
        assert_eq!(ra, lines(&a));
        assert_eq!(rb, lines(&b));
    }
}
