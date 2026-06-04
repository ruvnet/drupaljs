/**
 * Help text for the dblog module.
 *
 * Ports the markup returned by `DblogHooks::help()` for the two routes the
 * module handles. Kept in its own module so the hook file stays small.
 */

/**
 * Returns the help markup for a route name, or null when dblog has none.
 */
export function dblogHelpText(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.dblog': {
      let output = '';
      output += '<h2>About</h2>';
      output +=
        '<p>The Database Logging module logs system events in the Drupal database. ' +
        'For more information, see the online documentation for the Database Logging module.</p>';
      output += '<h2>Uses</h2>';
      output += '<dl>';
      output += '<dt>Monitoring your site</dt>';
      output +=
        '<dd>The Database Logging module allows you to view an event log on the ' +
        'Recent log messages page. The log is a chronological list of recorded events ' +
        'containing usage data, performance data, errors, warnings and operational ' +
        'information.</dd>';
      output += '<dt>Debugging site problems</dt>';
      output +=
        '<dd>In case of errors or problems with the site, the Recent log messages page ' +
        'can be useful for debugging, since it shows the sequence of events.</dd>';
      output += '<dt>This log is not persistent</dt>';
      output +=
        '<dd>The Database Logging module logs may be cleared by administrators and ' +
        'automated cron tasks, so they should not be used for forensic logging.</dd>';
      output += '</dl>';
      return output;
    }
    case 'dblog.overview':
      return (
        '<p>The Database Logging module logs system events in the Drupal database. ' +
        'Monitor your site or debug site problems on this page.</p>'
      );
    default:
      return null;
  }
}
