import {Config} from '@remotion/cli/config';

// Deterministic, local-only render configuration. No API key, license key, or
// public-license key is configured here: eligibility under the bundled Remotion
// license is an operator precondition, not a repository secret-handling feature.
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setOverwriteOutput(false);
