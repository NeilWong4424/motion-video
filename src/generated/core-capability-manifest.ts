import type {CapabilityManifestEntry} from '../engine/capability/types.js';

export const coreCapabilityManifest = [
  {"kind":"effect","id":"path.connector-draw","version":"1.0.0","implementationHash":"6ea1264f11410ce7e805a77e248f042354f06bcd06b323f1909035767f801702","scope":"core","supportedNodeKinds":["path"],"ownedChannels":["path"],"family":"path"},
  {"kind":"effect","id":"path.path-draw","version":"1.0.0","implementationHash":"0974032264818db77d86cbe5f23dfe039582cebe037e15a94ccd2ccc284b0e1d","scope":"core","supportedNodeKinds":["path"],"ownedChannels":["path"],"family":"path"},
  {"kind":"effect","id":"shape.geometry-morph","version":"1.0.0","implementationHash":"aaba47734098cb86b5a676c03dbf3728773762936ce4b1955397d9779299c96e","scope":"core","supportedNodeKinds":["shape"],"ownedChannels":["geometry"],"family":"shape"},
  {"kind":"effect","id":"shape.shape-reveal","version":"1.0.0","implementationHash":"c9bd580f714b2547faf4e9955488823f9d348335125b0c432e1fc501682ddc4a","scope":"core","supportedNodeKinds":["shape"],"ownedChannels":["geometry","opacity"],"family":"shape"},
  {"kind":"effect","id":"text.highlight-sweep","version":"1.0.0","implementationHash":"43c1e60c67c1604d4e39138a9de569f2f39ab1a297138d6aaaee2c86c30766cf","scope":"core","supportedNodeKinds":["text"],"ownedChannels":["filter"],"family":"text"},
  {"kind":"effect","id":"text.line-reveal","version":"1.0.0","implementationHash":"ecf34ff601cb94ec2de1b1f54da2f8d7cf0ddba65afcaf578bd62b360588cf1b","scope":"core","supportedNodeKinds":["text"],"ownedChannels":["geometry"],"family":"text"},
  {"kind":"effect","id":"text.mask-rise","version":"1.0.0","implementationHash":"c3bbaada77cec327450bb1dcd305ae9071e5bcb93e648c683a011b9b680d8012","scope":"core","supportedNodeKinds":["text"],"ownedChannels":["geometry","opacity"],"family":"text"},
  {"kind":"effect","id":"text.tracking-resolve","version":"1.0.0","implementationHash":"5a0e0360ba48d86c63a4aa2dbb27df7563da3a3ca16dc1529e762981c08372e2","scope":"core","supportedNodeKinds":["text"],"ownedChannels":["style"],"family":"text"},
  {"kind":"effect","id":"text.word-replace","version":"1.0.0","implementationHash":"834e81cac757d1c637aea08e58c0d19f956555b76858cf8769e6dd2b588374c1","scope":"core","supportedNodeKinds":["text"],"ownedChannels":["content"],"family":"text"},
  {"kind":"effect","id":"text.word-stagger","version":"1.0.0","implementationHash":"571d4ee21a0f8eb6039323ef7e96990ef4ab077a748bdd331857818662afb217","scope":"core","supportedNodeKinds":["text"],"ownedChannels":["opacity"],"family":"text"},
  {"kind":"renderer","id":"base.group","version":"1.0.0","implementationHash":"4e33a2c952ac860e5669f46d7977cf5c729008f3e4c397fc702be0c57a6f48d8","scope":"core","supportedNodeKinds":["group","ui","chart","logo"]},
  {"kind":"renderer","id":"base.image","version":"1.0.0","implementationHash":"5bd05b5865d08991767b7eca6d7a7cd7df9a1dea7a8d90eba850347fe8a53d20","scope":"core","supportedNodeKinds":["image","logo"]},
  {"kind":"renderer","id":"base.path","version":"1.0.0","implementationHash":"ad349a6cb3888f71b15107216c25718aed086aa73006bf6f9e08f96f3304aa31","scope":"core","supportedNodeKinds":["path"]},
  {"kind":"renderer","id":"base.shape","version":"1.0.0","implementationHash":"c49e5901bf9f331a181b5341e6503788109c53475822f00acf8ba899511845d7","scope":"core","supportedNodeKinds":["shape"]},
  {"kind":"renderer","id":"base.text","version":"1.0.0","implementationHash":"9429cf1ac4e1303752b296de65f9919ad11907896eb73c3288480a10346b2179","scope":"core","supportedNodeKinds":["text"]},
] satisfies readonly CapabilityManifestEntry[];
