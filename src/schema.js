// Schema for mender.conf / mender-connect.conf, sourced from
// docs.mender.io/client-installation/configuration and the mender /
// mender-connect source (config struct + Validate()).
//
// path: nested JSON key segments. type: string|integer|boolean|string[]|serverArray|any
// format: url|path|device-path|pkcs11|path-or-pkcs11|enum|octal|range

export const FIELDS = [
  // mender.conf
  { file: 'mender', path: ['ServerURL'], type: 'string', format: 'url', mandatoryGroup: 'server',
    description: 'Base URL of the Mender server device API endpoint.' },
  { file: 'mender', path: ['Servers'], type: 'serverArray', mandatoryGroup: 'server',
    description: 'List of {"ServerURL": "..."} objects, alternative to ServerURL for failover.' },
  { file: 'mender', path: ['ServerCertificate'], type: 'string', format: 'path',
    description: 'Absolute path to a trusted server certificate (PEM) used to verify the server.' },
  { file: 'mender', path: ['TenantToken'], type: 'string', plans: ['hosted', 'enterprise'],
    description: 'Multi-tenancy auth token. Required for Hosted Mender; not applicable to Open Source (no multi-tenancy).' },

  { file: 'mender', path: ['UpdatePollIntervalSeconds'], type: 'integer', default: 1800,
    description: 'How often the client checks for a new deployment.' },
  { file: 'mender', path: ['InventoryPollIntervalSeconds'], type: 'integer', default: 28800,
    description: 'How often the client submits inventory data to the server.' },
  { file: 'mender', path: ['RetryPollIntervalSeconds'], type: 'integer', default: 300,
    description: 'Wait time before retrying a failed server request (minimum recommended: 60).' },
  { file: 'mender', path: ['RetryPollCount'], type: 'integer',
    description: 'Number of retry attempts. If unset, computed automatically from RetryPollIntervalSeconds.' },

  { file: 'mender', path: ['UpdateControlMapExpirationTimeSeconds'], type: 'integer', deprecated: true,
    description: 'Deprecated/unsupported since Client v4.0. Default: 2 x UpdatePollIntervalSeconds.' },
  { file: 'mender', path: ['UpdateControlMapBootExpirationTimeSeconds'], type: 'integer', default: 600, deprecated: true,
    description: 'Deprecated/unsupported since Client v4.0.' },
  { file: 'mender', path: ['UpdateControlMapPollIntervalSeconds'], type: 'integer', deprecated: true,
    description: 'Deprecated/unsupported since Client v4.0. Default: same as UpdatePollIntervalSeconds.' },

  { file: 'mender', path: ['ArtifactVerifyKey'], type: 'string', format: 'path', exclusiveGroup: 'artifactVerify',
    description: 'Absolute path to a single public key used to verify Artifact signatures.' },
  { file: 'mender', path: ['ArtifactVerifyKeys'], type: 'string[]', exclusiveGroup: 'artifactVerify',
    description: 'List of absolute paths to public keys, any of which can verify an Artifact.' },
  { file: 'mender', path: ['RootfsPartA'], type: 'string', format: 'device-path',
    description: 'Device path of rootfs partition A (e.g. /dev/mmcblk0p2).' },
  { file: 'mender', path: ['RootfsPartB'], type: 'string', format: 'device-path',
    description: 'Device path of rootfs partition B (e.g. /dev/mmcblk0p3).' },
  { file: 'mender', path: ['DeviceTypeFile'], type: 'string', format: 'path', default: '/var/lib/mender/device_type',
    description: "Path to the file holding this device's device type identifier." },
  { file: 'mender', path: ['UpdateLogPath'], type: 'string', format: 'path',
    description: 'Absolute path where update module execution logs are stored.' },
  { file: 'mender', path: ['BootUtilitiesGetNextActivePart'], type: 'string', deprecated: true,
    description: 'Deprecated since Client v4.0.' },
  { file: 'mender', path: ['BootUtilitiesSetActivePart'], type: 'string', deprecated: true,
    description: 'Deprecated since Client v4.0.' },

  { file: 'mender', path: ['HttpsClient', 'Certificate'], type: 'string', format: 'path',
    description: 'Absolute path to client certificate (PEM) for mutual TLS with the server.' },
  { file: 'mender', path: ['HttpsClient', 'Key'], type: 'string', format: 'path-or-pkcs11',
    description: 'Absolute path or PKCS#11 URI to the client TLS private key.' },
  { file: 'mender', path: ['HttpsClient', 'SSLEngine'], type: 'string', deprecated: true,
    description: 'OpenSSL engine id. Deprecated on OpenSSL 3.0+ (use PKCS#11 URIs instead).' },

  { file: 'mender', path: ['Security', 'AuthPrivateKey'], type: 'string', format: 'path-or-pkcs11',
    description: 'Absolute path or PKCS#11 URI to the device identity private key.' },
  { file: 'mender', path: ['Security', 'SSLEngine'], type: 'string', deprecated: true,
    description: 'OpenSSL engine id. Deprecated on OpenSSL 3.0+ (use PKCS#11 URIs instead).' },

  { file: 'mender', path: ['Connectivity', 'DeviceTier'], type: 'string', format: 'enum', enum: ['standard', 'system', 'micro'], default: 'standard',
    description: 'Device performance tier, affects connection handling strategy.' },
  { file: 'mender', path: ['Connectivity', 'DisableKeepAlive'], type: 'boolean', default: false, deprecated: true,
    description: 'Deprecated/unsupported since Client v4.0.' },
  { file: 'mender', path: ['Connectivity', 'IdleConnTimeoutSeconds'], type: 'integer', default: 30, deprecated: true,
    description: 'Deprecated/unsupported since Client v4.0.' },

  { file: 'mender', path: ['StateScriptTimeoutSeconds'], type: 'integer', default: 3600,
    description: 'Max time a single state script is allowed to run.' },
  { file: 'mender', path: ['StateScriptRetryTimeoutSeconds'], type: 'integer', default: 1800,
    description: 'Max total time spent retrying a failing state script.' },
  { file: 'mender', path: ['StateScriptRetryIntervalSeconds'], type: 'integer', default: 60,
    description: 'Wait time between state script retries.' },

  { file: 'mender', path: ['ModuleTimeoutSeconds'], type: 'integer', default: 14400,
    description: 'Max time an update module is allowed to run.' },
  { file: 'mender', path: ['RetryDownloadCount'], type: 'integer', format: 'range', min: 1, max: 10000, default: 10,
    description: 'Number of times to retry a failed Artifact download.' },

  { file: 'mender', path: ['DaemonLogLevel'], type: 'string', format: 'enum', enum: ['debug', 'info', 'warning', 'error'],
    description: 'Log level for the mender daemon. Overridden by the --log-level CLI flag.' },

  // mender-connect.conf
  { file: 'connect', path: ['ReconnectIntervalSeconds'], type: 'integer', default: 5,
    description: 'Wait time before reconnecting to the server after a lost connection.' },
  { file: 'connect', path: ['ShellCommand'], type: 'string', format: 'path', default: '/bin/sh',
    description: 'Absolute path to the shell binary used for remote terminal sessions (must be listed in /etc/shells).' },
  { file: 'connect', path: ['ShellArguments'], type: 'string[]', default: ['--login'],
    description: 'Arguments passed to ShellCommand when starting a session.' },
  { file: 'connect', path: ['User'], type: 'string', default: '',
    description: 'System user the remote shell session runs as.' },

  { file: 'connect', path: ['Terminal', 'Disable'], type: 'boolean', default: false, description: 'Disable the remote terminal feature.' },
  { file: 'connect', path: ['Terminal', 'Height'], type: 'integer', default: 40, description: 'Default terminal height in rows.' },
  { file: 'connect', path: ['Terminal', 'Width'], type: 'integer', default: 80, description: 'Default terminal width in columns.' },

  { file: 'connect', path: ['Sessions', 'MaxPerUser'], type: 'integer', default: 1, description: 'Max concurrent sessions per user.' },
  { file: 'connect', path: ['Sessions', 'StopExpired'], type: 'boolean', default: false, description: 'Stop sessions once expired.' },
  { file: 'connect', path: ['Sessions', 'ExpireAfter'], type: 'integer', default: 0, exclusiveGroup: 'sessionExpire',
    description: 'Seconds after session start until it expires (0 = never). Mutually exclusive with ExpireAfterIdle.' },
  { file: 'connect', path: ['Sessions', 'ExpireAfterIdle'], type: 'integer', default: 0, exclusiveGroup: 'sessionExpire',
    description: 'Seconds of inactivity until a session expires (0 = never). Mutually exclusive with ExpireAfter.' },

  { file: 'connect', path: ['FileTransfer', 'Disable'], type: 'boolean', default: false, description: 'Disable the file transfer feature.' },
  { file: 'connect', path: ['PortForward', 'Disable'], type: 'boolean', default: false, description: 'Disable the port forwarding feature.' },
  { file: 'connect', path: ['MenderClient', 'Disable'], type: 'boolean', default: false, description: 'Disable the local mender-client control feature.' },

  { file: 'connect', path: ['Limits', 'Enabled'], type: 'boolean', default: true, description: 'Enable enforcement of the Limits.* settings.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'Chroot'], type: 'string', format: 'path', default: '/var/lib/mender/filetransfer',
    description: 'Root directory file transfers are confined to.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'OwnerGet'], type: 'string[]', default: ['mender', 'root'],
    description: 'Usernames allowed to download files (empty = all allowed).' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'GroupGet'], type: 'string[]', default: ['games', 'users'],
    description: 'Group names allowed to download files (empty = all allowed).' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'OwnerPut'], type: 'string', default: 'root',
    description: 'Username assigned as owner of uploaded files.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'GroupPut'], type: 'string', default: 'mender',
    description: 'Group name assigned to uploaded files.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'MaxFileSize'], type: 'integer', default: 4,
    description: 'Max file size in MB for transfers (0 = unlimited).' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'FollowSymLinks'], type: 'boolean', default: true, description: 'Follow symlinks during file transfer.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'AllowOverwrite'], type: 'boolean', default: true, description: 'Allow overwriting existing files.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'RegularFilesOnly'], type: 'boolean', default: true, description: 'Only allow transferring regular files.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'PreserveOwner'], type: 'boolean', default: true, description: 'Preserve file owner on upload.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'PreserveGroup'], type: 'boolean', default: true, description: 'Preserve file group on upload.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'PreserveMode'], type: 'boolean', default: true, description: 'Preserve file permission mode on upload.' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'Umask'], type: 'string', format: 'octal', default: '',
    description: 'Octal permission mask applied to uploaded files, e.g. "600".' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'Counters', 'MaxBytesTxPerMinute'], type: 'integer', default: 1048576,
    description: 'Max bytes/minute sent to the device (0 = unlimited).' },
  { file: 'connect', path: ['Limits', 'FileTransfer', 'Counters', 'MaxBytesRxPerMinute'], type: 'integer', default: 1048576,
    description: 'Max bytes/minute received from the device (0 = unlimited).' },

  // legacy keys mender-connect still recognizes but warns on
  { file: 'connect', path: ['ServerURL'], type: 'any', deprecated: true, description: 'Deprecated here — configure in mender.conf instead.' },
  { file: 'connect', path: ['Servers'], type: 'any', deprecated: true, description: 'Deprecated here — configure in mender.conf instead.' },
  { file: 'connect', path: ['ClientProtocol'], type: 'any', deprecated: true, description: 'Deprecated, no longer used.' },
  { file: 'connect', path: ['HTTPSClient'], type: 'any', deprecated: true, description: 'Deprecated here — configure HttpsClient in mender.conf instead.' },
  { file: 'connect', path: ['SkipVerify'], type: 'any', deprecated: true, description: 'Deprecated, no longer used.' },
  { file: 'connect', path: ['ServerCertificate'], type: 'any', deprecated: true, description: 'Deprecated here — configure in mender.conf instead.' },
];

FIELDS.forEach(f => { f.pathStr = f.path.join('.'); });

export const EXAMPLES = {
  mender: JSON.stringify({
    InventoryPollIntervalSeconds: 28800,
    RetryPollIntervalSeconds: 300,
    ServerURL: 'https://hosted.mender.io/',
    TenantToken: 'Paste your Mender Professional token here',
    UpdatePollIntervalSeconds: 1800,
  }, null, 2) + '\n',
  connect: '{\n}\n',
};

// `plan` narrows the result to fields applicable to that deployment type
// (see plans.js). Omit it to get the full schema for the file, regardless
// of plan — used for structural checks like unknown-key detection.
export function fieldsFor(file, plan) {
  return FIELDS.filter(f => f.file === file && (!plan || !f.plans || f.plans.includes(plan)));
}
