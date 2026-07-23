import type {CapabilityManifestEntry} from '../engine/capability/types.js';

export const coreCapabilityManifest = [
  {"kind":"renderer","id":"base.group","version":"1.0.0","implementationHash":"4e33a2c952ac860e5669f46d7977cf5c729008f3e4c397fc702be0c57a6f48d8","scope":"core","supportedNodeKinds":["group","ui","chart","logo"]},
  {"kind":"renderer","id":"base.path","version":"1.0.0","implementationHash":"ad349a6cb3888f71b15107216c25718aed086aa73006bf6f9e08f96f3304aa31","scope":"core","supportedNodeKinds":["path"]},
  {"kind":"renderer","id":"base.shape","version":"1.0.0","implementationHash":"c49e5901bf9f331a181b5341e6503788109c53475822f00acf8ba899511845d7","scope":"core","supportedNodeKinds":["shape"]},
  {"kind":"renderer","id":"base.text","version":"1.0.0","implementationHash":"9429cf1ac4e1303752b296de65f9919ad11907896eb73c3288480a10346b2179","scope":"core","supportedNodeKinds":["text"]},
] satisfies readonly CapabilityManifestEntry[];
