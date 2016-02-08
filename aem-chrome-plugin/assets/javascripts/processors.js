var processors = {};

/** Request Progress **/
processors['requestProgress'] = function(entry) {
  if (entry.match(/^[0-9]+\s[A-Z_]+(\s|{)/)) {
    return entry;
  } else {
    return null;
  }
};

/** Normal Logs **/
processors['logs'] = function(entry) {
  if (entry.match(/^[0-9]+\s[A-Z_]+(\s|{)/)) {
    return null;
  } else {
    return entry;
  }
};
