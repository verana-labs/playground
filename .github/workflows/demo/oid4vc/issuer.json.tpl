{
  "issuer": {
    "id": "demo",
    "displayName": "__SERVICE_NAME__",
    "metadataSigner": "did",
    "signing": {
      "development": {
        "enabled": true,
        "commonName": "__SERVICE_NAME__"
      }
    }
  },
  "credentialConfigurations": [
    {
      "id": "demo-credential",
      "format": "dc+sd-jwt",
      "vct": "https://demo-issuer-accredited.playground.__NETWORK__.verana.network/oid4vc/vct/demo-credential",
      "name": "DemoCredential",
      "description": "The DemoCredential of the Playground Ecosystem (demo)",
      "vtjscId": "https://playground-demo.playground.__NETWORK__.verana.network/vt/schemas-demo-credential-jsc.json",
      "claims": ["name", "demoId"],
      "disclosureFrame": ["name", "demoId"],
      "ttlSeconds": 2592000
    }
  ],
  "verifierPolicies": []
}
