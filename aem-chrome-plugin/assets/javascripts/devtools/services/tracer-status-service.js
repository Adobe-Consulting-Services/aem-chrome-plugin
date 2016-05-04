angular.module('aem-chrome-plugin-app')
/**
 * Angular Service responsible for collecting and exposing the Sling Tracer OSGi Status and Config
 **/
.factory('TracerStatusService', [ function() {
  var DEFAULT_STATUS = {
        valid: false,
        bundle: {
          exists: {
            valid: false,
            value: false
          },
          active: {
              valid: false,
              value: false
            },
          version: {
              valid: false,
              value: '0.0.0'
            }
        },
        config: {
          tracerSets: {
              valid: false,
              value: []
            },
          enabled: {
              valid: false,
              value: false,
            },
          servletEnabled: {
              valid: false,
              value: false,
            }
          }
      },
      status = DEFAULT_STATUS;

  function isValidVersion() {
    var version = '0.0.0',
        dashIndex = -1,
        versions = [];

    version = status.bundle.version.value || version;
    dashIndex = version.indexOf('-');

    if (dashIndex > 0) {
      version = version.substring(0, dashIndex);
    }

    versions = version.split('.');

    if (versions.length > 0 && versions[0] >= 1) { return true; }

    return false;
  }

  /* Service Object */
  return {
    getStatus: function() {
      return status;
    },
    setStatus: function(newStatus) {
      newStatus = newStatus || {};

      status.bundle.exists.value = newStatus.bundleVersion ? true : false;
      status.bundle.exists.valid = status.bundle.exists.value;

      status.bundle.active.value = newStatus.bundleActive;
      status.bundle.active.valid = status.bundle.active.value === true;

      status.bundle.version.value = newStatus.bundleVersion;
      status.bundle.version.valid = isValidVersion(status.bundle.version.value);

      status.config.enabled.value = newStatus.configEnabled;
      status.config.enabled.valid = status.config.enabled.value === true;

      status.config.servletEnabled.value = newStatus.configServletEnabled;
      status.config.servletEnabled.valid = status.config.servletEnabled.value === true;

      status.config.tracerSets.value = newStatus.configTracerSets;
      status.config.tracerSets.valid = status.config.tracerSets.value;

      // Compute overall status
      status.valid =
          status.bundle.exists.value &&
          status.bundle.active.valid &&
          status.bundle.version.valid &&
          status.config.enabled.valid &&
          status.config.servletEnabled.valid &&
          status.config.tracerSets.valid;

      return status;
    }
  };
}]);
